# Line Movement & Alert Pipeline Design

_Last updated: 2025-11-01_

## 1. Objective

Deliver full PropFinder parity for line movement analytics and user alerts by implementing a resilient historical odds capture pipeline, analytical diff services, and multi-channel notification delivery.

## 2. Requirements Summary

- **Historical Odds Storage**: Persist odds snapshots every 30 seconds for each book/prop (configurable cadence), retaining at least 30 days.
- **Movement Analytics**: Detect significant movements (steam, multi-book shifts, consensus drift) and compute CLV per settled prop.
- **Alerting**: Allow user-defined thresholds (edge delta, odds change, steam signals) with latency < 90 seconds, deduplication, and delivery (web, email, webhook).
- **Observability**: Metrics on capture success, per-book lag, alert delivery status, and failure workflows.

## 3. Architecture Overview

```
[Odds Ingestion Service] --> [Redis Stream Buffer] --> [Historical Storage Worker]
                                                \-> [Movement Analyzer]
                                                        \-> [Alert Dispatcher] --> [WebSocket]
                                                                                 --> [Email]
                                                                                 --> [Webhook]
```

1. **Ingestion**

   - Extend existing odds pollers (SportRadar, TheOddsAPI) to push normalized snapshots into a Redis Stream (`odds_snapshots`).
   - Each message contains prop ID, book, price, timestamp, metadata (game, market type).

2. **Historical Storage Worker**

   - Async worker consuming Redis stream, deduping identical consecutive values, writing to PostgreSQL `prop_line_history` table.
   - Schema:
     ```sql
     CREATE TABLE prop_line_history (
       id BIGSERIAL PRIMARY KEY,
       prop_id TEXT NOT NULL,
       book TEXT NOT NULL,
       price NUMERIC NOT NULL,
       implied_prob NUMERIC NOT NULL,
       edge NUMERIC,
       fetched_at TIMESTAMPTZ NOT NULL,
       source VARCHAR(50) NOT NULL,
       UNIQUE(prop_id, book, fetched_at)
     );
     CREATE INDEX idx_prop_line_history_prop_time ON prop_line_history(prop_id, fetched_at DESC);
     ```

3. **Movement Analyzer**

   - Periodic job (every 30 seconds) pulling latest snapshots + windowed history to compute:
     - **CLV**: opening vs latest price at settlement trigger.
     - **Steam events**: multi-book movement within 2-minute window above threshold.
     - **Consensus shifts**: median line delta vs previous hour.
   - Output stored in `prop_movement_events` table for downstream use.

4. **Alert Dispatcher**
   - Compare movement events against user-configured rules (stored in `user_alert_rules`).
   - Deduplicate via Redis key (prop_id + rule_id + event_signature) with TTL 5 minutes.
   - Enqueue notifications to delivery workers (websocket push via existing channels, email using existing template system, webhook via signed POST).

## 4. API Additions

- `GET /api/propfinder/line-history/{prop_id}` — paginated historical odds for charts.
- `GET /api/propfinder/movements` — recent movement events with filters.
- `POST /api/propfinder/alerts` — create/update user alert rules.
- `GET /api/propfinder/alerts` — list configured alerts & status.
- WebSocket event `propfinder.alert` with payload `{prop_id, event_type, delta, triggered_at}`.

## 5. Frontend Requirements

- **Line History Chart**: integrate with existing prop detail drawer; uses new API to render price over time (Sparkline + detailed view).
- **Movement Indicators**: badges in prop table showing recent movement (up/down, steam icon).
- **Alert UI**: modal or side panel to configure rules (thresholds, channels, quiet hours); display delivery history with status.
- **CLV Display**: once prop settles, show CLV delta and classification (beat/lose).

## 6. Alert Rule Model

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "prop_id": "optional",
  "sport": "optional",
  "conditions": {
    "edge_delta": 0.05,
    "odds_change": 0.15,
    "steam_books": 3,
    "clv_trend": "positive"
  },
  "channels": ["web", "email"],
  "active": true,
  "quiet_hours": "02:00-06:00",
  "created_at": "2025-11-01T13:00:00Z"
}
```

## 7. Observability & Validation

- Metrics via Prometheus:
  - `line_capture_success_total`, `line_capture_lag_seconds`, `line_history_rows_per_minute`.
  - `alert_trigger_total{event_type}`, `alert_delivery_success_total{channel}`.
- Logging: structured events on capture failures, delayed alerts, webhook retries.
- Synthetic tests: scheduled job simulating known movement to validate pipeline end-to-end weekly.
- Load target: 10k props × 8 books × 30-second cadence (~2.7M records/day) — requires retention pruning (rolling 30-day window) and table partitioning by day.

## 8. Security & Privacy

- Alert webhooks signed with HMAC; store webhook URL per user encrypted at rest.
- Rate limit user rule creation to prevent abuse.
- Ensure CLV calculations do not expose user-specific positions (currently not tracked).

## 9. Implementation Phases

1. **Infrastructure**: Redis stream + Postgres table + worker scaffolding.
2. **Analytics Engine**: Movement computations, CLV pipeline, event table.
3. **Alert System**: Rule models, dispatcher, notification channels.
4. **Frontend Enhancements**: Charts, indicators, alert UI.
5. **Testing & Observability**: Integration tests, synthetic movements, dashboards.

## 10. Risks & Mitigations

- **Data Volume Growth**: Mitigate with partitioned tables + retention policy.
- **Third-Party Throttling**: Respect SportRadar limiter; reuse captured snapshot if fetch fails.
- **Alert Noise**: Provide user-level throttling and quiet hours; default thresholds sensible.
- **Delivery Failures**: Implement retries with exponential backoff; expose status in UI.

## 11. Next Actions

- Review schema with data team; confirm compatibility with existing analytics DB.
- Prototype Redis stream consumer using sample odds payloads (`backend_propfinder_opps_*`).
- Draft API contracts as Pydantic models and integrate into FastAPI routes (using factory registration pattern).
- Engage frontend team for chart library selection (existing D3/Recharts components vs new lib).
