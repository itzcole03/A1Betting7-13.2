# A1Betting Real-Time Analysis API Documentation

## Overview

The A1Betting platform provides a comprehensive real-time analysis API that processes thousands of bets across all major sports and sportsbooks using a 47+ ML model ensemble to deliver the highest-probability winning opportunities.

## Base URL

- **Development**: `http://localhost:8000`
- **Production**: `https://your-domain.com`

## Authentication

Currently, the API uses basic authentication for protected endpoints. Include authentication headers when required.

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

## Enhanced Betting Endpoints (Legacy)

### Get Enhanced Bets

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
  response.analysis_id,
)) {
  console.log(`Progress: ${progress.progress_percentage}%`);
  if (progress.status === "completed") break;
}

// Get results
const opportunities = await realTimeAnalysisService.getBettingOpportunities(
  response.analysis_id,
);
const lineups = await realTimeAnalysisService.getOptimalLineups(
  response.analysis_id,
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
