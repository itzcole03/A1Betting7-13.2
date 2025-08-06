# Copilot/AI Agent Instructions for A1Betting7-13.2

## Data Sourcing & Handling Best Practices

### 1. Always Propagate Sport Context

- When mapping or transforming props, always pass the sport context (`mapToFeaturedProps(props, sport)`).
- Never rely on backend data to provide the sport field; enforce it in the frontend mapping.

### 2. Cache Strategy

- Use EnhancedDataManager’s LRU cache for all prop and analysis data.
- Prefer event-driven or version-based invalidation for critical data (not just TTL).
- For batch predictions, cache partial results if backend fails.

### 3. Request Deduplication & Batching

- Use EnhancedDataManager to batch requests and deduplicate identical endpoint+params calls.
- For batch predictions, fallback to cached or partial results if backend is unavailable.

### 4. Data Normalization

- Normalize all incoming data: ensure stat, player, matchup, and sport fields are present and typed.
- Use TypeScript interfaces for all transformed data.
- Validate sport context at every mapping step.

### 5. Error Handling & Logging

- Use structured logs for all data fetches and transformations.
- On error, log endpoint, params, error type, and fallback action.
- Surface errors to the UI with actionable messages.

### 6. Testing & Debugging

- Run integration tests for all data flows (props fetch, batch predictions, cache hit/miss, error scenarios).
- Use provided debug console patterns and request flow commands for troubleshooting.

**Example: EnhancedDataManager Mapping**

```typescript
// Always pass sport context
const featuredProps = enhancedDataManager.mapToFeaturedProps(props, sport); // ✅
```

**Example: Error Handling**

```typescript
try {
  const data = await enhancedDataManager.fetchData(endpoint, params);
} catch (error) {
  console.error("[DataManager] Fetch failed:", { endpoint, params, error });
  // Fallback logic here
}
```

## Enhanced Data Validation & Handling (NEW)

### 1. **Comprehensive Data Validation**

- Use `EnhancedDataValidator` service for all incoming sports data
- Implement runtime type checking with quality scoring (0-100%)
- Validate fields: completeness, accuracy, consistency, timeliness
- Generate actionable error messages with suggested fixes

**Example: Data Validation**

```typescript
import { dataValidator } from "./services/EnhancedDataValidator";

const validationResult = dataValidator.validateSportsProp(rawData, sport, {
  source: "api_endpoint",
  timestamp: Date.now(),
});

if (validationResult.isValid && validationResult.data) {
  // Use validated data
  const validatedProp = validationResult.data;
} else {
  // Handle validation errors
  validationResult.errors.forEach((error) => {
    console.warn(`Validation error in ${error.field}: ${error.message}`);
  });
}
```

### 2. **Structured Logging & Monitoring**

- Use `EnhancedLogger` for all component logging with metadata
- Track performance metrics: response times, cache hit rates, data quality
- Categorize errors by type and endpoint for debugging
- Monitor slow queries and data quality trends

**Example: Structured Logging**

```typescript
import { enhancedLogger } from "./services/EnhancedLogger";

// API request logging
enhancedLogger.logApiRequest(endpoint, "GET", params, duration, "success", {
  sport: "MLB",
  cacheKey,
  dataSize: response.length,
});

// Data validation logging
enhancedLogger.logDataValidation(
  "batch",
  "MLB",
  totalRecords,
  validRecords,
  errorCount,
  averageQualityScore,
  processingTime
);

// Error with context
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

### 3. **Event-Driven Cache Invalidation**

- Implement smart cache invalidation based on data events
- Support invalidation types: `sport_update`, `prop_update`, `game_update`, `manual`
- Use cache warming for predicted data needs
- Monitor cache health and performance

**Example: Cache Invalidation**

```typescript
// Invalidate cache when sport data updates
enhancedDataManager.invalidateCache({
  type: "sport_update",
  sport: "MLB",
  reason: "New game data available",
  timestamp: Date.now(),
  affectedKeys: ["mlb-props", "mlb-analysis"],
});

// Warm cache for predicted needs
await enhancedDataManager.warmCache([
  {
    endpoint: "/api/mlb/props",
    params: { market_type: "playerprops" },
    sport: "MLB",
  },
  { endpoint: "/api/batch-predictions", sport: "MLB" },
]);
```

### 4. **Robust Fallback Mechanisms**

- Implement graduated fallback strategies: fresh data → stale cache → legacy mapping
- Use data quality scoring to determine acceptable fallback thresholds
- Track fallback usage for optimization opportunities
- Provide partial data recovery when possible

**Example: Fallback Strategy**

```typescript
try {
  // Primary data source
  const data = await fetchFreshData(endpoint, params);
  return validateAndNormalize(data);
} catch (error) {
  // Fallback 1: Stale cache data
  const staleData = getStaleData(cacheKey);
  if (staleData && staleData.qualityScore > 60) {
    enhancedLogger.warn(
      "DataManager",
      "staleDataFallback",
      "Using stale data due to API failure",
      { cacheAge: staleData.age }
    );
    return staleData;
  }

  // Fallback 2: Legacy data source
  return await fetchLegacyData(endpoint, params);
}
```

### 5. **Performance Monitoring & Analytics**

- Track detailed metrics: request timing, data quality, error rates
- Monitor cache performance and optimization opportunities
- Identify slow queries and bottlenecks
- Generate performance reports for optimization

**Example: Performance Monitoring**

```typescript
// Get comprehensive metrics
const metrics = enhancedDataManager.getMetrics();
console.log(`Cache hit rate: ${metrics.hitRate}%`);
console.log(`Avg data quality: ${metrics.enhancedMetrics.dataQualityScore}%`);
console.log(`Error rate: ${(metrics.errors / metrics.totalRequests) * 100}%`);

// Performance summary
const summary = enhancedLogger.getPerformanceSummary();
if (summary.slowQueriesCount > 5) {
  console.warn("High number of slow queries detected");
}
```

## Project Overview

**A1Betting7-13.2** is a production-ready, AI-powered sports analytics and betting platform with sophisticated ML predictions, real-time data processing, and conversational AI capabilities.

**Core Value:** Deliver explainable, confidence-scored sports prop recommendations through modern full-stack architecture.

## Critical Architecture Patterns

### **Backend (FastAPI, Async Python)**

- **Entry Points:** `backend/main.py` (prod), `backend/minimal_test_app.py` (dev/test)
- **API Layer:** `backend/routes/` - unified sports API, PropOllama LLM engine, admin routes
- **Service Layer:** `backend/services/` - all async with structured logging (`logging.getLogger("propollama")`)
- **LLM Integration:** `enhanced_propollama_engine.py` with Ollama models, fallback chains, context memory
- **ML Pipeline:** `enhanced_model_service.py`, SHAP explainability, ensemble predictions
- **Data Sources:** SportRadar/TheOdds APIs → Redis cache → SQLite/PostgreSQL
- **ETL:** `etl_mlb.py` + `mlb_feature_engineering.py` via `deploy_etl_production.sh`

### **Frontend (React 18, TypeScript, Vite)**

- **Main Components:** `PropOllamaUnified.tsx` (prop analysis), `PredictionDisplay.tsx` (game predictions)
- **Card Architecture:** CondensedPropCard → PropCard expansion with click-outside collapse
- **State:** Zustand global + local useState, incremental loading (`visiblePropsCount += 6`)
- **Data Flow:** Backend `/mlb/odds-comparison/` → EnhancedDataManager → FeaturedPropsService → PropOllamaUnified
- **UI Patterns:** Confidence color coding (80+=green, 60+=yellow, <60=red), expandable cards with `expandedCardRef`

### **EnhancedDataManager (Critical Service Layer)**

- **Purpose:** Intelligent caching, request deduplication, and data transformation layer
- **Location:** `frontend/src/services/EnhancedDataManager.ts`
- **Key Features:** LRU cache, batch request optimization, WebSocket real-time updates, sport context mapping
- **Critical Pattern:** `mapToFeaturedProps(props, sport)` - **ALWAYS pass sport context to avoid `sport: "Unknown"`**
- **Cache Strategy:** 5min TTL for props, 10min for analysis, automatic LRU eviction at 1000 entries
- **Request Deduplication:** Prevents duplicate API calls for same endpoint+params combination

## Essential Development Workflows

### **Terminal Context Awareness**

- **CRITICAL:** Always check `pwd` before commands - workspace has frontend/ and backend/ subdirectories
- **Never run redundant `cd` commands** - tools track current directory
- Backend tasks from root: `python -m uvicorn backend.main:app --reload`
- Frontend tasks from `frontend/`: `npm run dev` (port 8174)

### **PropOllamaUnified Component Architecture**

```tsx
// Core pattern: Condensed cards → expanded with enhanced analysis
const PropOllamaUnified = () => {
  // Sport activation → data fetch → batch predictions → consolidation
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);

  // Card expansion pattern with click-outside detection
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        expandedCardRef.current &&
        !expandedCardRef.current.contains(event.target)
      ) {
        setExpandedRowKey(null); // Collapse
      }
    }
  }, [expandedRowKey]);
};
```

### **Betting Recommendation Generation**

```tsx
// Frontend always controls summary generation to avoid backend template conflicts
const getStatsAndInsights = () => {
  if (enhancedData) {
    return {
      // ALWAYS use frontend generation, never enhancedData.summary
      summary: generateBettingRecommendation(proj),
      insights: enhancedData.insights.map(insight => ({...}))
    };
  }
};
```

### **Backend Service Patterns**

```python
# All services async with context logging
logger = logging.getLogger("propollama")

async def some_service_function():
    try:
        # Rate limiting, caching, fallback chains
        result = await external_api_with_fallback()
        return BetAnalysisResponse(...)  # Standardized response format
    except Exception as e:
        logger.error(f"Service error: {e}", exc_info=True)
        raise
```

## Critical Integration Points & Data Flow

### **MLB Data Pipeline**

- **API Chain:** SportRadar → TheOdds API fallback → Redis cache → SQLite/PostgreSQL
- **Enhanced Flow:** Raw API → EnhancedDataManager → sport context mapping → FeaturedPropsService → batch predictions
- **Grouping Logic:** `frontend/src/services/unified/FeaturedPropsService.ts` merges Over/Under totals by `event_id` + `stat_type`
- **Player Name Rule:** Never display "Over"/"Under" as player names - use event/team names for totals
- **Diagnostic:** Check console logs `[PropOllamaUnified]` for mapping debugging

### **Sport Field Mapping (Critical Fix)**

```typescript
// EnhancedDataManager.mapToFeaturedProps - ALWAYS pass sport context
private mapToFeaturedProps(props: any[], sport?: string): FeaturedProp[] {
  return props.map(prop => ({
    // ... other fields
    sport: prop.sport || sport || 'Unknown', // 🎯 THE CRITICAL FIX
  }));
}

// When calling from fetchSportsProps:
const featuredProps = this.mapToFeaturedProps(props, sport); // ✅ Correct
// NOT: this.mapToFeaturedProps(props); // ❌ Results in sport="Unknown"
```

### **Batch Prediction Flow**

- **Frontend:** Props array → `/api/unified/batch-predictions` POST → Enhanced props with ML features
- **Backend Processing:** Individual prop analysis → SHAP explanations → confidence scoring → response aggregation
- **Response Format:** `Array<EnhancedPrediction>` with quantum_confidence, neural_score, kelly_fraction, shap_explanation
- **Error Handling:** Failed predictions return original prop with error flag, successful continue processing

### **PropOllama LLM Engine**

- **Models:** `enhanced_propollama_engine.py` - llama3:8b, nomic-embed-text:v1.5, neuraldaredevil-8b
- **Context:** 10-message history, user preferences, conversation memory
- **Fallback Chain:** LLM → enhanced response generation → basic analysis
- **Analysis Types:** prop_analysis, strategy, explanation, general_chat, spread_analysis, total_analysis

### **Frontend State Architecture**

```tsx
// PropOllamaUnified.tsx state patterns
const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
const [enhancedAnalysisCache, setEnhancedAnalysisCache] = useState<
  Map<string, EnhancedPropAnalysis>
>(new Map());
const [sportActivationStatus, setSportActivationStatus] = useState<{
  [sport: string]: "ready" | "loading" | "error";
}>({});

// Sport activation → lazy loading pattern
useEffect(() => {
  // 1. Deactivate previous sport
  // 2. Activate new sport service
  // 3. Fetch props → batch predictions → consolidation
}, [selectedSport, propType]);
```

### **PropOllamaUnified Filtering Chain**

```tsx
// Critical filtering sequence - each step can cause empty results
const sortedProjections = useMemo(() => {
  // 1. Sport filtering (where sport="Unknown" gets filtered out)
  const sportFiltered = projections.filter(
    (p) => selectedSport === "All" || p.sport === selectedSport
  );

  // 2. Search filtering
  const searchFiltered = sportFiltered.filter(
    (p) =>
      searchTerm === "" ||
      (p.player && p.player.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.matchup && p.matchup.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 3. Sorting by confidence
  return searchFiltered.sort((a, b) => b.confidence - a.confidence);
}, [projections, sortBy, selectedSport, searchTerm]);

// Player consolidation to avoid duplicate cards
const consolidatedProjections = useMemo(() => {
  const playerMap = new Map();
  sortedProjections.forEach((proj) => {
    const playerKey = `${proj.player}-${proj.matchup}`;
    // Consolidation logic...
  });
  return Array.from(playerMap.values());
}, [sortedProjections]);

// Final visible slice
const visibleProjections = consolidatedProjections.slice(0, visiblePropsCount);
```

## Common Troubleshooting Patterns

### **"At a Glance" Summary Issues**

- **Problem:** Backend template text appearing instead of betting recommendations
- **Solution:** Frontend `getStatsAndInsights()` must use `generateBettingRecommendation(proj)`, never `enhancedData.summary`
- **Pattern:** `summary: generateBettingRecommendation(proj)` (not backend summary)

### **Props Not Displaying (Empty visibleProjections)**

- **Symptoms:** Console shows successful batch predictions but `visibleProjections: []`
- **Root Cause:** Props have `sport: "Unknown"` instead of correct sport (e.g., `sport: "MLB"`)
- **Debugging Chain:** Check logs for sport field in projections → sortedProjections → consolidatedProjections → visibleProjections
- **Fix:** Ensure `EnhancedDataManager.mapToFeaturedProps(props, sport)` receives sport parameter
- **Verification:** Props should have correct sport field before filtering: `prop.sport === selectedSport`

### **MLB Props Empty/Error**

- **Check:** Redis running, `alert_event` errors in backend logs
- **API Fallback:** SportRadar fails → TheOdds API → Redis cache
- **Required:** `MLBProviderClient.alert_event` for fallback logic

### **Confidence Score Display**

- **Backend:** Returns percentage (75)
- **Frontend:** Display as-is (75%), never multiply by 100
- **Issue:** If showing 7500% instead of 75%, check for double multiplication

### **Card Expansion Behavior**

```tsx
// Required pattern for click-outside collapse
const expandedCardRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (
      expandedCardRef.current &&
      !expandedCardRef.current.contains(event.target as Node)
    ) {
      setExpandedRowKey(null);
    }
  }
}, [expandedRowKey]);
```

## Advanced Development Patterns

### **Caching & Performance Patterns**

```tsx
// Enhanced analysis cache pattern - prevents duplicate API calls
const [enhancedAnalysisCache, setEnhancedAnalysisCache] = useState<Map<string, EnhancedPropAnalysis>>(new Map());
const [loadingAnalysis, setLoadingAnalysis] = useState<Set<string>>(new Set());

const fetchEnhancedAnalysis = useCallback(async (proj: FeaturedProp) => {
  const cacheKey = `${proj.id}-${proj.player}-${proj.stat}`;

  // Check cache first
  const cached = enhancedAnalysisCache.get(cacheKey);
  if (cached) return cached;

  // Prevent duplicate requests
  if (loadingAnalysis.has(cacheKey)) return null;

  // Mark as loading
  setLoadingAnalysis(prev => new Set(prev).add(cacheKey));

  try {
    const analysis = await enhancedPropAnalysisService.getEnhancedPropAnalysis(...);
    if (analysis) {
      setEnhancedAnalysisCache(prev => new Map(prev).set(cacheKey, analysis));
    }
    return analysis;
  } finally {
    setLoadingAnalysis(prev => {
      const newSet = new Set(prev);
      newSet.delete(cacheKey);
      return newSet;
    });
  }
}, [enhancedAnalysisCache, loadingAnalysis]);
```

### **Error Boundary & Loading Patterns**

```tsx
// Loading overlay with stage-specific messaging
const [loadingStage, setLoadingStage] = useState<
  "activating" | "fetching" | "processing" | null
>(null);
const [loadingMessage, setLoadingMessage] = useState<string>("");

// Sport activation with retry logic
const activateSportAndFetchData = async (retryCount = 0) => {
  try {
    setLoadingStage("activating");
    const activationResponse = await fetch(
      `/api/sports/activate/${selectedSport}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (activationResponse.ok) {
      setLoadingStage("fetching");
      const candidateProps = await fetchFeaturedProps(selectedSport, propType);

      setLoadingStage("processing");
      const batchResults = await fetchBatchPredictions(candidateProps);

      setProjections(batchResults.filter((r) => r && !r.error));
    }
  } catch (err) {
    // Retry logic for network/5xx errors
    if (
      retryCount < 2 &&
      (err?.response?.status >= 500 || err?.code === "ECONNREFUSED")
    ) {
      setTimeout(
        () => activateSportAndFetchData(retryCount + 1),
        1000 * (retryCount + 1)
      );
      return;
    }
    setError(`Failed to fetch data: ${err.message}`);
  } finally {
    setLoadingStage(null);
  }
};
```

### **Backend Rate Limiting & Fallback Patterns**

```python
# Redis-based rate limiting with graceful degradation
async def rate_limited_api_call(endpoint: str, fallback_func=None):
    try:
        # Check rate limit
        if await redis_rate_limiter.is_rate_limited(endpoint):
            logger.warning(f"Rate limited for {endpoint}, using fallback")
            return await fallback_func() if fallback_func else None

        # Make API call with exponential backoff
        response = await make_api_request_with_backoff(endpoint)

        # Cache successful response
        await redis_cache.set(f"cache:{endpoint}", response, ttl=600)
        return response

    except Exception as e:
        logger.error(f"API call failed for {endpoint}: {e}")

        # Try cache fallback
        cached = await redis_cache.get(f"cache:{endpoint}")
        if cached:
            logger.info(f"Using cached data for {endpoint}")
            return cached

        # Final fallback
        return await fallback_func() if fallback_func else None
```

### **Prop Consolidation & Grouping Patterns**

```tsx
// Consolidate props by player to avoid duplicate cards
const consolidatedProjections = useMemo(() => {
  const playerMap = new Map<string, FeaturedProp & { alternativeProps?: Array<...> }>();

  sortedProjections.forEach(proj => {
    const playerKey = `${proj.player}-${proj.matchup}`;

    if (playerMap.has(playerKey)) {
      // Add as alternative stat for existing player
      const existingProj = playerMap.get(playerKey)!;
      if (!existingProj.alternativeProps) existingProj.alternativeProps = [];
      existingProj.alternativeProps.push({
        stat: proj.stat || 'Unknown',
        line: proj.line || 0,
        confidence: proj.confidence || 0,
        overOdds: proj.overOdds,
        underOdds: proj.underOdds
      });
    } else {
      // First prop for this player - create main card
      playerMap.set(playerKey, { ...proj, alternativeProps: [] });
    }
  });

  return Array.from(playerMap.values()).sort((a, b) => {
    // Sort by highest confidence across all props for this player
    const aMaxConfidence = Math.max(a.confidence, ...(a.alternativeProps?.map(p => p.confidence) || []));
    const bMaxConfidence = Math.max(b.confidence, ...(b.alternativeProps?.map(p => p.confidence) || []));
    return bMaxConfidence - aMaxConfidence;
  });
}, [sortedProjections]);
```

### **Testing & Development Patterns**

```tsx
// Comprehensive testing patterns for components
describe("PropOllamaUnified", () => {
  it("loads and sorts best bets by confidence", async () => {
    const mlbMockData = [
      {
        id: "game1-judge",
        player: "Aaron Judge",
        confidence: 0.8,
        stat: "Total Runs",
        line: 8.5,
        // ... other props
      },
    ];

    render(<PropOllamaUnified />);

    // Wait for data loading
    await waitFor(() => {
      expect(screen.getByText("Aaron Judge")).toBeInTheDocument();
    });

    // Test expansion behavior
    fireEvent.click(screen.getByText("Aaron Judge"));
    expect(screen.getByTestId("prop-card")).toBeInTheDocument();

    // Test click-outside collapse
    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByTestId("prop-card")).not.toBeInTheDocument();
    });
  });
});
```

### **PropOllama Chat Integration Patterns**

```tsx
// Chat integration with analysis type detection
const sendMessage = async (message: string) => {
  const payload: PropOllamaRequest = {
    message: message,
    analysisType: detectAnalysisType(message), // 'prop' | 'spread' | 'total' | 'strategy'
    includeWebResearch:
      message.toLowerCase().includes("latest") ||
      message.toLowerCase().includes("news"),
    requestBestBets:
      message.toLowerCase().includes("best bets") ||
      message.toLowerCase().includes("recommendations"),
  };

  const response = await propOllamaService.sendChatMessage(payload);

  // Handle different response types
  if (response.best_bets && response.best_bets.length > 0) {
    // Display best bets UI
    setBestBets(response.best_bets);
  }

  return response;
};

// Analysis type detection helper
const detectAnalysisType = (
  message: string
): "prop" | "spread" | "total" | "strategy" | "general" => {
  const lowerMessage = message.toLowerCase();
  if (
    lowerMessage.includes("over") ||
    lowerMessage.includes("under") ||
    lowerMessage.includes("total")
  )
    return "total";
  if (
    lowerMessage.includes("spread") ||
    lowerMessage.includes("line") ||
    lowerMessage.includes("favorite")
  )
    return "spread";
  if (
    lowerMessage.includes("prop") ||
    lowerMessage.includes("hits") ||
    lowerMessage.includes("points")
  )
    return "prop";
  if (
    lowerMessage.includes("strategy") ||
    lowerMessage.includes("bankroll") ||
    lowerMessage.includes("manage")
  )
    return "strategy";
  return "general";
};
```

## Development Shortcuts & Commands

### **Quick Development Commands**

```bash
# Backend quick restart (from root)
python -m uvicorn backend.main:app --reload --port 8000

# Frontend with specific port (from frontend/)
npm run dev -- --port 8174 --host 0.0.0.0

# Run tests with coverage
npm run test -- --coverage --watchAll=false

# Backend testing with specific modules
python -m pytest backend/test/ -v --disable-warnings

# Check TypeScript without build
npx tsc --noEmit

# ETL pipeline testing
python backend/etl_mlb.py --test-mode

# Check Redis connection
redis-cli ping

# View recent logs
tail -f backend/logs/propollama.log
```

### **Debug Console Patterns**

```tsx
// PropOllamaUnified debug logging
console.log("[PropOllamaUnified] Sport activation:", selectedSport);
console.log("[PropOllamaUnified] Batch predictions result:", batchResults);
console.log(
  "[PropOllamaUnified] Consolidated projections:",
  consolidatedProjections
);

// Check for specific issues
console.log("[DEBUG] visibleProjections:", visibleProjections);
console.log("[DIAGNOSTIC] Backend returned data:", candidateProps);

// EnhancedDataManager debugging
console.log("[DataManager] Sport context mapping:", {
  rawProps: props.length,
  sport,
  mappedSample: featuredProps[0]?.sport,
});
```

### **Request Flow Debugging**

```bash
# Check backend logs for API responses
tail -f backend/logs/propollama.log | grep "batch-predictions"

# Verify sport activation
curl -X POST "http://localhost:8000/api/sports/activate/MLB"

# Test raw props fetch
curl "http://localhost:8000/mlb/odds-comparison/?market_type=playerprops" | head -100

# Check Redis cache status
redis-cli ping
redis-cli keys "*mlb*"
```
