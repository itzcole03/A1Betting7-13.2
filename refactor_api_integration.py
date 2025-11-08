#!/usr/bin/env python3
"""Refactor api_integration.py into modular components."""

import re
from pathlib import Path
import shutil

backend = Path("/home/ubuntu/A1Betting7-13.2/backend")
api_file = backend / "services" / "external" / "api_integration.py"

print("=" * 80)
print("Refactoring api_integration.py")
print("=" * 80)

# Read the file
with open(api_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Create backup
shutil.copy(api_file, str(api_file) + ".backup")
print(f"✓ Created backup: {api_file}.backup")

# 1. Extract API models/schemas
print("\n[1/6] Extracting API models...")
models_dir = backend / "models"
models_dir.mkdir(parents=True, exist_ok=True)

# Extract all Pydantic models
model_classes = re.findall(r'class (\w+)\(BaseModel\):.*?(?=\nclass |\n@app|\ndef [a-z_]|\Z)', content, re.DOTALL)
print(f"  Found {len(model_classes)} model classes")

# Group models by category
auth_models = []
betting_models = []
prizepicks_models = []
general_models = []

for match in re.finditer(r'(class \w+\(BaseModel\):.*?)(?=\nclass |\n@app|\ndef [a-z_]|\Z)', content, re.DOTALL):
    model_text = match.group(1)
    model_name = re.search(r'class (\w+)\(', model_text).group(1)
    
    if any(x in model_name.lower() for x in ['login', 'register', 'auth', 'token', 'password']):
        auth_models.append(model_text)
    elif any(x in model_name.lower() for x in ['bet', 'bankroll', 'transaction', 'portfolio']):
        betting_models.append(model_text)
    elif any(x in model_name.lower() for x in ['prizepicks', 'prop', 'player', 'lineup']):
        prizepicks_models.append(model_text)
    else:
        general_models.append(model_text)

# Write auth models
if auth_models:
    (models_dir / "auth_models.py").write_text(f'''"""Authentication models."""

from pydantic import BaseModel, EmailStr
from typing import Optional

{chr(10).join(auth_models)}
''')
    print(f"  ✓ Extracted auth_models.py ({len(auth_models)} models)")

# Write betting models
if betting_models:
    (models_dir / "betting_models.py").write_text(f'''"""Betting models."""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

{chr(10).join(betting_models)}
''')
    print(f"  ✓ Extracted betting_models.py ({len(betting_models)} models)")

# Write prizepicks models
if prizepicks_models:
    (models_dir / "prizepicks_models.py").write_text(f'''"""PrizePicks models."""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any

{chr(10).join(prizepicks_models)}
''')
    print(f"  ✓ Extracted prizepicks_models.py ({len(prizepicks_models)} models)")

# Write general models
if general_models:
    (models_dir / "api_models.py").write_text(f'''"""General API models."""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from enum import Enum

{chr(10).join(general_models)}
''')
    print(f"  ✓ Extracted api_models.py ({len(general_models)} models)")

# 2. Extract authentication routes
print("\n[2/6] Extracting authentication routes...")
auth_routes_dir = backend / "routes"
auth_routes_dir.mkdir(parents=True, exist_ok=True)

auth_routes = re.search(r'# Authentication Routes.*?(?=# [A-Z]|\Z)', content, re.DOTALL)
if auth_routes:
    (auth_routes_dir / "auth_routes.py").write_text(f'''"""Authentication routes."""

from fastapi import APIRouter, HTTPException, Depends
from backend.models.auth_models import *

router = APIRouter(prefix="/api/auth", tags=["authentication"])

{auth_routes.group(0)}
''')
    print(f"  ✓ Extracted auth_routes.py")

# 3. Extract PrizePicks routes
print("\n[3/6] Extracting PrizePicks routes...")
prizepicks_routes = re.search(r'# PrizePicks Routes.*?(?=# [A-Z]|\Z)', content, re.DOTALL)
if prizepicks_routes:
    (auth_routes_dir / "prizepicks_routes.py").write_text(f'''"""PrizePicks routes."""

from fastapi import APIRouter, HTTPException
from backend.models.prizepicks_models import *
from typing import List, Dict, Any

router = APIRouter(prefix="/api/prizepicks", tags=["prizepicks"])

{prizepicks_routes.group(0)}
''')
    print(f"  ✓ Extracted prizepicks_routes.py")

# 4. Extract WebSocket manager
print("\n[4/6] Extracting WebSocket manager...")
websocket_dir = backend / "services" / "websocket"
websocket_dir.mkdir(parents=True, exist_ok=True)

ws_manager = re.search(r'class ConnectionManager:.*?(?=\nclass [A-Z]|\n# [A-Z]|\Z)', content, re.DOTALL)
if ws_manager:
    (websocket_dir / "connection_manager.py").write_text(f'''"""WebSocket connection manager."""

from fastapi import WebSocket
from typing import List
import json

{ws_manager.group(0)}
''')
    print(f"  ✓ Extracted connection_manager.py")

(websocket_dir / "__init__.py").write_text("""\"\"\"WebSocket service module.\"\"\"

from .connection_manager import ConnectionManager

__all__ = ['ConnectionManager']
""")

# 5. Extract odds normalization service
print("\n[5/6] Extracting odds services...")
odds_service_dir = backend / "services" / "odds"
odds_service_dir.mkdir(parents=True, exist_ok=True)

odds_classes = re.findall(r'(class (?:OddsFormat|SportsBook|AggregatedOdds|OddsNormalizer|OddsAggregationService).*?)(?=\nclass [A-Z]|\n@app|\Z)', content, re.DOTALL)
if odds_classes:
    (odds_service_dir / "odds_service.py").write_text(f'''"""Odds normalization and aggregation service."""

from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel

{chr(10).join(odds_classes)}
''')
    print(f"  ✓ Extracted odds_service.py")

(odds_service_dir / "__init__.py").write_text("""\"\"\"Odds service module.\"\"\"

from .odds_service import OddsNormalizer, OddsAggregationService

__all__ = ['OddsNormalizer', 'OddsAggregationService']
""")

# 6. Create streamlined API integration file
print("\n[6/6] Creating streamlined api_integration.py...")

streamlined_content = '''"""Streamlined API integration - main FastAPI app."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Import routes
from backend.routes.auth_routes import router as auth_router
from backend.routes.prizepicks_routes import router as prizepicks_router

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="A1Betting API",
    description="Betting analysis and prediction API",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(prizepicks_router)

@app.get("/")
async def root():
    """Root endpoint."""
    return {"status": "ok", "message": "A1Betting API v2.0"}

@app.get("/health")
async def health():
    """Health check."""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
'''

(api_file.parent / "api_integration_v2.py").write_text(streamlined_content)
print(f"  ✓ Created api_integration_v2.py")

# Move original to deprecated
deprecated_dir = backend / "deprecated"
deprecated_dir.mkdir(parents=True, exist_ok=True)
shutil.move(str(api_file), str(deprecated_dir / "api_integration.py"))
print(f"\n✓ Moved original to deprecated/api_integration.py")

print("\n" + "=" * 80)
print("REFACTORING COMPLETE")
print("=" * 80)
print("Created modules:")
print("  - backend/models/ (4 model files)")
print("  - backend/routes/ (2 route files)")
print("  - backend/services/websocket/ (connection manager)")
print("  - backend/services/odds/ (odds service)")
print("  - backend/services/external/api_integration_v2.py")
print("\nOriginal file: deprecated/api_integration.py")
print("=" * 80)
