# EV Feed Persistence & WebSocket Architecture Specification

## 1. Summary

Introduce durable persistence and real-time WebSocket dissemination for the existing in-memory +EV (positive expected value) opportunity feed. Provide a minimal, append/update (upsert) relational store keyed by a stable hash plus a lightweight event model that allows clients to stay synchronized without polling. Design must be additive and fully feature-flagged (no behavior change unless explicitly enabled) and tuned for low write contention, efficient pruning, and stateless horizontal scaling.

## 2. Goals and Non-Goals

Goals:

- Persist +EV opportunities for short analytical horizon (≈48–72h) with controlled retention.
- Provide deterministic dedupe + update semantics (single authoritative row per hash_key).
- Enable WebSocket push for near-real-time UI updates (new, replace, flush, metrics).
- Track peak edge (max_edge_pct) for each unique opportunity over its lifetime window.
- Support efficient queries: recent list, top edges, deltas since timestamp, stats.
- Keep implementation small, auditable, and guarded by feature flags.

Non-Goals:

- Historical warehousing beyond retention window.
- Complex analytical rollups (use future warehouse/OLAP path).
- User-specific personalization (future enhancement).
- Multi-tenant access segregation (single logical tenant now).

## 3. Current In-Memory Behavior (Baseline)

- Ring buffer (size ~500–1000) holds most recent deduped opportunities.
- Dedup key composed from (player|market|bookmaker|market_odds|fair_odds).
- Edge tiers computed on the fly; counters and slope metrics kept transiently.
- No persistence: restart = cold cache, no backfill; clients poll REST.
- No guaranteed ordering once buffer prunes; ephemeral only.

## 4. Proposed Persistence Architecture

A single table `ev_feed_entries` storing the latest state of each deduped opportunity. Writers compute a stable `hash_key`; if present, update fields & timestamps; otherwise insert. Peak edge tracked via `max_edge_pct`. A lightweight pruning job removes stale rows beyond retention windows, with optional extended retention for high-signal rows.

WebSocket layer (feature-flagged) broadcasts normalized delta events to subscribed clients. On subscriber connect: REST (or initial WS request) supplies snapshot page; subsequent changes arrive via events.

Components:

1. **Ingestion / Generator**: Existing feed generation adds persistence write (if EV_FEED_PERSIST=1).
2. **Persistence Adapter**: Minimal async DAO handling upsert & prune with single transaction per write.
3. **Pruner Task**: Runs every 30 minutes (async background) applying retention logic.
4. **WebSocket Broadcaster**: Publishes events (ev.feed.new / ev.feed.replace / ev.feed.flush / ev.feed.metrics) when EV_FEED_WS=1.
5. **Backfill Loader**: On startup, optionally hydrate in-memory ring from last N hours for warm start.

## 5. Table Schema (DDL + rationale)

```sql
-- ev_feed_entries: latest state for each deduped +EV opportunity
CREATE TABLE ev_feed_entries (
  id UUID PRIMARY KEY,
  hash_key TEXT NOT NULL UNIQUE,
  player TEXT NULL,
  team TEXT NULL,
  market TEXT NOT NULL,
  bookmaker TEXT NOT NULL,
  market_odds INTEGER NOT NULL,
  fair_american_odds INTEGER NULL,
  edge_pct REAL NOT NULL,
  edge_tier TEXT NOT NULL,
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL,
  last_seen_at TIMESTAMP NOT NULL,
  max_edge_pct REAL NOT NULL
);
```

Rationale:

- `hash_key` ensures idempotent upserts without re-computing or scanning full row set.
- `occurrence_count` aggregates how many times the dedup key re-surfaced within retention window (signal strength proxy).
- `max_edge_pct` supports peak tracking & extended retention heuristics.
- Separate `created_at` vs `last_seen_at` enables ordering by discovery vs freshness.

## 6. Indices & Query Patterns

Additional indices:

- `UNIQUE(hash_key)` (already in DDL) – upsert target.
- `CREATE INDEX IF NOT EXISTS idx_ev_edge_pct_active ON ev_feed_entries(edge_pct DESC);` (optionally partial: edge_pct > 0) – top edges query.
- `CREATE INDEX IF NOT EXISTS idx_ev_created_at ON ev_feed_entries(created_at);` – recent discovery paging.
- `CREATE INDEX IF NOT EXISTS idx_ev_last_seen_at ON ev_feed_entries(last_seen_at);` – freshness / activity sorting.

Query patterns:

- Top edges: ORDER BY edge_pct DESC LIMIT k.
- Recently updated since cursor: WHERE last_seen_at > :t ORDER BY last_seen_at ASC.
- Backfill warm: WHERE last_seen_at >= now() - INTERVAL 'X hours'.
- Stale prune candidate scan: WHERE last_seen_at < cutoff.

## 7. Dedup & Update Semantics

- Application constructs `hash_key` consistently (delimiter stable; include normalized player/team names if present, else placeholder).
- Insert path: new row with `created_at = last_seen_at = now()`, `max_edge_pct = edge_pct`, `occurrence_count = 1`.
- Update path: set `last_seen_at = now()`, increment `occurrence_count`, update `edge_pct`, `edge_tier`, `market_odds`, `fair_american_odds`; `max_edge_pct = GREATEST(max_edge_pct, edge_pct)`.
- Edge tier recalculated each update (ensures classification tracks current edge).
- If derived edge falls <=0, policy: retain row until pruning; do not delete immediately (prevents churn).

## 8. Retention & Pruning Strategy

- Base retention: 48h rolling window (rows with `last_seen_at < now()-48h` are pruned).
- Extended retention: keep rows an extra 24h (total 72h) if `edge_pct >= threshold` OR `max_edge_pct >= threshold` (threshold configurable; default maybe 8%).
- Occurrence weighting: no direct impact on retention now (future adaptive decay).
- Pruner schedule: every 30m (configurable) scanning batched deletions (LIMIT chunk size) to avoid lock spikes.

## 9. Backfill on Startup

If EV_FEED_PERSIST=1 at startup:
1. Fetch rows WHERE `last_seen_at >= now()-N_hours` (N configurable; default 3h) ORDER BY last_seen_at ASC LIMIT ring capacity.
2. Hydrate in-memory ring buffer (preserving order and counts) before first generation cycle.
3. If no rows: proceed cold start.


## 10. WebSocket Event Model

Event channel (single namespace, e.g., `/ws/ev-feed`). Message envelope:
 
```json
{
  "type": "ev.feed.new|ev.feed.replace|ev.feed.flush|ev.feed.metrics",
  "ts": "2025-09-08T12:34:56Z",
  "data": { ... payload ... }
}
```

Events:
 
- `ev.feed.new`: First persistence of a hash_key.
- `ev.feed.replace`: Update of existing hash_key (edge, odds, tier, counts).
- `ev.feed.flush`: Instruct clients to drop all local rows and re-fetch first page (rare; e.g., after maintenance or schema migration).
- `ev.feed.metrics` (optional): Periodic aggregate stats (count_active, top_edge, average_edge, generation_interval, prune_counts).

Backpressure handling:
 
- Maintain bounded asyncio.Queue; if full, drop oldest pending non-metrics event (metrics may be deprioritized or coalesced) and log once per interval.


## 11. Migration Plan (Alembic Outline)

1. `alembic revision --autogenerate -m "ev feed persistence"` (add table).
2. Manually add indices (edge_pct DESC index; created_at; last_seen_at). Partial index expressed in dialect if supported; else full index with WHERE filter applied at query time.
3. Deploy migration to staging → production.
4. Enable EV_FEED_PERSIST=1 in staging; monitor write volume + lock time.
5. Optional warm backfill: generate initial memory hydration (no historical import beyond retention window).
6. Incrementally enable EV_FEED_WS=1 after validating persistence stability.

## 12. Failure & Fallback Modes

- DB unavailable on write: log error, increment metric, continue in-memory only (no crash). Future successful write updates last_seen_at; missed occurrences not retroactively counted.
- Pruner failure: next cycle retries; if repeatedly failing, emit warning every N attempts.
- WebSocket broadcast exception: swallow & log; clients rely on next replace or manual refresh.
- Queue saturation: drop oldest non-critical event (old new/replace) to prefer freshness; emit rate-limited warning.
- Schema drift (unexpected column missing): short-circuit persistence (flag auto-disables?), raise diagnostic alert.

## 13. Feature Flags & Env Vars

- `EV_FEED_PERSIST=1` → enable persistence adapter + backfill + pruner.
- `EV_FEED_WS=1` → enable WebSocket broadcaster for events.
- `EV_FEED_DEBUG=1` → verbose logging & metrics sampling already present (reused).
- (Config) `EV_FEED_RETENTION_HOURS=48`, `EV_FEED_EXTENDED_HOURS=24`, `EV_FEED_EXTENDED_THRESHOLD=8`.
- (Config) `EV_FEED_BACKFILL_HOURS=3`, `EV_FEED_PRUNE_INTERVAL_SECONDS=1800`.

## 14. Security & Access Control

- Read access: same auth layer as existing feed REST (JWT / admin gating if applied).
- WebSocket: must validate token at connect + periodic revalidation (future) to mitigate long-lived stale sessions.
- Avoid leaking internal metrics unless authorized (metrics event gated by role or debug flag).
- Prevent injection: parameterized queries only; server constructs DDL once (migration path not runtime executed).


## 15. Performance Considerations

- Single-table upserts; expected write QPS low (generator interval ~60s, O(100) rows). Batch writes optional but not required.
- Indices kept minimal (3 non-unique + unique hash_key) to reduce write amplification.
- Pruning uses range delete on indexed timestamp, chunked to mitigate VACUUM pressure in SQLite/Postgres.
- WebSocket events avoid full payload broadcast on flush (clients refetch page via REST).
- Use server-side monotonic clock (`now()`) for consistency; avoid client-provided timestamps.


## 16. Future Enhancements

- Persistent ring hydration (store small ordered log for gapless real-time replay).
- Adaptive edge decay (exponentially reduce stale edge_pct to surface fresher signals).
- User personalization filtering (per-user threshold, favorite players, bookmakers whitelist/blacklist).
- Historical edge volatility metrics (stddev, slope persistence for modeling).
- Paginated feed API (offset + cursor hybrid to support both jumping and streaming progression).
