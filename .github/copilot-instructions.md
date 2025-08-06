# Copilot Agent Instructions: A1Betting7-13.2

## Architecture & Service Boundaries

A1Betting7-13.2 is a full-stack sports analytics platform for AI-powered prop generation and betting insights. It uses FastAPI (Python) for backend APIs and React (TypeScript) for the frontend. Key backend services include modern ML pipelines, advanced caching, real-time updates, and comprehensive prop generation. All data flows use real MLB APIs—no mock data.

**🆕 Recent Major Optimization (2025-08-05):**

- **Service Consolidation**: 3 duplicate data fetchers → `unified_data_fetcher.py` (413 lines)
- **Cache Unification**: 4 different cache services → `unified_cache_service.py` (123 lines, backwards compatible)
- **Frontend Modularization**: 2427-line monolithic component → specialized modular components
- **Comprehensive Infrastructure**: Unified error handling, logging, and configuration systems
- **86.4% Phase 3 verification success rate** (51/59 tests passed)

**Major Components:**

- Backend: `backend/main.py` (entry), `backend/production_integration.py` (app factory)
- Frontend: `frontend/src/App.tsx`, `frontend/src/components/containers/PropOllamaContainer.tsx`
- Unified Services: `unified_data_fetcher.py`, `unified_cache_service.py`, `unified_error_handler.py`, `unified_logging.py`, `unified_config.py`
- Prop Generation: `backend/services/comprehensive_prop_generator.py`
- Modern ML: `backend/services/modern_ml_service.py`, `backend/models/modern_architectures.py`
- Real-time: `backend/services/real_time_updates.py`

## Developer Workflows

**Build & Run:**

- Backend: `python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload`
- Frontend: `cd frontend && npm run dev`
- Always check workspace root for `frontend/` and `backend/` folders.

**Testing:**

- Backend: `pytest` (unit/integration)
- Frontend: `npm run test` (Jest), `npm run test:e2e` (Playwright)

**Unified Services Architecture (NEW):**

- Backend unified services: `unified_data_fetcher.py`, `unified_cache_service.py`, `unified_error_handler.py`, `unified_logging.py`, `unified_config.py`
- Frontend unified services: `MasterServiceRegistry.ts` orchestrates all services with health monitoring
- All services follow singleton pattern with backwards compatibility

**Performance & Verification:**

- Phase 2: `python phase2_verification.py`, `python phase2_performance_benchmark.py`
- Phase 3: `python phase3_verification.py`, `python phase3_performance_benchmark.py`

**Debugging:**

- Backend endpoints: `/api/debug/status`, `/api/diagnostics/health`, `/api/performance/metrics`
- Frontend: `DebugApiStatus.tsx`, `IntegrationStatus.tsx`, `ApiHealthIndicator.tsx`

## Project-Specific Patterns

**🆕 Unified Services Architecture (Critical):**

```python
# Backend - Use unified services with backwards compatibility
from backend.services.unified_data_fetcher import unified_data_fetcher
from backend.services.unified_cache_service import unified_cache_service

# All unified services maintain backwards compatibility
data = await unified_data_fetcher.fetch_mlb_games(sport="MLB")
cached_result = unified_cache_service.get("key", default_value)
```

```typescript
// Frontend - Master Service Registry pattern
import { MasterServiceRegistry } from "@/services/MasterServiceRegistry";

const registry = MasterServiceRegistry.getInstance();
const dataService = registry.getService("data");
const cacheService = registry.getService("cache");

// All services follow singleton pattern with health monitoring
```

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

## Integration Points & External Dependencies

- MLB Stats API, Baseball Savant, pybaseball: All data is real, not mocked
- ML libraries: torch, transformers, ray, mlflow, featuretools (see `backend/requirements.txt`)
- Frontend: TanStack Virtual, Recharts, Zustand, Framer Motion

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

- Always check port configuration (8000 backend, 5173 frontend)
- Use `/mlb/todays-games` for valid game IDs
- For empty props, check sport context and backend logs
- All business rule violations are logged with bet IDs
- Use virtualization for large prop lists

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
)

# Result: 100-130+ props with advanced analytics:
# - Baseball Savant metrics (xBA, xSLG, barrel rate)
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
