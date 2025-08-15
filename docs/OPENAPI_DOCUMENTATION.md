# A1Betting OpenAPI Specification Documentation

## Overview

The A1Betting OpenAPI specification has been successfully generated for the consolidated API architecture implemented in Phase 5. This specification documents the unified API structure that replaces the previous fragmented route system.

## Key Features

### Phase 5 Consolidation Results
- **Route Reduction**: 60% reduction in route file complexity
- **Consolidated Files**: 3 unified API modules
  - `consolidated_prizepicks.py`: Unified PrizePicks integration
  - `consolidated_ml.py`: Machine learning and analytics
  - `consolidated_admin.py`: Administration and security
- **Legacy Deprecation**: Original route files marked as deprecated

### OpenAPI Specification Details
- **File**: `docs/openapi.json`
- **Version**: 2.0.0
- **Standard**: OpenAPI 3.1.0
- **Total Endpoints**: 11 core endpoints
- **HTTP Methods**: GET (10), HEAD (5), POST (1)

### API Organization

#### Tags Structure
1. **PrizePicks API**: Unified PrizePicks integration with multi-tier fallback strategy
2. **Machine Learning**: Consolidated ML API with SHAP explanations and uncertainty quantification  
3. **Admin & Security**: Unified admin API with authentication and security management
4. **Health**: System health and monitoring endpoints
5. **Core API**: Core application endpoints for props, predictions, and analytics
6. **WebSocket**: Real-time WebSocket connections
7. **Metrics**: Prometheus metrics and performance monitoring

#### Endpoint Prefixes
- `/api/v2/prizepicks/*`: PrizePicks API endpoints
- `/api/v2/ml/*`: Machine learning endpoints
- `/api/v2/admin/*`: Administration endpoints
- `/api/health`: Health check endpoints
- `/api/props`: Core props data
- `/api/predictions`: Prediction endpoints

### Security Features
- **Bearer Authentication**: JWT token support
- **API Key Authentication**: Header-based API key authentication
- **Security Headers**: HSTS, CSP, COOP, COEP protection
- **Rate Limiting**: Configurable request rate limits
- **Payload Validation**: JSON payload size and type enforcement

### Response Format Standardization
All API responses follow the standardized envelope format:
```json
{
  "success": boolean,
  "data": any,
  "error": object|null,
  "meta": object (optional)
}
```

### Fallback Strategies
The consolidated APIs implement intelligent fallback strategies:
1. **PrizePicks**: Enhanced service v2 → Production ML → Comprehensive service → Simple fallback
2. **ML**: SHAP explanations → Basic ML predictions
3. **Admin**: Enterprise security → Basic auth

## Usage

### Accessing the Specification
- **Interactive Docs**: Available at `/docs` when server is running
- **Raw JSON**: Available at `/docs/openapi.json`
- **Redoc**: Alternative documentation interface

### Development Integration
The OpenAPI specification can be used for:
- Client SDK generation
- API contract testing
- Documentation websites
- Integration testing
- Frontend development

## Phase 5 Completion Status

✅ **Phase 5.1**: Route consolidation analysis complete  
✅ **Phase 5.2**: Consolidated route files created  
✅ **Phase 5.3**: API documentation generated  
✅ **Phase 5.4**: OpenAPI specification complete  

The consolidated API architecture successfully reduces maintenance complexity while maintaining backward compatibility through intelligent fallback strategies.

## Next Steps

1. **Frontend Migration**: Update frontend integration to use consolidated endpoints
2. **Legacy Route Removal**: Remove deprecated route files after testing
3. **Performance Testing**: Validate consolidated endpoint performance
4. **Documentation Publishing**: Deploy OpenAPI documentation to production

## Troubleshooting

If you encounter issues with the OpenAPI specification:
1. Ensure all dependencies are installed
2. Check that the FastAPI app starts successfully
3. Verify consolidated route files are properly imported
4. Run `python generate_openapi.py` to regenerate the specification

The OpenAPI specification provides a complete reference for the A1Betting consolidated API architecture.
