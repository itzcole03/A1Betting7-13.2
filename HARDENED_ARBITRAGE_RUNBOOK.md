# Hardened Arbitrage Detection System - Operations Runbook

## Overview

The Hardened Arbitrage Detection System provides comprehensive arbitrage opportunity identification with advanced validation, anomaly detection, and configurable thresholds. This runbook covers configuration, monitoring, troubleshooting, and operational procedures.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Configuration Management](#configuration-management)
3. [Monitoring & Alerting](#monitoring--alerting)
4. [API Reference](#api-reference)
5. [Troubleshooting](#troubleshooting)
6. [Performance Optimization](#performance-optimization)
7. [Security Considerations](#security-considerations)
8. [Maintenance Procedures](#maintenance-procedures)

## System Architecture

### Core Components

1. **HardenedArbitrageService**: Main orchestration service
2. **HardenedArbitrageValidator**: Validation and anomaly detection
3. **ArbitrageMetrics**: Performance and operational metrics
4. **API Routes**: RESTful configuration and detection endpoints

### Validation Pipeline

```
Odds Data Input
    ↓
Parse & Structure
    ↓
Group by Market
    ↓
Detect Arbitrage Opportunities
    ↓
Implied Probability Validation
    ↓
Triangle Consistency Check (3+ books)
    ↓
Anomaly Detection
    ↓
Threshold Filtering
    ↓
Alerting Check
    ↓
Return Validated Opportunities
```

### Validation Stages

1. **Implied Probability Coverage**: Ensures total probability < 1.0 only when legitimate
2. **Triangle Consistency**: Cross-market validation for 3+ sportsbooks
3. **Anomaly Detection**: Identifies suspicious patterns and outliers
4. **Stale Odds Detection**: Flags outdated pricing data
5. **Threshold Filtering**: Applies configurable profit minimums

## Configuration Management

### Core Configuration Parameters

| Parameter | Default | Range | Description |
|-----------|---------|--------|-------------|
| `min_profit_pct` | 1.0 | 0.1-50.0 | Minimum profit percentage threshold (ARB_MIN_PROFIT_PCT) |
| `max_profit_pct` | 25.0 | 1.0-100.0 | Maximum realistic profit percentage |
| `alert_volume_threshold` | 10 | 1-100 | Alert if > X opportunities in time window |
| `alert_time_window_minutes` | 5 | 1-60 | Time window for volume alerting |
| `suspicious_profit_threshold` | 15.0 | 5.0-50.0 | Threshold for flagging suspicious profits |
| `stale_odds_threshold_seconds` | 300 | 30-3600 | Maximum age for odds data (5 minutes) |
| `min_books_for_validation` | 3 | 2-10 | Minimum sportsbooks for triangle validation |

### Configuration API Endpoints

#### Get Current Configuration
```bash
GET /api/arbitrage/config
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "min_profit_pct": 1.0,
    "max_profit_pct": 25.0,
    "alert_volume_threshold": 10,
    "alert_time_window_minutes": 5,
    "enable_anomaly_detection": true,
    "enable_triangle_validation": true,
    "enable_cross_market_validation": true,
    "stale_odds_threshold_seconds": 300,
    "min_books_for_validation": 3,
    "suspicious_profit_threshold": 15.0,
    "odds_outlier_z_score_threshold": 3.0,
    "volume_spike_threshold": 5.0,
    "last_updated": "2023-10-15T14:30:00Z"
  }
}
```

#### Update Configuration
```bash
POST /api/arbitrage/config
Content-Type: application/json

{
  "min_profit_pct": 2.0,
  "alert_volume_threshold": 15,
  "enable_anomaly_detection": false
}
```

### Configuration Change Procedures

1. **Emergency Threshold Adjustment**:
   ```bash
   # Increase minimum profit threshold during high volatility
   curl -X POST http://localhost:8000/api/arbitrage/config \
     -H "Content-Type: application/json" \
     -d '{"min_profit_pct": 3.0}'
   ```

2. **Disable Anomaly Detection** (troubleshooting):
   ```bash
   curl -X POST http://localhost:8000/api/arbitrage/config \
     -H "Content-Type: application/json" \
     -d '{"enable_anomaly_detection": false}'
   ```

3. **Adjust Alerting Sensitivity**:
   ```bash
   # Reduce alert frequency
   curl -X POST http://localhost:8000/api/arbitrage/config \
     -H "Content-Type: application/json" \
     -d '{"alert_volume_threshold": 20, "alert_time_window_minutes": 10}'
   ```

## Monitoring & Alerting

### Key Metrics

#### Performance Counters
- `arbitrage_opportunities_total`: Total opportunities detected
- `arbitrage_anomalies_total`: Anomalies flagged
- `arbitrage_threshold_adjustments_total`: Configuration changes
- `validation_failures_total`: Validation errors
- `triangle_consistency_checks_total`: Triangle validations performed
- `suspicious_profits_flagged_total`: High profit opportunities flagged

#### Operational Metrics
- `recent_opportunities`: Opportunities in last window
- `recent_alerts`: Alerts in last window
- `cache_size`: Internal cache utilization
- `alert_window_size`: Alert tracking buffer size

### Metrics API

```bash
GET /api/arbitrage/metrics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "counters": {
      "arbitrage_opportunities_total": 1247,
      "arbitrage_anomalies_total": 89,
      "arbitrage_threshold_adjustments_total": 12,
      "validation_failures_total": 5,
      "triangle_consistency_checks_total": 892,
      "suspicious_profits_flagged_total": 23
    },
    "recent_opportunities": 15,
    "recent_alerts": 2,
    "timestamp": "2023-10-15T14:30:00Z"
  }
}
```

### Volume-Based Alerting

The system automatically emits internal log events when arbitrage opportunity volume exceeds configured thresholds:

**Alert Trigger Conditions:**
- More than `alert_volume_threshold` opportunities detected within `alert_time_window_minutes`

**Alert Log Format:**
```json
{
  "alert_type": "arbitrage_volume_spike",
  "opportunity_count": 15,
  "time_window_minutes": 5,
  "threshold": 10,
  "avg_profit_pct": 2.34,
  "unique_books": 6,
  "timestamp": "2023-10-15T14:30:00Z"
}
```

### Health Monitoring

```bash
GET /api/arbitrage/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "config_loaded": true,
    "validator_ready": true,
    "metrics_available": true,
    "cache_size": 45,
    "alert_window_size": 12,
    "last_check": "2023-10-15T14:30:00Z"
  }
}
```

## API Reference

### Arbitrage Detection

#### Detect Arbitrage Opportunities
```bash
POST /api/arbitrage/detect
```

**Request Body:**
```json
{
  "odds_data": [
    {
      "book_id": "draftkings",
      "event_id": "game_123",
      "market_type": "moneyline",
      "outcome": "home",
      "odds": 2.1,
      "timestamp": "2023-10-15T14:30:00Z"
    },
    {
      "book_id": "fanduel",
      "event_id": "game_123",
      "market_type": "moneyline",
      "outcome": "away",
      "odds": 2.05,
      "timestamp": "2023-10-15T14:30:00Z"
    }
  ],
  "market_context": {
    "sport": "nfl",
    "league": "nfl",
    "game_time": "2023-10-15T17:00:00Z"
  }
}
```

**Query Parameters:**
- `include_anomalies`: Include opportunities with anomalies (default: false)
- `min_confidence`: Minimum confidence score (0.0-1.0, default: 0.0)

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "opportunities": [
      {
        "id": "harb_game_123_moneyline_1697375400",
        "detection_reason": "two_way_arbitrage",
        "books_involved": ["draftkings", "fanduel"],
        "event_id": "game_123",
        "market_type": "moneyline",
        "guaranteed_profit_pct": 2.34,
        "total_stake_required": 1000.0,
        "stake_distribution": {
          "draftkings": 488.37,
          "fanduel": 511.63
        },
        "expected_return": 23.40,
        "validation_result": {
          "is_valid": true,
          "confidence_score": 0.85,
          "anomaly_flags": [],
          "validation_notes": ["Valid arbitrage margin: 2.34%"],
          "implied_probability_sum": 0.9766,
          "triangle_consistency_score": null
        },
        "anomaly": false,
        "anomaly_types": [],
        "normalized_odds_snapshot_hash": "a1b2c3d4e5f6g7h8",
        "confidence_score": 0.85,
        "execution_risk_score": 0.25,
        "time_sensitivity_score": 0.45,
        "implied_probabilities": {
          "home": 0.4762,
          "away": 0.4878
        },
        "detection_timestamp": "2023-10-15T14:30:00Z",
        "expiry_timestamp": "2023-10-15T14:40:00Z",
        "market_conditions": {
          "sport": "nfl",
          "league": "nfl"
        },
        "execution_notes": []
      }
    ],
    "total_opportunities": 1,
    "filtered_by_threshold": 0,
    "detection_timestamp": "2023-10-15T14:30:00Z",
    "processing_time_ms": 45.2
  }
}
```

#### Validate Arbitrage Opportunity
```bash
POST /api/arbitrage/validate?profit_pct=2.5
```

Use for testing and validation of potential opportunities.

### Enhanced Arbitrage Feed Payload

The system provides extended arbitrage feed data with the following additional fields:

1. **detectionReason**: Reason for arbitrage detection (enum)
   - `implied_probability_gap`
   - `cross_market_inefficiency`
   - `two_way_arbitrage`
   - `three_way_arbitrage`
   - `triangle_arbitrage`

2. **booksInvolved**: Array of sportsbook identifiers participating in the arbitrage

3. **normalizedOddsSnapshotHash**: MD5 hash for tracking odds state across systems

4. **Enhanced Validation Data**:
   - `confidence_score`: Overall confidence (0.0-1.0)
   - `execution_risk_score`: Risk assessment (0.0-1.0)
   - `time_sensitivity_score`: Time criticality (0.0-1.0)
   - `anomaly_flags`: Array of detected anomaly types

## Troubleshooting

### Common Issues

#### 1. High False Positive Rate

**Symptoms:** Many arbitrage opportunities flagged with anomalies
```bash
# Check anomaly distribution
curl http://localhost:8000/api/arbitrage/metrics | jq '.data.counters'
```

**Solutions:**
1. Adjust anomaly detection thresholds:
   ```bash
   curl -X POST http://localhost:8000/api/arbitrage/config \
     -H "Content-Type: application/json" \
     -d '{"suspicious_profit_threshold": 20.0, "odds_outlier_z_score_threshold": 4.0}'
   ```

2. Temporarily disable anomaly detection:
   ```bash
   curl -X POST http://localhost:8000/api/arbitrage/config \
     -H "Content-Type: application/json" \
     -d '{"enable_anomaly_detection": false}'
   ```

#### 2. No Arbitrage Opportunities Detected

**Symptoms:** Empty opportunity lists despite market volatility

**Diagnostic Steps:**
1. Check configuration thresholds:
   ```bash
   curl http://localhost:8000/api/arbitrage/config | jq '.data.min_profit_pct'
   ```

2. Lower minimum profit threshold:
   ```bash
   curl -X POST http://localhost:8000/api/arbitrage/config \
     -H "Content-Type: application/json" \
     -d '{"min_profit_pct": 0.5}'
   ```

3. Test with sample data:
   ```bash
   curl -X POST http://localhost:8000/api/arbitrage/detect \
     -H "Content-Type: application/json" \
     -d '{
       "odds_data": [
         {"book_id": "test1", "event_id": "test", "market_type": "test", "outcome": "home", "odds": 2.1},
         {"book_id": "test2", "event_id": "test", "market_type": "test", "outcome": "away", "odds": 2.05}
       ]
     }'
   ```

#### 3. Excessive Alerting

**Symptoms:** Too many volume alerts

**Solutions:**
1. Increase alert thresholds:
   ```bash
   curl -X POST http://localhost:8000/api/arbitrage/config \
     -H "Content-Type: application/json" \
     -d '{"alert_volume_threshold": 25, "alert_time_window_minutes": 10}'
   ```

2. Check alert history:
   ```bash
   curl http://localhost:8000/api/arbitrage/metrics | jq '.data.recent_alerts'
   ```

#### 4. Stale Odds Warnings

**Symptoms:** Many opportunities flagged with stale odds

**Solutions:**
1. Increase stale odds threshold:
   ```bash
   curl -X POST http://localhost:8000/api/arbitrage/config \
     -H "Content-Type: application/json" \
     -d '{"stale_odds_threshold_seconds": 600}'
   ```

2. Verify data source timestamps are current

#### 5. Triangle Validation Failures

**Symptoms:** Low triangle consistency scores

**Solutions:**
1. Increase minimum books requirement:
   ```bash
   curl -X POST http://localhost:8000/api/arbitrage/config \
     -H "Content-Type: application/json" \
     -d '{"min_books_for_validation": 4}'
   ```

2. Temporarily disable triangle validation:
   ```bash
   curl -X POST http://localhost:8000/api/arbitrage/config \
     -H "Content-Type: application/json" \
     -d '{"enable_triangle_validation": false}'
   ```

### Performance Issues

#### High Processing Time

**Diagnostic:**
```bash
# Check processing time in detection responses
curl -X POST http://localhost:8000/api/arbitrage/detect -d '...' | jq '.data.processing_time_ms'
```

**Solutions:**
1. Reduce validation complexity temporarily
2. Limit odds data size
3. Check system resources

#### Memory Usage

**Symptoms:** Increasing cache sizes

**Solutions:**
1. Check current cache size:
   ```bash
   curl http://localhost:8000/api/arbitrage/health | jq '.data.cache_size'
   ```

2. Service restart if memory usage excessive

### Log Analysis

#### Finding Arbitrage Alerts
```bash
# Search for volume alerts
grep -i "arbitrage_volume_spike" backend/logs/propollama.log

# Search for validation failures
grep -i "validation.*failed" backend/logs/propollama.log

# Search for configuration changes
grep -i "Updated arbitrage config" backend/logs/propollama.log
```

#### Log Patterns
- **Volume Alerts**: `Arbitrage volume alert: X opportunities in Y minutes`
- **Config Updates**: `Updated arbitrage config: {...}`
- **Validation Errors**: `Arbitrage validation failed: ...`
- **Service Health**: `Hardened arbitrage service is healthy`

## Performance Optimization

### Configuration Tuning

#### For High-Frequency Trading
```json
{
  "min_profit_pct": 0.5,
  "stale_odds_threshold_seconds": 60,
  "enable_triangle_validation": false,
  "alert_volume_threshold": 50
}
```

#### For Conservative Trading
```json
{
  "min_profit_pct": 2.0,
  "suspicious_profit_threshold": 10.0,
  "enable_anomaly_detection": true,
  "enable_triangle_validation": true
}
```

#### For Market Making
```json
{
  "min_profit_pct": 0.25,
  "max_profit_pct": 15.0,
  "stale_odds_threshold_seconds": 30,
  "volume_spike_threshold": 3.0
}
```

### Monitoring Performance

```bash
# Check recent opportunity volume
curl http://localhost:8000/api/arbitrage/metrics | jq '.data.recent_opportunities'

# Check processing efficiency
# Ratio of opportunities to total validations
curl http://localhost:8000/api/arbitrage/metrics | jq '.data.counters | .arbitrage_opportunities_total / .triangle_consistency_checks_total'

# Check anomaly rate
curl http://localhost:8000/api/arbitrage/metrics | jq '.data.counters | .arbitrage_anomalies_total / .arbitrage_opportunities_total'
```

## Security Considerations

### Configuration Security

1. **Access Control**: Ensure configuration endpoints are properly secured
2. **Audit Logging**: All configuration changes are logged
3. **Rate Limiting**: Implement rate limiting on configuration endpoints

### Data Privacy

1. **Sportsbook Information**: Ensure sportsbook identifiers don't expose sensitive data
2. **User Context**: Avoid logging personally identifiable information
3. **Market Data**: Respect data provider terms of service

### Operational Security

1. **Input Validation**: All odds data is validated before processing
2. **Error Handling**: Sensitive error details are not exposed to clients
3. **Resource Management**: Service implements DoS protection through input limits

## Maintenance Procedures

### Daily Maintenance

1. **Health Check**:
   ```bash
   curl http://localhost:8000/api/arbitrage/health
   ```

2. **Metrics Review**:
   ```bash
   curl http://localhost:8000/api/arbitrage/metrics > daily_metrics.json
   ```

3. **Log Review**:
   ```bash
   tail -n 100 backend/logs/propollama.log | grep -i arbitrage
   ```

### Weekly Maintenance

1. **Configuration Backup**:
   ```bash
   curl http://localhost:8000/api/arbitrage/config > config_backup_$(date +%Y%m%d).json
   ```

2. **Performance Analysis**:
   ```bash
   # Analyze opportunity detection rates
   # Review anomaly patterns
   # Check threshold effectiveness
   ```

3. **Alert History Review**:
   ```bash
   # Review alert frequency and accuracy
   # Adjust thresholds if needed
   ```

### Monthly Maintenance

1. **Threshold Optimization**:
   - Review profit threshold effectiveness
   - Analyze false positive rates
   - Optimize alerting parameters

2. **Validation Accuracy Review**:
   - Assess triangle validation effectiveness
   - Review anomaly detection accuracy
   - Calibrate suspicion thresholds

3. **System Performance Review**:
   - Check processing time trends
   - Review memory usage patterns
   - Optimize cache management

### Emergency Procedures

#### Service Degradation
1. Disable non-essential validations:
   ```bash
   curl -X POST http://localhost:8000/api/arbitrage/config \
     -H "Content-Type: application/json" \
     -d '{"enable_triangle_validation": false, "enable_anomaly_detection": false}'
   ```

2. Increase profit thresholds to reduce load:
   ```bash
   curl -X POST http://localhost:8000/api/arbitrage/config \
     -H "Content-Type: application/json" \
     -d '{"min_profit_pct": 5.0}'
   ```

#### False Alert Storm
1. Increase alert thresholds:
   ```bash
   curl -X POST http://localhost:8000/api/arbitrage/config \
     -H "Content-Type: application/json" \
     -d '{"alert_volume_threshold": 100, "alert_time_window_minutes": 30}'
   ```

#### Market Volatility
1. Increase suspicious profit threshold:
   ```bash
   curl -X POST http://localhost:8000/api/arbitrage/config \
     -H "Content-Type: application/json" \
     -d '{"suspicious_profit_threshold": 25.0, "max_profit_pct": 50.0}'
   ```

---

## Appendix

### Configuration Parameter Reference

| Parameter | Type | Default | Min | Max | Description |
|-----------|------|---------|-----|-----|-------------|
| min_profit_pct | float | 1.0 | 0.1 | 50.0 | ARB_MIN_PROFIT_PCT threshold |
| max_profit_pct | float | 25.0 | 1.0 | 100.0 | Maximum realistic profit |
| max_stake_per_opportunity | float | 10000.0 | 100.0 | 100000.0 | Maximum stake per arbitrage |
| alert_volume_threshold | int | 10 | 1 | 100 | Alert threshold count |
| alert_time_window_minutes | int | 5 | 1 | 60 | Alert time window |
| enable_anomaly_detection | bool | true | - | - | Enable anomaly detection |
| enable_triangle_validation | bool | true | - | - | Enable triangle validation |
| enable_cross_market_validation | bool | true | - | - | Enable cross-market validation |
| stale_odds_threshold_seconds | int | 300 | 30 | 3600 | Stale odds threshold |
| min_books_for_validation | int | 3 | 2 | 10 | Minimum books for validation |
| suspicious_profit_threshold | float | 15.0 | 5.0 | 50.0 | Suspicious profit threshold |
| odds_outlier_z_score_threshold | float | 3.0 | 1.0 | 5.0 | Z-score threshold for outliers |
| volume_spike_threshold | float | 5.0 | 2.0 | 10.0 | Volume spike multiplier |

### Detection Reason Types

- `implied_probability_gap`: Standard arbitrage from probability coverage < 1.0
- `cross_market_inefficiency`: Arbitrage from market inefficiencies
- `two_way_arbitrage`: Two-outcome arbitrage opportunity
- `three_way_arbitrage`: Three-outcome arbitrage opportunity
- `triangle_arbitrage`: Complex multi-market arbitrage
- `temporal_arbitrage`: Time-based arbitrage opportunity
- `statistical_arbitrage`: Statistical model-based arbitrage

### Anomaly Types

- `suspicious_profit_margin`: Profit margin too high to be realistic
- `odds_outlier`: Odds significantly different from consensus
- `stale_odds_detected`: Outdated odds data detected
- `unusual_book_combination`: Unlikely sportsbook pairing
- `rapid_odds_movement`: Odds changing too quickly
- `volume_anomaly`: Unusual betting volume patterns

### Sample Curl Commands

```bash
# Get health status
curl http://localhost:8000/api/arbitrage/health

# Get current configuration
curl http://localhost:8000/api/arbitrage/config

# Update minimum profit threshold
curl -X POST http://localhost:8000/api/arbitrage/config \
  -H "Content-Type: application/json" \
  -d '{"min_profit_pct": 2.0}'

# Test arbitrage detection
curl -X POST http://localhost:8000/api/arbitrage/detect \
  -H "Content-Type: application/json" \
  -d '{
    "odds_data": [
      {"book_id": "dk", "event_id": "game1", "market_type": "ml", "outcome": "home", "odds": 2.1},
      {"book_id": "fd", "event_id": "game1", "market_type": "ml", "outcome": "away", "odds": 2.05}
    ]
  }'

# Get metrics
curl http://localhost:8000/api/arbitrage/metrics
```

This runbook provides comprehensive operational guidance for the Hardened Arbitrage Detection System. Keep this document updated as the system evolves and new operational patterns emerge.