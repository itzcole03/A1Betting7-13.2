"""
Player Performance Service - Historical data analysis and trend calculation
Provides player performance vs betting lines analysis with rolling statistics
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import statistics
import random

from backend.models.player_models import (
    PlayerPerformanceGame,
    PlayerPerformanceStats,
    PlayerPerformanceData
)

logger = logging.getLogger(__name__)


class PlayerPerformanceService:
    """Service for analyzing player performance against betting lines"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    async def get_player_performance(
        self,
        sport: str,
        player: str,
        market: str,
        window: int = 10
    ) -> PlayerPerformanceData:
        """
        Get player performance data with historical game results vs betting lines
        
        Args:
            sport: Sport type (MLB, NBA, NFL, NHL)
            player: Player name
            market: Market type (HR, Hits, Points, etc.)
            window: Number of recent games to analyze
            
        Returns:
            PlayerPerformanceData with recent games and aggregate statistics
        """
        self.logger.info(f"Fetching performance data for {player} in {sport} {market} (last {window} games)")
        
        try:
            # Fetch historical game data (mock data for now - replace with real data integration)
            recent_games = await self._fetch_historical_games(sport, player, market, window)
            
            # Calculate aggregate statistics
            stats = self._calculate_performance_stats(recent_games, market)
            
            return PlayerPerformanceData(
                player=player,
                sport=sport,
                market=market,
                window=window,
                recent_games=recent_games,
                stats=stats,
                timestamp=datetime.now().isoformat()
            )
            
        except Exception as e:
            self.logger.error(f"Error fetching performance data for {player}: {e}")
            raise
    
    async def _fetch_historical_games(
        self,
        sport: str,
        player: str,
        market: str,
        window: int
    ) -> List[PlayerPerformanceGame]:
        """
        Fetch historical game data from data sources
        
        In production, this would integrate with:
        - MLB Stats API
        - SportRadar
        - Baseball Savant
        - Historical betting line data
        """
        self.logger.info(f"Fetching historical data for {player} - {market} (last {window} games)")
        
        games = []
        base_date = datetime.now()
        
        # Mock realistic performance data based on sport/market type
        market_config = self._get_market_config(sport, market)
        
        for i in range(window):
            game_date = base_date - timedelta(days=i * 2 + random.randint(1, 3))
            
            # Generate realistic stat value with some variance
            base_value = market_config["base_value"]
            variance = market_config["variance"]
            stat_value = max(0, base_value + random.normalvariate(0, variance))
            
            # Generate realistic betting line (usually close to player average)
            line_variance = variance * 0.5
            line_at_time = max(0.5, base_value + random.normalvariate(0, line_variance))
            
            # Round based on market type
            if market_config["is_integer"]:
                stat_value = round(stat_value)
                line_at_time = round(line_at_time, 1)  # Lines often use .5 increments
            else:
                stat_value = round(stat_value, 2)
                line_at_time = round(line_at_time, 1)
            
            result_over = stat_value > line_at_time
            
            games.append(PlayerPerformanceGame(
                date=game_date.strftime("%Y-%m-%d"),
                stat_value=stat_value,
                line_at_time=line_at_time,
                result_over=result_over,
                opponent=self._generate_opponent_name(),
                home=random.choice([True, False]),
                confidence=random.uniform(0.65, 0.95)
            ))
        
        # Sort by date (most recent first)
        games.sort(key=lambda x: x.date, reverse=True)
        return games
    
    def _calculate_performance_stats(
        self,
        games: List[PlayerPerformanceGame],
        market: str
    ) -> PlayerPerformanceStats:
        """Calculate aggregate performance statistics"""
        
        if not games:
            return PlayerPerformanceStats(
                rolling_avg=0.0,
                hit_rate=0.0,
                std_dev=0.0,
                total_games=0,
                over_count=0,
                under_count=0,
                avg_line=0.0,
                avg_actual=0.0
            )
        
        stat_values = [game.stat_value for game in games]
        lines = [game.line_at_time for game in games]
        over_results = [game.result_over for game in games]
        
        rolling_avg = statistics.mean(stat_values)
        std_dev = statistics.stdev(stat_values) if len(stat_values) > 1 else 0.0
        hit_rate = sum(over_results) / len(over_results) * 100  # Percentage
        over_count = sum(over_results)
        under_count = len(games) - over_count
        avg_line = statistics.mean(lines)
        avg_actual = rolling_avg
        
        return PlayerPerformanceStats(
            rolling_avg=round(rolling_avg, 2),
            hit_rate=round(hit_rate, 1),
            std_dev=round(std_dev, 2),
            total_games=len(games),
            over_count=over_count,
            under_count=under_count,
            avg_line=round(avg_line, 1),
            avg_actual=round(avg_actual, 2)
        )
    
    def _get_market_config(self, sport: str, market: str) -> Dict[str, Any]:
        """Get configuration for different market types"""
        
        # Market configuration with realistic ranges
        configs = {
            "MLB": {
                "HR": {"base_value": 0.3, "variance": 0.4, "is_integer": True},
                "Hits": {"base_value": 1.2, "variance": 0.8, "is_integer": True},
                "RBI": {"base_value": 0.8, "variance": 0.7, "is_integer": True},
                "Runs": {"base_value": 0.9, "variance": 0.6, "is_integer": True},
                "Total Bases": {"base_value": 1.8, "variance": 1.0, "is_integer": True},
                "Strikeouts": {"base_value": 1.1, "variance": 0.8, "is_integer": True}
            },
            "NBA": {
                "Points": {"base_value": 22.5, "variance": 6.0, "is_integer": False},
                "Rebounds": {"base_value": 7.2, "variance": 2.5, "is_integer": False},
                "Assists": {"base_value": 5.8, "variance": 2.0, "is_integer": False},
                "3-Pointers": {"base_value": 2.3, "variance": 1.2, "is_integer": False}
            },
            "NFL": {
                "Passing Yards": {"base_value": 285.5, "variance": 45.0, "is_integer": False},
                "Rushing Yards": {"base_value": 78.5, "variance": 25.0, "is_integer": False},
                "Receiving Yards": {"base_value": 65.5, "variance": 20.0, "is_integer": False},
                "Touchdowns": {"base_value": 1.5, "variance": 0.8, "is_integer": False}
            }
        }
        
        sport_config = configs.get(sport, configs["MLB"])
        return sport_config.get(market, sport_config.get("HR", {"base_value": 1.0, "variance": 0.5, "is_integer": True}))
    
    def _generate_opponent_name(self) -> str:
        """Generate random opponent team name"""
        teams = [
            "Yankees", "Red Sox", "Dodgers", "Giants", "Cardinals", "Cubs",
            "Astros", "Braves", "Phillies", "Mets", "Padres", "Angels",
            "Mariners", "Rangers", "Athletics", "Tigers", "Guardians",
            "Twins", "White Sox", "Royals", "Orioles", "Blue Jays",
            "Rays", "Marlins", "Nationals", "Pirates", "Reds", "Brewers",
            "Rockies", "Diamondbacks"
        ]
        return f"vs {random.choice(teams)}"


# Singleton instance
_player_performance_service = None


def get_player_performance_service() -> PlayerPerformanceService:
    """Get singleton instance of PlayerPerformanceService"""
    global _player_performance_service
    if _player_performance_service is None:
        _player_performance_service = PlayerPerformanceService()
    return _player_performance_service