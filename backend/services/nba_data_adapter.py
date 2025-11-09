"""
NBA Data Adapter Service

This service provides a high-level interface to NBA data, wrapping the
nba_provider_client and adding caching, error handling, and convenience methods.

This adapter serves as the single source of truth for NBA data across the application,
ensuring all services use real NBA API data instead of mock data.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from functools import lru_cache

from backend.services.nba_provider_client import nba_provider_client

logger = logging.getLogger(__name__)


class NBADataAdapter:
    """
    High-level adapter for NBA data access.
    
    This class provides convenient methods for accessing NBA data and implements
    caching to reduce API calls to stats.nba.com.
    """

    def __init__(self):
        self.client = nba_provider_client
        self._cache: Dict[str, Any] = {}
        self._cache_ttl: Dict[str, datetime] = {}
        self.default_cache_duration = timedelta(minutes=15)

    def _get_from_cache(self, key: str) -> Optional[Any]:
        """Get data from cache if not expired."""
        if key in self._cache and key in self._cache_ttl:
            if datetime.utcnow() < self._cache_ttl[key]:
                logger.debug(f"Cache hit for key: {key}")
                return self._cache[key]
            else:
                # Cache expired, remove it
                logger.debug(f"Cache expired for key: {key}")
                del self._cache[key]
                del self._cache_ttl[key]
        return None

    def _set_cache(self, key: str, value: Any, duration: Optional[timedelta] = None):
        """Set data in cache with TTL."""
        duration = duration or self.default_cache_duration
        self._cache[key] = value
        self._cache_ttl[key] = datetime.utcnow() + duration
        logger.debug(f"Cached data for key: {key} (TTL: {duration})")

    async def get_all_teams(self, use_cache: bool = True) -> List[Dict[str, Any]]:
        """
        Get all NBA teams.
        
        Args:
            use_cache: Whether to use cached data if available
            
        Returns:
            List of team dictionaries with id, name, abbreviation, etc.
        """
        cache_key = "all_teams"
        
        if use_cache:
            cached = self._get_from_cache(cache_key)
            if cached is not None:
                return cached

        try:
            teams = await self.client.fetch_teams()
            if teams:
                # Cache for 1 hour (teams don't change often)
                self._set_cache(cache_key, teams, timedelta(hours=1))
            return teams
        except Exception as e:
            logger.error(f"Failed to fetch NBA teams: {e}")
            # Return cached data even if expired, better than nothing
            return self._cache.get(cache_key, [])

    async def get_team_by_abbreviation(self, abbreviation: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific team by abbreviation (e.g., 'LAL', 'GSW').
        
        Args:
            abbreviation: Team abbreviation (3 letters)
            
        Returns:
            Team dictionary or None if not found
        """
        teams = await self.get_all_teams()
        for team in teams:
            if team.get("abbreviation", "").upper() == abbreviation.upper():
                return team
        return None

    async def get_team_roster(self, team_id: int, use_cache: bool = True) -> List[Dict[str, Any]]:
        """
        Get the roster for a specific team.
        
        Args:
            team_id: NBA team ID
            use_cache: Whether to use cached data if available
            
        Returns:
            List of player dictionaries
        """
        cache_key = f"roster_{team_id}"
        
        if use_cache:
            cached = self._get_from_cache(cache_key)
            if cached is not None:
                return cached

        try:
            players = await self.client.fetch_players(team_id=team_id)
            if players:
                # Cache for 30 minutes (rosters can change)
                self._set_cache(cache_key, players, timedelta(minutes=30))
            return players
        except Exception as e:
            logger.error(f"Failed to fetch roster for team {team_id}: {e}")
            return self._cache.get(cache_key, [])

    async def get_todays_games(self, use_cache: bool = True) -> List[Dict[str, Any]]:
        """
        Get today's NBA games.
        
        Args:
            use_cache: Whether to use cached data if available
            
        Returns:
            List of game dictionaries
        """
        cache_key = f"games_{datetime.utcnow().strftime('%Y-%m-%d')}"
        
        if use_cache:
            cached = self._get_from_cache(cache_key)
            if cached is not None:
                return cached

        try:
            games = await self.client.fetch_todays_games()
            if games:
                # Cache for 10 minutes (games update frequently)
                self._set_cache(cache_key, games, timedelta(minutes=10))
            return games
        except Exception as e:
            logger.error(f"Failed to fetch today's games: {e}")
            return self._cache.get(cache_key, [])

    async def get_games_for_date(self, date_str: str, use_cache: bool = True) -> List[Dict[str, Any]]:
        """
        Get NBA games for a specific date.
        
        Args:
            date_str: Date in YYYY-MM-DD format
            use_cache: Whether to use cached data if available
            
        Returns:
            List of game dictionaries
        """
        cache_key = f"games_{date_str}"
        
        if use_cache:
            cached = self._get_from_cache(cache_key)
            if cached is not None:
                return cached

        try:
            games = await self.client.fetch_games_for_date(date_str)
            if games:
                # Cache for 30 minutes for past/future dates
                self._set_cache(cache_key, games, timedelta(minutes=30))
            return games
        except Exception as e:
            logger.error(f"Failed to fetch games for {date_str}: {e}")
            return self._cache.get(cache_key, [])

    async def get_player_props(
        self,
        target_date: Optional[str] = None,
        lookahead_days: Optional[int] = None,
        use_cache: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Generate player props for upcoming NBA games.
        
        Args:
            target_date: Optional date to start looking (YYYY-MM-DD)
            lookahead_days: Number of days to look ahead
            use_cache: Whether to use cached data if available
            
        Returns:
            List of prop dictionaries
        """
        date_key = target_date or datetime.utcnow().strftime('%Y-%m-%d')
        cache_key = f"props_{date_key}_{lookahead_days or 'default'}"
        
        if use_cache:
            cached = self._get_from_cache(cache_key)
            if cached is not None:
                return cached

        try:
            props = await self.client.generate_player_props(
                target_date=target_date,
                lookahead_days=lookahead_days
            )
            if props:
                # Cache for 15 minutes (props update frequently)
                self._set_cache(cache_key, props, timedelta(minutes=15))
            return props
        except Exception as e:
            logger.error(f"Failed to generate player props: {e}")
            return self._cache.get(cache_key, [])

    async def get_active_players(self, use_cache: bool = True) -> List[Dict[str, Any]]:
        """
        Get all active NBA players.
        
        Args:
            use_cache: Whether to use cached data if available
            
        Returns:
            List of player dictionaries
        """
        cache_key = "active_players"
        
        if use_cache:
            cached = self._get_from_cache(cache_key)
            if cached is not None:
                return cached

        try:
            players = await self.client.fetch_players()
            if players:
                # Cache for 1 hour (player list doesn't change often)
                self._set_cache(cache_key, players, timedelta(hours=1))
            return players
        except Exception as e:
            logger.error(f"Failed to fetch active players: {e}")
            return self._cache.get(cache_key, [])

    async def find_player_by_name(self, player_name: str) -> Optional[Dict[str, Any]]:
        """
        Find a player by name (fuzzy match).
        
        Args:
            player_name: Player name to search for
            
        Returns:
            Player dictionary or None if not found
        """
        players = await self.get_active_players()
        player_name_lower = player_name.lower()
        
        # Try exact match first
        for player in players:
            full_name = player.get("full_name", "").lower()
            if full_name == player_name_lower:
                return player
        
        # Try partial match
        for player in players:
            full_name = player.get("full_name", "").lower()
            if player_name_lower in full_name or full_name in player_name_lower:
                return player
        
        return None

    async def get_upcoming_games(self, days: int = 7) -> List[Dict[str, Any]]:
        """
        Get upcoming NBA games for the next N days.
        
        Args:
            days: Number of days to look ahead
            
        Returns:
            List of game dictionaries
        """
        all_games = []
        today = datetime.utcnow()
        
        for i in range(days):
            date = (today + timedelta(days=i)).strftime("%Y-%m-%d")
            games = await self.get_games_for_date(date)
            all_games.extend(games)
        
        return all_games

    def clear_cache(self):
        """Clear all cached data."""
        self._cache.clear()
        self._cache_ttl.clear()
        logger.info("NBA data cache cleared")

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        total_keys = len(self._cache)
        expired_keys = sum(
            1 for key, expiry in self._cache_ttl.items()
            if datetime.utcnow() >= expiry
        )
        
        return {
            "total_cached_keys": total_keys,
            "expired_keys": expired_keys,
            "active_keys": total_keys - expired_keys,
            "cache_keys": list(self._cache.keys())
        }


# Singleton instance
nba_data_adapter = NBADataAdapter()


# Convenience functions for backward compatibility
async def get_nba_teams() -> List[Dict[str, Any]]:
    """Get all NBA teams."""
    return await nba_data_adapter.get_all_teams()


async def get_nba_players(team_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """Get NBA players, optionally filtered by team."""
    if team_id:
        return await nba_data_adapter.get_team_roster(team_id)
    return await nba_data_adapter.get_active_players()


async def get_nba_games(date: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get NBA games for a specific date or today."""
    if date:
        return await nba_data_adapter.get_games_for_date(date)
    return await nba_data_adapter.get_todays_games()


async def get_nba_props(
    target_date: Optional[str] = None,
    lookahead_days: Optional[int] = None
) -> List[Dict[str, Any]]:
    """Generate NBA player props."""
    return await nba_data_adapter.get_player_props(target_date, lookahead_days)
