# A1Betting — Copilot Instructions (v2.0 - Production Architecture)

**Purpose:** Guide AI agents through A1Betting's sophisticated production architecture with unified services, modular components, and enterprise-grade patterns.

## 🚀 **Immediate Productivity Checklist**

- **Directory Discipline:** Backend commands from project root (`A1Betting7-13.2/`), frontend from `frontend/` subdirectory
- **Unified Services:** Use `backend/services/unified_*` (data_fetcher, cache_service, error_handler, logging, config)
- **Master Service Registry:** Frontend service management via `MasterServiceRegistry.getInstance()`
- **EV System:** Recently implemented comprehensive expected value calculations at `/api/ev/*`
- **PropFinder Integration:** Complete PropFinder clone with real data at `/api/propfinder/opportunities`
- **Sport Context:** Always pass sport parameter to avoid "Unknown" filtering: `mapToFeaturedProps(props, sport)`

## 🏗️ **Core Architecture Patterns**

### **1. Unified Services Architecture (CRITICAL)**
```python
# ✅ CORRECT - Use unified services with automatic backwards compatibility
from backend.services.unified_data_fetcher import unified_data_fetcher
from backend.services.unified_cache_service import unified_cache_service
from backend.services.unified_error_handler import unified_error_handler
from backend.services.unified_logging import unified_logging
from backend.services.unified_config import unified_config

# All unified services maintain original interfaces while providing enhanced functionality
data = await unified_data_fetcher.fetch_mlb_games(sport="MLB")
cached_result = unified_cache_service.get("key", default_value)
```

**Key Files:**
- `backend/services/unified_data_fetcher.py` - Consolidated data fetching (413 lines)
- `backend/services/unified_cache_service.py` - Unified caching interface (123 lines)
- `backend/services/unified_error_handler.py` - Comprehensive error handling (250+ lines)
- `backend/services/unified_logging.py` - Structured JSON logging (300+ lines)
- `backend/services/unified_config.py` - Environment-aware configuration (400+ lines)

### **2. Master Service Registry Pattern (Frontend)**
```typescript
// ✅ CORRECT - Frontend service management with health monitoring
import { MasterServiceRegistry } from "@/services/MasterServiceRegistry";

const registry = MasterServiceRegistry.getInstance();
const dataService = registry.getService('data');
const cacheService = registry.getService('cache');

// All services follow singleton pattern with health monitoring and metrics
```

**Key Features:**
- Singleton pattern for all core services
- Health monitoring and metrics collection
- Automatic service lifecycle management
- Graceful degradation for failed services

### **3. Modular Component Architecture (NEW)**
```tsx
// ✅ CORRECT - New modular pattern replacing monolithic structures
import { PropOllamaContainer } from "@/components/containers/PropOllamaContainer";
import { usePropOllamaState } from "@/hooks/usePropOllamaState";

// Components follow specialized concerns pattern
<PropOllamaContainer gameId={gameId} sport={sport}>
  <PropFilters />
  <PropSorting />
  <PropList virtualized={props.length > 100} />
  <BetSlipComponent />
</PropOllamaContainer>

// State management extracted to dedicated hooks
const { props, loading, filters, sorting } = usePropOllamaState(gameId);
```

**Component Breakdown Pattern:**
- `*Container.tsx` - Main orchestration component
- `*Types.ts` - Comprehensive type definitions
- `use*State.ts` - State management hooks
- `*Filters.tsx` - Filtering interfaces
- `*Sorting.tsx` - Sorting controls
- `*List.tsx` - Data display with virtualization
- `*Component.tsx` - Specialized business logic

### **4. EV Calculation System (Recently Implemented)**
```python
# ✅ CORRECT - Comprehensive EV calculations integrating all betting infrastructure
from backend.services.ev_calculation_service import ev_calculation_service

# Calculate EV for single bet
result = await ev_calculation_service.calculate_comprehensive_ev(
    bet_data=bet_data,
    bankroll=1000.0,
    method=EVCalculationMethod.ENSEMBLE
)

# Get EV-based recommendations
recommendations = await ev_calculation_service.get_ev_recommendations(
    sport="MLB",
    bankroll=1000.0,
    filter_criteria=EVFilterCriteria(min_ev=0.02)
)
```

**API Endpoints:**
- `POST /api/ev/calculate` - Single bet EV calculation
- `POST /api/ev/calculate-batch` - Batch EV calculations
- `POST /api/ev/recommendations` - EV-based betting recommendations
- `GET /api/ev/sports` - Available sports list
- `GET /api/ev/methods` - Available calculation methods
- `GET /api/ev/health` - Service health check

### **5. PropFinder Integration (Complete Implementation)**
```python
# ✅ CORRECT - Real PropFinder data with multi-bookmaker analysis
from backend.services.simple_propfinder_service import get_simple_propfinder_service

# Get opportunities with Phase 1.2 multi-bookmaker fields
opportunities = await service.get_opportunities(
    sports=["MLB", "NBA"],
    confidence_min=60
)

# Response includes arbitrage detection and best bookmaker analysis
{
    "bestBookmaker": "FanDuel",
    "lineSpread": 0.5,
    "hasArbitrage": true,
    "arbitrageProfitPct": 2.67
}
```

**API Endpoint:** `GET /api/propfinder/opportunities`

## 🔧 **Essential Developer Workflows**

### **Directory Discipline (MANDATORY)**
```bash
# ✅ CORRECT Backend Operations (from project root)
cd A1Betting7-13.2/
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
pytest --verbose --tb=short

# ✅ CORRECT Frontend Operations (from frontend/)
cd A1Betting7-13.2/frontend/
npm run dev
npm run test
npm run type-check
```

### **Testing & Validation Patterns**
```bash
# Test EV system endpoints
curl -s http://127.0.0.1:8000/api/ev/health
curl -s http://127.0.0.1:8000/api/ev/sports
curl -s http://127.0.0.1:8000/api/ev/methods

# Test PropFinder integration
curl -s http://127.0.0.1:8000/api/propfinder/opportunities | head -c 500

# Health checks
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/diagnostics/health
```

### **Performance Optimization Standards**
```tsx
// Auto-virtualization for datasets >100 items
const useVirtualization = props.length > 100 || forceVirtualization;

return useVirtualization ? (
  <VirtualizedPropList
    props={props}
    fetchEnhancedAnalysis={fetchEnhancedAnalysis}
    enhancedAnalysisCache={enhancedAnalysisCache}
    loadingAnalysis={loadingAnalysis}
  />
) : (
  <StandardPropList props={props} />
);
```

```tsx
// React 19 concurrent features integration
const [isPending, startTransition] = useTransition();
const deferredQuery = useDeferredValue(searchQuery);

// Debounced search pattern (300ms optimal)
const debouncedSearch = useMemo(
  () => debounce(handleSearch, 300),
  [handleSearch]
);
```

## 🐛 **Common Troubleshooting Patterns**

### **Sport Context Issues (Most Common)**
```typescript
// ❌ WRONG - Results in sport="Unknown" and empty props
const featuredProps = enhancedDataManager.mapToFeaturedProps(props);

// ✅ CORRECT - Always pass sport parameter
const featuredProps = enhancedDataManager.mapToFeaturedProps(props, sport);
```

### **Backend-Frontend Connection Issues**
```bash
# Symptoms: "Cannot read properties of null (reading 'useReducer')" React error
# Root Cause: Vite proxy misconfiguration (port 8001 vs 8000 mismatch)
# Fix: Ensure frontend/vite.config.ts proxy targets port 8000
curl http://127.0.0.1:8000/health  # Should return {"status":"healthy"}
```

### **Modern ML Import Issues**
```python
# ✅ CORRECT - Use graceful fallbacks for optional dependencies
try:
    from backend.services.modern_ml_service import modern_ml_service
    result = await modern_ml_service.predict(request)
except ImportError:
    from backend.services.enhanced_prop_analysis_service import legacy_predict
    result = await legacy_predict(request)
```

### **Large Dataset Performance Issues**
```tsx
// Symptoms: Laggy scrolling, browser freezing with large MLB datasets
// Root Cause: All 3000+ DOM elements rendered simultaneously
// Fix: Auto-virtualization activates for datasets >100 props
console.log('DOM elements rendered:', document.querySelectorAll('[data-prop-card]').length);
// Should show ~10-20 for virtualized mode vs 3000+ for standard mode
```

## 📊 **Key Integration Points**

### **Real Data Sources (No Mock Data)**
```python
# ✅ CORRECT - Real MLB data sources
from backend.services.baseball_savant_client import BaseballSavantClient
from backend.services.mlb_stats_api_client import MLBStatsAPIClient

# All data flows through real APIs:
# - MLB Stats API (official MLB data)
# - Baseball Savant (advanced Statcast analytics)
# - pybaseball integration for comprehensive coverage
```

### **Error Handling Patterns**
```python
# ✅ CORRECT - Comprehensive error handling with user-friendly messages
from backend.services.unified_error_handler import unified_error_handler

try:
    result = await some_operation()
except Exception as e:
    error_response = unified_error_handler.handle_error(
        error=e,
        context="operation_name",
        user_context={"user_id": user_id, "operation": "data_fetch"}
    )
    return error_response
```

### **Caching Strategy**
```python
# ✅ CORRECT - Multi-tier caching with TTL and stale data
from backend.services.unified_cache_service import unified_cache_service

# Memory → LocalStorage → Redis fallback with stale data serving
cached_result = unified_cache_service.get("key", default_value)
```

## 🔍 **Key Files & Services Reference**

### **Backend Core Services**
- `backend/core/app.py` - FastAPI app factory with middleware stack
- `backend/main.py` - Development entry point
- `backend/services/ev_calculation_service.py` - Comprehensive EV calculations
- `backend/routes/ev_routes.py` - EV API endpoints
- `backend/services/simple_propfinder_service.py` - PropFinder data service
- `backend/routes/propfinder_routes.py` - PropFinder API endpoints

### **Frontend Core Components**
- `frontend/src/services/MasterServiceRegistry.ts` - Service lifecycle management
- `frontend/src/components/containers/PropOllamaContainer.tsx` - Modular container
- `frontend/src/hooks/usePropOllamaState.ts` - State management hooks
- `frontend/src/components/dashboard/PropFinderDashboard.tsx` - PropFinder UI
- `frontend/src/hooks/usePropFinderData.tsx` - PropFinder data integration

### **Configuration & Setup**
- `frontend/vite.config.ts` - Build configuration (port 8000 proxy critical)
- `backend/requirements.txt` - Python dependencies with optional ML libraries
- `frontend/package.json` - Node dependencies with TanStack Virtual
- `.env` - Environment variables for database URLs and API keys

## ⚡ **Performance & Production Patterns**

### **Lazy Loading & Code Splitting**
```tsx
// ✅ CORRECT - Lazy component loading with performance tracking
const LazyUserFriendlyApp = createLazyComponent(
  () => import('./components/user-friendly/UserFriendlyApp'),
  {
    fallback: () => <div className='text-white p-8'>Loading dashboard...</div>,
  }
);
```

### **WebSocket Integration**
```python
# ✅ CORRECT - Enhanced WebSocket with room-based subscriptions
from backend.routes.enhanced_websocket_routes import router as enhanced_ws_router
# Supports real-time updates, room-based subscriptions, and performance monitoring
```

### **Health Monitoring**
```python
# ✅ CORRECT - Comprehensive health checks
curl http://127.0.0.1:8000/api/diagnostics/health
curl http://127.0.0.1:8000/api/ev/health
curl http://127.0.0.1:8000/api/propfinder/opportunities
```

## 🎯 **Development Priorities**

### **Current Implementation Status**
- ✅ **EV Calculation System** - Complete with ensemble methods and API integration
- ✅ **PropFinder Integration** - Full clone with real data and arbitrage detection
- ✅ **Unified Services** - Consolidated architecture with backwards compatibility
- ✅ **Modular Components** - Moving from monoliths to specialized components
- 🟡 **Frontend EV Components** - Next priority for user interface integration
- 🟡 **Line-Change Alerts** - Real-time notification system
- 🟡 **Parlay Builder** - EV-optimized bet combinations

### **When to Ask for Human Review**
- Any change touching `backend/main.py`, database migrations, API schemas
- Introducing new native dependencies (PyTorch, XGBoost, etc.)
- Changes to unified services that might break backwards compatibility
- Modifications to EV calculation algorithms or PropFinder data flows
- Updates to core authentication or security middleware

## 📈 **Quick Reference Commands**

```bash
# Backend development (from project root)
python -m uvicorn backend.main:app --reload --port 8000
pytest --verbose --tb=short

# Frontend development (from frontend/)
npm run dev
npm run test
npm run type-check

# Test key integrations
curl http://127.0.0.1:8000/api/ev/health
curl http://127.0.0.1:8000/api/propfinder/opportunities
curl http://127.0.0.1:8000/health

# Performance monitoring
curl http://127.0.0.1:8000/api/diagnostics/health
```

---

**Last Updated:** August 28, 2025
**Architecture Version:** v2.0 - Production Architecture with Unified Services
**Key Patterns:** Unified Services, Modular Components, EV System, PropFinder Integration, Performance Optimization

*This guide captures A1Betting's sophisticated production patterns. For questions about specific implementations, reference the key files listed above.*