# Model Inference Observability & Safe Shadow Rollout

**PR9 Implementation Documentation**

## Overview

This document describes the model inference observability system implemented in PR9, which provides comprehensive monitoring, auditing, and safe shadow rollout capabilities for machine learning models in the A1Betting platform.

## Architecture

### Core Components

The inference observability system consists of four main components:

1. **Model Registry** - Manages model versions and loading
2. **Inference Service** - Executes predictions with timing and shadow support  
3. **Inference Audit** - Records and aggregates inference metrics
4. **API Endpoints** - Provides REST access to observability data

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Model         │    │   Inference     │    │   Inference     │
│   Registry      │◄───│   Service       │───►│   Audit         │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REST API Endpoints                           │
│   /api/v2/models/predict                                       │
│   /api/v2/models/audit/summary                                 │
│   /api/v2/models/audit/recent                                  │
│   /api/v2/models/registry                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Model Registry

**Location:** `backend/services/model_registry.py`

The Model Registry manages:
- Active model version configuration
- Shadow model version configuration (optional)
- Available model versions listing
- Model loading stubs with metadata

**Environment Configuration:**
- `A1_ACTIVE_MODEL_VERSION`: Primary model version (default: "default_model_v1")
- `A1_SHADOW_MODEL_VERSION`: Shadow model version (optional)

**Key Functions:**
- `get_active_model_version()`: Returns current active model
- `is_shadow_mode_enabled()`: Checks if shadow differs from active
- `load_model(version)`: Loads model stub with metadata
- `list_available_versions()`: Returns all available models

### Inference Service

**Location:** `backend/services/inference_service.py`

The Inference Service provides:
- Primary model inference execution
- Shadow model inference (parallel execution)
- Timing and performance measurement
- Feature hashing for deterministic tracking
- Integration with tracing utilities

**Key Features:**
- **Deterministic Feature Hashing**: JSON canonicalization with SHA256 truncation
- **Shadow Mode Execution**: Non-blocking shadow inference when configured
- **Error Isolation**: Shadow failures don't affect primary inference
- **Request Correlation**: Integration with existing tracing system
- **Audit Recording**: Automatic recording of all inference results

**Inference Flow:**
1. Validate and hash input features
2. Load primary model and execute inference
3. If shadow enabled: Execute shadow inference in parallel
4. Calculate shadow diff if both predictions available
5. Record all data in audit system
6. Return structured prediction result

### Inference Audit

**Location:** `backend/services/inference_audit.py`

The Audit Service provides:
- **Ring Buffer Storage**: Configurable capacity (A1_INFERENCE_AUDIT_CAP, default: 1000)
- **Thread-Safe Operations**: asyncio.Lock protection for concurrent access
- **Real-time Aggregation**: Rolling statistics with caching
- **Drift Detection Metrics**: Shadow model comparison analytics

**Audit Entry Schema:**
```python
{
    "request_id": "uuid",
    "timestamp": 1234567890.123,
    "model_version": "enhanced_model_v2",
    "feature_hash": "abc123def456",
    "latency_ms": 45.2,
    "prediction": 0.75,
    "confidence": 0.85,
    "shadow_version": "experimental_v3",      # Optional
    "shadow_prediction": 0.72,                # Optional  
    "shadow_diff": 0.03,                      # Optional
    "shadow_latency_ms": 48.1,                # Optional
    "status": "success|error"
}
```

**Summary Metrics:**
- Rolling count of inferences
- Average latency and prediction mean
- Shadow drift metrics (avg/min/max difference)
- Confidence distribution histogram (5 bins)
- Success rate and error count

## Shadow Mode Semantics

### Activation

Shadow mode activates when:
1. `A1_SHADOW_MODEL_VERSION` environment variable is set
2. Shadow version differs from active version
3. Both models can be successfully loaded

### Execution Strategy

**Sequential Execution** (Current Implementation):
- Execute primary inference first
- Execute shadow inference after primary completes
- Log separate spans for each inference
- Continue if shadow fails

**Future Enhancement** (TODO):
- Parallel execution using asyncio.gather
- Non-blocking shadow execution
- Advanced error handling strategies

### Drift Detection

Shadow drift is measured by:
- **Absolute Difference**: `|primary_prediction - shadow_prediction|`
- **Rolling Average**: Exponential moving average of recent differences
- **Distribution Analysis**: Histogram of difference magnitudes
- **Outlier Detection**: Identification of high-variance predictions

### Safety Guarantees

- Shadow model failures never affect primary inference
- Shadow execution timeout prevents blocking
- Audit system continues operating if shadow unavailable
- Primary inference path remains unchanged

## API Endpoints

All endpoints are under `/api/v2/models/*` namespace:

### POST /api/v2/models/predict

Execute model inference with observability.

**Request:**
```json
{
  "features": {
    "feature1": 1.5,
    "feature2": "categorical_value",
    "feature3": true
  }
}
```

**Response:**
```json
{
  "prediction": 0.75,
  "confidence": 0.85,
  "model_version": "enhanced_model_v2",
  "request_id": "req-12345",
  "shadow_diff": 0.03
}
```

### GET /api/v2/models/audit/summary

Get aggregated audit metrics.

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
  "error_count": 5
}
```

### GET /api/v2/models/audit/recent?limit=100

Get recent inference audit entries.

**Response:** Array of audit entries (most recent first).

### GET /api/v2/models/registry

Get model registry information.

**Response:**
```json
{
  "available_versions": ["default_model_v1", "enhanced_model_v2", "experimental_v3"],
  "active_version": "enhanced_model_v2", 
  "shadow_version": "experimental_v3",
  "shadow_enabled": true
}
```

### GET /api/v2/models/health

Health check for inference system components.

## Frontend Integration

### Inference Audit Hook

**Location:** `frontend/src/inference/useInferenceAudit.ts`

Custom React hook providing:
- **Polling Data Fetching**: Configurable intervals (30s dev / 60s prod)
- **State Management**: Loading, error, and data states
- **Manual Refresh**: On-demand data updates
- **Polling Control**: Start/stop polling functionality

**Usage:**
```typescript
const {
  summary,
  recentEntries, 
  registryInfo,
  loading,
  error,
  refresh,
  togglePolling,
  isPolling
} = useInferenceAudit({
  pollingInterval: 30000,
  maxRecentEntries: 25,
  autoStart: true
});
```

### Inference Audit Panel

**Location:** `frontend/src/diagnostics/InferenceAuditPanel.tsx`

React component providing:
- **Model Information Display**: Active and shadow model versions
- **Performance Metrics**: Latency, success rate, total counts
- **Confidence Distribution**: Visual histogram of prediction confidence
- **Shadow Comparison**: Drift metrics and difference visualization
- **Recent Inferences Table**: Optional detailed view of recent predictions

**Features:**
- Real-time polling with visual indicators
- Error state handling with retry functionality
- Responsive design with Tailwind CSS
- Color-coded shadow differences for quick assessment

## Drift Indicators & Extension Roadmap

### Current Metrics (PR9)

**Basic Drift Detection:**
- Average shadow difference over rolling window
- Min/max difference bounds
- Simple confidence histogram binning
- Success rate monitoring

**Performance Monitoring:**
- Average inference latency
- Error rate tracking
- Request volume metrics

### Phase 2 Enhancements (Future)

**Advanced Statistical Tests:**
- **Kolmogorov-Smirnov Test**: Distribution shift detection
- **Population Stability Index (PSI)**: Feature drift measurement
- **Jensen-Shannon Divergence**: Prediction distribution comparison
- **Chi-Square Tests**: Categorical feature drift

**Enhanced Drift Metrics:**
- Time-series drift visualization
- Confidence interval monitoring
- Seasonal pattern detection
- Outlier identification algorithms

### Phase 3 Production Features (Future)

**Automated Response:**
- Drift threshold alerting
- Automatic shadow model promotion
- Rollback mechanisms
- Performance degradation detection

**Advanced Analytics:**
- Feature importance drift tracking
- Prediction bias analysis
- Model performance segmentation
- A/B testing framework integration

**Integration Extensions:**
- Slack/email notifications
- Grafana dashboard integration
- MLflow experiment tracking
- Custom webhook triggers

## Configuration Guide

### Environment Variables

```bash
# Model configuration
A1_ACTIVE_MODEL_VERSION=enhanced_model_v2     # Required
A1_SHADOW_MODEL_VERSION=experimental_v3       # Optional

# Audit configuration  
A1_INFERENCE_AUDIT_CAP=1000                   # Ring buffer size
```

### Deployment Considerations

**Development:**
- Use shorter polling intervals (30s)
- Enable recent table display for debugging
- Set smaller audit buffer for faster iteration

**Production:**
- Use longer polling intervals (60s) to reduce load
- Monitor audit buffer utilization
- Set up alerting for high error rates or drift

**Staging:**
- Test shadow mode with production data
- Validate drift detection thresholds
- Performance test with expected load

## Troubleshooting

### Common Issues

**Shadow Mode Not Activating:**
- Verify `A1_SHADOW_MODEL_VERSION` is set and differs from active
- Check that shadow model version exists in available models
- Review logs for shadow model loading errors

**High Memory Usage:**
- Reduce `A1_INFERENCE_AUDIT_CAP` if audit buffer grows too large
- Monitor ring buffer utilization via health endpoint
- Consider implementing disk-based audit storage for high volume

**Performance Impact:**
- Shadow inference adds latency - monitor primary inference timing
- Audit recording is minimal overhead but scales with volume
- Consider async audit recording for high-throughput scenarios

**Frontend Polling Issues:**
- Check API endpoint accessibility from frontend
- Verify CORS configuration allows inference API calls
- Monitor network request timing and failure rates

### Debugging Commands

```bash
# Check model registry status
curl http://localhost:8000/api/v2/models/registry

# Test inference endpoint
curl -X POST http://localhost:8000/api/v2/models/predict \
  -H "Content-Type: application/json" \
  -d '{"features": {"test": 1.0}}'

# Monitor audit summary
curl http://localhost:8000/api/v2/models/audit/summary

# Health check all components
curl http://localhost:8000/api/v2/models/health
```

## Testing

### Backend Tests

**Location:** `tests/test_inference_pr9.py`

Comprehensive test coverage for:
- Model registry functionality and environment configuration
- Feature hash determinism and order-insensitivity  
- Primary and shadow inference execution
- Audit buffer ring behavior and capacity limits
- Summary metric calculations and confidence histograms
- Error handling and failure isolation

### Frontend Tests  

**Location:** `frontend/src/tests/useInferenceAudit.test.ts`

Test coverage for:
- Hook state management and polling behavior
- API error handling and retry logic
- Data transformation and helper hooks
- Component rendering and user interactions

### Integration Tests

Run full integration testing:

```bash
# Backend tests
cd backend && python -m pytest tests/test_inference_pr9.py -v

# Frontend tests  
cd frontend && npm test -- useInferenceAudit.test.ts

# API endpoint testing
curl -X POST http://localhost:8000/api/v2/models/predict \
  -H "Content-Type: application/json" \
  -d '{"features": {"feature1": 1.0, "feature2": 2.0}}'
```

## Security Considerations

### PII Protection

- Feature hashes prevent exposure of sensitive input data
- Only hash values are logged, not raw features
- Audit entries exclude personally identifiable information
- Configurable hash truncation limits log verbosity

### Access Control

- Inference endpoints require standard API authentication
- Audit data access should be restricted to authorized users
- Model registry information may reveal deployment details
- Consider rate limiting for audit endpoint access

### Data Retention

- Ring buffer automatically limits data retention
- No persistent storage of inference history in current implementation
- Consider data privacy regulations for audit log retention
- Implement audit log cleanup for compliance requirements

---

*This documentation describes the PR9 implementation of model inference observability and safe shadow rollout capabilities. For questions or feature requests, please refer to the project issue tracker.*