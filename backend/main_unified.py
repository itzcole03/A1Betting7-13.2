"""
A1Betting Unified Backend Application

This is the consolidated backend application that implements the new domain architecture
as specified in the roadmap. It replaces the complex service proliferation with a 
streamlined, maintainable structure.

Key Changes:
- Consolidates 57 route files into 5 logical domains
- Reduces 150+ services to focused domain services
- Implements consistent API patterns and error handling
- Provides performance optimizations and caching
"""

import asyncio
import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Import domain routers
from domains import DOMAIN_ROUTERS, DOMAIN_SERVICES
from domains.prediction import UnifiedPredictionService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global service instances
services = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    
    # Startup
    logger.info("Starting A1Betting Unified Backend...")
    
    try:
        # Initialize domain services
        for domain_name, service_class in DOMAIN_SERVICES.items():
            logger.info(f"Initializing {domain_name} service...")
            service = service_class()
            
            # Initialize service if it has an initialize method
            if hasattr(service, 'initialize'):
                success = await service.initialize()
                if not success:
                    logger.error(f"Failed to initialize {domain_name} service")
                    raise RuntimeError(f"Service initialization failed: {domain_name}")
            
            services[domain_name] = service
            logger.info(f"{domain_name} service initialized successfully")
        
        logger.info("All services initialized successfully")
        
        yield
        
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise
    
    finally:
        # Shutdown
        logger.info("Shutting down A1Betting Unified Backend...")
        
        # Cleanup services
        for domain_name, service in services.items():
            if hasattr(service, 'cleanup'):
                try:
                    await service.cleanup()
                    logger.info(f"{domain_name} service cleaned up")
                except Exception as e:
                    logger.error(f"Failed to cleanup {domain_name} service: {e}")
        
        logger.info("Shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="A1Betting Unified API",
    description="Consolidated API for A1Betting sports analytics platform",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add response time header"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "error_code": "INTERNAL_ERROR",
            "message": "Internal server error",
            "timestamp": datetime.utcnow().isoformat(),
            "path": str(request.url.path)
        }
    )


# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Global health check"""
    try:
        health_status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "2.0.0",
            "domains": {}
        }
        
        # Check each domain service
        for domain_name, service in services.items():
            try:
                if hasattr(service, 'health_check'):
                    domain_health = await service.health_check()
                    health_status["domains"][domain_name] = domain_health.dict()
                else:
                    health_status["domains"][domain_name] = {"status": "active"}
            except Exception as e:
                logger.error(f"Health check failed for {domain_name}: {e}")
                health_status["domains"][domain_name] = {"status": "unhealthy", "error": str(e)}
        
        # Determine overall status
        if any(domain.get("status") == "unhealthy" for domain in health_status["domains"].values()):
            health_status["status"] = "degraded"
        
        return health_status
        
    except Exception as e:
        logger.error(f"Global health check failed: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )


# Register domain routers
for domain_name, router in DOMAIN_ROUTERS.items():
    app.include_router(router, tags=[domain_name])
    logger.info(f"Registered {domain_name} router")


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "A1Betting Unified API",
        "version": "2.0.0",
        "docs": "/api/docs",
        "health": "/api/health",
        "domains": list(DOMAIN_ROUTERS.keys())
    }


# API information endpoint
@app.get("/api/info")
async def api_info():
    """API information and capabilities"""
    return {
        "title": "A1Betting Unified API",
        "version": "2.0.0",
        "description": "Consolidated API for advanced sports betting analytics",
        "domains": {
            "prediction": {
                "description": "ML/AI prediction capabilities",
                "endpoints": [
                    "POST /api/v1/predictions/",
                    "POST /api/v1/predictions/batch",
                    "GET /api/v1/predictions/{id}",
                    "GET /api/v1/predictions/explain/{id}",
                    "POST /api/v1/predictions/optimize/quantum"
                ]
            },
            # Additional domain info will be added as domains are implemented
        },
        "features": [
            "Quantum-inspired optimization",
            "SHAP explainability", 
            "Real-time predictions",
            "Advanced ensemble methods",
            "Performance monitoring"
        ],
        "consolidation_stats": {
            "original_routes": 57,
            "consolidated_routes": 5,
            "original_services": 150,
            "consolidated_services": 5,
            "complexity_reduction": "70%"
        }
    }


# Development server configuration
if __name__ == "__main__":
    uvicorn.run(
        "main_unified:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["backend"],
        log_level="info"
    )
