"""
NBA Ingestion Pipeline

End-to-end pipeline for ingesting, normalizing, and persisting NBA proposition
betting data from external providers. Handles change detection, error recovery,
and comprehensive observability.
"""

import logging
import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy import select, update

from ..models.database_models import Player, Prop, MarketQuote, IngestRun
from ..models.dto import IngestResult, NormalizedPropDTO, PropTypeEnum
from ..sources import default_nba_provider, ProviderError
from ..normalization import taxonomy_service, map_raw_to_normalized, PropMappingError
from ...database import async_engine

logger = logging.getLogger("nba_ingestion_pipeline")


class NBAIngestionPipeline:
    """
    NBA data ingestion and normalization pipeline.
    
    Orchestrates the complete flow from external data fetch through
    persistence with comprehensive error handling and observability.
    """
    
    def __init__(self):
        """Initialize the pipeline with required services."""
        self.provider = default_nba_provider
        self.taxonomy = taxonomy_service
        
    async def run_nba_ingestion(
        self, 
        limit: Optional[int] = None, 
        allow_upsert: bool = True
    ) -> IngestResult:
        """
        Execute the complete NBA ingestion pipeline.
        
        Args:
            limit: Maximum number of props to process
            allow_upsert: Whether to allow upsert operations
            
        Returns:
            IngestResult with execution details and metrics
        """
        logger.info(f"Starting NBA ingestion pipeline with limit={limit}, allow_upsert={allow_upsert}")
        
        # Initialize result
        result = IngestResult(
            status="running",
            sport="NBA",
            source=self.provider.provider_name,
            started_at=datetime.utcnow(),
            finished_at=None,
            duration_ms=None,
            ingest_run_id=None
        )
        
        ingest_run = None
        session = None
        
        try:
            # Create database session
            session = AsyncSession(async_engine)
            
            # Create ingest run record
            ingest_run = IngestRun(
                sport="NBA",
                source=self.provider.provider_name,
                started_at=result.started_at,
                status="running"
            )
            session.add(ingest_run)
            await session.commit()
            await session.refresh(ingest_run)
            
            result.ingest_run_id = ingest_run.id
            logger.info(f"Created ingest run {ingest_run.id}")
            
            # Fetch raw data from provider
            logger.info("Fetching props from NBA provider")
            try:
                raw_props = await self.provider.fetch_current_props_with_retry(limit=limit)
                result.total_raw = len(raw_props)
                ingest_run.total_raw = result.total_raw
                logger.info(f"Fetched {len(raw_props)} raw props from provider")
            except ProviderError as e:
                logger.error(f"Provider fetch failed: {e}")
                result.status = "failed"
                result.add_error("provider_error", str(e))
                ingest_run.status = "failed"
                ingest_run.add_error("provider_error", str(e))
                await self._finalize_run(session, ingest_run, result)
                return result
            
            # Process each raw prop
            for i, raw_prop in enumerate(raw_props):
                try:
                    await self._process_single_prop(
                        session=session,
                        raw_prop=raw_prop,
                        result=result,
                        allow_upsert=allow_upsert,
                        item_index=i
                    )
                except Exception as e:
                    logger.error(f"Error processing prop {i} ({raw_prop.provider_prop_id}): {e}")
                    result.add_error(
                        error_type="processing_error",
                        message=str(e),
                        context={"item_index": i, "provider_prop_id": raw_prop.provider_prop_id}
                    )
                    ingest_run.add_error(
                        error_type="processing_error",
                        message=str(e),
                        context={"item_index": i, "provider_prop_id": raw_prop.provider_prop_id}
                    )
            
            # Determine final status
            if len(result.errors) == 0:
                result.status = "success"
            elif len(result.errors) < result.total_raw:
                result.status = "partial"
            else:
                result.status = "failed"
            
            # Update ingest run with final counts
            ingest_run.status = result.status
            ingest_run.total_new_quotes = result.total_new_quotes
            ingest_run.total_line_changes = result.total_line_changes
            ingest_run.total_new_players = result.total_new_players
            ingest_run.total_new_props = result.total_new_props
            
            await self._finalize_run(session, ingest_run, result)
            
            # Trigger downstream events if there were changes
            if result.total_line_changes > 0:
                logger.info(f"TODO: Trigger model inference for {result.total_line_changes} line changes")
                # TODO: Implement event emission for model inference
            
            logger.info(f"NBA ingestion completed: {result.status} with {len(result.errors)} errors")
            return result
            
        except Exception as e:
            logger.error(f"Unexpected error in NBA ingestion pipeline: {e}", exc_info=True)
            result.status = "failed"
            result.add_error("pipeline_error", str(e))
            
            if ingest_run:
                ingest_run.status = "failed"
                ingest_run.add_error("pipeline_error", str(e))
                if session:
                    await self._finalize_run(session, ingest_run, result)
            
            return result
            
        finally:
            if session:
                await session.close()
    
    async def _process_single_prop(
        self,
        session: AsyncSession,
        raw_prop,
        result: IngestResult,
        allow_upsert: bool,
        item_index: int
    ):
        """Process a single raw prop through normalization and persistence."""
        try:
            # Normalize the raw prop
            try:
                normalized_prop = map_raw_to_normalized(raw_prop, self.taxonomy)
                logger.debug(f"Normalized prop {item_index}: {normalized_prop.player_name} {normalized_prop.prop_type.value}")
            except PropMappingError as e:
                raise Exception(f"Normalization failed: {e}")
            
            # Upsert player
            player = await self._upsert_player(
                session=session,
                normalized_prop=normalized_prop,
                allow_upsert=allow_upsert,
                result=result
            )
            normalized_prop.player_id = player.id
            
            # Upsert prop
            prop = await self._upsert_prop(
                session=session,
                player=player,
                normalized_prop=normalized_prop,
                allow_upsert=allow_upsert,
                result=result
            )
            
            # Handle market quote (with change detection)
            await self._handle_market_quote(
                session=session,
                prop=prop,
                normalized_prop=normalized_prop,
                result=result
            )
            
        except Exception as e:
            # Re-raise with context for caller to handle
            raise Exception(f"Failed to process prop: {e}") from e
    
    async def _upsert_player(
        self,
        session: AsyncSession,
        normalized_prop: NormalizedPropDTO,
        allow_upsert: bool,
        result: IngestResult
    ) -> Player:
        """Upsert player record with external ID matching."""
        try:
            # Try to find existing player by external ID
            provider_id = normalized_prop.external_ids.get(normalized_prop.source)
            if provider_id:
                query = select(Player).where(
                    Player.external_refs.contains({normalized_prop.source: provider_id})
                )
                existing_player = await session.scalar(query)
                
                if existing_player:
                    # Update existing player if allowed
                    if allow_upsert:
                        existing_player.name = normalized_prop.player_name
                        existing_player.team = normalized_prop.team_abbreviation
                        existing_player.position = normalized_prop.position
                        existing_player.updated_at = datetime.utcnow()
                        await session.commit()
                    return existing_player
            
            # Try to find by name + team fallback
            query = select(Player).where(
                Player.name == normalized_prop.player_name,
                Player.team == normalized_prop.team_abbreviation,
                Player.sport == normalized_prop.sport
            )
            existing_player = await session.scalar(query)
            
            if existing_player:
                # Update external_refs if missing
                if allow_upsert and provider_id:
                    if not existing_player.external_refs:
                        existing_player.external_refs = {}
                    existing_player.external_refs[normalized_prop.source] = provider_id
                    existing_player.updated_at = datetime.utcnow()
                    await session.commit()
                return existing_player
            
            # Create new player
            if allow_upsert:
                new_player = Player(
                    name=normalized_prop.player_name,
                    team=normalized_prop.team_abbreviation,
                    position=normalized_prop.position,
                    sport=normalized_prop.sport,
                    external_refs={normalized_prop.source: provider_id} if provider_id else {}
                )
                session.add(new_player)
                await session.commit()
                await session.refresh(new_player)
                
                result.new_player_ids.append(new_player.id)
                result.total_new_players += 1
                logger.info(f"Created new player: {new_player.name} ({new_player.id})")
                return new_player
            else:
                raise Exception(f"Player not found and upsert disabled: {normalized_prop.player_name}")
        
        except SQLAlchemyError as e:
            raise Exception(f"Database error during player upsert: {e}") from e
    
    async def _upsert_prop(
        self,
        session: AsyncSession,
        player: Player,
        normalized_prop: NormalizedPropDTO,
        allow_upsert: bool,
        result: IngestResult
    ) -> Prop:
        """Upsert prop record for player."""
        try:
            # Look for existing prop
            query = select(Prop).where(
                Prop.player_id == player.id,
                Prop.prop_type == normalized_prop.prop_type.value
            )
            existing_prop = await session.scalar(query)
            
            if existing_prop:
                # Update existing prop
                if allow_upsert:
                    existing_prop.active = True
                    existing_prop.updated_at = datetime.utcnow()
                    await session.commit()
                return existing_prop
            
            # Create new prop
            if allow_upsert:
                new_prop = Prop(
                    player_id=player.id,
                    prop_type=normalized_prop.prop_type.value,
                    base_unit=normalized_prop.prop_type.value.lower(),
                    sport=normalized_prop.sport,
                    active=True
                )
                session.add(new_prop)
                await session.commit()
                await session.refresh(new_prop)
                
                result.new_prop_ids.append(new_prop.id)
                result.total_new_props += 1
                logger.info(f"Created new prop: {player.name} {new_prop.prop_type} ({new_prop.id})")
                return new_prop
            else:
                raise Exception(f"Prop not found and upsert disabled: {player.name} {normalized_prop.prop_type.value}")
                
        except SQLAlchemyError as e:
            raise Exception(f"Database error during prop upsert: {e}") from e
    
    async def _handle_market_quote(
        self,
        session: AsyncSession,
        prop: Prop,
        normalized_prop: NormalizedPropDTO,
        result: IngestResult
    ):
        """Handle market quote with change detection."""
        try:
            # Look for existing quote with same line hash
            query = select(MarketQuote).where(
                MarketQuote.prop_id == prop.id,
                MarketQuote.source == normalized_prop.source,
                MarketQuote.line_hash == normalized_prop.line_hash
            ).order_by(MarketQuote.last_seen_at.desc())
            
            existing_quote = await session.scalar(query)
            
            if existing_quote:
                # Line unchanged - just update last_seen_at
                existing_quote.last_seen_at = datetime.utcnow()
                await session.commit()
                result.total_unchanged += 1
                logger.debug(f"Updated last_seen for unchanged quote {existing_quote.id}")
                return
            
            # Line changed or new quote - create new record
            new_quote = MarketQuote(
                prop_id=prop.id,
                source=normalized_prop.source,
                offered_line=normalized_prop.offered_line,
                payout_schema=normalized_prop.payout_schema.dict(),
                odds_format="american",  # Default for stub data
                line_hash=normalized_prop.line_hash,
                first_seen_at=datetime.utcnow(),
                last_seen_at=datetime.utcnow(),
                last_change_at=datetime.utcnow()
            )
            
            session.add(new_quote)
            await session.commit()
            await session.refresh(new_quote)
            
            result.changed_quote_ids.append(new_quote.id)
            result.total_new_quotes += 1
            result.total_line_changes += 1
            
            logger.info(f"Created new market quote: {prop.player.name} {prop.prop_type} "
                       f"{normalized_prop.offered_line} ({new_quote.id})")
            
        except SQLAlchemyError as e:
            raise Exception(f"Database error during market quote handling: {e}") from e
    
    async def _finalize_run(self, session: AsyncSession, ingest_run: IngestRun, result: IngestResult):
        """Finalize the ingestion run with final metrics."""
        try:
            result.mark_completed()
            ingest_run.mark_completed(result.status)
            
            # Copy errors from result to ingest run
            if result.errors:
                ingest_run.errors = [error.dict() for error in result.errors]
            
            await session.commit()
            logger.info(f"Finalized ingest run {ingest_run.id} with status {ingest_run.status}")
            
        except SQLAlchemyError as e:
            logger.error(f"Error finalizing ingest run: {e}")


# Main function for direct execution
async def run_nba_ingestion(limit: Optional[int] = None, allow_upsert: bool = True) -> IngestResult:
    """
    Execute NBA ingestion pipeline.
    
    Args:
        limit: Maximum number of props to process
        allow_upsert: Whether to allow upsert operations
        
    Returns:
        IngestResult with execution details
    """
    pipeline = NBAIngestionPipeline()
    return await pipeline.run_nba_ingestion(limit=limit, allow_upsert=allow_upsert)