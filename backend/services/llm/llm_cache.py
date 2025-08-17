"""
LLM Cache Service - Multi-tier caching for LLM explanations

Provides in-memory and database-backed caching for LLM responses
with content hashing and TTL management.
"""

import hashlib
import json
import time
from collections import OrderedDict
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, Optional, Any

from backend.services.unified_logging import get_logger
from backend.services.unified_config import get_config
from backend.models.modeling import Explanation, ModelVersion

logger = get_logger("llm_cache")


@dataclass
class CacheStats:
    """Cache performance statistics"""
    hits: int = 0
    misses: int = 0
    sets: int = 0
    evictions: int = 0
    
    @property
    def hit_rate(self) -> float:
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0


@dataclass  
class ExplanationRecord:
    """Cached explanation record"""
    edge_id: int
    model_version_id: int
    content: str
    provider: str
    tokens_used: int
    prompt_version: str
    cache_key: str
    created_at: datetime
    expires_at: Optional[datetime] = None


class LLMCache:
    """Multi-tier LLM response cache with memory and database backing"""
    
    def __init__(self, max_memory_size: int = 1000, ttl_seconds: int = 3600):
        self.max_memory_size = max_memory_size
        self.ttl_seconds = ttl_seconds
        
        # In-memory cache (LRU)
        self._memory_cache: OrderedDict[str, ExplanationRecord] = OrderedDict()
        
        # Cache statistics
        self.stats = CacheStats()
        
        # Last cleanup time
        self._last_cleanup = time.time()
        self._cleanup_interval = 300  # 5 minutes
        
        # Configuration
        self.config = get_config()
        
    def generate_cache_key(
        self,
        edge_id: int,
        model_version_id: int,
        valuation_hash: str,
        prompt_template_version: str
    ) -> str:
        """
        Generate deterministic cache key for edge explanation
        
        Args:
            edge_id: Edge identifier
            model_version_id: Model version identifier  
            valuation_hash: Hash of valuation context
            prompt_template_version: Version of prompt template
            
        Returns:
            str: SHA256 hash for cache key
        """
        key_components = f"{edge_id}|{model_version_id}|{valuation_hash}|{prompt_template_version}"
        return hashlib.sha256(key_components.encode()).hexdigest()
    
    def get_cached_explanation(self, cache_key: str) -> Optional[ExplanationRecord]:
        """
        Get cached explanation by key
        
        Args:
            cache_key: Cache key to lookup
            
        Returns:
            ExplanationRecord if found and valid, None otherwise
        """
        # Check memory cache first
        if cache_key in self._memory_cache:
            record = self._memory_cache[cache_key]
            
            # Check if expired
            if self._is_expired(record):
                self._memory_cache.pop(cache_key)
                self.stats.evictions += 1
            else:
                # Move to end (LRU)
                self._memory_cache.move_to_end(cache_key)
                self.stats.hits += 1
                return record
        
        # Check database cache
        db_record = self._get_from_database(cache_key)
        if db_record:
            # Add to memory cache
            self.set_cached_explanation(
                cache_key, 
                db_record.content,
                db_record.provider,
                db_record.tokens_used,
                from_db=True
            )
            self.stats.hits += 1
            return db_record
        
        self.stats.misses += 1
        return None
    
    def set_cached_explanation(
        self,
        cache_key: str,
        content: str,
        provider: str,
        tokens_used: int,
        from_db: bool = False
    ) -> None:
        """
        Store explanation in cache
        
        Args:
            cache_key: Cache key
            content: Explanation content
            provider: LLM provider name
            tokens_used: Number of tokens used
            from_db: Whether this is being loaded from DB (skip DB write)
        """
        now = datetime.now(timezone.utc)
        expires_at = datetime.fromtimestamp(
            time.time() + self.ttl_seconds, 
            tz=timezone.utc
        ) if self.ttl_seconds > 0 else None
        
        # Parse edge and model info from cache key (if needed)
        # For now, we'll store minimal info in memory cache
        record = ExplanationRecord(
            edge_id=0,  # Will be populated from context when needed
            model_version_id=0,  # Will be populated from context when needed
            content=content,
            provider=provider,
            tokens_used=tokens_used,
            prompt_version="v1",  # TODO: Get from context
            cache_key=cache_key,
            created_at=now,
            expires_at=expires_at
        )
        
        # Store in memory cache
        self._memory_cache[cache_key] = record
        self._memory_cache.move_to_end(cache_key)
        
        # Enforce size limit
        while len(self._memory_cache) > self.max_memory_size:
            oldest_key = next(iter(self._memory_cache))
            self._memory_cache.pop(oldest_key)
            self.stats.evictions += 1
        
        if not from_db:
            self.stats.sets += 1
        
        # Periodic cleanup
        self._maybe_cleanup()
    
    def prune_expired(self) -> int:
        """
        Remove expired entries from memory cache
        
        Returns:
            int: Number of entries removed
        """
        expired_keys = []
        for key, record in self._memory_cache.items():
            if self._is_expired(record):
                expired_keys.append(key)
        
        for key in expired_keys:
            self._memory_cache.pop(key)
            self.stats.evictions += 1
        
        logger.debug(f"Pruned {len(expired_keys)} expired cache entries")
        return len(expired_keys)
    
    def clear_cache(self) -> None:
        """Clear all cached entries"""
        self._memory_cache.clear()
        logger.info("LLM cache cleared")
    
    def get_cache_info(self) -> Dict[str, Any]:
        """Get cache information and statistics"""
        return {
            "memory_cache_size": len(self._memory_cache),
            "max_memory_size": self.max_memory_size,
            "ttl_seconds": self.ttl_seconds,
            "stats": {
                "hits": self.stats.hits,
                "misses": self.stats.misses, 
                "sets": self.stats.sets,
                "evictions": self.stats.evictions,
                "hit_rate": self.stats.hit_rate
            }
        }
    
    def _is_expired(self, record: ExplanationRecord) -> bool:
        """Check if cache record is expired"""
        if not record.expires_at:
            return False
        return datetime.now(timezone.utc) > record.expires_at
    
    def _get_from_database(self, cache_key: str) -> Optional[ExplanationRecord]:
        """
        Get explanation from database by cache key
        
        Note: This is a placeholder - actual DB integration would require
        adding cache_key column to explanations table and implementing
        database query logic.
        """
        # TODO: Implement database query
        # For now, return None (memory-only cache)
        return None
    
    def _maybe_cleanup(self) -> None:
        """Perform periodic cleanup if interval has passed"""
        now = time.time()
        if now - self._last_cleanup > self._cleanup_interval:
            self.prune_expired()
            self._last_cleanup = now


# Global cache instance
llm_cache = LLMCache(
    max_memory_size=getattr(get_config().llm, 'cache_max_size', 1000),
    ttl_seconds=getattr(get_config().llm, 'cache_ttl_sec', 3600)
)