from fastapi import APIRouter, HTTPException
from typing import Dict, Any

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException
from pydantic import BaseModel

from backend.services.unified_error_handler import handle_error
from backend.services.unified_logging import get_logger

router = APIRouter(prefix="/api/v2/sports", tags=["Sports"])

logger = get_logger("sports_routes")


class SportActivateRequest(BaseModel):
    sport: str


@router.options("/activate")
async def activate_sport_preflight():
    """Handle CORS preflight for sports activation endpoint"""
    from fastapi import Response
    return Response(status_code=200)

@router.post("/activate", status_code=200, response_model=StandardAPIResponse[Dict[str, Any]])
async def activate_sport(request: SportActivateRequest):
    try:
        sport = request.sport.upper()
        logger.info(f"Activating sport: {sport}")
        # Here you would add logic to activate/configure the sport in the backend
        # For now, just return ResponseBuilder.success response
        return ResponseBuilder.success({"status": "success", "sport": sport})
    except Exception as e:
        error_info = handle_error(e, message="Failed to activate sport")
        raise BusinessLogicException(error_info.user_message or "Failed to activate sport")
