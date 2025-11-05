# Line Movement Tracking MVP Documentation

## Overview

The Line Movement Tracking system provides comprehensive monitoring and analysis of betting line changes over time. It features Redis-based time-series storage, automated snapshot recording, movement analysis with magnitude and volatility calculations, and REST API endpoints for querying movement data.

## Architecture

### Components

1. **Models** (`backend/models/line_movement.py`)
   - `LineSnapshot`: Individual line snapshot with timestamp
   - `MovementEvent`: Movement detection with magnitude and direction
   - `MovementStats`: Statistical analysis of line movements
   - `LineMovementResponse`: API response structure

2. **Service Layer** (`backend/services/line_movement_service.py`)
   - Redis-based time-series storage
   - Automatic fallback to in-memory storage
   - Movement calculation algorithms
   - Volatility scoring with standard deviation

3. **API Routes** (`backend/routes/line_movement_routes.py`)
   - RESTful endpoints for querying movements
   - Manual snapshot recording for testing
   - System health and metrics endpoints

4. **Metrics** (`backend/metrics/line_movement_metrics.py`)
   - Prometheus instrumentation
   - Performance tracking
   - System monitoring

## Data Storage

### Redis Schema

Line snapshots are stored as JSON arrays in Redis with the following key pattern:

```
line_movement:{sport}:{player}:{market}
```

**Example Key**: `line_movement:MLB:Aaron_Judge:HR`

**Data Structure**:
```json
[
  {
    "ts": "2024-01-15T14:30:00Z",
    "line": 2.5,
    "bestOdds": -110,
    "source": "odds_aggregation"
  },
  {
    "ts": "2024-01-15T15:00:00Z", 
    "line": 2.3,
    "bestOdds": -105,
    "source": "odds_aggregation"
  }
]
```

### Configuration

- **Max Snapshots**: 40 per line (configurable)
- **TTL**: 24 hours (configurable)
- **Cleanup**: Automatic background cleanup of expired keys

## API Endpoints

### Core Endpoints

#### GET `/api/lines/movement`

Get line movement analysis for a specific player-market combination.

**Parameters**:
- `sport` (required): Sport filter (e.g., MLB, NBA)
- `player` (required): Player name
- `market` (required): Market type (e.g., HR, Points)
- `limit` (optional): Maximum snapshots to return (default: 40)

**Response**:
```json
{
  "timeline": [
    {
      "ts": "2024-01-15T14:30:00Z",
      "line": 2.5,
      "bestOdds": -110
    }
  ],
  "movementMagnitude": 0.5,
  "direction": "up",
  "volatilityScore": 1.2,
  "lastUpdated": "2024-01-15T15:00:00Z",
  "snapshotCount": 12
}
```

#### POST `/api/lines/movement/snapshot`

Manually record a line movement snapshot (primarily for testing).

**Parameters**:
- `sport` (required): Sport abbreviation
- `player` (required): Player name  
- `market` (required): Market type
- `line` (required): Current betting line
- `best_odds` (required): Best available odds
- `source` (optional): Source identifier (default: "manual")

**Response**:
```json
{
  "status": "success",
  "message": "Snapshot recorded successfully",
  "movement_event": {
    "sport": "MLB",
    "player": "Aaron Judge",
    "market": "HR",
    "magnitude": 0.3,
    "direction": "up",
    "volatility_score": 0.8,
    "timestamp": "2024-01-15T15:00:00Z",
    "is_significant": true
  }
}
```

#### GET `/api/lines/movement/recent`

Get recent significant line movements across all tracked lines.

**Parameters**:
- `sport` (optional): Sport filter
- `hours_back` (optional): Hours to look back (default: 24)
- `min_magnitude` (optional): Minimum magnitude threshold (default: 0.5)
- `limit` (optional): Maximum results (default: 50)

**Response**:
```json
{
  "movements": [
    {
      "sport": "MLB",
      "player": "Aaron Judge",
      "market": "HR",
      "magnitude": 0.8,
      "direction": "down",
      "volatility_score": 2.1,
      "timestamp": "2024-01-15T15:00:00Z"
    }
  ],
  "total_found": 23,
  "returned": 23,
  "filters": {
    "sport": "MLB",
    "hours_back": 24,
    "min_magnitude": 0.5
  }
}
```

### Utility Endpoints

#### GET `/api/lines/movement/metrics`

Get current system metrics.

**Response**:
```json
{
  "total_snapshots": 1247,
  "high_volatility_events": 89,
  "active_tracked_lines": 156,
  "avg_snapshots_per_line": 8.2
}
```

#### GET `/api/lines/movement/health`

Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "redis_connected": true,
  "fallback_mode": false,
  "active_tracked_lines": 156,
  "total_snapshots": 1247,
  "service_available": true
}
```

#### GET `/api/lines/movement/config`

Get current configuration settings.

**Response**:
```json
{
  "max_snapshots_per_line": 40,
  "volatility_threshold": 1.0,
  "magnitude_threshold": 0.25,
  "snapshot_ttl_hours": 24,
  "redis_key_prefix": "line_movement",
  "sample_redis_key": "line_movement:MLB:Aaron_Judge:HR"
}
```

### Convenience Endpoints

#### GET `/api/lines/movement/player/{sport}/{player}`

Get all movements for a specific player across all markets.

#### GET `/api/lines/movement/market/{sport}/{market}`

Get all movements for a specific market across all players.

## Movement Analysis

### Magnitude Calculation

Movement magnitude is calculated as the absolute difference between the earliest and latest line values:

```
magnitude = |latest_line - earliest_line|
```

### Direction Detection

Direction is determined by comparing the latest line to the earliest line:

- **"up"**: Latest line > Earliest line
- **"down"**: Latest line < Earliest line  
- **"flat"**: Latest line == Earliest line

### Volatility Scoring

Volatility is calculated as the standard deviation of all line values in the snapshot series:

```python
volatility_score = statistics.stdev([snapshot.line for snapshot in snapshots])
```

**Significance Thresholds**:
- High volatility: score > 1.0
- Significant movement: magnitude > 0.25

## Integration with Odds Aggregation

The line movement system automatically integrates with the odds aggregation service. When `OddsAggregationService.find_best_lines()` is called, it triggers line movement snapshots:

```python
# In odds_aggregation_service.py
await trigger_snapshot(
    sport=sport,
    player=player_name,
    market=market_type,
    line=best_line,
    best_odds=best_odds,
    source="odds_aggregation"
)
```

This ensures that line movements are automatically tracked whenever odds are aggregated from multiple sportsbooks.

## Prometheus Metrics

The system provides comprehensive Prometheus metrics for monitoring:

### Counters

- `line_movement_snapshots_total`: Total snapshots recorded
- `line_movement_high_volatility_total`: High volatility events detected

### Histograms

- `line_movement_volatility_score`: Distribution of volatility scores
- `line_movement_magnitude`: Distribution of movement magnitudes
- `line_movement_query_duration_seconds`: Query performance metrics

### Usage

```python
from backend.metrics.line_movement_metrics import LineMovementMetrics

# Record metrics
LineMovementMetrics.record_snapshot("MLB", "HR", "odds_api")
LineMovementMetrics.record_volatility_score("MLB", "HR", 1.5)
LineMovementMetrics.record_magnitude("MLB", "HR", "up", 0.8)
```

## Configuration

### Movement Configuration

```python
@dataclass
class MovementConfiguration:
    max_snapshots_per_line: int = 40
    volatility_threshold: float = 1.0
    magnitude_threshold: float = 0.25
    snapshot_ttl_hours: int = 24
    redis_key_prefix: str = "line_movement"
```

### Environment Variables

- `REDIS_URL`: Redis connection string (default: redis://localhost:6379)
- `LINE_MOVEMENT_MAX_SNAPSHOTS`: Override max snapshots per line
- `LINE_MOVEMENT_TTL_HOURS`: Override snapshot TTL

## Error Handling

### Fallback Strategy

The service implements graceful degradation:

1. **Primary**: Redis time-series storage
2. **Fallback**: In-memory storage with same API
3. **Logging**: All failures logged with context

### Error Scenarios

- **Redis Unavailable**: Automatic fallback to in-memory storage
- **Invalid Data**: Validation errors with structured responses
- **Network Issues**: Retry logic with exponential backoff

## Testing

### Running Tests

```bash
# Run all line movement tests
pytest tests/test_line_movement.py -v

# Run specific test classes
pytest tests/test_line_movement.py::TestLineMovementModels -v
pytest tests/test_line_movement.py::TestLineMovementService -v
pytest tests/test_line_movement.py::TestLineMovementAPI -v
```

### Test Coverage

The test suite covers:

- **Models**: Data validation and movement calculations
- **Service**: Redis operations and fallback behavior
- **API**: Endpoint functionality and error handling
- **Integration**: Complete workflow testing
- **Metrics**: Prometheus instrumentation

### Mock Testing

Tests use mocked Redis clients to ensure consistent behavior regardless of Redis availability:

```python
@pytest.fixture
async def mock_redis():
    mock_redis = AsyncMock()
    mock_redis.ping = AsyncMock(return_value=True)
    mock_redis.lrange = AsyncMock(return_value=[])
    return mock_redis
```

## Development Workflow

### Adding New Endpoints

1. Define route in `backend/routes/line_movement_routes.py`
2. Add service method in `LineMovementService`
3. Create corresponding tests
4. Update this documentation

### Performance Optimization

- Use Redis pipelining for bulk operations
- Implement query result caching
- Add database indexes for frequent queries
- Monitor metrics for performance degradation

### Debugging

Enable debug logging:

```python
import logging
logging.getLogger("propollama.line_movement").setLevel(logging.DEBUG)
```

Check Redis keys:
```bash
redis-cli keys "line_movement:*"
redis-cli lrange "line_movement:MLB:Aaron_Judge:HR" 0 -1
```

## Production Considerations

### Scaling

- **Redis Cluster**: For high-volume scenarios
- **Sharding**: Distribute by sport or time period
- **Caching**: Add application-level caching for frequent queries

### Monitoring

- Set up Prometheus alerts for high volatility events
- Monitor Redis memory usage and key expiration
- Track API response times and error rates

### Backup

- Configure Redis persistence (RDB/AOF)
- Implement data export functionality for archival
- Regular backup verification procedures

## Changelog

### v1.0.0 (MVP)

- Redis-based time-series storage
- Movement analysis with magnitude/direction/volatility
- REST API endpoints for querying movements
- Prometheus metrics integration
- Automatic integration with odds aggregation
- Comprehensive test suite
- Fallback to in-memory storage

### Future Enhancements

- **v1.1**: WebSocket real-time updates
- **v1.2**: Alert system for significant movements  
- **v1.3**: Historical data export/import
- **v1.4**: Machine learning-based movement prediction

## Support

For issues or questions:

1. Check the test suite for usage examples
2. Review API endpoint documentation
3. Check Prometheus metrics for system health
4. Enable debug logging for detailed troubleshooting

## License

This line movement tracking system is part of the A1Betting platform and follows the same licensing terms.