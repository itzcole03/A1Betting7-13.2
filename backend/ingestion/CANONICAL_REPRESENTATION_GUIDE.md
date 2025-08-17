# Canonical Prop Line Representation - Implementation Guide

## Overview

This implementation introduces a canonical representation for prop lines that normalizes provider-specific payout formats into a unified internal schema. This eliminates branching logic in downstream processing and enables consistent line hashing across providers.

## Architecture

### Core Components

1. **Enhanced PayoutSchema** (`dto.py`)
   - Canonical multiplier representation (`over_multiplier`, `under_multiplier`)
   - Payout variant classification (`PayoutVariant` enum)
   - Backward compatibility with legacy fields
   - Provider format traceability

2. **Payout Normalization Layer** (`payout_normalizer.py`)
   - Converts provider-specific formats to canonical schema
   - Handles American odds, decimal odds, and multipliers
   - Detects boost multipliers automatically
   - Provider-specific format detection

3. **Enhanced Taxonomy Service** (`taxonomy_service.py`)
   - Provider-specific prop category translation tables
   - Fallback to global mappings
   - Support for PTS vs Points, AST vs Assists, etc.

4. **Updated Line Hashing** (`prop_mapper.py`)
   - Includes canonical payout object in hash computation
   - Ensures consistent hashing across provider formats
   - Triggers proper edge/valuation recomputation

### Data Flow

```
Raw Provider Data → Payout Normalization → Canonical Schema → Line Hash → Database
                                       ↓
                  Taxonomy Translation → Prop Type Enum
```

## Key Features

### Provider Payout Format Support

| Provider | Format | Example Input | Canonical Output |
|----------|--------|---------------|------------------|
| PrizePicks | Multipliers | `3.0x, 2.5x` | `over_multiplier: 3.0, under_multiplier: 2.5` |
| DraftKings | American Odds | `-110, +150` | `over_multiplier: 1.91, under_multiplier: 2.5` |
| Bet365 | Decimal Odds | `1.91, 2.50` | `over_multiplier: 1.91, under_multiplier: 2.5` |
| FanDuel | Mixed Format | Detected automatically | Normalized to multipliers |

### Prop Category Translations

| Provider | Raw Category | Canonical Type |
|----------|-------------|----------------|
| PrizePicks | "PTS" | PropTypeEnum.POINTS |
| DraftKings | "Player Points" | PropTypeEnum.POINTS |
| FanDuel | "Points" | PropTypeEnum.POINTS |
| Bet365 | "Player Points" | PropTypeEnum.POINTS |

## Implementation Details

### Canonical Payout Schema

```python
class PayoutSchema(BaseModel):
    type: PayoutType                    # STANDARD, FLEX, BOOST, MULTIPLIER
    variant_code: PayoutVariant         # Format classification
    over_multiplier: Optional[float]    # Canonical over multiplier
    under_multiplier: Optional[float]   # Canonical under multiplier
    over: Optional[float]              # Legacy field (backward compatibility)
    under: Optional[float]             # Legacy field (backward compatibility)
    boost_multiplier: Optional[float]   # Promotional boost
    provider_format: Dict[str, Any]     # Original format traceability
```

### Line Hash Computation

The new line hash includes canonical payout representation:

```python
hash_components = [
    prop_type.value,                    # e.g., "POINTS"
    f"{offered_line:.1f}",             # e.g., "25.5"
    payout_schema.type.value,          # e.g., "standard"
    payout_schema.variant_code.value,  # e.g., "moneyline" 
    f"{over_multiplier:.3f}",          # e.g., "1.909"
    f"{under_multiplier:.3f}",         # e.g., "2.500"
    f"{boost_multiplier:.3f}"          # e.g., "None"
]
```

### Provider-Specific Mappings

```python
provider_mappings = {
    "prizepicks": {
        "PTS": PropTypeEnum.POINTS,
        "AST": PropTypeEnum.ASSISTS,
        "REB": PropTypeEnum.REBOUNDS,
        "PRA": PropTypeEnum.PRA,
    },
    "draftkings": {
        "Player Points": PropTypeEnum.POINTS,
        "Player Assists": PropTypeEnum.ASSISTS,
        "Player Rebounds": PropTypeEnum.REBOUNDS,
    }
    # ... more providers
}
```

## Deployment Process

### 1. Pre-Deployment Validation

```bash
# Run comprehensive validation
python -m backend.ingestion.validation.canonical_validation

# Expected output: Validation report with 100% test pass rate
```

### 2. Database Migration

```bash
# Run canonical payout migration
python -m backend.ingestion.migration.payout_migration

# Review migration summary
python -m backend.ingestion.migration.payout_migration summary
```

### 3. Expected Impact

#### Hash Changes
- All existing props will have new line hashes due to canonical representation
- Edge detection will recompute edges for all changed hashes
- Valuations will be recalculated using normalized multipliers

#### Performance Impact
- Initial recomputation: 15-30 minutes for typical dataset
- Cache rebuild: 1-2 hours for full refresh
- System stabilization: 2-4 hours complete transition

#### Edge Churn Documentation
The migration automatically generates edge churn documentation:
- Total affected props and hash change count
- Expected recomputation timeline
- Monitoring checklist for operations team

## Backward Compatibility

### Legacy Field Preservation
The canonical schema preserves legacy fields for backward compatibility:
- `over` and `under` fields remain populated
- Existing API contracts continue to work
- Gradual migration path for consuming services

### Emergency Rollback
If issues arise during deployment:
1. Legacy fields are still present in database
2. Hash computation can temporarily revert to legacy format
3. Full rollback capability within 1-hour window

## Testing & Validation

### Automated Testing
- **Payout Normalization Tests**: All provider formats convert correctly
- **Line Hash Consistency**: Hash computation is stable and unique
- **Translation Tests**: All prop category mappings work
- **Backward Compatibility**: Legacy interfaces remain functional
- **Edge Case Handling**: Unknown providers, missing data, extreme values

### Manual Verification
1. Verify edge detection processes all hash changes
2. Confirm no crashes in valuation recomputation
3. Monitor processing load during initial recomputation
4. Validate consistent canonical format across providers

## Monitoring & Observability

### Key Metrics
- **Migration Success Rate**: Percentage of props successfully migrated
- **Hash Change Count**: Number of line hashes that changed
- **Edge Recomputation Rate**: Edges processed per minute during transition
- **Error Rate**: Failed normalizations or hash computations

### Alerts
- Migration failure rate > 5%
- Edge recomputation stalled > 30 minutes
- Canonical format validation failures
- Database performance degradation

## Usage Examples

### Basic Prop Normalization
```python
from backend.ingestion.normalization.prop_mapper import map_raw_to_normalized
from backend.ingestion.normalization.taxonomy_service import TaxonomyService

# Raw prop from PrizePicks
raw_prop = RawExternalPropDTO(
    external_player_id="pp_player_123",
    player_name="LeBron James", 
    team_code="LAL",
    prop_category="PTS",
    line_value=25.5,
    provider_prop_id="pp_prop_456",
    payout_type=PayoutType.MULTIPLIER,
    over_odds=3.0,
    under_odds=2.5,
    updated_ts=datetime.utcnow().isoformat(),
    provider_name="prizepicks"
)

# Normalize to canonical representation
taxonomy_service = TaxonomyService()
normalized_prop = map_raw_to_normalized(raw_prop, taxonomy_service, "NBA")

# Result: 
# - prop_type: PropTypeEnum.POINTS
# - payout_schema.variant_code: PayoutVariant.MULTIPLIER  
# - payout_schema.over_multiplier: 3.0
# - line_hash: SHA-256 hash including canonical payout
```

### Provider-Specific Translation
```python
taxonomy_service = TaxonomyService()

# Provider-specific translation
result1 = taxonomy_service.normalize_prop_category("PTS", "NBA", "prizepicks")
result2 = taxonomy_service.normalize_prop_category("Player Points", "NBA", "draftkings") 
result3 = taxonomy_service.normalize_prop_category("Points", "NBA", "fanduel")

# All return: PropTypeEnum.POINTS
```

### Line Hash Consistency
```python
from backend.ingestion.normalization.prop_mapper import compute_line_hash

# Same logical prop from different providers
hash1 = compute_line_hash(PropTypeEnum.POINTS, 25.5, prizepicks_payout_schema)
hash2 = compute_line_hash(PropTypeEnum.POINTS, 25.5, draftkings_payout_schema)

# Hashes will differ due to different payout structures,
# but computation is consistent for each provider
```

## Future Enhancements

### Multi-Sport Support
- Extend taxonomy service for NFL, MLB prop categories
- Sport-specific payout format handling
- Cross-sport consistency in canonical representation

### Advanced Provider Detection
- Machine learning-based format detection
- Dynamic provider mapping updates
- Anomaly detection for unusual payout structures

### Performance Optimization
- Batch processing for large migrations
- Incremental hash updates
- Caching for frequently accessed translations

## Troubleshooting

### Common Issues

#### Migration Failures
**Symptom**: High migration failure rate
**Cause**: Unknown provider formats or missing data
**Solution**: Review error logs, add provider mappings, validate input data

#### Hash Inconsistencies  
**Symptom**: Same prop produces different hashes
**Cause**: Non-deterministic input data or floating point precision
**Solution**: Standardize precision in hash computation, validate input normalization

#### Performance Degradation
**Symptom**: Slow edge recomputation after migration
**Cause**: Large volume of hash changes overwhelming processing
**Solution**: Implement batch processing, monitor resource usage, consider temporary rate limiting

### Debug Commands

```bash
# Validate specific prop normalization
python -c "
from backend.ingestion.validation.canonical_validation import _test_payout_normalization
import asyncio
results = {}
asyncio.run(_test_payout_normalization(results))
print(results)
"

# Check provider mappings
python -c "
from backend.ingestion.normalization.taxonomy_service import TaxonomyService
ts = TaxonomyService()
print('Supported providers:', ts.get_supported_providers())
print('PrizePicks categories:', ts.get_provider_prop_categories('prizepicks'))
"

# Test line hash computation
python -c "
from backend.ingestion.normalization.prop_mapper import compute_line_hash
from backend.ingestion.models.dto import PropTypeEnum, PayoutSchema, PayoutType, PayoutVariant
schema = PayoutSchema(type=PayoutType.MULTIPLIER, variant_code=PayoutVariant.MULTIPLIER, 
                     over_multiplier=3.0, under_multiplier=2.5)
hash_val = compute_line_hash(PropTypeEnum.POINTS, 25.5, schema)
print('Line hash:', hash_val[:8], '...')
"
```

## Support

For issues or questions regarding the canonical representation implementation:

1. **Validation Failures**: Run full validation suite and review generated report
2. **Migration Issues**: Check migration summary and error logs
3. **Performance Concerns**: Monitor key metrics during transition period
4. **Data Inconsistencies**: Verify provider mappings and normalization logic

The implementation includes comprehensive logging, error handling, and rollback capabilities to ensure smooth deployment and operation.