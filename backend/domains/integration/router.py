"""
Unified Integration Domain Router

RESTful API endpoints for all external integrations and API connections.
Consolidates integration routes into a logical, maintainable structure.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query, Path, Request
from fastapi.responses import JSONResponse
import logging

from .service import UnifiedIntegrationService
from .models import (
    IntegrationRequest,
    IntegrationResponse,
    SportsbookOddsRequest,
    ExternalDataRequest,
    WebhookRequest,
    SportsbookOdds,
    ExternalDataResponse,
    AuthenticationResult,
    WebhookEvent,
    IntegrationStatus,
    ArbitrageOpportunity,
    HealthResponse,
    IntegrationError,
    Sport,
    Sportsbook,
    ExternalProvider,
    IntegrationType,
    MarketType,
    OddsFormat,
)

logger = logging.getLogger(__name__)

# Create router
integration_router = APIRouter(
    prefix="/api/v1/integration",
    tags=["integration"],
    responses={
        404: {"model": IntegrationError, "description": "Not found"},
        500: {"model": IntegrationError, "description": "Internal server error"},
    }
)

# Service dependency
async def get_integration_service() -> UnifiedIntegrationService:
    """Get integration service instance"""
    service = UnifiedIntegrationService()
    if not service.is_initialized:
        await service.initialize()
    return service


@integration_router.get("/health", response_model=HealthResponse)
async def health_check(
    service: UnifiedIntegrationService = Depends(get_integration_service)
):
    """
    Check integration service health
    """
    try:
        return await service.health_check()
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail="Health check failed")


@integration_router.post("/sportsbook/odds", response_model=IntegrationResponse)
async def get_sportsbook_odds(
    request: SportsbookOddsRequest,
    service: UnifiedIntegrationService = Depends(get_integration_service)
):
    """
    Get odds from a specific sportsbook
    
    **Request Body:**
    - **sportsbook**: Sportsbook name (betmgm, draftkings, caesars, fanduel, prizepicks)
    - **sport**: Sport type (mlb, nba, nfl, nhl)
    - **game_id**: Optional specific game ID
    - **market_types**: Optional market type filters
    - **odds_format**: Odds format (american, decimal, fractional)
    - **live_only**: Live odds only
    
    **Returns:**
    - Sportsbook odds with game info and betting lines
    """
    try:
        return await service.get_sportsbook_odds(request)
    except Exception as e:
        logger.error(f"Get sportsbook odds failed: {e}")
        raise HTTPException(status_code=500, detail=f"Sportsbook request failed: {str(e)}")


@integration_router.get("/sportsbook/{sportsbook}/odds", response_model=IntegrationResponse)
async def get_sportsbook_odds_by_sport(
    sportsbook: Sportsbook = Path(..., description="Sportsbook name"),
    sport: Sport = Query(..., description="Sport type"),
    market_type: Optional[MarketType] = Query(None, description="Market type filter"),
    odds_format: OddsFormat = Query(OddsFormat.AMERICAN, description="Odds format"),
    live_only: bool = Query(False, description="Live odds only"),
    service: UnifiedIntegrationService = Depends(get_integration_service)
):
    """
    Get odds from sportsbook by sport
    
    **Path Parameters:**
    - **sportsbook**: Sportsbook identifier
    
    **Query Parameters:**
    - **sport**: Sport type
    - **market_type**: Optional market type filter
    - **odds_format**: Odds format preference
    - **live_only**: Live odds only
    
    **Returns:**
    - Sportsbook odds for the specified sport
    """
    try:
        request = SportsbookOddsRequest(
            sportsbook=sportsbook,
            sport=sport,
            market_types=[market_type] if market_type else None,
            odds_format=odds_format,
            live_only=live_only
        )
        
        return await service.get_sportsbook_odds(request)
    except Exception as e:
        logger.error(f"Get sportsbook odds by sport failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get sportsbook odds")


@integration_router.post("/external/data", response_model=IntegrationResponse)
async def get_external_data(
    request: ExternalDataRequest,
    service: UnifiedIntegrationService = Depends(get_integration_service)
):
    """
    Get data from external provider
    
    **Request Body:**
    - **provider**: External provider (sportradar, espn, baseball_savant, etc.)
    - **data_type**: Type of data requested
    - **sport**: Sport type
    - **filters**: Optional data filters
    - **real_time**: Real-time data required
    
    **Returns:**
    - External data response with provider information
    """
    try:
        return await service.get_external_data(request)
    except Exception as e:
        logger.error(f"Get external data failed: {e}")
        raise HTTPException(status_code=500, detail=f"External data request failed: {str(e)}")


@integration_router.get("/external/{provider}/data", response_model=IntegrationResponse)
async def get_provider_data(
    provider: ExternalProvider = Path(..., description="External provider"),
    data_type: str = Query(..., description="Data type"),
    sport: Sport = Query(..., description="Sport type"),
    real_time: bool = Query(False, description="Real-time data"),
    service: UnifiedIntegrationService = Depends(get_integration_service)
):
    """
    Get data from specific external provider
    
    **Path Parameters:**
    - **provider**: External provider identifier
    
    **Query Parameters:**
    - **data_type**: Type of data to fetch
    - **sport**: Sport type
    - **real_time**: Real-time data required
    
    **Returns:**
    - Provider-specific data response
    """
    try:
        request = ExternalDataRequest(
            provider=provider,
            data_type=data_type,
            sport=sport,
            real_time=real_time
        )
        
        return await service.get_external_data(request)
    except Exception as e:
        logger.error(f"Get provider data failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get provider data")


@integration_router.post("/auth/{provider}")
async def authenticate_provider(
    provider: str = Path(..., description="Provider identifier"),
    credentials: Dict[str, str] = ...,
    service: UnifiedIntegrationService = Depends(get_integration_service)
):
    """
    Authenticate with external provider
    
    **Path Parameters:**
    - **provider**: Provider identifier
    
    **Request Body:**
    - **credentials**: Authentication credentials (API key, username/password, etc.)
    
    **Returns:**
    - Authentication result with token and expiration
    """
    try:
        return await service.authenticate_provider(provider, credentials)
    except Exception as e:
        logger.error(f"Provider authentication failed: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")


@integration_router.get("/arbitrage", response_model=List[ArbitrageOpportunity])
async def find_arbitrage_opportunities(
    sport: Sport = Query(..., description="Sport type"),
    market_type: MarketType = Query(MarketType.MONEYLINE, description="Market type"),
    min_profit_percentage: float = Query(1.0, description="Minimum profit percentage"),
    service: UnifiedIntegrationService = Depends(get_integration_service)
):
    """
    Find arbitrage opportunities across sportsbooks
    
    **Query Parameters:**
    - **sport**: Sport type to search
    - **market_type**: Market type for arbitrage
    - **min_profit_percentage**: Minimum profit percentage threshold
    
    **Returns:**
    - List of arbitrage opportunities with profit calculations
    """
    try:
        opportunities = await service.find_arbitrage_opportunities(sport, market_type)
        
        # Filter by minimum profit percentage
        filtered_opportunities = [
            opp for opp in opportunities 
            if opp.arbitrage_percentage >= min_profit_percentage
        ]
        
        # Sort by profit percentage (highest first)
        filtered_opportunities.sort(key=lambda x: x.arbitrage_percentage, reverse=True)
        
        return filtered_opportunities
        
    except Exception as e:
        logger.error(f"Find arbitrage opportunities failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to find arbitrage opportunities")


@integration_router.get("/status", response_model=List[IntegrationStatus])
async def get_integration_status(
    provider: Optional[str] = Query(None, description="Specific provider filter"),
    integration_type: Optional[IntegrationType] = Query(None, description="Integration type filter"),
    service: UnifiedIntegrationService = Depends(get_integration_service)
):
    """
    Get integration connection status
    
    **Query Parameters:**
    - **provider**: Optional provider filter
    - **integration_type**: Optional integration type filter
    
    **Returns:**
    - List of integration statuses with connection info
    """
    try:
        statuses = await service.get_integration_status(provider)
        
        # Filter by integration type if specified
        if integration_type:
            statuses = [
                status for status in statuses 
                if status.integration_type == integration_type
            ]
        
        return statuses
        
    except Exception as e:
        logger.error(f"Get integration status failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get integration status")


@integration_router.post("/webhooks/register")
async def register_webhook(
    request: WebhookRequest,
    service: UnifiedIntegrationService = Depends(get_integration_service)
):
    """
    Register webhook with external provider
    
    **Request Body:**
    - **provider**: Provider to register webhook with
    - **event_types**: List of event types to subscribe to
    - **callback_url**: Webhook callback URL
    - **secret**: Optional webhook secret for verification
    
    **Returns:**
    - Webhook registration status
    """
    try:
        success = await service.register_webhook(request)
        
        if not success:
            raise HTTPException(status_code=400, detail="Webhook registration failed")
        
        return {
            "status": "registered",
            "provider": request.provider,
            "callback_url": request.callback_url,
            "event_types": request.event_types
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Webhook registration failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to register webhook")


@integration_router.post("/webhooks/{provider}/events")
async def receive_webhook_event(
    provider: str = Path(..., description="Provider identifier"),
    request: Request = ...,
    service: UnifiedIntegrationService = Depends(get_integration_service)
):
    """
    Receive webhook event from external provider
    
    **Path Parameters:**
    - **provider**: Provider sending the webhook
    
    **Request Body:**
    - Raw webhook event data
    
    **Returns:**
    - Event processing acknowledgment
    """
    try:
        # Get raw request body
        event_data = await request.json()
        
        # Process webhook event
        event = await service.process_webhook_event(provider, event_data)
        
        return {
            "status": "processed",
            "event_id": event.event_id,
            "event_type": event.event_type,
            "processed_at": event.received_at.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Webhook event processing failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to process webhook event")


@integration_router.get("/sportsbooks/all/odds")
async def get_all_sportsbook_odds(
    sport: Sport = Query(..., description="Sport type"),
    market_type: MarketType = Query(MarketType.MONEYLINE, description="Market type"),
    game_id: Optional[str] = Query(None, description="Specific game ID"),
    service: UnifiedIntegrationService = Depends(get_integration_service)
):
    """
    Get odds from all available sportsbooks
    
    **Query Parameters:**
    - **sport**: Sport type
    - **market_type**: Market type
    - **game_id**: Optional game ID filter
    
    **Returns:**
    - Aggregated odds from all sportsbooks
    """
    try:
        all_odds = {}
        
        # Get odds from each sportsbook
        for sportsbook in Sportsbook:
            try:
                request = SportsbookOddsRequest(
                    sportsbook=sportsbook,
                    sport=sport,
                    game_id=game_id,
                    market_types=[market_type]
                )
                
                response = await service.get_sportsbook_odds(request)
                all_odds[sportsbook.value] = response.sportsbook_odds
                
            except Exception as e:
                logger.warning(f"Failed to get odds from {sportsbook}: {e}")
                all_odds[sportsbook.value] = []
        
        return {
            "sport": sport,
            "market_type": market_type,
            "sportsbook_odds": all_odds,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Get all sportsbook odds failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get all sportsbook odds")


@integration_router.get("/providers/status")
async def get_all_provider_status(
    service: UnifiedIntegrationService = Depends(get_integration_service)
):
    """
    Get status of all external providers
    
    **Returns:**
    - Status summary of all integrations
    """
    try:
        health = await service.health_check()
        
        return {
            "overall_status": health.status,
            "integrations_online": health.integrations_online,
            "integrations_total": health.integrations_total,
            "provider_status": health.integration_status,
            "avg_response_time_ms": health.avg_response_time_ms,
            "error_rate_percentage": health.error_rate_percentage,
            "last_updated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Get provider status failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get provider status")


@integration_router.post("/test/{provider}")
async def test_provider_connection(
    provider: str = Path(..., description="Provider to test"),
    service: UnifiedIntegrationService = Depends(get_integration_service)
):
    """
    Test connection to specific provider
    
    **Path Parameters:**
    - **provider**: Provider identifier to test
    
    **Returns:**
    - Connection test results
    """
    try:
        # Force connection test
        if provider in service.connection_status:
            status = service.connection_status[provider]
            
            return {
                "provider": provider,
                "status": status.status,
                "response_time_ms": status.avg_response_time_ms,
                "authenticated": status.authenticated,
                "last_success": status.last_success,
                "error_message": status.error_message,
                "test_time": datetime.utcnow().isoformat()
            }
        else:
            raise HTTPException(status_code=404, detail="Provider not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Provider connection test failed: {e}")
        raise HTTPException(status_code=500, detail="Connection test failed")


# Error handlers
@integration_router.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": f"HTTP_{exc.status_code}",
            "message": exc.detail,
            "timestamp": datetime.utcnow().isoformat()
        }
    )


@integration_router.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception in integration router: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error_code": "INTERNAL_ERROR",
            "message": "Internal server error",
            "timestamp": datetime.utcnow().isoformat()
        }
    )
