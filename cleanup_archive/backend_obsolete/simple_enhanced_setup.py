"""
Simple Enhanced API Setup - Direct Route Registration
Bypasses all module caching and complex router management issues
"""

import json
import logging
from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


def create_simple_enhanced_routes() -> APIRouter:
    """Create enhanced API router with comprehensive routes"""
    router = APIRouter(tags=["enhanced_api"])

    @router.get("/simple-test")
    async def simple_test():
        """Simple test endpoint to verify enhanced API accessibility"""
        return {
            "status": "success",
            "message": "Enhanced API is accessible!",
            "service": "simple_enhanced_api",
            "timestamp": datetime.now().isoformat(),
            "routes_available": [
                "GET /v1/simple-test",
                "GET /v1/system/health",
                "GET /v1/system/debug",
                "POST /v1/auth/register",
                "POST /v1/auth/login",
                "POST /v1/predictions/enhanced",
                "GET /v1/bankroll/status",
                "GET /v1/realtime/betting-opportunities",
            ],
        }

    @router.get("/system/health")
    async def enhanced_health():
        """Enhanced system health check"""
        return {
            "status": "healthy",
            "enhanced_api": "operational",
            "routes_active": 8,
            "message": "Enhanced API system is running",
            "services": {
                "auth": "available",
                "predictions": "available",
                "bankroll": "available",
                "realtime": "available",
            },
            "timestamp": datetime.now().isoformat(),
        }

    @router.get("/system/debug")
    async def system_debug():
        """Debug endpoint for troubleshooting"""
        return {
            "status": "debug_info",
            "message": "Enhanced API debug information",
            "setup_method": "simple_direct_registration",
            "bypass_caching": True,
            "server_time": datetime.now().isoformat(),
            "implementation": "simplified_enhanced_api_v1",
        }

    @router.post("/auth/register")
    async def auth_register(request: Request):
        """Simplified user registration"""
        try:
            # Get request data
            if request.headers.get("content-type") == "application/json":
                data = await request.json()
            else:
                data = {}

            return {
                "status": "success",
                "message": "User registration endpoint available",
                "user_id": "demo_user_123",
                "token": "demo_token_xyz",
                "note": "This is a simplified demo implementation",
                "received_data": data,
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    @router.post("/auth/login")
    async def auth_login(request: Request):
        """Simplified user login"""
        try:
            if request.headers.get("content-type") == "application/json":
                data = await request.json()
            else:
                data = {}

            return {
                "status": "success",
                "message": "User login endpoint available",
                "token": "demo_login_token",
                "user_id": "demo_user_123",
                "note": "This is a simplified demo implementation",
                "received_data": data,
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    @router.post("/predictions/enhanced")
    async def enhanced_predictions(request: Request):
        """Simplified enhanced predictions"""
        try:
            if request.headers.get("content-type") == "application/json":
                data = await request.json()
            else:
                data = {}

            return {
                "status": "success",
                "message": "Enhanced predictions endpoint available",
                "predictions": {
                    "nfl": {"confidence": 0.75, "recommendation": "over"},
                    "nba": {"confidence": 0.68, "recommendation": "under"},
                    "mlb": {"confidence": 0.82, "recommendation": "over"},
                },
                "model_performance": {
                    "accuracy": 0.73,
                    "last_updated": datetime.now().isoformat(),
                },
                "note": "This is a simplified demo implementation",
                "received_data": data,
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    @router.get("/bankroll/status")
    async def bankroll_status():
        """Simplified bankroll management"""
        return {
            "status": "success",
            "message": "Bankroll management endpoint available",
            "bankroll": {
                "total": 1000.00,
                "available": 750.00,
                "allocated": 250.00,
                "roi": 0.15,
            },
            "risk_metrics": {
                "kelly_fraction": 0.05,
                "max_bet_size": 50.00,
                "diversification_score": 0.8,
            },
            "note": "This is a simplified demo implementation",
        }

    @router.get("/realtime/betting-opportunities")
    async def betting_opportunities():
        """Simplified real-time betting opportunities"""
        return {
            "status": "success",
            "message": "Real-time betting opportunities endpoint available",
            "opportunities": [
                {
                    "sport": "NFL",
                    "game": "Team A vs Team B",
                    "type": "spread",
                    "value": 2.5,
                    "confidence": 0.78,
                    "expected_value": 0.12,
                },
                {
                    "sport": "NBA",
                    "game": "Team C vs Team D",
                    "type": "total",
                    "value": 215.5,
                    "confidence": 0.65,
                    "expected_value": 0.08,
                },
            ],
            "last_updated": datetime.now().isoformat(),
            "note": "This is a simplified demo implementation",
        }

    return router


def setup_simple_enhanced_api(app):
    """
    Set up enhanced API with simple direct registration
    This completely bypasses module caching issues
    """
    try:
        logger.info("🚀 Setting up simple enhanced API with direct registration...")

        # Create router directly here to avoid import issues
        enhanced_router = create_simple_enhanced_routes()

        logger.info(
            f"Created enhanced router with {len(enhanced_router.routes)} routes"
        )

        # Method 1: Try include_router with prefix
        try:
            app.include_router(enhanced_router, prefix="/v1")

            # Verify it worked
            v1_routes = [
                r
                for r in app.routes
                if hasattr(r, "path") and "/v1" in str(getattr(r, "path", ""))
            ]

            if len(v1_routes) >= 8:  # We expect at least 8 routes
                logger.info(
                    f"✅ Enhanced API setup successful: {len(v1_routes)} V1 routes active"
                )
                return True
            else:
                raise Exception("include_router didn't add expected routes")

        except Exception as include_error:
            logger.warning(f"include_router failed: {include_error}")
            logger.info("🔧 Attempting direct route registration...")

            # Method 2: Direct registration
            routes_added = 0
            for route in enhanced_router.routes:
                try:
                    # Modify the route path to include /v1 prefix
                    if hasattr(route, "path"):
                        route.path = f"/v1{route.path}"
                        app.router.routes.append(route)
                        routes_added += 1
                        logger.info(f"  ✅ Added route: {route.path}")
                except Exception as route_error:
                    logger.error(f"Failed to add route: {route_error}")

            if routes_added > 0:
                logger.info(
                    f"✅ Direct registration successful: {routes_added} routes added"
                )
                return True
            else:
                logger.error("❌ Both methods failed")
                return False

    except Exception as e:
        logger.error(f"❌ Enhanced API setup failed: {e}", exc_info=True)
        return False
