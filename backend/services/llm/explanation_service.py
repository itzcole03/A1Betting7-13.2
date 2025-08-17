"""
Explanation Service - Core LLM service for generating edge explanations

Provides high-level API for generating, caching, and retrieving edge explanations
with rate limiting, concurrency control, and comprehensive error handling.
"""

import asyncio
import hashlib
import time
from collections import deque, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Set

from fastapi import HTTPException

from backend.services.unified_config import get_config
from backend.services.unified_logging import get_logger
from backend.services.unified_error_handler import unified_error_handler

from .adapters import get_llm_adapter
from .prompt_templates import build_edge_explanation_prompt, EdgeContext, PROMPT_TEMPLATE_VERSION
from .llm_cache import llm_cache

logger = get_logger("explanation_service")


@dataclass
class ExplanationDTO:
    """Data transfer object for explanation responses"""
    edge_id: int
    model_version_id: int
    prompt_version: str
    content: str
    provider: str
    tokens_used: int
    cache_hit: bool
    created_at: datetime
    generation_time_ms: Optional[int] = None


@dataclass 
class PrefetchSummary:
    """Summary of batch prefetch operation"""
    requested: int
    generated: int
    cache_hits: int
    failures: int
    duration_ms: int


class RateLimiter:
    """Process-local sliding window rate limiter"""
    
    def __init__(self, max_requests: int, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: deque = deque()
    
    def is_allowed(self) -> bool:
        """Check if request is allowed under rate limit"""
        now = time.time()
        
        # Remove old requests outside the window
        while self.requests and self.requests[0] < now - self.window_seconds:
            self.requests.popleft()
        
        if len(self.requests) < self.max_requests:
            self.requests.append(now)
            return True
        
        return False
    
    def time_until_allowed(self) -> int:
        """Get seconds until next request is allowed"""
        if len(self.requests) < self.max_requests:
            return 0
        
        oldest_request = self.requests[0]
        return max(0, int(oldest_request + self.window_seconds - time.time()))


class ExplanationService:
    """Main service for LLM edge explanations"""
    
    def __init__(self):
        self.config = get_config()
        self.llm_config = self.config.llm  # Access LLM config directly
        
        # Rate limiter
        self.rate_limiter = RateLimiter(
            max_requests=self.llm_config.rate_limit_per_min,
            window_seconds=60
        )
        
        # Concurrency locks per edge_id to prevent duplicate generation
        self._generation_locks: Dict[int, asyncio.Lock] = defaultdict(asyncio.Lock)
        
        # Active generation tracking
        self._active_generations: Set[int] = set()
        
        logger.info("ExplanationService initialized")
    
    async def generate_or_get_edge_explanation(
        self, 
        edge_id: int, 
        force_refresh: bool = False
    ) -> ExplanationDTO:
        """
        Generate or retrieve cached edge explanation
        
        Args:
            edge_id: Edge identifier
            force_refresh: Force new generation bypassing cache
            
        Returns:
            ExplanationDTO: Explanation result
            
        Raises:
            HTTPException: For various error conditions
        """
        start_time = time.time()
        
        try:
            # Get edge context (simplified for now)
            async with self._generation_locks[edge_id]:
                edge_context = await self._load_edge_context_simple(edge_id)
                if not edge_context:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Edge {edge_id} not found or insufficient data"
                    )
                
                # Generate cache key
                valuation_hash = self._generate_valuation_hash(edge_context)
                cache_key = llm_cache.generate_cache_key(
                    edge_id=edge_id,
                    model_version_id=edge_context.model_version_id,
                    valuation_hash=valuation_hash,
                    prompt_template_version=PROMPT_TEMPLATE_VERSION
                )
                
                # Check cache unless force refresh
                if not force_refresh:
                    cached = llm_cache.get_cached_explanation(cache_key)
                    if cached:
                        return ExplanationDTO(
                            edge_id=edge_id,
                            model_version_id=edge_context.model_version_id,
                            prompt_version=PROMPT_TEMPLATE_VERSION,
                            content=cached.content,
                            provider=cached.provider,
                            tokens_used=cached.tokens_used,
                            cache_hit=True,
                            created_at=cached.created_at
                        )
                
                # Check rate limit
                if not self.rate_limiter.is_allowed():
                    wait_time = self.rate_limiter.time_until_allowed()
                    raise HTTPException(
                        status_code=429,
                        detail=f"LLM rate limit exceeded. Try again in {wait_time} seconds.",
                        headers={"Retry-After": str(wait_time)}
                    )
                
                # Generate explanation
                try:
                    self._active_generations.add(edge_id)
                    explanation_dto = await self._generate_explanation(
                        edge_id, edge_context, cache_key
                    )
                    
                    duration_ms = int((time.time() - start_time) * 1000)
                    explanation_dto.generation_time_ms = duration_ms
                    
                    return explanation_dto
                    
                finally:
                    self._active_generations.discard(edge_id)
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to generate explanation for edge {edge_id}: {e}")
            
            # Return fallback explanation
            return await self._create_fallback_explanation(edge_id, str(e))
    
    async def prefetch_explanations_for_edges(
        self, 
        edge_ids: List[int], 
        concurrency: int = 4
    ) -> PrefetchSummary:
        """
        Prefetch explanations for multiple edges concurrently
        
        Args:
            edge_ids: List of edge identifiers
            concurrency: Maximum concurrent generations
            
        Returns:
            PrefetchSummary: Summary of prefetch operation
        """
        if not self.llm_config.allow_batch_prefetch:
            raise HTTPException(
                status_code=400,
                detail="Batch prefetch is disabled"
            )
        
        start_time = time.time()
        semaphore = asyncio.Semaphore(concurrency)
        
        # Filter to edges without cached explanations
        edges_to_generate = []
        cache_hits = 0
        
        for edge_id in edge_ids:
            edge_context = await self._load_edge_context_simple(edge_id)
            if edge_context:
                valuation_hash = self._generate_valuation_hash(edge_context)
                cache_key = llm_cache.generate_cache_key(
                    edge_id=edge_id,
                    model_version_id=edge_context.model_version_id,
                    valuation_hash=valuation_hash,
                    prompt_template_version=PROMPT_TEMPLATE_VERSION
                )
                
                if llm_cache.get_cached_explanation(cache_key):
                    cache_hits += 1
                else:
                    edges_to_generate.append(edge_id)
        
        # Generate concurrently
        async def generate_with_semaphore(edge_id: int):
            async with semaphore:
                try:
                    await self.generate_or_get_edge_explanation(edge_id)
                    return True
                except Exception as e:
                    logger.warning(f"Prefetch failed for edge {edge_id}: {e}")
                    return False
        
        results = await asyncio.gather(
            *[generate_with_semaphore(edge_id) for edge_id in edges_to_generate],
            return_exceptions=True
        )
        
        generated = sum(1 for r in results if r is True)
        failures = len(results) - generated
        duration_ms = int((time.time() - start_time) * 1000)
        
        return PrefetchSummary(
            requested=len(edge_ids),
            generated=generated,
            cache_hits=cache_hits,
            failures=failures,
            duration_ms=duration_ms
        )
    
    async def _load_edge_context_simple(self, edge_id: int) -> Optional[EdgeContext]:
        """Load edge context - simplified version with mock data for now"""
        # TODO: Implement real database loading
        logger.info(f"Loading edge context for edge_id: {edge_id}")
        
        # Mock data for testing
        return EdgeContext(
            edge_id=edge_id,
            player_name="Test Player",
            team="Test Team",
            prop_type="POINTS",
            offered_line=25.5,
            fair_line=23.8,
            prob_over=0.45,
            ev=0.08,
            model_version_name="baseline_test_v1",
            model_version_id=1,
            volatility_score=0.35,
            recent_lines=[
                {"line": 26.0, "timestamp": datetime.now()},
                {"line": 25.0, "timestamp": datetime.now()},
            ],
            distribution_family="NORMAL",
            confidence_score=0.75
        )
    
    async def _generate_explanation(
        self, 
        edge_id: int, 
        edge_context: EdgeContext, 
        cache_key: str
    ) -> ExplanationDTO:
        """Generate new explanation using LLM"""
        try:
            # Build prompt
            prompt = build_edge_explanation_prompt(edge_context)
            
            # Log prompt if debug enabled
            if self.llm_config.log_prompt_debug:
                truncated_prompt = prompt[:300] + "..." if len(prompt) > 300 else prompt
                logger.debug(f"LLM prompt for edge {edge_id}: {truncated_prompt}")
            
            # Get LLM adapter
            adapter = get_llm_adapter()
            
            # Generate response
            result = await adapter.generate(
                prompt=prompt,
                max_tokens=self.llm_config.max_tokens,
                temperature=self.llm_config.temperature,
                timeout=self.llm_config.timeout_sec
            )
            
            # Cache result
            llm_cache.set_cached_explanation(
                cache_key=cache_key,
                content=result.content,
                provider=result.provider,
                tokens_used=result.tokens_used
            )
            
            # TODO: Persist to database
            logger.info(f"Generated explanation for edge {edge_id}: {len(result.content)} chars")
            
            return ExplanationDTO(
                edge_id=edge_id,
                model_version_id=edge_context.model_version_id,
                prompt_version=PROMPT_TEMPLATE_VERSION,
                content=result.content,
                provider=result.provider,
                tokens_used=result.tokens_used,
                cache_hit=False,
                created_at=datetime.now(timezone.utc),
                generation_time_ms=result.generation_time_ms
            )
            
        except Exception as e:
            logger.error(f"LLM generation failed for edge {edge_id}: {e}")
            raise
    
    async def _create_fallback_explanation(
        self, 
        edge_id: int, 
        error_message: str
    ) -> ExplanationDTO:
        """Create fallback explanation when generation fails"""
        fallback_content = f"Automated explanation unavailable (provider failure). Edge {edge_id} analysis pending. {error_message[:100]}"
        
        return ExplanationDTO(
            edge_id=edge_id,
            model_version_id=0,
            prompt_version=PROMPT_TEMPLATE_VERSION,
            content=fallback_content,
            provider="fallback",
            tokens_used=0,
            cache_hit=False,
            created_at=datetime.now(timezone.utc)
        )
    
    def _generate_valuation_hash(self, edge_context: EdgeContext) -> str:
        """Generate hash of valuation context for cache key"""
        context_data = {
            "offered_line": edge_context.offered_line,
            "fair_line": edge_context.fair_line,
            "prob_over": edge_context.prob_over,
            "ev": edge_context.ev,
            "volatility_score": edge_context.volatility_score
        }
        
        context_str = str(sorted(context_data.items()))
        return hashlib.sha256(context_str.encode()).hexdigest()[:16]


# Global service instance
explanation_service = ExplanationService()