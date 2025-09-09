# Analytics Persistence System Documentation

## Overview

The Analytics Persistence System provides comprehensive historical tracking and analysis of EV (Expected Value) opportunities and arbitrage opportunities within the A1Betting platform. This system implements fire-and-forget persistence logic with automatic data aggregation, retention management, and background scheduling.

## Architecture

### Core Components

1. **Database Models** (`backend/models/analytics.py`)
   - `EVOpportunityHistory`: Tracks high-value EV opportunities (≥3%)
   - `ArbitrageHistory`: Tracks profitable arbitrage opportunities (≥1% profit)

2. **Persistence Service** (`backend/services/analytics_persistence_service.py`)
   - Fire-and-forget opportunity persistence
   - Daily statistics aggregation
   - Data retention and pruning

3. **API Routes** (`backend/routes/analytics_routes.py`)
   - RESTful endpoints for analytics data retrieval
   - Summary statistics and dashboard data

4. **Background Scheduler** (`backend/services/analytics_scheduler.py`)
   - Automated daily maintenance tasks
   - Configurable retention pruning
   - Integration helpers for PropFinder

## Database Schema

### EVOpportunityHistory Table

| Column | Type | Description | Index |
|--------|------|-------------|-------|
| id | Integer (PK) | Auto-incrementing primary key | ✓ |
| opp_hash | String(64) | SHA256 hash for deduplication | ✓ |
| sport | String(50) | Sport category (MLB, NBA, etc.) | ✓ |
| player | String(200) | Player name | - |
| market | String(100) | Betting market type | ✓ |
| line | Float | Betting line value | - |
| odds | Integer | Betting odds | - |
| ev_percent | Float | Expected value percentage | ✓ |
| ev_tier | String(20) | Tier classification (low/medium/high/premium) | ✓ |
| confidence | Float | Prediction confidence (0-1) | - |
| bookmaker | String(100) | Sportsbook name | ✓ |
| team | String(100) | Player's team | - |
| opponent | String(100) | Opposing team | - |
| detected_at | DateTime (UTC) | Discovery timestamp | ✓ |

**Indexes:**
- `ix_ev_opportunities_sport_market` (sport, market)
- `ix_ev_opportunities_detected_at` (detected_at)
- `ix_ev_opportunities_ev_tier` (ev_tier)
- `ix_ev_opportunities_hash` (opp_hash) - UNIQUE

### ArbitrageHistory Table

| Column | Type | Description | Index |
|--------|------|-------------|-------|
| id | Integer (PK) | Auto-incrementing primary key | ✓ |
| arb_hash | String(64) | SHA256 hash for deduplication | ✓ |
| sport | String(50) | Sport category | ✓ |
| market | String(100) | Betting market type | ✓ |
| profit_pct | Float | Arbitrage profit percentage | ✓ |
| books_json | Text | JSON array of bookmaker names | - |
| num_bookmakers | Integer | Count of participating bookmakers | ✓ |
| player | String(200) | Player name (optional) | - |
| team | String(100) | Team name (optional) | - |
| opponent | String(100) | Opposing team (optional) | - |
| line | Float | Betting line value (optional) | - |
| total_stake_required | Float | Total stake amount (optional) | - |
| detected_at | DateTime (UTC) | Discovery timestamp | ✓ |

**Indexes:**
- `ix_arbitrage_opportunities_sport_market` (sport, market)
- `ix_arbitrage_opportunities_detected_at` (detected_at)
- `ix_arbitrage_opportunities_profit_pct` (profit_pct)
- `ix_arbitrage_opportunities_hash` (arb_hash) - UNIQUE

## Configuration

### Environment Variables

```bash
# Analytics persistence configuration
EV_MIN_THRESHOLD=3.0                    # Minimum EV% for persistence (default: 3.0)
ARB_MIN_PROFIT_PCT=1.0                  # Minimum arbitrage profit% (default: 1.0)
ANALYTICS_RETENTION_DAYS_EV=90          # EV data retention period (default: 90)
ANALYTICS_RETENTION_DAYS_ARB=90         # Arbitrage data retention period (default: 90)
ANALYTICS_DAILY_MAINTENANCE_HOUR=2      # UTC hour for daily maintenance (default: 2)
```

### Thresholds and Classifications

#### EV Tier Classification
- **Low**: 3.0% ≤ EV < 5.0%
- **Medium**: 5.0% ≤ EV < 7.0%
- **High**: 7.0% ≤ EV < 10.0%
- **Premium**: EV ≥ 10.0%

#### Persistence Criteria
- **EV Opportunities**: EV ≥ 3.0% (configurable)
- **Arbitrage Opportunities**: Profit ≥ 1.0% (configurable)

## API Endpoints

### Analytics Health Check
```http
GET /api/analytics/health
```

**Response:**
```json
{
  "status": "healthy",
  "components": {
    "analytics_persistence": "operational",
    "database": "connected",
    "background_scheduler": "running"
  }
}
```

### Daily EV Statistics
```http
GET /api/analytics/daily-ev-stats?days=7
```

**Parameters:**
- `days` (optional): Number of days to retrieve (1-365, default: 7)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-15",
      "total_opportunities": 25,
      "avg_ev_percent": 6.8,
      "tier_counts": {
        "low": 8,
        "medium": 12,
        "high": 4,
        "premium": 1
      },
      "top_sports": [
        {"sport": "MLB", "count": 15},
        {"sport": "NBA", "count": 10}
      ]
    }
  ]
}
```

### Daily Arbitrage Statistics
```http
GET /api/analytics/daily-arb-stats?days=7
```

**Parameters:**
- `days` (optional): Number of days to retrieve (1-365, default: 7)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-15", 
      "total_opportunities": 12,
      "avg_profit_pct": 2.3,
      "total_books_involved": 36,
      "top_markets": [
        {"market": "Points", "count": 5},
        {"market": "Rebounds", "count": 4}
      ]
    }
  ]
}
```

### Summary Statistics (Dashboard)
```http
GET /api/analytics/summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ev": {
      "avg": 7.2,
      "pctHigh": 45.0,
      "tierCounts": {
        "low": 15,
        "medium": 22,
        "high": 8,
        "premium": 3
      }
    },
    "arbitrage": {
      "count24h": 18,
      "avgProfitPct24h": 2.1
    }
  }
}
```

### Data Pruning
```http
POST /api/analytics/prune
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ev_opportunities_deleted": 1250,
    "arbitrage_opportunities_deleted": 680,
    "retention_days_ev": 90,
    "retention_days_arb": 90
  }
}
```

## Service Integration

### Fire-and-Forget Persistence

The system is designed for non-blocking, fire-and-forget persistence:

```python
from backend.services.analytics_persistence_service import analytics_service

# EV opportunity persistence
await analytics_service.persist_ev_opportunity(EVOpportunityData(
    sport="MLB",
    player="Aaron Judge", 
    market="Home Runs",
    line=1.5,
    odds=-110,
    ev_percent=5.2,
    confidence=0.85,
    bookmaker="FanDuel"
))

# Arbitrage opportunity persistence  
await analytics_service.persist_arbitrage_opportunity(ArbitrageOpportunityData(
    sport="NBA",
    market="Points",
    profit_pct=2.3,
    bookmakers=["DraftKings", "BetMGM"],
    player="LeBron James",
    line=27.5
))
```

### Background Scheduler Integration

The analytics scheduler provides helper functions for easy integration:

```python
from backend.services.analytics_scheduler import (
    persist_ev_opportunity_if_qualified,
    persist_arbitrage_opportunity_if_qualified
)

# Helper functions automatically check thresholds
await persist_ev_opportunity_if_qualified(
    sport="MLB",
    player="Vladimir Guerrero Jr.",
    market="Hits", 
    line=2.5,
    odds=-105,
    ev_percent=4.8  # Will persist since ≥3%
)

await persist_arbitrage_opportunity_if_qualified(
    sport="NBA",
    market="Points",
    profit_pct=1.8,  # Will persist since ≥1%
    bookmakers=["FanDuel", "DraftKings", "BetMGM"]
)
```

## Background Processing

### Daily Maintenance Schedule

The analytics scheduler runs daily maintenance at 2 AM UTC (configurable):

1. **Data Pruning**: Remove records older than retention period
2. **Index Optimization**: Rebuild database indexes for performance
3. **Statistics Computation**: Pre-compute common aggregations
4. **Health Monitoring**: Check system component status

### Manual Maintenance Trigger

```python
from backend.services.analytics_scheduler import scheduler

# Trigger maintenance immediately
result = await scheduler.trigger_maintenance_now()
print(f"Maintenance result: {result['status']}")
```

## Deduplication Logic

### EV Opportunity Deduplication

EV opportunities are deduplicated using a SHA256 hash of:
- Sport
- Player name
- Market type  
- Line value
- Odds

Records with identical hashes within 1 hour are considered duplicates and skipped.

### Arbitrage Opportunity Deduplication

Arbitrage opportunities are deduplicated using a SHA256 hash of:
- Sport
- Market type
- Sorted bookmaker list
- Line value (if available)

Records with identical hashes within 1 hour are considered duplicates and skipped.

## Performance Considerations

### Database Optimization

1. **Indexes**: Strategic indexes on frequently queried columns
2. **Partitioning**: Date-based partitioning for large historical datasets
3. **Retention**: Automatic pruning to maintain manageable data volumes
4. **Connection Pooling**: Async connection pooling for high throughput

### Query Performance

- Daily statistics queries use date range indexes
- Sport and market filtering uses composite indexes
- Hash lookups for deduplication use unique indexes
- Aggregation queries are optimized for dashboard responsiveness

## Monitoring and Alerts

### Health Monitoring

The system provides comprehensive health monitoring:

```python
# Check system health
health = await analytics_service.get_health_status()

# Monitor background scheduler
scheduler_status = await scheduler.get_status()
```

### Performance Metrics

Key performance metrics tracked:

- Persistence throughput (ops/second)
- Query response times (p50, p95, p99)
- Database connection pool utilization
- Background task queue depth
- Data retention compliance

## Error Handling

### Graceful Degradation

The system is designed for graceful degradation:

1. **Database Connectivity**: Falls back to logging if database unavailable
2. **Background Tasks**: Retries with exponential backoff
3. **API Endpoints**: Returns cached data during service disruptions
4. **Data Integrity**: Validates all input data before persistence

### Error Categories

- **Validation Errors**: Invalid input data format
- **Constraint Violations**: Database constraint failures  
- **Performance Errors**: Query timeout or resource exhaustion
- **System Errors**: Database connectivity or service unavailability

## Testing

### Unit Tests

Comprehensive unit tests cover:

- Data model validation and constraints
- Persistence logic and deduplication
- Aggregation calculations
- Error handling and edge cases

### Integration Tests

Integration tests verify:

- API endpoint functionality
- Database transaction integrity
- Background scheduler operation
- Service component interaction

### Performance Tests

Performance tests validate:

- High-throughput persistence scenarios
- Large dataset aggregation queries
- Concurrent access patterns
- Memory usage and resource consumption

## Migration Guide

### Database Migration

The analytics tables are created via Alembic migration:

```bash
# Apply migration
alembic upgrade head

# Verify tables created
sqlite3 a1betting.db ".schema ev_opportunity_history"
sqlite3 a1betting.db ".schema arbitrage_history"
```

### Service Integration

To integrate analytics persistence into existing services:

1. Import the analytics service
2. Add persistence calls to opportunity detection logic
3. Configure threshold environment variables
4. Enable background scheduler in application startup

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure SQLAlchemy async extras installed
2. **Migration Failures**: Check database permissions and connectivity
3. **Performance Issues**: Monitor query execution plans and indexes
4. **Data Inconsistencies**: Verify deduplication logic and constraints

### Debug Commands

```bash
# Check analytics tables
sqlite3 a1betting.db "SELECT COUNT(*) FROM ev_opportunity_history;"
sqlite3 a1betting.db "SELECT COUNT(*) FROM arbitrage_history;"

# Monitor background tasks
curl http://localhost:8000/api/analytics/health

# Manual data pruning
curl -X POST http://localhost:8000/api/analytics/prune
```

## Future Enhancements

### Planned Features

1. **Real-time Streaming**: WebSocket support for live analytics updates
2. **Advanced Analytics**: Machine learning trend analysis and predictions
3. **Data Export**: CSV/JSON export capabilities for external analysis
4. **Alerting System**: Threshold-based alerting for exceptional opportunities
5. **Dashboard UI**: Interactive analytics dashboard with charting
6. **API Rate Limiting**: Enhanced rate limiting for analytics endpoints

### Scalability Improvements

1. **Horizontal Scaling**: Support for read replicas and sharding
2. **Caching Layer**: Redis-based caching for frequently accessed data
3. **Data Archival**: Cold storage for historical data beyond retention period
4. **Batch Processing**: Spark/Airflow integration for large-scale analytics

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Maintainer**: A1Betting Analytics Team