"""Production API routes."""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Dict, Any, List, Optional
import logging

# Import extracted modules
from backend.data.players import MLB_PLAYERS, NBA_PLAYERS, WNBA_PLAYERS, MLS_PLAYERS
from backend.services.ml.lazy_loader import LazyMLLoader
from backend.services.ml.engines import MLPredictionEngine, CoreMLEngine
from backend.domains.betting.analyzer import BettingAnalyzer
from backend.domains.betting.risk_manager import RiskManager
from backend.domains.betting.ultimate_analyzer import UltimateBettingAnalyzer
from backend.services.prizepicks.data_service import PrizePicksDataService

logger = logging.getLogger(__name__)

# Initialize services
ml_loader = LazyMLLoader()
prizepicks_service = PrizePicksDataService()
betting_analyzer = BettingAnalyzer()
risk_manager = RiskManager()
ultimate_analyzer = UltimateBettingAnalyzer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan."""
    logger.info("Starting production application...")
    # Start ML loading in background
    ml_loader.start_loading()
    yield
    logger.info("Shutting down production application...")

# Create FastAPI app
app = FastAPI(
    title="A1Betting Production API",
    description="Production-ready betting analysis API",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoints
@app.get("/")
async def root():
    """Root endpoint."""
    return {"status": "ok", "message": "A1Betting Production API"}

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "ml_loaded": ml_loader.is_loaded()}

@app.get("/api/ml/status")
async def get_ml_status():
    """Get ML loading status."""
    return ml_loader.get_status()

# Player endpoints
@app.get("/api/players/all")
async def get_all_players():
    """Get all players across all sports."""
    return {
        "mlb": MLB_PLAYERS,
        "nba": NBA_PLAYERS,
        "wnba": WNBA_PLAYERS,
        "mls": MLS_PLAYERS
    }

@app.get("/api/players/{sport}")
async def get_players_by_sport(sport: str):
    """Get players by sport."""
    sport = sport.lower()
    if sport == "mlb":
        return MLB_PLAYERS
    elif sport == "nba":
        return NBA_PLAYERS
    elif sport == "wnba":
        return WNBA_PLAYERS
    elif sport == "mls":
        return MLS_PLAYERS
    else:
        raise HTTPException(status_code=404, detail=f"Sport {sport} not found")

# PrizePicks endpoints
@app.get("/api/prizepicks/props")
async def get_prizepicks_props():
    """Get PrizePicks props."""
    return prizepicks_service.get_props()

@app.get("/api/prizepicks/props/enhanced")
async def get_prizepicks_props_enhanced():
    """Get enhanced PrizePicks props with analysis."""
    props = prizepicks_service.get_props()
    # Add analysis
    for prop in props:
        prop["analysis"] = betting_analyzer.analyze(prop)
    return props

# Betting endpoints
@app.get("/api/betting/opportunities")
async def get_betting_opportunities():
    """Get current betting opportunities."""
    return betting_analyzer.get_opportunities()

@app.get("/api/betting/recommendations")
async def get_betting_recommendations():
    """Get betting recommendations."""
    return betting_analyzer.get_recommendations()

@app.post("/api/betting/analyze")
async def analyze_bet(bet_data: Dict[str, Any]):
    """Analyze a specific bet."""
    return ultimate_analyzer.analyze(bet_data)

# Prediction endpoints
@app.post("/api/predictions/generate")
async def generate_prediction(request: Dict[str, Any]):
    """Generate ML prediction."""
    if not ml_loader.is_loaded():
        raise HTTPException(status_code=503, detail="ML models still loading")
    
    engine = MLPredictionEngine()
    return engine.predict(request)

@app.post("/api/predictions/batch")
async def get_batch_predictions(requests: List[Dict[str, Any]]):
    """Get batch predictions."""
    if not ml_loader.is_loaded():
        raise HTTPException(status_code=503, detail="ML models still loading")
    
    engine = MLPredictionEngine()
    return [engine.predict(req) for req in requests]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
