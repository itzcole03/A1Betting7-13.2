"""
AI Routes - Ollama-powered sports analytics and explanations
Provides streaming AI assistance for prop research and player analysis
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from backend.services.ollama_service import (
    get_ollama_service, 
    ExplainRequest, 
    OllamaService
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/ai", tags=["AI Analytics"])

# Pydantic models for API
class ExplainRequestModel(BaseModel):
    """Request model for AI explanations"""
    context: str = Field(..., description="Analysis context or data to explain")
    question: str = Field(..., description="Specific question to answer")
    player_ids: Optional[List[str]] = Field(None, description="Optional player IDs for context")
    sport: str = Field("MLB", description="Sport context")
    include_trends: bool = Field(True, description="Include trend analysis")
    include_matchups: bool = Field(True, description="Include matchup analysis")

class PropAnalysisModel(BaseModel):
    """Request model for prop analysis"""
    player_name: str = Field(..., description="Player name")
    stat_type: str = Field(..., description="Statistical category")
    line: float = Field(..., description="Betting line")
    odds: str = Field(..., description="Betting odds")
    recent_performance: Optional[str] = Field(None, description="Recent performance summary")
    market_context: Optional[Dict[str, Any]] = Field(None, description="Additional market context")

class PlayerSummaryModel(BaseModel):
    """Request model for player research summary"""
    name: str = Field(..., description="Player name")
    position: str = Field(..., description="Player position")
    team: str = Field(..., description="Player team")
    season_stats: Dict[str, Any] = Field(..., description="Season statistics")
    recent_trends: Optional[str] = Field(None, description="Recent performance trends")
    matchup_data: Optional[Dict[str, Any]] = Field(None, description="Matchup information")

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    ollama_available: bool
    available_models: List[str]
    timestamp: str

@router.get("/health", response_model=HealthResponse)
async def ai_health_check(ollama_service: OllamaService = Depends(get_ollama_service)):
    """Check AI service health and availability"""
    try:
        is_available = await ollama_service.check_availability()
        models = await ollama_service.get_available_models() if is_available else []
        
        return ResponseBuilder.success(HealthResponse(
            status="healthy" if is_available else "degraded",
            ollama_available=is_available,
            available_models=models,
            timestamp=datetime.utcnow()).isoformat()
        )
    except Exception as e:
        logger.error(f"AI health check failed: {e}")
        return ResponseBuilder.success(HealthResponse(
            status="unhealthy",
            ollama_available=False,
            available_models=[],
            timestamp=datetime.utcnow()).isoformat()
        )

@router.post("/explain", response_model=StandardAPIResponse[Dict[str, Any]])
async def explain_analysis(
    request: ExplainRequestModel,
    ollama_service: OllamaService = Depends(get_ollama_service)
):
    """
    Stream AI explanation for player analysis or statistical insights
    
    Returns a streaming response with AI-generated explanations that help users
    understand complex statistical data, trends, and betting opportunities.
    """
    try:
        # Check if Ollama is available
        if not await ollama_service.check_availability():
            raise BusinessLogicException("AI service temporarily unavailable. Please try again later."
            ")
        
        # Convert Pydantic model to dataclass
        explain_request = ExplainRequest(
            context=request.context,
            question=request.question,
            player_ids=request.player_ids,
            sport=request.sport,
            include_trends=request.include_trends,
            include_matchups=request.include_matchups
        )
        
        # Create streaming response
        async def generate_explanation():
            try:
                yield "data: " + json.dumps({"type": "start", "content": ""}) + "\n\n"
                
                content_buffer = ""
                async for chunk in ollama_service.explain_player_analysis(explain_request):
                    content_buffer += chunk
                    yield "data: " + json.dumps({
                        "type": "chunk", 
                        "content": chunk,
                        "full_content": content_buffer
                    }) + "\n\n"
                
                yield "data: " + json.dumps({
                    "type": "complete", 
                    "content": "",
                    "full_content": content_buffer
                }) + "\n\n"
                
            except Exception as e:
                logger.error(f"Explanation generation error: {e}")
                yield "data: " + json.dumps({
                    "type": "error",
                    "content": f"⚠️ Analysis error: {str(e)}",
                    "error": True
                }) + "\n\n"
        
        return ResponseBuilder.success(StreamingResponse(
            generate_explanation()),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Explain analysis error: {e}")
        raise BusinessLogicException("Failed to generate explanation")

@router.post("/analyze-prop", response_model=StandardAPIResponse[Dict[str, Any]])
async def analyze_prop(
    request: PropAnalysisModel,
    ollama_service: OllamaService = Depends(get_ollama_service)
):
    """
    Stream AI analysis for a specific prop betting opportunity
    
    Provides detailed analysis of prop betting lines including historical context,
    recent performance trends, and risk assessment.
    """
    try:
        if not await ollama_service.check_availability():
            # Provide fallback analysis without AI
            return ResponseBuilder.success(StreamingResponse(
                _generate_fallback_prop_analysis(request)),
                media_type="text/event-stream"
            )
        
        prop_data = {
            "player_name": request.player_name,
            "stat_type": request.stat_type,
            "line": request.line,
            "odds": request.odds,
            "recent_performance": request.recent_performance
        }
        
        async def generate_prop_analysis():
            try:
                yield "data: " + json.dumps({"type": "start", "content": ""}) + "\n\n"
                
                content_buffer = ""
                async for chunk in ollama_service.analyze_prop_opportunity(
                    prop_data, 
                    request.market_context
                ):
                    content_buffer += chunk
                    yield "data: " + json.dumps({
                        "type": "chunk",
                        "content": chunk,
                        "full_content": content_buffer
                    }) + "\n\n"
                
                yield "data: " + json.dumps({
                    "type": "complete",
                    "content": "",
                    "full_content": content_buffer
                }) + "\n\n"
                
            except Exception as e:
                logger.error(f"Prop analysis error: {e}")
                yield "data: " + json.dumps({
                    "type": "error",
                    "content": f"⚠️ Analysis error: {str(e)}",
                    "error": True
                }) + "\n\n"
        
        return ResponseBuilder.success(StreamingResponse(
            generate_prop_analysis()),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            }
        )
        
    except Exception as e:
        logger.error(f"Prop analysis error: {e}")
        raise BusinessLogicException("Failed to analyze prop")

@router.post("/player-summary", response_model=StandardAPIResponse[Dict[str, Any]])
async def generate_player_summary(
    request: PlayerSummaryModel,
    ollama_service: OllamaService = Depends(get_ollama_service)
):
    """
    Stream comprehensive AI-powered research summary for a player
    
    Generates detailed analysis incorporating season stats, recent trends,
    and matchup considerations for research purposes.
    """
    try:
        if not await ollama_service.check_availability():
            return ResponseBuilder.success(StreamingResponse(
                _generate_fallback_player_summary(request)),
                media_type="text/event-stream"
            )
        
        player_stats = {
            "name": request.name,
            "position": request.position,
            "team": request.team,
            "season_stats": request.season_stats,
            "recent_trends": request.recent_trends
        }
        
        async def generate_summary():
            try:
                yield "data: " + json.dumps({"type": "start", "content": ""}) + "\n\n"
                
                content_buffer = ""
                async for chunk in ollama_service.generate_research_summary(
                    player_stats,
                    request.matchup_data
                ):
                    content_buffer += chunk
                    yield "data: " + json.dumps({
                        "type": "chunk",
                        "content": chunk,
                        "full_content": content_buffer
                    }) + "\n\n"
                
                yield "data: " + json.dumps({
                    "type": "complete",
                    "content": "",
                    "full_content": content_buffer
                }) + "\n\n"
                
            except Exception as e:
                logger.error(f"Player summary error: {e}")
                yield "data: " + json.dumps({
                    "type": "error",
                    "content": f"⚠️ Summary error: {str(e)}",
                    "error": True
                }) + "\n\n"
        
        return ResponseBuilder.success(StreamingResponse(
            generate_summary()),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            }
        )
        
    except Exception as e:
        logger.error(f"Player summary error: {e}")
        raise BusinessLogicException("Failed to generate summary")

# Fallback functions for when Ollama is unavailable
async def _generate_fallback_prop_analysis(request: PropAnalysisModel):
    """Generate fallback prop analysis when AI is unavailable"""
    content = f"""⚠️ AI Analysis Temporarily Unavailable

📊 **Basic Prop Analysis**
Player: {request.player_name}
Stat: {request.stat_type}
Line: {request.line}
Odds: {request.odds}

🔍 **Manual Research Recommendations:**
• Check player's recent game logs for this stat
• Review opponent's defensive rankings
• Consider weather/venue factors if applicable
• Look for injury reports or lineup changes

📋 **Responsible Gambling Reminder:**
• This is for research purposes only (18+/21+)
• Never bet more than you can afford to lose
• Always verify information from multiple sources

*AI-powered analysis will resume when the service is available.*"""

    yield "data: " + json.dumps({"type": "start", "content": ""}) + "\n\n"
    yield "data: " + json.dumps({
        "type": "complete",
        "content": content,
        "full_content": content,
        "fallback": True
    }) + "\n\n"

async def _generate_fallback_player_summary(request: PlayerSummaryModel):
    """Generate fallback player summary when AI is unavailable"""
    content = f"""⚠️ AI Analysis Temporarily Unavailable

📈 **Basic Player Overview**
Name: {request.name}
Position: {request.position}
Team: {request.team}

📊 **Season Statistics:**
"""
    for stat, value in request.season_stats.items():
        content += f"• {stat}: {value}\n"

    content += f"""
🔍 **Research Suggestions:**
• Analyze recent game-by-game performance
• Check matchup history vs upcoming opponent
• Review injury reports and playing time trends
• Compare stats to position/league averages

*AI-powered insights will resume when the service is available.*"""

    yield "data: " + json.dumps({"type": "start", "content": ""}) + "\n\n"
    yield "data: " + json.dumps({
        "type": "complete",
        "content": content,
        "full_content": content,
        "fallback": True
    }) + "\n\n"

# Add missing json import
import json
