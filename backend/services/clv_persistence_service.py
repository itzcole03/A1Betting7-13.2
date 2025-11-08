"""
CLV Persistence Service

Service for persisting CLV computation results to database for historical analysis,
performance monitoring, and trend tracking.
"""

import asyncio
import hashlib
import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from sqlmodel import SQLModel, delete, desc, func, select

from backend.services.unified_session_utils import unified_session_execute

try:
    from backend.services.database.database import db_manager
    from backend.models.clv_history import CLVHistory
except ImportError as e:
    # Graceful fallback if database dependencies unavailable
    CLVHistory = None
    db_manager = None
    SQLModel = None
    logging.getLogger(__name__).warning(f"CLV persistence unavailable: {e}")

logger = logging.getLogger("clv_persistence")


class CLVPersistenceService:
    """Service for persisting CLV computation results"""

    def __init__(self):
        self.enabled = CLVHistory is not None and db_manager is not None
        if not self.enabled:
            logger.warning("CLV persistence disabled - missing database dependencies")
        else:
            # Auto-create CLV table during initialization
            try:
                loop = asyncio.get_running_loop()
            except RuntimeError:
                loop = None

            if loop and loop.is_running():
                loop.create_task(self._ensure_clv_table())
            else:
                try:
                    asyncio.run(self._ensure_clv_table())
                except RuntimeError:
                    # If we're already inside an event loop but it isn't running yet, defer creation
                    # Table creation will occur on first awaited call.
                    logger.debug(
                        "Deferring CLV table initialization until event loop starts"
                    )

    def _generate_opportunity_hash(self, opportunity: Dict[str, Any]) -> str:
        """Generate consistent hash for opportunity identification"""
        # Create deterministic hash from key opportunity fields
        base_string = "|".join(
            [
                str(opportunity.get("player", "")),
                str(opportunity.get("sport", "")),
                str(opportunity.get("market", "")),
                str(opportunity.get("closingLine", "")),
                str(opportunity.get("closingOdds", "")),
            ]
        )
        return hashlib.sha256(base_string.encode("utf-8")).hexdigest()

    async def store_batch(
        self,
        opportunities: List[Dict[str, Any]],
        processing_ms: Optional[int] = None,
        batch_id: Optional[str] = None,
    ) -> bool:
        """Store batch of CLV computation results (fire-and-forget)"""
        if not self.enabled or not opportunities or db_manager is None:
            return False

        start_time = time.time()
        records = []

        try:
            for opp in opportunities:
                # Only persist opportunities with CLV data
                if "clvPercent" not in opp or opp.get("clvPercent") is None:
                    continue

                record = CLVHistory(
                    opportunity_hash=self._generate_opportunity_hash(opp),
                    player=opp.get("player"),
                    sport=opp.get("sport"),
                    market=opp.get("market"),
                    clv_percent=float(opp.get("clvPercent", 0)),
                    closing_line=float(opp.get("closingLine", 0)),
                    closing_odds=int(opp.get("closingOdds", 0)),
                    processing_ms=processing_ms,
                    source_version="v1",
                    initial_line=opp.get("openingLine"),
                    initial_odds=opp.get("openingOdds"),
                    batch_id=batch_id,
                )
                records.append(record)

            if not records:
                logger.debug("No CLV records to persist")
                return False

            # Persist to database with timeout protection and duplicate handling
            async with db_manager.get_session() as session:
                try:
                    session.add_all(records)
                    await session.commit()
                except Exception as e:
                    await session.rollback()
                    # Handle duplicate constraint violations gracefully
                    if (
                        "UNIQUE constraint failed" in str(e)
                        or "duplicate" in str(e).lower()
                    ):
                        logger.debug(
                            f"Some CLV records already exist - persisting unique ones only"
                        )
                        # Try persisting one by one to handle partial duplicates
                        success_count = 0
                        for record in records:
                            try:
                                async with db_manager.get_session() as individual_session:
                                    individual_session.add(record)
                                    await individual_session.commit()
                                    success_count += 1
                            except Exception as individual_error:
                                if "UNIQUE constraint failed" not in str(
                                    individual_error
                                ):
                                    logger.debug(
                                        f"Individual record persistence error: {individual_error}"
                                    )
                        logger.debug(
                            f"Persisted {success_count}/{len(records)} CLV records (duplicates skipped)"
                        )
                        return success_count > 0
                    else:
                        raise e

            duration_ms = (time.time() - start_time) * 1000
            logger.info(f"Persisted {len(records)} CLV records in {duration_ms:.1f}ms")
            return True

        except asyncio.TimeoutError:
            logger.debug("CLV persistence timeout (250ms) - data not persisted")
            return False
        except Exception as e:
            logger.debug(f"CLV persistence error (suppressed): {e}")
            return False

    async def get_recent(
        self,
        limit: int = 50,
        sport: Optional[str] = None,
        player: Optional[str] = None,
        hours_back: Optional[int] = None,
    ) -> List[
        Any
    ]:  # Changed from List[CLVHistory] to avoid type issues when CLVHistory is None
        """Get recent CLV computation results with filtering"""
        if not self.enabled or db_manager is None or CLVHistory is None:
            return []

        try:
            async with db_manager.get_session() as session:
                stmt = (
                    select(CLVHistory)
                    .order_by(desc(CLVHistory.computed_at))
                    .limit(limit)
                )

                # Apply filters
                if sport:
                    stmt = stmt.where(CLVHistory.sport == sport)
                if player:
                    stmt = stmt.where(CLVHistory.player == player)
                if hours_back:
                    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_back)
                    stmt = stmt.where(CLVHistory.computed_at >= cutoff)

                result = await unified_session_execute(session, stmt)
                return list(result.scalars().all())

        except Exception as e:
            logger.error(f"Error retrieving CLV history: {e}")
            return []

    async def get_summary(
        self, hours_back: int = 24, sport: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get CLV computation summary statistics"""
        if not self.enabled or db_manager is None or CLVHistory is None:
            return {"enabled": False, "reason": "persistence_disabled"}

        try:
            async with db_manager.get_session() as session:
                cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_back)

                stmt = (
                    select(
                        func.count().label("total_records"),
                        func.avg(CLVHistory.clv_percent).label("avg_clv"),
                        func.max(CLVHistory.clv_percent).label("max_clv"),
                        func.min(CLVHistory.clv_percent).label("min_clv"),
                        func.avg(CLVHistory.processing_ms).label("avg_processing_ms"),
                    )
                    .select_from(CLVHistory)
                    .where(CLVHistory.computed_at >= cutoff)
                )

                if sport:
                    stmt = stmt.where(CLVHistory.sport == sport)

                result = await unified_session_execute(session, stmt)
                row = result.first()

                if not row:
                    return {
                        "enabled": True,
                        "window_hours": hours_back,
                        "sport": sport,
                        "total_records": 0,
                        "avg_clv_percent": 0.0,
                        "max_clv_percent": 0.0,
                        "min_clv_percent": 0.0,
                        "avg_processing_ms": 0.0,
                    }

                return {
                    "enabled": True,
                    "window_hours": hours_back,
                    "sport": sport,
                    "total_records": row.total_records or 0,
                    "avg_clv_percent": round(row.avg_clv or 0, 2),
                    "max_clv_percent": round(row.max_clv or 0, 2),
                    "min_clv_percent": round(row.min_clv or 0, 2),
                    "avg_processing_ms": round(row.avg_processing_ms or 0, 1),
                }

        except Exception as e:
            logger.error(f"Error generating CLV summary: {e}")
            return {"enabled": True, "error": str(e)}

    async def _ensure_clv_table(self):
        """Ensure CLV table exists (auto-creation during startup)"""
        if not self.enabled or db_manager is None or CLVHistory is None:
            return

        try:
            async with db_manager.get_session() as session:
                # Auto-create tables using SQLAlchemy text() for compatibility
                from sqlmodel import text

                await unified_session_execute(
                    session,
                    text(
                        """
                    CREATE TABLE IF NOT EXISTS clv_history (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        opportunity_hash TEXT NOT NULL,
                        player TEXT,
                        sport TEXT,
                        market TEXT,
                        clv_percent REAL NOT NULL,
                        closing_line REAL NOT NULL,
                        closing_odds INTEGER NOT NULL,
                        computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        processing_ms INTEGER,
                        source_version TEXT DEFAULT 'v1',
                        initial_line REAL,
                        initial_odds INTEGER,
                        batch_id TEXT
                    )
                """
                    ),
                )

                # Create composite index for performance (sport + computed_at DESC)
                await unified_session_execute(
                    session,
                    text(
                        """
                    CREATE INDEX IF NOT EXISTS idx_clv_sport_computed_at 
                    ON clv_history (sport, computed_at DESC)
                """
                    ),
                )

                # Create index for opportunity_hash lookups
                await unified_session_execute(
                    session,
                    text(
                        """
                    CREATE INDEX IF NOT EXISTS idx_clv_opportunity_hash 
                    ON clv_history (opportunity_hash)
                """
                    ),
                )

                # Create unique constraint to prevent duplicates (opportunity_hash + computed_at)
                await unified_session_execute(
                    session,
                    text(
                        """
                    CREATE UNIQUE INDEX IF NOT EXISTS idx_clv_unique_opportunity_time
                    ON clv_history (opportunity_hash, date(computed_at))
                """
                    ),
                )

                await session.commit()
                logger.debug("CLV table auto-creation with indexes completed")
        except Exception as e:
            logger.debug(f"CLV table auto-creation skipped: {e}")

    async def prune_old_records(self, days: int = 7) -> int:
        """Prune old CLV records for maintenance (non-blocking)"""
        if not self.enabled or db_manager is None or CLVHistory is None:
            return 0

        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

        try:
            async with db_manager.get_session() as session:
                # Delete old records using SQLAlchemy text() for safety
                from sqlmodel import text

                result = await unified_session_execute(
                    session,
                    text("DELETE FROM clv_history WHERE computed_at < :cutoff"),
                    params={"cutoff": cutoff},
                )
                await session.commit()
                deleted_count = getattr(result, "rowcount", 0) or 0

                logger.debug(
                    f"Pruned {deleted_count} CLV records older than {days} days"
                )
                return deleted_count

        except Exception as e:
            logger.debug(f"CLV pruning skipped: {e}")
            return 0


# Global service instance
clv_persistence_service = CLVPersistenceService()
