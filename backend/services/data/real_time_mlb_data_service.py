"""
Real-Time MLB Data Integration Service - Section 4 Implementation

Provides live MLB data feeds including:
- Real-time game updates and scores
- Player status and lineup changes
- Live at-bat results and play-by-play
- Injury reports and roster updates
- Starting pitcher confirmations

Integrates with:
- MLB Stats API (official)
- ESPN MLB API (supplementary)
- Baseball Savant (advanced metrics)
"""

import asyncio
import logging
import json
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
from typing import Dict, Any, Optional, List, Set
import aiohttp

logger = logging.getLogger(__name__)


class GameState(Enum):
    """MLB game states"""
    SCHEDULED = "scheduled"
    PRE_GAME = "pre_game"
    IN_PROGRESS = "in_progress"
    DELAYED = "delayed"
    POSTPONED = "postponed"
    SUSPENDED = "suspended"
    FINAL = "final"
    COMPLETED = "completed"


class PlayerStatus(Enum):
    """Player status types"""
    ACTIVE = "active"
    INJURED = "injured"
    DAY_TO_DAY = "day_to_day"
    DISABLED_LIST = "disabled_list"
    BEREAVEMENT = "bereavement"
    PATERNITY = "paternity"
    SUSPENDED = "suspended"


@dataclass
class LiveGameData:
    """Live game data structure"""
    game_id: str
    home_team: str
    away_team: str
    game_state: GameState
    inning: int
    inning_half: str  # "top" or "bottom"
    home_score: int
    away_score: int
    balls: int
    strikes: int
    outs: int
    last_update: datetime
    
    # Lineup and pitcher info
    home_starting_pitcher: Optional[str] = None
    away_starting_pitcher: Optional[str] = None
    current_batter: Optional[str] = None
    current_pitcher: Optional[str] = None
    
    # Game context
    weather_conditions: Optional[Dict[str, Any]] = None
    ballpark: Optional[str] = None


@dataclass
class PlayerUpdate:
    """Player status update"""
    player_id: str
    player_name: str
    team: str
    status: PlayerStatus
    injury_type: Optional[str] = None
    expected_return: Optional[str] = None
    impact_level: str = "MEDIUM"  # LOW, MEDIUM, HIGH
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now(timezone.utc)


@dataclass
class LineupChange:
    """Lineup change notification"""
    game_id: str
    team: str
    change_type: str  # "SUBSTITUTION", "INJURY", "EJECTION"
    player_out: Optional[str] = None
    player_in: Optional[str] = None
    position: Optional[str] = None
    inning: Optional[int] = None
    reason: Optional[str] = None
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now(timezone.utc)


class RealTimeMLBDataService:
    """
    Real-time MLB data integration service
    
    Provides live updates for:
    - Game scores and states
    - Player lineups and substitutions  
    - Injury reports and status changes
    - Weather and ballpark conditions
    """
    
    def __init__(self):
        self.name = "real_time_mlb_data_service"
        self.version = "1.0"
        
        # API endpoints
        self.mlb_api_base = "https://statsapi.mlb.com/api/v1"
        self.espn_api_base = "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb"
        
        # Session for HTTP requests
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Data caches
        self.live_games: Dict[str, LiveGameData] = {}
        self.player_updates: List[PlayerUpdate] = []
        self.lineup_changes: Dict[str, List[LineupChange]] = {}
        
        # Monitoring state
        self.monitoring_active = False
        self.monitored_games: Set[str] = set()
        self.update_callbacks: List = []
        
        # Rate limiting
        self.last_mlb_api_call = datetime.min
        self.last_espn_api_call = datetime.min
        self.api_call_interval = timedelta(seconds=3)  # 3 second minimum between calls
        
        logger.info("Real-Time MLB Data Service initialized")
    
    async def initialize(self):
        """Initialize HTTP session and connections"""
        if not self.session:
            timeout = aiohttp.ClientTimeout(total=10)
            self.session = aiohttp.ClientSession(timeout=timeout)
        
        logger.info("Real-Time MLB Data Service session initialized")
    
    async def shutdown(self):
        """Cleanup resources"""
        if self.session:
            await self.session.close()
            self.session = None
        
        self.monitoring_active = False
        logger.info("Real-Time MLB Data Service shutdown complete")
    
    async def start_monitoring(self, game_ids: List[str]):
        """Start monitoring specified games for live updates"""
        if not self.session:
            await self.initialize()
        
        self.monitored_games.update(game_ids)
        
        if not self.monitoring_active:
            self.monitoring_active = True
            # Start monitoring task
            asyncio.create_task(self._monitoring_loop())
            logger.info(f"Started monitoring {len(game_ids)} games")
        else:
            logger.info(f"Added {len(game_ids)} games to existing monitoring")
    
    async def stop_monitoring(self, game_ids: Optional[List[str]] = None):
        """Stop monitoring specified games or all games"""
        if game_ids:
            self.monitored_games -= set(game_ids)
            logger.info(f"Stopped monitoring {len(game_ids)} specific games")
        else:
            self.monitored_games.clear()
            self.monitoring_active = False
            logger.info("Stopped all game monitoring")
    
    async def get_todays_games(self) -> List[Dict[str, Any]]:
        """Get today's MLB games"""
        try:
            await self._ensure_session()
            
            today = datetime.now().strftime("%Y-%m-%d")
            url = f"{self.mlb_api_base}/schedule?sportId=1&date={today}"
            
            await self._rate_limit_mlb_api()
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    games = []
                    
                    for date_data in data.get("dates", []):
                        for game in date_data.get("games", []):
                            games.append({
                                "game_id": str(game["gamePk"]),
                                "home_team": game["teams"]["home"]["team"]["name"],
                                "away_team": game["teams"]["away"]["team"]["name"],
                                "game_time": game["gameDate"],
                                "status": game["status"]["detailedState"],
                                "ballpark": game.get("venue", {}).get("name"),
                                "home_probable_pitcher": game["teams"]["home"].get("probablePitcher", {}).get("fullName"),
                                "away_probable_pitcher": game["teams"]["away"].get("probablePitcher", {}).get("fullName")
                            })
                    
                    logger.info(f"Retrieved {len(games)} games for {today}")
                    return games
                else:
                    logger.error(f"MLB API error: {response.status}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error fetching today's games: {e}")
            return []
    
    async def get_live_game_data(self, game_id: str) -> Optional[LiveGameData]:
        """Get live data for a specific game"""
        try:
            await self._ensure_session()
            
            url = f"{self.mlb_api_base}/game/{game_id}/linescore"
            
            await self._rate_limit_mlb_api()
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Extract game data
                    game_data = data.get("game", {})
                    linescore = data.get("currentGame", {})
                    
                    # Determine game state
                    status_code = game_data.get("status", {}).get("statusCode")
                    if status_code in ["S", "P", "PW"]:  # Scheduled, Pre-Game, Preview
                        game_state = GameState.SCHEDULED
                    elif status_code in ["I", "IR", "IW"]:  # In Progress, In Progress - Rain, In Progress - Warmup
                        game_state = GameState.IN_PROGRESS
                    elif status_code in ["F", "FR", "FG"]:  # Final, Final - Rain, Final - Game Over
                        game_state = GameState.FINAL
                    elif status_code in ["D", "DR"]:  # Delayed, Delayed - Rain
                        game_state = GameState.DELAYED
                    elif status_code == "O":  # Postponed
                        game_state = GameState.POSTPONED
                    else:
                        game_state = GameState.SCHEDULED
                    
                    live_data = LiveGameData(
                        game_id=game_id,
                        home_team=game_data.get("teams", {}).get("home", {}).get("team", {}).get("name", "Unknown"),
                        away_team=game_data.get("teams", {}).get("away", {}).get("team", {}).get("name", "Unknown"),
                        game_state=game_state,
                        inning=linescore.get("currentInning", 1),
                        inning_half=linescore.get("inningHalf", "top").lower(),
                        home_score=linescore.get("teams", {}).get("home", {}).get("runs", 0),
                        away_score=linescore.get("teams", {}).get("away", {}).get("runs", 0),
                        balls=linescore.get("balls", 0),
                        strikes=linescore.get("strikes", 0),
                        outs=linescore.get("outs", 0),
                        last_update=datetime.now(timezone.utc),
                        ballpark=game_data.get("venue", {}).get("name")
                    )
                    
                    # Cache the data
                    self.live_games[game_id] = live_data
                    
                    return live_data
                else:
                    logger.error(f"MLB API error for game {game_id}: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error fetching live game data for {game_id}: {e}")
            return None
    
    async def get_player_status_updates(self, team: Optional[str] = None) -> List[PlayerUpdate]:
        """Get recent player status updates"""
        try:
            await self._ensure_session()
            
            # Use ESPN API for injury reports
            url = f"{self.espn_api_base}/teams"
            if team:
                # Would need team ID mapping for ESPN API
                pass
            
            await self._rate_limit_espn_api()
            
            # This is a simplified implementation - in production would integrate
            # with multiple injury report sources
            
            # Return cached updates for now
            recent_updates = [
                update for update in self.player_updates
                if (datetime.now(timezone.utc) - update.timestamp).days <= 1
            ]
            
            return recent_updates
            
        except Exception as e:
            logger.error(f"Error fetching player status updates: {e}")
            return []
    
    async def get_lineup_changes(self, game_id: str) -> List[LineupChange]:
        """Get lineup changes for a specific game"""
        return self.lineup_changes.get(game_id, [])
    
    async def _monitoring_loop(self):
        """Main monitoring loop for live updates"""
        logger.info("Starting real-time monitoring loop")
        
        while self.monitoring_active:
            try:
                if not self.monitored_games:
                    # No games to monitor, wait and continue
                    await asyncio.sleep(10)
                    continue
                
                # Update live game data for all monitored games
                for game_id in list(self.monitored_games):
                    try:
                        new_data = await self.get_live_game_data(game_id)
                        
                        if new_data:
                            # Check for changes and trigger callbacks
                            await self._process_game_update(game_id, new_data)
                        
                        # Small delay between game updates
                        await asyncio.sleep(1)
                        
                    except Exception as e:
                        logger.error(f"Error updating game {game_id}: {e}")
                
                # Wait before next polling cycle
                await asyncio.sleep(30)  # Poll every 30 seconds
                
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(60)  # Wait longer on error
    
    async def _process_game_update(self, game_id: str, new_data: LiveGameData):
        """Process game update and trigger callbacks if significant changes"""
        old_data = self.live_games.get(game_id)
        
        significant_change = False
        changes = []
        
        if not old_data:
            significant_change = True
            changes.append("INITIAL_DATA")
        else:
            # Check for score changes
            if (new_data.home_score != old_data.home_score or 
                new_data.away_score != old_data.away_score):
                significant_change = True
                changes.append("SCORE_CHANGE")
            
            # Check for inning changes
            if (new_data.inning != old_data.inning or 
                new_data.inning_half != old_data.inning_half):
                significant_change = True
                changes.append("INNING_CHANGE")
            
            # Check for game state changes
            if new_data.game_state != old_data.game_state:
                significant_change = True
                changes.append("STATE_CHANGE")
            
            # Check for count changes (less significant)
            if (new_data.balls != old_data.balls or 
                new_data.strikes != old_data.strikes or 
                new_data.outs != old_data.outs):
                changes.append("COUNT_CHANGE")
        
        # Update cached data
        self.live_games[game_id] = new_data
        
        # Trigger callbacks for significant changes
        if significant_change and self.update_callbacks:
            await self._trigger_update_callbacks(game_id, new_data, changes)
    
    async def _trigger_update_callbacks(self, game_id: str, data: LiveGameData, changes: List[str]):
        """Trigger registered callbacks for game updates"""
        for callback in self.update_callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(game_id, data, changes)
                else:
                    callback(game_id, data, changes)
            except Exception as e:
                logger.error(f"Error in update callback: {e}")
    
    def register_update_callback(self, callback):
        """Register callback for live updates"""
        self.update_callbacks.append(callback)
        logger.info(f"Registered update callback: {callback.__name__}")
    
    def remove_update_callback(self, callback):
        """Remove update callback"""
        if callback in self.update_callbacks:
            self.update_callbacks.remove(callback)
            logger.info(f"Removed update callback: {callback.__name__}")
    
    async def _ensure_session(self):
        """Ensure HTTP session is available"""
        if not self.session:
            await self.initialize()
    
    async def _rate_limit_mlb_api(self):
        """Rate limit MLB API calls"""
        now = datetime.now()
        if (now - self.last_mlb_api_call) < self.api_call_interval:
            wait_time = (self.api_call_interval - (now - self.last_mlb_api_call)).total_seconds()
            await asyncio.sleep(wait_time)
        self.last_mlb_api_call = datetime.now()
    
    async def _rate_limit_espn_api(self):
        """Rate limit ESPN API calls"""
        now = datetime.now()
        if (now - self.last_espn_api_call) < self.api_call_interval:
            wait_time = (self.api_call_interval - (now - self.last_espn_api_call)).total_seconds()
            await asyncio.sleep(wait_time)
        self.last_espn_api_call = datetime.now()
    
    async def simulate_player_injury(self, player_name: str, team: str, injury_type: str = "Day-to-day"):
        """Simulate player injury for testing (would be removed in production)"""
        status = PlayerStatus.DAY_TO_DAY if injury_type == "Day-to-day" else PlayerStatus.INJURED
        
        update = PlayerUpdate(
            player_id=f"sim_{player_name.lower().replace(' ', '_')}",
            player_name=player_name,
            team=team,
            status=status,
            injury_type=injury_type,
            impact_level="HIGH" if status == PlayerStatus.INJURED else "MEDIUM"
        )
        
        self.player_updates.append(update)
        logger.info(f"Simulated injury: {player_name} - {injury_type}")
    
    async def simulate_lineup_change(self, game_id: str, team: str, player_out: str, player_in: str):
        """Simulate lineup change for testing"""
        change = LineupChange(
            game_id=game_id,
            team=team,
            change_type="SUBSTITUTION",
            player_out=player_out,
            player_in=player_in,
            reason="Tactical substitution"
        )
        
        if game_id not in self.lineup_changes:
            self.lineup_changes[game_id] = []
        
        self.lineup_changes[game_id].append(change)
        logger.info(f"Simulated lineup change: {player_out} -> {player_in}")
    
    def get_monitoring_status(self) -> Dict[str, Any]:
        """Get current monitoring status"""
        return {
            "monitoring_active": self.monitoring_active,
            "monitored_games": len(self.monitored_games),
            "live_games_cached": len(self.live_games),
            "recent_player_updates": len([
                u for u in self.player_updates 
                if (datetime.now(timezone.utc) - u.timestamp).hours <= 24
            ]),
            "callbacks_registered": len(self.update_callbacks),
            "session_active": self.session is not None
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """Service health check"""
        try:
            # Test API connectivity
            api_reachable = False
            try:
                await self._ensure_session()
                url = f"{self.mlb_api_base}/schedule?sportId=1"
                
                async with self.session.get(url) as response:
                    api_reachable = response.status == 200
            except:
                pass
            
            return {
                "service": self.name,
                "version": self.version,
                "status": "healthy" if api_reachable else "degraded",
                "capabilities": {
                    "mlb_api_connectivity": api_reachable,
                    "live_monitoring": self.monitoring_active,
                    "player_updates": True,
                    "lineup_tracking": True,
                    "rate_limiting": True
                },
                "monitoring_status": self.get_monitoring_status()
            }
            
        except Exception as e:
            logger.error(f"Real-time MLB data service health check failed: {e}")
            return {
                "service": self.name,
                "version": self.version,
                "status": "error",
                "error": str(e)
            }


# Global service instance
real_time_mlb_data_service = RealTimeMLBDataService()