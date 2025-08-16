# Model Drift Monitoring and Calibration

**PR10 Implementation Documentation**

## Overview

This document describes the comprehensive model drift monitoring and calibration system implemented in PR10, which extends the inference observability platform with statistical drift detection, shadow model promotion readiness scoring, and outcome-based calibration analysis.

## Architecture

### Core Components

The drift monitoring system builds upon PR9's foundation with three main enhancements:

1. **DriftMonitor** - Statistical drift analysis with rolling windows
2. **Enhanced Audit Service** - Integrated drift metrics and schema versioning  
3. **Calibration System** - Outcome ingestion and accuracy assessment
4. **Readiness Scoring** - Automated shadow model promotion recommendations

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Inference     │    │   Drift         │    │   Calibration   │
│   Audit         │───►│   Monitor       │◄───│   System        │
│   Service       │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Enhanced API Endpoints                       │
│   /api/v2/models/audit/summary (extended)                     │
│   /api/v2/models/audit/status (new)                           │
│   /api/v2/models/outcomes (new)                               │
└─────────────────────────────────────────────────────────────────┘
```

## Drift Detection System

### Statistical Approach

The drift detection system employs a multi-window rolling analysis approach:

**Rolling Windows:**
- **w50**: Last 50 inferences (short-term trends)
- **w200**: Last 200 inferences (medium-term patterns)  
- **wall**: Full buffer (long-term stability)

**Key Metrics:**
- `mean_abs_diff`: Average absolute difference between primary and shadow predictions
- `pct_large_diff`: Percentage of differences exceeding configurable threshold (default: 0.15)
- `std_dev_primary`: Standard deviation of primary model predictions

### Status Classification

**NORMAL**: `mean_abs_diff < A1_DRIFT_WARN` (default: 0.08)
- System operating within expected parameters
- Low prediction variance between models
- Suitable for shadow model promotion consideration

**WATCH**: `A1_DRIFT_WARN ≤ mean_abs_diff < A1_DRIFT_ALERT` (default: 0.08-0.15)
- Moderate drift detected, requiring monitoring
- Increased prediction variance
- Shadow model promotion should be delayed

**DRIFTING**: `mean_abs_diff ≥ A1_DRIFT_ALERT` (default: ≥0.15)
- Significant drift detected, action required
- High prediction variance indicates model divergence
- Shadow model promotion blocked, investigation needed

### Configuration

Environment variables control drift detection sensitivity:

```bash
# Drift threshold configuration
A1_DRIFT_WARN=0.08      # Warning threshold (default: 0.08)
A1_DRIFT_ALERT=0.15     # Alert threshold (default: 0.15)

# Buffer and analysis configuration
A1_INFERENCE_AUDIT_CAP=1000    # Ring buffer size
```

## Shadow Model Readiness Scoring

### Scoring Algorithm

The readiness score provides automated recommendations for shadow model promotion:

```python
# Base readiness calculation
base_score = max(0.0, 1.0 - mean_abs_diff / A1_DRIFT_ALERT)

# Apply latency penalty if shadow is significantly slower
if avg_shadow_latency > avg_primary_latency * 1.25:
    penalty_factor = 0.8  # 20% penalty
else:
    penalty_factor = 1.0

final_score = base_score * penalty_factor
```

### Recommendation Logic

**PROMOTE**: Low drift + stable latency
- `mean_abs_diff < A1_DRIFT_WARN`
- No significant latency penalty
- High confidence in shadow model performance

**MONITOR**: Moderate drift or latency concerns  
- `A1_DRIFT_WARN ≤ mean_abs_diff < A1_DRIFT_ALERT`
- Or latency penalty applied
- Continue monitoring before promotion

**HOLD**: High drift detected
- `mean_abs_diff ≥ A1_DRIFT_ALERT`
- Model divergence indicates potential issues
- Shadow model not ready for promotion

### Readiness Score Interpretation

| Score Range | Recommendation | Interpretation |
|-------------|----------------|----------------|
| 0.90 - 1.00 | PROMOTE | Excellent performance, ready for production |
| 0.70 - 0.89 | MONITOR | Good performance, continue evaluation |
| 0.50 - 0.69 | MONITOR | Moderate concerns, extended monitoring needed |
| 0.00 - 0.49 | HOLD | Significant issues, promotion blocked |

## Calibration System

### Outcome Ingestion

The calibration system allows recording of observed outcomes for accuracy assessment:

**Workflow:**
1. Record prediction with `feature_hash` identifier
2. Later, record actual outcome via `/api/v2/models/outcomes`
3. System matches outcomes with predictions for error calculation
4. Aggregate metrics provide calibration assessment

### Calibration Metrics

**Mean Absolute Error (MAE):**
```python
mae = sum(|prediction - outcome|) / count_with_outcomes
```

**Distribution Buckets:**
Outcomes are categorized into quartiles for distribution analysis:
- `lt_0_25`: Outcomes < 0.25
- `lt_0_5`: Outcomes 0.25-0.5  
- `lt_0_75`: Outcomes 0.5-0.75
- `gte_0_75`: Outcomes ≥ 0.75

## API Endpoints

### POST /api/v2/models/outcomes

Record observed outcome for calibration analysis.

**Request:**
```json
{
  "feature_hash": "abc123def456",
  "outcome_value": 0.65
}
```

**Response:**
```json
{
  "success": true,
  "message": "Outcome recorded successfully for calibration analysis"
}
```

### GET /api/v2/models/audit/status

Get current drift status and alert information.

**Response:**
```json
{
  "drift_status": "NORMAL|WATCH|DRIFTING",
  "earliest_detected_ts": 1234567890.0,
  "last_update_ts": 1234567900.0,
  "sample_count": 150,
  "alert_active": false
}
```

### GET /api/v2/models/audit/summary (Enhanced)

Extended audit summary with drift, readiness, and calibration metrics.

**Response:**
```json
{
  "rolling_count": 1000,
  "avg_latency_ms": 45.2,
  "shadow_avg_diff": 0.08,
  "prediction_mean": 0.65,
  "confidence_histogram": {
    "0.0-0.2": 10,
    "0.2-0.4": 50,
    "0.4-0.6": 200,
    "0.6-0.8": 500,
    "0.8-1.0": 240
  },
  "shadow_enabled": true,
  "active_model": "enhanced_model_v2",
  "shadow_model": "experimental_v3",
  "success_rate": 0.99,
  "error_count": 5,
  "drift": {
    "mean_abs_diff": 0.08,
    "pct_large_diff": 0.12,
    "windows": {
      "w50": {
        "mean_abs_diff": 0.09,
        "pct_large_diff": 0.15,
        "std_dev_primary": 0.12,
        "sample_count": 50
      },
      "w200": {
        "mean_abs_diff": 0.085,
        "pct_large_diff": 0.13,
        "std_dev_primary": 0.11,
        "sample_count": 200
      },
      "wall": {
        "mean_abs_diff": 0.08,
        "pct_large_diff": 0.12,
        "std_dev_primary": 0.10,
        "sample_count": 1000
      }
    },
    "status": "WATCH",
    "thresholds": {
      "warn": 0.08,
      "alert": 0.15
    },
    "earliest_detected_ts": 1234567890.0
  },
  "readiness": {
    "score": 0.82,
    "recommendation": "MONITOR",
    "reasoning": "Moderate diff (0.080), continue monitoring",
    "latency_penalty_applied": false
  },
  "calibration": {
    "count": 25,
    "mae": 0.045,
    "buckets": {
      "lt_0_25": 6,
      "lt_0_5": 8,
      "lt_0_75": 7,
      "gte_0_75": 4
    }
  }
}
```

## Frontend Integration

### Enhanced useInferenceAudit Hook

The React hook now includes drift status and outcome recording capabilities:

```typescript
const {
  summary,           // Enhanced with drift/readiness/calibration
  recentEntries,
  registryInfo,
  driftStatus,       // New: Current drift status
  loading,
  error,
  refresh,
  recordOutcome      // New: Record observed outcomes
} = useInferenceAudit();
```

### InferenceAuditPanel Updates

The audit panel displays comprehensive drift information:

**Drift Status Section:**
- Color-coded status badge (NORMAL/WATCH/DRIFTING)
- Alert indicator with animation for DRIFTING state
- Sample count and status timing information

**Readiness Display:**
- Numeric readiness score (0-100%)
- Color-coded recommendation (PROMOTE/MONITOR/HOLD)
- Contextual reasoning for recommendation

**Visual Indicators:**
- Green: NORMAL status, PROMOTE recommendation
- Yellow: WATCH status, MONITOR recommendation  
- Red: DRIFTING status, HOLD recommendation

## Schema Versioning

### Audit Entry Versioning

PR10 introduces schema versioning for audit entries to support future enhancements:

**Version 1.1 Features:**
- Enhanced drift metrics integration
- Calibration system support
- Extended error handling

**Backward Compatibility:**
- Existing entries without `schema_version` default to "1.0"
- All new entries tagged with "1.1"
- Forward compatibility planned for future versions

## Performance Considerations

### Computational Complexity

**Incremental Aggregation:**
- Rolling sums and counts maintained incrementally: O(1) per inference
- Window calculations use efficient circular buffer access: O(window_size)
- Drift status updates only when thresholds crossed, minimizing overhead

**Memory Usage:**
- Fixed buffer size limits memory footprint (default: 1000 entries)
- Outcome store uses hash-based lookup for efficient calibration matching
- Automatic cleanup of expired calibration entries

**Optimization Guidelines:**
- Buffer size impacts memory and computation time
- Larger windows provide more stable statistics but increase calculation time
- Consider reducing polling frequency in production to minimize API load

## Deployment and Monitoring

### Production Configuration

**Recommended Settings:**
```bash
# Production drift thresholds
A1_DRIFT_WARN=0.05      # Stricter warning threshold
A1_DRIFT_ALERT=0.10     # Lower alert threshold for production

# Buffer optimization
A1_INFERENCE_AUDIT_CAP=2000    # Larger buffer for production volume
```

**Monitoring Integration:**
- Alert on `drift_status: "DRIFTING"` via `/api/v2/models/audit/status`
- Track readiness scores over time for promotion planning
- Monitor calibration MAE for accuracy degradation detection

### Troubleshooting

**Common Issues:**

**High Drift Alerts:**
- Check for recent model updates or data distribution changes
- Verify shadow model configuration and loading
- Review feature preprocessing pipeline consistency

**Low Readiness Scores:**
- Analyze prediction differences for systematic bias
- Check shadow model latency performance
- Validate shadow model input preprocessing

**Poor Calibration Metrics:**
- Ensure outcome recording matches prediction feature hashes
- Verify outcome value ranges and data quality
- Check for delays between prediction and outcome recording

## Future Enhancements

### Statistical Extensions

**Advanced Statistical Tests:**
- Kolmogorov-Smirnov test for distribution comparison
- Population Stability Index (PSI) for feature drift
- Statistical significance testing for drift detection

**Enhanced Calibration:**
- Confidence interval calibration assessment  
- Brier score for probabilistic predictions
- Reliability diagrams for calibration visualization

### Integration Extensions

**Alerting:**
- Slack/email notifications for drift alerts
- Webhook integration for custom alerting systems
- Integration with monitoring platforms (Grafana, DataDog)

**Automation:**
- Automatic shadow model promotion based on readiness scores
- Rollback mechanisms for poor-performing promotions
- A/B testing framework integration

## Security Considerations

### Data Privacy

- Feature hashes prevent exposure of sensitive input data
- Outcome values should be anonymized when possible
- Audit entries exclude personally identifiable information

### Access Control

- Outcome recording endpoint should require authentication
- Drift status information may reveal model performance details
- Consider role-based access for calibration metrics

---

*This documentation describes the PR10 implementation of model drift monitoring and calibration capabilities. For questions or feature requests, please refer to the project issue tracker.*