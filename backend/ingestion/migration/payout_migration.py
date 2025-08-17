"""
Migration script for canonical payout representation.

This script handles the transition from legacy payout schemas to the new
canonical representation with normalized multipliers. It ensures backward
compatibility and triggers recomputation of affected line hashes and edges.
"""

import logging
import json
from datetime import datetime
from typing import Dict, Any, Optional

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from ...models.base import get_database_url
from ..models.database_models import MarketQuote, IngestRun
from ..models.dto import PayoutSchema, PayoutType, PayoutVariant
from ..normalization.payout_normalizer import normalize_payout, PayoutNormalizationError

logger = logging.getLogger(__name__)


class PayoutMigrationError(Exception):
    """Exception raised during payout migration."""
    pass


def migrate_payout_schemas():
    """
    Migrate existing payout schemas to canonical representation.
    
    This function:
    1. Identifies market quotes with legacy payout schemas
    2. Converts them to canonical multiplier format
    3. Recomputes line hashes 
    4. Documents expected edge churn for monitoring
    
    Returns:
        Migration statistics and affected quote counts
    """
    engine = create_engine(get_database_url())
    SessionLocal = sessionmaker(bind=engine)
    
    migration_stats = {
        "started_at": datetime.utcnow(),
        "total_quotes": 0,
        "migrated_quotes": 0,
        "failed_quotes": 0,
        "hash_changes": 0,
        "errors": []
    }
    
    with SessionLocal() as session:
        try:
            # Start migration run tracking
            migration_run = IngestRun(
                sport="ALL",
                source="migration",
                status="running",
                started_at=migration_stats["started_at"]
            )
            session.add(migration_run)
            session.commit()
            
            logger.info("Starting canonical payout migration...")"
            
            # Query all market quotes with legacy payout schemas
            quotes_query = session.query(MarketQuote).filter(
                MarketQuote.payout_schema.isnot(None)
            )
            
            migration_stats["total_quotes"] = quotes_query.count()
            logger.info(f"Found {migration_stats['total_quotes']} market quotes to potentially migrate")
            
            # Process quotes in batches for memory efficiency
            batch_size = 1000
            processed = 0
            
            while processed < migration_stats["total_quotes"]:
                batch = quotes_query.offset(processed).limit(batch_size).all()
                
                for quote in batch:
                    try:
                        # Check if quote already has canonical format
                        current_schema = quote.payout_schema
                        if _is_canonical_format(current_schema):
                            continue
                        
                        # Convert to canonical format
                        old_hash = quote.line_hash
                        canonical_schema = _convert_to_canonical(current_schema, quote.source)
                        new_hash = _recompute_line_hash(quote, canonical_schema)
                        
                        # Update quote with canonical schema and new hash
                        quote.payout_schema = canonical_schema.dict()
                        quote.line_hash = new_hash
                        quote.last_change_at = datetime.utcnow()
                        
                        migration_stats["migrated_quotes"] += 1
                        
                        # Track hash changes for edge churn documentation
                        if old_hash != new_hash:
                            migration_stats["hash_changes"] += 1
                            logger.debug(f"Hash changed for quote {quote.id}: {old_hash[:8]} -> {new_hash[:8]}")
                        
                    except Exception as e:
                        migration_stats["failed_quotes"] += 1
                        error_info = {
                            "quote_id": quote.id,
                            "error": str(e),
                            "timestamp": datetime.utcnow().isoformat()
                        }
                        migration_stats["errors"].append(error_info)
                        logger.error(f"Failed to migrate quote {quote.id}: {e}")
                
                # Commit batch
                session.commit()
                processed += len(batch)
                
                logger.info(f"Processed {processed}/{migration_stats['total_quotes']} quotes "
                           f"({migration_stats['migrated_quotes']} migrated, "
                           f"{migration_stats['failed_quotes']} failed)")
            
            # Complete migration run
            migration_stats["finished_at"] = datetime.utcnow()
            migration_run.status = "completed" if migration_stats["failed_quotes"] == 0 else "partial"
            migration_run.finished_at = migration_stats["finished_at"]
            migration_run.duration_ms = int(
                (migration_stats["finished_at"] - migration_stats["started_at"]).total_seconds() * 1000
            )
            
            # Store migration stats in run metadata
            migration_run.metadata = json.dumps(migration_stats, default=str)
            session.commit()
            
            logger.info(f"Canonical payout migration completed: "
                       f"{migration_stats['migrated_quotes']}/{migration_stats['total_quotes']} migrated, "
                       f"{migration_stats['hash_changes']} hash changes, "
                       f"{migration_stats['failed_quotes']} failures")
            
            return migration_stats
            
        except Exception as e:
            session.rollback()
            migration_stats["finished_at"] = datetime.utcnow()
            migration_stats["errors"].append({
                "error": f"Migration failed: {e}",
                "timestamp": datetime.utcnow().isoformat()
            })
            logger.error(f"Canonical payout migration failed: {e}")
            raise PayoutMigrationError(f"Migration failed: {e}") from e


def _is_canonical_format(payout_schema: Dict[str, Any]) -> bool:
    """
    Check if payout schema already uses canonical format.
    
    Args:
        payout_schema: Current payout schema from database
        
    Returns:
        True if already canonical, False if needs migration
    """
    if not payout_schema:
        return False
    
    # Check for presence of canonical fields
    has_variant_code = "variant_code" in payout_schema
    has_multipliers = "over_multiplier" in payout_schema or "under_multiplier" in payout_schema
    
    return has_variant_code and has_multipliers


def _convert_to_canonical(legacy_schema: Dict[str, Any], source: str) -> PayoutSchema:
    """
    Convert legacy payout schema to canonical representation.
    
    Args:
        legacy_schema: Legacy payout schema from database
        source: Provider source name
        
    Returns:
        Canonical PayoutSchema object
    """
    # Create a mock RawExternalPropDTO for normalization
    from ..models.dto import RawExternalPropDTO, PayoutType
    
    # Extract legacy fields
    payout_type = PayoutType(legacy_schema.get("type", "standard"))
    over_odds = legacy_schema.get("over")
    under_odds = legacy_schema.get("under")
    boost_multiplier = legacy_schema.get("boost_multiplier")
    
    # Create mock raw prop for normalization
    mock_prop = RawExternalPropDTO(
        external_player_id="migration_mock",
        player_name="Migration Mock",
        team_code="MIG",
        prop_category="Points",
        line_value=0.0,
        provider_prop_id="migration",
        payout_type=payout_type,
        over_odds=over_odds,
        under_odds=under_odds,
        updated_ts=datetime.utcnow().isoformat(),
        provider_name=source,
        additional_data={"boost_multiplier": boost_multiplier} if boost_multiplier else {}
    )
    
    # Use normalization function
    try:
        return normalize_payout(mock_prop)
    except PayoutNormalizationError as e:
        # Fallback to manual conversion
        logger.warning(f"Normalization failed for {source}, using fallback: {e}")
        return _manual_conversion_fallback(legacy_schema, source)


def _manual_conversion_fallback(legacy_schema: Dict[str, Any], source: str) -> PayoutSchema:
    """
    Manual fallback conversion when automatic normalization fails.
    
    Args:
        legacy_schema: Legacy payout schema
        source: Provider source name
        
    Returns:
        Best-effort canonical PayoutSchema
    """
    payout_type = PayoutType(legacy_schema.get("type", "standard"))
    
    # Detect likely format based on values
    over = legacy_schema.get("over")
    under = legacy_schema.get("under")
    
    if over and under:
        if over > 10 and under > 10:
            # Likely American odds
            variant_code = PayoutVariant.MONEYLINE
            over_multiplier = _american_odds_to_multiplier(over) if over else None
            under_multiplier = _american_odds_to_multiplier(under) if under else None
        elif 1 < over < 10 and 1 < under < 10:
            # Likely decimal odds or already multipliers
            variant_code = PayoutVariant.DECIMAL_ODDS
            over_multiplier = over
            under_multiplier = under
        else:
            # Unknown format, preserve as-is
            variant_code = PayoutVariant.STANDARD_ODDS
            over_multiplier = over
            under_multiplier = under
    else:
        # Minimal data, use standard format
        variant_code = PayoutVariant.STANDARD_ODDS
        over_multiplier = over
        under_multiplier = under
    
    return PayoutSchema(
        type=payout_type,
        variant_code=variant_code,
        over_multiplier=over_multiplier,
        under_multiplier=under_multiplier,
        over=over,  # Preserve legacy for backward compatibility
        under=under,  # Preserve legacy for backward compatibility
        boost_multiplier=legacy_schema.get("boost_multiplier"),
        provider_format={"migrated_from_legacy": True, "original": legacy_schema}
    )


def _american_odds_to_multiplier(odds: float) -> float:
    """Convert American odds to multiplier (same as in payout_normalizer.py)."""
    if odds > 0:
        return (odds / 100) + 1
    else:
        return (100 / abs(odds)) + 1


def _recompute_line_hash(quote: MarketQuote, canonical_schema: PayoutSchema) -> str:
    """
    Recompute line hash with canonical payout schema.
    
    Args:
        quote: Market quote to hash
        canonical_schema: New canonical payout schema
        
    Returns:
        New line hash string
    """
    from ..normalization.prop_mapper import compute_line_hash
    from ..models.dto import PropTypeEnum
    
    # Convert prop_type string back to enum
    prop_type = PropTypeEnum(quote.prop.prop_type)
    
    return compute_line_hash(
        prop_type=prop_type,
        offered_line=quote.offered_line,
        payout_schema=canonical_schema
    )


def get_migration_summary() -> Dict[str, Any]:
    """
    Get summary of the most recent migration run.
    
    Returns:
        Dictionary containing migration statistics and status
    """
    engine = create_engine(get_database_url())
    SessionLocal = sessionmaker(bind=engine)
    
    with SessionLocal() as session:
        # Find most recent migration run
        migration_run = (
            session.query(IngestRun)
            .filter(IngestRun.source == "migration")
            .order_by(IngestRun.started_at.desc())
            .first()
        )
        
        if not migration_run:
            return {"status": "no_migration_found"}
        
        summary = {
            "run_id": migration_run.id,
            "status": migration_run.status,
            "started_at": migration_run.started_at,
            "finished_at": migration_run.finished_at,
            "duration_ms": migration_run.duration_ms
        }
        
        if migration_run.metadata:
            try:
                metadata = json.loads(migration_run.metadata)
                summary.update(metadata)
            except json.JSONDecodeError:
                summary["metadata_error"] = "Failed to parse metadata"
        
        return summary


def document_expected_edge_churn(migration_stats: Dict[str, Any]) -> str:
    """
    Document expected edge churn from hash changes.
    
    Args:
        migration_stats: Migration statistics from migrate_payout_schemas
        
    Returns:
        Formatted documentation string for monitoring teams
    """
    churn_rate = (migration_stats["hash_changes"] / max(migration_stats["total_quotes"], 1)) * 100
    
    documentation = f"""
# Canonical Payout Migration - Expected Edge Churn Documentation

## Migration Summary
- **Total Quotes Processed**: {migration_stats['total_quotes']:,}
- **Migrated to Canonical**: {migration_stats['migrated_quotes']:,}
- **Hash Changes**: {migration_stats['hash_changes']:,}
- **Churn Rate**: {churn_rate:.2f}%
- **Failed Migrations**: {migration_stats['failed_quotes']:,}

## Expected Impact
The canonical payout migration will cause {migration_stats['hash_changes']:,} line hashes to change,
triggering recomputation of:

1. **Edge Detection**: All affected props will recalculate edges with new hash
2. **Valuations**: Betting valuations will be recomputed using canonical multipliers
3. **Cache Invalidation**: Cached analysis results will be invalidated and refreshed

## Monitoring Checklist
- [ ] Verify edge detection service processes {migration_stats['hash_changes']:,} hash changes
- [ ] Confirm no crashes in valuation recomputation
- [ ] Monitor for increased processing load during initial recomputation
- [ ] Validate that new canonical format is consistent across providers

## Expected Timeline
- **Initial Recomputation**: 15-30 minutes for {migration_stats['hash_changes']:,} changes
- **Cache Rebuild**: 1-2 hours for full cache refresh
- **System Stabilization**: 2-4 hours for complete transition

## Rollback Plan
If issues arise, the migration preserves legacy 'over' and 'under' fields for backward compatibility.
Emergency rollback can temporarily revert to legacy hash computation while issues are resolved.

Generated: {migration_stats.get('finished_at', 'In Progress')}
"""
    
    return documentation


if __name__ == "__main__":
    # CLI execution
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "summary":
        # Get migration summary
        summary = get_migration_summary()
        print(json.dumps(summary, indent=2, default=str))
    else:
        # Run migration
        try:
            stats = migrate_payout_schemas()
            print("\nMigration completed successfully!")
            print(f"Migrated: {stats['migrated_quotes']}/{stats['total_quotes']} quotes")
            print(f"Hash changes: {stats['hash_changes']}")
            print(f"Failures: {stats['failed_quotes']}")
            
            if stats['hash_changes'] > 0:
                print("\nGenerating edge churn documentation...")
                churn_doc = document_expected_edge_churn(stats)
                with open("payout_migration_churn_report.md", "w") as f:
                    f.write(churn_doc)
                print("Edge churn documentation saved to: payout_migration_churn_report.md")
                
        except PayoutMigrationError as e:
            print(f"Migration failed: {e}")
            sys.exit(1)