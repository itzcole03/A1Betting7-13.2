"""
Ollama Service Adapter - AI-powered sports analytics expert
Provides explainable AI assistance for prop research via local Ollama LLM instance
"""

import asyncio
import json
import logging
import os
from typing import AsyncIterator, Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime

import httpx
from fastapi import HTTPException

logger = logging.getLogger(__name__)

@dataclass
class ChatMessage:
    """Chat message structure for Ollama conversations"""
    role: str  # "system", "user", "assistant"
    content: str

@dataclass
class ExplainRequest:
    """Request structure for AI explanations"""
    context: str
    question: str
    player_ids: Optional[List[str]] = None
    sport: str = "MLB"
    include_trends: bool = True
    include_matchups: bool = True

@dataclass
class ExplanationResponse:
    """Response structure for AI explanations"""
    content: str
    confidence: float
    model_used: str
    response_time_ms: int
    citations: List[str]
    suggestions: List[str]

class OllamaService:
    """Service for interacting with local Ollama LLM instance"""
    
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.default_model = os.getenv("OLLAMA_DEFAULT_MODEL", "llama3.1")
        self.timeout = 30.0
        self.system_prompt = """You are A1Betting Sports Expert, a professional sports analytics AI assistant.

CORE RESPONSIBILITIES:
- Provide concise, factual, and compliant betting research insights
- Analyze player performance data, trends, and matchup contexts
- Explain model outputs and statistical relationships in plain language
- Generate actionable prop insights with clear reasoning

GUIDELINES:
- Never give financial guarantees or "guaranteed wins"
- Always include disclaimers about risk and uncertainty
- Prefer numbers, context, and references to underlying stats
- Follow Responsible Gambling guidelines (18+/21+ notices)
- Focus on data-driven analysis over speculation
- Clearly label assumptions and confidence levels

RESPONSE FORMAT:
- Start with key insight summary
- Provide supporting data and context
- Include relevant trends and matchup factors
- End with actionable takeaways and risk considerations
- Use bullet points and clear structure for readability"""
    
    async def check_availability(self) -> bool:
        """Check if Ollama service is available"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except Exception as e:
            logger.warning(f"Ollama service not available: {e}")
            return False
    
    async def get_available_models(self) -> List[str]:
        """Get list of available models from Ollama"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                response.raise_for_status()
                data = response.json()
                return [model["name"] for model in data.get("models", [])]
        except Exception as e:
            logger.error(f"Failed to get available models: {e}")
            return [self.default_model]
    
    async def ollama_chat_stream(
        self, 
        messages: List[ChatMessage], 
        model: str = None
    ) -> AsyncIterator[str]:
        """Stream chat completion from Ollama"""
        if not model:
            model = self.default_model
            
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": model,
            "messages": [{"role": msg.role, "content": msg.content} for msg in messages],
            "stream": True,
            "options": {
                "temperature": 0.2,  # Lower temperature for more factual responses
                "num_ctx": 8192,     # Large context window
                "top_p": 0.9,
                "top_k": 40
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                async with client.stream("POST", url, json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        try:
                            data = json.loads(line)
                            if "message" in data and "content" in data["message"]:
                                yield data["message"]["content"]
                            if data.get("done", False):
                                break
                        except json.JSONDecodeError:
                            continue
        except httpx.TimeoutException:
            yield "⚠️ Response timeout - please try again with a shorter query."
        except httpx.RequestError as e:
            yield f"⚠️ Connection error: {str(e)}"
        except Exception as e:
            logger.error(f"Ollama chat stream error: {e}")
            yield f"⚠️ Unexpected error: {str(e)}"
    
    async def explain_player_analysis(
        self, 
        request: ExplainRequest
    ) -> AsyncIterator[str]:
        """Generate streaming explanation for player analysis"""
        
        # Build context-rich prompt
        prompt = self._build_explanation_prompt(request)
        
        messages = [
            ChatMessage(role="system", content=self.system_prompt),
            ChatMessage(role="user", content=prompt)
        ]
        
        async for chunk in self.ollama_chat_stream(messages):
            yield chunk
    
    def _build_explanation_prompt(self, request: ExplainRequest) -> str:
        """Build comprehensive prompt for player analysis explanation"""
        
        prompt_parts = [
            f"📊 SPORTS ANALYSIS REQUEST",
            f"Sport: {request.sport}",
            f"Context: {request.context}",
            f"Question: {request.question}"
        ]
        
        if request.player_ids:
            prompt_parts.append(f"Players: {', '.join(request.player_ids)}")
        
        prompt_parts.extend([
            "",
            "🎯 ANALYSIS REQUIREMENTS:",
            "- Provide data-driven insights based on the context provided",
            "- Explain any statistical trends or patterns mentioned",
            "- Include relevant matchup factors if applicable",
            "- Suggest actionable research directions",
            "- Include appropriate risk disclaimers"
        ])
        
        if request.include_trends:
            prompt_parts.append("- Focus on recent performance trends and seasonal patterns")
        
        if request.include_matchups:
            prompt_parts.append("- Consider opponent defensive rankings and matchup history")
        
        prompt_parts.extend([
            "",
            "⚠️ COMPLIANCE NOTES:",
            "- This is for research purposes only",
            "- Include '18+/21+ only' and responsible gambling reminders",
            "- No guarantees or 'locks' - emphasize uncertainty",
            "- Suggest users verify with multiple sources",
            "",
            "Please provide your analysis:"
        ])
        
        return "\n".join(prompt_parts)
    
    async def analyze_prop_opportunity(
        self, 
        prop_data: Dict[str, Any],
        market_context: Optional[Dict[str, Any]] = None
    ) -> AsyncIterator[str]:
        """Analyze a specific prop betting opportunity"""
        
        context_parts = [
            f"🏈 PROP ANALYSIS",
            f"Player: {prop_data.get('player_name', 'Unknown')}",
            f"Stat Type: {prop_data.get('stat_type', 'Unknown')}",
            f"Line: {prop_data.get('line', 'N/A')}",
            f"Odds: {prop_data.get('odds', 'N/A')}"
        ]
        
        if prop_data.get('recent_performance'):
            context_parts.append(f"Recent Performance: {prop_data['recent_performance']}")
        
        if market_context:
            context_parts.append(f"Market Context: {json.dumps(market_context, indent=2)}")
        
        prompt = "\n".join(context_parts) + "\n\nPlease analyze this prop opportunity:"
        
        messages = [
            ChatMessage(role="system", content=self.system_prompt),
            ChatMessage(role="user", content=prompt)
        ]
        
        async for chunk in self.ollama_chat_stream(messages):
            yield chunk
    
    async def generate_research_summary(
        self, 
        player_stats: Dict[str, Any],
        matchup_data: Optional[Dict[str, Any]] = None
    ) -> AsyncIterator[str]:
        """Generate comprehensive research summary for a player"""
        
        summary_parts = [
            f"📈 PLAYER RESEARCH SUMMARY",
            f"Player: {player_stats.get('name', 'Unknown')}",
            f"Position: {player_stats.get('position', 'Unknown')}",
            f"Team: {player_stats.get('team', 'Unknown')}"
        ]
        
        if 'season_stats' in player_stats:
            summary_parts.append("Season Stats:")
            for stat, value in player_stats['season_stats'].items():
                summary_parts.append(f"  - {stat}: {value}")
        
        if 'recent_trends' in player_stats:
            summary_parts.append(f"Recent Trends: {player_stats['recent_trends']}")
        
        if matchup_data:
            summary_parts.append(f"Matchup Data: {json.dumps(matchup_data, indent=2)}")
        
        prompt = "\n".join(summary_parts) + "\n\nPlease provide a comprehensive research summary:"
        
        messages = [
            ChatMessage(role="system", content=self.system_prompt),
            ChatMessage(role="user", content=prompt)
        ]
        
        async for chunk in self.ollama_chat_stream(messages):
            yield chunk

# Singleton instance
_ollama_service = None

def get_ollama_service() -> OllamaService:
    """Get singleton Ollama service instance"""
    global _ollama_service
    if _ollama_service is None:
        _ollama_service = OllamaService()
    return _ollama_service
