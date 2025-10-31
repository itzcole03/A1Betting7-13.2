"""
BetMGM API Integration Service
Phase 3: Multiple Sportsbook Integrations - BetMGM odds and markets

Features:
- Live odds retrieval from BetMGM
- Multiple sports and markets support
- Player props and live betting
- Data normalization for unified format
- Rate limiting and caching
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union
import aiohttp
import json
from dataclasses import dataclass, asdict
from enum import Enum

# Core services
from ..core.unified_cache_service import get_cache
from ..core.unified_ml_service import SportType

logger = logging.getLogger(__name__)

class BetMGMMarket(Enum):
    """BetMGM market types"""
    MONEYLINE = "moneyline"
    POINT_SPREAD = "spread"
    TOTAL_POINTS = "total"
    PLAYER_PROPS = "player_props"
    TEAM_PROPS = "team_props"
    LIVE_BETTING = "live"
    SAME_GAME_PARLAY = "sgp"

@dataclass
class BetMGMOdds:
    """Normalized BetMGM odds data structure"""
    id: str
    event_id: str
    market_type: str
    selection: str
    odds: float
    line: Optional[float]
    last_updated: str
    is_live: bool
    sport: str
    league: str
    home_team: str
    away_team: str
    game_time: str
    player_name: Optional[str] = None
    prop_type: Optional[str] = None
    sportsbook: str = "BetMGM"

@dataclass
class BetMGMEvent:
    """BetMGM event/game data structure"""
    id: str
    sport: str
    league: str
    home_team: str
    away_team: str
    start_time: str
    status: str
    markets: List[str]
    is_live: bool

class BetMGMAPIService:
    """Service for integrating with BetMGM API"""
    
    def __init__(self):
        # BetMGM API configuration
        self.base_url = "https://sports.mi.betmgm.com/en/sports/api/widget"
        self.odds_url = "https://sports.mi.betmgm.com/cds-api/bettingoffer/fixture-view"
        
        # Rate limiting
        self.rate_limit_calls = 120  # calls per minute (BetMGM is more generous)
        self.rate_limit_window = 60  # seconds
        self.last_requests = []
        
        # Session management
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Data mapping
        self.sport_mapping = {
            "american-football": SportType.NFL,
            "basketball": SportType.NBA,
            "baseball": SportType.MLB,
            "ice-hockey": SportType.NHL,
            "soccer": "SOCCER",
            "tennis": "TENNIS",
            "golf": "GOLF",
            "mixed-martial-arts": "MMA"
        }
        
        # Market mapping for BetMGM
        self.market_mapping = {
            "Money Line": BetMGMMarket.MONEYLINE,
            "Point Spread": BetMGMMarket.POINT_SPREAD,
            "Total Points": BetMGMMarket.TOTAL_POINTS,
            "Player Props": BetMGMMarket.PLAYER_PROPS,
            "Team Props": BetMGMMarket.TEAM_PROPS
        }

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session"""
        if self.session is None or self.session.closed:
            timeout = aiohttp.ClientTimeout(total=30)
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Origin': 'https://sports.mi.betmgm.com',
                'Referer': 'https://sports.mi.betmgm.com/'
            }
            self.session = aiohttp.ClientSession(timeout=timeout, headers=headers)
        return self.session

    async def _check_rate_limit(self) -> bool:
        """Check if we're within rate limits"""
        now = datetime.now()
        cutoff = now - timedelta(seconds=self.rate_limit_window)
        
        # Remove old requests
        self.last_requests = [req_time for req_time in self.last_requests if req_time > cutoff]
        
        # Check if we can make another request
        if len(self.last_requests) >= self.rate_limit_calls:
            return False
        
        self.last_requests.append(now)
        return True

    async def _make_request(
        self, 
        endpoint: str, 
        params: Optional[Dict[str, Any]] = None,
        use_odds_api: bool = False
    ) -> Optional[Dict[str, Any]]:
        """Make HTTP request with rate limiting and error handling"""
        
        if not await self._check_rate_limit():
            logger.warning("BetMGM API rate limit reached")
            await asyncio.sleep(1)
            return None

        try:
            session = await self._get_session()
            base_url = self.odds_url if use_odds_api else self.base_url
            url = f"{base_url}/{endpoint.lstrip('/')}"
            
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    return await response.json()
                elif response.status == 429:
                    logger.warning(f"BetMGM API rate limited: {response.status}")
                    await asyncio.sleep(3)
                    return None
                else:
                    logger.error(f"BetMGM API error: {response.status} - {await response.text()}")
                    return None
                    
        except asyncio.TimeoutError:
            logger.error("BetMGM API request timeout")
            return None
        except Exception as e:
            logger.error(f"BetMGM API request failed: {e}")
            return None

    async def get_events(
        self, 
        sport: Optional[SportType] = None,
        league: Optional[str] = None,
        live_only: bool = False
    ) -> List[BetMGMEvent]:
        """Get upcoming and live events"""
        
        try:
            cache = await get_cache()
            cache_key = f"betmgm_events:{sport}:{league}:{live_only}"
            
            # Check cache first (cache for 3 minutes)
            cached_data = await cache.get(cache_key)
            if cached_data:
                return [BetMGMEvent(**event) for event in cached_data]

            # Build API endpoint
            if live_only:
                endpoint = "widgetdata/live-scores-and-lines"
            else:
                endpoint = "widgetdata/sports-hub"
            
            params = {
                'lang': 'en',
                'country': 'US',
                'timezone': 'America/New_York'
            }
            
            if sport:
                bmgm_sport = self._map_sport_to_betmgm(sport)
                if bmgm_sport:
                    params['sport'] = bmgm_sport
            
            # Make API request
            response = await self._make_request(endpoint, params)
            
            if not response:
                return []

            events = []
            
            # Parse BetMGM response structure
            widgets = response.get('widgets', [])
            for widget in widgets:
                widget_data = widget.get('payload', {})
                
                # Different parsing for live vs pre-game
                if live_only:
                    events.extend(self._parse_live_events(widget_data))
                else:
                    events.extend(self._parse_upcoming_events(widget_data))

            # Cache results
            events_data = [asdict(event) for event in events]
            await cache.set(cache_key, events_data, ttl=180)  # 3 minutes
            
            return events
            
        except Exception as e:
            logger.error(f"Failed to get BetMGM events: {e}")
            return []

    async def get_odds(
        self,
        event_id: Optional[str] = None,
        sport: Optional[SportType] = None,
        markets: Optional[List[BetMGMMarket]] = None,
        live_only: bool = False
    ) -> List[BetMGMOdds]:
        """Get odds for specific events or markets"""
        
        try:
            cache = await get_cache()
            cache_key = f"betmgm_odds:{event_id}:{sport}:{markets}:{live_only}"
            
            # Check cache first (cache for 45 seconds for live, 3 minutes for pre-game)
            cache_ttl = 45 if live_only else 180
            cached_data = await cache.get(cache_key)
            if cached_data:
                return [BetMGMOdds(**odds) for odds in cached_data]

            odds_list = []
            
            if event_id:
                # Get odds for specific event
                event_odds = await self._get_event_odds(event_id, markets)
                odds_list.extend(event_odds)
            else:
                # Get odds for all events in sport
                events = await self.get_events(sport=sport, live_only=live_only)
                for event in events[:8]:  # Limit to avoid rate limits
                    event_odds = await self._get_event_odds(event.id, markets)
                    odds_list.extend(event_odds)
                    
                    # Small delay to respect rate limits
                    await asyncio.sleep(0.1)

            # Cache results
            odds_data = [asdict(odds) for odds in odds_list]
            await cache.set(cache_key, odds_data, ttl=cache_ttl)
            
            return odds_list
            
        except Exception as e:
            logger.error(f"Failed to get BetMGM odds: {e}")
            return []

    async def _get_event_odds(
        self, 
        event_id: str, 
        markets: Optional[List[BetMGMMarket]] = None
    ) -> List[BetMGMOdds]:
        """Get odds for a specific event"""
        
        try:
            # BetMGM uses fixture IDs
            params = {
                'fixtureIds': event_id,
                'lang': 'en',
                'country': 'US'
            }
            
            response = await self._make_request("", params, use_odds_api=True)
            
            if not response:
                return []

            odds_list = []
            
            # Parse BetMGM odds structure
            fixtures = response.get('fixtures', [])
            for fixture in fixtures:
                games = fixture.get('games', [])
                for game in games:
                    for outcome in game.get('outcomes', []):
                        odds = self._parse_odds(outcome, fixture, game)
                        if odds:
                            # Filter by requested markets
                            if markets and not any(market.value in odds.market_type for market in markets):
                                continue
                            odds_list.append(odds)

            return odds_list
            
        except Exception as e:
            logger.error(f"Failed to get BetMGM event odds for {event_id}: {e}")
            return []

    async def get_player_props(
        self,
        sport: SportType,
        player_name: Optional[str] = None,
        prop_types: Optional[List[str]] = None
    ) -> List[BetMGMOdds]:
        """Get player proposition bets"""
        
        try:
            cache = await get_cache()
            cache_key = f"betmgm_props:{sport}:{player_name}:{prop_types}"
            
            # Check cache first (cache for 90 seconds)
            cached_data = await cache.get(cache_key)
            if cached_data:
                return [BetMGMOdds(**odds) for odds in cached_data]

            # Get events for the sport
            events = await self.get_events(sport=sport)
            if not events:
                return []

            props_list = []
            
            # Get player props for each event
            for event in events[:6]:  # Limit to avoid rate limits
                event_props = await self._get_event_player_props(event.id, player_name, prop_types)
                props_list.extend(event_props)
                await asyncio.sleep(0.15)  # Rate limiting

            # Cache results
            props_data = [asdict(prop) for prop in props_list]
            await cache.set(cache_key, props_data, ttl=90)  # 90 seconds
            
            return props_list
            
        except Exception as e:
            logger.error(f"Failed to get BetMGM player props: {e}")
            return []

    async def _get_event_player_props(
        self,
        event_id: str,
        player_name: Optional[str] = None,
        prop_types: Optional[List[str]] = None
    ) -> List[BetMGMOdds]:
        """Get player props for a specific event"""
        
        try:
            # BetMGM player props endpoint
            params = {
                'fixtureIds': event_id,
                'includePlayerProps': 'true',
                'lang': 'en'
            }
            
            response = await self._make_request("", params, use_odds_api=True)
            
            if not response:
                return []

            props_list = []
            
            # Parse BetMGM player props structure
            fixtures = response.get('fixtures', [])
            for fixture in fixtures:
                # Look for player prop games
                games = fixture.get('games', [])
                for game in games:
                    game_name = game.get('name', {}).get('value', '').lower()
                    
                    # Check if this is a player prop game
                    if 'player' not in game_name and 'prop' not in game_name:
                        continue
                    
                    # Filter by prop type if specified
                    if prop_types and not any(prop_type.lower() in game_name for prop_type in prop_types):
                        continue
                    
                    # Parse outcomes
                    for outcome in game.get('outcomes', []):
                        prop = self._parse_player_prop(outcome, game, fixture)
                        if prop:
                            # Filter by player name if specified
                            if player_name and player_name.lower() not in (prop.player_name or '').lower():
                                continue
                                
                            props_list.append(prop)

            return props_list
            
        except Exception as e:
            logger.error(f"Failed to get BetMGM player props for event {event_id}: {e}")
            return []

    def _parse_live_events(self, widget_data: Dict[str, Any]) -> List[BetMGMEvent]:
        """Parse BetMGM live events"""
        events = []
        
        try:
            competitions = widget_data.get('competitions', [])
            for competition in competitions:
                for event in competition.get('events', []):
                    parsed_event = self._parse_event_data(event, is_live=True)
                    if parsed_event:
                        events.append(parsed_event)
        except Exception as e:
            logger.error(f"Failed to parse BetMGM live events: {e}")
        
        return events

    def _parse_upcoming_events(self, widget_data: Dict[str, Any]) -> List[BetMGMEvent]:
        """Parse BetMGM upcoming events"""
        events = []
        
        try:
            # BetMGM structures vary, need to handle multiple formats
            if 'fixtures' in widget_data:
                for fixture in widget_data['fixtures']:
                    parsed_event = self._parse_event_data(fixture, is_live=False)
                    if parsed_event:
                        events.append(parsed_event)
            
            elif 'competitions' in widget_data:
                for competition in widget_data['competitions']:
                    for event in competition.get('events', []):
                        parsed_event = self._parse_event_data(event, is_live=False)
                        if parsed_event:
                            events.append(parsed_event)
                            
        except Exception as e:
            logger.error(f"Failed to parse BetMGM upcoming events: {e}")
        
        return events

    def _parse_event_data(self, event_data: Dict[str, Any], is_live: bool) -> Optional[BetMGMEvent]:
        """Parse individual BetMGM event data"""
        
        try:
            event_id = event_data.get('id') or event_data.get('fixtureId')
            if not event_id:
                return None

            # Extract teams
            participants = event_data.get('participants', [])
            if len(participants) < 2:
                # Try alternative structure
                name = event_data.get('name', {})
                if isinstance(name, dict):
                    event_name = name.get('value', '')
                else:
                    event_name = str(name)
                
                teams = event_name.split(' vs ') or event_name.split(' @ ')
                if len(teams) == 2:
                    away_team, home_team = teams[0].strip(), teams[1].strip()
                else:
                    return None
            else:
                # Standard participant structure
                home_team = participants[0].get('name', {}).get('value', '')
                away_team = participants[1].get('name', {}).get('value', '')

            # Extract sport and league
            sport_data = event_data.get('sport', {})
            sport = sport_data.get('name', {}).get('value', '') if isinstance(sport_data, dict) else ''
            
            competition = event_data.get('competition', {})
            league = competition.get('name', {}).get('value', '') if isinstance(competition, dict) else ''

            # Extract start time
            start_time = event_data.get('startTime', '')

            # Extract available markets
            markets = []
            games = event_data.get('games', [])
            for game in games:
                market_name = game.get('name', {}).get('value', '')
                if market_name:
                    markets.append(market_name)

            return BetMGMEvent(
                id=str(event_id),
                sport=self._normalize_sport_name(sport),
                league=league,
                home_team=home_team,
                away_team=away_team,
                start_time=start_time,
                status='live' if is_live else 'upcoming',
                markets=markets,
                is_live=is_live
            )
            
        except Exception as e:
            logger.error(f"Failed to parse BetMGM event: {e}")
            return None

    def _parse_odds(
        self, 
        outcome_data: Dict[str, Any], 
        fixture_data: Dict[str, Any],
        game_data: Dict[str, Any]
    ) -> Optional[BetMGMOdds]:
        """Parse BetMGM odds data"""
        
        try:
            # Extract basic info
            selection = outcome_data.get('name', {}).get('value', '') if isinstance(outcome_data.get('name'), dict) else str(outcome_data.get('name', ''))
            
            # Get odds in American format
            price = outcome_data.get('price', {})
            if isinstance(price, dict):
                american_odds = price.get('a')  # American format
                if american_odds is None:
                    decimal_odds = price.get('d')  # Decimal format
                    if decimal_odds:
                        american_odds = self._decimal_to_american(float(decimal_odds))
            else:
                american_odds = price
            
            if american_odds is None:
                return None

            # Extract line/handicap
            line = outcome_data.get('line')
            if line:
                line = float(line)

            # Extract event info
            fixture_name = fixture_data.get('name', {}).get('value', '') if isinstance(fixture_data.get('name'), dict) else str(fixture_data.get('name', ''))
            participants = fixture_data.get('participants', [])
            
            home_team = participants[0].get('name', {}).get('value', '') if len(participants) > 0 else ''
            away_team = participants[1].get('name', {}).get('value', '') if len(participants) > 1 else ''

            # Determine market type
            game_name = game_data.get('name', {}).get('value', '') if isinstance(game_data.get('name'), dict) else str(game_data.get('name', ''))
            market_type = self._determine_market_type(game_name)

            return BetMGMOdds(
                id=f"bmgm_{outcome_data.get('id', '')}",
                event_id=str(fixture_data.get('id', '')),
                market_type=market_type,
                selection=selection,
                odds=float(american_odds),
                line=line,
                last_updated=datetime.now().isoformat(),
                is_live=fixture_data.get('isLive', False),
                sport=self._normalize_sport_name(fixture_data.get('sport', {}).get('name', {}).get('value', '')),
                league=fixture_data.get('competition', {}).get('name', {}).get('value', ''),
                home_team=home_team,
                away_team=away_team,
                game_time=fixture_data.get('startTime', ''),
                sportsbook="BetMGM"
            )
            
        except Exception as e:
            logger.error(f"Failed to parse BetMGM odds: {e}")
            return None

    def _parse_player_prop(
        self, 
        outcome_data: Dict[str, Any], 
        game_data: Dict[str, Any],
        fixture_data: Dict[str, Any]
    ) -> Optional[BetMGMOdds]:
        """Parse BetMGM player prop data"""
        
        try:
            # Extract player name and prop type from game name
            game_name = game_data.get('name', {}).get('value', '') if isinstance(game_data.get('name'), dict) else str(game_data.get('name', ''))
            outcome_label = outcome_data.get('name', {}).get('value', '') if isinstance(outcome_data.get('name'), dict) else str(outcome_data.get('name', ''))
            
            player_name = self._extract_player_name(game_name, outcome_label)
            if not player_name:
                return None

            prop_type = self._extract_prop_type(game_name)
            
            # Parse odds
            price = outcome_data.get('price', {})
            if isinstance(price, dict):
                american_odds = price.get('a')
                if american_odds is None:
                    decimal_odds = price.get('d')
                    if decimal_odds:
                        american_odds = self._decimal_to_american(float(decimal_odds))
            else:
                american_odds = price
            
            if american_odds is None:
                return None
            
            # Extract line
            line = outcome_data.get('line')
            if line:
                line = float(line)

            return BetMGMOdds(
                id=f"bmgm_prop_{outcome_data.get('id', '')}",
                event_id=str(fixture_data.get('id', '')),
                market_type="player_props",
                selection=outcome_label,
                odds=float(american_odds),
                line=line,
                last_updated=datetime.now().isoformat(),
                is_live=False,  # Player props are typically pre-game
                sport=self._normalize_sport_name(fixture_data.get('sport', {}).get('name', {}).get('value', '')),
                league='',
                home_team='',
                away_team='',
                game_time='',
                player_name=player_name,
                prop_type=prop_type,
                sportsbook="BetMGM"
            )
            
        except Exception as e:
            logger.error(f"Failed to parse BetMGM player prop: {e}")
            return None

    def _map_sport_to_betmgm(self, sport: SportType) -> Optional[str]:
        """Map our sport types to BetMGM sport identifiers"""
        sport_map = {
            SportType.NFL: "american-football",
            SportType.NBA: "basketball", 
            SportType.MLB: "baseball",
            SportType.NHL: "ice-hockey"
        }
        return sport_map.get(sport)

    def _normalize_sport_name(self, sport_name: str) -> str:
        """Normalize sport name to our standard format"""
        sport_name_lower = sport_name.lower()
        
        if 'football' in sport_name_lower and 'american' in sport_name_lower:
            return 'NFL'
        elif 'basketball' in sport_name_lower:
            return 'NBA'
        elif 'baseball' in sport_name_lower:
            return 'MLB'
        elif 'hockey' in sport_name_lower or 'ice hockey' in sport_name_lower:
            return 'NHL'
        else:
            return sport_name

    def _determine_market_type(self, game_name: str) -> str:
        """Determine market type from game name"""
        game_lower = game_name.lower()
        
        if 'money line' in game_lower or 'moneyline' in game_lower:
            return 'moneyline'
        elif 'spread' in game_lower or 'handicap' in game_lower:
            return 'spread'
        elif 'total' in game_lower or 'over/under' in game_lower:
            return 'total'
        elif 'player' in game_lower and 'prop' in game_lower:
            return 'player_props'
        elif 'team' in game_lower and 'prop' in game_lower:
            return 'team_props'
        else:
            return 'unknown'

    def _decimal_to_american(self, decimal_odds: float) -> int:
        """Convert decimal odds to American format"""
        if decimal_odds >= 2.0:
            return int((decimal_odds - 1) * 100)
        else:
            return int(-100 / (decimal_odds - 1))

    def _extract_player_name(self, game_name: str, outcome_label: str) -> Optional[str]:
        """Extract player name from game or outcome text"""
        
        import re
        
        # Common patterns for player props
        player_patterns = [
            r'([A-Z][a-z]+ [A-Z][a-z]+) (?:Over|Under|To)',
            r'([A-Z][a-z]+ [A-Z][a-z]+) -',
            r'([A-Z][a-z]+ [A-Z][a-z]+) \(',
            r'([A-Z][a-z]+ [A-Z][a-z]+):'
        ]
        
        # Try game name first
        for pattern in player_patterns:
            match = re.search(pattern, game_name)
            if match:
                return match.group(1)
        
        # Try outcome label
        for pattern in player_patterns:
            match = re.search(pattern, outcome_label)
            if match:
                return match.group(1)
        
        return None

    def _extract_prop_type(self, game_name: str) -> str:
        """Extract prop type from game name"""
        
        prop_type_map = {
            'points': 'points',
            'assists': 'assists', 
            'rebounds': 'rebounds',
            'steals': 'steals',
            'blocks': 'blocks',
            'three pointers': '3-pointers',
            'strikeouts': 'strikeouts',
            'hits': 'hits',
            'runs': 'runs',
            'rbis': 'rbis',
            'passing yards': 'passing_yards',
            'rushing yards': 'rushing_yards',
            'receiving yards': 'receiving_yards',
            'touchdowns': 'touchdowns',
            'goals': 'goals',
            'saves': 'saves'
        }
        
        game_lower = game_name.lower()
        for key, prop_type in prop_type_map.items():
            if key in game_lower:
                return prop_type
        
        return 'unknown'

    async def close(self):
        """Close HTTP session"""
        if self.session and not self.session.closed:
            await self.session.close()

# Global service instance
betmgm_service = BetMGMAPIService()

async def get_betmgm_service() -> BetMGMAPIService:
    """Get the global BetMGM service instance"""
    return betmgm_service
