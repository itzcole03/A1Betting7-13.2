# Cache Performance Analysis - Phase 2.3

## Current Caching State Review

### LRU Cache Usage Analysis
Found the following `@lru_cache` implementations:

1. **backend/config/settings.py:410** - `get_settings()` with default maxsize
   - ✅ **Good**: Settings are immutable and benefit from caching
   - ✅ **Proper Usage**: Single instance caching prevents redundant environment reads

2. **backend/sports_expert_api.py:466** - `get_last_notification_time()` with maxsize=100
   - ✅ **Good**: Rate limiting data that's frequently accessed
   - ✅ **Appropriate Size**: 100 items reasonable for notification rate limiting

3. **backend/services/core/enhanced_quantum_service.py:124** - `compute_energy()` with maxsize=1024
   - ✅ **Excellent**: Computationally expensive quantum calculations
   - ✅ **Large Cache**: High maxsize appropriate for complex calculations

4. **backend/services/advanced_feature_engine.py:558** - `_get_ballpark_factors()` with maxsize=1
   - ⚠️ **Review Needed**: Static data that doesn't change - could be moved to constants
   - ✅ **Functional**: Works but could be optimized

### Current Cache.set() Patterns

#### High-Frequency API Caching (✅ Good)
- **SportsBook APIs**: BetMGM (3min), DraftKings (2min), props (60-90s)
  - ✅ Short TTLs appropriate for live odds
  - ✅ Using unified cache service

#### Dashboard & UI Caching (✅ Good)  
- **Dashboard layouts**: 1-30 days TTL
- **Widget data**: Variable TTL based on content type
- ✅ Long TTLs appropriate for user preferences

#### Prediction & Model Caching (🔄 Optimization Potential)
- **Cache optimizer**: prediction_data (30min), opportunities (10min), models (1hr)
- ⚠️ **Not using Redis**: Currently in-memory only for some operations
- 🎯 **Target for Redis migration**

## Redis Implementation Status

### Currently Using Redis
- ✅ **Configuration**: Redis URL configured in config_manager.py
- ✅ **MLB routes**: Specific cache flush operations
- ✅ **Data sources**: Rate limiting with Redis fallback
- ✅ **Enhanced realtime**: Event results caching

### Not Using Redis (Optimization Targets)
- 🎯 **Prediction results** - Currently in-memory, should use Redis
- 🎯 **Model performance metrics** - Heavy computation, perfect for Redis
- 🎯 **Arbitrage opportunities** - Cross-session persistence needed
- 🎯 **Frequently accessed read-only data** - Player stats, team data

## Recommendations for Redis Migration

### Priority 1: Prediction Endpoints
```python
# Target endpoints for Redis caching:
# /api/ml/predict/single - Cache by input hash (TTL: 30min)
# /api/ml/predict/batch - Cache by batch hash (TTL: 30min)  
# /api/betting-opportunities - Cache opportunities (TTL: 5min)
# /api/arbitrage-opportunities - Cache arbitrage data (TTL: 2min)
```

### Priority 2: Static/Semi-Static Data  
```python
# Target data for Redis caching:
# Team/Player statistics (TTL: 1hr)
# Historical performance data (TTL: 24hrs)
# Model metadata (TTL: 1hr)
# Ballpark factors (TTL: 7 days)
```

### Priority 3: Cross-Session Data
```python
# User dashboard preferences (TTL: 30 days)
# Model training results (TTL: 24hrs) 
# Performance analytics (TTL: 1hr)
```

## Cache Invalidation Strategy

### Automatic Invalidation Triggers
- **Live games**: Invalidate predictions when game state changes
- **Model updates**: Clear model-related caches when new models deployed
- **Data updates**: Invalidate team/player caches on stats updates

### Manual Invalidation Routes
- Already implemented: `/debug/flush-odds-comparison-cache`
- Need to add: Model cache flush, prediction cache flush endpoints

## Next Steps for Implementation

1. ✅ **Review completed** - Current caching patterns analyzed
2. 🔄 **Next**: Implement Redis caching for prediction endpoints
3. 🔄 **Next**: Add cache invalidation logic for data updates
4. 🔄 **Next**: Create performance monitoring for cache hit rates

## Current Cache TTL Summary

| Cache Type | Current TTL | Recommendation |
|------------|-------------|----------------|
| Live Odds | 60-180s | ✅ Appropriate |
| Predictions | In-memory only | 🎯 30min Redis |
| Dashboard | 1hr-30days | ✅ Appropriate |
| Static Data | No caching | 🎯 1hr-7days Redis |
| Model Results | 30min in-memory | 🎯 30min Redis |
| Opportunities | 10min in-memory | 🎯 5min Redis |
