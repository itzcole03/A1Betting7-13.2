# AI Agent Instructions for A1Betting7-13.2

## 🏗️ Architecture Overview

**A1Betting7-13.2** is a production-ready sports analytics platform with AI-powered betting predictions. The system uses FastAPI + React with sophisticated caching, real-time ML predictions, and LLM integration.

**Key Entry Points:**

- Backend: `backend/main.py` → `production_integration.py` (production), `minimal_test_app.py` (dev/test)
- Frontend: `frontend/src/App.tsx` → `PropOllamaUnified.tsx` (main analytics interface)

**Critical Data Flow:**

1. SportRadar/TheOdds APIs → Redis cache → SQLite/PostgreSQL
2. Raw props → `EnhancedDataManager` → `FeaturedPropsService` → React components
3. ML predictions via `/api/unified/batch-predictions` with SHAP explanations

## 🔧 Essential Development Workflows

### Terminal Context (Critical)

```bash
# Backend (from root): python -m uvicorn backend.main:app --reload
# Frontend (from frontend/): npm run dev -- --port 8174
# Always check pwd - workspace has frontend/ and backend/ subdirectories
```

### Sport Context Bug Fix (Most Common Issue)

```typescript
// ❌ WRONG - Results in sport="Unknown" and empty props
const featuredProps = enhancedDataManager.mapToFeaturedProps(props);

// ✅ CORRECT - Always pass sport parameter
const featuredProps = enhancedDataManager.mapToFeaturedProps(props, sport);
```

### PropOllamaUnified Card Expansion Pattern

```tsx
const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
const expandedCardRef = useRef<HTMLDivElement>(null);

// Click-outside collapse (required pattern)
useEffect(() => {
  function handleClickOutside(event) {
    if (
      expandedCardRef.current &&
      !expandedCardRef.current.contains(event.target)
    ) {
      setExpandedRowKey(null);
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [expandedRowKey]);
```

## 📊 Data Sourcing & Handling Best Practices

### 1. Always Propagate Sport Context

- When mapping props, **always pass sport context**: `mapToFeaturedProps(props, sport)`
- Never rely on backend data to provide sport field - enforce in frontend mapping
- **Root cause of empty props:** Props with `sport: "Unknown"` get filtered out

### 2. EnhancedDataManager Cache Strategy

- LRU cache (1000 entries): 5min TTL for props, 10min for analysis
- Batch requests with 100ms window, deduplicate identical endpoint+params
- WebSocket real-time updates with auto-reconnection (max 5 attempts)

### 3. Batch Prediction Flow

- Frontend: Props array → `/api/unified/batch-predictions` POST
- Backend: Individual analysis → SHAP explanations → confidence scoring
- Failed predictions return original prop with error flag

### 4. Backend Service Patterns

```python
# All services async with structured logging
logger = logging.getLogger("propollama")

async def service_function():
    try:
        result = await external_api_with_fallback()
        return BetAnalysisResponse(...)
    except Exception as e:
        logger.error(f"Service error: {e}", exc_info=True)
        raise
```

### 5. Enhanced Data Validation & Error Handling

```typescript
// Use EnhancedDataValidator for all incoming sports data
const validationResult = dataValidator.validateSportsProp(rawData, sport, {
  source: "api_endpoint",
  timestamp: Date.now(),
});

if (validationResult.isValid && validationResult.data) {
  const featuredProps = enhancedDataManager.mapToFeaturedProps(
    validationResult.data,
    sport
  );
} else {
  validationResult.errors.forEach((error) => {
    enhancedLogger.warn(
      "DataManager",
      "validation",
      `${error.field}: ${error.message}`
    );
  });
}
```

### 6. Structured Logging & Monitoring

```typescript
// Use EnhancedLogger for all component logging with metadata
enhancedLogger.logApiRequest(endpoint, "GET", params, duration, "success", {
  sport: "MLB",
  cacheKey,
  dataSize: response.length,
});

// Error logging with context
enhancedLogger.error(
  "DataManager",
  "fetchData",
  "API request failed",
  {
    endpoint,
    params,
    retryAttempt: 2,
  },
  error
);
```

## 🐛 Common Troubleshooting Patterns

### Empty Props Display

- **Symptoms:** Console shows successful API calls but `visibleProjections: []`
- **Root Cause:** Props have `sport: "Unknown"` instead of correct sport
- **Fix:** Ensure `EnhancedDataManager.mapToFeaturedProps(props, sport)` receives sport parameter
- **Debug:** Check `[PropOllamaUnified]` logs for sport field values

### "At a Glance" Summary Issues

- **Problem:** Backend template text instead of betting recommendations
- **Solution:** Frontend must use `generateBettingRecommendation(proj)`, never `enhancedData.summary`

### MLB Props Empty/Error

- **Check:** Redis running, `alert_event` errors in backend logs
- **API Fallback:** SportRadar fails → TheOdds API → Redis cache

### Confidence Score Display

- **Backend:** Returns percentage (75)
- **Frontend:** Display as-is (75%), never multiply by 100

## 🚀 Performance & Production Patterns

### Caching & Performance

```tsx
// Enhanced analysis cache pattern - prevents duplicate API calls
const [enhancedAnalysisCache, setEnhancedAnalysisCache] = useState<
  Map<string, EnhancedPropAnalysis>
>(new Map());

const fetchEnhancedAnalysis = useCallback(
  async (proj: FeaturedProp) => {
    const cacheKey = `${proj.id}-${proj.player}-${proj.stat}`;
    const cached = enhancedAnalysisCache.get(cacheKey);
    if (cached) return cached;

    // Fetch and cache logic...
  },
  [enhancedAnalysisCache]
);
```

### Event-Driven Cache Invalidation

```typescript
// Smart cache invalidation based on data events
enhancedDataManager.invalidateCache({
  type: "sport_update",
  sport: "MLB",
  reason: "New game data available",
  timestamp: Date.now(),
  affectedKeys: ["mlb-props", "mlb-analysis"],
});
```

### Robust Fallback Mechanisms

```typescript
try {
  const data = await fetchFreshData(endpoint, params);
  return validateAndNormalize(data);
} catch (error) {
  // Graduated fallback: fresh → stale cache → legacy
  const staleData = getStaleData(cacheKey);
  if (staleData && staleData.qualityScore > 60) {
    return staleData;
  }
  return await fetchLegacyData(endpoint, params);
}
```

## 🔍 Debug Commands & Quick Reference

### Backend Development

```bash
# Start backend with reload
python -m uvicorn backend.main:app --reload --port 8000

# Test specific endpoints
curl -X POST "http://localhost:8000/api/sports/activate/MLB"
curl "http://localhost:8000/mlb/odds-comparison/?market_type=playerprops"

# Check logs
tail -f backend/logs/propollama.log | grep "batch-predictions"
```

### Frontend Development

```bash
# Start frontend (from frontend/ directory)
npm run dev -- --port 8174

# Run tests with coverage
npm run test -- --coverage --watchAll=false

# TypeScript check without build
npx tsc --noEmit
```

### Redis & Cache Management

```bash
# Check Redis connection
redis-cli ping
redis-cli keys "*mlb*"

# Monitor cache performance in browser console
console.log(enhancedDataManager.getMetrics());
```

## 📁 Key Files & Services

**Critical Backend Services:**

- `backend/services/EnhancedDataManager.ts` - Core data orchestration (1160+ lines)
- `backend/enhanced_propollama_engine.py` - LLM integration with Ollama
- `backend/services/mlb_provider_client.py` - SportRadar/TheOdds API integration
- `backend/production_integration.py` - Production app factory with middleware

**Essential Frontend Components:**

- `frontend/src/components/PropOllamaUnified.tsx` - Main analytics interface (1300+ lines)
- `frontend/src/services/unified/FeaturedPropsService.ts` - Prop data transformation
- `frontend/src/services/EnhancedDataValidator.ts` - Data validation with quality scoring
- `frontend/src/components/CondensedPropCard.tsx` - Card display with expansion logic

**Configuration & Setup:**

- `backend/main.py` - Production entry point
- `frontend/src/App.tsx` - React app initialization with routing
- `backend/requirements.txt` - Python dependencies (ML libraries, FastAPI, async drivers)
- `frontend/package.json` - Node dependencies (React 18, Vite, TypeScript)
