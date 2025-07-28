# A1Betting Real-Time Analysis API Documentation

## API Versioning Policy (2025-07-27)

### Versioned API Paths

- All public and stable endpoints MUST use a versioned path prefix: `/api/v1/` (e.g., `/api/v1/analysis/start`).
- Legacy endpoints using `/api/` without a version are considered deprecated and will be migrated or removed in future releases.

### Version Field in Responses

- All JSON responses from public endpoints MUST include a `"version"` field (e.g., `"version": "v1"`).
- All analysis and admin responses also include `ruleset_version` and `rules_last_updated` for auditability.
- This enables clients to detect API changes and supports robust audit/version tracking.

### Rationale

- Versioning ensures backward compatibility for third-party and frontend consumers.
- It enables safe, non-breaking upgrades and clear deprecation/migration paths.
- Including a `version` field in responses supports traceability and debugging.

### Migration Plan

- All new endpoints will use `/api/v1/` and include a `version` field in responses.
- Existing endpoints will be migrated to `/api/v1/` as part of the next major release cycle.
- Deprecated endpoints will be removed after a 90-day deprecation window.

### Audit Note

- This policy is documented for future audits and to ensure clarity for all developers and integrators.

---

## Overview

The A1Betting platform provides a comprehensive real-time analysis API that processes thousands of bets across all major sports and sportsbooks using a 47+ ML model ensemble to deliver the highest-probability winning opportunities.

## Base URL

- **Development**: `http://localhost:8000`
- **Production**: `https://your-domain.com`

## Authentication

**All new endpoints use JWT authentication.**
Legacy endpoints may use basic auth; these are deprecated and will be removed. See backend/README.md for details.

## Real-Time Analysis Endpoints

### Start Comprehensive Analysis

Trigger a comprehensive analysis across all sports and sportsbooks.

**Endpoint:** `POST /api/analysis/start`

**Request Body:**

```json
{
  "sports": ["nba", "nfl", "mlb"], // Optional: specific sports, default: all
  "min_confidence": 75.0, // Minimum confidence threshold (50-99)
  "max_results": 50, // Maximum results to return (1-500)
  "lineup_sizes": [6, 10] // Lineup sizes to optimize for
}
```

**Response:**

```json
{
  "analysis_id": "analysis_1734654123",
  "status": "started",
  "message": "Comprehensive analysis started. Analyzing thousands of bets across all sports.",
  "estimated_duration_seconds": 180
}
```

### Monitor Analysis Progress

Get real-time progress updates for an ongoing analysis.

**Endpoint:** `GET /api/analysis/progress/{analysis_id}`

**Response:**

```json
{
  "analysis_id": "analysis_1734654123",
  "progress_percentage": 67.3,
  "total_bets": 2847,
  "analyzed_bets": 1917,
  "current_sport": "nba",
  "current_sportsbook": "draftkings",
  "estimated_completion": "2024-12-19T23:48:30Z",
  "status": "analyzing"
}
```

**Status Values:**

- `collecting_data` - Fetching data from sportsbooks
- `analyzing` - Processing bets with ML models
- `completed` - Analysis finished successfully

### Get Betting Opportunities

Retrieve the highest-confidence betting opportunities from completed analysis.

**Endpoint:** `GET /api/analysis/results/{analysis_id}/opportunities`

**Query Parameters:**

- `limit` (int): Maximum results to return (default: 50)
- `min_confidence` (float): Minimum confidence threshold (default: 80.0)

**Response:**

```json
[
  {
    "id": "nba_luka_points_over",
    "sportsbook": "DraftKings",
    "sport": "NBA",
    "bet_type": "Player Props",
    "player_name": "Luka Dončić",
    "team": "DAL",
    "opponent": "LAL",
    "stat_type": "Points",
    "line": 28.5,
    "over_odds": -110,
    "under_odds": -110,
    "recommendation": "OVER",
    "ml_confidence": 89.3,
    "expected_value": 0.234,
    "kelly_fraction": 0.087,
    "risk_score": 0.156,
    "risk_level": "LOW",
    "confidence_color": "text-emerald-400",
    "ev_color": "text-green-400",
    "risk_color": "text-green-400"
  }
]
```

### Get Optimal Lineups

Retrieve optimized cross-sport lineups from completed analysis.

**Endpoint:** `GET /api/analysis/results/{analysis_id}/lineups`

**Query Parameters:**

- `lineup_sizes` (array): Sizes of lineups to return (e.g., `lineup_sizes=6&lineup_sizes=10`)

**Response:**

```json
[
  {
    "lineup_size": 6,
    "total_confidence": 87.8,
    "expected_roi": 1.234,
    "total_risk_score": 0.167,
    "diversification_score": 0.83,
    "bets": [
      {
        "id": "nba_luka_points",
        "sportsbook": "DraftKings",
        "sport": "NBA",
        "player_name": "Luka Dončić",
        "recommendation": "OVER",
        "ml_confidence": 89.3,
        "expected_value": 0.234,
        "kelly_fraction": 0.087,
        "risk_score": 0.156
      }
      // ... 5 more bets
    ]
  }
]
```

### Get Supported Sports

List all sports supported by the analysis engine.

**Endpoint:** `GET /api/analysis/sports`

**Response:**

```json
[
  "nba",
  "nfl",
  "mlb",
  "nhl",
  "soccer",
  "tennis",
  "golf",
  "ufc",
  "boxing",
  "esports",
  "cricket",
  "rugby"
]
```

### Get System Status

Check the real-time analysis system status.

**Endpoint:** `GET /api/analysis/status`

**Response:**

```json
{
  "status": "operational",
  "supported_sports": 12,
  "supported_sportsbooks": 10,
  "ml_models_active": 47,
  "last_health_check": "2024-12-19T23:45:00Z"
}
```

## ⚠️ Deprecated Endpoints (Legacy)

> The following endpoints are deprecated and will be removed in a future release. Migrate to the new real-time analysis endpoints.

### Get Enhanced Bets (Deprecated)

**Endpoint:** `GET /api/unified/enhanced-bets`

**Query Parameters:**

- `sport` (string): Filter by sport
- `min_confidence` (int): Minimum confidence threshold (50-99)
- `include_ai_insights` (bool): Include AI insights
- `include_portfolio_optimization` (bool): Include portfolio optimization
- `max_results` (int): Maximum results (1-100)

## Error Handling

All endpoints return standard HTTP status codes:

- **200 OK**: Request successful
- **400 Bad Request**: Invalid request parameters
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Validation error
- **500 Internal Server Error**: Server error

**Error Response Format:**

```json
{
  "detail": "Error description",
  "error_type": "validation_error",
  "timestamp": "2024-12-19T23:45:00Z"
}
```

## Rate Limiting

The API implements smart rate limiting to respect sportsbook provider limits:

- **Analysis requests**: 1 per 30 seconds per user
- **Progress requests**: 10 per minute
- **Results requests**: 30 per minute

## Data Models

### BetOpportunity

- **id**: Unique identifier
- **sportsbook**: Source sportsbook name
- **sport**: Sport category
- **bet_type**: Type of bet (Player Props, Game Lines, etc.)
- **player_name**: Player name (for prop bets)
- **team**: Team abbreviation
- **opponent**: Opponent team
- **stat_type**: Statistic type (Points, Rebounds, etc.)
- **line**: Betting line value
- **over_odds**: Over odds
- **under_odds**: Under odds
- **recommendation**: "OVER" or "UNDER"
- **ml_confidence**: ML model confidence (0-100)
- **expected_value**: Expected value calculation
- **kelly_fraction**: Kelly Criterion optimal fraction
- **risk_score**: Risk assessment (0-1)
- **risk_level**: "LOW", "MEDIUM", or "HIGH"

### OptimalLineup

- **lineup_size**: Number of bets in lineup
- **total_confidence**: Average confidence across all bets
- **expected_roi**: Expected return on investment
- **total_risk_score**: Portfolio risk score
- **diversification_score**: Cross-sport diversification score
- **bets**: Array of BetOpportunity objects

## Integration Examples

### JavaScript/TypeScript

```typescript
import { realTimeAnalysisService } from "./services/realTimeAnalysisService";

// Start analysis
const response = await realTimeAnalysisService.startComprehensiveAnalysis({
  min_confidence: 80,
  max_results: 100,
});

// Monitor progress
for await (const progress of realTimeAnalysisService.monitorAnalysisProgress(
  response.analysis_id
)) {
  console.log(`Progress: ${progress.progress_percentage}%`);
  if (progress.status === "completed") break;
}

// Get results
const opportunities = await realTimeAnalysisService.getBettingOpportunities(
  response.analysis_id
);
const lineups = await realTimeAnalysisService.getOptimalLineups(
  response.analysis_id
);
```

### Python

```python
import requests
import time

# Start analysis
response = requests.post('http://localhost:8000/api/analysis/start', json={
    'min_confidence': 80,
    'max_results': 100
})
analysis_id = response.json()['analysis_id']

# Monitor progress
while True:
    progress = requests.get(f'http://localhost:8000/api/analysis/progress/{analysis_id}').json()
    print(f"Progress: {progress['progress_percentage']}%")
    if progress['status'] == 'completed':
        break
    time.sleep(5)

# Get results
opportunities = requests.get(f'http://localhost:8000/api/analysis/results/{analysis_id}/opportunities').json()
lineups = requests.get(f'http://localhost:8000/api/analysis/results/{analysis_id}/lineups').json()
```

## Support

For API support and questions:

- **Documentation**: This file
- **Health Check**: `GET /api/analysis/status`
- **Error Logs**: Check backend logs for detailed error information

---

**A1Betting Real-Time Analysis API**: Comprehensive multi-sport betting analysis for maximum profitability.

## Health & Diagnostics Endpoints

### Get System Health

Check the backend service health, uptime, and diagnostic status. Useful for admins, support, and troubleshooting.

**Endpoint:** `GET /api/health`

**Response:**

```json
{
  "status": "healthy",
  "uptime_seconds": 123456,
  "error_streak": 0,
  "last_error": null,
  "last_success": "2024-12-19T23:45:00Z",
  "healing_attempts": 0
}
```

- `status`: `healthy`, `degraded`, or `unhealthy`
- `uptime_seconds`: Seconds since backend start
- `error_streak`: Consecutive failed health checks
- `last_error`: Last error message (if any)
- `last_success`: Timestamp of last successful health check
- `healing_attempts`: Number of automated recovery attempts

### Get Data Source Health

Check the health and freshness of all major data sources (e.g., scrapers, external APIs).

**Endpoint:** `GET /api/health/data-sources`

**Response:**

```json
{
  "prizepicks": {
    "status": "healthy",
    "last_updated": "2024-12-19T23:44:00Z",
    "error_streak": 0,
    "stale": false
  },
  "underdog": {
    "status": "degraded",
    "last_updated": "2024-12-19T23:40:00Z",
    "error_streak": 2,
    "stale": true
  }
}
```

- Each key is a data source (e.g., `prizepicks`, `underdog`)
- `status`: `healthy`, `degraded`, or `unhealthy`
- `last_updated`: Last successful data fetch
- `error_streak`: Consecutive failures
- `stale`: Whether data is considered stale

**Troubleshooting:**

- If either endpoint is unavailable, ensure the backend is running and accessible on the correct port.
- See the main README for more details on running and interpreting the Health API.

## Business Rules and Violations

### Admin Rule Reload Endpoint

Admins can reload business rules at runtime via a secure endpoint:

**Endpoint:** `POST /api/v1/admin/reload-business-rules`

**Auth:** Bearer token (replace `admin-token` with real admin token in production)

**Request:**

```
Authorization: Bearer admin-token
```

**Response:**

```json
{
  "status": "ok",
  "message": "Business rules reloaded",
  "ruleset_version": "2025.07.01",
  "rules_last_updated": "2025-07-01T12:00:00Z",
  "timestamp": "2025-07-27T15:00:00Z"
}
```

**Note:** This endpoint is protected and should only be accessible to authorized admins. Replace the dummy check with real authentication in production. All reload attempts are logged with timestamp, version, and outcome for auditability.

### Business Rules Enforcement

All bets and lineups are filtered according to business rules defined in `backend/config/business_rules.yaml`. These rules include forbidden feature combinations and allowed stat types. The rules can be reloaded at runtime (admin only).

### Violation Reporting

If a bet is filtered out due to business rules, the response will include a `violations` array with detailed reasons for each violation. Each bet object may have a `violations` field if it was filtered, and the response metadata will include a top-level `violations` list.

**Example Response with Violations:**

```json
{
  "opportunities": [
    {
      "id": "nba_luka_points_over",
      "player_name": "Luka Dončić",
      ...,
      "violations": [
        "Forbidden combo: ['foo', 'bar']",
        "Stat type 'Blocks' not allowed"
      ]
    }
  ],
  "violations": [
    {"bet_id": "nba_luka_points_over", "reason": "Forbidden combo: ['foo', 'bar']"},
    {"bet_id": "nba_luka_points_over", "reason": "Stat type 'Blocks' not allowed"}
  ]
}
```

### Reloading Business Rules

Business rules can be reloaded at runtime via the `/api/v1/admin/reload-business-rules` endpoint (admin only). This is thread-safe, observable, and does not require a server restart. All reloads are logged for audit.

### API Changes

- All endpoints are now versioned under `/api/v1/`.
- All responses include a top-level `version` field (e.g., `"version": "v1"`).
- Analysis and admin responses include `ruleset_version` and `rules_last_updated`.
- `_is_bet_allowed(bet)` now returns `(bool, list_of_reasons)` for granular violation reporting.
- All logs and response metadata include the specific reason(s) for each violation.

## Per-User (user_id-specific) Business Rules

The backend supports per-user business rules via the `user_overrides` section in `backend/config/business_rules.yaml`. This allows for user-specific restrictions, thresholds, and time-windowed rules that override global rules for a given `user_id`.

### YAML Schema

```yaml
user_overrides:
  <user_id>:
    forbidden_combos: # Optional: user-specific forbidden combos
      - [...]
    allowed_stat_types: # Optional: user-specific allowed stat types
      - ...
    rules: # Optional: user-specific rules (static or time-windowed)
      - id: "<unique_rule_id>"
        description: "<description>"
        applies_to:
          sport: "<sport>"
        type: "<rule_type>"
        value: <value>
        combo: [...] # For forbidden_combo rules
        time_window: # Optional: ISO8601 start/end
          start: "<start_time>"
          end: "<end_time>"
```

**Example:**

```yaml
user_overrides:
  user_123:
    forbidden_combos:
      - ["LeBron James", "points", "under"]
    allowed_stat_types:
      - points
      - rebounds
    rules:
      - id: "user123-nba-ev-boost"
        description: "User 123: Higher EV threshold for NBA during playoffs"
        applies_to:
          sport: "nba"
        type: "expected_value_min"
        value: 0.15
        time_window:
          start: "2025-07-27T00:00:00Z"
          end: "2025-08-01T00:00:00Z"
  user_456:
    rules:
      - id: "user456-ufc-ban"
        description: "User 456: No UFC parlays allowed ever"
        applies_to:
          sport: "ufc"
        type: "forbidden_combo"
        combo: ["ufc", "parlay"]
        time_window: null
```

### Rule Precedence and Fallback

- If a `user_id` is provided in the analysis request, the engine checks for user-specific rules in `user_overrides`.
- If user-specific rules exist, they are applied **instead of** global rules for that user.
- If no user-specific rule matches (or no override exists), the engine falls back to global rules.
- Both static and time-windowed rules are supported for users and globally.

### Example: User-Specific Rule Violation in API Response

If a bet is filtered out due to a user-specific rule, the response will include a `violations` array with the user rule ID and reason:

```json
{
  "opportunities": [
    {
      "id": "ufc_parlay_789",
      "player_name": "N/A",
      ...,
      "violations": [
        "Forbidden combo (dynamic): ['ufc', 'parlay'] (user rule user456-ufc-ban)"
      ]
    }
  ],
  "violations": [
    {"bet_id": "ufc_parlay_789", "reason": "Forbidden combo (dynamic): ['ufc', 'parlay'] (user rule user456-ufc-ban)"}
  ]
}
```

### Admin/Integrator Notes

- Use `user_overrides` to enforce custom business logic for VIPs, compliance, or experimental features.
- All user-specific rule changes are hot-reloadable via the admin endpoint (`/api/v1/admin/reload-business-rules`).
- For auditability, all responses include `ruleset_version` and `rules_last_updated`.
- If both user and global rules are present, **user rules always take precedence** for that user.

---

## Rule Change Audit Trail & History

All business rule changes are tracked in an append-only audit log for compliance, traceability, and rollback support.

### Audit Log Schema

Each entry in `backend/rules_audit_log.jsonl` is a JSON object with:

- `timestamp`: ISO-8601 UTC timestamp
- `user_id`: User/admin who made the change (or `system`)
- `action`: `add`, `update`, `delete`, or `init`
- `rule_id`: The rule or config key affected
- `before`: Previous value (if applicable)
- `after`: New value (if applicable)
- `reason`: Optional admin-supplied reason/comment
- `request_ip`: IP address of the requestor (if available)
- `hash`: SHA-256 hash of the entry for tamper-evidence

**Example Entry:**

```json
{
  "timestamp": "2025-07-27T18:00:00Z",
  "user_id": "admin_42",
  "action": "update",
  "rule_id": "nba-ev-boost",
  "before": { "value": 0.1 },
  "after": { "value": 0.15 },
  "reason": "Playoff threshold adjustment",
  "request_ip": "192.168.1.10",
  "hash": "..."
}
```

### API: Get Rule Audit Log

**Endpoint:** `GET /api/v1/admin/rules-audit-log`

**Auth:** Bearer token (admin only)

**Query Parameters:**

- `user_id` (optional): Filter by user/admin
- `action` (optional): `add`, `update`, `delete`
- `rule_id` (optional): Filter by rule/config key
- `since` (optional): Only entries after this ISO-8601 timestamp
- `until` (optional): Only entries before this ISO-8601 timestamp

**Response:**
Returns a list of audit log entries matching the filters.

**Example:**

```json
[
  {
    "timestamp": "2025-07-27T18:00:00Z",
    "user_id": "admin_42",
    "action": "update",
    "rule_id": "nba-ev-boost",
    "before": { "value": 0.1 },
    "after": { "value": 0.15 },
    "reason": "Playoff threshold adjustment",
    "request_ip": "192.168.1.10",
    "hash": "..."
  }
]
```

### Admin Guidance

- All rule changes (add, update, delete, reload) are logged for audit and rollback.
- Use the audit log to review who changed what, when, and why.
- To revert a rule, restore the previous value in `business_rules.yaml` and reload; the revert will also be logged.
- The audit log is append-only and tamper-evident (SHA-256 hash per entry).
- For compliance, retain audit logs per your org’s policy and restrict access to authorized admins.

---

The backend supports dynamic and time-windowed business rules for maximum flexibility and compliance. Rules are defined in `backend/config/business_rules.yaml` under the `rules:` section. Each rule can specify:

- `id`: Unique rule identifier
- `description`: Human-readable description
- `applies_to`: Scope (e.g., sport)
- `type`: Rule type (`expected_value_min`, `risk_score_max`, `forbidden_combo`, etc.)
- `value` or `combo`: Rule value or forbidden feature combination
- `time_window`: Optional ISO8601 start/end; if omitted, rule is always active

**Example YAML:**

```yaml
rules:
  - id: "nba-ev-boost"
    description: "Boost NBA expected value threshold during playoffs"
    applies_to:
      sport: "nba"
    type: "expected_value_min"
    value: 0.10
    time_window:
      start: "2025-07-27T00:00:00Z"
      end: "2025-08-01T00:00:00Z"
  - id: "global-max-risk"
    description: "Global max risk score"
    type: "risk_score_max"
    value: 0.25
    applies_to:
      sport: "all"
    time_window: null
  - id: "forbid-ufc-parlays"
    description: "No parlays for UFC"
    type: "forbidden_combo"
    combo: ["ufc", "parlay"]
    time_window:
      start: "2025-07-30T00:00:00Z"
      end: "2025-08-02T00:00:00Z"
```

**Enforcement:**

- All bets and lineups are filtered according to both static and dynamic/time-windowed rules.
- The engine checks if the current UTC time is within a rule's `time_window` before applying it.
- Violations are reported in the response as shown above.
- Rules can be reloaded at runtime via the admin endpoint.
