# Data Source Transition Plan (SportRadar ➜ Free/Open APIs)

_Last updated: 2025-11-01_

## 1. Goal

Retire SportRadar integrations and migrate the prop ingestion pipeline to cost-free, quota-friendly data sources without degrading PropFinder parity.

## 2. Migration Principles

- **Zero subscription lock-in**: rely on public APIs, open data dumps, or community-maintained feeds.
- **Redundancy-first**: stack multiple free sources per sport to mitigate rate limits and downtime.
- **Compatibility**: maintain existing prop normalization interfaces so downstream services (PropFinder, ML pipelines) require minimal changes.
- **Traceability**: document lineage for each data point and expose to end users where relevant.

## 3. Candidate Data Sources

| Sport/Market      | Primary Free Source                                                                         | Backup Source                                                            | Notes                                                              |
| ----------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| NBA/NFL/MLB lines | TheOddsAPI free tier, OddsJam community feeds                                               | Pinnacle/Bookmaker scraping (where permitted), BettingPros API (limited) | Ensure TOS compliance for scraping; cache responses.               |
| Player props      | FantasyData trial, Underdog public endpoints, community GitHub repos (e.g., DFS-JSON feeds) | PrizePicks public JSON (already used), Sleeper APIs                      | Validate stability; integrate rate limiting.                       |
| Game schedules    | MLB Stats API, ESPN Scoreboard JSON                                                         | Official league schedule CSVs                                            | MLB Stats API already integrated for scheduling.                   |
| Stats/projections | MLB Stats API (statcast endpoints), Baseball Savant                                         | Fangraphs CSV dumps, Kaggle datasets                                     | Existing MLB pipeline leverages these; maintain cadence alignment. |

## 4. Architecture Adjustments

1. **Ingestion Abstraction**

   - Introduce `backend/services/data_sources/<provider>_client.py` modules following unified interface.
   - Implement provider registry to select feed based on sport + availability.

2. **Normalization Layer**

   - Consolidate mapping (team/player aliases, market categories) into `data/aliases/*.json` to align free feeds with existing schema.
   - Add validation step comparing new feed output to historical SportRadar baseline for calibration.

3. **Caching & Rate Limiting**

   - Centralized limiter per provider to respect published caps.
   - Use Redis TTL caches to avoid repeated calls when data unchanged.
   - Add exponential backoff with jitter on 429/5xx responses.

4. **Fallback Hierarchy**
   - Primary provider -> secondary provider -> cached snapshot -> synthetic safe fallback (clearly labeled in UI).
   - Update PropFinder UI to surface fallback status (badge indicating data freshness).

## 5. Decommission Steps

1. Inventory all modules hitting SportRadar (grep for `sportradar`, review `backend/routes`, `unified` services).
2. Flag associated env vars/config entries for removal after migration.
3. Replace call sites with new provider clients; ensure tests updated.
4. Remove SportRadar-specific docs and adjust onboarding instructions.

## 6. Validation & Monitoring

- Extend performance validation plan to include provider health metrics (success rate, latency, throttling incidents).
- Create synthetic test harness to replay sample responses from new providers and compare derived props/edges.
- Update automated alerts to watch for provider outages and switch to backups automatically.

## 7. Timeline (Proposed)

1. **Week 1**: Provider evaluation, proof-of-concept ingestion for NBA/NFL/MLB lines.
2. **Week 2**: Implement registry + normalization; wire into PropFinder backend; run parallel testing with existing data.
3. **Week 3**: Extend to props and projections; update ML pipelines and caching.
4. **Week 4**: Remove SportRadar dependencies, clean configuration, update documentation and parity spec.

## 8. Risks & Mitigations

- **Data Quality Variance**: Some free feeds inconsistent; mitigate by cross-validating with multiple providers.
- **Legal/TOS Constraints**: Confirm usage complies with provider terms; avoid scraping when prohibited.
- **Rate Limits**: Free tiers often tight; rely on caching and multiple feeds.
- **Community Feed Reliability**: Implement monitoring and ability to disable misbehaving sources quickly.

## 9. Next Steps

- Finalize provider shortlist with engineering/product buy-in (MLB already anchored by MLB Stats API + Baseball Savant).
- Draft interface for provider clients and stub test data.
- Run dual-feed trial (SportRadar vs free source) to quantify differences before cutting over.
- Communicate migration plan in README and internal change log once timeline approved.
