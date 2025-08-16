# Enterprise Model Registry API Documentation

## Overview

The Enterprise Model Registry provides comprehensive ML model lifecycle management with performance monitoring, validation harness, and feature flag integration. It supports model versioning, status tracking (canary/stable/deprecated), automated validation, and intelligent model selection.

## Base URL

All endpoints are prefixed with `/api/models/enterprise`

## Core Features

- **Model Registry**: Centralized model metadata and version management
- **Performance Monitoring**: Real-time inference timing, success/failure counters, percentile computation (p50/p95/p99)
- **Validation Harness**: Automated nightly validation with regression detection
- **Feature Flags**: Dynamic model selection with A/B testing capabilities
- **Intelligent Selection**: Performance-based model selection with fallback mechanisms

## Authentication

All endpoints require authentication. Include your API key in the Authorization header:
```
Authorization: Bearer <your-api-key>
```

## Endpoints

### Model Registry Management

#### GET `/api/models/enterprise/registry`
List all registered models with optional filtering.

**Query Parameters:**
- `status` (optional): Filter by model status (`development`, `canary`, `stable`, `deprecated`, `retired`)
- `model_type` (optional): Filter by model type (`transformer`, `ensemble`, `traditional_ml`)
- `sport` (optional): Filter by sport (`MLB`, `NFL`, `NBA`, etc.)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "model_id": "mlb_model_a1b2c3d4",
      "name": "MLB Transformer v2.1",
      "version": "2.1.0",
      "model_type": "transformer",
      "status": "stable",
      "description": "Advanced MLB prop prediction model with BERT-based analysis",
      "sport": "MLB",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-20T14:45:00Z",
      "created_by": "ml_team",
      "deployment_target": "production",
      "feature_flag_id": "mlb_transformer_v2",
      "rollout_percentage": 75.0,
      "retention_days": 90
    }
  ]
}
```

#### GET `/api/models/enterprise/registry/{model_id}`
Get detailed information about a specific model.

**Path Parameters:**
- `model_id`: Unique model identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "model_id": "mlb_model_a1b2c3d4",
    "name": "MLB Transformer v2.1",
    "version": "2.1.0",
    "model_type": "transformer",
    "status": "stable",
    "description": "Advanced MLB prop prediction model with BERT-based analysis",
    "sport": "MLB",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-20T14:45:00Z",
    "created_by": "ml_team",
    "deployment_target": "production",
    "feature_flag_id": "mlb_transformer_v2",
    "rollout_percentage": 75.0,
    "retention_days": 90
  }
}
```

### Performance Monitoring

#### GET `/api/models/enterprise/registry/{model_id}/metrics`
Get comprehensive performance metrics for a model.

**Response:**
```json
{
  "success": true,
  "data": {
    "model_id": "mlb_model_a1b2c3d4",
    "total_inferences": 45892,
    "successful_inferences": 44156,
    "failed_inferences": 1736,
    "success_rate": 96.22,
    "average_timing_ms": 1247.5,
    "min_timing_ms": 234.1,
    "max_timing_ms": 8901.2,
    "percentiles": {
      "p50": 1156.7,
      "p95": 2890.4,
      "p99": 5234.8
    },
    "error_types": {
      "timeout_error": 892,
      "validation_error": 623,
      "model_error": 221
    },
    "last_updated": "2025-01-20T15:30:00Z"
  }
}
```

#### GET `/api/models/enterprise/registry/{model_id}/health`
Get comprehensive health status for a model.

**Response:**
```json
{
  "success": true,
  "data": {
    "model_id": "mlb_model_a1b2c3d4",
    "name": "MLB Transformer v2.1",
    "version": "2.1.0",
    "status": "stable",
    "health_status": "healthy",
    "total_inferences": 45892,
    "success_rate": 96.22,
    "average_timing_ms": 1247.5,
    "percentiles": {
      "p50": 1156.7,
      "p95": 2890.4,
      "p99": 5234.8
    },
    "error_types": {
      "timeout_error": 892,
      "validation_error": 623
    },
    "last_updated": "2025-01-20T15:30:00Z"
  }
}
```

#### POST `/api/models/enterprise/registry/{model_id}/inference`
Record inference timing and success/failure for performance monitoring.

**Query Parameters:**
- `timing_ms`: Inference timing in milliseconds (required)
- `success`: Whether inference was successful (default: true)
- `error`: Error message if failed (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Inference recorded successfully"
  }
}
```

### Validation and Testing

#### POST `/api/models/enterprise/validation/run`
Run validation tests for a specific model.

**Request Body:**
```json
{
  "model_id": "mlb_model_a1b2c3d4",
  "test_case_ids": ["mlb_basic_prediction", "mlb_edge_case_prediction"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "run_id": "validation_mlb_model_a1b2c3d4_1705751400",
    "status": "passed",
    "total_tests": 2,
    "passed_tests": 2,
    "failed_tests": 0,
    "error_tests": 0,
    "regression_detected": false,
    "regression_severity": "none"
  }
}
```

#### POST `/api/models/enterprise/validation/nightly`
Trigger nightly validation for all active models.

**Response:**
```json
{
  "success": true,
  "data": {
    "models_processed": 12,
    "results_summary": {
      "passed": 10,
      "failed": 1,
      "errors": 1,
      "regressions_detected": 0
    }
  }
}
```

#### GET `/api/models/enterprise/validation/history/{model_id}`
Get validation history for a model.

**Query Parameters:**
- `days`: Number of days to look back (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "model_id": "mlb_model_a1b2c3d4",
    "period_days": 30,
    "validation_runs": [
      {
        "run_id": "validation_mlb_model_a1b2c3d4_1705751400",
        "status": "passed",
        "started_at": "2025-01-20T02:00:00Z",
        "completed_at": "2025-01-20T02:05:30Z",
        "total_tests": 5,
        "passed_tests": 5,
        "failed_tests": 0,
        "regression_detected": false,
        "regression_severity": "none"
      }
    ]
  }
}
```

#### GET `/api/models/enterprise/validation/regression-report/{model_id}`
Get regression analysis report for a model.

**Query Parameters:**
- `days`: Number of days to analyze (default: 7)

**Response:**
```json
{
  "success": true,
  "data": {
    "model_id": "mlb_model_a1b2c3d4",
    "period_days": 7,
    "total_validation_runs": 7,
    "runs_with_regression": 0,
    "regression_rate": 0.0,
    "recent_regression_rate": 0.0,
    "trend": "stable",
    "last_validation": "2025-01-20T02:00:00Z",
    "severity_breakdown": {
      "high": 0,
      "medium": 0,
      "low": 0
    }
  }
}
```

### Utility Endpoints

#### GET `/api/models/enterprise/types`
Get available model types and statuses.

**Response:**
```json
{
  "success": true,
  "data": {
    "model_types": [
      "transformer",
      "ensemble", 
      "traditional_ml"
    ],
    "model_statuses": [
      "development",
      "canary",
      "stable",
      "deprecated",
      "retired"
    ]
  }
}
```

## Status Codes

- `200`: Success
- `400`: Bad Request (invalid parameters)
- `404`: Resource not found
- `500`: Internal Server Error
- `503`: Service unavailable

## Error Response Format

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "MODEL_NOT_FOUND",
    "message": "Model mlb_model_invalid not found",
    "details": null
  }
}
```

## Model Status Workflow

1. **Development**: New models start here, available for testing
2. **Canary**: Models ready for limited production testing (A/B testing)
3. **Stable**: Fully validated models for general production use
4. **Deprecated**: Models scheduled for retirement
5. **Retired**: Decommissioned models (cleaned up automatically)

## Feature Flag Integration

Models can be associated with feature flags for:
- **A/B Testing**: Gradual rollout of canary models
- **Performance-based Selection**: Automatic selection based on metrics
- **Fallback Systems**: Automatic fallback to stable models on failures

## Performance Monitoring

The system automatically tracks:
- **Inference Timing**: p50, p95, p99 percentiles
- **Success Rates**: Success/failure counters with error categorization
- **Health Status**: Overall model health assessment
- **Regression Detection**: Automated comparison with baseline performance

## Validation Harness

Automated testing includes:
- **Unit Tests**: Basic functionality validation
- **Integration Tests**: End-to-end workflow testing
- **Regression Tests**: Performance comparison with baselines
- **Performance Tests**: Load and stress testing
- **Smoke Tests**: Basic health checks

## Best Practices

1. **Register models** in `development` status initially
2. **Run validation** before promoting to `canary`
3. **Monitor performance metrics** during canary deployment
4. **Use feature flags** for gradual rollout
5. **Set appropriate retention policies** based on compliance requirements
6. **Monitor regression reports** for performance degradation

## Example Workflows

### Model Deployment Workflow

1. Register new model in development
2. Run comprehensive validation
3. Promote to canary with feature flag
4. Monitor performance and user feedback
5. Promote to stable for full rollout
6. Eventually deprecate and retire old versions

### Performance Monitoring Workflow

1. Record inference timings automatically
2. Monitor health dashboard
3. Set up alerts for performance degradation
4. Analyze regression reports
5. Take corrective action when needed

### A/B Testing Workflow

1. Deploy model as canary
2. Configure feature flag with rollout percentage
3. Monitor comparative performance
4. Gradually increase rollout or rollback
5. Promote successful models to stable