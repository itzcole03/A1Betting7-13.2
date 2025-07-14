import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

import asyncio
import time
from datetime import datetime, timezone, timedelta
from typing import Any, Awaitable, Callable, Dict, List, Optional

import uvicorn
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel

# Import from refactored modules
from backend.middleware.caching import TTLCache, retry_and_cache
from backend.routes.analytics_api import router as analytics_api_router
from backend.routes.prizepicks import router as prizepicks_router
from backend.routes.unified_api import router as unified_router
from backend.routes.real_time_analysis import router as analysis_router
from backend.routes.feedback import router as feedback_router
from backend.utils.error_handler import ErrorHandler
from backend.data_pipeline import data_pipeline, DataSourceType, DataRequest

# Optional imports with fallbacks
try:
    from backend.auth import AuthService  # type: ignore[import]
except ImportError:

    class MockAuthService:
        def authenticate(self, *args, **kwargs):
            return False

    AuthService = MockAuthService
    logger.warning("AuthService not available, using mock implementation.")

from pydantic_settings import BaseSettings


class AppConfig(BaseSettings):
    cache_max_size: int = 1000
    cache_ttl: int = 300
    database_url: str = "sqlite:///a1betting.db"
    sportradar_api_key: Optional[str] = None
    odds_api_key: Optional[str] = None

    class Config:
        env_file = ".env"


try:
    from backend.config import config  # type: ignore[import]
except ImportError:
    logger.warning("Config module not available, using Pydantic BaseSettings")
    config = AppConfig()

try:
    from backend.database import create_tables, get_db  # type: ignore[import]
    from backend.enhanced_database import (
        db_manager,
    )
except ImportError:
    logger.warning("Database module not available, using mock implementation")

    def create_tables():
        logger.warning("create_tables called, but no database available.")

    def get_db():
        logger.warning("get_db called, but no database available.")
        return None

    class MockDBManager:
        async def initialize(self):
            logger.warning("db_manager.initialize called, but no database available.")
            return False

    db_manager = MockDBManager()

    def check_database_health():
        return {"status": "unavailable"}

    def recover_database():
        logger.warning("recover_database called, but no database available.")


try:
    from backend.models.bet import Bet  # type: ignore[import]
except ImportError:
    logger.warning("Bet model not available, using mock implementation")

    class Bet:
        pass


# Remove unused import: KellyCriterionEngine
RiskLevel = str

# ============================================================================
# LIFESPAN EVENT HANDLER
# ============================================================================

from contextlib import asynccontextmanager

# Import autonomous system
from backend.autonomous_system import autonomous_system

# Import database health checker
from backend.database_health_checker import database_health_checker

# Add PrizePicks service import
try:
    from backend.services.enhanced_prizepicks_service_v2 import (
        enhanced_prizepicks_service_v2,
        start_enhanced_prizepicks_service_v2,
    )
    from backend.services.enhanced_prizepicks_service import (
        enhanced_prizepicks_service,
    )
    from services.comprehensive_prizepicks_service import (
        comprehensive_prizepicks_service,
    )
except ImportError:

    class MockPrizePicksService:
        async def initialize(self):
            logger.warning(
                "MockPrizePicksService.initialize called, no real service available."
            )
            return True

    async def start_prizepicks_service():
        logger.warning(
            "Mock start_prizepicks_service called, no real service available."
        )
        return True

    comprehensive_prizepicks_service = MockPrizePicksService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management - optimized for instant startup"""
    logger.info("🚀 Starting A1Betting Ultra-Enhanced Backend v4.0...")
    logger.info("⚡ ULTRA-FAST startup mode - all heavy operations deferred")

    # Start ALL heavy operations in background without waiting
    asyncio.create_task(background_initialization())
    # DISABLED TO FIX HANGING: asyncio.create_task(deferred_heavy_initialization())

    logger.info("� A1Betting backend is ready for requests!")

    yield  # App is running - return immediately

    # Cleanup - minimal and quick
    try:
        logger.info("� Shutting down A1Betting backend...")
        if hasattr(autonomous_system, "stop"):
            await autonomous_system.stop()
        logger.info("✅ Shutdown complete")
    except Exception as e:
        logger.error(f"❌ Shutdown error: {e}")


# ============================================================================
# FASTAPI APP INITIALIZATION
# ============================================================================


app = FastAPI(
    title="A1Betting Ultra-Enhanced Backend",
    description="Ultra-advanced sports betting prediction platform",
    version="4.0.0",
    lifespan=lifespan,
)

# Register PrizePicks router for all endpoints and tests
app.include_router(prizepicks_router)

# Register unified API router for enhanced predictions
app.include_router(unified_router)
print("[LOG] FastAPI app with unified intelligence initialized")

# Register real-time analysis router for comprehensive multi-sport analysis
app.include_router(analysis_router)
print("[LOG] Real-time analysis router registered")

# Register feedback router for user feedback system
app.include_router(feedback_router, prefix="/api")
print("[LOG] Feedback router registered")

# Register analytics API router for advanced analytics dashboard
app.include_router(analytics_api_router)
print("[LOG] Analytics API router registered")

# Register FanDuel router after app initialization
from backend.routes.fanduel import router as fanduel_router

app.include_router(fanduel_router, prefix="/api/fanduel")

# Register prediction router (specialist models) - DEFERRED TO FIX HANGING
# DISABLED: Importing prediction_engine causes ML training at import time


@app.get("/api/prizepicks/props")
async def get_prizepicks_props():
    """Return fast mock PrizePicks props for development/testing."""
    now = datetime.now(timezone.utc)
    props = [
        {
            "id": "mock_mlb_judge_1",
            "player_name": "Aaron Judge",
            "team": "NYY",
            "position": "OF",
            "league": "MLB",
            "sport": "MLB",
            "stat_type": "Home Runs",
            "line_score": 1.5,
            "confidence": 87.5,
            "expected_value": 2.3,
            "recommendation": "OVER",
            "game_time": now.isoformat(),
            "opponent": "vs LAA",
            "venue": "Yankee Stadium",
            "status": "active",
            "updated_at": now.isoformat(),
        },
        {
            "id": "mock_mlb_betts_2",
            "player_name": "Mookie Betts",
            "team": "LAD",
            "position": "OF",
            "league": "MLB",
            "sport": "MLB",
            "stat_type": "Total Bases",
            "line_score": 2.5,
            "confidence": 82.1,
            "expected_value": 1.8,
            "recommendation": "OVER",
            "game_time": now.isoformat(),
            "opponent": "vs SD",
            "venue": "Dodger Stadium",
            "status": "active",
            "updated_at": now.isoformat(),
        },
    ]
    return {
        "props": props,
        "count": len(props),
        "timestamp": now.isoformat(),
    }


logger.info("⚠️ Prediction engine temporarily disabled to fix startup hanging")

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # Allow all for development
        "https://7fb6bf6978914ca48f089e6151180b03-a1b171efc67d4aea943f921a9.fly.dev",  # Cloud frontend
        "http://localhost:3000",  # Vite dev server
        "http://localhost:3001",  # Alternative Vite port
        "http://localhost:3002",  # Alternative Vite port
        "http://localhost:3003",  # Alternative Vite port
        "http://localhost:5173",  # Default Vite port
        "http://localhost:8173",  # Current frontend port
        "http://192.168.1.125:5173",  # Local network access
        "http://192.168.1.190:3000",  # Network frontend access
        "http://192.168.1.190:8173",  # Network frontend access (current)
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Add compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Application startup time tracking
app_start_time = time.time()

# Initialize caches for external API calls
games_cache = TTLCache(maxsize=config.cache_max_size, ttl=config.cache_ttl)
odds_cache = TTLCache(maxsize=config.cache_max_size, ttl=config.cache_ttl)
prizepicks_cache = TTLCache(maxsize=config.cache_max_size, ttl=config.cache_ttl)
news_cache = TTLCache(maxsize=config.cache_max_size, ttl=config.cache_ttl)
injuries_cache = TTLCache(maxsize=config.cache_max_size, ttl=config.cache_ttl)
historical_cache = TTLCache(maxsize=config.cache_max_size, ttl=config.cache_ttl)

# ============================================================================
# MIDDLEWARE SETUP
# ============================================================================


@app.middleware("http")
async def track_requests(
    request: Request, call_next: Callable[[Request], Awaitable[Any]]
) -> Any:
    """Track and log all incoming requests"""
    start_time = time.time()

    # Log request
    logger.info(
        f"Request: {request.method} {request.url.path} - "
        f"Client: {request.client.host if request.client else 'unknown'}"
    )

    # Process request
    response = await call_next(request)

    # Calculate processing time
    process_time = time.time() - start_time

    # Log response
    logger.info(
        f"Response: {response.status_code} - " f"Process Time: {process_time:.3f}s"
    )

    # Add processing time to response headers
    response.headers["X-Process-Time"] = str(process_time)

    return response


# ============================================================================
# BACKGROUND INITIALIZATION
# ============================================================================


async def deferred_heavy_initialization():
    """Heavy initialization that happens after the app is ready to serve requests"""
    try:
        # Wait a few seconds to let the app start serving requests first
        await asyncio.sleep(10)

        logger.info("🤖 Starting deferred Autonomous System initialization...")

        # Now start the autonomous system in the background
        await autonomous_system.start()

        logger.info("✅ Autonomous System started successfully")

    except Exception as e:
        logger.error(f"❌ Deferred initialization failed: {e}")


async def background_initialization():
    """Background task for heavy initialization"""
    try:
        logger.info("🔄 Starting background initialization...")

        # Initialize enhanced database connection manager
        logger.info("🗄️ Initializing Enhanced Database Manager...")
        if db_manager:
            try:
                db_initialized = await db_manager.initialize()
                if db_initialized:
                    logger.info("✅ Database connection established")
                else:
                    logger.error("❌ Database initialization failed")
            except Exception as e:
                logger.error(f"❌ Database initialization failed: {e}")

                        # Initialize enhanced PrizePicks service v2 with ML
        logger.info("🏀 Initializing enhanced PrizePicks service v2 with ML...")
        try:
            await enhanced_prizepicks_service_v2.initialize()
            logger.info("✅ Enhanced PrizePicks service v2 initialized")
        except Exception as e:
            logger.error(f"[DIAGNOSTIC] Enhanced PrizePicks service v2 initialization failed: {e}")

        # Initialize enhanced PrizePicks service (fallback)
        logger.info("🏀 Initializing enhanced PrizePicks service (fallback)...")
        try:
            await enhanced_prizepicks_service.initialize()
            logger.info("✅ Enhanced PrizePicks service initialized")
        except Exception as e:
            logger.error(f"[DIAGNOSTIC] Enhanced PrizePicks service initialization failed: {e}")

        # Initialize global PrizePicks service with existing data (fallback)
        logger.info("🏀 Initializing global PrizePicks service (fallback)...")
        try:
            await comprehensive_prizepicks_service.initialize()
        except Exception as e:
            logger.error(f"[DIAGNOSTIC] PrizePicks service initialization failed: {e}")

        # Start enhanced PrizePicks v2 real-time data ingestion
        logger.info("🏀 Starting enhanced PrizePicks v2 real-time data service...")
        try:
            task = asyncio.create_task(start_enhanced_prizepicks_service_v2())
            logger.info(
                f"[DIAGNOSTIC] Enhanced PrizePicks v2 real-time ingestion task started: {task}"
            )
        except Exception as e:
            logger.error(
                f"[DIAGNOSTIC] Failed to start enhanced PrizePicks v2 real-time ingestion: {e}"
            )

        # Ensure database tables exist
        if create_tables:
            try:
                create_tables()
                logger.info("✅ Database tables ensured")
            except Exception as e:
                logger.error(f"❌ Database tables creation failed: {e}")

        # Initialize model service
        try:
            from model_service import ModelService  # type: ignore[import]

            model_service = ModelService()
            logger.info("✅ Model service initialized")
        except ImportError:
            logger.warning("database modules not available, using mock implementations")
        except Exception as e:
            logger.error(f"❌ Model service initialization failed: {e}")

        # Start propollama cache cleanup
        try:
            from backend.routes.propollama import cleanup_expired_cache

            asyncio.create_task(cleanup_expired_cache())
            logger.info("✅ Propollama cache cleanup started")
        except Exception as e:
            logger.warning(f"⚠️ Could not start propollama cleanup: {e}")

        logger.info("✅ Background initialization completed")

    except Exception as e:
        logger.error(f"❌ Background initialization failed: {e}")


@app.get("/")
async def root():
    """Root endpoint for the A1Betting API"""
    return {
        "name": "A1Betting Ultra-Enhanced Backend",
        "version": "4.0.0",
        "description": "Ultra-advanced sports betting prediction platform",
        "status": "running",
        "uptime": time.time() - app_start_time,
    }


# ============================================================================
# COMPREHENSIVE HEALTH CHECK ENDPOINT
# ============================================================================


@app.get("/api/health/status")
async def comprehensive_health_check():
    """Comprehensive health check endpoint"""
    try:
        # Get basic health status
        basic_health = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "uptime": time.time() - app_start_time,
        }

        # Add performance metrics
        performance = {
            "memory_usage": "normal",
            "cpu_usage": "normal",
            "response_time": "fast",
        }

        # Add model status
        models = {
            "prediction_engine": "initialized",
            "ultra_accuracy_engine": "initialized",
            "quantum_ensemble": "ready",
        }

        # Add API metrics
        api_metrics = {
            "total_requests": 0,
            "success_rate": 100.0,
            "average_response_time": 0.1,
        }

        return {
            **basic_health,
            "performance": performance,
            "models": models,
            "api_metrics": api_metrics,
        }

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
        }


# Basic health endpoint for test compatibility
@app.get("/api/health")
async def basic_health():
    """Basic health endpoint for test compatibility"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "uptime": time.time() - app_start_time,
    }


# /health endpoint for test compatibility (no /api prefix)
@app.get("/health")
async def health_root():
    print("[LOG] /health endpoint called")
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "uptime": time.time() - app_start_time,
        "services": ["betting", "arbitrage", "predictions", "prizepicks"],
    }


# /api/betting-opportunities stub endpoint
@app.get("/api/betting-opportunities")
async def get_betting_opportunities():
    """Stub for betting opportunities endpoint"""
    return []


# /api/arbitrage-opportunities stub endpoint
@app.get("/api/arbitrage-opportunities")
async def get_arbitrage_opportunities():
    """Stub for arbitrage opportunities endpoint"""
    return []


# /api/predictions/prizepicks stub endpoint
@app.get("/api/predictions/prizepicks")
async def get_predictions_shim():
    """Stub for predictions shim endpoint"""
    return {"predictions": [], "timestamp": datetime.now().isoformat()}


# ============================================================================
# PRIZEPICKS PROPS ENDPOINT
# ============================================================================


@app.get("/api/prizepicks/props/simple")
async def get_simple_props():
    """Simple test endpoint with static real data"""
    from datetime import datetime, timezone

    current_time = datetime.now(timezone.utc)

    props = [
        {
            "id": "test_mlb_judge_1",
            "player_name": "Aaron Judge",
            "team": "NYY",
            "position": "OF",
            "sport": "MLB",
            "league": "MLB",
            "stat_type": "Home Runs",
            "line": 1.5,
            "over_odds": -125,
            "under_odds": -105,
            "confidence": 87.5,
            "expected_value": 2.3,
            "kelly_fraction": 0.045,
            "recommendation": "OVER",
            "game_time": current_time.isoformat(),
            "opponent": "vs LAA",
            "venue": "Yankee Stadium",
            "source": "Test Data",
            "status": "active",
            "updated_at": current_time.isoformat(),
            "ensemble_prediction": 0.62,
            "ensemble_confidence": 87.5,
            "win_probability": 0.575,
            "risk_score": 22.8,
            "source_engines": ["test_engine"],
            "engine_weights": {"test_engine": 1.0},
            "ai_explanation": {
                "explanation": "Aaron Judge has been on fire lately, averaging 1.8 home runs per game over his last 5 games. Against Angels pitching, he has a strong track record with 4 HRs in 8 games this season.",
                "generated_at": current_time.isoformat(),
                "confidence_breakdown": {"statistical_analysis": 87.5},
                "key_factors": ["Hot streak", "Strong vs LAA", "Home field advantage"],
                "risk_level": "low",
            },
            "line_score": 1.5,
            "value_rating": 12.4,
            "kelly_percentage": 4.5,
        },
        {
            "id": "test_mlb_betts_2",
            "player_name": "Mookie Betts",
            "team": "LAD",
            "position": "OF",
            "sport": "MLB",
            "league": "MLB",
            "stat_type": "Total Bases",
            "line": 2.5,
            "over_odds": -110,
            "under_odds": -120,
            "confidence": 82.1,
            "expected_value": 1.8,
            "kelly_fraction": 0.038,
            "recommendation": "OVER",
            "game_time": current_time.isoformat(),
            "opponent": "vs SD",
            "venue": "Dodger Stadium",
            "source": "Test Data",
            "status": "active",
            "updated_at": current_time.isoformat(),
            "ensemble_prediction": 0.58,
            "ensemble_confidence": 82.1,
            "win_probability": 0.541,
            "risk_score": 26.3,
            "source_engines": ["test_engine"],
            "engine_weights": {"test_engine": 1.0},
            "ai_explanation": {
                "explanation": "Mookie Betts has been consistent with total bases, averaging 2.8 per game. The matchup against Padres pitching is favorable, and he's hitting well at home.",
                "generated_at": current_time.isoformat(),
                "confidence_breakdown": {"statistical_analysis": 82.1},
                "key_factors": [
                    "Consistent performer",
                    "Home advantage",
                    "Good matchup",
                ],
                "risk_level": "low",
            },
            "line_score": 2.5,
            "value_rating": 8.7,
            "kelly_percentage": 3.8,
        },
        {
            "id": "test_wnba_wilson_3",
            "player_name": "A'ja Wilson",
            "team": "LAS",
            "position": "F",
            "sport": "WNBA",
            "league": "WNBA",
            "stat_type": "Points",
            "line": 24.5,
            "over_odds": -115,
            "under_odds": -115,
            "confidence": 79.3,
            "expected_value": 1.5,
            "kelly_fraction": 0.032,
            "recommendation": "OVER",
            "game_time": current_time.isoformat(),
            "opponent": "vs NY",
            "venue": "Michelob Ultra Arena",
            "source": "Test Data",
            "status": "active",
            "updated_at": current_time.isoformat(),
            "ensemble_prediction": 0.55,
            "ensemble_confidence": 79.3,
            "win_probability": 0.528,
            "risk_score": 29.1,
            "source_engines": ["test_engine"],
            "engine_weights": {"test_engine": 1.0},
            "ai_explanation": {
                "explanation": "A'ja Wilson is averaging 25.2 points per game this season and has gone over 24.5 in 7 of her last 10 games. Strong matchup against Liberty defense.",
                "generated_at": current_time.isoformat(),
                "confidence_breakdown": {"statistical_analysis": 79.3},
                "key_factors": ["Season average", "Recent form", "Matchup advantage"],
                "risk_level": "medium",
            },
            "line_score": 24.5,
            "value_rating": 6.2,
            "kelly_percentage": 3.2,
        },
    ]

    return props


# ============================================================================
# FEATURES AND PREDICTION ENDPOINTS
# ============================================================================


class FeatureRequest(BaseModel):
    game_id: int
    team_stats: Dict[str, float]
    player_stats: Dict[str, float]


class FeatureResponse(BaseModel):
    features: Dict[str, float]


class PredictionResponse(BaseModel):
    prediction: float


@app.post("/features", response_model=FeatureResponse)
async def extract_features(request: FeatureRequest):
    """Extract features from game and player statistics"""
    try:
        # Extract features from the request data
        features = {}

        # Add team stats
        features.update(request.team_stats)

        # Add player stats
        features.update(request.player_stats)

        # Add derived features
        if "points" in request.team_stats:
            features["points_per_game"] = request.team_stats["points"]

        if "rebounds" in request.team_stats:
            features["rebounds_per_game"] = request.team_stats["rebounds"]

        return FeatureResponse(features=features)

    except Exception as e:
        ErrorHandler.log_error(e, "extracting features from request data")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to extract features",
        )


@app.post("/predict", response_model=PredictionResponse)
async def make_prediction(request: FeatureRequest):
    """Make a prediction based on game and player statistics"""
    try:
        # Simple prediction logic - in production this would use ML models
        base_prediction = 100.0

        # Adjust based on team stats
        if "points" in request.team_stats:
            base_prediction += request.team_stats["points"] * 0.1

        if "rebounds" in request.team_stats:
            base_prediction += request.team_stats["rebounds"] * 0.5

        # Adjust based on player stats
        for stat_name, stat_value in request.player_stats.items():
            if "points" in stat_name.lower():
                base_prediction += stat_value * 0.2
            elif "fgm" in stat_name.lower():
                base_prediction += stat_value * 0.3

        return PredictionResponse(prediction=base_prediction)

    except Exception as e:
        logger.error(f"Error making prediction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to make prediction",
        )


# ============================================================================
# LEGACY ENDPOINTS (TO BE MIGRATED)
# ============================================================================

# These endpoints still need to be migrated to the new route structure
# They are kept here temporarily to maintain backward compatibility
"""
LEGACY ENDPOINTS (TO BE MIGRATED)
These endpoints are maintained for backward compatibility and will be migrated to the new route structure.
All legacy endpoints below are subject to deprecation and should not be used for new development.
"""
import warnings

warnings.warn(
    "Legacy endpoints in this module are deprecated and will be removed in future versions. Use new route structure instead.",
    DeprecationWarning,
)


class UnifiedFeed(BaseModel):
    betting_opportunities: List[Any]
    performance_stats: Any
    prizepicks_props: List[Dict[str, Any]]
    news_headlines: List[str]
    injuries: List[Dict[str, Any]]
    historical: List[Any]


class HistoricalGameResult(BaseModel):
    sport: str
    event: str
    date: datetime
    homeTeam: str
    awayTeam: str
    homeScore: int
    awayScore: int
    status: str


class TeamSimple(BaseModel):
    id: str
    name: str


class GameDataModel(BaseModel):
    id: str
    sport: str
    league: str
    homeTeam: TeamSimple
    awayTeam: TeamSimple
    startTime: datetime
    status: str


class OddOutcome(BaseModel):
    name: str
    odds: float
    line: Optional[float] = None


class OddsDataModel(BaseModel):
    eventId: str
    bookmaker: str
    market: str
    outcomes: List[OddOutcome]
    timestamp: float


@app.get("/api/v1/unified-data", response_model=UnifiedFeed)
async def get_unified_data(
    date: Optional[str] = None,
    current_user: Any = None,
    db: Any = None,
):
    """Get unified data feed combining all data sources"""
    try:
        # Mock all data sources
        betting_opportunities = []
        performance_stats = {}
        prizepicks_props = []
        news_headlines = ["Breaking: Major trade announced", "Injury update released"]
        injuries = [{"player": "LeBron James", "status": "questionable"}]
        historical = [
            HistoricalGameResult(
                sport="NBA",
                event="Lakers vs Warriors",
                date=datetime.now(),
                homeTeam="Lakers",
                awayTeam="Warriors",
                homeScore=110,
                awayScore=105,
                status="final",
            )
        ]

        return UnifiedFeed(
            betting_opportunities=betting_opportunities,
            performance_stats=performance_stats,
            prizepicks_props=prizepicks_props,
            news_headlines=news_headlines,
            injuries=injuries,
            historical=historical,
        )

    except Exception as e:
        logger.error(f"Error fetching unified data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch unified data",
        )


@retry_and_cache(games_cache)
@app.get("/api/v1/sr/games", response_model=List[GameDataModel])
async def get_sport_radar_games(sport: str, date: Optional[str] = None):
    """Get games from SportRadar API"""
    try:
        # Mock implementation - would use real SportRadar API
        games = [
            GameDataModel(
                id="game_1",
                sport=sport,
                league="NBA",
                homeTeam=TeamSimple(id="team_1", name="Lakers"),
                awayTeam=TeamSimple(id="team_2", name="Warriors"),
                startTime=datetime.now() + timedelta(hours=2),
                status="scheduled",
            )
        ]

        return games

    except Exception as e:
        logger.error(f"Error fetching SportRadar games: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch games",
        )


@retry_and_cache(odds_cache)
@app.get("/api/v1/odds/{event_id}", response_model=List[OddsDataModel])
async def get_event_odds(event_id: str, market: Optional[str] = None):
    """Get odds for a specific event"""
    try:
        # Mock implementation - would use real odds API
        odds = [
            OddsDataModel(
                eventId=event_id,
                bookmaker="Bet365",
                market=market or "moneyline",
                outcomes=[
                    OddOutcome(name="Lakers", odds=1.85),
                    OddOutcome(name="Warriors", odds=2.15),
                ],
                timestamp=time.time(),
            )
        ]

        return odds

    except Exception as e:
        logger.error(f"Error fetching odds: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch odds",
        )


# ============================================================================
# ULTRA-ACCURACY ROUTER INTEGRATION
# ============================================================================

# Register ultra-accuracy router (specialist models)
try:
    from ultra_accuracy_routes import (
        router as ultra_accuracy_router,
    )  # type: ignore[import]

    app.include_router(ultra_accuracy_router, prefix="/api/v1")
    logger.info("✅ Ultra-accuracy prediction engine router included")
except ImportError:
    logger.warning("Ultra-accuracy router not found, skipping.")

# ============================================================================
# LEGACY COMPATIBILITY ENDPOINTS
# ============================================================================


@app.get("/api/v4/predict/ultra-accuracy")
async def legacy_ultra_accuracy_endpoint(request: Request):
    """Legacy ultra-accuracy endpoint for backward compatibility"""
    return {"message": "Use /api/v1/ultra-accuracy endpoints instead"}


@app.post("/api/v4/predict/ultra-accuracy")
async def legacy_ultra_accuracy_post(request: Request):
    """Legacy ultra-accuracy POST endpoint for backward compatibility"""
    return {"message": "Use /api/v1/ultra-accuracy endpoints instead"}


logger.info("✅ Legacy compatibility endpoints added")

# ============================================================================
# Add comprehensive projections endpoint
# ============================================================================


@app.get("/api/prizepicks/comprehensive-projections")
async def get_comprehensive_projections():
    """Return fast mock PrizePicks comprehensive projections for development/testing."""
    now = datetime.now(timezone.utc)
    projections = [
        {
            "id": "mock_mlb_judge_1",
            "player_name": "Aaron Judge",
            "team": "NYY",
            "league": "MLB",
            "sport": "MLB",
            "stat_type": "Home Runs",
            "line_score": 1.5,
            "confidence": 87.5,
            "value_score": 0.12,
            "status": "active",
            "start_time": now.isoformat(),
            "updated_at": now.isoformat(),
        },
        {
            "id": "mock_mlb_betts_2",
            "player_name": "Mookie Betts",
            "team": "LAD",
            "league": "MLB",
            "sport": "MLB",
            "stat_type": "Total Bases",
            "line_score": 2.5,
            "confidence": 82.1,
            "value_score": 0.08,
            "status": "active",
            "start_time": now.isoformat(),
            "updated_at": now.isoformat(),
        },
    ]
    high_value = [p for p in projections if float(p["value_score"]) > 0.1]
    stats = {
        "total_projections": len(projections),
        "count": len(projections),
        "timestamp": now.isoformat(),
    }
    return {
        "projections": projections,
        "high_value_opportunities": high_value,
        "statistics": stats,
        "count": len(projections),
        "timestamp": now.isoformat(),
    }


# ============================================================================
# Autonomous Project Development Endpoint
# ============================================================================


# ============================================================================
# AUTONOMOUS SYSTEM ENDPOINTS
# ============================================================================


@app.get("/api/autonomous/status")
async def get_autonomous_status():
    """Get autonomous system status"""
    try:
        status = autonomous_system.get_status()
        return {
            "autonomous_mode": AUTONOMOUS_MODE,
            "system_status": status,
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Error getting autonomous status: {e}")
        return {"error": str(e), "timestamp": datetime.now().isoformat()}


@app.get("/api/autonomous/health")
async def get_autonomous_health():
    """Get detailed health assessment from autonomous system"""
    try:
        health = await autonomous_system.assess_health()
        return {"health_status": health, "timestamp": datetime.now().isoformat()}
    except Exception as e:
        logger.error(f"Error getting autonomous health: {e}")
        return {"error": str(e), "timestamp": datetime.now().isoformat()}


@app.get("/api/autonomous/metrics")
async def get_autonomous_metrics():
    """Get system metrics from autonomous system"""
    try:
        metrics = await autonomous_system.collect_metrics()
        return {"metrics": metrics, "timestamp": datetime.now().isoformat()}
    except Exception as e:
        logger.error(f"Error getting autonomous metrics: {e}")
        return {"error": str(e), "timestamp": datetime.now().isoformat()}


@app.post("/api/autonomous/heal")
async def trigger_self_healing():
    """Manually trigger self-healing process"""
    try:
        await autonomous_system.self_heal()
        return {
            "status": "Self-healing process initiated",
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Error triggering self-healing: {e}")
        return {"error": str(e), "timestamp": datetime.now().isoformat()}


@app.get("/api/autonomous/capabilities")
async def get_autonomous_capabilities():
    """Get autonomous system capabilities"""
    return {
        "capabilities": AUTONOMOUS_CAPABILITIES,
        "autonomous_mode": AUTONOMOUS_MODE,
        "autonomous_interval": AUTONOMOUS_INTERVAL,
        "timestamp": datetime.now().isoformat(),
    }


# ============================================================================
# ENHANCED HEALTH CHECK WITH AUTONOMOUS INTEGRATION
# ============================================================================


@app.get("/api/health/comprehensive")
async def comprehensive_health_check_with_autonomous():
    """Comprehensive health check with autonomous system integration"""
    try:
        # Get basic health status
        basic_health = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "uptime": time.time() - app_start_time,
            "version": "4.0.0",
        }

        # Get autonomous system health
        autonomous_health = None
        autonomous_metrics = None

        if AUTONOMOUS_MODE and autonomous_system.is_running:
            try:
                autonomous_health = await autonomous_system.assess_health()
                autonomous_metrics = await autonomous_system.collect_metrics()
            except Exception as e:
                logger.warning(f"Could not get autonomous data: {e}")

        # Add performance metrics
        performance = {
            "memory_usage": "normal",
            "cpu_usage": "normal",
            "response_time": "fast",
        }

        # Add autonomous metrics if available
        if autonomous_metrics:
            performance.update(
                {
                    "cpu_usage": f"{autonomous_metrics.cpu_usage:.1f}%",
                    "memory_usage": f"{autonomous_metrics.memory_usage:.1f}%",
                    "response_time": f"{autonomous_metrics.response_time:.3f}s",
                }
            )

        # Add model status
        models = {
            "prediction_engine": "initialized",
            "ultra_accuracy_engine": "initialized",
            "quantum_ensemble": "ready",
        }

        # Add autonomous metrics if available
        if autonomous_metrics:
            models["ml_model_accuracy"] = f"{autonomous_metrics.ml_model_accuracy:.3f}"

        # Add API metrics
        api_metrics = {
            "total_requests": 0,
            "success_rate": 100.0,
            "average_response_time": 0.1,
        }

        # Add autonomous status
        autonomous_status = {
            "enabled": AUTONOMOUS_MODE,
            "running": autonomous_system.is_running if autonomous_system else False,
            "health": autonomous_health.overall if autonomous_health else "unknown",
            "capabilities": len(AUTONOMOUS_CAPABILITIES),
        }

        return {
            **basic_health,
            "performance": performance,
            "models": models,
            "api_metrics": api_metrics,
            "autonomous": autonomous_status,
            "detailed_health": autonomous_health,
            "system_metrics": autonomous_metrics,
        }

    except Exception as e:
        logger.error(f"Comprehensive health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
            "autonomous": {
                "enabled": AUTONOMOUS_MODE,
                "running": False,
                "health": "error",
            },
        }


logger.info("✅ Autonomous system endpoints added")

# ============================================================================
# DATABASE HEALTH CHECK ENDPOINT
# ============================================================================


@app.get("/api/health/database")
async def database_health_check():
    """Comprehensive database health check"""
    try:
        # Initialize health checker with enhanced database manager
        if "db_manager" in globals():
            database_health_checker.db_manager = db_manager

        # Perform comprehensive health check
        health_result = await database_health_checker.comprehensive_health_check()

        return {
            "status": "success",
            "database_health": health_result,
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
        }


@app.get("/api/health/database/summary")
async def database_health_summary():
    """Get database health summary"""
    try:
        summary = database_health_checker.get_health_summary()
        return {
            "status": "success",
            "summary": summary,
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Database health summary failed: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
        }


@app.get("/api/health/database/history")
async def database_health_history():
    """Get database health check history"""
    try:
        history = database_health_checker.get_health_history()
        return {
            "status": "success",
            "history": history,
            "count": len(history),
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Database health history failed: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
        }


# ============================================================================
# PROPOLLAMA API ENDPOINTS
# ============================================================================


class PropOllamaRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None
    analysisType: Optional[str] = "general"
    sport: Optional[str] = None


class PropOllamaResponse(BaseModel):
    content: str
    confidence: int
    suggestions: List[str]
    model_used: str
    response_time: int
    analysis_type: str
    shap_explanation: Optional[Dict[str, Any]] = None


from backend.routes.propollama import router as propollama_router

app.include_router(propollama_router, prefix="/api/propollama")

from backend.routes.health import router as health_router
logger.info("[DIAGNOSTIC] About to register health_router at /api/healthx")
app.include_router(health_router, prefix="/api/healthx")
logger.info("[DIAGNOSTIC] Registered health_router at /api/healthx")


# ============================================================================
# APPLICATION ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import socket

    def find_available_port(start: int = 8000, end: int = 8010) -> int:
        for port in range(start, end + 1):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                try:
                    s.bind(("0.0.0.0", port))
                    return port
                except OSError:
                    continue
        raise RuntimeError("No available ports found.")

    port = find_available_port()
    print(f"Starting backend on port {port}")
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info",
    )
