"""
Portfolio Rationale Service

Provides LLM-driven narrative explanations for portfolio optimization decisions,
including bet selection reasoning, risk analysis, and market insights.
"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass, field
from enum import Enum
import hashlib
import time

from backend.services.unified_logging import get_logger
from backend.services.unified_config import unified_config


class RationaleType(Enum):
    """Types of portfolio rationales"""
    PORTFOLIO_SUMMARY = "portfolio_summary"
    BET_SELECTION = "bet_selection" 
    RISK_ANALYSIS = "risk_analysis"
    MARKET_INSIGHTS = "market_insights"
    PERFORMANCE_REVIEW = "performance_review"


@dataclass
class RationaleRequest:
    """Request for portfolio rationale generation"""
    rationale_type: RationaleType
    portfolio_data: Dict[str, Any]
    context: Dict[str, Any] = field(default_factory=dict)
    user_preferences: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)
    
    def get_cache_key(self) -> str:
        """Generate cache key for this request"""
        # Create deterministic hash from request data
        data_str = json.dumps({
            "type": self.rationale_type.value,
            "portfolio": self.portfolio_data,
            "context": self.context,
            "preferences": self.user_preferences
        }, sort_keys=True, default=str)
        
        return hashlib.md5(data_str.encode()).hexdigest()


@dataclass 
class RationaleResponse:
    """Response containing generated rationale"""
    request_id: str
    rationale_type: RationaleType
    narrative: str
    key_points: List[str]
    confidence: float
    generation_time_ms: int
    model_info: Dict[str, Any]
    timestamp: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses"""
        return {
            "request_id": self.request_id,
            "rationale_type": self.rationale_type.value,
            "narrative": self.narrative,
            "key_points": self.key_points,
            "confidence": self.confidence,
            "generation_time_ms": self.generation_time_ms,
            "model_info": self.model_info,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata
        }


@dataclass
class RationaleCache:
    """Cache entry for rationale responses"""
    response: RationaleResponse
    created_at: datetime
    access_count: int = 0
    last_accessed: datetime = field(default_factory=datetime.utcnow)
    ttl_seconds: int = 300  # 5 minutes default


class PortfolioRationaleService:
    """Service for generating LLM-driven portfolio rationales"""
    
    def __init__(self):
        self.logger = get_logger("portfolio_rationale")
        
        # Configuration
        self.cache_ttl_seconds = unified_config.get_config_value("RATIONALE_CACHE_TTL", 300)
        self.rate_limit_requests_per_minute = unified_config.get_config_value("RATIONALE_RATE_LIMIT", 10)
        self.max_concurrent_requests = unified_config.get_config_value("RATIONALE_MAX_CONCURRENT", 3)
        
        # Cache and rate limiting
        self.cache: Dict[str, RationaleCache] = {}
        self.rate_limiter: Dict[str, List[datetime]] = {}  # user_id -> timestamps
        self.concurrent_requests = 0
        self.request_queue = asyncio.Queue()
        
        # Metrics
        self.total_requests = 0
        self.cache_hits = 0
        self.cache_misses = 0
        self.rate_limit_rejections = 0
        self.generation_errors = 0
        
        # Mock LLM configuration (replace with actual LLM integration)
        self.mock_mode = unified_config.get_config_value("RATIONALE_MOCK_MODE", True)
        
    async def generate_rationale(
        self, 
        request: RationaleRequest,
        user_id: str = "default"
    ) -> Optional[RationaleResponse]:
        """Generate portfolio rationale with caching and rate limiting"""
        
        self.total_requests += 1
        request_id = f"rationale_{int(time.time())}_{self.total_requests}"
        
        try:
            # Check rate limiting
            if not self._check_rate_limit(user_id):
                self.rate_limit_rejections += 1
                self.logger.warning(f"Rate limit exceeded for user {user_id}")
                return None
                
            # Check cache first
            cache_key = request.get_cache_key()
            cached_response = self._get_cached_response(cache_key)
            
            if cached_response:
                self.cache_hits += 1
                self.logger.debug(f"Cache hit for rationale request {request_id}")
                cached_response.request_id = request_id  # Update request ID
                return cached_response
                
            self.cache_misses += 1
            
            # Check concurrent request limit
            if self.concurrent_requests >= self.max_concurrent_requests:
                self.logger.info(f"Request {request_id} queued due to concurrency limit")
                await self.request_queue.put((request, user_id, request_id, cache_key))
                return await self._process_queued_request()
            
            # Generate rationale
            response = await self._generate_rationale_internal(request, request_id)
            
            if response:
                # Cache successful response
                self._cache_response(cache_key, response)
                
            return response
            
        except Exception as e:
            self.generation_errors += 1
            self.logger.error(f"Error generating rationale {request_id}: {e}")
            return None
            
    async def _process_queued_request(self) -> Optional[RationaleResponse]:
        """Process a queued request"""
        try:
            request, user_id, request_id, cache_key = await self.request_queue.get()
            return await self._generate_rationale_internal(request, request_id)
        except Exception as e:
            self.logger.error(f"Error processing queued request: {e}")
            return None
            
    async def _generate_rationale_internal(
        self, 
        request: RationaleRequest, 
        request_id: str
    ) -> Optional[RationaleResponse]:
        """Internal rationale generation"""
        
        self.concurrent_requests += 1
        start_time = time.time()
        
        try:
            self.logger.info(f"Generating {request.rationale_type.value} rationale {request_id}")
            
            if self.mock_mode:
                response = await self._generate_mock_rationale(request, request_id)
            else:
                response = await self._generate_llm_rationale(request, request_id)
                
            if response:
                generation_time = int((time.time() - start_time) * 1000)
                response.generation_time_ms = generation_time
                
                self.logger.info(
                    f"Generated rationale {request_id} in {generation_time}ms, "
                    f"confidence: {response.confidence:.2f}"
                )
                
            return response
            
        finally:
            self.concurrent_requests -= 1
            
    async def _generate_mock_rationale(
        self, 
        request: RationaleRequest, 
        request_id: str
    ) -> RationaleResponse:
        """Generate mock rationale for testing"""
        
        # Simulate processing delay
        await asyncio.sleep(0.5 + (hash(request_id) % 100) / 200)  # 0.5-1.0 seconds
        
        portfolio_data = request.portfolio_data
        selected_props = portfolio_data.get("selected_props", [])
        total_exposure = portfolio_data.get("total_exposure", 0)
        expected_return = portfolio_data.get("expected_return", 0)
        
        if request.rationale_type == RationaleType.PORTFOLIO_SUMMARY:
            narrative = self._generate_portfolio_summary_narrative(
                selected_props, total_exposure, expected_return
            )
            key_points = self._generate_portfolio_summary_points(selected_props)
            
        elif request.rationale_type == RationaleType.BET_SELECTION:
            narrative = self._generate_bet_selection_narrative(selected_props)
            key_points = self._generate_bet_selection_points(selected_props)
            
        elif request.rationale_type == RationaleType.RISK_ANALYSIS:
            narrative = self._generate_risk_analysis_narrative(selected_props, total_exposure)
            key_points = self._generate_risk_analysis_points(selected_props)
            
        elif request.rationale_type == RationaleType.MARKET_INSIGHTS:
            narrative = self._generate_market_insights_narrative(selected_props)
            key_points = self._generate_market_insights_points(selected_props)
            
        else:
            narrative = "Portfolio analysis complete."
            key_points = ["Analysis completed successfully"]
            
        return RationaleResponse(
            request_id=request_id,
            rationale_type=request.rationale_type,
            narrative=narrative,
            key_points=key_points,
            confidence=0.75 + (hash(request_id) % 25) / 100,  # 0.75-0.99
            generation_time_ms=0,  # Will be set by caller
            model_info={"model": "mock", "version": "1.0"},
            timestamp=datetime.utcnow(),
            metadata={"props_analyzed": len(selected_props)}
        )
        
    async def _generate_llm_rationale(
        self, 
        request: RationaleRequest, 
        request_id: str
    ) -> Optional[RationaleResponse]:
        """Generate actual LLM rationale (placeholder for production implementation)"""
        
        # TODO: Integrate with actual LLM service (OpenAI, Anthropic, local model, etc.)
        # This would include:
        # 1. Construct appropriate prompt based on rationale type
        # 2. Call LLM API with portfolio data and context
        # 3. Parse and validate response
        # 4. Extract key points and confidence scores
        
        self.logger.warning("LLM integration not implemented, falling back to mock")
        return await self._generate_mock_rationale(request, request_id)
        
    def _generate_portfolio_summary_narrative(
        self, 
        selected_props: List[Dict], 
        total_exposure: float, 
        expected_return: float
    ) -> str:
        """Generate portfolio summary narrative"""
        
        prop_count = len(selected_props)
        avg_edge = sum(prop.get("edge_value", 0) for prop in selected_props) / max(1, prop_count)
        
        return (
            f"Your optimized portfolio contains {prop_count} carefully selected propositions "
            f"with a total exposure of ${total_exposure:.0f}. The portfolio demonstrates strong "
            f"value potential with an average edge of {avg_edge:.1%} across all selections. "
            f"Expected portfolio return is ${expected_return:.2f}, representing a "
            f"{expected_return/max(1, total_exposure):.1%} expected yield on your investment. "
            f"This allocation balances opportunity identification with risk management, "
            f"focusing on props with the highest probability-adjusted expected value."
        )
        
    def _generate_portfolio_summary_points(self, selected_props: List[Dict]) -> List[str]:
        """Generate key points for portfolio summary"""
        
        points = [
            f"Portfolio contains {len(selected_props)} optimized selections",
            f"Average edge: {sum(p.get('edge_value', 0) for p in selected_props) / max(1, len(selected_props)):.1%}",
            "Risk-adjusted allocation based on Kelly criterion principles",
            "Focus on high-confidence, positive expected value opportunities"
        ]
        
        # Add sport-specific insights
        sports = set(prop.get("sport", "Unknown") for prop in selected_props)
        if len(sports) > 1:
            points.append(f"Diversified across {len(sports)} sports for reduced correlation risk")
        
        return points
        
    def _generate_bet_selection_narrative(self, selected_props: List[Dict]) -> str:
        """Generate bet selection narrative"""
        
        if not selected_props:
            return "No props selected for this portfolio optimization."
            
        top_prop = max(selected_props, key=lambda p: p.get("edge_value", 0))
        prop_types = set(prop.get("market_type", "Unknown") for prop in selected_props)
        
        return (
            f"The selection algorithm identified {len(selected_props)} high-value opportunities "
            f"across {len(prop_types)} market types. The strongest selection features "
            f"{top_prop.get('player_name', 'Unknown Player')} with an edge of "
            f"{top_prop.get('edge_value', 0):.1%}, indicating significant market mispricing. "
            f"All selections passed our confidence threshold and correlation filters, "
            f"ensuring each bet contributes unique value to the portfolio without excessive overlap."
        )
        
    def _generate_bet_selection_points(self, selected_props: List[Dict]) -> List[str]:
        """Generate key points for bet selection"""
        
        if not selected_props:
            return ["No qualifying opportunities identified"]
            
        points = []
        for prop in selected_props[:3]:  # Top 3 props
            player = prop.get("player_name", "Unknown")
            edge = prop.get("edge_value", 0)
            points.append(f"{player}: {edge:.1%} edge identified")
            
        points.append(f"All {len(selected_props)} selections exceed minimum edge threshold")
        return points
        
    def _generate_risk_analysis_narrative(self, selected_props: List[Dict], total_exposure: float) -> str:
        """Generate risk analysis narrative"""
        
        max_position = max((prop.get("position_size", 0) for prop in selected_props), default=0)
        position_concentration = max_position / max(1, total_exposure)
        
        return (
            f"Risk analysis shows well-balanced portfolio construction with maximum single "
            f"position representing {position_concentration:.1%} of total exposure. "
            f"The diversification across multiple props reduces correlation risk while "
            f"maintaining significant upside potential. Position sizing follows Kelly "
            f"criterion principles, with larger allocations to higher-confidence opportunities. "
            f"Overall portfolio volatility is managed through careful selection and "
            f"position sizing optimization."
        )
        
    def _generate_risk_analysis_points(self, selected_props: List[Dict]) -> List[str]:
        """Generate key points for risk analysis"""
        
        total_exposure = sum(prop.get("position_size", 0) for prop in selected_props)
        max_position = max((prop.get("position_size", 0) for prop in selected_props), default=0)
        
        return [
            f"Maximum single position: {max_position/max(1, total_exposure):.1%} of portfolio",
            "Kelly criterion applied for optimal position sizing",
            "Correlation analysis performed to minimize overlap",
            f"Portfolio diversified across {len(selected_props)} independent opportunities"
        ]
        
    def _generate_market_insights_narrative(self, selected_props: List[Dict]) -> str:
        """Generate market insights narrative"""
        
        market_types = [prop.get("market_type", "Unknown") for prop in selected_props]
        most_common_market = max(set(market_types), key=market_types.count) if market_types else "Unknown"
        
        return (
            f"Current market analysis reveals strong opportunities in {most_common_market} "
            f"markets, with {market_types.count(most_common_market)} of your selections "
            f"concentrated in this area. This suggests systematic mispricing in specific "
            f"market segments that our models have identified. The portfolio capitalizes "
            f"on these inefficiencies while maintaining appropriate diversification. "
            f"Market conditions appear favorable for value-based betting strategies."
        )
        
    def _generate_market_insights_points(self, selected_props: List[Dict]) -> List[str]:
        """Generate key points for market insights"""
        
        market_types = [prop.get("market_type", "Unknown") for prop in selected_props]
        unique_markets = set(market_types)
        
        return [
            f"Opportunities identified across {len(unique_markets)} market types",
            "Systematic mispricing detected in specific segments",
            "Market inefficiencies favor value-based strategies",
            "Favorable conditions for contrarian positioning"
        ]
        
    def _check_rate_limit(self, user_id: str) -> bool:
        """Check if user is within rate limits"""
        
        now = datetime.utcnow()
        window_start = now - timedelta(minutes=1)
        
        # Get user's request history
        if user_id not in self.rate_limiter:
            self.rate_limiter[user_id] = []
            
        user_requests = self.rate_limiter[user_id]
        
        # Remove old requests outside the window
        user_requests[:] = [req_time for req_time in user_requests if req_time > window_start]
        
        # Check if under limit
        if len(user_requests) >= self.rate_limit_requests_per_minute:
            return False
            
        # Add current request
        user_requests.append(now)
        return True
        
    def _get_cached_response(self, cache_key: str) -> Optional[RationaleResponse]:
        """Get cached response if valid"""
        
        if cache_key not in self.cache:
            return None
            
        cache_entry = self.cache[cache_key]
        
        # Check TTL
        age = datetime.utcnow() - cache_entry.created_at
        if age.total_seconds() > cache_entry.ttl_seconds:
            del self.cache[cache_key]
            return None
            
        # Update access metrics
        cache_entry.access_count += 1
        cache_entry.last_accessed = datetime.utcnow()
        
        return cache_entry.response
        
    def _cache_response(self, cache_key: str, response: RationaleResponse) -> None:
        """Cache rationale response"""
        
        cache_entry = RationaleCache(
            response=response,
            created_at=datetime.utcnow(),
            ttl_seconds=self.cache_ttl_seconds
        )
        
        self.cache[cache_key] = cache_entry
        
        # Clean up old cache entries if cache is getting large
        if len(self.cache) > 1000:
            self._cleanup_cache()
            
    def _cleanup_cache(self) -> None:
        """Clean up expired cache entries"""
        
        now = datetime.utcnow()
        expired_keys = []
        
        for key, entry in self.cache.items():
            age = now - entry.created_at
            if age.total_seconds() > entry.ttl_seconds:
                expired_keys.append(key)
                
        for key in expired_keys:
            del self.cache[key]
            
        self.logger.debug(f"Cleaned up {len(expired_keys)} expired cache entries")
        
    def get_metrics(self) -> Dict[str, Any]:
        """Get service metrics"""
        
        cache_hit_rate = self.cache_hits / max(1, self.cache_hits + self.cache_misses)
        
        return {
            "total_requests": self.total_requests,
            "cache_hits": self.cache_hits,
            "cache_misses": self.cache_misses,
            "cache_hit_rate": cache_hit_rate,
            "rate_limit_rejections": self.rate_limit_rejections,
            "generation_errors": self.generation_errors,
            "concurrent_requests": self.concurrent_requests,
            "cache_size": len(self.cache),
            "queue_size": self.request_queue.qsize()
        }
        
    def get_status(self) -> Dict[str, Any]:
        """Get comprehensive service status"""
        
        return {
            "is_healthy": self.generation_errors / max(1, self.total_requests) < 0.1,
            "mock_mode": self.mock_mode,
            "configuration": {
                "cache_ttl_seconds": self.cache_ttl_seconds,
                "rate_limit_per_minute": self.rate_limit_requests_per_minute,
                "max_concurrent": self.max_concurrent_requests
            },
            "metrics": self.get_metrics()
        }


# Global instance
portfolio_rationale_service = PortfolioRationaleService()