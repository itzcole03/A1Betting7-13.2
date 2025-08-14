"""
Enhanced API Routes for Peak Functionality
Integrates all new services for real-time data, ML predictions, user management, and betting features.

All endpoints follow the standardized API contract: {success, data, error, meta}
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, WebSocket, status

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from backend.services.bankroll_service import bankroll_service
from backend.services.enhanced_ml_service import enhanced_ml_service
from backend.services.real_data_integration import real_data_service
from backend.services.realtime_websocket_service import realtime_websocket_service
from backend.services.user_auth_service import (
    UserCreateRequest,
    UserLoginRequest,
    user_auth_service,
)
from backend.utils.enhanced_logging import get_logger
from backend.utils.standard_responses import (
    StandardAPIResponse,
    success_response,
    BusinessLogicException,
    AuthenticationException,
    ValidationException,
    ResponseBuilder
)

logger = get_logger("enhanced_api")

# Initialize router - No prefix here, will be added when included
router = APIRouter(tags=["enhanced_api"])
security = HTTPBearer()


# Simple test route with no dependencies
@router.get("/simple-test", response_model=StandardAPIResponse[Dict[str, Any]])
async def simple_test():
    """Simple test endpoint with no dependencies - returns standardized response"""
    builder = ResponseBuilder()
    data = {
        "message": "Enhanced API router is working",
        "status": "success",
        "router_prefix": "/v1",
    }
    return ResponseBuilder.success(builder.success(data))


# Request/Response Models
class PredictionRequest(BaseModel):
    sport: str
    features: Dict[str, Any]
    include_explanation: bool = True


class PredictionResponse(BaseModel):
    prediction: float
    confidence: float
    ensemble_size: int
    sport: str
    explanation: Optional[Dict[str, Any]] = None
    timestamp: str


class BettingOpportunityResponse(BaseModel):
    opportunities: List[Dict[str, Any]]
    total_count: int
    filters_applied: Dict[str, Any]
    last_updated: str


class PortfolioRequest(BaseModel):
    max_allocation: Optional[float] = None
    risk_tolerance: Optional[str] = "medium"
    sports_filter: Optional[List[str]] = None


# Dependency for user authentication
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Get current authenticated user"""
    token = credentials.credentials
    user_data = await user_auth_service.verify_session(token)

    if not user_data:
        raise AuthenticationException("Invalid or expired token")

    return ResponseBuilder.success(user_data)


# Authentication Endpoints
@router.post("/auth/register", response_model=StandardAPIResponse[Dict[str, Any]])
async def register_user(user_data: UserCreateRequest):
    """Register a new user - returns standardized response"""
    builder = ResponseBuilder()
    
    try:
        user = await user_auth_service.register_user(user_data)
        data = {
            "message": "User registered successfully",
            "user": user,
            "status": "success",
        }
        return ResponseBuilder.success(builder.success(data))
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise BusinessLogicException("Registration failed", str(e))


@router.post("/auth/login", response_model=StandardAPIResponse[Dict[str, Any]])
async def login_user(
    login_data: UserLoginRequest,
    x_forwarded_for: Optional[str] = Header(None),
    user_agent: Optional[str] = Header(None),
):
    """Login user and create session - returns standardized response"""
    builder = ResponseBuilder()
    
    try:
        session = await user_auth_service.login_user(
            login_data, ip_address=x_forwarded_for or "", user_agent=user_agent or ""
        )

        data = {"message": "Login successful", "session": session, "status": "success"}
        return ResponseBuilder.success(builder.success(data))
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise BusinessLogicException("Login failed", str(e))


@router.post("/auth/logout", response_model=StandardAPIResponse[Dict[str, Any]])
async def logout_user(current_user: Dict = Depends(get_current_user)):
    """Logout user and invalidate session - returns standardized response"""
    builder = ResponseBuilder()
    
    try:
        await user_auth_service.logout_user(current_user["session_id"])
        data = {"message": "Logout successful", "status": "success"}
        return ResponseBuilder.success(builder.success(data))
    except Exception as e:
        logger.error(f"Logout error: {e}")
        # Even on error, logout is considered successful from user perspective
        data = {"message": "Logout completed", "status": "success"}
        return ResponseBuilder.success(builder.success(data))


@router.post("/auth/refresh", response_model=StandardAPIResponse[Dict[str, Any]])
async def refresh_token(refresh_token: str):
    """Refresh access token - returns standardized response"""
    builder = ResponseBuilder()
    
    try:
        new_session = await user_auth_service.refresh_token(refresh_token)
        data = {
            "message": "Token refreshed successfully",
            "session": new_session,
            "status": "success",
        }
        return ResponseBuilder.success(builder.success(data))
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise BusinessLogicException("Token refresh failed", str(e))


# Enhanced ML Prediction Endpoints
@router.post("/predictions/enhanced", response_model=PredictionResponse)
async def get_enhanced_prediction(
    request: PredictionRequest, current_user: Dict = Depends(get_current_user)
):
    """Get enhanced ML prediction with ensemble models"""
    try:
        if not enhanced_ml_service.is_initialized:
            await enhanced_ml_service.initialize()

        prediction = await enhanced_ml_service.predict_enhanced(
            request.sport, request.features
        )

        explanation = None
        if request.include_explanation and prediction.get("individual_models"):
            explanation = {
                "model_breakdown": prediction["individual_models"],
                "ensemble_weights": prediction.get("ensemble_weights", {}),
                "feature_importance": request.features,
            }

        return ResponseBuilder.success(PredictionResponse(
            prediction=prediction["prediction"],
            confidence=prediction["confidence"],
            ensemble_size=prediction["ensemble_size"],
            sport=request.sport,
            explanation=explanation,
            timestamp=prediction["prediction_timestamp"],
        ))

    except Exception as e:
        logger.error(f"Enhanced prediction error: {e}")
        raise BusinessLogicException("Prediction failed")


@router.get("/predictions/model-performance", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_model_performance(current_user: Dict = Depends(get_current_user)):
    """Get comprehensive model performance summary"""
    builder = ResponseBuilder()
    
    try:
        if not enhanced_ml_service.is_initialized:
            await enhanced_ml_service.initialize()

        performance = await enhanced_ml_service.get_model_performance_summary()
        data = {
            "performance": performance,
            "status": "success",
            "timestamp": datetime.now().isoformat(),
        }
        return ResponseBuilder.success(builder.success(data))

    except Exception as e:
        logger.error(f"Model performance error: {e}")
        raise BusinessLogicException("Failed to get model performance")


# Real-Time Data Endpoints
@router.get(
    "/realtime/betting-opportunities", response_model=BettingOpportunityResponse
)
async def get_betting_opportunities(
    sport: Optional[str] = Query(None),
    min_confidence: Optional[float] = Query(0.7),
    max_risk: Optional[str] = Query("medium"),
    current_user: Dict = Depends(get_current_user),
):
    """Get current betting opportunities with real-time data"""
    try:
        # Get user preferences
        user_id = current_user["user_id"]

        # Generate opportunities with enhanced ML predictions
        recommendations = await bankroll_service.generate_bet_recommendations(
            user_id, sport
        )

        # Filter by confidence and risk
        filtered_opportunities = [
            {
                "bet_id": rec.bet_id,
                "sport": rec.sport,
                "game": rec.game,
                "bet_type": rec.bet_type,
                "description": rec.description,
                "odds": rec.odds,
                "probability": rec.probability,
                "expected_value": rec.expected_value,
                "recommended_stake": rec.recommended_stake,
                "confidence": rec.confidence,
                "risk_level": rec.risk_level,
                "reasoning": rec.reasoning,
            }
            for rec in recommendations
            if rec.confidence >= min_confidence and rec.risk_level <= max_risk
        ]

        return ResponseBuilder.success(BettingOpportunityResponse(
            opportunities=filtered_opportunities,
            total_count=len(filtered_opportunities)),
            filters_applied={
                "sport": sport,
                "min_confidence": min_confidence,
                "max_risk": max_risk,
            },
            last_updated=datetime.now().isoformat(),
        )

    except Exception as e:
        logger.error(f"Betting opportunities error: {e}")
        raise BusinessLogicException("Failed to get betting opportunities")


# Bankroll Management Endpoints
@router.get("/bankroll/status", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_bankroll_status(current_user: Dict = Depends(get_current_user)):
    """Get current bankroll status and statistics"""
    builder = ResponseBuilder()
    
    try:
        user_id = current_user["user_id"]
        status = await bankroll_service.get_bankroll_status(user_id)

        data = {
            "bankroll_status": status.dict(),
            "status": "success",
            "timestamp": datetime.now().isoformat(),
        }
        return ResponseBuilder.success(builder.success(data))

    except Exception as e:
        logger.error(f"Bankroll status error: {e}")
        raise BusinessLogicException("Failed to get bankroll status")


@router.get("/bankroll/risk-metrics", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_risk_metrics(current_user: Dict = Depends(get_current_user)):
    """Get comprehensive risk metrics"""
    builder = ResponseBuilder()
    
    try:
        user_id = current_user["user_id"]
        risk_metrics = await bankroll_service.calculate_risk_metrics(user_id)

        data = {
            "risk_metrics": risk_metrics.dict(),
            "status": "success",
            "timestamp": datetime.now().isoformat(),
        }
        return ResponseBuilder.success(builder.success(data))

    except Exception as e:
        logger.error(f"Risk metrics error: {e}")
        raise BusinessLogicException("Failed to get risk metrics")


@router.post("/bankroll/optimize-portfolio", response_model=StandardAPIResponse[Dict[str, Any]])
async def optimize_portfolio(
    request: PortfolioRequest, current_user: Dict = Depends(get_current_user)
):
    """Optimize betting portfolio"""
    builder = ResponseBuilder()
    
    try:
        user_id = current_user["user_id"]

        # Get recommendations based on filters
        sport_filter = request.sports_filter[0] if request.sports_filter else None
        recommendations = await bankroll_service.generate_bet_recommendations(
            user_id, sport_filter or ""  # Provide empty string as fallback
        )

        # Optimize portfolio
        max_allocation = request.max_allocation or 1000.0  # Provide default
        optimization = await bankroll_service.optimize_portfolio(
            user_id, recommendations, max_allocation
        )

        data = {
            "portfolio_optimization": optimization.dict(),
            "status": "success",
            "timestamp": datetime.now().isoformat(),
        }
        return ResponseBuilder.success(builder.success(data))

    except Exception as e:
        logger.error(f"Portfolio optimization error: {e}")
        raise BusinessLogicException("Portfolio optimization failed")


@router.post("/bankroll/calculate-kelly", response_model=StandardAPIResponse[Dict[str, Any]])
async def calculate_kelly_criterion(
    probability: float, odds: float, current_user: Dict = Depends(get_current_user)
):
    """Calculate Kelly Criterion bet sizing"""
    builder = ResponseBuilder()
    
    try:
        # Get user's current bankroll
        user_id = current_user["user_id"]
        bankroll_status = await bankroll_service.get_bankroll_status(user_id)

        kelly_result = await bankroll_service.calculate_kelly_criterion(
            probability, odds, bankroll_status.current_balance
        )

        data = {
            "kelly_calculation": kelly_result,
            "status": "success",
            "timestamp": datetime.now().isoformat(),
        }
        return ResponseBuilder.success(builder.success(data))

    except Exception as e:
        logger.error(f"Kelly calculation error: {e}")
        raise BusinessLogicException("Kelly calculation failed")


# User Profile and Preferences
@router.get("/user/profile", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_user_profile(current_user: Dict = Depends(get_current_user)):
    """Get user profile and preferences"""
    builder = ResponseBuilder()
    
    try:
        user_id = current_user["user_id"]

        # Get user analytics
        analytics = await user_auth_service.get_user_analytics(user_id)

        data = {
            "profile": {
                "user_id": user_id,
                "email": current_user["email"],
                "first_name": current_user["first_name"],
                "last_name": current_user["last_name"],
                "preferences": current_user["preferences"],
            },
            "analytics": analytics,
            "status": "success",
        }
        return ResponseBuilder.success(builder.success(data))

    except Exception as e:
        logger.error(f"User profile error: {e}")
        raise BusinessLogicException("Failed to get user profile")


@router.put("/user/preferences", response_model=StandardAPIResponse[Dict[str, Any]])
async def update_user_preferences(
    preferences: Dict[str, Any], current_user: Dict = Depends(get_current_user)
):
    """Update user preferences"""
    builder = ResponseBuilder()
    
    try:
        user_id = current_user["user_id"]
        success = await user_auth_service.update_user_preferences(user_id, preferences)

        if success:
            data = {"message": "Preferences updated successfully", "status": "success"}
            return ResponseBuilder.success(builder.success(data))
        else:
            raise BusinessLogicException("Failed to update preferences")

    except BusinessLogicException:
        raise
    except Exception as e:
        logger.error(f"Update preferences error: {e}")
        raise BusinessLogicException("Failed to update preferences")


# Real-Time Data Integration
@router.get("/sports/{sport}/enhanced-data", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_enhanced_sport_data(
    sport: str, current_user: Dict = Depends(get_current_user)
):
    """Get enhanced real-time data for a specific sport"""
    builder = ResponseBuilder()
    
    try:
        await real_data_service.initialize()

        if sport.upper() == "NFL":
            enhanced_data = await real_data_service.enhance_nfl_service()
        else:
            # For other sports, return ResponseBuilder.success(basic) enhanced structure
            enhanced_data = [
                {
                    "id": f"{sport.lower()}_001",
                    "sport": sport.upper(),
                    "enhanced_timestamp": datetime.now().isoformat(),
                    "confidence_score": 0.75,
                    "status": "upcoming",
                }
            ]

        data = {
            "sport": sport.upper(),
            "enhanced_data": enhanced_data,
            "count": len(enhanced_data),
            "status": "success",
            "timestamp": datetime.now().isoformat(),
        }
        return ResponseBuilder.success(builder.success(data))

    except Exception as e:
        logger.error(f"Enhanced sport data error: {e}")
        raise BusinessLogicException("Failed to get enhanced sport data")


# System Health and Status
@router.get("/system/health", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_system_health():
    """Get comprehensive system health status"""
    builder = ResponseBuilder()
    
    try:
        health_status = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "enhanced_ml_service": (
                    "initialized"
                    if enhanced_ml_service.is_initialized
                    else "initializing"
                ),
                "realtime_websocket_service": (
                    "initialized"
                    if realtime_websocket_service.is_initialized
                    else "initializing"
                ),
                "user_auth_service": "active",
                "bankroll_service": "active",
                "real_data_service": "active",
            },
            "version": "1.0.0",
        }

        # Check if any critical services are down
        critical_services = ["enhanced_ml_service", "user_auth_service"]
        if any(
            health_status["services"][service] != "active"
            and health_status["services"][service] != "initialized"
            for service in critical_services
        ):
            health_status["status"] = "degraded"

        return ResponseBuilder.success(builder.success(health_status))

    except Exception as e:
        logger.error(f"Health check error: {e}")
        error_data = {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
        }
        return ResponseBuilder.success(builder.success(error_data))  # Return as success since health endpoint should always respond


@router.get("/system/debug", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_system_debug():
    """Debug endpoint to check system status"""
    return ResponseBuilder.success({
        "message": "Enhanced API is working!",
        "timestamp": datetime.now().isoformat(),
        "services_available": True,
    })


# WebSocket endpoint for real-time updates
@router.websocket("/ws/{client_id}", response_model=StandardAPIResponse[Dict[str, Any]])
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time updates"""
    try:
        await realtime_websocket_service.handle_websocket_connection(
            websocket, client_id
        )
    except Exception as e:
        logger.error(f"WebSocket error: {e}")


# Enhanced services initialization function
async def initialize_enhanced_services():
    """Initialize all enhanced services"""
    try:
        logger.info("Initializing enhanced services...")

        # Initialize user auth service
        await user_auth_service.initialize()
        logger.info("User authentication service initialized")

        # Initialize bankroll service
        await bankroll_service.initialize()
        logger.info("Bankroll management service initialized")

        # Initialize real data integration service
        await real_data_service.initialize()
        logger.info("Real data integration service initialized")

        # Initialize enhanced ML service
        await enhanced_ml_service.initialize()
        logger.info("Enhanced ML service initialized")

        # Initialize realtime websocket service
        await realtime_websocket_service.initialize()
        logger.info("Real-time WebSocket service initialized")

        logger.info("All enhanced services initialized successfully")
        return True

    except Exception as e:
        logger.error(f"Error initializing enhanced services: {e}")
        import traceback

        logger.error(f"Initialization traceback: {traceback.format_exc()}")
        return False


async def shutdown_enhanced_services():
    """Shutdown all enhanced services"""
    try:
        logger.info("Shutting down enhanced services...")

        # Shutdown realtime websocket service
        await realtime_websocket_service.shutdown()

        # Shutdown enhanced ML service
        await enhanced_ml_service.shutdown()

        # Shutdown real data integration service
        await real_data_service.shutdown()

        # Shutdown bankroll service
        await bankroll_service.shutdown()

        # Shutdown user auth service
        await user_auth_service.shutdown()

        logger.info("Enhanced services shutdown complete")

    except Exception as e:
        logger.error(f"Error shutting down enhanced services: {e}")
