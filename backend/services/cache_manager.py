"""
Advanced Cache Manager for API Responses
Implements intelligent caching with TTL, backup strategies, and performance optimization
"""

import json
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class APICache:
    """Advanced caching system for API responses with TTL and intelligent refresh"""

    def __init__(self, cache_dir: str = "cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)

        # Cache TTL settings (in minutes)
        self.ttl_settings = {
            "espn_games": 30,  # ESPN game data expires in 30 minutes
            "prizepicks_projections": 15,  # PrizePicks projections expire in 15 minutes
            "sportradar_stats": 60,  # SportRadar stats expire in 1 hour
            "theodds_odds": 10,  # TheOdds odds expire in 10 minutes (fastest refresh)
            "player_data": 1440,  # Player data expires in 24 hours
            "lineups": 5,  # Generated lineups expire in 5 minutes
        }

        logger.info(f"🗄️ Cache initialized at: {self.cache_dir}")

    def _get_cache_file(self, cache_key: str) -> Path:
        """Get cache file path for a given key"""
        return self.cache_dir / f"{cache_key}.json"

    def _is_cache_valid(self, cache_file: Path, ttl_minutes: int) -> bool:
        """Check if cache file is still valid based on TTL"""
        if not cache_file.exists():
            return False

        try:
            # Check file modification time
            file_time = datetime.fromtimestamp(
                cache_file.stat().st_mtime, tz=timezone.utc
            )
            expire_time = file_time + timedelta(minutes=ttl_minutes)
            is_valid = datetime.now(timezone.utc) < expire_time

            if is_valid:
                logger.debug(
                    f"✅ Cache hit: {cache_file.name} (expires in {(expire_time - datetime.now(timezone.utc)).total_seconds():.0f}s)"
                )
            else:
                logger.debug(f"⏰ Cache expired: {cache_file.name}")

            return is_valid
        except Exception as e:
            logger.warning(f"❌ Cache validation error for {cache_file}: {e}")
            return False

    async def get(
        self, cache_key: str, cache_type: str = "default"
    ) -> Optional[Dict[str, Any]]:
        """Get data from cache if valid"""
        try:
            cache_file = self._get_cache_file(cache_key)
            ttl_minutes = self.ttl_settings.get(cache_type, 30)

            if self._is_cache_valid(cache_file, ttl_minutes):
                with open(cache_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    logger.info(f"📖 Cache hit: {cache_key} ({cache_type})")
                    return data

            return None
        except Exception as e:
            logger.warning(f"❌ Cache read error for {cache_key}: {e}")
            return None

    async def set(
        self, cache_key: str, data: Dict[str, Any], cache_type: str = "default"
    ) -> bool:
        """Store data in cache"""
        try:
            cache_file = self._get_cache_file(cache_key)

            # Add metadata
            cache_data = {
                "data": data,
                "cached_at": datetime.now(timezone.utc).isoformat(),
                "cache_type": cache_type,
                "ttl_minutes": self.ttl_settings.get(cache_type, 30),
            }

            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(cache_data, f, indent=2, ensure_ascii=False)

            logger.info(
                f"💾 Cached: {cache_key} ({cache_type}) - TTL: {cache_data['ttl_minutes']}min"
            )
            return True
        except Exception as e:
            logger.error(f"❌ Cache write error for {cache_key}: {e}")
            return False

    async def invalidate(self, cache_key: str) -> bool:
        """Manually invalidate a cache entry"""
        try:
            cache_file = self._get_cache_file(cache_key)
            if cache_file.exists():
                cache_file.unlink()
                logger.info(f"🗑️ Cache invalidated: {cache_key}")
                return True
            return False
        except Exception as e:
            logger.error(f"❌ Cache invalidation error for {cache_key}: {e}")
            return False

    async def clear_expired(self) -> int:
        """Clear all expired cache entries"""
        cleared_count = 0
        try:
            for cache_file in self.cache_dir.glob("*.json"):
                try:
                    with open(cache_file, "r", encoding="utf-8") as f:
                        cache_data = json.load(f)

                    cache_type = cache_data.get("cache_type", "default")
                    ttl_minutes = self.ttl_settings.get(cache_type, 30)

                    if not self._is_cache_valid(cache_file, ttl_minutes):
                        cache_file.unlink()
                        cleared_count += 1
                        logger.debug(f"🧹 Cleared expired cache: {cache_file.name}")
                except Exception as e:
                    logger.warning(f"❌ Error clearing cache file {cache_file}: {e}")

            if cleared_count > 0:
                logger.info(f"🧹 Cleared {cleared_count} expired cache entries")

            return cleared_count
        except Exception as e:
            logger.error(f"❌ Cache cleanup error: {e}")
            return 0

    async def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        try:
            total_files = 0
            total_size = 0
            valid_files = 0
            expired_files = 0

            for cache_file in self.cache_dir.glob("*.json"):
                total_files += 1
                total_size += cache_file.stat().st_size

                try:
                    with open(cache_file, "r", encoding="utf-8") as f:
                        cache_data = json.load(f)

                    cache_type = cache_data.get("cache_type", "default")
                    ttl_minutes = self.ttl_settings.get(cache_type, 30)

                    if self._is_cache_valid(cache_file, ttl_minutes):
                        valid_files += 1
                    else:
                        expired_files += 1
                except Exception:
                    expired_files += 1

            return {
                "total_files": total_files,
                "valid_files": valid_files,
                "expired_files": expired_files,
                "total_size_bytes": total_size,
                "total_size_mb": round(total_size / (1024 * 1024), 2),
                "cache_directory": str(self.cache_dir),
            }
        except Exception as e:
            logger.error(f"❌ Cache stats error: {e}")
            return {}


# Global cache instance
cache = APICache()
