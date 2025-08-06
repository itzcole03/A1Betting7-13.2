#!/usr/bin/env python3
"""
Simple working backend for A1Betting frontend
Provides all the endpoints the frontend expects with mock data
"""

import asyncio
import random
import time
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, Optional

import httpx
import uvicorn
from fastapi import BackgroundTasks, FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="A1Betting Simple Backend",
    description="Simple backend providing mock data for frontend",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize cache on startup"""
    await initialize_cache()


# Backend caching and rate limiting
CACHE: Dict[str, Dict[str, Any]] = {}
RATE_LIMIT_COOLDOWN = 300  # 5 minutes between API calls
CACHE_TTL = 180  # 3 minutes cache TTL

# Circuit breaker settings
CIRCUIT_BREAKER_FAILURE_THRESHOLD = 3
CIRCUIT_BREAKER_RECOVERY_TIMEOUT = 300  # 5 minutes
API_TIMEOUT = 5  # Aggressive 5-second timeout


class CircuitBreakerState(Enum):
    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Failing, don't try
    HALF_OPEN = "half_open"  # Testing recovery


class CircuitBreaker:
    def __init__(self):
        self.state = CircuitBreakerState.CLOSED
        self.failure_count = 0
        self.last_failure_time = 0
        self.success_count = 0

    def can_execute(self) -> bool:
        if self.state == CircuitBreakerState.CLOSED:
            return True
        elif self.state == CircuitBreakerState.OPEN:
            if time.time() - self.last_failure_time > CIRCUIT_BREAKER_RECOVERY_TIMEOUT:
                self.state = CircuitBreakerState.HALF_OPEN
                return True
            return False
        elif self.state == CircuitBreakerState.HALF_OPEN:
            return True
        return False

    def record_success(self):
        self.failure_count = 0
        self.success_count += 1
        if self.state == CircuitBreakerState.HALF_OPEN:
            self.state = CircuitBreakerState.CLOSED
        print(f"🟢 Circuit breaker: Success recorded. State: {self.state.value}")

    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= CIRCUIT_BREAKER_FAILURE_THRESHOLD:
            self.state = CircuitBreakerState.OPEN
        print(
            f"🔴 Circuit breaker: Failure recorded ({self.failure_count}/{CIRCUIT_BREAKER_FAILURE_THRESHOLD}). State: {self.state.value}"
        )


class ApiRateLimiter:
    def __init__(self):
        self.last_call = 0
        self.call_count = 0

    def can_make_request(self) -> bool:
        current_time = time.time()
        if current_time - self.last_call >= RATE_LIMIT_COOLDOWN:
            return True
        return False

    def record_request(self):
        self.last_call = time.time()
        self.call_count += 1


rate_limiter = ApiRateLimiter()
circuit_breaker = CircuitBreaker()


# Initialize cache with high-quality mock data on startup
async def initialize_cache():
    """Pre-populate cache with enhanced mock data"""
    print("🚀 Initializing cache with high-quality mock data...")
    mock_data = await get_enhanced_mock_props()
    set_cached_data("prizepicks_props", mock_data)
    set_cached_data("enhanced_prizepicks_props", mock_data)
    print(f"💾 Cache initialized with {len(mock_data)} mock props")


def get_cached_data(cache_key: str) -> Optional[Dict[str, Any]]:
    """Get cached data if it's still fresh"""
    if cache_key in CACHE:
        cache_entry = CACHE[cache_key]
        age = time.time() - cache_entry["timestamp"]
        if age < CACHE_TTL:
            print(f"📦 Returning cached data for {cache_key} (age: {age:.1f}s)")
            return cache_entry["data"]
        else:
            print(f"🕐 Cache expired for {cache_key} (age: {age:.1f}s)")
            del CACHE[cache_key]
    return None


def set_cached_data(cache_key: str, data: Any):
    """Store data in cache with timestamp"""
    CACHE[cache_key] = {"data": data, "timestamp": time.time()}
    print(f"💾 Cached data for {cache_key}")


@app.get("/")
async def root():
    return {
        "name": "A1Betting Simple Backend",
        "version": "1.0.0",
        "status": "running",
        "message": "Backend is operational",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "A1Betting Backend",
    }


@app.get("/api/health")
async def api_health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "A1Betting API",
    }


@app.get("/api/health/status")
async def api_health_status():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "A1Betting API",
        "performance": {
            "memory_usage": "normal",
            "cpu_usage": "normal",
            "response_time": "fast",
        },
        "models": {
            "prediction_engine": "initialized",
            "ultra_accuracy_engine": "initialized",
        },
        "api_metrics": {
            "total_requests": 0,
            "success_rate": 100.0,
            "average_response_time": 0.1,
        },
    }


@app.get("/api/prizepicks/props")
async def get_prizepicks_props():
    """Return PrizePicks props data with aggressive timeouts and circuit breaker protection"""
    cache_key = "prizepicks_props"

    # Always try cache first for instant response
    cached_data = get_cached_data(cache_key)
    if cached_data:
        return cached_data

    # Return enhanced mock data immediately if circuit breaker is open
    if not circuit_breaker.can_execute():
        print("🚫 Circuit breaker is OPEN - returning cached/mock data")
        mock_data = await get_enhanced_mock_props()
        set_cached_data(cache_key, mock_data)
        return mock_data

    # Check rate limiting
    if not rate_limiter.can_make_request():
        time_until_next = RATE_LIMIT_COOLDOWN - (time.time() - rate_limiter.last_call)
        print(
            f"🚫 Rate limited. Next API call allowed in {time_until_next:.1f} seconds"
        )
        mock_data = await get_enhanced_mock_props()
        set_cached_data(cache_key, mock_data)
        return mock_data

    # Try to fetch real data with aggressive timeout
    try:
        print("🌐 Attempting PrizePicks API call with 5-second timeout...")
        rate_limiter.record_request()

        # Use asyncio.wait_for for absolute timeout control
        real_data = await asyncio.wait_for(
            fetch_real_prizepicks_data(), timeout=API_TIMEOUT
        )

        if real_data and len(real_data) > 0:
            circuit_breaker.record_success()
            set_cached_data(cache_key, real_data)
            print(f"✅ Successfully fetched {len(real_data)} real PrizePicks props")
            return real_data
        else:
            raise Exception("Empty response from API")

    except asyncio.TimeoutError:
        print(f"⏱️ API call timed out after {API_TIMEOUT} seconds")
        circuit_breaker.record_failure()
    except Exception as e:
        print(f"❌ API call failed: {e}")
        circuit_breaker.record_failure()

    # Fallback to enhanced mock data
    print("⚠️ Falling back to enhanced mock data")
    mock_data = await get_enhanced_mock_props()
    set_cached_data(cache_key, mock_data)
    return mock_data


async def fetch_real_prizepicks_data():
    """Fetch real data from PrizePicks API with aggressive timeouts"""
    # Ultra-aggressive timeout configuration
    timeout_config = httpx.Timeout(
        connect=2.0,  # 2 seconds to connect
        read=2.0,  # 2 seconds to read
        write=1.0,  # 1 second to write
        pool=1.0,  # 1 second for pool
    )

    async with httpx.AsyncClient(
        timeout=timeout_config,
        limits=httpx.Limits(max_keepalive_connections=5, max_connections=20),
        follow_redirects=False,  # Don't follow redirects to avoid delays
    ) as client:
        url = "https://api.prizepicks.com/projections"
        headers = {
            "User-Agent": "A1Betting/1.0",
            "Accept": "application/json",
            "Connection": "close",  # Don't keep connection alive
        }

        params = {
            "include": "new_player,league",
            "per_page": 15,  # Reduced for faster response
            "single_stat": "true",
        }

        response = await client.get(url, headers=headers, params=params)
        response.raise_for_status()

        data = response.json()
        projections = data.get("data", [])
        included = data.get("included", [])

        # Quick processing without extensive data manipulation
        props = []
        for proj in projections[:10]:  # Limit to 10 for speed
            attrs = proj.get("attributes", {})
            props.append(
                {
                    "id": proj.get("id", f"real_{len(props) + 1}"),
                    "sport": "NBA",  # Simplified
                    "league": "NBA",
                    "player_name": attrs.get("description", f"Player {len(props) + 1}"),
                    "stat_type": attrs.get("stat_type", "Points"),
                    "line": float(attrs.get("line_score", 20.5)),
                    "over_odds": -110,
                    "under_odds": -110,
                    "confidence": round(random.uniform(75, 95), 1),
                    "expected_value": round(random.uniform(2, 12), 2),
                    "kelly_fraction": round(random.uniform(0.02, 0.06), 3),
                    "recommendation": random.choice(["OVER", "UNDER"]),
                    "game_time": attrs.get("start_time", "2025-01-01T20:00:00Z"),
                    "opponent": "vs Opponent",
                    "venue": "Home",
                }
            )

        return props


async def get_enhanced_mock_props():
    """Enhanced mock data with real player names as fallback"""
    props = []

    # Enhanced mock props with real player names and realistic stats
    real_players = [
        {
            "name": "LeBron James",
            "team": "LAL",
            "sport": "NBA",
            "stats": ["Points", "Rebounds", "Assists"],
        },
        {
            "name": "Stephen Curry",
            "team": "GSW",
            "sport": "NBA",
            "stats": ["Points", "3-Pointers Made", "Assists"],
        },
        {
            "name": "Giannis Antetokounmpo",
            "team": "MIL",
            "sport": "NBA",
            "stats": ["Points", "Rebounds", "Assists"],
        },
        {
            "name": "Luka Doncic",
            "team": "DAL",
            "sport": "NBA",
            "stats": ["Points", "Rebounds", "Assists"],
        },
        {
            "name": "Jayson Tatum",
            "team": "BOS",
            "sport": "NBA",
            "stats": ["Points", "Rebounds", "3-Pointers Made"],
        },
        {
            "name": "Nikola Jokic",
            "team": "DEN",
            "sport": "NBA",
            "stats": ["Points", "Rebounds", "Assists"],
        },
        {
            "name": "Josh Allen",
            "team": "BUF",
            "sport": "NFL",
            "stats": ["Passing Yards", "Rushing Yards", "Touchdowns"],
        },
        {
            "name": "Patrick Mahomes",
            "team": "KC",
            "sport": "NFL",
            "stats": ["Passing Yards", "Touchdowns", "Completions"],
        },
        {
            "name": "Aaron Judge",
            "team": "NYY",
            "sport": "MLB",
            "stats": ["Hits", "Home Runs", "RBIs"],
        },
        {
            "name": "Connor McDavid",
            "team": "EDM",
            "sport": "NHL",
            "stats": ["Goals", "Assists", "Shots on Goal"],
        },
    ]

    # Generate realistic props
    for player in real_players:
        for stat in player["stats"]:
            # Generate realistic lines based on stat type
            line = get_realistic_line(stat, player["sport"])

            prop = {
                "id": f"enhanced_{len(props) + 1}",
                "sport": player["sport"],
                "league": player["sport"],
                "player_name": player["name"],
                "stat_type": stat,
                "line": line,
                "over_odds": random.choice([-110, -105, -115]),
                "under_odds": random.choice([-110, -105, -115]),
                "confidence": round(random.uniform(78, 92), 1),
                "expected_value": round(random.uniform(3, 8), 2),
                "kelly_fraction": round(random.uniform(0.025, 0.055), 3),
                "recommendation": random.choice(["OVER", "UNDER"]),
                "game_time": "2025-01-01T20:00:00Z",
                "opponent": f"vs {get_opponent(player['team'])}",
                "venue": "Home" if random.random() > 0.5 else "Away",
            }
            props.append(prop)

    return props


def get_realistic_line(stat_type: str, sport: str) -> float:
    """Generate realistic lines based on stat type and sport"""
    lines = {
        "NBA": {
            "Points": (15.5, 35.5),
            "Rebounds": (4.5, 14.5),
            "Assists": (3.5, 11.5),
            "3-Pointers Made": (1.5, 5.5),
            "Steals": (0.5, 2.5),
            "Blocks": (0.5, 2.5),
        },
        "NFL": {
            "Passing Yards": (225.5, 325.5),
            "Rushing Yards": (45.5, 125.5),
            "Touchdowns": (1.5, 3.5),
            "Receptions": (3.5, 8.5),
            "Completions": (18.5, 28.5),
        },
        "MLB": {
            "Hits": (0.5, 2.5),
            "Home Runs": (0.5, 1.5),
            "RBIs": (0.5, 2.5),
            "Stolen Bases": (0.5, 1.5),
        },
        "NHL": {
            "Goals": (0.5, 2.5),
            "Assists": (0.5, 2.5),
            "Shots on Goal": (2.5, 6.5),
            "Saves": (20.5, 35.5),
        },
    }

    if sport in lines and stat_type in lines[sport]:
        min_line, max_line = lines[sport][stat_type]
        return round(random.uniform(min_line, max_line), 1)
    else:
        return round(random.uniform(5.5, 25.5), 1)


def get_opponent(team: str) -> str:
    """Get a realistic opponent for the team"""
    opponents = {
        "LAL": "GSW",
        "GSW": "LAL",
        "MIL": "BOS",
        "DAL": "PHX",
        "BOS": "MIL",
        "DEN": "LAC",
        "BUF": "KC",
        "KC": "BUF",
        "NYY": "BOS",
        "EDM": "COL",
    }
    return opponents.get(team, "OPP")


@app.get("/api/prizepicks/props/enhanced")
async def get_enhanced_prizepicks_props():
    """Return enhanced PrizePicks props with ML predictions and confidence scores using caching"""
    cache_key = "enhanced_prizepicks_props"

    # Try to get cached enhanced data first
    cached_data = get_cached_data(cache_key)
    if cached_data:
        return cached_data

    # Get the base props (this will use its own caching)
    props = await get_prizepicks_props()

    # Enhance each prop with additional ML data
    enhanced_props = []
    for prop in props:
        enhanced_prop = {
            **prop,  # Include all original data
            "ensemble_prediction": prop.get("line", 20.5) + random.uniform(-2, 2),
            "ensemble_confidence": random.uniform(70, 95),
            "kelly_fraction": random.uniform(0.02, 0.08),
            "expected_value": random.uniform(-0.1, 0.3),
            "risk_score": random.uniform(20, 80),
            "ai_explanation": {
                "key_factors": [
                    f"{prop.get('player_name', 'Player')} recent performance trend",
                    f"Matchup analysis vs {prop.get('opponent', 'opponent')}",
                    "Statistical modeling confidence",
                    "Market efficiency factors",
                ],
                "risk_level": random.choice(["low", "medium", "high"]),
                "confidence_details": f"Model confidence: {random.randint(70, 95)}%",
            },
        }
        enhanced_props.append(enhanced_prop)

    # Cache the enhanced props
    set_cached_data(cache_key, enhanced_props)

    print(f"✅ Returning {len(enhanced_props)} enhanced props with ML predictions")
    return enhanced_props


@app.get("/api/betting-opportunities")
async def get_betting_opportunities():
    """Return mock betting opportunities"""
    opportunities = []

    for i in range(10):
        opp = {
            "id": f"bet_{i + 1}",
            "sport": random.choice(["NBA", "NFL", "MLB", "NHL"]),
            "event": f"Team A vs Team B Game {i + 1}",
            "market": random.choice(["Moneyline", "Spread", "Total"]),
            "odds": round(random.uniform(1.5, 3.0), 2),
            "probability": round(random.uniform(0.3, 0.7), 3),
            "expected_value": round(random.uniform(-2, 12), 2),
            "kelly_fraction": round(random.uniform(0.01, 0.05), 3),
            "confidence": round(random.uniform(70, 95), 1),
            "risk_level": random.choice(["Low", "Medium", "High"]),
            "recommendation": random.choice(["BET", "PASS", "STRONG BET"]),
        }
        opportunities.append(opp)

    return opportunities


@app.get("/api/arbitrage-opportunities")
async def get_arbitrage_opportunities():
    """Return mock arbitrage opportunities"""
    arbitrage = []

    for i in range(5):
        arb = {
            "id": f"arb_{i + 1}",
            "sport": random.choice(["NBA", "NFL", "MLB"]),
            "event": f"Arbitrage Game {i + 1}",
            "bookmaker_a": random.choice(["DraftKings", "FanDuel", "BetMGM"]),
            "bookmaker_b": random.choice(["Caesars", "BetRivers", "PointsBet"]),
            "odds_a": round(random.uniform(1.8, 2.2), 2),
            "odds_b": round(random.uniform(1.8, 2.2), 2),
            "profit_margin": round(random.uniform(2, 8), 2),
            "required_stake": round(random.uniform(100, 500), 2),
        }
        arbitrage.append(arb)

    return arbitrage


@app.get("/api/predictions/prizepicks")
async def get_predictions():
    """Return mock predictions"""
    predictions = []

    for i in range(15):
        pred = {
            "id": f"pred_{i + 1}",
            "sport": random.choice(["NBA", "NFL", "MLB", "NHL"]),
            "event": f"Prediction Game {i + 1}",
            "prediction": random.choice(["Team A Win", "Team B Win", "Over", "Under"]),
            "confidence": round(random.uniform(75, 95), 1),
            "odds": round(random.uniform(1.5, 3.0), 2),
            "expected_value": round(random.uniform(5, 20), 2),
            "timestamp": datetime.now().isoformat(),
            "model_version": "v4.0",
        }
        predictions.append(pred)

    return {"predictions": predictions, "total_count": len(predictions)}


@app.get("/api/ultra-accuracy/model-performance")
async def get_model_performance():
    """Return mock model performance data"""
    return {
        "overall_accuracy": round(random.uniform(85, 95), 1),
        "recent_accuracy": round(random.uniform(80, 95), 1),
        "model_metrics": {
            "precision": round(random.uniform(0.8, 0.95), 3),
            "recall": round(random.uniform(0.8, 0.95), 3),
            "f1_score": round(random.uniform(0.8, 0.95), 3),
            "auc_roc": round(random.uniform(0.85, 0.98), 3),
        },
        "performance_by_sport": {
            "NBA": {"accuracy": round(random.uniform(85, 95), 1), "games": 150},
            "NFL": {"accuracy": round(random.uniform(80, 90), 1), "games": 85},
            "MLB": {"accuracy": round(random.uniform(75, 88), 1), "games": 200},
            "NHL": {"accuracy": round(random.uniform(78, 90), 1), "games": 120},
        },
    }


@app.get("/api/analytics/performance")
async def get_performance_analytics():
    """Return mock performance analytics"""
    return {
        "daily_stats": {
            "total_bets": random.randint(50, 200),
            "winning_bets": random.randint(30, 120),
            "profit": round(random.uniform(100, 1000), 2),
            "roi": round(random.uniform(5, 25), 2),
        },
        "weekly_performance": [
            {"day": "Monday", "profit": round(random.uniform(-50, 200), 2)},
            {"day": "Tuesday", "profit": round(random.uniform(-50, 200), 2)},
            {"day": "Wednesday", "profit": round(random.uniform(-50, 200), 2)},
            {"day": "Thursday", "profit": round(random.uniform(-50, 200), 2)},
            {"day": "Friday", "profit": round(random.uniform(-50, 200), 2)},
            {"day": "Saturday", "profit": round(random.uniform(-50, 200), 2)},
            {"day": "Sunday", "profit": round(random.uniform(-50, 200), 2)},
        ],
    }


@app.get("/api/analytics/summary")
async def get_analytics_summary():
    """Return mock analytics summary"""
    return {
        "accuracy": round(random.uniform(80, 95), 1),
        "total_predictions": random.randint(500, 2000),
        "confidence_score": round(random.uniform(0.7, 0.95), 2),
        "win_rate": round(random.uniform(65, 85), 1),
        "profit_margin": round(random.uniform(8, 25), 2),
        "roi": round(random.uniform(12, 30), 1),
        "kelly_optimal": round(random.uniform(0.02, 0.08), 3),
        "sharpe_ratio": round(random.uniform(1.2, 2.1), 2),
        "max_drawdown": round(random.uniform(5, 15), 1),
        "recent_performance": {
            "last_7_days": round(random.uniform(75, 90), 1),
            "last_30_days": round(random.uniform(70, 88), 1),
            "last_90_days": round(random.uniform(68, 85), 1),
        },
    }


if __name__ == "__main__":
    print("🚀 Starting A1Betting Simple Backend...")
    print("📊 Serving mock data for frontend development")
    print("🌐 Backend will be available at: http://localhost:8000")

    uvicorn.run(
        "simple_backend:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
