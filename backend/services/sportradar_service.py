"""
Comprehensive Sportradar API Integration Service
Production-ready service for official sports data with real-time push feeds
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple, Union
from dataclasses import dataclass, field

import aiohttp
import websockets
from pydantic import BaseModel

from backend.services.enhanced_data_pipeline import enhanced_data_pipeline
from backend.services.intelligent_cache_service import intelligent_cache_service
from backend.config_manager import A1BettingConfig
from backend.utils.enhanced_logging import get_logger

logger = get_logger("sportradar_service")


class SportType(Enum):
    """Supported sports types"""
    MLB = "mlb"
    NBA = "nba"
    NFL = "nfl"
    NHL = "nhl"


class DataType(Enum):
    """Types of data available from Sportradar"""
    SCHEDULES = "schedules"
    LIVE_SCORES = "live_scores"
    PLAYER_STATS = "player_stats"
    TEAM_STATS = "team_stats"
    INJURY_REPORTS = "injury_reports"
    ODDS = "odds"
    PLAYER_PROPS = "player_props"
    GAME_TIMELINE = "game_timeline"


@dataclass
class SportradarEndpoint:
    """Sportradar API endpoint configuration"""
    sport: SportType
    data_type: DataType
    url_template: str
    version: str
    requires_auth: bool = True
    cache_ttl: int = 300
    rate_limit: int = 60  # requests per minute


class SportradarService:
    """
    Comprehensive Sportradar API service with:
    - Official sports data integration
    - Real-time push feeds via WebSocket
    - Intelligent caching and rate limiting
    - Data transformation and mapping
    - Circuit breaker protection
    """

    def __init__(self):
        self.config = A1BettingConfig()
        self.api_key = self.config.sportradar_api_key
        self.base_url = "https://api.sportradar.com"
        
        # API endpoints configuration
        self.endpoints = self._initialize_endpoints()
        
        # Push feed configuration
        self.push_feed_url = "wss://api.sportradar.com/push"
        self.push_connections: Dict[str, websockets.WebSocketClientProtocol] = {}
        
        # Session management
        self.session: Optional[aiohttp.ClientSession] = None
        self._session_timeout = aiohttp.ClientTimeout(total=30, connect=10)
        
        # Background tasks
        self._push_feed_task: Optional[asyncio.Task] = None
        self._heartbeat_task: Optional[asyncio.Task] = None
        
        # Subscriptions
        self.active_subscriptions: Set[str] = set()
        self.subscription_callbacks: Dict[str, List[callable]] = {}

    def _initialize_endpoints(self) -> Dict[Tuple[SportType, DataType], SportradarEndpoint]:
        """Initialize Sportradar API endpoints configuration"""
        endpoints = {}
        
        # MLB endpoints
        endpoints[(SportType.MLB, DataType.SCHEDULES)] = SportradarEndpoint(
            sport=SportType.MLB,
            data_type=DataType.SCHEDULES,
            url_template=f"{self.base_url}/mlb/trial/v8/en/games/{{year}}/{{season}}/schedule.json",
            version="v8",
            cache_ttl=3600  # Schedule changes less frequently
        )
        
        endpoints[(SportType.MLB, DataType.LIVE_SCORES)] = SportradarEndpoint(
            sport=SportType.MLB,
            data_type=DataType.LIVE_SCORES,
            url_template=f"{self.base_url}/mlb/trial/v8/en/games/live.json",
            version="v8",
            cache_ttl=30  # Live data needs frequent updates
        )
        
        endpoints[(SportType.MLB, DataType.PLAYER_STATS)] = SportradarEndpoint(
            sport=SportType.MLB,
            data_type=DataType.PLAYER_STATS,
            url_template=f"{self.base_url}/mlb/trial/v8/en/players/{{player_id}}/profile.json",
            version="v8",
            cache_ttl=1800
        )
        
        endpoints[(SportType.MLB, DataType.TEAM_STATS)] = SportradarEndpoint(
            sport=SportType.MLB,
            data_type=DataType.TEAM_STATS,
            url_template=f"{self.base_url}/mlb/trial/v8/en/teams/{{team_id}}/profile.json",
            version="v8",
            cache_ttl=1800
        )
        
        endpoints[(SportType.MLB, DataType.INJURY_REPORTS)] = SportradarEndpoint(
            sport=SportType.MLB,
            data_type=DataType.INJURY_REPORTS,
            url_template=f"{self.base_url}/mlb/trial/v8/en/league/injuries.json",
            version="v8",
            cache_ttl=600  # Injury reports updated frequently
        )
        
        # NBA endpoints
        endpoints[(SportType.NBA, DataType.SCHEDULES)] = SportradarEndpoint(
            sport=SportType.NBA,
            data_type=DataType.SCHEDULES,
            url_template=f"{self.base_url}/nba/trial/v8/en/games/{{year}}/{{season}}/schedule.json",
            version="v8",
            cache_ttl=3600
        )
        
        endpoints[(SportType.NBA, DataType.LIVE_SCORES)] = SportradarEndpoint(
            sport=SportType.NBA,
            data_type=DataType.LIVE_SCORES,
            url_template=f"{self.base_url}/nba/trial/v8/en/games/live.json",
            version="v8",
            cache_ttl=30
        )
        
        # NFL endpoints
        endpoints[(SportType.NFL, DataType.SCHEDULES)] = SportradarEndpoint(
            sport=SportType.NFL,
            data_type=DataType.SCHEDULES,
            url_template=f"{self.base_url}/nfl/official/trial/v7/en/games/{{year}}/{{season}}/schedule.json",
            version="v7",
            cache_ttl=3600
        )
        
        endpoints[(SportType.NFL, DataType.LIVE_SCORES)] = SportradarEndpoint(
            sport=SportType.NFL,
            data_type=DataType.LIVE_SCORES,
            url_template=f"{self.base_url}/nfl/official/trial/v7/en/games/live.json",
            version="v7",
            cache_ttl=30
        )
        
        # NHL endpoints
        endpoints[(SportType.NHL, DataType.SCHEDULES)] = SportradarEndpoint(
            sport=SportType.NHL,
            data_type=DataType.SCHEDULES,
            url_template=f"{self.base_url}/nhl/trial/v7/en/games/{{year}}/{{season}}/schedule.json",
            version="v7",
            cache_ttl=3600
        )
        
        endpoints[(SportType.NHL, DataType.LIVE_SCORES)] = SportradarEndpoint(
            sport=SportType.NHL,
            data_type=DataType.LIVE_SCORES,
            url_template=f"{self.base_url}/nhl/trial/v7/en/games/live.json",
            version="v7",
            cache_ttl=30
        )
        
        return endpoints

    async def initialize(self):
        """Initialize Sportradar service"""
        if not self.api_key:
            logger.warning("⚠️ Sportradar API key not configured - service will use demo mode")
            return False
        
        # Register with enhanced data pipeline
        enhanced_data_pipeline.register_data_source(
            "sportradar",
            failure_threshold=3,
            recovery_timeout=120,
            success_threshold=2
        )
        
        # Create HTTP session
        connector = aiohttp.TCPConnector(
            limit=100,
            limit_per_host=30,
            keepalive_timeout=30,
            enable_cleanup_closed=True
        )
        
        self.session = aiohttp.ClientSession(
            connector=connector,
            timeout=self._session_timeout,
            headers={
                "User-Agent": "A1Betting/1.0",
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate"
            }
        )
        
        # Test connection
        try:
            await self._test_connection()
            logger.info("✅ Sportradar service initialized successfully")
            return True
        except Exception as e:
            logger.error(f"❌ Sportradar initialization failed: {e}")
            return False

    async def _test_connection(self):
        """Test Sportradar API connection"""
        test_url = f"{self.base_url}/mlb/trial/v8/en/league/hierarchy.json"
        
        async def test_fetch():
            async with self.session.get(f"{test_url}?api_key={self.api_key}") as response:
                if response.status == 200:
                    return await response.json()
                elif response.status == 401:
                    raise Exception("Invalid Sportradar API key")
                elif response.status == 403:
                    raise Exception("Sportradar API access forbidden - check subscription")
                else:
                    raise Exception(f"Sportradar API test failed: {response.status}")
        
        await enhanced_data_pipeline.fetch_data_with_resilience(
            "sportradar_test",
            test_fetch,
            use_cache=False
        )

    async def get_schedules(self, sport: SportType, year: int = None, season: str = "REG") -> Optional[Dict[str, Any]]:
        """Get game schedules for a sport"""
        if year is None:
            year = datetime.now().year
        
        endpoint = self.endpoints.get((sport, DataType.SCHEDULES))
        if not endpoint:
            logger.error(f"❌ No schedule endpoint configured for {sport.value}")
            return None
        
        url = endpoint.url_template.format(year=year, season=season)
        
        async def fetch_schedules():
            return await self._make_api_request(url, endpoint)
        
        return await enhanced_data_pipeline.fetch_data_with_resilience(
            f"sportradar_schedules_{sport.value}_{year}_{season}",
            fetch_schedules,
            cache_ttl=endpoint.cache_ttl
        )

    async def get_live_scores(self, sport: SportType) -> Optional[Dict[str, Any]]:
        """Get live scores for a sport"""
        endpoint = self.endpoints.get((sport, DataType.LIVE_SCORES))
        if not endpoint:
            logger.error(f"❌ No live scores endpoint configured for {sport.value}")
            return None
        
        async def fetch_live_scores():
            return await self._make_api_request(endpoint.url_template, endpoint)
        
        return await enhanced_data_pipeline.fetch_data_with_resilience(
            f"sportradar_live_{sport.value}",
            fetch_live_scores,
            cache_ttl=endpoint.cache_ttl
        )

    async def get_player_stats(self, sport: SportType, player_id: str) -> Optional[Dict[str, Any]]:
        """Get player statistics"""
        endpoint = self.endpoints.get((sport, DataType.PLAYER_STATS))
        if not endpoint:
            logger.error(f"❌ No player stats endpoint configured for {sport.value}")
            return None
        
        url = endpoint.url_template.format(player_id=player_id)
        
        async def fetch_player_stats():
            return await self._make_api_request(url, endpoint)
        
        return await enhanced_data_pipeline.fetch_data_with_resilience(
            f"sportradar_player_{sport.value}_{player_id}",
            fetch_player_stats,
            cache_ttl=endpoint.cache_ttl
        )

    async def get_team_stats(self, sport: SportType, team_id: str) -> Optional[Dict[str, Any]]:
        """Get team statistics"""
        endpoint = self.endpoints.get((sport, DataType.TEAM_STATS))
        if not endpoint:
            logger.error(f"❌ No team stats endpoint configured for {sport.value}")
            return None
        
        url = endpoint.url_template.format(team_id=team_id)
        
        async def fetch_team_stats():
            return await self._make_api_request(url, endpoint)
        
        return await enhanced_data_pipeline.fetch_data_with_resilience(
            f"sportradar_team_{sport.value}_{team_id}",
            fetch_team_stats,
            cache_ttl=endpoint.cache_ttl
        )

    async def get_injury_reports(self, sport: SportType) -> Optional[Dict[str, Any]]:
        """Get injury reports for a sport"""
        endpoint = self.endpoints.get((sport, DataType.INJURY_REPORTS))
        if not endpoint:
            logger.error(f"❌ No injury reports endpoint configured for {sport.value}")
            return None
        
        async def fetch_injuries():
            return await self._make_api_request(endpoint.url_template, endpoint)
        
        return await enhanced_data_pipeline.fetch_data_with_resilience(
            f"sportradar_injuries_{sport.value}",
            fetch_injuries,
            cache_ttl=endpoint.cache_ttl
        )

    async def get_all_sports_data(self, sports: List[SportType] = None) -> Dict[str, Dict[str, Any]]:
        """Get comprehensive data for multiple sports in parallel"""
        if sports is None:
            sports = [SportType.MLB, SportType.NBA, SportType.NFL, SportType.NHL]
        
        # Prepare parallel requests
        requests = []
        
        for sport in sports:
            # Add live scores request
            requests.append((
                f"live_scores_{sport.value}",
                self.get_live_scores,
                (sport,),
                {}
            ))
            
            # Add schedules request
            requests.append((
                f"schedules_{sport.value}",
                self.get_schedules,
                (sport,),
                {}
            ))
            
            # Add injury reports request
            requests.append((
                f"injuries_{sport.value}",
                self.get_injury_reports,
                (sport,),
                {}
            ))
        
        # Execute parallel requests
        results = await enhanced_data_pipeline.fetch_parallel_data(
            requests,
            max_failures=len(requests) // 2  # Allow 50% failures
        )
        
        # Organize results by sport
        organized_results = {}
        for sport in sports:
            organized_results[sport.value] = {
                "live_scores": results.get(f"live_scores_{sport.value}"),
                "schedules": results.get(f"schedules_{sport.value}"),
                "injuries": results.get(f"injuries_{sport.value}")
            }
        
        return organized_results

    async def _make_api_request(self, url: str, endpoint: SportradarEndpoint) -> Dict[str, Any]:
        """Make authenticated API request to Sportradar"""
        if not self.api_key:
            raise Exception("Sportradar API key not configured")
        
        # Add API key to URL
        separator = "&" if "?" in url else "?"
        full_url = f"{url}{separator}api_key={self.api_key}"
        
        async with self.session.get(full_url) as response:
            # Handle rate limiting
            if response.status == 429:
                retry_after = int(response.headers.get("Retry-After", 60))
                logger.warning(f"⚠️ Sportradar rate limit hit, retry after {retry_after}s")
                raise Exception(f"Rate limit exceeded, retry after {retry_after} seconds")
            
            # Handle authentication errors
            elif response.status == 401:
                logger.error("❌ Sportradar authentication failed")
                raise Exception("Invalid Sportradar API key")
            
            # Handle forbidden access
            elif response.status == 403:
                logger.error("❌ Sportradar access forbidden")
                raise Exception("Sportradar API access forbidden - check subscription")
            
            # Handle successful response
            elif response.status == 200:
                data = await response.json()
                
                # Log quota information if available
                quota_remaining = response.headers.get("X-Requests-Remaining")
                if quota_remaining:
                    logger.debug(f"📊 Sportradar quota remaining: {quota_remaining}")
                
                return data
            
            # Handle other errors
            else:
                error_text = await response.text()
                logger.error(f"❌ Sportradar API error {response.status}: {error_text}")
                raise Exception(f"Sportradar API error: {response.status} {error_text}")

    async def start_push_feeds(self, sports: List[SportType] = None):
        """Start real-time push feeds for live data"""
        if not self.api_key:
            logger.warning("⚠️ Cannot start push feeds without Sportradar API key")
            return
        
        if sports is None:
            sports = [SportType.MLB, SportType.NBA, SportType.NFL, SportType.NHL]
        
        try:
            # Start push feed connection
            self._push_feed_task = asyncio.create_task(
                self._manage_push_feeds(sports)
            )
            
            # Start heartbeat task
            self._heartbeat_task = asyncio.create_task(
                self._heartbeat_monitor()
            )
            
            logger.info(f"🌐 Started Sportradar push feeds for {len(sports)} sports")
            
        except Exception as e:
            logger.error(f"❌ Failed to start push feeds: {e}")

    async def _manage_push_feeds(self, sports: List[SportType]):
        """Manage WebSocket push feed connections"""
        while True:
            try:
                # Connect to push feed
                push_url = f"{self.push_feed_url}?api_key={self.api_key}"
                
                async with websockets.connect(push_url) as websocket:
                    logger.info("🔗 Connected to Sportradar push feed")
                    
                    # Subscribe to sports
                    for sport in sports:
                        subscription = {
                            "op": "subscribe",
                            "sport": sport.value,
                            "type": "live_scores"
                        }
                        await websocket.send(json.dumps(subscription))
                        self.active_subscriptions.add(f"{sport.value}_live")
                        logger.info(f"📡 Subscribed to {sport.value} live updates")
                    
                    # Listen for messages
                    async for message in websocket:
                        try:
                            data = json.loads(message)
                            await self._process_push_message(data)
                        except json.JSONDecodeError:
                            logger.warning(f"⚠️ Invalid JSON from push feed: {message}")
                        except Exception as e:
                            logger.error(f"❌ Error processing push message: {e}")
            
            except websockets.exceptions.ConnectionClosed:
                logger.warning("⚠️ Push feed connection closed, reconnecting...")
                await asyncio.sleep(5)
            except Exception as e:
                logger.error(f"❌ Push feed error: {e}")
                await asyncio.sleep(10)

    async def _process_push_message(self, data: Dict[str, Any]):
        """Process incoming push feed message"""
        try:
            message_type = data.get("type")
            sport = data.get("sport")
            payload = data.get("payload", {})
            
            logger.debug(f"📨 Push message: {message_type} for {sport}")
            
            # Update cache with real-time data
            if message_type == "live_score_update" and sport:
                cache_key = f"sportradar_live_{sport}"
                await intelligent_cache_service.set(
                    cache_key,
                    payload,
                    ttl_seconds=30,
                    priority="high",
                    use_pipeline=False  # Immediate update for live data
                )
                
                # Trigger cache invalidation for related data
                await intelligent_cache_service.invalidate_pattern(f"*{sport}*live*")
            
            # Execute callbacks if any
            subscription_key = f"{sport}_live"
            if subscription_key in self.subscription_callbacks:
                for callback in self.subscription_callbacks[subscription_key]:
                    try:
                        await callback(data)
                    except Exception as e:
                        logger.error(f"❌ Callback error: {e}")
        
        except Exception as e:
            logger.error(f"❌ Error processing push message: {e}")

    async def _heartbeat_monitor(self):
        """Monitor push feed connection health"""
        while True:
            try:
                await asyncio.sleep(30)  # Check every 30 seconds
                
                # Check if subscriptions are still active
                if self.active_subscriptions:
                    logger.debug(f"💓 Push feed heartbeat - {len(self.active_subscriptions)} active subscriptions")
                
            except Exception as e:
                logger.error(f"❌ Heartbeat monitor error: {e}")

    def subscribe_to_updates(self, sport: SportType, callback: callable):
        """Subscribe to real-time updates for a sport"""
        subscription_key = f"{sport.value}_live"
        
        if subscription_key not in self.subscription_callbacks:
            self.subscription_callbacks[subscription_key] = []
        
        self.subscription_callbacks[subscription_key].append(callback)
        logger.info(f"📡 Added callback for {sport.value} updates")

    async def get_health_status(self) -> Dict[str, Any]:
        """Get Sportradar service health status"""
        health = {
            "service": "sportradar",
            "status": "healthy",
            "api_key_configured": bool(self.api_key),
            "push_feeds": {
                "active": bool(self._push_feed_task and not self._push_feed_task.done()),
                "subscriptions": len(self.active_subscriptions),
                "subscription_types": list(self.active_subscriptions)
            },
            "endpoints": {
                "total": len(self.endpoints),
                "by_sport": {}
            }
        }
        
        # Count endpoints by sport
        for (sport, data_type), endpoint in self.endpoints.items():
            sport_name = sport.value
            if sport_name not in health["endpoints"]["by_sport"]:
                health["endpoints"]["by_sport"][sport_name] = 0
            health["endpoints"]["by_sport"][sport_name] += 1
        
        # Check session health
        if self.session and not self.session.closed:
            health["session"] = "active"
        else:
            health["session"] = "inactive"
            health["status"] = "degraded"
        
        return health

    async def close(self):
        """Cleanup Sportradar service resources"""
        logger.info("🔄 Shutting down Sportradar service...")
        
        # Cancel background tasks
        for task in [self._push_feed_task, self._heartbeat_task]:
            if task and not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
        
        # Close push feed connections
        for connection in self.push_connections.values():
            await connection.close()
        
        # Close HTTP session
        if self.session and not self.session.closed:
            await self.session.close()
        
        self.active_subscriptions.clear()
        self.subscription_callbacks.clear()
        
        logger.info("✅ Sportradar service shutdown completed")


# Global instance
sportradar_service = SportradarService()
