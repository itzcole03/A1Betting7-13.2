"""
DraftKings API Integration Service

This service provides comprehensive integration with DraftKings' API for:
- Live odds and lines
- Player props
- Game betting markets
- Line movement tracking
- Account management (optional)

Note: DraftKings doesn't provide a public API, so this implementation
uses web scraping with proper rate limiting and error handling.
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
class DraftKingsOdds:
    """DraftKings odds data structure"""
    event_id: str
    player_name: str
    team: str
    opponent: str
    league: str
    sport: str
    market_type: str
    bet_type: str
    line: float
    over_odds: int
    under_odds: int
    timestamp: datetime
    game_time: datetime
    status: str = "active"

@dataclass
class DraftKingsMarket:
    """DraftKings market information"""
    market_id: str
    market_name: str
    event_id: str
    selections: List[Dict[str, Any]]
    is_live: bool
    timestamp: datetime

class DraftKingsAPI:
    """
    DraftKings API integration using their publicly available endpoints
    and web scraping for data not available via API.
    """
    
    BASE_URL = "https://sportsbook.draftkings.com"
    API_BASE = "https://sportsbook-nash-usva.draftkings.com"
    
    def __init__(self, rate_limit_delay: float = 1.0):
        self.rate_limit_delay = rate_limit_delay
        self.last_request_time = 0
        self.session: Optional[aiohttp.ClientSession] = None
        self.cache = {}
        self.cache_ttl = 60  # 1 minute cache
        
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
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
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
            logger.debug(f"Cache hit for DraftKings request: {url}")
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
                    logger.debug(f"DraftKings API request successful: {url}")
                    return data
                elif response.status == 429:
                    logger.warning("DraftKings rate limit hit, backing off")
                    await asyncio.sleep(5)
                    return None
                else:
                    logger.error(f"DraftKings API error {response.status}: {url}")
                    return None
                    
        except Exception as e:
            logger.error(f"DraftKings API request failed: {e}")
            return None
    
    async def get_available_sports(self) -> List[str]:
        """Get list of available sports from DraftKings"""
        url = f"{self.API_BASE}/api/sportscontent/markets/v1/sports"
        
        data = await self._make_request(url)
        if not data:
            return []
        
        sports = []
        for sport in data.get('sports', []):
            if sport.get('isActive', False):
                sports.append(sport.get('name', '').lower())
        
        return sports
    
    async def get_events_by_sport(self, sport: str) -> List[Dict[str, Any]]:
        """Get all events for a specific sport"""
        # Map common sport names to DraftKings sport IDs
        sport_mapping = {
            'nfl': 88808,
            'nba': 42648,
            'mlb': 84240,
            'nhl': 42133,
            'ncaaf': 87637,
            'ncaab': 87636,
            'soccer': 40253,
            'tennis': 40856,
            'golf': 40542,
            'ufc': 40012,
            'boxing': 40013,
        }
        
        sport_id = sport_mapping.get(sport.lower())
        if not sport_id:
            logger.warning(f"Sport '{sport}' not found in DraftKings mapping")
            return []
        
        url = f"{self.API_BASE}/api/sportscontent/dkusva/v1/leagues/{sport_id}/events"
        params = {
            'format': 'json',
            'includeMarkets': 'true'
        }
        
        data = await self._make_request(url, params)
        if not data:
            return []
        
        events = []
        for event in data.get('events', []):
            events.append({
                'event_id': str(event.get('eventId', '')),
                'name': event.get('name', ''),
                'start_time': event.get('startTime'),
                'teams': event.get('teamNames', []),
                'status': event.get('eventStatus', {}).get('state', ''),
                'markets_count': len(event.get('displayGroups', [])),
            })
        
        return events
    
    async def get_player_props(self, sport: str, event_id: Optional[str] = None) -> List[DraftKingsOdds]:
        """Get player props for a sport or specific event"""
        sport_mapping = {
            'nfl': 88808,
            'nba': 42648,
            'mlb': 84240,
            'nhl': 42133,
        }
        
        sport_id = sport_mapping.get(sport.lower())
        if not sport_id:
            return []
        
        if event_id:
            # Get props for specific event
            url = f"{self.API_BASE}/api/sportscontent/dkusva/v1/events/{event_id}"
        else:
            # Get props for all events in sport
            url = f"{self.API_BASE}/api/sportscontent/dkusva/v1/leagues/{sport_id}/events"
        
        params = {
            'format': 'json',
            'includeMarkets': 'true',
            'includeDisplayGroups': 'true'
        }
        
        data = await self._make_request(url, params)
        if not data:
            return []
        
        props = []
        events = data.get('events', []) if not event_id else [data]
        
        for event in events:
            event_id = str(event.get('eventId', ''))
            team_names = event.get('teamNames', [])
            start_time = event.get('startTime')
            
            # Parse game time
            try:
                game_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            except:
                game_time = datetime.now()
            
            # Extract display groups (market categories)
            for display_group in event.get('displayGroups', []):
                if 'player' in display_group.get('description', '').lower():
                    # This is a player props group
                    for market in display_group.get('markets', []):
                        market_name = market.get('name', '')
                        
                        # Extract player name and stat type
                        player_match = re.search(r'^([^-]+)', market_name)
                        player_name = player_match.group(1).strip() if player_match else 'Unknown'
                        
                        # Determine bet type
                        bet_type = self._extract_bet_type(market_name)
                        
                        # Get outcomes (Over/Under)
                        outcomes = market.get('outcomes', [])
                        if len(outcomes) >= 2:
                            over_outcome = next((o for o in outcomes if 'over' in o.get('label', '').lower()), None)
                            under_outcome = next((o for o in outcomes if 'under' in o.get('label', '').lower()), None)
                            
                            if over_outcome and under_outcome:
                                # Extract line value
                                line = self._extract_line_value(over_outcome.get('label', ''))
                                
                                props.append(DraftKingsOdds(
                                    event_id=event_id,
                                    player_name=player_name,
                                    team=team_names[0] if team_names else '',
                                    opponent=team_names[1] if len(team_names) > 1 else '',
                                    league=sport.upper(),
                                    sport=sport,
                                    market_type='player_props',
                                    bet_type=bet_type,
                                    line=line,
                                    over_odds=over_outcome.get('oddsAmerican', -110),
                                    under_odds=under_outcome.get('oddsAmerican', -110),
                                    timestamp=datetime.now(),
                                    game_time=game_time,
                                    status='active' if event.get('eventStatus', {}).get('state') == 'NOT_STARTED' else 'live'
                                ))
        
        return props
    
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
    
    def _extract_line_value(self, label: str) -> float:
        """Extract numerical line value from outcome label"""
        # Look for patterns like "Over 25.5", "25.5+", etc.
        line_match = re.search(r'(\d+\.?\d*)', label)
        if line_match:
            return float(line_match.group(1))
        return 0.0
    
    async def get_game_lines(self, sport: str) -> List[DraftKingsOdds]:
        """Get main game lines (spread, total, moneyline) for a sport"""
        sport_mapping = {
            'nfl': 88808,
            'nba': 42648,
            'mlb': 84240,
            'nhl': 42133,
        }
        
        sport_id = sport_mapping.get(sport.lower())
        if not sport_id:
            return []
        
        url = f"{self.API_BASE}/api/sportscontent/dkusva/v1/leagues/{sport_id}/events"
        params = {
            'format': 'json',
            'includeMarkets': 'true'
        }
        
        data = await self._make_request(url, params)
        if not data:
            return []
        
        lines = []
        for event in data.get('events', []):
            event_id = str(event.get('eventId', ''))
            team_names = event.get('teamNames', [])
            
            try:
                game_time = datetime.fromisoformat(event.get('startTime', '').replace('Z', '+00:00'))
            except:
                game_time = datetime.now()
            
            # Look for main game markets
            for display_group in event.get('displayGroups', []):
                description = display_group.get('description', '').lower()
                
                if 'game lines' in description or 'main' in description:
                    for market in display_group.get('markets', []):
                        market_name = market.get('name', '').lower()
                        
                        # Determine market type
                        if 'spread' in market_name or 'point spread' in market_name:
                            bet_type = 'spread'
                        elif 'total' in market_name or 'over/under' in market_name:
                            bet_type = 'total'
                        elif 'moneyline' in market_name or 'match winner' in market_name:
                            bet_type = 'moneyline'
                        else:
                            continue
                        
                        outcomes = market.get('outcomes', [])
                        if len(outcomes) >= 2:
                            if bet_type in ['spread', 'total']:
                                over_outcome = outcomes[0]
                                under_outcome = outcomes[1]
                                
                                line = self._extract_line_value(over_outcome.get('label', ''))
                                
                                lines.append(DraftKingsOdds(
                                    event_id=event_id,
                                    player_name='',
                                    team=team_names[0] if team_names else '',
                                    opponent=team_names[1] if len(team_names) > 1 else '',
                                    league=sport.upper(),
                                    sport=sport,
                                    market_type='game_lines',
                                    bet_type=bet_type,
                                    line=line,
                                    over_odds=over_outcome.get('oddsAmerican', -110),
                                    under_odds=under_outcome.get('oddsAmerican', -110),
                                    timestamp=datetime.now(),
                                    game_time=game_time
                                ))
        
        return lines
    
    async def search_player_props(self, player_name: str, sport: str) -> List[DraftKingsOdds]:
        """Search for props for a specific player"""
        all_props = await self.get_player_props(sport)
        
        # Filter props for the specific player
        player_props = [
            prop for prop in all_props 
            if player_name.lower() in prop.player_name.lower()
        ]
        
        return player_props
    
    async def get_line_movement(self, market_id: str, hours_back: int = 24) -> List[Dict[str, Any]]:
        """Get line movement history for a market (limited by DraftKings API)"""
        # DraftKings doesn't provide historical line movement via public API
        # This would require either:
        # 1. Storing our own line movement data over time
        # 2. Using a third-party odds tracking service
        # 3. Web scraping historical data (not recommended)
        
        logger.warning("Line movement history not available through DraftKings public API")
        return []
    
    async def get_market_depth(self, market_id: str) -> Dict[str, Any]:
        """Get market depth/liquidity information (not available publicly)"""
        logger.warning("Market depth not available through DraftKings public API")
        return {}

# Example usage and testing functions
async def test_draftkings_api():
    """Test the DraftKings API integration"""
    async with DraftKingsAPI() as dk_api:
        print("Testing DraftKings API...")
        
        # Test available sports
        sports = await dk_api.get_available_sports()
        print(f"Available sports: {sports[:5]}...")  # Show first 5
        
        # Test NBA player props
        if 'nba' in [s.lower() for s in sports]:
            nba_props = await dk_api.get_player_props('nba')
            print(f"NBA player props found: {len(nba_props)}")
            
            if nba_props:
                print(f"Sample prop: {nba_props[0].player_name} - {nba_props[0].bet_type}: {nba_props[0].line}")
        
        # Test game lines
        game_lines = await dk_api.get_game_lines('nba')
        print(f"NBA game lines found: {len(game_lines)}")

if __name__ == "__main__":
    asyncio.run(test_draftkings_api())
