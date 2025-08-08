"""
Odds Aggregation Service - Multi-sportsbook odds comparison and arbitrage detection
Provides best-line identification and real-time arbitrage opportunities
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import json
import os

import httpx
from fastapi import HTTPException

logger = logging.getLogger(__name__)

@dataclass
class BookLine:
    """Individual sportsbook line"""
    book_id: str
    book_name: str
    market: str
    player_name: str
    stat_type: str
    line: float
    over_price: int
    under_price: int
    timestamp: datetime
    
@dataclass
class CanonicalLine:
    """Canonical representation of best available lines"""
    market: str
    player_name: str
    stat_type: str
    best_over_book: str
    best_over_price: int
    best_over_line: float
    best_under_book: str
    best_under_price: int
    best_under_line: float
    books: List[BookLine]
    no_vig_fair_price: float
    arbitrage_opportunity: bool
    arbitrage_profit: float

@dataclass
class ArbitrageOpportunity:
    """Arbitrage betting opportunity"""
    market: str
    player_name: str
    stat_type: str
    over_book: str
    over_price: int
    over_line: float
    under_book: str
    under_price: int
    under_line: float
    profit_percentage: float
    stake_distribution: Dict[str, float]
    timestamp: datetime

class OddsAggregationService:
    """Service for aggregating odds from multiple sportsbooks"""
    
    def __init__(self):
        self.api_key = os.getenv("ODDS_API_KEY")
        self.base_url = "https://api.the-odds-api.com/v4"
        self.timeout = 10.0
        self.cache_ttl = 30  # 30 seconds for odds data
        self.odds_cache: Dict[str, Dict] = {}
        
        # Mock sportsbook data for demo/offline mode
        self.mock_books = [
            {"id": "draftkings", "name": "DraftKings"},
            {"id": "fanduel", "name": "FanDuel"},
            {"id": "betmgm", "name": "BetMGM"},
            {"id": "caesars", "name": "Caesars"},
            {"id": "pointsbet", "name": "PointsBet"},
        ]
    
    async def get_available_books(self) -> List[Dict[str, str]]:
        """Get list of available sportsbooks"""
        if not self.api_key:
            logger.warning("No ODDS_API_KEY configured, using mock data")
            return self.mock_books
            
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/sports/americanfootball_nfl/bookmakers",
                    params={"apiKey": self.api_key}
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.warning(f"Failed to fetch bookmakers: {e}, using mock data")
            return self.mock_books
    
    async def fetch_player_props(self, sport: str = "baseball_mlb") -> List[BookLine]:
        """Fetch player props from multiple sportsbooks"""
        if not self.api_key:
            return self._generate_mock_props()
            
        cache_key = f"props:{sport}"
        if cache_key in self.odds_cache:
            cached_data = self.odds_cache[cache_key]
            if datetime.now() - cached_data["timestamp"] < timedelta(seconds=self.cache_ttl):
                return cached_data["data"]
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/sports/{sport}/odds",
                    params={
                        "apiKey": self.api_key,
                        "regions": "us",
                        "markets": "player_props",
                        "oddsFormat": "american"
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                # Parse response into BookLine objects
                lines = self._parse_odds_response(data)
                
                # Cache the results
                self.odds_cache[cache_key] = {
                    "data": lines,
                    "timestamp": datetime.now()
                }
                
                return lines
                
        except Exception as e:
            logger.error(f"Failed to fetch odds: {e}")
            return self._generate_mock_props()
    
    def _parse_odds_response(self, data: List[Dict]) -> List[BookLine]:
        """Parse API response into BookLine objects"""
        lines = []
        
        for game in data:
            for bookmaker in game.get("bookmakers", []):
                for market in bookmaker.get("markets", []):
                    if market["key"] == "player_props":
                        for outcome in market.get("outcomes", []):
                            # Parse player prop outcome
                            line = BookLine(
                                book_id=bookmaker["key"],
                                book_name=bookmaker["title"],
                                market=f"{game['home_team']} vs {game['away_team']}",
                                player_name=outcome.get("description", "Unknown Player"),
                                stat_type=market.get("stat_type", "points"),
                                line=float(outcome.get("point", 0)),
                                over_price=outcome.get("price", 100) if outcome.get("name") == "Over" else 0,
                                under_price=outcome.get("price", -110) if outcome.get("name") == "Under" else 0,
                                timestamp=datetime.now()
                            )
                            lines.append(line)
        
        return lines
    
    def _generate_mock_props(self) -> List[BookLine]:
        """Generate mock prop data for demo/offline mode"""
        import random
        
        mock_players = [
            "Aaron Judge", "Mookie Betts", "Ronald Acuna Jr.", "Vladimir Guerrero Jr.",
            "Mike Trout", "Fernando Tatis Jr.", "Juan Soto", "Shohei Ohtani"
        ]
        
        stat_types = ["hits", "total_bases", "home_runs", "rbis", "runs_scored"]
        
        lines = []
        
        for player in mock_players[:4]:  # Limit for demo
            for stat in stat_types[:2]:  # Limit stat types
                base_line = random.uniform(0.5, 3.5)
                
                for book in self.mock_books:
                    # Add some variance in lines between books
                    line_variance = random.uniform(-0.1, 0.1)
                    book_line = max(0.5, base_line + line_variance)
                    
                    # Generate realistic odds with variance
                    base_over_odds = random.randint(-130, -90)
                    base_under_odds = random.randint(-130, -90)
                    
                    line_obj = BookLine(
                        book_id=book["id"],
                        book_name=book["name"],
                        market="Mock Game",
                        player_name=player,
                        stat_type=stat,
                        line=round(book_line, 1),
                        over_price=base_over_odds + random.randint(-10, 10),
                        under_price=base_under_odds + random.randint(-10, 10),
                        timestamp=datetime.now()
                    )
                    lines.append(line_obj)
        
        return lines
    
    async def find_best_lines(self, sport: str = "baseball_mlb") -> List[CanonicalLine]:
        """Find best available lines across all sportsbooks"""
        all_lines = await self.fetch_player_props(sport)
        
        # Group by player and stat type
        grouped_lines: Dict[str, List[BookLine]] = {}
        
        for line in all_lines:
            key = f"{line.player_name}:{line.stat_type}"
            if key not in grouped_lines:
                grouped_lines[key] = []
            grouped_lines[key].append(line)
        
        canonical_lines = []
        
        for key, lines in grouped_lines.items():
            if len(lines) < 2:  # Need at least 2 books for comparison
                continue
                
            # Find best over and under prices
            best_over = max(lines, key=lambda x: x.over_price)
            best_under = max(lines, key=lambda x: x.under_price)
            
            # Calculate no-vig fair price
            over_implied = self._american_to_probability(best_over.over_price)
            under_implied = self._american_to_probability(best_under.under_price)
            no_vig_fair = over_implied / (over_implied + under_implied)
            
            # Check for arbitrage opportunity
            total_implied = over_implied + under_implied
            arbitrage_opportunity = total_implied < 1.0
            arbitrage_profit = (1.0 - total_implied) * 100 if arbitrage_opportunity else 0.0
            
            canonical_line = CanonicalLine(
                market=lines[0].market,
                player_name=lines[0].player_name,
                stat_type=lines[0].stat_type,
                best_over_book=best_over.book_name,
                best_over_price=best_over.over_price,
                best_over_line=best_over.line,
                best_under_book=best_under.book_name,
                best_under_price=best_under.under_price,
                best_under_line=best_under.line,
                books=lines,
                no_vig_fair_price=no_vig_fair,
                arbitrage_opportunity=arbitrage_opportunity,
                arbitrage_profit=arbitrage_profit
            )
            
            canonical_lines.append(canonical_line)
        
        # Sort by arbitrage profit (highest first)
        canonical_lines.sort(key=lambda x: x.arbitrage_profit, reverse=True)
        
        return canonical_lines
    
    async def find_arbitrage_opportunities(self, sport: str = "baseball_mlb", min_profit: float = 1.0) -> List[ArbitrageOpportunity]:
        """Find arbitrage opportunities with minimum profit threshold"""
        best_lines = await self.find_best_lines(sport)
        
        opportunities = []
        
        for line in best_lines:
            if line.arbitrage_opportunity and line.arbitrage_profit >= min_profit:
                # Calculate optimal stake distribution
                over_implied = self._american_to_probability(line.best_over_price)
                under_implied = self._american_to_probability(line.best_under_price)
                
                total_stake = 100  # $100 total bet
                over_stake = total_stake * (under_implied / (over_implied + under_implied))
                under_stake = total_stake * (over_implied / (over_implied + under_implied))
                
                opportunity = ArbitrageOpportunity(
                    market=line.market,
                    player_name=line.player_name,
                    stat_type=line.stat_type,
                    over_book=line.best_over_book,
                    over_price=line.best_over_price,
                    over_line=line.best_over_line,
                    under_book=line.best_under_book,
                    under_price=line.best_under_price,
                    under_line=line.best_under_line,
                    profit_percentage=line.arbitrage_profit,
                    stake_distribution={
                        "over": round(over_stake, 2),
                        "under": round(under_stake, 2)
                    },
                    timestamp=datetime.now()
                )
                
                opportunities.append(opportunity)
        
        return opportunities
    
    def _american_to_probability(self, american_odds: int) -> float:
        """Convert American odds to implied probability"""
        if american_odds > 0:
            return 100 / (american_odds + 100)
        else:
            return abs(american_odds) / (abs(american_odds) + 100)

# Singleton instance
_odds_service = None

def get_odds_service() -> OddsAggregationService:
    """Get singleton odds aggregation service instance"""
    global _odds_service
    if _odds_service is None:
        _odds_service = OddsAggregationService()
    return _odds_service
