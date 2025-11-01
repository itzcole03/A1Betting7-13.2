# MLB Free Data Integration Plan

_Last updated: 2025-11-01_

## 1. Objectives

- Replace SportRadar MLB prop inputs with MLB Stats API and Baseball Savant data.
- Maintain (or improve) the quality of prop opportunities, projections, and historical stats supporting PropFinder and ML services.
- Ensure ingestion complies with provider rate limits and remains resilient to upstream hiccups.

## 2. Data Sources Overview

| Source                     | Usage                                                                            | Access Method                                                        | Rate Limits / Notes                                                                      |
| -------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| MLB Stats API              | Schedules, live game data, official odds (where available), player/team metadata | HTTPS JSON endpoints (unofficial but stable)                         | No published limit; community safe rate <= 60 req/min; use caching & politeness backoff. |
| Baseball Savant (Statcast) | Player level metrics, batted-ball data, rolling averages for projections         | CSV/JSON endpoints via `statcast_search` and `statcast_pitcher` etc. | Heavy queries limited; prefer batched overnight jobs, cache results.                     |
| TheOddsAPI (free tier)     | Supplemental lines/props when available, cross-check                             | REST with API key                                                    | 1,000/day (free). Use sparingly; primarily for validation.                               |

## 3. High-Level Architecture Changes

1. **Provider Clients**
   - `backend/services/data_sources/mlb_stats_client.py`
     - Methods: `get_schedule(date)`, `get_live_game(game_pk)`, `get_player_stats(player_id, season)`.
   - `backend/services/data_sources/baseball_savant_client.py`
     - Methods: `get_hitter_statcast(player_id, date_range)`, `get_pitcher_statcast(player_id, date_range)`, `get_statcast_summary(game_pk)`.
2. **Aggregation Layer**
   - New `MlbDataAggregator` to merge schedule, odds (if available), and statcast metrics into prop models consumed by PropFinder.
   - Align alias mapping using `data/aliases/mlb_players.json` and existing `mlb_team_alias_table.csv`.
3. **Caching & Persistence**
   - Use Redis hash cache for schedule & live data (TTL 5 minutes live, 12 hours schedule).
   - Persist statcast downloads into `data/mlb/statcast/<season>/` for offline re-use; integrate with existing ETL scripts.

## 4. Pipeline Flow

```
[Scheduler] -> [MLB Stats API fetch (schedule + game details)] -> [Normalize] -> [Prop model seeds]
                                            \
                                             -> [Baseball Savant fetch (player metrics)] -> [Feature engineering]
                                            \
                                             -> [Odds cross-check (TheOddsAPI free)] -> [Prop pricing validation]
```

## 5. Implementation Steps

1. **Client Stubs & Tests**
   - Scaffold clients with `httpx.AsyncClient`; include retry/backoff & optional API key headers (for TheOddsAPI only).
   - Unit tests using recorded fixtures stored under `tests/data/mlb_stats/` and `tests/data/baseball_savant/`.
2. **Aggregator Service**
   - Build `backend/services/mlb_free_data_service.py` exposing `async fetch_props(date_range)` returning normalized prop entries.
   - Include mapping from MLB Stats API game IDs to PropFinder internal IDs.
3. **Integration with PropFinder Service**
   - Update `backend/services/simple_propfinder_service.py` (or relevant aggregator) to consume new service; feature flag for rollout.
   - Ensure existing `unified_session_execute` usage remains intact.
4. **ETL Alignment**
   - Update nightly ETL scripts to fetch statcast data for active players and persist in analytics DB using existing feature engineering modules.
   - Document process in `docs/data/mlb_free_pipeline.md` (to be created).
5. **Monitoring**
   - Metrics: `mlb_stats_requests_total`, `mlb_stats_errors_total`, `baseball_savant_requests_total`, `data_lag_seconds`.
   - Alerts when lag exceeds 10 minutes or error rate > 5 % over 10-minute window.

## 6. Validation Checklist

- [ ] Run side-by-side ingestion for at least three game days; compare prop counts and edge calculations against historical baseline.
- [ ] Verify PropFinder UI shows expected props with accurate player/team metadata.
- [ ] Confirm ML pipelines produce consistent feature vectors (statcast features populated).
- [ ] Ensure caching layer reduces MLB Stats API requests to acceptable level (< 3 req/min per endpoint during peak).
- [ ] Update PropFinder parity spec with confirmed data lineage.

## 7. Risks & Mitigations

- **Unpublished Rate Limits**: Implement polite throttling (sleep 200 ms between requests) and caching to stay well below community thresholds.
- **Schema Drift**: Wrap JSON parsing with defensive defaults; log unexpected fields and surface in monitoring.
- **Seasonal Changes**: Some endpoints change across seasons; add integration tests at season rollover and maintain constants per year.
- **Data Gaps**: Baseball Savant may delay updates; fallback to latest cached metrics and flag in UI.

## 8. Next Actions

- Assign owners for MLB Stats and Baseball Savant client implementation.
- Collect representative fixtures from both APIs for tests.
- Draft migration PR that introduces clients behind feature flag and runs in shadow mode.
- Coordinate documentation update once shadow mode validated.
