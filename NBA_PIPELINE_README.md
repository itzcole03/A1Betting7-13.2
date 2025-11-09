# NBA Data Pipeline Architecture

## Overview

This document describes the clean NBA-only data pipeline implemented for the A1Betting platform. The pipeline ensures all NBA data comes from the official NBA Stats API (stats.nba.com) via the `nba_api` library, with no mock or fake data.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend / API Layer                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend Services (Application Layer)            │
│  - PropFinder Service                                        │
│  - ML Prediction Service                                     │
│  - Cheatsheets Service                                       │
│  - EV Feed Service                                           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   NBA Data Adapter Layer                     │
│  File: backend/services/nba_data_adapter.py                  │
│                                                              │
│  Features:                                                   │
│  - Caching (15min-1hr TTL)                                   │
│  - Error handling                                            │
│  - Convenience methods                                       │
│  - Single source of truth                                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  NBA Provider Client Layer                   │
│  File: backend/services/nba_provider_client.py               │
│                                                              │
│  Features:                                                   │
│  - Direct nba_api integration                                │
│  - Async/await support                                       │
│  - Retry logic with exponential backoff                      │
│  - Real NBA API calls only                                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      nba_api Library                         │
│  (Third-party library for NBA Stats API)                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   stats.nba.com API                          │
│              (Official NBA Statistics API)                   │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. NBA Provider Client (`nba_provider_client.py`)

The low-level client that directly interfaces with the `nba_api` library.

**Key Methods:**
- `fetch_teams()` - Get all NBA teams
- `fetch_players(team_id)` - Get players for a team
- `fetch_todays_games()` - Get today's games
- `fetch_games_for_date(date)` - Get games for a specific date
- `generate_player_props(target_date, lookahead_days)` - Generate player props

**Features:**
- Async/await support using `asyncio.to_thread()`
- Retry logic with exponential backoff (configurable via env vars)
- Fallback to `scoreboardv2` if `leaguegamefinder` fails
- No mock data or random generation

### 2. NBA Data Adapter (`nba_data_adapter.py`)

The high-level adapter that wraps the provider client and adds caching and convenience methods.

**Key Methods:**
- `get_all_teams(use_cache)` - Get all teams with caching
- `get_team_by_abbreviation(abbr)` - Find team by abbreviation
- `get_team_roster(team_id)` - Get team roster
- `get_todays_games()` - Get today's games
- `get_games_for_date(date)` - Get games for specific date
- `get_player_props(target_date, lookahead_days)` - Get player props
- `get_active_players()` - Get all active players
- `find_player_by_name(name)` - Find player by name (fuzzy match)
- `get_upcoming_games(days)` - Get games for next N days

**Caching Strategy:**
- Teams: 1 hour TTL (rarely change)
- Rosters: 30 minutes TTL (can change during season)
- Games: 10 minutes TTL (update frequently)
- Props: 15 minutes TTL (update frequently)
- Active players: 1 hour TTL (rarely change)

**Cache Management:**
- `clear_cache()` - Clear all cached data
- `get_cache_stats()` - Get cache statistics

## Usage Examples

### Example 1: Get Today's NBA Games

```python
from backend.services.nba_data_adapter import nba_data_adapter

async def get_games():
    games = await nba_data_adapter.get_todays_games()
    for game in games:
        print(f"Game: {game['home_team_id']} vs {game['visitor_team_id']}")
```

### Example 2: Get Team Roster

```python
from backend.services.nba_data_adapter import nba_data_adapter

async def get_lakers_roster():
    # Find Lakers team
    lakers = await nba_data_adapter.get_team_by_abbreviation("LAL")
    if lakers:
        # Get roster
        roster = await nba_data_adapter.get_team_roster(lakers['id'])
        for player in roster:
            print(f"{player['full_name']} - {player['position']}")
```

### Example 3: Generate Player Props

```python
from backend.services.nba_data_adapter import nba_data_adapter

async def get_props():
    # Get props for next 7 days
    props = await nba_data_adapter.get_player_props(lookahead_days=7)
    for prop in props:
        print(f"{prop['player']} - {prop['market']}: {prop['projection']}")
```

### Example 4: Find Player by Name

```python
from backend.services.nba_data_adapter import nba_data_adapter

async def find_lebron():
    player = await nba_data_adapter.find_player_by_name("LeBron James")
    if player:
        print(f"Found: {player['full_name']} (ID: {player['id']})")
```

## Environment Variables

Configure the NBA provider client behavior:

```bash
# Maximum retries for NBA API calls (default: 3)
PROPFINDER_NBA_MAX_RETRIES=3

# Base delay for retry backoff in seconds (default: 1)
PROPFINDER_NBA_RETRY_DELAY=1

# Lookahead days for prop generation (default: 30)
PROPFINDER_NBA_LOOKAHEAD_DAYS=30
```

## Migration Guide

### For Services Using Mock Data

**Before:**
```python
def get_player_stats(player_id):
    # Mock data
    return {
        "points": random.randint(10, 30),
        "rebounds": random.randint(5, 15)
    }
```

**After:**
```python
from backend.services.nba_data_adapter import nba_data_adapter

async def get_player_stats(player_name):
    player = await nba_data_adapter.find_player_by_name(player_name)
    if player:
        # Get real data from NBA API
        props = await nba_data_adapter.get_player_props()
        # Filter for this player
        player_props = [p for p in props if p['player_id'] == player['id']]
        return player_props
    return []
```

### For Services Using Multiple Data Sources

**Before:**
```python
# Mixing MLB, NBA, NFL data
def get_all_props():
    mlb_props = get_mlb_props()  # Mock data
    nba_props = get_nba_props()  # Mock data
    nfl_props = get_nfl_props()  # Mock data
    return mlb_props + nba_props + nfl_props
```

**After (NBA-only):**
```python
from backend.services.nba_data_adapter import nba_data_adapter

async def get_all_props():
    # Only NBA props from real API
    nba_props = await nba_data_adapter.get_player_props()
    return nba_props
```

## Data Quality

### Real NBA API Data

All data comes from the official NBA Stats API (stats.nba.com) via the `nba_api` library. This ensures:

- ✅ Accurate team information
- ✅ Current rosters
- ✅ Real game schedules
- ✅ Official player data
- ✅ No mock or fake data

### Limitations

The NBA Stats API has some limitations:

1. **Rate Limits:** The API may rate-limit requests. The provider client implements retry logic with exponential backoff.

2. **Timeouts:** The API can be slow or timeout. The adapter caches data to reduce API calls.

3. **Offseason:** During the offseason, there may be no games. The `generate_player_props()` method will look ahead up to 30 days (configurable) to find games.

4. **Player Stats:** The current implementation generates simple projections based on player positions. For more accurate projections, integrate historical stats from the NBA API.

## Testing

### Unit Tests

Mock the `nba_api` library responses:

```python
from unittest.mock import AsyncMock, patch

@patch('backend.services.nba_provider_client.nba_teams.get_teams')
async def test_get_teams(mock_get_teams):
    mock_get_teams.return_value = [
        {"id": 1, "full_name": "Los Angeles Lakers", "abbreviation": "LAL"}
    ]
    
    teams = await nba_data_adapter.get_all_teams(use_cache=False)
    assert len(teams) == 1
    assert teams[0]['abbreviation'] == 'LAL'
```

### Integration Tests

Test against the real NBA API (may be slow):

```python
async def test_real_nba_api():
    teams = await nba_data_adapter.get_all_teams(use_cache=False)
    assert len(teams) == 30  # NBA has 30 teams
```

## Monitoring

### Cache Statistics

Monitor cache performance:

```python
stats = nba_data_adapter.get_cache_stats()
print(f"Active cache keys: {stats['active_keys']}")
print(f"Expired keys: {stats['expired_keys']}")
```

### Logging

The adapter logs all operations:

```
[INFO] Cached data for key: all_teams (TTL: 1:00:00)
[DEBUG] Cache hit for key: all_teams
[ERROR] Failed to fetch NBA teams: Connection timeout
```

## Cleanup Summary

### Deleted Services (30 files)

The following unused services were deleted to clean up the codebase:

- enhanced_integration_manager.py (809 LOC)
- odds_storage_service.py (738 LOC)
- export_service.py (664 LOC)
- database_migration_service.py (536 LOC)
- cache_warming_service.py (417 LOC)
- And 25 more services

**Total:** ~9,000 lines of dead code removed

### Services with Mock Data (48 files)

The following services still contain mock data and should be refactored or deleted:

**High Priority (Top 10):**
1. comprehensive_feature_engine.py (220 occurrences)
2. niche_sports_integration_service.py (144 occurrences)
3. multi_sport_integration_service.py (112 occurrences)
4. alternative_data_sources_service.py (89 occurrences)
5. data_warehouse_optimization_service.py (82 occurrences)
6. advanced_player_tracking_service.py (76 occurrences)
7. real_ml_service.py (37 occurrences)
8. unified_data_fetcher.py (35 occurrences)
9. enhanced_ml_ensemble_service.py (26 occurrences)
10. cheatsheets_service.py (20 occurrences)

## Next Steps

1. ✅ Create NBA data adapter (completed)
2. 🔄 Refactor high-priority services to use adapter
3. 🔄 Delete or disable non-NBA services
4. 🔄 Update API endpoints to use adapter
5. 🔄 Add comprehensive tests
6. 🔄 Update documentation
7. 🔄 Deploy to production

## Support

For questions or issues with the NBA data pipeline:

1. Check the logs for error messages
2. Verify `nba_api` library is installed: `pip install nba-api`
3. Check NBA API status: https://stats.nba.com
4. Review cache statistics: `nba_data_adapter.get_cache_stats()`
5. Clear cache if needed: `nba_data_adapter.clear_cache()`

---

**Last Updated:** November 9, 2025  
**Status:** Phase 1 & 2 Complete, Phase 3 In Progress
