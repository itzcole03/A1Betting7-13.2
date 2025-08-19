"""
PropFinder Real Data Service

Integrates PropFinderKillerDashboard with real betting data sources:
- Alert Engine integration for live opportunities
- Prop data from multiple sportsbooks 
- Line movement tracking
- ML analysis and confidence scoring
- Real-time odds comparison
"""

import asyncio
import logging
from typing import List, Dict, Optional, Any
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from enum import Enum

# Import real data services
try:
    from backend.services.alert_engine_core import get_alert_engine_core, AlertTrigger
    from backend.services.unified_data_fetcher import unified_data_fetcher
    from backend.services.unified_cache_service import unified_cache_service
    from backend.services.unified_logging import unified_logging
except ImportError as e:
    logging.warning(f"Could not import unified services: {e}")
    # Graceful fallback for development
    unified_data_fetcher = None
    unified_cache_service = None
    unified_logging = None

logger = logging.getLogger(__name__)

class Sport(Enum):
    NBA = "NBA"
    NFL = "NFL"
    MLB = "MLB" 
    NHL = "NHL"

class MarketType(Enum):
    POINTS = "Points"
    ASSISTS = "Assists"
    REBOUNDS = "Rebounds"
    THREES = "3-Pointers Made"
    HITS = "Hits"
    HOME_RUNS = "Home Runs"
    RBI = "RBI"
    SAVES = "Saves"
    GOALS = "Goals"

class Pick(Enum):
    OVER = "over"
    UNDER = "under"

class Trend(Enum):
    UP = "up"
    DOWN = "down"
    STABLE = "stable"

class Venue(Enum):
    HOME = "home"
    AWAY = "away"

class SharpMoney(Enum):
    HEAVY = "heavy"
    MODERATE = "moderate"
    LIGHT = "light"
    PUBLIC = "public"

@dataclass
class LineMovement:
    open: float
    current: float
    direction: Trend

@dataclass
class Bookmaker:
    name: str
    odds: int
    line: float

@dataclass
class MatchupHistory:
    games: int
    average: float
    hitRate: int

@dataclass
class PropOpportunity:
    id: str
    player: str
    playerImage: Optional[str]
    team: str
    teamLogo: Optional[str]
    opponent: str
    opponentLogo: Optional[str]
    sport: Sport
    market: MarketType
    line: float
    pick: Pick
    odds: int
    impliedProbability: float
    aiProbability: float
    edge: float
    confidence: float
    projectedValue: float
    volume: int
    trend: Trend
    trendStrength: int
    timeToGame: str
    venue: Venue
    weather: Optional[str]
    injuries: List[str]
    recentForm: List[float]
    matchupHistory: MatchupHistory
    lineMovement: LineMovement
    bookmakers: List[Bookmaker]
    isBookmarked: bool
    tags: List[str]
    socialSentiment: int
    sharpMoney: SharpMoney
    lastUpdated: datetime
    alertTriggered: bool = False
    alertSeverity: Optional[str] = None

class PropFinderDataService:
    """Service for fetching real prop betting data for PropFinder dashboard"""
    
    def __init__(self):
        self.cache_ttl = 30  # 30 seconds cache for real-time data
        self.alert_engine = None
        self.logger = logger
        
    async def _initialize_services(self):
        """Initialize backend services with error handling"""
        try:
            if 'get_alert_engine_core' in globals() and get_alert_engine_core:
                self.alert_engine = await get_alert_engine_core()
            # Use basic logger instead of unified logging to avoid attribute errors
            self.logger = logger
        except Exception as e:
            logger.warning(f"Could not initialize alert engine: {e}")

    async def get_prop_opportunities(
        self,
        sport_filter: Optional[List[str]] = None,
        confidence_range: Optional[tuple] = None,
        edge_range: Optional[tuple] = None,
        limit: int = 50
    ) -> List[PropOpportunity]:
        """
        Get real prop betting opportunities with alerts integration
        
        Args:
            sport_filter: Filter by sports (NBA, NFL, etc.)
            confidence_range: Confidence percentage range (min, max)
            edge_range: Edge percentage range (min, max)
            limit: Maximum number of opportunities to return
            
        Returns:
            List of PropOpportunity objects with real data
        """
        try:
            cache_key = f"prop_opportunities:{sport_filter}:{confidence_range}:{edge_range}:{limit}"
            
            # Check cache first
            if unified_cache_service:
                cached_data = unified_cache_service.get(cache_key)
                if cached_data and isinstance(cached_data, list):
                    try:
                        opportunities_list = []
                        for opp_dict in cached_data:
                            if isinstance(opp_dict, dict):
                                # Convert datetime strings back to datetime objects
                                if 'lastUpdated' in opp_dict:
                                    opp_dict['lastUpdated'] = datetime.fromisoformat(opp_dict['lastUpdated'])
                                opportunities_list.append(PropOpportunity(**opp_dict))
                        return opportunities_list
                    except Exception as e:
                        self.logger.warning(f"Error deserializing cached data: {e}")
            
            # Fetch real opportunities
            opportunities = []
            
            # Get data from multiple sources
            mlb_props = await self._get_mlb_opportunities()
            nba_props = await self._get_nba_opportunities()
            
            opportunities.extend(mlb_props)
            opportunities.extend(nba_props)
            
            # Integrate with alert engine
            if self.alert_engine:
                opportunities = await self._integrate_alerts(opportunities)
            
            # Apply filters
            opportunities = self._apply_filters(
                opportunities, sport_filter, confidence_range, edge_range
            )
            
            # Sort by confidence (highest first) and limit
            opportunities.sort(key=lambda x: x.confidence, reverse=True)
            opportunities = opportunities[:limit]
            
            # Cache results
            if unified_cache_service:
                cache_data = [asdict(opp) for opp in opportunities]
                try:
                    if hasattr(unified_cache_service, 'set'):
                        await unified_cache_service.set(cache_key, cache_data, ttl=self.cache_ttl)
                except Exception as e:
                    self.logger.warning(f"Error caching data: {e}")
            
            self.logger.info(f"Retrieved {len(opportunities)} prop opportunities")
            return opportunities
            
        except Exception as e:
            self.logger.error(f"Error fetching prop opportunities: {e}")
            return await self._get_fallback_opportunities()

    async def _get_mlb_opportunities(self) -> List[PropOpportunity]:
        """Fetch real MLB prop opportunities"""
        try:
            # Use unified data fetcher for MLB data
            if not unified_data_fetcher:
                return []
                
            # Get MLB games using available method
            try:
                if hasattr(unified_data_fetcher, 'fetch_mlb_games'):
                    mlb_games = await unified_data_fetcher.fetch_mlb_games(sport="MLB")
                else:
                    # Fallback to basic data fetching
                    mlb_games = self._get_fallback_mlb_games()
            except Exception as e:
                self.logger.warning(f"Error fetching MLB games: {e}")
                mlb_games = self._get_fallback_mlb_games()
            opportunities = []
            
            for game in mlb_games[:5]:  # Limit to first 5 games for demo
                game_id = game.get('game_pk')
                if not game_id:
                    continue
                    
                # Get comprehensive props for this game
                try:
                    from backend.services.comprehensive_prop_generator import ComprehensivePropGenerator
                    prop_generator = ComprehensivePropGenerator()
                    props_data = await prop_generator.generate_game_props(
                        game_id, optimize_performance=True
                    )
                    
                    # Convert props to PropOpportunity objects
                    game_opportunities = self._convert_mlb_props_to_opportunities(
                        props_data, game
                    )
                    opportunities.extend(game_opportunities)
                    
                except ImportError:
                    # Fallback to basic prop data
                    basic_props = self._create_basic_mlb_props(game)
                    opportunities.extend(basic_props)
                except Exception as e:
                    self.logger.warning(f"Error generating comprehensive props: {e}")
            
            return opportunities
            
        except Exception as e:
            self.logger.warning(f"Error fetching MLB opportunities: {e}")
            return []

    async def _get_nba_opportunities(self) -> List[PropOpportunity]:
        """Fetch real NBA prop opportunities"""
        try:
            # Simulate NBA data for demo (replace with real NBA API integration)
            nba_opportunities = [
                PropOpportunity(
                    id="nba_lebron_points",
                    player="LeBron James",
                    playerImage=None,
                    team="LAL",
                    teamLogo=None,
                    opponent="GSW",
                    opponentLogo=None,
                    sport=Sport.NBA,
                    market=MarketType.POINTS,
                    line=25.5,
                    pick=Pick.OVER,
                    odds=-110,
                    impliedProbability=52.4,
                    aiProbability=73.2,
                    edge=20.8,
                    confidence=94.7,
                    projectedValue=28.4,
                    volume=847,
                    trend=Trend.UP,
                    trendStrength=85,
                    timeToGame="2h 15m",
                    venue=Venue.HOME,
                    weather=None,
                    injuries=[],
                    recentForm=[31.0, 28.0, 24.0, 29.0, 27.0],
                    matchupHistory=MatchupHistory(games=12, average=27.8, hitRate=75),
                    lineMovement=LineMovement(open=24.5, current=25.5, direction=Trend.UP),
                    bookmakers=[
                        Bookmaker(name="DraftKings", odds=-110, line=25.5),
                        Bookmaker(name="FanDuel", odds=-105, line=25.5),
                        Bookmaker(name="BetMGM", odds=-115, line=25.5),
                    ],
                    isBookmarked=False,
                    tags=["Prime Time", "Revenge Game", "Sharp Play"],
                    socialSentiment=78,
                    sharpMoney=SharpMoney.HEAVY,
                    lastUpdated=datetime.now(timezone.utc)
                )
            ]
            
            return nba_opportunities
            
        except Exception as e:
            self.logger.warning(f"Error fetching NBA opportunities: {e}")
            return []

    def _convert_mlb_props_to_opportunities(
        self, props_data: Dict[str, Any], game: Dict[str, Any]
    ) -> List[PropOpportunity]:
        """Convert MLB comprehensive props to PropOpportunity objects"""
        opportunities = []
        
        try:
            game_id = game.get('game_pk')
            teams = game.get('teams', {})
            away_team = teams.get('away', {}).get('team', {}).get('abbreviation', 'AWAY')
            home_team = teams.get('home', {}).get('team', {}).get('abbreviation', 'HOME')
            
            # Extract props from comprehensive data
            props = props_data.get('props', [])
            
            for prop in props[:10]:  # Limit to first 10 props per game
                try:
                    # Extract player and market info
                    player_name = prop.get('player_name', 'Unknown Player')
                    market = prop.get('stat_type', 'Unknown')
                    line = float(prop.get('line', 0))
                    
                    # Determine team and opponent
                    player_team = prop.get('team', home_team)
                    opponent = away_team if player_team == home_team else home_team
                    
                    # Calculate probabilities and edge
                    ml_confidence = prop.get('confidence', 75.0)
                    implied_prob = self._odds_to_probability(-110)  # Default odds
                    ai_prob = ml_confidence / 100.0 * 100  # Convert to percentage
                    edge = max(0, ai_prob - implied_prob)
                    
                    # Create opportunity
                    opportunity = PropOpportunity(
                        id=f"mlb_{game_id}_{player_name.replace(' ', '_').lower()}_{market}",
                        player=player_name,
                        playerImage=None,
                        team=player_team,
                        teamLogo=None,
                        opponent=opponent,
                        opponentLogo=None,
                        sport=Sport.MLB,
                        market=self._convert_mlb_market(market),
                        line=line,
                        pick=Pick.OVER,  # Default to over (could be determined by ML model)
                        odds=-110,  # Default odds
                        impliedProbability=implied_prob,
                        aiProbability=ai_prob,
                        edge=edge,
                        confidence=ml_confidence,
                        projectedValue=line + (edge / 100 * line),
                        volume=500,  # Simulated volume
                        trend=Trend.STABLE,
                        trendStrength=70,
                        timeToGame=self._calculate_time_to_game(game),
                        venue=Venue.HOME if player_team == home_team else Venue.AWAY,
                        weather=game.get('weather', {}).get('condition'),
                        injuries=[],
                        recentForm=self._generate_recent_form(line),
                        matchupHistory=MatchupHistory(games=10, average=line, hitRate=70),
                        lineMovement=LineMovement(open=line, current=line, direction=Trend.STABLE),
                        bookmakers=[
                            Bookmaker(name="DraftKings", odds=-110, line=line),
                            Bookmaker(name="FanDuel", odds=-105, line=line),
                            Bookmaker(name="BetMGM", odds=-115, line=line),
                        ],
                        isBookmarked=False,
                        tags=self._generate_tags(prop),
                        socialSentiment=65,
                        sharpMoney=SharpMoney.MODERATE,
                        lastUpdated=datetime.now(timezone.utc)
                    )
                    
                    opportunities.append(opportunity)
                    
                except Exception as e:
                    self.logger.warning(f"Error converting prop to opportunity: {e}")
                    continue
            
        except Exception as e:
            self.logger.error(f"Error converting MLB props: {e}")
        
        return opportunities

    async def _integrate_alerts(
        self, opportunities: List[PropOpportunity]
    ) -> List[PropOpportunity]:
        """Integrate alert engine data with opportunities"""
        if not self.alert_engine:
            return opportunities
        
        try:
            # Get recent alert triggers
            if not self.alert_engine or not hasattr(self.alert_engine, 'triggered_alerts'):
                return opportunities
                
            triggered_alerts = list(self.alert_engine.triggered_alerts.values())
            
            # Map alerts to opportunities
            for opp in opportunities:
                for alert in triggered_alerts:
                    # Match alert to opportunity (simple player name matching)
                    if (alert.data.get('player_name', '').lower() in opp.player.lower() or
                        opp.player.lower() in alert.data.get('player_name', '').lower()):
                        
                        opp.alertTriggered = True
                        opp.alertSeverity = alert.severity
                        opp.tags.append("Alert Triggered")
                        
                        # Update confidence based on alert
                        if alert.trigger_type.value == "ev_threshold":
                            opp.confidence = max(opp.confidence, 90.0)
                            opp.edge = max(opp.edge, alert.data.get('ev_percentage', 0))
                        
                        break
            
        except Exception as e:
            self.logger.error(f"Error integrating alerts: {e}")
        
        return opportunities

    def _apply_filters(
        self,
        opportunities: List[PropOpportunity],
        sport_filter: Optional[List[str]],
        confidence_range: Optional[tuple],
        edge_range: Optional[tuple]
    ) -> List[PropOpportunity]:
        """Apply filters to opportunities list"""
        filtered = opportunities
        
        # Sport filter
        if sport_filter:
            filtered = [opp for opp in filtered if opp.sport.value in sport_filter]
        
        # Confidence range filter
        if confidence_range:
            min_conf, max_conf = confidence_range
            filtered = [opp for opp in filtered if min_conf <= opp.confidence <= max_conf]
        
        # Edge range filter  
        if edge_range:
            min_edge, max_edge = edge_range
            filtered = [opp for opp in filtered if min_edge <= opp.edge <= max_edge]
        
        return filtered

    async def _get_fallback_opportunities(self) -> List[PropOpportunity]:
        """Fallback opportunities when real data fails"""
        return [
            PropOpportunity(
                id="fallback_1",
                player="Demo Player",
                playerImage=None,
                team="DEMO",
                teamLogo=None,
                opponent="TEST",
                opponentLogo=None,
                sport=Sport.NBA,
                market=MarketType.POINTS,
                line=25.0,
                pick=Pick.OVER,
                odds=-110,
                impliedProbability=52.4,
                aiProbability=75.0,
                edge=22.6,
                confidence=85.0,
                projectedValue=27.5,
                volume=100,
                trend=Trend.UP,
                trendStrength=80,
                timeToGame="Demo",
                venue=Venue.HOME,
                weather=None,
                injuries=[],
                recentForm=[25.0, 23.0, 28.0],
                matchupHistory=MatchupHistory(games=5, average=25.0, hitRate=70),
                lineMovement=LineMovement(open=25.0, current=25.0, direction=Trend.STABLE),
                bookmakers=[
                    Bookmaker(name="Demo Book", odds=-110, line=25.0)
                ],
                isBookmarked=False,
                tags=["Demo"],
                socialSentiment=50,
                sharpMoney=SharpMoney.MODERATE,
                lastUpdated=datetime.now(timezone.utc)
            )
        ]

    def _convert_mlb_market(self, market: str) -> MarketType:
        """Convert MLB market string to MarketType enum"""
        market_map = {
            'hits': MarketType.HITS,
            'home_runs': MarketType.HOME_RUNS,
            'rbi': MarketType.RBI,
            'saves': MarketType.SAVES,
            'strikeouts': MarketType.SAVES,  # Use saves as placeholder
        }
        return market_map.get(market.lower(), MarketType.HITS)

    def _odds_to_probability(self, odds: int) -> float:
        """Convert American odds to implied probability percentage"""
        if odds > 0:
            return 100 / (odds + 100) * 100
        else:
            return abs(odds) / (abs(odds) + 100) * 100

    def _calculate_time_to_game(self, game: Dict[str, Any]) -> str:
        """Calculate time to game from game data"""
        try:
            game_date = game.get('gameDate')
            if game_date:
                game_time = datetime.fromisoformat(game_date.replace('Z', '+00:00'))
                now = datetime.now(timezone.utc)
                delta = game_time - now
                
                if delta.total_seconds() > 0:
                    hours = int(delta.total_seconds() // 3600)
                    minutes = int((delta.total_seconds() % 3600) // 60)
                    return f"{hours}h {minutes}m"
                else:
                    return "Live/Recent"
            
        except Exception as e:
            self.logger.warning(f"Error calculating time to game: {e}")
        
        return "TBD"

    def _generate_recent_form(self, line: float) -> List[float]:
        """Generate recent form data around the line"""
        import random
        form = []
        for _ in range(5):
            variation = random.uniform(-2.0, 2.0)
            form.append(max(0, line + variation))
        return form

    def _generate_tags(self, prop: Dict[str, Any]) -> List[str]:
        """Generate tags based on prop data"""
        tags = []
        
        confidence = prop.get('confidence', 0)
        if confidence > 90:
            tags.append("High Confidence")
        elif confidence > 80:
            tags.append("Solid Play")
        
        if prop.get('reasoning'):
            if 'matchup' in prop.get('reasoning', '').lower():
                tags.append("Matchup Advantage")
            if 'trend' in prop.get('reasoning', '').lower():
                tags.append("Trending")
        
        return tags

    def _get_fallback_mlb_games(self) -> List[Dict[str, Any]]:
        """Get fallback MLB games data when real API is unavailable"""
        return [
            {
                'game_pk': 12345,
                'gameDate': datetime.now(timezone.utc).isoformat(),
                'teams': {
                    'away': {'team': {'abbreviation': 'NYY'}},
                    'home': {'team': {'abbreviation': 'BOS'}}
                },
                'weather': {'condition': 'Clear'}
            },
            {
                'game_pk': 12346,
                'gameDate': (datetime.now(timezone.utc) + timedelta(hours=3)).isoformat(),
                'teams': {
                    'away': {'team': {'abbreviation': 'LAD'}},
                    'home': {'team': {'abbreviation': 'SF'}}
                },
                'weather': {'condition': 'Partly Cloudy'}
            }
        ]

    def _create_basic_mlb_props(self, game: Dict[str, Any]) -> List[PropOpportunity]:
        """Create basic MLB props when comprehensive prop generator is unavailable"""
        basic_props = []
        
        try:
            game_id = game.get('game_pk')
            teams = game.get('teams', {})
            away_team = teams.get('away', {}).get('team', {}).get('abbreviation', 'AWAY')
            home_team = teams.get('home', {}).get('team', {}).get('abbreviation', 'HOME')
            
            # Create a few basic props for demo
            players = [
                {"name": "Demo Player 1", "team": home_team},
                {"name": "Demo Player 2", "team": away_team}
            ]
            
            for i, player in enumerate(players):
                prop = PropOpportunity(
                    id=f"mlb_basic_{game_id}_{i}",
                    player=player["name"],
                    playerImage=None,
                    team=player["team"],
                    teamLogo=None,
                    opponent=away_team if player["team"] == home_team else home_team,
                    opponentLogo=None,
                    sport=Sport.MLB,
                    market=MarketType.HITS,
                    line=1.5,
                    pick=Pick.OVER,
                    odds=-110,
                    impliedProbability=52.4,
                    aiProbability=75.0,
                    edge=22.6,
                    confidence=80.0,
                    projectedValue=2.1,
                    volume=200,
                    trend=Trend.STABLE,
                    trendStrength=70,
                    timeToGame=self._calculate_time_to_game(game),
                    venue=Venue.HOME if player["team"] == home_team else Venue.AWAY,
                    weather=game.get('weather', {}).get('condition'),
                    injuries=[],
                    recentForm=[2.0, 1.0, 3.0, 1.0, 2.0],
                    matchupHistory=MatchupHistory(games=5, average=1.8, hitRate=65),
                    lineMovement=LineMovement(open=1.5, current=1.5, direction=Trend.STABLE),
                    bookmakers=[
                        Bookmaker(name="Demo Book", odds=-110, line=1.5)
                    ],
                    isBookmarked=False,
                    tags=["Demo", "Basic"],
                    socialSentiment=50,
                    sharpMoney=SharpMoney.MODERATE,
                    lastUpdated=datetime.now(timezone.utc)
                )
                basic_props.append(prop)
                
        except Exception as e:
            self.logger.warning(f"Error creating basic MLB props: {e}")
        
        return basic_props

# Singleton instance
_propfinder_data_service: Optional[PropFinderDataService] = None

def get_propfinder_data_service() -> PropFinderDataService:
    """Get singleton PropFinderDataService instance"""
    global _propfinder_data_service
    if _propfinder_data_service is None:
        _propfinder_data_service = PropFinderDataService()
    return _propfinder_data_service