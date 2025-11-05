Provider Audit: theOddsAPI & Sportradar
=====================================

Summary
-------
- Purpose: locate all code, config, and docs that reference `theOdds`/`theodds`/`theOddsAPI` and `Sportradar`/`sportradar`, and provide a plan to replace their usage with `mlb_stats_api` and `baseball_savant` where appropriate.
- Outcome: mapped call sites, config keys, adapters, and docs. Suggested priority and safety steps for migration.

Findings (key locations)
------------------------
- Backend connectors & pipeline
  - `backend/data_pipeline.py` — defines `SportradarConnector`, registers connector, uses endpoints for live games and mapping.
  - `backend/mlb_provider_client.py` — functions: `fetch_player_props_theodds`, `fetch_event_mappings_sportradar`, `fetch_teams_sportradar`, `fetch_events_sportradar`, `fetch_odds_theodds`.
  - `backend/api_integration.py` — raises HTTPException if `sportradar_api_key` missing; direct Sportradar call paths.
  - `backend/data_sources.py` — enumerates data source tiers and includes `sportradar` entries.
  - `backend/data_pipeline.*` (mypy cache and htmlcov reference) — SportradarConnector exists and is used in orchestration.

- SDKs / Provider classes / Adapters
  - `specialist_apis.py` / `comprehensive_sportsbook_integration.py` (documented in `API_REFERENCE.md`) — `SportradarAPI`, `TheOddsAPI`, `TheOddsAPIProvider`, `TheOddsAdapter` exist.
  - `frontend/src/adapters/TheOddsAdapter.ts` — frontend adapter for TheOdds API.

- Configuration & Deployment
  - `.env.example` & `frontend/.env.example` — contain `SPORTRADAR_API_KEY`, `VITE_SPORTRADAR_API_ENDPOINT`, `VITE_THEODDS_API_ENDPOINT`, `VITE_THEODDS_API_KEY`.
  - `infrastructure/production/app-deployment.yaml` & `helm/.../values.yaml` — reference `SPORTRADAR_API_KEY` and `theodds` secrets.
  - `infrastructure/secrets/secrets-template.yaml` — lists `sportradar` and `theodds` keys.

- Docs, prompts, tests & coverage
  - `API_DOCUMENTATION.md` and `API_REFERENCE.md` — describe fallback logic (Sportradar primary, TheOdds fallback). Update needed.
  - `tests/` & `tests/integration/` — some tests assume `baseball_savant` + `mlb_stats_api` are present; test coverage includes references to TheOdds and Sportradar.
  - `reports/pytest_full_output.txt` and `htmlcov/` contain many references to `theodds` and `sportradar` classes/functions.

Risks & notes
-------------
- Removing or making providers optional could break endpoints that currently raise when keys are absent (see `backend/api_integration.py`).
- TheOdds and Sportradar provide coverage for many sports; replacing them requires validating parity for markets (e.g., player props availability and naming conventions).
- Team / event canonicalization logic may rely on TheOdds/Sportradar endpoints (participants, mapping). Need robust mapping with fuzzy matching (name + start-time ±5min) when switching.

Compatibility checklist (TheOdds/Sportradar -> MLB Stats API / Baseball Savant)
-----------------------------------------------------------------------------
- Event mapping: ensure MLb Stats API + other free sources provide event datetime, teams, and player lists. If not, maintain a light-weight mapping cache keyed by normalized team names and timestamps.
- Markets & odds: TheOdds provides odds/markets; MLB Stats API doesn't provide odds. For odds, consider free alternates (some public odds endpoints exist) or keep TheOdds only for odds while moving stat data to MLB sources. If goal is 100% free, identify free odds sources or scrape consensus lines (more complex/legal considerations).
- Player props: Map player identifiers (mlb_stats player id vs theodds participant id) and add name normalization.
- Rate limits: MLB Stats API & Baseball Savant have rate limits — add rate limiter and cache layers mirroring existing Sportradar limits.

Recommended immediate changes (safe, minimal)
-------------------------------------------
1. Add a `reports/provider_audit.md` (this file) and commit.
2. Make backend tolerant of missing `SPORTRADAR_API_KEY` and `ODDS_API_KEY` — prefer free clients when available, but keep paid connectors present as optional fallbacks.
3. Implement a `backend/services/unified_data_fetcher.py` normalization adapter (scaffold) to centralize provider mapping logic.
4. Write integration tests that run without `SPORTRADAR_API_KEY` / `ODDS_API_KEY` to ensure endpoints degrade gracefully.

Next steps (in order)
---------------------
1. Complete audit (this report) and mark todo done.
2. Scaffold `backend/services/unified_data_fetcher.py` and add canonical models (`Event`, `Game`, `Player`, `OddsSnapshot`).
3. Implement `backend/ingestion/mlb_stats_connector.py` and `backend/ingestion/baseball_savant_connector.py` using existing clients (`mlb_stats_api_client.py`, `baseball_savant_client.py`).
4. Add mapping tests and run `pytest` focusing on `tests/backend/routes/test_mlb_extras.py` and `tests/` that reference data sources.
5. Update `.env.example`, helm manifests, and infra secrets to make paid keys optional.

If you want, I can now:
- A) Mark the audit todo completed and scaffold `unified_data_fetcher` (code). OR
- B) Make the small safe backend change to stop raising when `SPORTRADAR_API_KEY` is missing (preferred minimal runtime change).
