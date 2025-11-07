"""
BetMGM API Integration Service

This service provides comprehensive integration with BetMGM's API for:
- Live odds and lines
- Player props
- Game betting markets
- Promotional content
- Account integration (optional)

BetMGM uses their own API structure which requires specific handling.
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
class BetMGMOdds:
    """BetMGM odds data structure"""
    fixture_id: str
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
    side: str  # 'over', 'under', 'home', 'away'
    timestamp: datetime
    game_time: datetime
    status: str = "active"
    promotion_applied: bool = False

@dataclass
class BetMGMPromotion:
    """BetMGM promotion data"""
    promo_id: str
    title: str
    description: str
    terms: str
    valid_until: datetime
    applicable_markets: List[str]
    boost_percentage: float = 0.0

class BetMGMAPI:
    """
    BetMGM API integration using their mobile/web endpoints.
    
    Note: BetMGM's API structure uses fixture-based organization
    with different endpoint patterns than other sportsbooks.
    """
    
    BASE_URL = "https://sports.betmgm.com"
    API_BASE = "https://sports.betmgm.com/cds-api"
    FIXTURES_API = "https://sports.betmgm.com/cds-api/betting-offer/v1"
    
    def __init__(self, jurisdiction: str = "us", rate_limit_delay: float = 1.5):
        self.jurisdiction = jurisdiction
        self.rate_limit_delay = rate_limit_delay
        self.last_request_time = 0
        self.session: Optional[aiohttp.ClientSession] = None
        self.cache = {}
        self.cache_ttl = 90  # 1.5 minute cache
        
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
                'X-Jurisdiction': self.jurisdiction,
                'Referer': 'https://sports.betmgm.com/',
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
            logger.debug(f"Cache hit for BetMGM request: {url}")
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
                    logger.debug(f"BetMGM API request successful: {url}")
                    return data
                elif response.status == 429:
                    logger.warning("BetMGM rate limit hit, backing off")
                    await asyncio.sleep(10)
                    return None
                else:
                    logger.error(f"BetMGM API error {response.status}: {url}")
                    return None
                    
        except Exception as e:
            logger.error(f"BetMGM API request failed: {e}")
            return None
    
    async def get_available_sports(self) -> List[Dict[str, Any]]:
        """Get list of available sports from BetMGM"""
        url = f"{self.API_BASE}/betting-offer/v1/sports"
        
        data = await self._make_request(url)
        if not data:
            return []
        
        sports = []
        for sport in data.get('sports', []):
            if sport.get('active', False):
                sports.append({
                    'id': sport.get('id'),
                    'name': sport.get('name', '').lower(),
                    'display_name': sport.get('displayName', ''),
                    'event_count': sport.get('eventCount', 0)
                })
        
        return sports
    
    async def get_fixtures_by_sport(self, sport_id: str) -> List[Dict[str, Any]]:
        """Get all fixtures (games/events) for a specific sport"""
        url = f"{self.FIXTURES_API}/fixtures"
        params = {
            'sportId': sport_id,
            'jurisdiction': self.jurisdiction
        }
        
        data = await self._make_request(url, params)
        if not data:
            return []
        
        fixtures = []
        for fixture in data.get('fixtures', []):
            fixtures.append({
                'fixture_id': str(fixture.get('id', '')),
                'name': fixture.get('name', ''),
                'start_time': fixture.get('startTime'),
                'competition': fixture.get('competition', {}).get('name', ''),
                'participants': [p.get('name', '') for p in fixture.get('participants', [])],
                'status': fixture.get('stage', ''),
                'live': fixture.get('stage') == 'Live',
                'market_count': len(fixture.get('optionMarkets', [])),
            })
        
        return fixtures
    
    async def get_sport_id_by_name(self, sport_name: str) -> Optional[str]:
        """Get sport ID by sport name"""
        sports = await self.get_available_sports()
        
        sport_name_lower = sport_name.lower()
        for sport in sports:
            if sport['name'] == sport_name_lower or sport_name_lower in sport['name']:
                return sport['id']
        
        return None
    
    async def get_player_props(self, sport: str, fixture_id: Optional[str] = None) -> List[BetMGMOdds]:
        """Get player props for a sport or specific fixture"""
        sport_id = await self.get_sport_id_by_name(sport)
        if not sport_id:
            logger.warning(f"Sport '{sport}' not found in BetMGM")
            return []
        
        if fixture_id:
            # Get props for specific fixture
            url = f"{self.FIXTURES_API}/fixtures/{fixture_id}/markets"
        else:
            # Get fixtures first, then get props for each
            fixtures = await self.get_fixtures_by_sport(sport_id)
            all_props = []
            
            for fixture in fixtures[:10]:  # Limit to first 10 fixtures to avoid rate limits
                fixture_props = await self.get_player_props(sport, fixture['fixture_id'])
                all_props.extend(fixture_props)
            
            return all_props
        
        params = {
            'jurisdiction': self.jurisdiction,
            'includeParticipants': 'true'
        }
        
        data = await self._make_request(url, params)
        if not data:
            return []
        
        props = []
        fixture = data.get('fixture', {})
        participants = fixture.get('participants', [])
        
        # Parse game time
        try:
            game_time = datetime.fromisoformat(fixture.get('startTime', '').replace('Z', '+00:00'))
        except:
            game_time = datetime.now()
        
        # Get team names
        team_names = [p.get('name', '') for p in participants]
        
        # Process option markets (player props)
        for market in data.get('optionMarkets', []):
            market_name = market.get('name', {}).get('value', '')
            
            # Check if this is a player prop market
            if self._is_player_prop_market(market_name):
                player_name = self._extract_player_name(market_name)
                bet_type = self._extract_bet_type(market_name)
                
                # Process market options (Over/Under selections)
                for option in market.get('options', []):
                    for selection in option.get('selections', []):
                        selection_name = selection.get('name', {}).get('value', '')
                        
                        # Determine if this is over or under
                        side = 'over' if 'over' in selection_name.lower() else 'under'
                        
                        # Extract line value
                        line = self._extract_line_value(selection_name)
                        
                        # Get odds
                        odds = selection.get('price', {}).get('a', -110)  # American odds
                        
                        props.append(BetMGMOdds(
                            fixture_id=fixture_id,
                            selection_id=str(selection.get('id', '')),
                            player_name=player_name,
                            team=team_names[0] if team_names else '',
                            opponent=team_names[1] if len(team_names) > 1 else '',
                            league=sport.upper(),
                            sport=sport,
                            market_type='player_props',
                            bet_type=bet_type,
                            line=line,
                            odds=odds,
                            side=side,
                            timestamp=datetime.now(),
                            game_time=game_time,
                            status='active' if fixture.get('stage') == 'Prematch' else 'live'
                        ))
        
        return props
    
    def _is_player_prop_market(self, market_name: str) -> bool:
        """Check if market is a player prop market"""
        market_lower = market_name.lower()
        player_indicators = [
            'points', 'rebounds', 'assists', 'steals', 'blocks',
            'hits', 'runs', 'strikeouts', 'home runs', 'rbi',
            'rushing', 'receiving', 'passing', 'touchdown',
            'saves', 'goals', 'shots'
        ]
        
        return any(indicator in market_lower for indicator in player_indicators)
    
    def _extract_player_name(self, market_name: str) -> str:
        """Extract player name from market name"""
        # BetMGM format is usually "Player Name - Stat Type"
        if ' - ' in market_name:
            return market_name.split(' - ')[0].strip()
        
        # Fallback: try to extract name before parentheses or stat keywords
        for keyword in ['points', 'rebounds', 'assists', 'hits', 'yards']:
            if keyword in market_name.lower():
                parts = market_name.lower().split(keyword)
                if parts[0]:
                    return parts[0].strip().title()
        
        return 'Unknown Player'
    
    def _extract_bet_type(self, market_name: str) -> str:
        """Extract bet type from market name"""
        market_lower = market_name.lower()
        
        if 'points' in market_lower or 'pts' in market_lower:
            return 'points'
        elif 'rebounds' in market_lower or 'reb' in market_lower:
            return 'rebounds'
        elif 'assists' in market_lower or 'ast' in market_lower:
            return 'assists'
        elif 'threes' in market_lower or '3-pt' in market_lower:
            return 'threes_made'
        elif 'steals' in market_lower:
            return 'steals'
        elif 'blocks' in market_lower:
            return 'blocks'
        elif 'hits' in market_lower:
            return 'hits'
        elif 'strikeouts' in market_lower or 'ks' in market_lower:
            return 'strikeouts'
        elif 'home runs' in market_lower or 'hr' in market_lower:
            return 'home_runs'
        elif 'rbi' in market_lower:
            return 'rbis'
        elif 'rushing' in market_lower:
            return 'rushing_yards'
        elif 'receiving' in market_lower:
            return 'receiving_yards'
        elif 'passing' in market_lower:
            return 'passing_yards'
        elif 'touchdown' in market_lower or 'td' in market_lower:
            return 'touchdowns'
        else:
            return 'other'
    
    def _extract_line_value(self, selection_name: str) -> float:
        """Extract numerical line value from selection name"""
        # Look for patterns like "Over 25.5", "Under 10.5", etc.
        line_match = re.search(r'(\d+\.?\d*)', selection_name)
        if line_match:
            return float(line_match.group(1))
        return 0.0
    
    async def get_game_lines(self, sport: str) -> List[BetMGMOdds]:
        """Get main game lines (spread, total, moneyline) for a sport"""
        sport_id = await self.get_sport_id_by_name(sport)
        if not sport_id:
            return []
        
        fixtures = await self.get_fixtures_by_sport(sport_id)
        all_lines = []
        
        for fixture in fixtures[:10]:  # Limit to avoid rate limits
            fixture_lines = await self._get_fixture_game_lines(fixture['fixture_id'], sport)
            all_lines.extend(fixture_lines)
        
        return all_lines
    
    async def _get_fixture_game_lines(self, fixture_id: str, sport: str) -> List[BetMGMOdds]:
        """Get game lines for a specific fixture"""
        url = f"{self.FIXTURES_API}/fixtures/{fixture_id}/markets"
        params = {
            'jurisdiction': self.jurisdiction,
            'includeParticipants': 'true'
        }
        
        data = await self._make_request(url, params)
        if not data:
            return []
        
        lines = []
        fixture = data.get('fixture', {})
        participants = fixture.get('participants', [])
        
        try:
            game_time = datetime.fromisoformat(fixture.get('startTime', '').replace('Z', '+00:00'))
        except:
            game_time = datetime.now()
        
        team_names = [p.get('name', '') for p in participants]
        
        # Look for main game markets
        for market in data.get('optionMarkets', []):
            market_name = market.get('name', {}).get('value', '').lower()
            
            # Determine market type
            if 'spread' in market_name or 'handicap' in market_name:
                bet_type = 'spread'
            elif 'total' in market_name or 'over/under' in market_name:
                bet_type = 'total'
            elif 'moneyline' in market_name or 'match result' in market_name or '1x2' in market_name:
                bet_type = 'moneyline'
            else:
                continue
            
            # Process options
            for option in market.get('options', []):
                for selection in option.get('selections', []):
                    selection_name = selection.get('name', {}).get('value', '')
                    line = self._extract_line_value(selection_name)
                    odds = selection.get('price', {}).get('a', -110)
                    
                    # Determine side
                    if bet_type == 'moneyline':
                        side = 'home' if team_names and team_names[0] in selection_name else 'away'
                    else:
                        side = 'over' if 'over' in selection_name.lower() else 'under'
                    
                    lines.append(BetMGMOdds(
                        fixture_id=fixture_id,
                        selection_id=str(selection.get('id', '')),
                        player_name='',
                        team=team_names[0] if team_names else '',
                        opponent=team_names[1] if len(team_names) > 1 else '',
                        league=sport.upper(),
                        sport=sport,
                        market_type='game_lines',
                        bet_type=bet_type,
                        line=line,
                        odds=odds,
                        side=side,
                        timestamp=datetime.now(),
                        game_time=game_time
                    ))
        
        return lines
    
    async def get_promotions(self) -> List[BetMGMPromotion]:
        """Get active promotions from BetMGM"""
        url = f"{self.API_BASE}/promotion/v1/promotions"
        params = {
            'jurisdiction': self.jurisdiction,
            'active': 'true'
        }
        
        data = await self._make_request(url, params)
        if not data:
            return []
        
        promotions = []
        for promo in data.get('promotions', []):
            try:
                valid_until = datetime.fromisoformat(promo.get('validUntil', '').replace('Z', '+00:00'))
            except:
                valid_until = datetime.now() + timedelta(days=1)
            
            promotions.append(BetMGMPromotion(
                promo_id=str(promo.get('id', '')),
                title=promo.get('title', ''),
                description=promo.get('description', ''),
                terms=promo.get('terms', ''),
                valid_until=valid_until,
                applicable_markets=promo.get('applicableMarkets', []),
                boost_percentage=promo.get('boostPercentage', 0.0)
            ))
        
        return promotions
    
    async def search_player_props(self, player_name: str, sport: str) -> List[BetMGMOdds]:
        """Search for props for a specific player"""
        all_props = await self.get_player_props(sport)
        
        # Filter props for the specific player
        player_props = [
            prop for prop in all_props 
            if player_name.lower() in prop.player_name.lower()
        ]
        
        return player_props

# Example usage and testing functions
async def test_betmgm_api():
    """Test the BetMGM API integration"""
    async with BetMGMAPI() as betmgm_api:
        print("Testing BetMGM API...")
        
        # Test available sports
        sports = await betmgm_api.get_available_sports()
        print(f"Available sports: {[s['name'] for s in sports[:5]]}")  # Show first 5
        
        # Test NBA player props
        nba_sports = [s for s in sports if 'basketball' in s['name'] or 'nba' in s['name']]
        if nba_sports:
            nba_props = await betmgm_api.get_player_props('basketball')
            print(f"NBA player props found: {len(nba_props)}")
            
            if nba_props:
                print(f"Sample prop: {nba_props[0].player_name} - {nba_props[0].bet_type}: {nba_props[0].line}")
        
        # Test promotions
        promotions = await betmgm_api.get_promotions()
        print(f"Active promotions: {len(promotions)}")

if __name__ == "__main__":
    asyncio.run(test_betmgm_api())
