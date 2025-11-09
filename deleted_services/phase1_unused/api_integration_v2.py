"""Streamlined API integration - main FastAPI app."""

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
