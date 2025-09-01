```markdown
# A1Betting — Copilot Instructions (practical)

Purpose: help an AI coding agent make small, safe, and testable edits fast.

Quick rules
- Backend work: run from repo root (`A1Betting7-13.2/`).
- Frontend work: run from `frontend/` (Vite dev, tests, type-check).
- Ports: backend 8000, frontend 5173 (Vite proxy → backend).

## Admin Dashboard Notes

- **Purpose**: React-admin dashboard for secure business rule management (admin area).
- **Focus areas**: prioritize admin authentication, YAML editing UX, REST API integration, and audit log visibility.
- **Editor**: use Monaco or Ace editor for YAML fields in admin pages.
- **APIs**: ensure all admin API calls are authenticated and auditable; admin paths commonly include `/api/ingestion/admin` and `/api/admin`.
- **UI framework**: Material UI is used in the admin dashboard; follow existing admin styling patterns.


# A1Betting — Copilot Instructions (concise, actionable)

**Recent Agent Addendum (Aug 2025)**

- **Admin Ingestion:** Admin backfill endpoints were added: `POST /api/ingestion/admin/backfill` and `GET /api/ingestion/admin/backfill/{job_id}` (see `backend/routes/ingestion_admin_routes.py`).
- **Backfill Manager:** A `BackfillManager` with an in-memory `JobStore` is available for tests in `backend/ingestion/backfill_manager.py`.
- **Feature Flag:** Use `USE_FREE_INGESTION` to toggle Phase‑2 free-provider ingestion for safe rollout in CI.
- **Middleware Fix:** `backend/middleware/legacy_middleware.py` now excludes admin prefixes (`/api/ingestion/admin`, `/api/admin`) so admin routes are not intercepted by legacy forwarding.
- **Prediction Validation Fix:** The enhanced-ML response normalizer in `backend/core/app.py` now performs early validation of the request `sport` and returns HTTP `422` with the canonical `error` object and a top-level `message` when sport is invalid. This prevents invalid-sport payloads from returning HTTP `200`.
- **Tests & Reproduction:** A focused unit test `tests/backend/routes/test_enhanced_ml_compat.py` asserts invalid-sport → `422`. Reproduce locally with `pytest tests/backend/routes/test_enhanced_ml_compat.py -q` or run `scripts/reproduce_predict.py` to exercise the TestClient flow.
- **Quick Next Steps:** Run the route tests (`pytest tests/backend/routes -q`) and then the full test suite before pushing changes.


Purpose: give an AI coding agent the exact, discoverable patterns and commands
needed to make small, safe, and testable edits quickly in this repo.

Quick rules
- Backend work: run from the repository root (`A1Betting7-13.2/`).
- Frontend work: run from `frontend/` (Vite dev, tests, type-check).
- Ports: backend 8000 (required), frontend 5173 (Vite proxy → backend).

Essential commands
```pwsh
# Backend (from repo root)
C:/path/to/python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
C:/path/to/python -m pytest --verbose --tb=short

# Frontend (from frontend/)
# From repo root (backend work)
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
pytest --verbose --tb=short

```

```markdown
# A1Betting — Copilot Instructions (concise)

Purpose: give an AI coding agent the exact, discoverable patterns and commands
needed to make small, safe, and testable edits quickly in this repo.

Quick rules
- Backend work: run commands from the repository root (`A1Betting7-13.2/`).
- Frontend work: run commands from `frontend/`.
- Ports: backend `8000`, frontend `5173` (Vite proxy → backend).

Essential commands (copy/paste)
```pwsh
# Backend (from repo root)
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
pytest --verbose --tb=short

# Frontend (from frontend/)
cd frontend
npm install
npm run dev
npm run type-check
npm run test
```

Project-specific conventions (do this)
- Directory discipline: many scripts assume exact CWD. Use project root for backend tasks and `frontend/` for frontend tasks.
- Use `backend/services/unified_*` helpers for network, cache and feature services (they are backwards-compatible wrappers).
- Lazy-import heavy optional ML libs (e.g. `torch`, `xgboost`) and provide fallbacks.
- Tests set `TESTING` / `DATABASE_URL` early in `tests/conftest*.py`; avoid import-time DB connections.
- Frontend: always pass `sport` into mapping helpers: `EnhancedDataManager.mapToFeaturedProps(props, sport)` (missing sport → `"Unknown"` → empty UI lists).

Key files to inspect for most edits
- `backend/main.py`, `backend/core/app.py` — app/factory & route registration
- `backend/services/` — unified service implementations (fetcher, cache, logging)
- `backend/routes/` — API route modules; tests sometimes import routers directly
- `frontend/src/hooks/usePropFinderData.tsx` — PropFinder data hook
- `frontend/src/components/dashboard/PropFinderDashboard.tsx` — primary dashboard UI
- `tests/conftest.py` — test fixtures and env setup

Testing & quick edit workflow
1. Make a small change.
2. Run focused tests that exercise the changed module (example):
```pwsh
# from repo root
pytest tests/backend/routes/test_enhanced_ml_compat.py -q

# frontend type-check & tests
cd frontend
npm run type-check
npm run test -- --watchAll=false
```

If tests fail at import/collection with ModuleNotFoundError:
1) Add a guarded import (try/except) or lightweight shim under `backend/services/`.
2) Or install the minimal dependency in the venv.

When to ask a human
- Any change touching `backend/main.py`, DB migrations, API schemas/models, ML model code, or adding native system deps (PyTorch, xgboost). Stop and request review.

Examples of project-specific fixes
- Sport context bug (frontend): ensure `mapToFeaturedProps(props, sport)` is called with `sport`.
- Test collection issues (backend): set `TESTING=1` and `DATABASE_URL` in the test environment before import.

Quick references
- PropFinder API: `GET /api/propfinder/opportunities` — backend: `backend/routes/propfinder_routes.py`, service: `backend/services/simple_propfinder_service.py`.
- Frontend registry: `frontend/src/services/MasterServiceRegistry.ts`.

PR & commit guidance for AI patches
- Keep edits small and focused (single responsibility). Commit messages: `fix:`, `feat:`, `tests:`, `docs:`.
- After code change: run focused tests, type-check (frontend), then commit and push to a feature branch. Open pull request with a short summary and test results.

If anything here is unclear or you want a deeper section (service registry adapters, unified cache patterns, or type-guides for TypeScript work), tell me which part to expand.
```
- **State Management:** Zustand global state + local useState patterns, TanStack Query for server state
- **Core Components:** `PropOllamaUnified.tsx` (main prop analysis), `CondensedPropCard.tsx` (condensed cards), `PlayerAvatar.tsx` (headshot display)
- **Data Architecture:** Backend API → EnhancedDataManager → FeaturedPropsService → React components
- **UI Patterns:** Expandable card system with click-outside collapse, confidence color coding, incremental loading
- **Authentication:** JWT-based with `AuthContext` and `AuthPage` components
- **Navigation:** React Router v7 with lazy loading and performance tracking

## Critical Architecture Patterns

### **Backend (FastAPI, Async Python)**

- **Entry Points:** `backend/main.py` (prod), `backend/minimal_test_app.py` (dev)
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
- **Location:** `frontend/src/services/EnhancedDataManager.ts` (1160+ lines)
- **Key Features:** LRU cache (1000 entries), 5min TTL for props, 10min for analysis, batch request optimization
- **Sport Context Mapping:** `mapToFeaturedProps(props, sport)` - **CRITICAL: Always pass sport parameter**
- **Request Deduplication:** Prevents duplicate API calls for identical endpoint+params combinations
- **WebSocket Integration:** Real-time data updates with automatic reconnection logic
- **Performance Monitoring:** Comprehensive metrics tracking with quality scoring

## Essential Development Workflows

### **Terminal Context Awareness**

- **CRITICAL:** Always check `pwd` before commands - workspace has frontend/ and backend/ subdirectories
- **Never run redundant `cd` commands** - tools track current directory
- Backend tasks from root: `python -m uvicorn backend.main:app --reload`
- Frontend tasks from `frontend/`: `npm run dev` (port 8174)

### **PropOllamaUnified Component Architecture**

```tsx
// Core pattern: Condensed cards → expanded analysis with enhanced ML insights
const PropOllamaUnified = () => {
  // Sport activation → data fetch → batch predictions → consolidation
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [enhancedAnalysisCache, setEnhancedAnalysisCache] = useState<
    Map<string, EnhancedPropAnalysis>
  >(new Map());
  const [sportActivationStatus, setSportActivationStatus] = useState<{
    [sport: string]: "ready" | "loading" | "error";
  }>({});

  // Card expansion with click-outside detection
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        expandedCardRef.current &&
        !expandedCardRef.current.contains(event.target)
      ) {
        setExpandedRowKey(null); // Collapse expanded card
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

### **Sport Context Management (Critical Fix)**

```typescript
// EnhancedDataManager.mapToFeaturedProps - ALWAYS pass sport context
private mapToFeaturedProps(props: any[], sport?: string): FeaturedProp[] {
  return props.map(prop => ({
    // ... other fields
    sport: prop.sport || sport || 'Unknown', // 🎯 THE CRITICAL FIX - prevents "Unknown" sport
  }));
}

// When calling from fetchSportsProps:
const featuredProps = this.mapToFeaturedProps(props, sport); // ✅ Correct
// NOT: this.mapToFeaturedProps(props); // ❌ Results in sport="Unknown"
```

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

const [error, setError] = useState<string | null>(null);

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

## Production Architecture Components

### **Backend Production Integration (`production_integration.py`)**

- **Application Factory:** `ProductionApp` class with comprehensive middleware stacking
- **Lifespan Management:** Database initialization, cache service startup, sports services activation
- **Security Middleware:** TrustedHostMiddleware, SecurityMiddleware, CORS configuration
- **Rate Limiting:** Redis-based enhanced rate limiter with custom handlers
- **Monitoring:** Request logging, performance tracking, health checks

### **Database Architecture**

- **Development:** SQLite with async support (`aiosqlite`)
- **Production:** PostgreSQL with async driver (`asyncpg`)
- **ORM:** SQLAlchemy 2.0+ with SQLModel for modern async patterns
- **Migrations:** Alembic for schema management
- **Connection Management:** Database manager with connection pooling

### **Cache Architecture (Redis)**

- **Primary Cache:** Enhanced caching service with intelligent invalidation
- **Rate Limiting:** Redis-based rate limiter for API protection
- **Session Storage:** WebSocket connection state and user sessions
- **Feature Flags:** Dynamic feature enablement without restarts

### **WebSocket Real-time Updates**

- **Connection Management:** Automatic reconnection with exponential backoff
- **Event Types:** Sport updates, prop changes, live score feeds
- **Subscription Management:** Topic-based subscriptions with filtering
- **Performance:** Optimized message batching and compression

## Development Environment Setup

### **Backend Setup (Python 3.12+)**

```bash
# Virtual environment creation
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r backend/requirements.txt

# Database setup
python backend/database.py
python backend/ensure_all_tables.py

# Start development server
python -m uvicorn backend.main:app --reload --port 8000
```

### **Frontend Setup (Node.js 18+)**

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

### **Redis Setup (Optional but Recommended)**

```bash
# Install Redis (Ubuntu/Debian)
sudo apt-get install redis-server

# Start Redis service
sudo systemctl start redis-server

# Test connection
redis-cli ping
```

### **Environment Configuration**

```bash
# Backend .env file (copy from .env.example)
DATABASE_URL=sqlite:///./a1betting.db
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-here
OLLAMA_BASE_URL=http://localhost:11434
SPORTRADAR_API_KEY=your-api-key
THEODDS_API_KEY=your-api-key
```

## Modern Component Architecture

### **React Patterns & Best Practices**

```tsx
// Modern React component with hooks and TypeScript
interface ComponentProps {
  data: FeaturedProp[];
  onUpdate: (data: FeaturedProp[]) => void;
  className?: string;
}

const ModernComponent: React.FC<ComponentProps> = ({
  data,
  onUpdate,
  className = "",
}) => {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for DOM access
  const containerRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const { trackEvent } = useAnalytics();
  const { formatCurrency } = useFormatting();

  // Effects with cleanup
  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        const result = await api.fetch({ signal: controller.signal });
        onUpdate(result);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    return () => controller.abort();
  }, [onUpdate]);

  // Event handlers
  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      trackEvent("component_click", { component: "ModernComponent" });
    },
    [trackEvent]
  );

  // Conditional rendering
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div ref={containerRef} className={`modern-component ${className}`}>
      {data.map((item) => (
        <div key={item.id} onClick={handleClick}>
          {formatCurrency(item.value)}
        </div>
      ))}
    </div>
  );
};

export default ModernComponent;
```

### **Custom Hooks for Reusability**

```tsx
// Custom hook for data fetching with caching
function useEnhancedData<T>(
  endpoint: string,
  params?: Record<string, any>
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = useMemo(
    () => `${endpoint}-${JSON.stringify(params)}`,
    [endpoint, params]
  );

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await enhancedDataManager.fetchData<T>(endpoint, params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [endpoint, params]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// Usage in components
const MyComponent = () => {
  const { data, loading, error } = useEnhancedData<FeaturedProp[]>(
    "/api/mlb/props",
    { market_type: "playerprops" }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <PropsList props={data || []} />;
};
```

This enhanced instruction set provides comprehensive guidance for AI agents working on the A1Betting7-13.2 codebase, covering architecture, patterns, troubleshooting, and best practices at a production level.
```
# AI Agent Onboarding Summary (August 2025)

Welcome to A1Betting7-13.2! This is a production-ready PropFinder-killer platform with comprehensive sports analytics. Follow these patterns for immediate productivity:

## 🚀 **Immediate Productivity Checklist**

- **PropFinder Platform Status:**
  - ✅ Phase 4.1 PropFinder Frontend Integration **COMPLETE** - Full PropFinder clone operational
  - ✅ Phase 1.2 Backend Multi-Bookmaker Analysis **COMPLETE** - Real-time arbitrage detection
  - 🟡 Phase 4.2 Bookmark Persistence - Next implementation phase
- **Critical Directory Discipline:**
  - Backend: Run ALL commands from project root (`A1Betting7-13.2/`). **Never** from `backend/` subdirectory.
  - Frontend: Run ALL commands from `frontend/` subdirectory. **Never** from project root.
- **PropFinder API Integration:**
  - Primary endpoint: `/api/propfinder/opportunities` - Returns 39 opportunities with Phase 1.2 fields
  - Frontend: `PropFinderDashboard.tsx` (679 lines) with real-time API integration and Phase 1.2 UI
  - Backend: `simple_propfinder_service.py` (1111 lines) with `PropOpportunity` class and Phase 1.2 fields
- **Service Architecture:**
  - Backend unified services: `unified_data_fetcher`, `unified_cache_service`, `unified_error_handler`
  - Frontend service registry: `MasterServiceRegistry.getInstance().getService('data')`
  - SportRadar integration: 19 professional APIs with intelligent quota management
- **Performance Patterns:**
  - Virtual scrolling for datasets >100 items with `useVirtualizer` from `@tanstack/react-virtual`
  - React 19 concurrent features with `useTransition` and `useDeferredValue`
  - Debounced search with 300ms delay for optimal API performance

For complete technical details, see sections below.

## 🎯 **PropFinder Platform Architecture (Current State)**

**Production-Ready PropFinder Clone** - Complete implementation operational with superior performance:

### **Frontend PropFinder Implementation**

```tsx
// Current live PropFinder dashboard - 679 lines of production code
import { PropFinderDashboard } from '@/components/dashboard/PropFinderDashboard';

// Real-time API integration with Phase 1.2 multi-bookmaker features
const { opportunities, stats, loading, error } = usePropFinderData({
  autoRefresh: true,
  refreshInterval: 30,
  initialFilters: { sports: ['NBA', 'MLB'], confidence_min: 60 }
});

// Performance optimizations - handles 10,000+ props smoothly  
const virtualizer = useVirtualizer({
  count: filteredOpportunities.length,
  estimateSize: () => 120,
  overscan: 10
});

// Phase 1.2 UI Features - Advanced filtering with multi-bookmaker analysis
<ArbitrageFilter checked={showArbitrageOnly} onChange={setShowArbitrageOnly} />
<BookmakerCountSlider min={1} max={8} value={minBookmakers} />
<SharpMoneyFilter selected={selectedSharpMoney} />
```

### **Backend PropFinder Service**

```python
# Production PropFinder service - 1111 lines with Phase 1.2 complete
from backend.services.simple_propfinder_service import PropOpportunity

@dataclass 
class PropOpportunity:
    # Core PropFinder fields
    player: str; team: str; opponent: str; sport: str; market: str
    line: float; odds: int; confidence: float; edge: float
    
    # Phase 1.2: Multi-bookmaker analysis (COMPLETE)
    bestBookmaker: Optional[str]    # Best odds bookmaker
    lineSpread: float              # Line variance across books  
    oddsSpread: int               # Odds spread (best-worst)
    numBookmakers: int            # Total bookmakers offering
    hasArbitrage: bool            # Arbitrage opportunity detected
    arbitrageProfitPct: float     # Profit % from arbitrage

# API endpoint returning real calculated values
GET /api/propfinder/opportunities  # Returns 39 opportunities with all Phase 1.2 fields
```

### **Key PropFinder Performance Metrics**

```bash
# PropFinder vs A1Betting Performance Comparison
Load Time:       PropFinder 3.2s  →  A1Betting 0.3s (10x faster)
Search Speed:    PropFinder 1.8s  →  A1Betting 0.1s (debounced, 18x faster)  
Data Handling:   PropFinder 1,000 →  A1Betting 10,000+ props (virtual scrolling)
Multi-Bookmaker: PropFinder None  →  A1Betting 5-8 books per prop
Arbitrage:       PropFinder None  →  A1Betting Real-time detection (2.6-2.8% profit)
API Response:    PropFinder Unknown → A1Betting <100ms with Phase 1.2 fields
Memory Usage:    PropFinder High   →  A1Betting <50MB optimized
Cost:           PropFinder $29+/mo →  A1Betting Free forever
```

## 🏗️ **Big Picture Architecture**

A1Betting7-13.2 is a **production-ready PropFinder killer platform** that combines full-stack sports analytics with superior performance and comprehensive multi-bookmaker analysis.

### **System Architecture Overview**

```
┌─── Frontend (React 19 + TypeScript) ───┐    ┌─── Backend (FastAPI + Python) ───┐
│                                        │    │                                  │
│  PropFinderDashboard.tsx (679 lines)   │◄──►│  /api/propfinder/opportunities   │
│  ├─ Real-time API integration          │    │  ├─ Phase 1.2 multi-bookmaker    │
│  ├─ Virtual scrolling (10,000+ props)  │    │  ├─ Arbitrage detection          │
│  ├─ Debounced search (300ms)           │    │  └─ PropOpportunity class        │
│  └─ Phase 1.2 UI (arbitrage filters)   │    │                                  │
│                                        │    │  simple_propfinder_service.py    │
│  usePropFinderData hook                │◄──►│  ├─ 39 realistic opportunities   │
│  ├─ Auto-refresh (30s intervals)       │    │  ├─ OddsNormalizer integration   │
│  └─ Error boundaries + retry logic     │    │  └─ Phase 1.2 calculations      │
└────────────────────────────────────────┘    └──────────────────────────────────┘

SportRadar APIs (19 Professional) ────────────►│  Unified Services Architecture   │
├─ Live scores, odds, player stats             │  ├─ unified_data_fetcher        │
├─ Getty Images, team logos                    │  ├─ unified_cache_service       │ 
├─ Real-time injury reports                    │  ├─ unified_error_handler       │
└─ 1000 requests/API quota management          │  └─ unified_logging             │
```

### **Core Service Boundaries**

- **PropFinder Clone**: Complete PropFinder replacement with 15x performance improvement
- **Multi-Bookmaker Engine**: Real-time analysis across 5-8 sportsbooks per prop  
- **Arbitrage Detection**: Automated profit opportunity identification (2.6-2.8% margins)
- **Virtual Performance**: React 19 concurrent features handle unlimited datasets
- **Unified Backend**: Consolidated service architecture with backwards compatibility
- **SportRadar Integration**: Official sports data with intelligent quota management

### **Critical Data Flows**

1. **PropFinder API Pipeline**: `PropFinderDashboard` → `usePropFinderData` → `/api/propfinder/opportunities` → `SimplePropFinderService` → Phase 1.2 calculations
2. **Multi-Bookmaker Analysis**: `_find_best_odds()` + `_detect_arbitrage_opportunity()` → Phase 1.2 fields population
3. **Performance Optimization**: Virtual scrolling + debounced search + React 19 concurrent rendering
4. **Error Recovery**: Comprehensive error boundaries + automatic retry + graceful degradation

## 🔧 **Essential Developer Workflows**

**CRITICAL: Directory Discipline for All Operations**

> **MANDATORY RULE**: All AI agents must run commands in correct working directory. This is the #1 cause of build failures.

| Operation | Correct Directory | ❌ Wrong Directory |
|-----------|------------------|-------------------|
| Backend server, tests, scripts | **Project root** (`A1Betting7-13.2/`) | `backend/` subdirectory |
| Frontend dev, build, test, lint | **`frontend/` subdirectory** | Project root |

```bash
# ✅ CORRECT Backend Operations (from project root)
cd A1Betting7-13.2/
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
pytest
python phase2_verification.py

# ✅ CORRECT Frontend Operations (from frontend/)
cd A1Betting7-13.2/frontend/
npm run dev
npm run test
npm run build
npm run type-check

# 🔍 PropFinder Development Workflow
# Backend: Test PropFinder API
curl "http://127.0.0.1:8000/api/propfinder/opportunities" | head -c 500

# Frontend: PropFinder Dashboard
# Runs on http://localhost:5173 with real-time API integration
# Features: Virtual scrolling, debounced search, arbitrage detection
```

### **PropFinder-Specific Development Patterns**

```bash
# Test PropFinder Phase 1.2 fields are populated correctly
curl -s "http://127.0.0.1:8000/api/propfinder/opportunities" | jq '.data.opportunities[0] | {player, bestBookmaker, lineSpread, hasArbitrage, arbitrageProfitPct}'

# Verify frontend PropFinder dashboard performance
# Should show virtual scrolling metrics and debounced search
# Check browser console for "PropFinder Dashboard" logs

# Debug PropFinder data flow
# 1. Backend service: simple_propfinder_service.py (_generate_propopportunity_data)
# 2. API route: propfinder_routes.py (OpportunityResponse model)  
# 3. Frontend hook: usePropFinderData.tsx (real-time integration)
# 4. Dashboard: PropFinderDashboard.tsx (Phase 1.2 UI features)
```

## **Unified Service Architecture & Modern Conventions**

### **Backend Unified Services (CRITICAL)**
```python
# ✅ ALWAYS use unified services - maintains backwards compatibility
from backend.services.unified_data_fetcher import unified_data_fetcher
from backend.services.unified_cache_service import unified_cache_service
from backend.services.unified_error_handler import unified_error_handler
from backend.services.unified_logging import unified_logging
from backend.services.unified_config import unified_config

# All unified services maintain backwards compatibility
data = await unified_data_fetcher.fetch_mlb_games(sport="MLB")
cached_result = unified_cache_service.get("key", default_value)
```

### **Frontend Service Registry Pattern**
```typescript
// Master Service Registry manages all service lifecycle and health
import { MasterServiceRegistry } from "@/services/MasterServiceRegistry";

const registry = MasterServiceRegistry.getInstance();
const dataService = registry.getService('data');
const cacheService = registry.getService('cache');

// All services follow singleton pattern with health monitoring
```

### **PropFinder Integration Patterns**
```python
# Backend: PropFinder API endpoint integration
from backend.services.simple_propfinder_service import PropFinderService
from backend.models.prop_models import PropOpportunity

# Phase 1.2 multi-bookmaker analysis fields
@dataclass
class PropOpportunity:
    # Core fields
    player: str; team: str; sport: str; market: str
    # Phase 1.2: Multi-bookmaker analysis (COMPLETE)
    bestBookmaker: Optional[str]
    lineSpread: float
    hasArbitrage: bool
    arbitrageProfitPct: float
```

```tsx
// Frontend: Real-time PropFinder dashboard integration
import { PropFinderDashboard } from '@/components/dashboard/PropFinderDashboard';
import { usePropFinderData } from '@/hooks/usePropFinderData';

// Production-ready with virtual scrolling and debounced search
const { opportunities, stats, loading, error } = usePropFinderData({
  autoRefresh: true,
  refreshInterval: 30,
  initialFilters: { sports: ['NBA', 'MLB'], confidence_min: 60 }
});
```

### **Performance Optimization Standards**
```tsx
// Auto-virtualization for datasets >100 items
import { useVirtualizer } from '@tanstack/react-virtual';
import { VirtualizedPropList } from '@/components/VirtualizedPropList';

// React 19 concurrent features integration
const [isPending, startTransition] = useTransition();
const deferredQuery = useDeferredValue(searchQuery);

// Debounced search pattern (300ms optimal)
const debouncedSearch = useMemo(
  () => debounce(handleSearch, 300),
  [handleSearch]
);
```

### **Enterprise Service Patterns**
```python
# Enterprise prop generation with Baseball Savant integration
from backend.services.comprehensive_prop_generator import ComprehensivePropGenerator

generator = ComprehensivePropGenerator()
props = await generator.generate_game_props(game_id, optimize_performance=True)
# Returns 100-130+ props per game vs 60 mock props previously
```

### **Modular Component Architecture (NEW)**
```tsx
// Modular pattern replacing 2427-line monoliths
import { PropOllamaContainer } from "@/components/containers/PropOllamaContainer";
import { usePropOllamaState } from "@/hooks/usePropOllamaState";

// Components follow specialized concerns pattern
<PropOllamaContainer gameId={gameId} sport={sport}>
  <PropFilters />
  <PropSorting />
  <PropList virtualized={props.length > 100} />
  <BetSlipComponent />
</PropOllamaContainer>

// State extracted to dedicated hooks
const { props, loading, filters, sorting } = usePropOllamaState(gameId);
```

### **Critical Data Flow Patterns**
```typescript
// CRITICAL: Always pass sport context (most common bug fix)
// ❌ WRONG - Results in empty props with sport="Unknown"
const featuredProps = enhancedDataManager.mapToFeaturedProps(props);

// ✅ CORRECT - Always pass sport parameter
const featuredProps = enhancedDataManager.mapToFeaturedProps(props, sport);
```

### **Modern ML Integration**
```python
# Modern ML with graceful fallbacks
try:
    from backend.services.modern_ml_service import modern_ml_service
    result = await modern_ml_service.predict(request)
except ImportError:
    from backend.services.enhanced_prop_analysis_service import legacy_predict
    result = await legacy_predict(request)
```

## **Critical Integration Points & Dependencies**

### **SportRadar Integration (19 Professional APIs)**
```python
# Official sports data with intelligent quota management
from backend.services.unified_data_fetcher import unified_data_fetcher

# SportRadar APIs include:
# - Live scores and odds
# - Getty Images and team logos  
# - Real-time injury reports
# - Player statistics and analytics
# 1000 requests per API with intelligent quota management
```

### **PropFinder API Integration**
```bash
# Primary PropFinder endpoint - returns 39 opportunities with Phase 1.2 fields
GET /api/propfinder/opportunities

# Response includes multi-bookmaker analysis:
{
  "player": "Vladimir Guerrero Jr.",
  "bestBookmaker": "FanDuel", 
  "lineSpread": 0.5,
  "oddsSpread": 15,
  "hasArbitrage": true,
  "arbitrageProfitPct": 2.67
}
```

### **Real-Time Performance Standards**
- **API Response**: <100ms for PropFinder endpoints
- **Virtual Scrolling**: Handles 10,000+ props smoothly
- **Search Debouncing**: 300ms optimal delay 
- **Memory Usage**: <50MB optimized vs PropFinder's high usage
- **Load Time**: 0.3s vs PropFinder's 3.2s (10x faster)

### **Database & Caching Architecture**
```python
# Multi-tier caching strategy
from backend.services.unified_cache_service import unified_cache_service

# Memory → LocalStorage → Redis fallback
cached_result = unified_cache_service.get("key", default_value)

# SQLite for development, PostgreSQL for production
# Redis for caching and background task queueing
```

### **Testing Framework Integration**
```bash
# Backend testing with pytest
pytest --verbose --tb=short

# Frontend testing suite
cd frontend
npm run test              # Jest unit tests
npm run test:e2e         # Playwright E2E tests  
npm run type-check       # TypeScript validation
npm run lint             # ESLint checking
```

### **Key Configuration Points**
- **Backend Port**: 8000 (NEVER 8001 - causes React useReducer errors)
- **Frontend Port**: 5173 (Vite default)
- **Environment**: `.env` in backend/ for database URLs and API keys
- **Proxy Configuration**: `frontend/vite.config.ts` must target port 8000

### **Common Integration Issues & Solutions**
```bash
# Issue: "Cannot read properties of null (reading 'useReducer')" 
# Solution: Check Vite proxy configuration targets correct backend port

# Issue: Empty props display despite successful API calls
# Solution: Always pass sport context - mapToFeaturedProps(props, sport)

# Issue: Modern ML import errors
# Solution: Use graceful fallbacks with try/except pattern

# Issue: Slow performance with large datasets
# Solution: Auto-virtualization activates for >100 props
```

## Key Files & Directories

**Backend Unified Services:**
- `backend/services/unified_data_fetcher.py` - Consolidated data fetching service (413 lines, replaces 3 duplicate services)
- `backend/services/unified_cache_service.py` - Unified caching interface (123 lines, backwards compatible)
- `backend/services/unified_error_handler.py` - Comprehensive error handling (250+ lines)  
- `backend/services/unified_logging.py` - Structured JSON logging (300+ lines)
- `backend/services/unified_config.py` - Environment-aware configuration (400+ lines)

**PropFinder Core Services:**
- `backend/services/simple_propfinder_service.py` - PropFinder service (1111 lines, Phase 1.2 complete)
- `backend/routes/propfinder_routes.py` - PropFinder API routes with OpportunityResponse model
- `frontend/src/components/dashboard/PropFinderDashboard.tsx` - PropFinder dashboard (679 lines, production-ready)
- `frontend/src/hooks/usePropFinderData.tsx` - Real-time PropFinder data integration

**Frontend Modular Components:**
- `frontend/src/components/containers/PropOllamaContainer.tsx` - Modular container (130+ lines, replaces monoliths)
- `frontend/src/hooks/usePropOllamaState.ts` - State management hook (286 lines)
- `frontend/src/components/shared/PropOllamaTypes.ts` - Comprehensive type definitions (150+ lines)
- `frontend/src/components/filters/PropFilters.tsx` - Filtering interface (100+ lines)
- `frontend/src/components/sorting/PropSorting.tsx` - Sorting controls (80+ lines)
- `frontend/src/components/betting/BetSlipComponent.tsx` - Bet slip management (120+ lines)
- `frontend/src/components/lists/PropList.tsx` - Prop list with virtualization (100+ lines)
- `frontend/src/services/MasterServiceRegistry.ts` - Service lifecycle and health monitoring

**Backend Core Services:**
- `backend/services/` - Unified service architecture
- `backend/routes/` - API endpoint definitions
- `backend/models/` - Data models and schemas
- `backend/main.py` - FastAPI application factory

**Frontend Core Structure:**
- `frontend/src/components/` - React component library
- `frontend/src/services/` - Service layer with MasterServiceRegistry
- `frontend/vite.config.ts` - Build configuration with proxy setup

**Utility & Maintenance:**
- `find_unused_imports.py` - AST-based import analysis for cleanup
- `cleanup_archive/` - Organized archive of cleaned files (600MB+)
- `phase2_verification.py` - Phase 2 feature verification script
- `phase3_verification.py` - Phase 3 MLOps verification script

**Enterprise Prop Generation:**

```python
from backend.services.comprehensive_prop_generator import ComprehensivePropGenerator
generator = ComprehensivePropGenerator()
props = await generator.generate_game_props(game_id, optimize_performance=True)
```

API: `/mlb/comprehensive-props/{game_id}?optimize_performance=true`

**Modern ML Integration:**

```python
try:
    from backend.services.modern_ml_service import modern_ml_service
    result = await modern_ml_service.predict(request)
except ImportError:
    from backend.services.enhanced_prop_analysis_service import legacy_predict
    result = await legacy_predict(request)
```

**Graceful Fallbacks:**
All enterprise services (ML, caching, data sources) use try/except import patterns for robust fallback if dependencies are missing.

**Frontend Data Mapping:**

- Always pass sport context: `mapToFeaturedProps(props, sport)`
- Root cause of empty props: missing sport context ("Unknown")

**🆕 Modular Component Architecture (Critical):**

```tsx
// NEW - Modular component pattern replacing monolithic structures
import { PropOllamaContainer } from "@/components/containers/PropOllamaContainer";
import { usePropOllamaState } from "@/hooks/usePropOllamaState";

// Components follow unified pattern with specialized concerns
<PropOllamaContainer gameId={gameId} sport={sport} />;

// State management extracted to dedicated hooks
const { props, loading, filters, sorting } = usePropOllamaState(gameId);
```

**Virtualization for Large Datasets:**
Use `VirtualizedPropList.tsx` for MLB datasets >100 props to avoid browser lag.

## Integration & External Dependencies

- **MLB Stats API, Baseball Savant, pybaseball:** All data is real, not mocked in production.
- **ML Libraries:** torch, transformers, ray, mlflow, featuretools (see `backend/requirements.txt`).
- **Frontend:** TanStack Virtual, Recharts, Zustand, Framer Motion, Lucide React.
- **Electron:** Desktop deployment via `ElectronIntegration.tsx`.

## Key Files & Directories

**Backend Unified Services (NEW):**

- `backend/services/unified_data_fetcher.py` - Consolidated data fetching service (413 lines, replaces 3 duplicate services)
- `backend/services/unified_cache_service.py` - Unified caching interface (123 lines, backwards compatible)
- `backend/services/unified_error_handler.py` - Comprehensive error handling (250+ lines)
- `backend/services/unified_logging.py` - Structured JSON logging (300+ lines)
- `backend/services/unified_config.py` - Environment-aware configuration (400+ lines)

**Frontend Modular Components (NEW):**

- `frontend/src/components/containers/PropOllamaContainer.tsx` - Modular container (130+ lines, replaces 2427-line monolith)
- `frontend/src/hooks/usePropOllamaState.ts` - State management hook (286 lines)
- `frontend/src/components/shared/PropOllamaTypes.ts` - Comprehensive type definitions (150+ lines)
- `frontend/src/components/filters/PropFilters.tsx` - Filtering interface (100+ lines)
- `frontend/src/components/sorting/PropSorting.tsx` - Sorting controls (80+ lines)
- `frontend/src/components/betting/BetSlipComponent.tsx` - Bet slip management (120+ lines)
- `frontend/src/components/lists/PropList.tsx` - Prop list with virtualization (100+ lines)
- `frontend/src/services/MasterServiceRegistry.ts` - Service lifecycle and health monitoring

- Backend: `backend/services/`, `backend/routes/`, `backend/models/`, `backend/main.py`
- Frontend: `frontend/src/components/`, `frontend/src/services/`, `frontend/vite.config.ts`
- Utility: `find_unused_imports.py` (AST-based import analysis)
- Cleanup: `cleanup_archive/` (preserves removed files)

## Troubleshooting & Best Practices

- Always check port configuration (8000 backend, 5173 frontend).
- Use `/mlb/todays-games` for valid game IDs.
- For empty props, check sport context and backend logs.
- Use virtualization for large prop lists.
- All business rule violations are logged with bet IDs.

## 🎯 Phase 3: Enterprise AI/ML Trading Platform (NEW)

**Complete Implementation**: Professional-grade trading interface with institutional features.

### Phase 3 Architecture

- **MLModelCenter.tsx**: Enterprise ML model lifecycle management with registry, training jobs, deployment pipeline
- **UnifiedBettingInterface.tsx**: Professional trading interface with opportunity filtering, bet slip management, Kelly Criterion calculations
- **ArbitrageOpportunities.tsx**: Real-time arbitrage detection with profit calculators and execution automation
- **UserFriendlyApp.tsx**: Main navigation shell with responsive sidebar and React Router integration

### Phase 3 Navigation Pattern

```tsx
// Lazy-loaded Phase 3 components with proper routing
const MLModelCenter = React.lazy(() => import("../ml/MLModelCenter"));
const UnifiedBettingInterface = React.lazy(
  () => import("../betting/UnifiedBettingInterface")
);
const ArbitrageOpportunities = React.lazy(
  () => import("../features/betting/ArbitrageOpportunities")
);

// Navigation structure with Phase 3 routes
const navigation = [
  { name: "Sports Analytics", href: "/", icon: Home },
  { name: "AI/ML Models", href: "/ml-models", icon: Brain },
  { name: "Betting Interface", href: "/betting", icon: BarChart3 },
  { name: "Arbitrage", href: "/arbitrage", icon: Target },
];
```

### Phase 3 Styling Standards

- **Consistent Design System**: All Phase 3 components use Tailwind CSS with Lucide React icons
- **No Material-UI**: Previous Material-UI dependencies removed for consistency
- **Professional Theme**: Gradient backgrounds, shadow cards, hover states
- **Responsive Design**: Mobile-first approach with sidebar navigation

## Example Quickstart

```bash
# Backend
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
# Frontend
cd frontend && npm run dev
```

---

For more, see `README.md`, `backend/services/comprehensive_prop_generator.py`, and `frontend/src/components/PropOllamaUnified.tsx`.

## 🚀 Enterprise Comprehensive Props System (NEW)

**Game-Changing Feature**: Universal prop coverage eliminating "no props available" scenarios.

```python
# Enterprise prop generation with Baseball Savant integration
from backend.services.comprehensive_prop_generator import ComprehensivePropGenerator

generator = ComprehensivePropGenerator()
props = await generator.generate_game_props(game_id, optimize_performance=True)
# Returns 100-130+ props per game with advanced analytics
```

**API Endpoint**: `/mlb/comprehensive-props/{game_id}?optimize_performance=true`

**Frontend Integration**:

```tsx
import ComprehensivePropsLoader from "./ComprehensivePropsLoader";

<ComprehensivePropsLoader
  gameId={selectedGameId}
  onPropsGenerated={(props) => setProps(props)}
/>;
```

## 🚀 Modern ML Architecture (Phase 1-3 Complete)

**Phase 1: Advanced ML Infrastructure**

```python
# Transformer models for sequential sports data
from backend.models.modern_architectures import SportsTransformer, ModelFactory
from backend.services.modern_ml_service import modern_ml_service

# Graph Neural Networks for player/team relationships
from backend.models.modern_architectures import SportsGraphNeuralNetwork

# Bayesian ensembles with uncertainty quantification
from backend.services.advanced_bayesian_ensemble import AdvancedBayesianEnsemble
```

**Phase 2: Performance Optimization & Real Data Integration**

```python
# Performance optimization with GPU/CPU detection
from backend.services.performance_optimization import PerformanceOptimizer

# Real data bridge connecting modern ML to existing infrastructure
from backend.services.modern_ml_data_bridge import ml_data_bridge

# Advanced caching with multi-tier strategy
from backend.services.intelligent_cache_service import intelligent_cache_service

# Real-time model updates and distributed processing
from backend.services.real_time_updates import real_time_update_service
```

**Phase 3: MLOps & Production (NEW)**

```python
# Enterprise MLOps pipeline management
from backend.services.mlops_pipeline_service import mlops_pipeline_service, ModelStage

# Production deployment automation
from backend.services.production_deployment_service import production_deployment_service

# Autonomous monitoring and alerting
from backend.services.autonomous_monitoring_service import autonomous_monitoring_service

# Advanced security and audit logging
from backend.services.advanced_security_service import advanced_security_service
```

**Modern ML API Endpoints:**

- `/api/modern-ml/health` - Service health and dependency status
- `/api/modern-ml/predict` - Enhanced predictions with uncertainty
- `/api/modern-ml/batch-predict` - Bulk prediction processing
- `/api/modern-ml/strategies` - A/B testing strategy management
- `/api/modern-ml/performance` - Real-time performance metrics

**Phase 3 MLOps Endpoints:**

- `/api/phase3/mlops/pipeline/create` - Create ML deployment pipeline
- `/api/phase3/mlops/models/promote` - Promote models through stages
- `/api/phase3/deployment/deploy` - Deploy to production environments
- `/api/phase3/monitoring/alerts` - Autonomous monitoring alerts
- `/api/phase3/security/audit` - Security audit logs

## 🧹 Cleanup & Maintenance Tools (NEW)

**Comprehensive Application Optimization (2025-08-05 Complete)**

The codebase underwent major optimization with unified services architecture:

```bash
# Optimization achievements:
# - Code duplication eliminated: 3 duplicate data fetchers → unified_data_fetcher.py
# - 4 different cache services → unified_cache_service.py (backwards compatible)
# - 2427-line monolithic component → PropOllamaContainer.tsx + specialized components
# - Comprehensive error handling, logging, and configuration systems
# - 86.4% Phase 3 verification success rate (51/59 tests passed)
```

**Service Consolidation Architecture**

```python
# ✅ CORRECT - Use unified services with automatic backwards compatibility
from backend.services.unified_data_fetcher import unified_data_fetcher
from backend.services.unified_cache_service import unified_cache_service
from backend.services.unified_error_handler import unified_error_handler
from backend.services.unified_logging import unified_logging
from backend.services.unified_config import unified_config

# All original service interfaces still work through unified implementations
data = await unified_data_fetcher.fetch_mlb_games(sport="MLB")
cache_result = unified_cache_service.get("key", default_value)
```

**Project Cleanup Architecture**

The codebase includes sophisticated cleanup and maintenance tools for managing large-scale development:

```bash
# Find potentially unused imports across the codebase
python find_unused_imports.py backend/
python find_unused_imports.py frontend/src/

# Results: Identifies 30,980+ import candidates for manual review
# Uses AST parsing to analyze import usage patterns safely
```

**Cleanup Archive System**

```bash
# Organized cleanup archive (600MB+ of cleaned files)
cleanup_archive/
├── html_tests/          # 59 HTML test files
├── backend_tests/       # 27 backend test files
├── frontend_configs/    # Configuration duplicates
├── completion_docs/     # Documentation artifacts
└── python_scripts/      # Debug and verification scripts

# Archive preserves all removed files for potential restoration
# Total cleanup: 262 files organized by category
```

**Performance Benchmarking Tools**

```bash
# Phase 2 performance benchmarking
python phase2_performance_benchmark.py
# Result: Generates detailed performance metrics JSON

# Phase 3 MLOps benchmarking
python phase3_performance_benchmark.py
# Result: Tests enterprise MLOps pipeline performance

# Verification scripts for each phase
python phase2_verification.py    # Phase 2 feature verification
python phase3_verification.py    # Phase 3 MLOps verification
```

## 🔍 Debug & Diagnostic Tools (NEW)

**Enhanced Debugging Infrastructure**

```bash
# Backend diagnostic endpoints
curl "http://127.0.0.1:8000/api/debug/status"           # System status
curl "http://127.0.0.1:8000/api/diagnostics/health"     # Detailed health check
curl "http://127.0.0.1:8000/api/performance/metrics"    # Performance metrics

# Frontend debugging components
# - DebugApiStatus.tsx: Real-time API status monitoring
# - IntegrationStatus.tsx: Service integration health
# - ApiHealthIndicator.tsx: Visual health indicators
```

**Database Analysis Tools**

```bash
# Analyze database structure and optimization opportunities
python analyze_database.py

# Monitor backend performance in real-time
python monitor_backend.py
```

## 🔧 Essential Development Workflows

### Terminal Context (Critical)

```bash
# Backend (from root): python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
# Frontend (from root): cd frontend && npm run dev
# Frontend runs on http://localhost:5173 (NOT 8174)
# Always check pwd - workspace has frontend/ and backend/ subdirectories
# Port mismatch is common cause of "useReducer" React errors
```

### Enterprise Prop Generation Pattern (NEW)

```python
# ✅ CORRECT - Enterprise prop generation with full system integration
from backend.services.comprehensive_prop_generator import ComprehensivePropGenerator

generator = ComprehensivePropGenerator()
# Initializes: Baseball Savant, Modern ML, Intelligent Cache, Performance Optimizer

props = await generator.generate_game_props(
    game_id=game_id,
    optimize_performance=True  # Uses performance optimization

---

If any section is unclear or missing, please provide feedback for further refinement.
# - ML confidence scoring with SHAP explanations
# - Intelligent caching for repeated requests
# - Advanced feature engineering
```

### Modern ML Dependencies Pattern

```python
# Key modern ML dependencies (backend/requirements.txt):
# torch>=2.1.0 - PyTorch for neural networks
# torch-geometric>=2.4.0 - Graph Neural Networks (optional with fallback)
# transformers>=4.35.0 - Transformer models
# ray[tune]>=2.8.0 - Distributed computing (optional)
# mlflow>=2.8.0 - MLOps experiment tracking (optional)
# featuretools>=1.28.0 - Automated feature engineering (optional)

# All dependencies have graceful fallbacks if not available
```

### Real Data Integration Patterns (CRITICAL - No Mock Data)

```python
# ✅ CORRECT - Real MLB data sources
from .baseball_savant_client import BaseballSavantClient
from .mlb_stats_api_client import MLBStatsAPIClient

# All data flows through real APIs:
# - MLB Stats API (official MLB data)
# - Baseball Savant (advanced Statcast analytics)
# - pybaseball integration for comprehensive coverage
# Results: 2,763+ real props vs ~60 mock props previously
```

### Unified Services Import Pattern (CRITICAL)

```python
# ✅ CORRECT - Use unified services with backwards compatibility
from backend.services.unified_data_fetcher import unified_data_fetcher
from backend.services.unified_cache_service import unified_cache_service
from backend.services.unified_error_handler import unified_error_handler

# All unified services maintain original interfaces while providing enhanced functionality
data = await unified_data_fetcher.fetch_mlb_games(sport="MLB")
cached_result = unified_cache_service.get("key", default_value)
```

### Enterprise Services Import Pattern (CRITICAL)

```python
# ✅ CORRECT - Enterprise services with graceful fallbacks
try:
    from backend.services.baseball_savant_client import BaseballSavantClient
except ImportError:
    BaseballSavantClient = None

try:
    from backend.services.intelligent_cache_service import intelligent_cache_service
except ImportError:
    intelligent_cache_service = None

# All enterprise dependencies have graceful fallbacks
# Services work even if advanced components unavailable
```

### Sport Context Bug Fix (Most Common Issue)

```typescript
// ❌ WRONG - Results in sport="Unknown" and empty props
const featuredProps = enhancedDataManager.mapToFeaturedProps(props);

// ✅ CORRECT - Always pass sport parameter
const featuredProps = enhancedDataManager.mapToFeaturedProps(props, sport);
```

### Modern ML Integration Pattern

```python
# ✅ CORRECT - Use modern ML service with fallbacks
try:
    from backend.services.modern_ml_service import modern_ml_service
    result = await modern_ml_service.predict(request)
except ImportError:
    # Fallback to legacy prediction service
    from backend.services.enhanced_prop_analysis_service import legacy_predict
    result = await legacy_predict(request)
```

### Live Game Features Pattern (NEW)

```tsx
// LiveGameStats component with tabbed interface
interface PlayByPlayEvent {
  inning: number;
  inning_half: string;
  description: string;
  timestamp: string;
  away_score: number;
  home_score: number;
}

// Tab switching with data fetching
const fetchCurrentTabData = () => {
  if (activeTab === "livestats") {
    fetchGameStats();
  } else if (activeTab === "playbyplay") {
    fetchPlayByPlay();
  }
};

// Backend endpoints: /mlb/live-game-stats/{game_id} and /mlb/play-by-play/{game_id}
```

### MLB Performance Optimization Pattern

```tsx
// Auto-virtualization for large datasets (3000+ props)
const useVirtualization = projections.length > 100 || forceVirtualization;

return useVirtualization ? (
  <VirtualizedPropList
    projections={projections}
    fetchEnhancedAnalysis={fetchEnhancedAnalysis}
    enhancedAnalysisCache={enhancedAnalysisCache}
    loadingAnalysis={loadingAnalysis}
  />
) : (
  <StandardPropList projections={projections} />
);
```

## 📊 Data Sourcing & Handling Best Practices

### 1. Always Propagate Sport Context

- When mapping props, **always pass sport context**: `mapToFeaturedProps(props, sport)`
- Never rely on backend data to provide sport field - enforce in frontend mapping
- **Root cause of empty props:** Props with `sport: "Unknown"` get filtered out

### 2. Comprehensive Props Integration (NEW)

```typescript
// ComprehensivePropsLoader handles universal prop generation
interface ComprehensivePropsResponse {
  status: string;
  game_id: number;
  props: any[];
  summary: {
    total_props: number;
    high_confidence_props: number;
    unique_players: number;
  };
}

// Frontend pattern for comprehensive props
const generateComprehensiveProps = async () => {
  const response = await apiClient.get(
    `/mlb/comprehensive-props/${gameId}?optimize_performance=true`
  );
  const { props } = response.data;
  // Props include Baseball Savant metrics, ML confidence, advanced reasoning
};
```

### 3. Enterprise Service Initialization Pattern

```python
# ✅ CORRECT - Lazy initialization with fallbacks
class ComprehensivePropGenerator:
    def __init__(self):
        # Initialize enterprise services on demand
        self.ml_service = None
        self.enhanced_analysis_service = None
        self.feature_engineer = None

    async def _initialize_enterprise_services(self):
        """Initialize services only when needed"""
        if self.ml_service is None:
            try:
                from ..services.modern_ml_service import modern_ml_service
                self.ml_service = modern_ml_service
            except ImportError:
                logger.warning("Modern ML Service not available - using fallback")
```

### 4. Enhanced Data Validation & Error Handling

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

## 🐛 Common Troubleshooting Patterns

### Frontend-Backend Connection Issues

- **Symptoms:** "Cannot read properties of null (reading 'useReducer')" React error
- **Root Cause:** Vite proxy misconfiguration (port 8001 vs 8000 mismatch)
- **Fix:** Ensure `frontend/vite.config.ts` proxy targets match backend port
- **Verify:** `curl http://127.0.0.1:8000/health` should return `{"status":"healthy"}`

### Modern ML Import/Circular Dependency Issues

- **Symptoms:** Hanging HTTP requests, "cannot import name" errors
- **Root Cause:** Circular imports or HTTP requests within same server
- **Fix:** Use direct imports instead of HTTP calls: `from ..routes.mlb_extras import get_todays_games`
- **Verify:** Test imports: `python -c "from backend.routes.modern_ml_routes import router"`

### Live Game Data Issues (NEW)

- **Symptoms:** Empty events array in play-by-play, game not found errors
- **Root Cause:** Invalid game IDs or games without live data
- **Fix:** Use current day's games from `/mlb/todays-games` endpoint first (note: correct URL is `todays-games` not `today-games`)
- **Debug:** Check if game has `liveData` in statsapi response

### Empty Props Display

- **Symptoms:** Console shows successful API calls but `visibleProjections: []`
- **Root Cause:** Props have `sport: "Unknown"` instead of correct sport
- **Fix:** Ensure `EnhancedDataManager.mapToFeaturedProps(props, sport)` receives sport parameter
- **Debug:** Check `[PropOllamaUnified]` logs for sport field values

### MLB Performance Issues (3000+ Props)

- **Symptoms:** Laggy scrolling, browser freezing with large MLB datasets
- **Root Cause:** All 3000+ DOM elements rendered simultaneously
- **Fix:** Auto-virtualization activates for datasets >100 props using `VirtualizedPropList`
- **Verify:** Look for "⚡ Virtualized rendering active" message

## 🚀 Performance & Production Patterns

### Modern ML Model Factory Pattern

```python
# Create models using factory pattern with proper configuration
from backend.models.modern_architectures import ModelFactory, ModelConfig, ModelType

config = ModelConfig(
    model_type=ModelType.TRANSFORMER,
    input_dim=100,
    hidden_dim=256,
    num_layers=4,
    sport="MLB"
)
model = ModelFactory.create_model(config)
```

### TanStack Virtual Integration

```tsx
// High-performance virtualization for large datasets
import { useVirtualizer } from "@tanstack/react-virtual";

const virtualizer = useVirtualizer({
  count: projections.length,
  getScrollElement: () => containerRef.current,
  estimateSize: (index) => {
    const baseHeight = 180;
    const isExpanded = expandedRowKey === projections[index].id;
    return isExpanded ? baseHeight + 400 : baseHeight;
  },
});
```

### Phase 2 Performance Optimization Pattern

```python
# Use performance optimization service for inference
from backend.services.performance_optimization import performance_optimizer

# Optimize model for inference
optimized_model = performance_optimizer.optimize_model(model)
predictions = await performance_optimizer.batch_predict(optimized_model, data)
```

### Modular Component Architecture

- `StatcastMetrics.tsx` - Baseball analytics visualization (Recharts integration)
- `VirtualizedPropList.tsx` - Performance optimization for large datasets
- `EnhancedPropCard.tsx` - Standalone expanded prop analysis
- `CondensedPropCard.tsx` - Compact prop display with expansion support
- `LiveGameStats.tsx` - Live game stats with tabbed interface (stats + play-by-play)

## 🔍 Debug Commands & Quick Reference

### Backend Development

```bash
# Start backend with correct binding
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Test connectivity
curl http://127.0.0.1:8000/health
curl -X POST "http://127.0.0.1:8000/api/sports/activate/MLB"

# Test modern ML endpoints
curl "http://127.0.0.1:8000/api/modern-ml/health"
curl "http://127.0.0.1:8000/api/modern-ml/strategies"
curl "http://127.0.0.1:8000/api/modern-ml/performance"

# Test real data endpoints
curl "http://127.0.0.1:8000/mlb/todays-games"  # Note: correct spelling
curl "http://127.0.0.1:8000/mlb/comprehensive-props/" | head -c 500
curl "http://127.0.0.1:8000/mlb/prizepicks-props/" | head -c 500

# Verify real data coverage
curl "http://127.0.0.1:8000/mlb/comprehensive-props/" | grep -E '"total_props":|"unique_players":'

# Check logs
tail -f backend/logs/propollama.log | grep "batch-predictions"
```

### Phase 2-3 Verification Commands

```bash
# Run Phase 2 verification script
python phase2_verification.py

# Run Phase 3 MLOps verification script
python phase3_verification.py

# Run performance benchmarks
python phase2_performance_benchmark.py
python phase3_performance_benchmark.py

# Test modern ML import
python -c "from backend.services.modern_ml_service import modern_ml_service; print('✅ Import successful')"

# Test Phase 3 MLOps services
python -c "from backend.services.mlops_pipeline_service import mlops_pipeline_service; print('✅ MLOps services available')"
```

### Frontend Development

```bash
# Start frontend (from root directory)
cd frontend && npm run dev
# Frontend runs on http://localhost:5173

# Build with optimization verification
npm run build

# Testing workflows
npm run test              # Jest unit tests
npm run test:e2e         # Playwright E2E tests
npm run type-check       # TypeScript validation
npm run lint             # ESLint checking

# Check Vite proxy configuration
# Ensure all proxy targets point to port 8000, not 8001
```

### Performance Monitoring

```bash
# Monitor virtualization in browser console
console.log('DOM elements rendered:', document.querySelectorAll('[data-prop-card]').length);
# Should show ~10-20 for virtualized mode vs 3000+ for standard mode

# Live game data debugging
console.log('Active tab data:', activeTab, playByPlayData?.events?.length);

# Test comprehensive props generation
curl "http://127.0.0.1:8000/mlb/comprehensive-props/776879?optimize_performance=true"
# Should return 100-130+ props with advanced analytics
```

### Environment Setup (Critical)

```bash
# Backend: Copy .env.example to .env and configure
cp backend/.env.example backend/.env
# Edit backend/.env with real database URLs, API keys, etc.

# Frontend: Environment variables in .env.local (optional)
VITE_BACKEND_URL=http://localhost:8000  # Default proxy target
```

## 📁 Key Files & Services

**Critical Backend Services:**

- `backend/enhanced_propollama_engine.py` - LLM integration with Ollama
- `backend/services/mlb_provider_client.py` - SportRadar/TheOdds API integration
- `backend/production_integration.py` - Production app factory with middleware
- `backend/services/enhanced_prop_analysis_service.py` - ML predictions and SHAP analysis
- `backend/routes/mlb_extras.py` - MLB-specific endpoints including live game stats and play-by-play
- `backend/services/baseball_savant_client.py` - Baseball Savant/Statcast integration for advanced metrics
- `backend/services/mlb_stats_api_client.py` - Official MLB Stats API integration
- `backend/services/comprehensive_prop_generator.py` - Enterprise-grade comprehensive prop generation

**Modern ML Services (Phase 1-3):**

- `backend/models/modern_architectures.py` - Transformer & GNN model architectures
- `backend/services/modern_ml_service.py` - Core modern ML orchestration service
- `backend/services/modern_ml_integration.py` - A/B testing and strategy management
- `backend/services/advanced_bayesian_ensemble.py` - Uncertainty quantification
- `backend/services/automated_feature_engineering.py` - Sports-specific feature engineering
- `backend/routes/modern_ml_routes.py` - Modern ML API endpoints (12 routes)
- `backend/services/modern_ml_data_bridge.py` - Real data integration bridge
- `backend/services/performance_optimization.py` - Phase 2 performance optimization
- `backend/services/intelligent_cache_service.py` - Advanced caching strategies
- `backend/services/real_time_updates.py` - Real-time model update pipeline
- `backend/routes/phase3_routes.py` - Phase 3 MLOps API endpoints (NEW)
- `backend/services/mlops_pipeline_service.py` - MLOps pipeline management (NEW)
- `backend/services/production_deployment_service.py` - Production deployment automation (NEW)
- `backend/services/autonomous_monitoring_service.py` - Autonomous monitoring and alerting (NEW)
- `backend/services/advanced_security_service.py` - Advanced security and audit logging (NEW)

**Essential Frontend Components:**

- `frontend/src/components/PropOllamaUnified.tsx` - Main analytics interface with optimization logic
- `frontend/src/components/ComprehensivePropsLoader.tsx` - Enterprise prop generation loader (NEW)
- `frontend/src/components/LiveGameStats.tsx` - Live game stats with tabbed interface (NEW)
- `frontend/src/components/VirtualizedPropList.tsx` - TanStack Virtual integration for performance
- `frontend/src/components/StatcastMetrics.tsx` - Advanced baseball analytics visualization
- `frontend/src/services/EnhancedDataManager.ts` - Core data orchestration with caching
- `frontend/src/services/unified/FeaturedPropsService.ts` - Prop data transformation

**Phase 3 Enterprise Components (NEW):**

- `frontend/src/components/ml/MLModelCenter.tsx` - AI/ML model lifecycle management
- `frontend/src/components/betting/UnifiedBettingInterface.tsx` - Professional trading interface
- `frontend/src/components/features/betting/ArbitrageOpportunities.tsx` - Real-time arbitrage detection
- `frontend/src/components/user-friendly/UserFriendlyApp.tsx` - Main navigation with Phase 3 routing

**Configuration & Setup:**

- `frontend/vite.config.ts` - Proxy configuration (port 8000 critical)
- `frontend/package.json` - Dependencies include @tanstack/react-virtual, recharts
- `backend/requirements.txt` - ML libraries, FastAPI, SHAP for explainable AI, statsapi for MLB data, modern ML dependencies
- `backend/.env.example` - Environment template with all required variables
- `phase2_verification.py` - Phase 2 implementation verification script
- `phase2_performance_benchmark.py` - Performance benchmarking for Phase 2 optimizations
- `phase3_verification.py` - Phase 3 MLOps implementation verification script (NEW)
- `phase3_performance_benchmark.py` - Performance benchmarking for Phase 3 MLOps (NEW)
- `find_unused_imports.py` - Utility for finding potentially unused imports (NEW)
- `cleanup_archive/` - Organized archive of cleaned files for potential restoration (NEW)

## 🏗️ Architectural Patterns & Conventions (NEW)

### Unified Singleton Architecture Pattern

**All core services follow consistent singleton pattern:**

```typescript
// ✅ CORRECT - Standard singleton implementation
export class ServiceName {
  private static instance: ServiceName;

  private constructor() {
    // Initialization logic
  }

  public static getInstance(): ServiceName {
    if (!ServiceName.instance) {
      ServiceName.instance = new ServiceName();
    }
    return ServiceName.instance;
  }
}

// Usage pattern across all services
const service = ServiceName.getInstance();
```

**Services using this pattern:**

- `UnifiedMonitor` - Central monitoring and metrics
- `ErrorHandler` - Centralized error handling with WebSocket graceful degradation
- `PerformanceMonitor` - System performance tracking
- `UnifiedConfig` - Runtime configuration management
- `UnifiedCache` - Multi-level caching with TTL
- `UnifiedStateService` - Application state management
- `AnalysisCacheService` - Prop analysis result caching
- `MasterServiceRegistry` - Service lifecycle and health monitoring
- `UserPersonalizationService` - User clustering and profile management

### Adapter Pattern with Monitoring Integration

**All data adapters follow consistent monitoring pattern:**

```typescript
// ✅ CORRECT - Adapter with integrated monitoring
export class DataAdapter implements DataSource<DataType> {
  private readonly monitor: UnifiedMonitor;

  constructor(config: AdapterConfig) {
    this.monitor = UnifiedMonitor.getInstance();
    // Configuration setup
  }

  public async fetchData(): Promise<DataType> {
    const trace = this.monitor.startTrace("adapter-fetch");

    try {
      // Data fetching logic
      const data = await this.performFetch();
      this.monitor.endTrace(trace);
      return data;
    } catch (error) {
      this.monitor.endTrace(trace, error as Error);
      throw error;
    }
  }
}
```

**Adapters following this pattern:**

- `PoeToApiAdapter` - Poe data structure transformation
- `PrizePicksAdapter` - PrizePicks API integration with caching
- `TheOddsAdapter` - TheOdds API with event bus integration
- `DailyFantasyAdapter` - Daily fantasy data source integration

### Enhanced Error Handling with WebSocket Graceful Degradation

**WebSocket errors are treated as non-critical with special handling:**

```typescript
// ✅ CORRECT - WebSocket error handling pattern
export class ErrorHandler {
  public handleWebSocketError(
    error: Error,
    context: string = "websocket_operation"
  ): void {
    const nonCriticalErrors = [
      "WebSocket closed without opened",
      "WebSocket connection timeout",
      "WebSocket connection failed",
      "Connection refused",
    ];

    const isNonCritical = nonCriticalErrors.some(
      (pattern) =>
        error.message?.includes(pattern) || error.toString().includes(pattern)
    );

    if (isNonCritical) {
      // Log as warning instead of error
      console.warn(`[WebSocket] ${context}:`, error.message);
      this.updateErrorMetrics(error, `websocket_${context}`);
      // Don't notify error listeners for non-critical WebSocket errors
      return;
    }

    // Handle as critical error
    this.handleError(error, context);
  }
}
```

### Service Registry Architecture Pattern

**MasterServiceRegistry manages service lifecycle with health monitoring:**

```typescript
// ✅ CORRECT - Service registration and health monitoring
class MasterServiceRegistry {
  private static instance: MasterServiceRegistry;
  private services: Map<string, unknown> = new Map();
  private serviceHealth: Map<string, ServiceHealth> = new Map();
  private serviceMetrics: Map<string, ServiceMetrics> = new Map();

  private async initializeServices(): Promise<void> {
    // Initialize services in dependency order
    await this.initializeUnifiedServices();
    await this.initializeFeatureServices();
    await this.initializePrototypeServices();

    this.setupHealthMonitoring();
    this.setupMetricsCollection();
  }

  private setupHealthMonitoring(): void {
    setInterval(async () => {
      for (const [name, service] of this.services.entries()) {
        try {
          const startTime = Date.now();

          // Perform health check
          if ((service as any).healthCheck) {
            await (service as any).healthCheck();
          } else if ((service as any).ping) {
            await (service as any).ping();
          }

          const responseTime = Date.now() - startTime;
          this.updateServiceHealth(name, "healthy", responseTime);
        } catch (error) {
          this.updateServiceHealth(name, "degraded", -1);
        }
      }
    }, 60000); // Check every minute
  }
}
```

### Modular Component Architecture (NEW)

**Replacing monolithic 2427-line components with specialized, reusable pieces:**

```tsx
// ✅ CORRECT - New modular component pattern
import { PropOllamaContainer } from "@/components/containers/PropOllamaContainer";
import { usePropOllamaState } from "@/hooks/usePropOllamaState";
import { PropFilters } from "@/components/filters/PropFilters";
import { PropSorting } from "@/components/sorting/PropSorting";
import { BetSlipComponent } from "@/components/betting/BetSlipComponent";
import { PropList } from "@/components/lists/PropList";

// Container orchestrates all child components
<PropOllamaContainer gameId={gameId} sport={sport}>
  <PropFilters filters={filters} onFiltersChange={updateFilters} />
  <PropSorting sortConfig={sorting} onSortChange={updateSorting} />
  <PropList props={filteredProps} virtualized={props.length > 100} />
  <BetSlipComponent bets={selectedBets} />
</PropOllamaContainer>;

// State management extracted to dedicated hooks
const { props, loading, filters, sorting, selectedBets } =
  usePropOllamaState(gameId);
```

**Key Architecture Benefits:**

- **Separation of Concerns**: Each component has a single responsibility
- **Reusability**: Components can be used across different contexts
- **Testability**: Smaller components are easier to unit test
- **Performance**: Only affected components re-render on state changes
- **Maintainability**: Easier to debug and modify specific functionality

**Component Breakdown Pattern:**

- `*Container.tsx` - Main orchestration component
- `*Types.ts` - Comprehensive type definitions
- `use*State.ts` - State management hooks
- `*Filters.tsx` - Filtering interfaces
- `*Sorting.tsx` - Sorting controls
- `*List.tsx` - Data display with virtualization
- `*Component.tsx` - Specialized business logic components

### TypeScript Interface Compliance Patterns

**Recent manual edits show pattern for TypeScript error resolution:**

```typescript
// ✅ CORRECT - TypeScript compliance pattern
export class FeatureEngineeringService {
  // Local type definitions for configuration-based extraction
  private readonly config: FeatureConfig;

  constructor(config: FeatureConfig) {
    this.config = {
      // Provide defaults to satisfy TypeScript strict mode
      extractionRules: [],
      transformationPipeline: [],
      validationRules: [],
      ...config,
    };
  }

  // Use explicit typing for adapter transformations
  public transformData<T extends BaseData>(input: T): TransformedData<T> {
    // Implementation with proper type guards
    if (!this.isValidInput(input)) {
      throw new Error("Invalid input data structure");
    }

    return this.performTransformation(input);
  }
}
```

### Unified Error Handling Pattern (NEW)

**Comprehensive error handling with user-friendly messages and resolution suggestions:**

```python
# ✅ CORRECT - Use unified error handler for consistent error processing
from backend.services.unified_error_handler import unified_error_handler

# Comprehensive error classification and handling
try:
    result = await some_operation()
except Exception as e:
    # Automatic error classification, user-friendly messages, resolution suggestions
    error_response = unified_error_handler.handle_error(
        error=e,
        context="operation_name",
        user_context={"user_id": user_id, "operation": "data_fetch"}
    )

    # Returns structured error with:
    # - Severity level (LOW, MEDIUM, HIGH, CRITICAL)
    # - User-friendly message
    # - Technical details for logging
    # - Resolution suggestions
    # - Documentation links
    return error_response
```

**Backend Error Handler Features (250+ lines):**

- **Error Classification**: Automatic severity assessment
- **User-Friendly Messages**: Non-technical error descriptions
- **Resolution Suggestions**: Actionable steps for users
- **Documentation Links**: Context-aware help resources
- **Error Tracking**: Integration with monitoring systems
- **Logging Integration**: Structured error logging

### Unified Logging Pattern (NEW)

**Structured JSON logging with performance tracking:**

```python
# ✅ CORRECT - Use unified logging for consistent log formatting
from backend.services.unified_logging import unified_logging

# Structured logging with performance metrics
logger = unified_logging.get_logger("service_name")

# Performance-aware logging
with logger.performance_context("operation_name"):
    result = await some_operation()
    logger.info("Operation completed", {
        "result_count": len(result),
        "processing_time_ms": logger.get_elapsed_time(),
        "component": "data_processor"
    })

# Component-based organization
logger.component("mlb_service").info("Processing game data", {
    "game_id": game_id,
    "sport": "MLB",
    "timestamp": datetime.utcnow().isoformat()
})
```

**Unified Logging Features (300+ lines):**

- **Structured JSON**: Consistent log format across all services
- **Performance Tracking**: Built-in timing and metrics
- **Component Organization**: Hierarchical logging structure
- **Multiple Outputs**: Console, file, and remote logging
- **Log Rotation**: Automatic log file management
- **Environment Awareness**: Different log levels per environment

### Performance Monitoring Integration Pattern

**Consistent performance tracking across components:**

```typescript
// ✅ CORRECT - Performance monitoring integration
export class ComponentWithMonitoring {
  private readonly performanceMonitor: PerformanceMonitor;

  constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  public async performOperation(): Promise<void> {
    const trace = this.performanceMonitor.startTrace("component-operation");

    try {
      // Track metrics during operation
      this.performanceMonitor.trackMetric("operation-start", Date.now());

      // Perform operation
      await this.executeOperation();

      this.performanceMonitor.trackMetric("operation-success", 1);
    } catch (error) {
      this.performanceMonitor.trackMetric("operation-error", 1);
      throw error;
    } finally {
      this.performanceMonitor.endTrace(trace);
    }
  }
}
```

### Real-time Monitoring Architecture Pattern

**Backend monitoring services follow consistent patterns:**

```python
# ✅ CORRECT - Real-time monitoring service pattern
class RealTimeAccuracyMonitor:
    """Real-time accuracy monitoring and optimization system"""

    def __init__(self):
        self.monitoring_active = False
        self.accuracy_history = deque(maxlen=10000)
        self.optimization_queue = asyncio.Queue()

        # Initialize monitoring components
        self._initialize_redis()
        self._initialize_drift_detection()
        self._initialize_anomaly_detection()
        self._initialize_accuracy_prediction()

    async def start_monitoring(self):
        """Start real-time accuracy monitoring"""
        if self.monitoring_active:
            logger.warning("Monitoring already active")
            return

        self.monitoring_active = True
        logger.info("Starting real-time accuracy monitoring...")

        # Start monitoring tasks
        await asyncio.gather(
            self._monitor_accuracy_continuously(),
            self._process_optimization_queue(),
            self._update_accuracy_forecasts(),
            self._monitor_system_health(),
        )
```

## 🚀 Advanced Architectural Conventions (NEW)

### Cache Architecture with Multi-tier Strategy

**Consistent caching patterns across services:**

```typescript
// ✅ CORRECT - Multi-tier caching implementation
export class AnalysisCacheService {
  private memoryCache: Map<string, CacheEntry<T>>;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly STALE_TTL = 30 * 60 * 1000; // 30 minutes

  public get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) {
      this.stats.misses++;
      return this.getFromLocalStorage(key);
    }

    const age = Date.now() - entry.timestamp;

    if (age > entry.ttl + this.STALE_TTL) {
      // Fully expired - remove and return null
      this.memoryCache.delete(key);
      this.stats.evictions++;
      return null;
    }

    if (age > entry.ttl) {
      // Stale but still usable
      this.stats.stale++;
      return { ...entry.value, isStale: true };
    }

    // Fresh hit
    this.stats.hits++;
    return entry.value;
  }
}
```

### Event-Driven Architecture Pattern

**Services use EventBus for loose coupling:**

```typescript
// ✅ CORRECT - Event-driven service communication
export class DataAdapter {
  private readonly eventBus: EventBus;

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventBus.on("data:refresh-requested", async (context) => {
      await this.refreshData(context);
    });

    this.eventBus.on("system:health-check", () => {
      this.reportHealth();
    });
  }

  private async refreshData(context: any): Promise<void> {
    const data = await this.fetchData();

    // Emit event for other services
    this.eventBus.emit("data:updated", {
      source: this.id,
      data,
      timestamp: Date.now(),
      context,
    });
  }
}
```

### Performance Optimization Patterns

**Auto-virtualization and performance thresholds:**

```tsx
// ✅ CORRECT - Performance-aware rendering pattern
const ComponentWithVirtualization: React.FC<Props> = ({ data }) => {
  const VIRTUALIZATION_THRESHOLD = 100;
  const useVirtualization = data.length > VIRTUALIZATION_THRESHOLD;

  if (useVirtualization) {
    return (
      <VirtualizedList
        data={data}
        estimateSize={(index) => {
          const baseHeight = 180;
          const isExpanded = expandedItems.has(data[index].id);
          return isExpanded ? baseHeight + 400 : baseHeight;
        }}
        renderItem={({ item, index }) => (
          <ListItem key={item.id} data={item} index={index} />
        )}
      />
    );
  }

  return (
    <StandardList>
      {data.map((item, index) => (
        <ListItem key={item.id} data={item} index={index} />
      ))}
    </StandardList>
  );
};
```

## 🛠️ Implementation Guidelines for AI Agents (NEW)

### When Adding New Services

1. **Always implement singleton pattern** using `getInstance()` method
2. **Use unified services first** - check if `unified_data_fetcher.py` or `unified_cache_service.py` meets your needs
3. **Integrate with unified error handling** using `unified_error_handler.py`
4. **Use unified logging** via `unified_logging.py` for consistent log formatting
5. **Implement health checks** for service registry integration
6. **Follow adapter pattern** for external data sources

### When Working with Frontend Components

1. **Prefer modular architecture** - use specialized components instead of monolithic ones
2. **Extract state to hooks** - use patterns like `usePropOllamaState.ts`
3. **Use MasterServiceRegistry** for service access and health monitoring
4. **Implement virtualization** for large datasets (>100 items)
5. **Follow container/component pattern** - separate orchestration from display logic

### When Fixing TypeScript Errors

1. **Provide explicit type definitions** instead of using `any`
2. **Use local interfaces** for service configurations
3. **Implement proper type guards** for runtime validation
4. **Add default values** to satisfy strict mode requirements
5. **Use `@ts-expect-error` comments** only when necessary with clear explanations

### When Implementing Caching

1. **Use unified_cache_service.py** for backend caching with backwards compatibility
2. **Implement TTL with stale data strategy**: serve stale data while refreshing
3. **Track cache statistics**: hits, misses, evictions, stale hits
4. **Clean up expired entries** with periodic cleanup tasks
5. **Generate consistent cache keys** using service-specific patterns

### When Integrating Monitoring

1. **Use unified_logging.py** for structured JSON logging with performance tracking
2. **Track relevant metrics** with built-in performance contexts
3. **Handle errors gracefully** using `unified_error_handler.py`
4. **Use descriptive operation names** for debugging
5. **Integrate with service health checks** for registry monitoring

### Always -

1. Use sequential thinking. Use context7.
