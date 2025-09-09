# Data Validation Pipeline

## Overview

The A1Betting platform includes a comprehensive data validation pipeline that ensures the quality and integrity of sports betting data without interrupting normal operations. Instead of failing when data issues are detected, the system annotates opportunities with validation warnings for monitoring and metrics collection.

## Architecture

### Core Components

- **DataValidator**: Main validation engine that processes opportunities and generates warnings
- **ValidationMetrics**: Collects and aggregates validation warnings for monitoring
- **ValidationWarning**: Represents individual validation issues with metadata
- **API Endpoints**: Provides access to validation summaries and health status

### Design Principles

1. **Non-blocking**: Validation never fails operations, only adds warnings
2. **Comprehensive**: Validates all critical data aspects (odds, calculations, formats)
3. **Observable**: All warnings are collected for metrics and monitoring
4. **Performance-aware**: Asynchronous validation with minimal overhead

## Validation Categories

### 1. Odds Completeness (`odds_incomplete`)

Validates that required odds data is present and complete.

**Checks:**
- Bookmaker information exists (`bestBookmaker` field)
- Line data is present (`line`, `overLine`, `underLine` fields)
- Odds data is present (`odds`, `overOdds`, `underOdds` fields)

**Example Warning:**
```json
{
  \"type\": \"odds_incomplete\",
  \"message\": \"Missing bookmaker information\",
  \"field\": \"bestBookmaker\",
  \"value\": null,
  \"timestamp\": \"2025-09-07T10:30:00Z\"
}
```

### 2. Odds Format Validation (`odds_invalid_format`)

Ensures odds data follows expected formats and data types.

**Checks:**
- Line fields are numeric (can be converted to float)
- Odds fields are integers (American format: -110, +150, etc.)

**Example Warning:**
```json
{
  \"type\": \"odds_invalid_format\",
  \"message\": \"Line field 'line' must be numeric\",
  \"field\": \"line\",
  \"value\": \"not_a_number\",
  \"timestamp\": \"2025-09-07T10:30:00Z\"
}
```

### 3. Expected Value (EV) Input Validation

#### Fair Odds Validation (`ev_invalid_fair_odds`)

Validates fair odds used in EV calculations.

**Checks:**
- Fair odds are greater than 0
- Fair odds are numeric

**Example Warning:**
```json
{
  \"type\": \"ev_invalid_fair_odds\",
  \"message\": \"Fair odds must be greater than 0\",
  \"field\": \"fairOdds\",
  \"value\": -150,
  \"timestamp\": \"2025-09-07T10:30:00Z\"
}
```

#### Market Odds Validation (`ev_invalid_market_odds`)

Validates market odds are within reasonable ranges.

**Checks:**
- American odds between -10,000 and +10,000
- Extreme odds that may indicate data errors

**Example Warning:**
```json
{
  \"type\": \"ev_invalid_market_odds\",
  \"message\": \"Market odds out of reasonable range: -50000\",
  \"field\": \"odds\",
  \"value\": -50000,
  \"timestamp\": \"2025-09-07T10:30:00Z\"
}
```

### 4. Arbitrage Integrity Validation

#### Missing Arbitrage Sides (`arbitrage_missing_sides`)

Validates that arbitrage opportunities have all required data.

**Checks:**
- Both over and under odds are present for arbitrage opportunities
- Required fields are not null when `hasArbitrage` is true

**Example Warning:**
```json
{
  \"type\": \"arbitrage_missing_sides\",
  \"message\": \"Arbitrage opportunity missing over/under odds\",
  \"field\": \"arbitrage_sides\",
  \"value\": {\"overOdds\": -110, \"underOdds\": null},
  \"timestamp\": \"2025-09-07T10:30:00Z\"
}
```

#### Probability Violation (`arbitrage_probability_violation`)

Validates that arbitrage probabilities make mathematical sense.

**Checks:**
- Combined implied probabilities are in range [0.85, 1.15]
- Probability calculations don't result in impossible scenarios

**Example Warning:**
```json
{
  \"type\": \"arbitrage_probability_violation\",
  \"message\": \"Arbitrage probability sum out of range: 1.3333\",
  \"field\": \"probability_sum\",
  \"value\": 1.3333,
  \"timestamp\": \"2025-09-07T10:30:00Z\"
}
```

### 5. Numerical Bounds Validation (`numerical_bounds_violation`)

Validates that numerical fields are within expected ranges.

**Checks:**
- Confidence scores: 0-100%
- Edge percentages: -100% to 500%
- Other numerical fields within reasonable bounds

**Example Warning:**
```json
{
  \"type\": \"numerical_bounds_violation\",
  \"message\": \"Confidence score out of range [0, 100]: 150\",
  \"field\": \"confidence\",
  \"value\": 150,
  \"timestamp\": \"2025-09-07T10:30:00Z\"
}
```

## Pipeline Integration

### PropFinder Integration

The validation pipeline is integrated into the PropFinder service:

```python
# In SimplePropFinderService._generate_propopportunity_data()
if self.validator:
    try:
        validated_opportunities = []
        for opp in opportunities:
            # Convert opportunity to dict for validation
            opp_dict = asdict(opp)
            warnings = await self.validator.validate_opportunity(opp_dict)
            
            # Add validation warnings to opportunity (without failing)
            if warnings:
                opp.validationWarnings = [warning.to_dict() for warning in warnings]
            else:
                opp.validationWarnings = []
            
            validated_opportunities.append(opp)
        
        opportunities = validated_opportunities
        
    except Exception as e:
        logger.error(f\"Data validation pipeline failed: {e}\")
        # Continue without validation on error
```

### Opportunity Annotation

Each opportunity returned by the API includes a `validationWarnings` field:

```json
{
  \"id\": \"game1-player1\",
  \"player\": \"Test Player\",
  \"line\": 2.5,
  \"odds\": -110,
  \"validationWarnings\": [
    {
      \"type\": \"odds_incomplete\",
      \"message\": \"Missing bookmaker information\",
      \"field\": \"bestBookmaker\",
      \"value\": null,
      \"timestamp\": \"2025-09-07T10:30:00Z\"
    }
  ]
}
```

## Metrics Collection

### Automatic Metrics

All validation warnings are automatically collected by the `ValidationMetrics` system:

- **Warning Counts**: Count by warning type
- **Time Windows**: Configurable time-based aggregation
- **Memory Management**: Automatic cleanup of old warnings

### Metrics API

#### Get Validation Summary

```http
GET /api/data/validation/summary?minutes=15
```

**Response:**
```json
{
  \"success\": true,
  \"data\": {
    \"total_validated\": 150,
    \"total_warnings\": 12,
    \"warning_counts\": {
      \"odds_incomplete\": 5,
      \"ev_invalid_fair_odds\": 3,
      \"arbitrage_probability_violation\": 2,
      \"numerical_bounds_violation\": 2
    },
    \"time_window_minutes\": 15,
    \"generated_at\": \"2025-09-07T10:30:00Z\",
    \"warning_rate\": 8.0
  },
  \"timestamp\": \"2025-09-07T10:30:00Z\"
}
```

#### Get Validation Health

```http
GET /api/data/validation/health
```

**Response:**
```json
{
  \"success\": true,
  \"data\": {
    \"status\": \"healthy\",
    \"recent_warnings\": 3,
    \"validation_active\": true,
    \"last_check\": \"2025-09-07T10:30:00Z\"
  }
}
```

## Usage Examples

### Basic Validation

```python
from backend.validators.data_validator import DataValidator, get_validation_metrics

# Initialize validator
metrics = get_validation_metrics()
validator = DataValidator(metrics)

# Validate an opportunity
opportunity = {
    \"player\": \"Test Player\",
    \"line\": 2.5,
    \"odds\": -110,
    \"bestBookmaker\": \"DraftKings\"
}

warnings = await validator.validate_opportunity(opportunity)

if warnings:
    print(f\"Found {len(warnings)} validation warnings:\")
    for warning in warnings:
        print(f\"- {warning.type.value}: {warning.message}\")
else:
    print(\"No validation warnings\")
```

### Metrics Collection

```python
from backend.validators.data_validator import get_validation_metrics

# Get global metrics instance
metrics = get_validation_metrics()

# Get summary for last 15 minutes
summary = await metrics.get_summary(minutes=15)

print(f\"Total warnings: {summary.total_warnings}\")
print(f\"Warning rate: {summary.warning_rate}%\")

for warning_type, count in summary.warning_counts.items():
    print(f\"{warning_type}: {count}\")
```

## Configuration

### Environment Variables

No specific environment variables are required. The validation pipeline uses graceful fallbacks:

- If validation modules are not available, operations continue without validation
- If metrics collection fails, warnings are logged but operations continue

### Customization

The validation rules can be customized by modifying the `DataValidator` class:

```python
class CustomDataValidator(DataValidator):
    async def _validate_custom_rules(self, opportunity: Dict[str, Any]) -> List[ValidationWarning]:
        \"\"\"Add custom validation rules.\"\"\"
        warnings = []
        
        # Add custom validation logic here
        
        return warnings
```

## Monitoring and Alerting

### Key Metrics to Monitor

1. **Warning Rate**: `total_warnings / total_validated * 100`
2. **Warning Types**: Distribution of warning types
3. **Validation Health**: Whether validation is active and functioning

### Recommended Alerts

- **High Warning Rate**: > 10% of opportunities have warnings
- **Critical Warning Types**: Increase in arbitrage or EV validation warnings
- **Validation Downtime**: Validation pipeline not functioning

### Dashboard Queries

For monitoring dashboards, use the validation summary endpoint:

```javascript
// Get recent validation metrics
fetch('/api/data/validation/summary?minutes=15')
  .then(response => response.json())
  .then(data => {
    const warningRate = data.data.warning_rate;
    const totalWarnings = data.data.total_warnings;
    
    // Update dashboard charts
    updateWarningRateChart(warningRate);
    updateWarningCountsChart(data.data.warning_counts);
  });
```

## Testing

### Unit Tests

The validation pipeline includes comprehensive unit tests:

```bash
# Run validation tests
pytest tests/backend/test_data_validation.py -v

# Run API tests
pytest tests/backend/test_validation_api.py -v
```

### Mock Data for Testing

Use the provided mock opportunities to test specific warning types:

```python
from tests.backend.test_data_validation import MOCK_OPPORTUNITIES_WITH_VIOLATIONS

# Test each violation type
for mock_data in MOCK_OPPORTUNITIES_WITH_VIOLATIONS:
    warnings = await validator.validate_opportunity(mock_data[\"data\"])
    assert len(warnings) > 0
```

## Performance Considerations

### Asynchronous Processing

All validation is asynchronous to minimize performance impact:

```python
# Validation runs asynchronously
warnings = await validator.validate_opportunity(opportunity)
```

### Memory Management

- Warnings older than 24 hours are automatically cleaned up
- Metrics use efficient data structures for time-window queries
- Validation failures don't prevent opportunity processing

### Batch Processing

For large datasets, consider batch validation:

```python
async def validate_opportunities_batch(opportunities: List[Dict]) -> List[List[ValidationWarning]]:
    \"\"\"Validate multiple opportunities efficiently.\"\"\"
    tasks = [validator.validate_opportunity(opp) for opp in opportunities]
    return await asyncio.gather(*tasks)
```

## Error Handling

### Graceful Degradation

The validation pipeline is designed to never fail operations:

```python
try:
    warnings = await validator.validate_opportunity(opportunity)
    opportunity[\"validationWarnings\"] = [w.to_dict() for w in warnings]
except Exception as e:
    logger.error(f\"Validation failed: {e}\")
    opportunity[\"validationWarnings\"] = []  # Empty list on error
    # Continue processing...
```

### Error Categories

1. **Import Errors**: Validation modules not available
2. **Runtime Errors**: Validation logic failures
3. **Data Errors**: Malformed opportunity data

All errors are logged but don't interrupt the main data flow.

## Future Enhancements

### Planned Features

1. **Custom Validation Rules**: User-defined validation logic
2. **Severity Levels**: Different warning severities (LOW, MEDIUM, HIGH, CRITICAL)
3. **Validation History**: Long-term storage of validation metrics
4. **Real-time Alerts**: WebSocket notifications for critical validation failures
5. **Validation Profiles**: Different validation rules for different sports/markets

### Extension Points

The validation system is designed for easy extension:

```python
class ExtendedValidator(DataValidator):
    async def validate_opportunity(self, opportunity: Dict[str, Any]) -> List[ValidationWarning]:
        \"\"\"Extended validation with additional checks.\"\"\"
        # Run base validation
        warnings = await super().validate_opportunity(opportunity)
        
        # Add custom validation
        custom_warnings = await self._validate_custom_business_rules(opportunity)
        warnings.extend(custom_warnings)
        
        return warnings
```

## Troubleshooting

### Common Issues

1. **No Validation Warnings**: Check if validator is initialized properly
2. **High Warning Rates**: Review data sources for quality issues
3. **Missing Metrics**: Verify API endpoints are accessible

### Debug Commands

```bash
# Check validation health
curl http://localhost:8000/api/data/validation/health

# Get recent validation summary
curl http://localhost:8000/api/data/validation/summary?minutes=5

# Test PropFinder with validation
curl http://localhost:8000/api/propfinder/opportunities | jq '.data.opportunities[0].validationWarnings'
```

### Logging

Enable debug logging for detailed validation information:

```python
import logging
logging.getLogger('propollama.validation').setLevel(logging.DEBUG)
```