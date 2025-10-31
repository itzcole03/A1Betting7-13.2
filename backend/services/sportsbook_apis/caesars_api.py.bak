"""
Caesars Sportsbook API Integration Service

This service provides comprehensive integration with Caesars Sportsbook API for:
- Live odds and lines
- Player props
- Game betting markets
- Caesars Rewards integration
- Promotional offers

Caesars uses a different API structure with their own event and market organization.
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass
import aiohttp
import re
from urllib.parse import urljoin, urlencode

logger = logging.getLogger(__name__)

@dataclass
class CaesarsOdds:
    """Caesars odds data structure"""
    event_id: str
    market_id: str
    selection_id: str
    player_name: str
    team: str
    opponent: str
    league: str
    sport: str
    market_type: str
    bet_type: str
    line: float
    odds: int
    decimal_odds: float
    side: str  # 'over', 'under', 'home', 'away'
    timestamp: datetime
    game_time: datetime
    status: str = "active"
    boost_applied: bool = False
    rewards_eligible: bool = True

@dataclass
class CaesarsReward:
    """Caesars Rewards information"""
    tier: str
    points_multiplier: float
    cash_back_rate: float
    special_offers: List[str]

class CaesarsAPI:
    """
    Caesars Sportsbook API integration using their mobile/web endpoints.
    
    Caesars uses a hierarchical structure: Sports -> Competitions -> Events -> Markets
    with specific handling for player props and game lines.
    """
    
    BASE_URL = "https://www.caesars.com"
    API_BASE = "https://www.caesars.com/sportsbook-ct/api"
    SPORTS_API = "https://api.americanwagering.com/regions/us/locations/nj/brands/czr/sb"
    
    def __init__(self, state: str = "nj", rate_limit_delay: float = 1.2):
        self.state = state
        self.rate_limit_delay = rate_limit_delay
        self.last_request_time = 0
        self.session: Optional[aiohttp.ClientSession] = None
        self.cache = {}
        self.cache_ttl = 75  # 75 second cache
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Origin': 'https://www.caesars.com',
                'Referer': 'https://www.caesars.com/sportsbook-ct/',
                'X-Platform': 'desktop',
                'X-Brand': 'czr',
            }
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def _rate_limit(self):
        """Implement rate limiting"""
        now = time.time()
        time_since_last = now - self.last_request_time
        if time_since_last < self.rate_limit_delay:
            await asyncio.sleep(self.rate_limit_delay - time_since_last)
        self.last_request_time = time.time()
    
    def _is_cache_valid(self, key: str) -> bool:
        """Check if cached data is still valid"""
        if key not in self.cache:
            return False
        return time.time() - self.cache[key]['timestamp'] < self.cache_ttl
    
    async def _make_request(self, url: str, params: Optional[Dict] = None) -> Optional[Dict]:
        """Make HTTP request with rate limiting and error handling"""
        await self._rate_limit()
        
        cache_key = f"{url}_{json.dumps(params, sort_keys=True) if params else ''}"
        if self._is_cache_valid(cache_key):
            logger.debug(f"Cache hit for Caesars request: {url}")
            return self.cache[cache_key]['data']
        
        try:
            if not self.session:
                raise RuntimeError("Session not initialized. Use async context manager.")
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    # Cache the response
                    self.cache[cache_key] = {
                        'data': data,
                        'timestamp': time.time()
                    }
                    logger.debug(f"Caesars API request successful: {url}")
                    return data
                elif response.status == 429:
                    logger.warning("Caesars rate limit hit, backing off")
                    await asyncio.sleep(8)
                    return None
                else:
                    logger.error(f"Caesars API error {response.status}: {url}")
                    return None
                    
        except Exception as e:
            logger.error(f"Caesars API request failed: {e}")
            return None
    
    async def get_available_sports(self) -> List[Dict[str, Any]]:
        """Get list of available sports from Caesars"""
        url = f"{self.SPORTS_API}/categories"
        
        data = await self._make_request(url)
        if not data:
            return []
        
        sports = []
        for category in data.get('categories', []):
            if category.get('isActive', False):
                sports.append({
                    'id': category.get('id'),
                    'name': category.get('name', '').lower(),
                    'display_name': category.get('displayName', ''),
                    'priority': category.get('priority', 999),
                    'competition_count': len(category.get('competitions', []))
                })
        
        return sorted(sports, key=lambda x: x['priority'])
    
    async def get_competitions_by_sport(self, sport_id: str) -> List[Dict[str, Any]]:
        """Get competitions (leagues) for a specific sport"""
        url = f"{self.SPORTS_API}/categories/{sport_id}/competitions"
        
        data = await self._make_request(url)
        if not data:
            return []
        
        competitions = []
        for comp in data.get('competitions', []):
            if comp.get('isActive', False):
                competitions.append({
                    'id': comp.get('id'),
                    'name': comp.get('name'),
                    'display_name': comp.get('displayName', ''),
                    'event_count': len(comp.get('events', [])),
                    'region': comp.get('region', ''),
                })
        
        return competitions
    
    async def get_events_by_competition(self, competition_id: str) -> List[Dict[str, Any]]:
        """Get events (games) for a specific competition"""
        url = f"{self.SPORTS_API}/competitions/{competition_id}/events"
        
        data = await self._make_request(url)
        if not data:
            return []
        
        events = []
        for event in data.get('events', []):
            events.append({
                'event_id': str(event.get('id', '')),
                'name': event.get('name', ''),
                'start_time': event.get('startTime'),
                'status': event.get('status', ''),
                'competitors': [comp.get('name', '') for comp in event.get('competitors', [])],
                'is_live': event.get('status') == 'InPlay',
                'market_count': len(event.get('markets', [])),
            })
        
        return events
    
    async def get_sport_id_by_name(self, sport_name: str) -> Optional[str]:
        """Get sport ID by sport name"""
        sports = await self.get_available_sports()
        
        sport_name_lower = sport_name.lower()
        # Caesars sport name mappings
        name_mappings = {
            'football': 'american-football',
            'basketball': 'basketball',
            'baseball': 'baseball',
            'hockey': 'ice-hockey',
            'soccer': 'soccer',
            'tennis': 'tennis',
            'golf': 'golf',
            'mma': 'mixed-martial-arts',
            'boxing': 'boxing',
            'nfl': 'american-football',
            'nba': 'basketball',
            'mlb': 'baseball',
            'nhl': 'ice-hockey',
        }
        
        mapped_name = name_mappings.get(sport_name_lower, sport_name_lower)
        
        for sport in sports:
            if sport['name'] == mapped_name or mapped_name in sport['name']:
                return sport['id']
        
        return None
    
    async def get_player_props(self, sport: str, event_id: Optional[str] = None) -> List[CaesarsOdds]:
        """Get player props for a sport or specific event"""
        sport_id = await self.get_sport_id_by_name(sport)
        if not sport_id:
            logger.warning(f"Sport '{sport}' not found in Caesars")
            return []
        
        if event_id:
            # Get props for specific event
            return await self._get_event_player_props(event_id, sport)
        else:
            # Get events for sport and collect props
            competitions = await self.get_competitions_by_sport(sport_id)
            all_props = []
            
            for comp in competitions[:3]:  # Limit to first 3 competitions to avoid rate limits
                events = await self.get_events_by_competition(comp['id'])
                
                for event in events[:5]:  # Limit to 5 events per competition
                    event_props = await self._get_event_player_props(event['event_id'], sport)
                    all_props.extend(event_props)
            
            return all_props
    
    async def _get_event_player_props(self, event_id: str, sport: str) -> List[CaesarsOdds]:
        """Get player props for a specific event"""
        url = f"{self.SPORTS_API}/events/{event_id}/markets"
        
        data = await self._make_request(url)
        if not data:
            return []
        
        props = []
        event_info = data.get('event', {})
        
        # Parse game time
        try:
            game_time = datetime.fromisoformat(event_info.get('startTime', '').replace('Z', '+00:00'))
        except:
            game_time = datetime.now()
        
        # Get team names
        competitors = event_info.get('competitors', [])
        team_names = [comp.get('name', '') for comp in competitors]
        
        # Process markets
        for market in data.get('markets', []):
            market_name = market.get('name', '')
            market_type = market.get('type', '')
            
            # Check if this is a player prop market
            if self._is_player_prop_market(market_name, market_type):
                player_name = self._extract_player_name(market_name)
                bet_type = self._extract_bet_type(market_name)
                
                # Process selections
                for selection in market.get('selections', []):
                    selection_name = selection.get('name', '')
                    
                    # Determine side and line
                    side, line = self._parse_selection_info(selection_name)
                    
                    # Get odds
                    price_info = selection.get('price', {})
                    american_odds = price_info.get('a', -110)
                    decimal_odds = price_info.get('d', 1.91)
                    
                    props.append(CaesarsOdds(
                        event_id=event_id,
                        market_id=str(market.get('id', '')),
                        selection_id=str(selection.get('id', '')),
                        player_name=player_name,
                        team=team_names[0] if team_names else '',
                        opponent=team_names[1] if len(team_names) > 1 else '',
                        league=sport.upper(),
                        sport=sport,
                        market_type='player_props',
                        bet_type=bet_type,
                        line=line,
                        odds=american_odds,
                        decimal_odds=decimal_odds,
                        side=side,
                        timestamp=datetime.now(),
                        game_time=game_time,
                        status='active' if event_info.get('status') == 'PreMatch' else 'live',
                        boost_applied=selection.get('boosted', False),
                        rewards_eligible=selection.get('rewardsEligible', True)
                    ))
        
        return props
    
    def _is_player_prop_market(self, market_name: str, market_type: str) -> bool:
        """Check if market is a player prop market"""
        market_lower = market_name.lower()
        type_lower = market_type.lower()
        
        # Check market type first
        if 'player' in type_lower or 'individual' in type_lower:
            return True
        
        # Check market name for player prop indicators
        player_indicators = [
            'points', 'rebounds', 'assists', 'steals', 'blocks',
            'hits', 'runs', 'strikeouts', 'home runs', 'rbi',
            'rushing', 'receiving', 'passing', 'touchdown',
            'saves', 'goals', 'shots', 'yards'
        ]
        
        return any(indicator in market_lower for indicator in player_indicators)
    
    def _extract_player_name(self, market_name: str) -> str:
        """Extract player name from market name"""
        # Caesars format variations:
        # "Player Name - Stat Type"
        # "Player Name Total Points"
        # "Player Name Over/Under Points"
        
        if ' - ' in market_name:
            return market_name.split(' - ')[0].strip()
        
        # Try to extract name before stat keywords
        stat_keywords = ['total', 'points', 'rebounds', 'assists', 'hits', 'yards', 'over', 'under']
        
        for keyword in stat_keywords:
            if keyword in market_name.lower():
                parts = market_name.lower().split(keyword)
                if parts[0]:
                    player_name = parts[0].strip()
                    # Convert back to title case
                    return ' '.join(word.capitalize() for word in player_name.split())
        
        # Fallback: take first part before parentheses or numbers
        cleaned = re.sub(r'\(.*?\)', '', market_name)
        cleaned = re.sub(r'\d+.*', '', cleaned)
        return cleaned.strip()
    
    def _extract_bet_type(self, market_name: str) -> str:
        """Extract bet type from market name"""
        market_lower = market_name.lower()
        
        type_mappings = {
            'points': 'points',
            'pts': 'points',
            'rebounds': 'rebounds',
            'reb': 'rebounds',
            'assists': 'assists',
            'ast': 'assists',
            'threes': 'threes_made',
            '3-pt': 'threes_made',
            'steals': 'steals',
            'blocks': 'blocks',
            'hits': 'hits',
            'strikeouts': 'strikeouts',
            'ks': 'strikeouts',
            'home runs': 'home_runs',
            'hr': 'home_runs',
            'rbi': 'rbis',
            'rushing': 'rushing_yards',
            'receiving': 'receiving_yards',
            'passing': 'passing_yards',
            'touchdown': 'touchdowns',
            'td': 'touchdowns',
            'saves': 'saves',
            'goals': 'goals',
            'shots': 'shots'
        }
        
        for keyword, bet_type in type_mappings.items():
            if keyword in market_lower:
                return bet_type
        
        return 'other'
    
    def _parse_selection_info(self, selection_name: str) -> Tuple[str, float]:
        """Parse selection name to extract side and line value"""
        selection_lower = selection_name.lower()
        
        # Determine side
        if 'over' in selection_lower:
            side = 'over'
        elif 'under' in selection_lower:
            side = 'under'
        elif 'yes' in selection_lower:
            side = 'over'
        elif 'no' in selection_lower:
            side = 'under'
        else:
            side = 'other'
        
        # Extract line value
        line_match = re.search(r'(\d+\.?\d*)', selection_name)
        line = float(line_match.group(1)) if line_match else 0.0
        
        return side, line
    
    async def get_game_lines(self, sport: str) -> List[CaesarsOdds]:
        """Get main game lines (spread, total, moneyline) for a sport"""
        sport_id = await self.get_sport_id_by_name(sport)
        if not sport_id:
            return []
        
        competitions = await self.get_competitions_by_sport(sport_id)
        all_lines = []
        
        for comp in competitions[:3]:  # Limit competitions
            events = await self.get_events_by_competition(comp['id'])
            
            for event in events[:5]:  # Limit events per competition
                event_lines = await self._get_event_game_lines(event['event_id'], sport)
                all_lines.extend(event_lines)
        
        return all_lines
    
    async def _get_event_game_lines(self, event_id: str, sport: str) -> List[CaesarsOdds]:
        """Get game lines for a specific event"""
        url = f"{self.SPORTS_API}/events/{event_id}/markets"
        
        data = await self._make_request(url)
        if not data:
            return []
        
        lines = []
        event_info = data.get('event', {})
        
        try:
            game_time = datetime.fromisoformat(event_info.get('startTime', '').replace('Z', '+00:00'))
        except:
            game_time = datetime.now()
        
        competitors = event_info.get('competitors', [])
        team_names = [comp.get('name', '') for comp in competitors]
        
        # Look for main game markets
        for market in data.get('markets', []):
            market_name = market.get('name', '').lower()
            market_type = market.get('type', '').lower()
            
            # Determine market type
            if 'spread' in market_name or 'handicap' in market_name or 'spread' in market_type:
                bet_type = 'spread'
            elif 'total' in market_name or 'over/under' in market_name or 'total' in market_type:
                bet_type = 'total'
            elif 'moneyline' in market_name or 'match winner' in market_name or 'winner' in market_type:
                bet_type = 'moneyline'
            else:
                continue
            
            # Process selections
            for selection in market.get('selections', []):
                selection_name = selection.get('name', '')
                side, line = self._parse_selection_info(selection_name)
                
                if bet_type == 'moneyline':
                    side = 'home' if team_names and team_names[0] in selection_name else 'away'
                
                price_info = selection.get('price', {})
                american_odds = price_info.get('a', -110)
                decimal_odds = price_info.get('d', 1.91)
                
                lines.append(CaesarsOdds(
                    event_id=event_id,
                    market_id=str(market.get('id', '')),
                    selection_id=str(selection.get('id', '')),
                    player_name='',
                    team=team_names[0] if team_names else '',
                    opponent=team_names[1] if len(team_names) > 1 else '',
                    league=sport.upper(),
                    sport=sport,
                    market_type='game_lines',
                    bet_type=bet_type,
                    line=line,
                    odds=american_odds,
                    decimal_odds=decimal_odds,
                    side=side,
                    timestamp=datetime.now(),
                    game_time=game_time,
                    boost_applied=selection.get('boosted', False)
                ))
        
        return lines
    
    async def get_caesars_rewards_info(self) -> Optional[CaesarsReward]:
        """Get Caesars Rewards program information (requires authentication)"""
        # This would require user authentication and account integration
        # For now, return general program information
        return CaesarsReward(
            tier="Gold",  # Default tier
            points_multiplier=1.0,
            cash_back_rate=0.02,  # 2%
            special_offers=["Daily Odds Boosts", "Free Bet Credits", "Reload Bonuses"]
        )
    
    async def search_player_props(self, player_name: str, sport: str) -> List[CaesarsOdds]:
        """Search for props for a specific player"""
        all_props = await self.get_player_props(sport)
        
        # Filter props for the specific player
        player_props = [
            prop for prop in all_props 
            if player_name.lower() in prop.player_name.lower()
        ]
        
        return player_props

# Example usage and testing functions
async def test_caesars_api():
    """Test the Caesars API integration"""
    async with CaesarsAPI() as caesars_api:
        print("Testing Caesars API...")
        
        # Test available sports
        sports = await caesars_api.get_available_sports()
        print(f"Available sports: {[s['name'] for s in sports[:5]]}")  # Show first 5
        
        # Test NBA player props
        basketball_sports = [s for s in sports if 'basketball' in s['name']]
        if basketball_sports:
            nba_props = await caesars_api.get_player_props('basketball')
            print(f"NBA player props found: {len(nba_props)}")
            
            if nba_props:
                print(f"Sample prop: {nba_props[0].player_name} - {nba_props[0].bet_type}: {nba_props[0].line}")
        
        # Test rewards info
        rewards = await caesars_api.get_caesars_rewards_info()
        if rewards:
            print(f"Caesars Rewards tier: {rewards.tier}, Cash back: {rewards.cash_back_rate:.1%}")

if __name__ == "__main__":
    asyncio.run(test_caesars_api())
