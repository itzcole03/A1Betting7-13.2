# Production Fix Refactoring Plan

## Current Structure (3,216 lines)
- 30 functions
- 7 classes
- Mixed concerns: API routes, ML engines, player data, betting logic

## Refactoring Strategy

### 1. Extract Player Data → `backend/data/players/`
**Target files:**
- `mlb_players.py` - MLB player data (146 lines)
- `nba_players.py` - NBA player data (97 lines)
- `wnba_players.py` - WNBA player data (91 lines)
- `mls_players.py` - MLS player data (553 lines)
- `__init__.py` - Aggregator

**Lines saved:** ~887 lines

### 2. Extract ML Classes → `backend/services/ml/`
**Target files:**
- `lazy_loader.py` - LazyMLLoader class
- `prediction_engine.py` - MLPredictionEngine, CoreMLEngine
- `__init__.py`

**Lines saved:** ~400 lines

### 3. Extract Betting Logic → `backend/domains/betting/`
**Target files:**
- `analyzer.py` - BettingAnalyzer class
- `risk_manager.py` - RiskManager class
- `ultimate_analyzer.py` - UltimateBettingAnalyzer class
- `__init__.py`

**Lines saved:** ~600 lines

### 4. Extract PrizePicks Service → `backend/services/prizepicks/`
**Target files:**
- `data_service.py` - PrizePicksDataService class
- `client.py` - API client logic
- `__init__.py`

**Lines saved:** ~300 lines

### 5. Keep API Routes → `backend/routes/production_routes.py`
**Remaining:**
- FastAPI app initialization
- Route handlers (30 functions)
- Lifespan management

**Lines remaining:** ~800-1000 lines

## Expected Outcome
- Original: 3,216 lines in 1 file
- Refactored: ~1,000 lines across 15+ files
- Reduction: ~69% in main file
- Improved: Clear separation of concerns
