"""
DraftKings API Integration Service
Phase 3: Multiple Sportsbook Integrations - DraftKings odds and markets

Features:
- Live odds retrieval from DraftKings
- Multiple sports and markets support
- Rate limiting and error handling
- Data normalization and standardization
- Real-time updates with WebSocket fallback
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

class DraftKingsMarket(Enum):
    """DraftKings market types"""
    MONEYLINE = "moneyline"
    POINT_SPREAD = "spread"
    TOTAL_POINTS = "total"
    PLAYER_PROPS = "player_props"
    TEAM_PROPS = "team_props"
    LIVE_BETTING = "live"
    FUTURES = "futures"

@dataclass
class DraftKingsOdds:
    """Normalized DraftKings odds data structure"""
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
    sportsbook: str = "DraftKings"

@dataclass
class DraftKingsEvent:
    """DraftKings event/game data structure"""
    id: str
    sport: str
    league: str
    home_team: str
    away_team: str
    start_time: str
    status: str
    markets: List[str]
    is_live: bool

class DraftKingsAPIService:
    """Service for integrating with DraftKings API"""
    
    def __init__(self):
        # DraftKings API configuration
        self.base_url = "https://sportsbook-us-ny.draftkings.com/sites/US-NY-SB/api/v5"
        self.public_api_url = "https://sportsbook.draftkings.com/api/sportscontent/v1"
        
        # Rate limiting
        self.rate_limit_calls = 100  # calls per minute
        self.rate_limit_window = 60  # seconds
        self.last_requests = []
        
        # Session management
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Data mapping
        self.sport_mapping = {
            "FOOT": SportType.NFL,
            "BASK": SportType.NBA,
            "BASE": SportType.MLB,
            "HOCK": SportType.NHL,
            "SOCC": "SOCCER",
            "TENN": "TENNIS",
            "GOLF": "GOLF",
            "MMA": "MMA"
        }
        
        # Market mapping
        self.market_mapping = {
            "12": DraftKingsMarket.MONEYLINE,
            "405": DraftKingsMarket.POINT_SPREAD,
            "402": DraftKingsMarket.TOTAL_POINTS,
            "1215": DraftKingsMarket.PLAYER_PROPS,
            "1001": DraftKingsMarket.TEAM_PROPS
        }

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session"""
        if self.session is None or self.session.closed:
            timeout = aiohttp.ClientTimeout(total=30)
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Origin': 'https://sportsbook.draftkings.com',
                'Referer': 'https://sportsbook.draftkings.com/'
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
        use_public_api: bool = False
    ) -> Optional[Dict[str, Any]]:
        """Make HTTP request with rate limiting and error handling"""
        
        if not await self._check_rate_limit():
            logger.warning("DraftKings API rate limit reached")
            await asyncio.sleep(1)
            return None

        try:
            session = await self._get_session()
            base_url = self.public_api_url if use_public_api else self.base_url
            url = f"{base_url}/{endpoint.lstrip('/')}"
            
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    return await response.json()
                elif response.status == 429:
                    logger.warning(f"DraftKings API rate limited: {response.status}")
                    await asyncio.sleep(5)
                    return None
                else:
                    logger.error(f"DraftKings API error: {response.status} - {await response.text()}")
                    return None
                    
        except asyncio.TimeoutError:
            logger.error("DraftKings API request timeout")
            return None
        except Exception as e:
            logger.error(f"DraftKings API request failed: {e}")
            return None

    async def get_events(
        self, 
        sport: Optional[SportType] = None,
        league: Optional[str] = None,
        live_only: bool = False
    ) -> List[DraftKingsEvent]:
        """Get upcoming and live events"""
        
        try:
            cache = await get_cache()
            cache_key = f"draftkings_events:{sport}:{league}:{live_only}"
            
            # Check cache first (cache for 2 minutes)
            cached_data = await cache.get(cache_key)
            if cached_data:
                return [DraftKingsEvent(**event) for event in cached_data]

            # Build API endpoint
            if live_only:
                endpoint = "eventgroups/live"
            else:
                endpoint = "eventgroups"
            
            params = {}
            if sport:
                dk_sport = self._map_sport_to_dk(sport)
                if dk_sport:
                    params['sport'] = dk_sport
            
            # Make API request
            response = await self._make_request(endpoint, params, use_public_api=True)
            
            if not response:
                return []

            events = []
            
            # Parse DraftKings response structure
            event_groups = response.get('eventGroups', [])
            for group in event_groups:
                for category in group.get('offerCategories', []):
                    for subcategory in category.get('offerSubcategoryDescriptors', []):
                        for offer_group in subcategory.get('offerSubcategory', {}).get('offers', []):
                            for offer in offer_group:
                                event = self._parse_event(offer)
                                if event:
                                    events.append(event)

            # Cache results
            events_data = [asdict(event) for event in events]
            await cache.set(cache_key, events_data, ttl=120)  # 2 minutes
            
            return events
            
        except Exception as e:
            logger.error(f"Failed to get DraftKings events: {e}")
            return []

    async def get_odds(
        self,
        event_id: Optional[str] = None,
        sport: Optional[SportType] = None,
        markets: Optional[List[DraftKingsMarket]] = None,
        live_only: bool = False
    ) -> List[DraftKingsOdds]:
        """Get odds for specific events or markets"""
        
        try:
            cache = await get_cache()
            cache_key = f"draftkings_odds:{event_id}:{sport}:{markets}:{live_only}"
            
            # Check cache first (cache for 30 seconds for live, 2 minutes for pre-game)
            cache_ttl = 30 if live_only else 120
            cached_data = await cache.get(cache_key)
            if cached_data:
                return [DraftKingsOdds(**odds) for odds in cached_data]

            odds_list = []
            
            if event_id:
                # Get odds for specific event
                event_odds = await self._get_event_odds(event_id, markets)
                odds_list.extend(event_odds)
            else:
                # Get odds for all events in sport
                events = await self.get_events(sport=sport, live_only=live_only)
                for event in events[:10]:  # Limit to avoid rate limits
                    event_odds = await self._get_event_odds(event.id, markets)
                    odds_list.extend(event_odds)
                    
                    # Small delay to respect rate limits
                    await asyncio.sleep(0.1)

            # Cache results
            odds_data = [asdict(odds) for odds in odds_list]
            await cache.set(cache_key, odds_data, ttl=cache_ttl)
            
            return odds_list
            
        except Exception as e:
            logger.error(f"Failed to get DraftKings odds: {e}")
            return []

    async def _get_event_odds(
        self, 
        event_id: str, 
        markets: Optional[List[DraftKingsMarket]] = None
    ) -> List[DraftKingsOdds]:
        """Get odds for a specific event"""
        
        try:
            endpoint = f"events/{event_id}"
            response = await self._make_request(endpoint)
            
            if not response:
                return []

            odds_list = []
            event_data = response.get('event', {})
            
            # Parse market offers
            for display_group in event_data.get('displayGroups', []):
                for market in display_group.get('markets', []):
                    market_type = market.get('marketTypeId')
                    
                    # Filter by requested markets
                    if markets:
                        dk_market = self.market_mapping.get(str(market_type))
                        if dk_market not in markets:
                            continue
                    
                    # Parse outcomes/selections
                    for outcome in market.get('outcomes', []):
                        odds = self._parse_odds(outcome, event_data, market)
                        if odds:
                            odds_list.append(odds)

            return odds_list
            
        except Exception as e:
            logger.error(f"Failed to get event odds for {event_id}: {e}")
            return []

    async def get_player_props(
        self,
        sport: SportType,
        player_name: Optional[str] = None,
        prop_types: Optional[List[str]] = None
    ) -> List[DraftKingsOdds]:
        """Get player proposition bets"""
        
        try:
            cache = await get_cache()
            cache_key = f"draftkings_props:{sport}:{player_name}:{prop_types}"
            
            # Check cache first (cache for 1 minute)
            cached_data = await cache.get(cache_key)
            if cached_data:
                return [DraftKingsOdds(**odds) for odds in cached_data]

            # Get events for the sport
            events = await self.get_events(sport=sport)
            if not events:
                return []

            props_list = []
            
            # Get player props for each event
            for event in events[:5]:  # Limit to avoid rate limits
                event_props = await self._get_event_player_props(event.id, player_name, prop_types)
                props_list.extend(event_props)
                await asyncio.sleep(0.1)  # Rate limiting

            # Cache results
            props_data = [asdict(prop) for prop in props_list]
            await cache.set(cache_key, props_data, ttl=60)  # 1 minute
            
            return props_list
            
        except Exception as e:
            logger.error(f"Failed to get DraftKings player props: {e}")
            return []

    async def _get_event_player_props(
        self,
        event_id: str,
        player_name: Optional[str] = None,
        prop_types: Optional[List[str]] = None
    ) -> List[DraftKingsOdds]:
        """Get player props for a specific event"""
        
        try:
            endpoint = f"events/{event_id}/categories/player-props"
            response = await self._make_request(endpoint)
            
            if not response:
                return []

            props_list = []
            
            # Parse player prop markets
            for category in response.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    for market in subcategory.get('markets', []):
                        
                        # Filter by prop type if specified
                        market_name = market.get('name', '').lower()
                        if prop_types and not any(prop_type.lower() in market_name for prop_type in prop_types):
                            continue
                        
                        # Parse outcomes
                        for outcome in market.get('outcomes', []):
                            prop = self._parse_player_prop(outcome, market, event_id)
                            if prop:
                                # Filter by player name if specified
                                if player_name and player_name.lower() not in prop.player_name.lower():
                                    continue
                                    
                                props_list.append(prop)

            return props_list
            
        except Exception as e:
            logger.error(f"Failed to get player props for event {event_id}: {e}")
            return []

    def _parse_event(self, offer_data: Dict[str, Any]) -> Optional[DraftKingsEvent]:
        """Parse DraftKings event data"""
        
        try:
            event_id = offer_data.get('eventId')
            if not event_id:
                return None

            # Extract teams and sport info
            event_group = offer_data.get('eventGroupName', '')
            teams = event_group.split(' @ ') if ' @ ' in event_group else event_group.split(' vs ')
            
            if len(teams) != 2:
                return None

            away_team, home_team = teams[0].strip(), teams[1].strip()
            
            # Parse sport/league
            sport_key = offer_data.get('sportKey', '')
            sport = self.sport_mapping.get(sport_key, sport_key)
            
            # Parse start time
            start_time = offer_data.get('startTime', '')
            
            # Determine if live
            is_live = offer_data.get('isLive', False)
            
            return DraftKingsEvent(
                id=str(event_id),
                sport=sport,
                league=offer_data.get('league', ''),
                home_team=home_team,
                away_team=away_team,
                start_time=start_time,
                status=offer_data.get('eventStatus', 'upcoming'),
                markets=list(offer_data.get('markets', {}).keys()),
                is_live=is_live
            )
            
        except Exception as e:
            logger.error(f"Failed to parse DraftKings event: {e}")
            return None

    def _parse_odds(
        self, 
        outcome_data: Dict[str, Any], 
        event_data: Dict[str, Any],
        market_data: Dict[str, Any]
    ) -> Optional[DraftKingsOdds]:
        """Parse DraftKings odds data"""
        
        try:
            # Extract basic info
            selection = outcome_data.get('label', '')
            odds_decimal = outcome_data.get('oddsDecimal')
            
            if not odds_decimal:
                return None

            # Convert to American odds
            american_odds = self._decimal_to_american(float(odds_decimal))
            
            # Extract line/handicap
            line = outcome_data.get('line')
            if line:
                line = float(line)

            # Extract event info
            event_name = event_data.get('name', '')
            teams = event_name.split(' @ ') if ' @ ' in event_name else event_name.split(' vs ')
            
            home_team = teams[1].strip() if len(teams) > 1 else ''
            away_team = teams[0].strip() if len(teams) > 1 else ''

            # Determine market type
            market_type_id = market_data.get('marketTypeId', '')
            market_type = self.market_mapping.get(str(market_type_id), 'unknown')

            return DraftKingsOdds(
                id=f"dk_{outcome_data.get('id', '')}",
                event_id=str(event_data.get('id', '')),
                market_type=market_type.value if hasattr(market_type, 'value') else str(market_type),
                selection=selection,
                odds=american_odds,
                line=line,
                last_updated=datetime.now().isoformat(),
                is_live=event_data.get('isLive', False),
                sport=event_data.get('sport', ''),
                league=event_data.get('league', ''),
                home_team=home_team,
                away_team=away_team,
                game_time=event_data.get('startTime', ''),
                sportsbook="DraftKings"
            )
            
        except Exception as e:
            logger.error(f"Failed to parse DraftKings odds: {e}")
            return None

    def _parse_player_prop(
        self, 
        outcome_data: Dict[str, Any], 
        market_data: Dict[str, Any],
        event_id: str
    ) -> Optional[DraftKingsOdds]:
        """Parse DraftKings player prop data"""
        
        try:
            # Extract player name from market or outcome
            market_name = market_data.get('name', '')
            outcome_label = outcome_data.get('label', '')
            
            # Try to extract player name
            player_name = self._extract_player_name(market_name, outcome_label)
            if not player_name:
                return None

            # Extract prop type
            prop_type = self._extract_prop_type(market_name)
            
            # Parse odds
            odds_decimal = outcome_data.get('oddsDecimal')
            if not odds_decimal:
                return None

            american_odds = self._decimal_to_american(float(odds_decimal))
            
            # Extract line
            line = outcome_data.get('line')
            if line:
                line = float(line)

            return DraftKingsOdds(
                id=f"dk_prop_{outcome_data.get('id', '')}",
                event_id=event_id,
                market_type="player_props",
                selection=outcome_label,
                odds=american_odds,
                line=line,
                last_updated=datetime.now().isoformat(),
                is_live=False,  # Player props are typically pre-game
                sport='',  # Will be filled from event data
                league='',
                home_team='',
                away_team='',
                game_time='',
                player_name=player_name,
                prop_type=prop_type,
                sportsbook="DraftKings"
            )
            
        except Exception as e:
            logger.error(f"Failed to parse DraftKings player prop: {e}")
            return None

    def _map_sport_to_dk(self, sport: SportType) -> Optional[str]:
        """Map our sport types to DraftKings sport keys"""
        sport_map = {
            SportType.NFL: "FOOT",
            SportType.NBA: "BASK", 
            SportType.MLB: "BASE",
            SportType.NHL: "HOCK"
        }
        return sport_map.get(sport)

    def _decimal_to_american(self, decimal_odds: float) -> int:
        """Convert decimal odds to American format"""
        if decimal_odds >= 2.0:
            return int((decimal_odds - 1) * 100)
        else:
            return int(-100 / (decimal_odds - 1))

    def _extract_player_name(self, market_name: str, outcome_label: str) -> Optional[str]:
        """Extract player name from market or outcome text"""
        
        # Common patterns for player props
        import re
        
        # Try to find player name in market name
        player_patterns = [
            r'([A-Z][a-z]+ [A-Z][a-z]+) (?:Over|Under|To)',
            r'([A-Z][a-z]+ [A-Z][a-z]+) -',
            r'([A-Z][a-z]+ [A-Z][a-z]+) \(',
        ]
        
        for pattern in player_patterns:
            match = re.search(pattern, market_name)
            if match:
                return match.group(1)
        
        # Try outcome label
        for pattern in player_patterns:
            match = re.search(pattern, outcome_label)
            if match:
                return match.group(1)
        
        return None

    def _extract_prop_type(self, market_name: str) -> str:
        """Extract prop type from market name"""
        
        prop_type_map = {
            'points': 'points',
            'assists': 'assists', 
            'rebounds': 'rebounds',
            'steals': 'steals',
            'blocks': 'blocks',
            'threes': '3-pointers',
            'strikeouts': 'strikeouts',
            'hits': 'hits',
            'runs': 'runs',
            'rbis': 'rbis',
            'passing': 'passing_yards',
            'rushing': 'rushing_yards',
            'receiving': 'receiving_yards',
            'touchdowns': 'touchdowns'
        }
        
        market_lower = market_name.lower()
        for key, prop_type in prop_type_map.items():
            if key in market_lower:
                return prop_type
        
        return 'unknown'

    async def close(self):
        """Close HTTP session"""
        if self.session and not self.session.closed:
            await self.session.close()

# Global service instance
draftkings_service = DraftKingsAPIService()

async def get_draftkings_service() -> DraftKingsAPIService:
    """Get the global DraftKings service instance"""
    return draftkings_service
