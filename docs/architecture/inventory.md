# A1Betting Platform Architecture Inventory

**Generated:** August 13, 2025  
**Purpose:** Complete technical inventory for architecture fortification phases  
**Scope:** Backend modules, middleware, WebSocket, external integrations, observability  

---

## Phase 1 Step 5 Additions - Payload Safeguards

### New Components Added

**Middleware**: `backend/middleware/payload_guard.py`
- ASGI-level payload inspection middleware
- Size-based rejection with streaming body analysis  
- Content-type enforcement with route-specific overrides
- Structured error responses using error taxonomy
- Prometheus metrics integration

**Settings**: `backend/config/settings.py` (SecuritySettings)
- `max_json_payload_bytes`: 256KB default, configurable 1KB-10MB
- `enforce_json_content_type`: Boolean flag for content-type enforcement  
- `allow_extra_content_types`: Comma-separated list of additional allowed types
- `payload_guard_enabled`: Master enable/disable switch

**Tests**: `tests/security/test_payload_guard.py`
- Comprehensive test coverage for all scenarios
- Size limit enforcement validation
- Content-type rejection testing
- Metrics integration verification

---

## 1. MODULE MAP

### 1.1 Core Application Structure
```
backend/
├── core/                    # FastAPI app factory & core utilities
│   ├── app.py              # THE ONLY app creation entry point
│   ├── exceptions.py       # Core exception definitions
│   ├── exception_handlers.py # Centralized exception handling  
│   └── response_models.py  # Standardized response schemas
├── models/                 # Pydantic models & SQLAlchemy schemas
├── services/              # Business logic services (90+ files)
├── middleware/            # HTTP middleware stack (12+ files)
├── routes/                # API endpoint definitions (40+ files)  
├── tests/                 # Testing infrastructure
└── ws.py                  # WebSocket handlers
```

### 1.2 Service Layer Architecture (90+ Files)
**Unified Services (Critical Architecture):**
- `unified_data_fetcher.py` - Consolidated external data fetching
- `unified_cache_service.py` - Multi-tier caching with TTL
- `unified_error_handler.py` - Comprehensive error classification
- `unified_logging.py` - Structured JSON logging with performance tracking  
- `unified_config.py` - Environment-aware configuration

**ML/AI Services (Modern Architecture):**
- `modern_ml_service.py` - Core ML orchestration
- `advanced_bayesian_ensemble.py` - Uncertainty quantification
- `automated_feature_engineering.py` - Sports-specific feature extraction
- `mlops_pipeline_service.py` - MLOps pipeline management
- `comprehensive_prop_generator.py` - Enterprise prop generation

**External Integration Services:**
- `baseball_savant_client.py` - Statcast data integration
- `mlb_stats_api_client.py` - Official MLB data
- `comprehensive_sportradar_integration.py` - SportRadar APIs
- `ollama_service.py` - LLM integration for PropOllama

### 1.3 Model Definitions (15+ Files)
```
models/
├── api_models.py          # FastAPI request/response models
├── comprehensive_api_models.py # Enterprise API models
├── modern_architectures.py # ML model architectures
├── phase3_models.py       # MLOps models
├── user.py               # User authentication models
└── bet.py                # Betting domain models
```

### 1.4 Route Structure (40+ Files)
**Core API Routes:**
- `health.py` - Health check endpoints
- `metrics.py` - Prometheus metrics endpoints  
- `diagnostics.py` - System diagnostics
- `auth.py` - Authentication endpoints

**Business Logic Routes:**
- `propollama.py` - AI-enhanced prop analysis
- `mlb_extras.py` - MLB-specific endpoints
- `modern_ml_routes.py` - Modern ML API (12 endpoints)
- `phase3_routes.py` - MLOps API endpoints

---

## 2. MIDDLEWARE STACK ORDER

### 2.1 Current Middleware Registration Order
```python
# From backend/core/app.py - create_app() function:

1. CORSMiddleware (FastAPI built-in)
   - Origins: ["http://localhost:5173", "http://localhost:8000"]
   - Allow credentials: True
   - Allow methods: ["*"]  
   - Allow headers: ["*"]

2. StructuredLoggingMiddleware (Custom)
   - Request ID tracking with UUID generation
   - JSON structured logging format
   - Performance timing and categorization
   - Context variable propagation

3. PrometheusMetricsMiddleware (Custom) 
   - HTTP request/response metrics
   - WebSocket connection tracking
   - Business logic metrics
   - Graceful degradation if prometheus_client missing

4. Centralized Exception Handling
   - Registered via register_exception_handlers()
   - Standardized error responses
   - Request correlation in error logs
```

### 2.2 Middleware Files Inventory
```
middleware/
├── structured_logging_middleware.py  # Request tracking & JSON logs
├── prometheus_metrics_middleware.py  # Metrics collection  
├── comprehensive_middleware.py       # Legacy comprehensive middleware
├── security_middleware.py           # Security headers & controls
├── rate_limit.py                   # Rate limiting implementation
├── advanced_rate_limiting.py       # Advanced rate limiting features
├── caching.py                      # Response caching
├── error_handlers.py               # Error handling utilities
├── exception_handlers.py           # Exception mapping
├── metrics_middleware.py           # Legacy metrics (deprecated)
├── request_correlation.py          # Request correlation utilities
└── request_tracking.py             # Request lifecycle tracking
```

---

## 3. WEBSOCKET EVENT TYPES & CONTRACTS

### 3.1 WebSocket Handler Structure
**Primary Handler:** `backend/ws.py`
- Connection Manager pattern for multi-client support
- Standardized envelope pattern for all messages
- JSON message validation and error handling

### 3.2 WebSocket Envelope Pattern
```json
{
  "type": "MESSAGE_TYPE",
  "status": "success|error", 
  "timestamp": "2025-08-13T12:34:56Z",
  "data": { /* payload */ },
  "error": "error message if status=error"
}
```

### 3.3 WebSocket Event Types (Current Implementation)
```
Connection Events:
- connection_established: Sent on successful connection
- error: JSON parsing or processing errors

Business Events:  
- PREDICTION_UPDATE: Broadcast prediction updates to all clients

WebSocket Endpoints:
- /ws: Generic WebSocket endpoint
- /ws/{client_id}: Client-specific WebSocket endpoint  
```

### 3.4 WebSocket Testing
- Smoke tests: `backend/tests/smoke/websocket_envelope_smoke_tests.py`
- Envelope compliance validation
- Connection lifecycle testing

---

## 4. METRICS CURRENTLY EXPOSED

### 4.1 HTTP Metrics
```
Prometheus Metrics via PrometheusMetricsMiddleware:

# Request Metrics
http_requests_total{method, endpoint, status_code}
http_request_duration_seconds{method, endpoint} [histogram]
http_response_size_bytes{method, endpoint} [histogram]
http_requests_active [gauge]
http_errors_total{method, endpoint, error_type}

# Performance Buckets
Duration: [0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
```

### 4.2 WebSocket Metrics
```
# WebSocket Connection Metrics  
websocket_connections_total{endpoint}
websocket_connections_active{endpoint} [gauge]
websocket_messages_total{endpoint, direction, message_type}
websocket_connection_duration_seconds{endpoint} [summary]
```

### 4.3 Business Logic Metrics
```
# Sports Data Metrics
sports_requests_total{sport, data_type}
prediction_accuracy{model, sport} [histogram]

# Cache Performance Metrics
cache_operations_total{operation, result}

# ML Model Metrics
ml_inference_duration_seconds{model_name, sport} [histogram] 
external_api_duration_seconds{api_name, endpoint} [histogram]
```

### 4.4 Metrics Endpoints
- `/metrics` - Prometheus format metrics export
- `/api/metrics/summary` - Human-readable metrics summary
- `/api/health` - Health check with uptime statistics

---

## 5. EXTERNAL INTEGRATIONS

### 5.1 Database Integrations
**Primary Database:** SQLite (Development) / PostgreSQL (Production)
- Connection: Via SQLAlchemy with async support  
- Configuration: `backend/config.py` - BackendConfig class
- Migrations: Alembic integration
- Health checks: Built into `/api/health` endpoint

**Cache Database:** Redis (Optional)
- Connection: Via redis-py with async support
- Fallback: In-memory caching via unified_cache_service.py
- Configuration: Redis URL in environment variables

### 5.2 External Sports APIs
**MLB Official APIs:**
- MLB Stats API: `mlb_stats_api_client.py`
  - Endpoint: `http://statsapi.mlb.com/`
  - Authentication: Public API, no key required
  - Data: Official MLB games, standings, player stats

- Baseball Savant/Statcast: `baseball_savant_client.py`
  - Endpoint: `https://baseballsavant.mlb.com/`
  - Authentication: Public API, scraping-based
  - Data: Advanced Statcast metrics, pitch-by-pitch data

**Third-Party Sports Data:**
- SportRadar: `comprehensive_sportradar_integration.py`
  - Authentication: API key required (`SPORTRADAR_API_KEY`)
  - Configuration: Via BackendConfig.sportradar_api_key
  - Data: Multi-sport official data

- The Odds API: Configuration available
  - Authentication: API key required (`ODDS_API_KEY`)  
  - Configuration: Via BackendConfig.odds_api_key

**Betting Platform APIs:**
- PrizePicks: `comprehensive_prizepicks_service.py`
  - Authentication: Public API, no key required
  - Data: Prop betting lines and player projections

### 5.3 AI/ML Integration Endpoints
**Local LLM Integration:**
- Ollama: `ollama_service.py`
  - Default endpoint: `http://127.0.0.1:11434`
  - Configuration: BackendConfig.llm_endpoint
  - Models: Configurable, auto-detection available
  - Timeout: 30 seconds default

- LM Studio: Alternative LLM provider
  - Configuration: BackendConfig.llm_provider = "lmstudio"

**ML Model Inference:**
- Modern ML Service: `modern_ml_service.py`
  - Local model inference with torch/transformers
  - Graph Neural Networks: torch-geometric integration
  - MLFlow: Experiment tracking and model registry

### 5.4 Monitoring & Observability
**Metrics Collection:**
- Prometheus: Optional dependency with graceful fallback
  - Export endpoint: `/metrics`
  - Client library: prometheus_client

**Logging:**
- Structured JSON logging to console and files
- Log rotation: 10MB files, 5 backup copies
- Directory: `backend/logs/structured.log`

---

## 6. KNOWN ERROR PATTERNS

### 6.1 Current Error Handling Patterns
**Unified Error Handler:** `backend/services/unified_error_handler.py`
- Error classification: LOW, MEDIUM, HIGH, CRITICAL severity
- User-friendly message transformation
- Resolution suggestions and documentation links
- Integration with monitoring systems

### 6.2 Common Error Categories

**HTTP Errors:**
```
- 400 Bad Request: Invalid request data/format
- 401 Unauthorized: Missing or invalid authentication
- 404 Not Found: Resource not found  
- 422 Validation Error: Pydantic model validation failures
- 429 Too Many Requests: Rate limiting triggered (if enabled)
- 500 Internal Server Error: Unhandled exceptions
- 503 Service Unavailable: Dependency failures
```

**External API Errors:**
```
- Connection timeouts: HTTPX timeout after 30s default
- Rate limiting: SportRadar/MLB API rate limits  
- Data unavailability: Off-season or missing games
- Authentication failures: Invalid/expired API keys
```

**WebSocket Errors:**
```  
- JSON parsing errors: Invalid message format
- Connection drops: Client disconnections
- Message processing failures: Business logic errors
- Backpressure: Message queue overflows (not implemented)
```

**ML/AI Errors:**
```
- Model loading failures: Missing model files
- Inference timeouts: Long-running ML predictions
- Dependency missing: torch/transformers not available
- Memory errors: Large model loading on limited hardware
```

### 6.3 Error Response Envelope
**Standardized Error Format:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly error message"
  },
  "meta": {
    "request_id": "uuid-for-tracing",
    "timestamp": "2025-08-13T12:34:56Z"
  }
}
```

---

## 7. TESTING INFRASTRUCTURE

### 7.1 Test Structure
```
backend/tests/
├── conftest.py                        # Pytest configuration
├── smoke/                            # Smoke tests
│   └── websocket_envelope_smoke_tests.py
├── test_*.py                         # 25+ test files
└── integration_test_runner.py        # Integration test orchestration
```

### 7.2 Test Categories
**Unit Tests:** 25+ test files covering API endpoints, models, services
**Integration Tests:** `integration_test_runner.py` with 100% success rate
**Smoke Tests:** WebSocket envelope compliance validation
**Contract Tests:** API contract validation for HTTP/WebSocket

### 7.3 Test Infrastructure Tools
- **pytest:** Primary testing framework  
- **pytest-asyncio:** Async test support
- **pytest-cov:** Code coverage reporting
- **httpx:** Async HTTP client for API testing

---

## 8. CONFIGURATION & ENVIRONMENT

### 8.1 Configuration Management
**Primary Config:** `backend/config.py`
- Class: BackendConfig (Pydantic BaseSettings)
- Environment variable prefix: `A1BETTING_`
- Configuration validation and defaults
- Production safety checks

### 8.2 Critical Configuration Parameters
```python
# Application Settings
API_HOST: "0.0.0.0" 
API_PORT: 8000
DEBUG: False (production)
ENVIRONMENT: "development|production"

# Database Settings  
DATABASE_URL: Optional PostgreSQL connection string
POSTGRES_HOST/PORT/DB/USER/PASSWORD: Individual components

# External API Keys
SPORTRADAR_API_KEY: SportRadar authentication
ODDS_API_KEY: The Odds API authentication

# LLM Settings
LLM_PROVIDER: "ollama|lmstudio"
LLM_ENDPOINT: "http://127.0.0.1:11434"
LLM_TIMEOUT: 30 seconds

# Security
SECRET_KEY: Must be changed in production
JWT_ALGORITHM: "HS256"
JWT_EXPIRATION: 3600 seconds

# Feature Flags
ENABLE_SECURITY_HEADERS: True
ENABLE_RATE_LIMITING: True  
METRICS_ENABLED: True
```

---

## 9. CURRENT OBSERVABILITY STATE

### 9.1 Structured Logging
- **Implementation:** StructuredLoggingMiddleware with RequestIDLogger
- **Format:** JSON with automatic request ID correlation
- **Performance:** Response time categorization (fast/normal/slow/very_slow)
- **Context:** Request details, user agent, client IP, performance metrics

### 9.2 Metrics Collection
- **Implementation:** PrometheusMetricsMiddleware with graceful degradation
- **Coverage:** HTTP, WebSocket, business logic, ML inference metrics
- **Export:** Prometheus format at `/metrics` endpoint
- **Monitoring:** Active connection tracking, error rate monitoring

### 9.3 Health Monitoring
- **Primary endpoint:** `/api/health` with uptime and status
- **Metrics summary:** `/api/metrics/summary` for human-readable status
- **Integration status:** Automatic dependency health checking

---

## 10. IMMEDIATE ARCHITECTURE GAPS

### 10.1 Missing Error Taxonomy
- **Gap:** No centralized error code system (E1000_VALIDATION, E2000_DEPENDENCY, etc.)
- **Impact:** Inconsistent error reporting, difficult error analysis
- **Recommendation:** Implement unified error catalog in Phase 1

### 10.2 Rate Limiting Not Active  
- **Gap:** Rate limiting middleware exists but not integrated in app factory
- **Impact:** No protection against API abuse or DoS
- **Recommendation:** Activate rate limiting in Phase 1 security hardening

### 10.3 Input Validation Gaps
- **Gap:** No max payload size limits, no content-type enforcement
- **Impact:** Vulnerability to large payload attacks
- **Recommendation:** Implement request guards in Phase 1

### 10.4 WebSocket Robustness
- **Gap:** No backpressure handling, heartbeats, or sequence numbers
- **Impact:** Poor production reliability for real-time features  
- **Recommendation:** Implement in Phase 5 WebSocket robustness

### 10.5 Circuit Breakers Missing
- **Gap:** No circuit breaker pattern for external dependencies
- **Impact:** Cascade failures when external APIs are down
- **Recommendation:** Implement in Phase 4 resilience patterns

---

## 11. SUMMARY FOR PHASE PLANNING

### 11.1 Strong Foundation Elements
✅ **Standardized Response Envelopes:** `{success, data, error, meta}` pattern established  
✅ **Structured Logging:** Request ID tracking, JSON format, performance categorization  
✅ **Metrics Infrastructure:** Prometheus integration with graceful degradation  
✅ **WebSocket Envelope Pattern:** Consistent message format for real-time features  
✅ **Unified Services:** Consolidated data fetching, caching, error handling  
✅ **Modern ML Architecture:** Ready for advanced AI/ML integrations  

### 11.2 Critical Phase 1 Priorities
🔥 **Error Taxonomy:** Implement centralized error code system  
🔥 **Security Hardening:** Activate rate limiting, input validation, security headers  
🔥 **Request Guards:** Max payload size, content-type enforcement  
🔥 **API Contract Enforcement:** OpenAPI drift detection, breaking change protection  

### 11.3 Architecture Readiness Score
**Current State:** 75% ready for production hardening  
**Gaps:** Security controls, error standardization, resilience patterns  
**Strengths:** Observability, service architecture, testing infrastructure  

---

**Next Action:** Proceed to PHASE 1 Error & Security Hardening  
**Dependencies:** All discovery tasks completed, architecture gaps identified  
**Risk Assessment:** Low risk for Phase 1 implementation, strong foundation established
