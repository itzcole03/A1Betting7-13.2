# Backend Refactoring Plan - Phase 2.2

## Current Issues Identified

### 1. Main.py "God Class" (1915 lines)
- Contains models, endpoints, middleware, caching, business logic
- Mixes concerns: API routes, data models, business logic, utilities
- Hard to maintain and test

### 2. Circular Dependencies
- Multiple try/except import blocks indicate circular dependency issues
- Services importing from each other in complex ways
- Mock implementations scattered throughout

### 3. Large Service Classes
- ModelService: 920+ lines
- UltraEnsembleEngine: 1366+ lines  
- UltraRiskManagementEngine: 1456+ lines
- DataSourceManager: 754+ lines

## Refactoring Strategy

### Phase 1: Extract Models (Priority: HIGH)
**Target:** `main.py` lines 434-576
- Move all Pydantic models to `models/api_models.py`
- Create separate files for different model categories:
  - `models/betting_models.py` - BettingOpportunity, ArbitrageOpportunity
  - `models/user_models.py` - UserProfileResponse, TokenResponse
  - `models/performance_models.py` - PerformanceStats, TransactionModel

### Phase 2: Extract Middleware (Priority: HIGH)
**Target:** `main.py` lines 244-321
- Move RateLimitMiddleware to `middleware/rate_limit.py`
- Move retry_and_cache decorator to `middleware/caching.py`
- Move request tracking to `middleware/request_tracking.py`

### Phase 3: Extract Business Logic (Priority: HIGH)
**Target:** `main.py` lines 322-420, 1696-1796
- Move calculation functions to `services/calculations.py`
- Move data fetching functions to `services/data_fetchers.py`
- Move internal business logic to `services/business_logic.py`

### Phase 4: Extract API Routes (Priority: MEDIUM)
**Target:** `main.py` lines 664-1885
- Group related endpoints into separate routers:
  - `routes/betting.py` - betting opportunities, arbitrage
  - `routes/performance.py` - performance stats, transactions
  - `routes/auth.py` - authentication endpoints
  - `routes/prizepicks.py` - prizepicks specific endpoints
  - `routes/analytics.py` - analytics and predictions
  - `routes/health.py` - health checks

### Phase 5: Resolve Circular Dependencies (Priority: HIGH)
- Create `services/interfaces.py` for abstract base classes
- Implement dependency injection pattern
- Use lazy imports where necessary
- Create service registry pattern

### Phase 6: Break Down Large Service Classes (Priority: MEDIUM)
- Split ModelService into smaller services
- Break down ensemble engines into focused components
- Extract common functionality into base classes

## Implementation Order

1. **Start with Models** - No dependencies, safe to extract
2. **Extract Middleware** - Minimal dependencies
3. **Extract Business Logic** - Depends on models
4. **Create Service Interfaces** - Foundation for dependency injection
5. **Extract API Routes** - Depends on services and models
6. **Resolve Circular Dependencies** - Final cleanup

## Success Criteria

- [ ] main.py reduced to <500 lines
- [ ] No circular import errors
- [ ] All tests pass
- [ ] Clear separation of concerns
- [ ] Easy to test individual components
- [ ] Improved maintainability

## Files to Create

### Models
- `models/api_models.py`
- `models/betting_models.py` 
- `models/user_models.py`
- `models/performance_models.py`

### Middleware
- `middleware/__init__.py`
- `middleware/rate_limit.py`
- `middleware/caching.py`
- `middleware/request_tracking.py`

### Services
- `services/__init__.py`
- `services/interfaces.py`
- `services/calculations.py`
- `services/data_fetchers.py`
- `services/business_logic.py`

### Routes
- `routes/__init__.py`
- `routes/betting.py`
- `routes/performance.py`
- `routes/auth.py`
- `routes/prizepicks.py`
- `routes/analytics.py`
- `routes/health.py`

## Testing Strategy

1. Extract one component at a time
2. Run tests after each extraction
3. Ensure no functionality is lost
4. Update imports incrementally
5. Maintain backward compatibility during transition 