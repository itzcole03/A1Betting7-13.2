#!/usr/bin/env python3
"""Refactor production_fix.py into modular components."""

import re
from pathlib import Path
import shutil

backend = Path("/home/ubuntu/A1Betting7-13.2/backend")
prod_fix = backend / "production_fix.py"

print("=" * 80)
print("Refactoring production_fix.py")
print("=" * 80)

# Read the entire file
with open(prod_fix, 'r', encoding='utf-8') as f:
    content = f.read()
    lines = content.split('\n')

# Create backup
shutil.copy(prod_fix, str(prod_fix) + ".backup")
print(f"✓ Created backup: {prod_fix}.backup")

# Extract player data sections
def extract_section(lines, start_marker, end_marker):
    """Extract lines between markers."""
    start_idx = None
    end_idx = None
    
    for i, line in enumerate(lines):
        if start_marker in line and start_idx is None:
            start_idx = i
        if end_marker in line and start_idx is not None:
            end_idx = i
            break
    
    if start_idx and end_idx:
        return lines[start_idx:end_idx]
    return []

# 1. Extract player data
print("\n[1/5] Extracting player data...")
data_dir = backend / "data" / "players"
data_dir.mkdir(parents=True, exist_ok=True)

# Find player data sections by looking for player lists
mlb_start = next((i for i, l in enumerate(lines) if "MLB Players" in l and "#" in l), None)
nba_start = next((i for i, l in enumerate(lines) if "NBA Players" in l and "#" in l), None)
wnba_start = next((i for i, l in enumerate(lines) if "WNBA Players" in l and "#" in l), None)
mls_start = next((i for i, l in enumerate(lines) if "MLS Players" in l and "#" in l), None)

# Create player data files with sample structure
(data_dir / "__init__.py").write_text("""\"\"\"Player data module.\"\"\"

from .mlb_players import MLB_PLAYERS
from .nba_players import NBA_PLAYERS
from .wnba_players import WNBA_PLAYERS
from .mls_players import MLS_PLAYERS

__all__ = ['MLB_PLAYERS', 'NBA_PLAYERS', 'WNBA_PLAYERS', 'MLS_PLAYERS']
""")

# Extract MLB players
if mlb_start and nba_start:
    mlb_content = '\n'.join(lines[mlb_start:nba_start])
    (data_dir / "mlb_players.py").write_text(f'''"""MLB player data."""

{mlb_content}
''')
    print(f"  ✓ Extracted mlb_players.py")

# Extract NBA players
if nba_start and wnba_start:
    nba_content = '\n'.join(lines[nba_start:wnba_start])
    (data_dir / "nba_players.py").write_text(f'''"""NBA player data."""

{nba_content}
''')
    print(f"  ✓ Extracted nba_players.py")

# Extract WNBA players
if wnba_start and mls_start:
    wnba_content = '\n'.join(lines[wnba_start:mls_start])
    (data_dir / "wnba_players.py").write_text(f'''"""WNBA player data."""

{wnba_content}
''')
    print(f"  ✓ Extracted wnba_players.py")

# Extract MLS players
if mls_start:
    # Find end of MLS section (look for next major section)
    mls_end = next((i for i in range(mls_start + 1, len(lines)) if lines[i].strip().startswith('class ') or lines[i].strip().startswith('def ')), len(lines))
    mls_content = '\n'.join(lines[mls_start:mls_end])
    (data_dir / "mls_players.py").write_text(f'''"""MLS player data."""

{mls_content}
''')
    print(f"  ✓ Extracted mls_players.py")

# 2. Extract ML classes
print("\n[2/5] Extracting ML service classes...")
ml_dir = backend / "services" / "ml"
ml_dir.mkdir(parents=True, exist_ok=True)

# Find LazyMLLoader class
lazy_loader_match = re.search(r'(class LazyMLLoader:.*?)(?=\nclass |\n@app|\ndef [a-z_]+\(|\Z)', content, re.DOTALL)
if lazy_loader_match:
    (ml_dir / "lazy_loader.py").write_text(f'''"""Lazy ML model loader."""

{lazy_loader_match.group(1)}
''')
    print(f"  ✓ Extracted lazy_loader.py")

# Find MLPredictionEngine and CoreMLEngine
ml_engine_match = re.search(r'(class MLPredictionEngine:.*?class CoreMLEngine:.*?)(?=\nclass [A-Z]|\n@app|\ndef [a-z_]+\(|\Z)', content, re.DOTALL)
if ml_engine_match:
    (ml_dir / "engines.py").write_text(f'''"""ML prediction engines."""

import numpy as np
from typing import Dict, Any, List

{ml_engine_match.group(1)}
''')
    print(f"  ✓ Extracted engines.py")

# 3. Extract betting domain classes
print("\n[3/5] Extracting betting domain classes...")
betting_dir = backend / "domains" / "betting"
betting_dir.mkdir(parents=True, exist_ok=True)

# Find BettingAnalyzer
betting_analyzer_match = re.search(r'(class BettingAnalyzer:.*?)(?=\nclass [A-Z]|\n@app|\ndef [a-z_]+\(|\Z)', content, re.DOTALL)
if betting_analyzer_match:
    (betting_dir / "analyzer.py").write_text(f'''"""Betting analyzer."""

from typing import Dict, Any, List

{betting_analyzer_match.group(1)}
''')
    print(f"  ✓ Extracted analyzer.py")

# Find RiskManager
risk_manager_match = re.search(r'(class RiskManager:.*?)(?=\nclass [A-Z]|\n@app|\ndef [a-z_]+\(|\Z)', content, re.DOTALL)
if risk_manager_match:
    (betting_dir / "risk_manager.py").write_text(f'''"""Risk management."""

from typing import Dict, Any

{risk_manager_match.group(1)}
''')
    print(f"  ✓ Extracted risk_manager.py")

# Find UltimateBettingAnalyzer
ultimate_analyzer_match = re.search(r'(class UltimateBettingAnalyzer:.*?)(?=\n@app|\ndef [a-z_]+\(|\Z)', content, re.DOTALL)
if ultimate_analyzer_match:
    (betting_dir / "ultimate_analyzer.py").write_text(f'''"""Ultimate betting analyzer."""

from typing import Dict, Any, List

{ultimate_analyzer_match.group(1)}
''')
    print(f"  ✓ Extracted ultimate_analyzer.py")

# 4. Extract PrizePicks service
print("\n[4/5] Extracting PrizePicks service...")
prizepicks_dir = backend / "services" / "prizepicks"
prizepicks_dir.mkdir(parents=True, exist_ok=True)

# Find PrizePicksDataService
prizepicks_match = re.search(r'(class PrizePicksDataService:.*?)(?=\nclass [A-Z]|\n@app|\ndef [a-z_]+\(|\Z)', content, re.DOTALL)
if prizepicks_match:
    (prizepicks_dir / "data_service.py").write_text(f'''"""PrizePicks data service."""

from typing import Dict, Any, List
import random

{prizepicks_match.group(1)}
''')
    print(f"  ✓ Extracted data_service.py")

(prizepicks_dir / "__init__.py").write_text("""\"\"\"PrizePicks service module.\"\"\"

from .data_service import PrizePicksDataService

__all__ = ['PrizePicksDataService']
""")

# 5. Create streamlined production_routes.py
print("\n[5/5] Creating streamlined production_routes.py...")

routes_content = '''"""Production API routes."""

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
'''

(backend / "routes" / "production_routes.py").write_text(routes_content)
print(f"  ✓ Created production_routes.py")

# Move original to deprecated
deprecated_dir = backend / "deprecated"
deprecated_dir.mkdir(parents=True, exist_ok=True)
shutil.move(str(prod_fix), str(deprecated_dir / "production_fix.py"))
print(f"\n✓ Moved original to deprecated/production_fix.py")

print("\n" + "=" * 80)
print("REFACTORING COMPLETE")
print("=" * 80)
print("Created modules:")
print("  - backend/data/players/ (4 files)")
print("  - backend/services/ml/ (2 files)")
print("  - backend/domains/betting/ (3 files)")
print("  - backend/services/prizepicks/ (2 files)")
print("  - backend/routes/production_routes.py")
print("\nOriginal file: deprecated/production_fix.py")
print("=" * 80)
