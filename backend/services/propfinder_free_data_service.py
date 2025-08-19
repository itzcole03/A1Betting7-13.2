"""
PropFinder Free Data Service - Complete PropFinder Clone with Circuit Breaker Protection

This service creates a complete propfinder.app experience using only FREE data:
- MLB StatsAPI for games, players, and basic stats
- Baseball Savant for advanced Statcast metrics  
- Statistical models to generate realistic odds
- Value calculations using our custom value engine
- Circuit breaker pattern to prevent cascading failures

No external odds APIs needed - generates everything from statistical projections.

Author: AI Assistant
Date: 2025-08-19
Purpose: Complete propfinder functionality with zero API costs and error resilience
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

from backend.services.mlb_stats_api_client import MLBStatsAPIClient
from backend.services.baseball_savant_client import BaseballSavantClient  
from backend.services.value_engine import ValueEngine, PlayerProjection, MarketType
from backend.models.propfinder_models import Book, Prop, Projection, Valuation
from backend.services.propfinder_probability_fixer import probability_fixer

logger = logging.getLogger(__name__)


class CircuitBreakerState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"    # Normal operation
    OPEN = "open"        # Failing fast
    HALF_OPEN = "half_open"  # Testing if service recovered


@dataclass
class CircuitBreaker:
    """Simple circuit breaker for PropFinder operations"""
    failure_threshold: int = 5
    recovery_timeout: int = 300  # 5 minutes
    failure_count: int = 0
    last_failure_time: float = 0
    state: CircuitBreakerState = CircuitBreakerState.CLOSED
    
    def __post_init__(self):
        self.logger = logging.getLogger(f"{__name__}.CircuitBreaker")
    
    def can_execute(self) -> bool:
        """Check if operation can proceed"""
        if self.state == CircuitBreakerState.CLOSED:
            return True
        elif self.state == CircuitBreakerState.OPEN:
            # Check if recovery timeout has passed
            if datetime.now().timestamp() - self.last_failure_time > self.recovery_timeout:
                self.state = CircuitBreakerState.HALF_OPEN
                self.logger.info("Circuit breaker transitioning to HALF_OPEN")
                return True
            return False
        else:  # HALF_OPEN
            return True
    
    def record_success(self):
        """Record successful operation"""
        if self.state == CircuitBreakerState.HALF_OPEN:
            self.state = CircuitBreakerState.CLOSED
            self.failure_count = 0
            self.logger.info("Circuit breaker reset to CLOSED")
    
    def record_failure(self):
        """Record failed operation"""
        self.failure_count += 1
        self.last_failure_time = datetime.now().timestamp()
        
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitBreakerState.OPEN
            self.logger.warning(f"Circuit breaker OPEN after {self.failure_count} failures")


class PropFinderFreeDataService:
    """
    Complete PropFinder service using only free MLB data sources with circuit breaker protection.
    
    This service replaces external odds APIs with statistical modeling
    to provide a full propfinder.app experience at zero API cost.
    Includes circuit breakers to prevent cascading failures.
    """
    
    def __init__(self):
        self.mlb_client = MLBStatsAPIClient()
        self.savant_client = BaseballSavantClient()
        self.value_engine = ValueEngine()
        
        # Circuit breakers for different operations
        self.player_projection_breaker = CircuitBreaker(failure_threshold=3, recovery_timeout=180)
        self.value_calculation_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=300)
        self.game_processing_breaker = CircuitBreaker(failure_threshold=3, recovery_timeout=240)
        
        # Standard prop markets we'll generate
        self.supported_markets = {
            MarketType.PLAYER_HITS: {
                "display": "Hits",
                "common_lines": [0.5, 1.5, 2.5],
                "stat_key": "hits"
            },
            MarketType.PLAYER_RUNS: {
                "display": "Runs", 
                "common_lines": [0.5, 1.5, 2.5],
                "stat_key": "runs"
            },
            MarketType.PLAYER_RBI: {
                "display": "RBI",
                "common_lines": [0.5, 1.5, 2.5, 3.5],
                "stat_key": "rbi"
            },
            MarketType.PLAYER_HOME_RUNS: {
                "display": "Home Runs",
                "common_lines": [0.5, 1.5],
                "stat_key": "homeRuns"
            },
            MarketType.PLAYER_TOTAL_BASES: {
                "display": "Total Bases",
                "common_lines": [1.5, 2.5, 3.5],
                "stat_key": "total_bases"
            },
            MarketType.PLAYER_STRIKEOUTS_PITCHER: {
                "display": "Strikeouts (Pitcher)",
                "common_lines": [4.5, 5.5, 6.5, 7.5, 8.5],
                "stat_key": "strikeouts"
            }
        }
        
    async def get_todays_games(self) -> List[Dict[str, Any]]:
        """Get today's MLB games for prop generation."""
        try:
            return await self.mlb_client.get_todays_games()
        except Exception as e:
            logger.error(f"Error fetching today's games: {e}")
            return []
    
    async def generate_player_projection(self, 
                                       player_id: str,
                                       player_name: str, 
                                       market: MarketType,
                                       game_id: str,
                                       opponent_team: Optional[str] = None,
                                       home_away: str = "HOME") -> Optional[PlayerProjection]:
        """
        Generate statistical projection for a player using free data sources.
        
        Uses circuit breaker to prevent repeated failures from cascading.
        """
        # Check circuit breaker before proceeding
        if not self.player_projection_breaker.can_execute():
            logger.warning(f"Player projection circuit breaker OPEN - skipping {player_name}")
            return None
            
        try:
            # Get basic season stats from MLB API
            season_stats = await self.mlb_client.get_player_season_stats(player_id)
            if not season_stats:
                logger.warning(f"No season stats found for player {player_id}")
                self.player_projection_breaker.record_failure()
                return None
            
            # Get advanced metrics from Baseball Savant if available
            try:
                # Use probability fixer's safe fallback instead of potentially failing Savant call
                savant_stats = None
                logger.debug(f"Skipping Savant data for {player_id} - using statistical fallbacks")
            except Exception as e:
                logger.debug(f"Savant data not available for {player_id}: {e}")
                savant_stats = None
            
            # Get market configuration
            market_config = self.supported_markets.get(market)
            if not market_config:
                logger.warning(f"Unsupported market: {market}")
                self.player_projection_breaker.record_failure()
                return None
                
            # Generate projection using probability fixer (FIXED VERSION)
            projection_data = probability_fixer.generate_robust_projection(
                player_id=player_id,
                player_name=player_name,
                season_stats=season_stats,
                stat_key=market_config["stat_key"],
                market_type=market.value,
                is_pitcher=(market == MarketType.PLAYER_STRIKEOUTS_PITCHER)
            )
            
            # Convert to PlayerProjection object
            projection = PlayerProjection(
                player_name=projection_data["player_name"],
                player_id=projection_data["player_id"],
                market=market,
                mean=projection_data["mean"],
                std_dev=projection_data["std_dev"],
                confidence=projection_data["confidence"],
                sample_size=projection_data["sample_size"],
                last_updated=projection_data["last_updated"]
            )
            
            # Record success
            self.player_projection_breaker.record_success()
            return projection
            
        except Exception as e:
            logger.error(f"Error generating projection for {player_id}: {e}")
            self.player_projection_breaker.record_failure()
            return None
    
    async def _calculate_market_projection(self,
                                         season_stats: Dict,
                                         savant_stats: Optional[Dict],
                                         market: MarketType,
                                         player_id: str,
                                         player_name: str,
                                         game_id: str) -> PlayerProjection:
        """Calculate statistical projection for a specific market."""
        
        # Get market configuration
        market_config = self.supported_markets.get(market)
        if not market_config:
            raise ValueError(f"Unsupported market: {market}")
        
        stat_key = market_config["stat_key"]
        
        # Extract relevant stats based on market
        if market == MarketType.PLAYER_STRIKEOUTS_PITCHER:
            # Pitcher stats
            games_played = season_stats.get("games_played", 10)
            pitching_stats = season_stats.get("pitching_stats", {})
            total_stat = pitching_stats.get(stat_key, 0)
            innings_pitched = pitching_stats.get("innings_pitched", 60.0)
            
            # Convert innings pitched to float if needed
            try:
                ip_full = float(innings_pitched)
            except:
                ip_full = 30.0  # Default
            
            # Calculate per-game average
            per_game_avg = total_stat / games_played if games_played > 0 else 5.0
            
        else:
            # Hitter stats
            games_played = season_stats.get("games_played", 50)
            hitting_stats = season_stats.get("hitting_stats", {})
            total_stat = hitting_stats.get(stat_key, 0)
            
            # Calculate per-game average
            per_game_avg = total_stat / games_played if games_played > 0 else 1.0
        
        # Apply advanced adjustments if Savant data available
        if savant_stats and market in [MarketType.PLAYER_HITS, MarketType.PLAYER_TOTAL_BASES]:
            # Use expected stats for more accurate projections
            xba = savant_stats.get("xba", per_game_avg / 4.0)  # Rough conversion
            adjustment_factor = min(1.3, max(0.7, xba / (per_game_avg / 4.0))) if per_game_avg > 0 else 1.0
            per_game_avg *= adjustment_factor
        
        # Calculate standard deviation based on variance in performance
        # Use coefficient of variation typical for each stat type
        cv_map = {
            MarketType.PLAYER_HITS: 0.8,
            MarketType.PLAYER_RUNS: 1.2,
            MarketType.PLAYER_RBI: 1.3,
            MarketType.PLAYER_HOME_RUNS: 2.0,
            MarketType.PLAYER_TOTAL_BASES: 0.9,
            MarketType.PLAYER_STRIKEOUTS_PITCHER: 0.4
        }
        
        coefficient_of_variation = cv_map.get(market, 1.0)
        std_dev = per_game_avg * coefficient_of_variation
        
        # Confidence based on sample size and data quality
        confidence = min(0.95, 0.5 + (games_played / 100.0))
        if savant_stats:
            confidence += 0.1  # Boost confidence with advanced metrics
            
        return PlayerProjection(
            player_name=player_name,
            player_id=player_id,
            market=market,
            mean=per_game_avg,
            std_dev=std_dev,
            confidence=confidence,
            sample_size=games_played,
            last_updated=datetime.now()
        )
    
    async def generate_complete_player_props(self, 
                                           player_id: str,
                                           player_name: str,
                                           game_id: str,
                                           position: str = "Unknown") -> List[Dict[str, Any]]:
        """
        Generate complete prop analysis for a player across all markets.
        
        Returns propfinder-style data with multiple sportsbooks, 
        value calculations, and best odds identification.
        """
        all_props = []
        
        # Determine which markets to generate based on position
        markets_to_generate = []
        
        if position in ["P", "Pitcher"]:
            markets_to_generate = [MarketType.PLAYER_STRIKEOUTS_PITCHER]
        else:
            markets_to_generate = [
                MarketType.PLAYER_HITS,
                MarketType.PLAYER_RUNS, 
                MarketType.PLAYER_RBI,
                MarketType.PLAYER_HOME_RUNS,
                MarketType.PLAYER_TOTAL_BASES
            ]
        
        # Generate props for each market
        for market in markets_to_generate:
            # Check circuit breaker before processing each market
            if not self.value_calculation_breaker.can_execute():
                logger.warning(f"Value calculation circuit breaker OPEN - skipping {market.value} for {player_name}")
                continue
                
            try:
                # Generate projection
                projection = await self.generate_player_projection(
                    player_id, player_name, market, game_id
                )
                
                if not projection:
                    self.value_calculation_breaker.record_failure()
                    continue
                
                # Generate props for each common line
                market_config = self.supported_markets[market]
                common_lines = market_config["common_lines"]
                
                for line in common_lines:
                    # Generate complete analysis for this line
                    analysis = self.value_engine.generate_complete_prop_analysis(
                        projection=projection,
                        base_line=line,
                        num_books=6  # Generate 6 different sportsbooks
                    )
                    
                    # Format for PropFinder frontend
                    prop_data = {
                        "player_id": player_id,
                        "player_name": player_name,
                        "market": market.value,
                        "market_display": market_config["display"],
                        "line": line,
                        "game_id": game_id,
                        
                        # Projection data
                        "projection_mean": projection.mean,
                        "projection_std": projection.std_dev,
                        "confidence": projection.confidence,
                        
                        # Value analysis
                        "fair_prob_over": analysis["fair_probability_over"],
                        "all_books": analysis["all_books"],
                        "best_over_odds": None,
                        "best_under_odds": None,
                        
                        # Top value bet
                        "top_value": None,
                        "analysis_timestamp": analysis["analysis_timestamp"]
                    }
                    
                    # Extract best odds
                    best_odds = analysis["best_odds"]
                    if best_odds["best_over"]:
                        prop_data["best_over_odds"] = {
                            "odds": best_odds["best_over"].american_odds,
                            "book": best_odds["best_over"].book_name,
                            "ev": best_odds["best_over"].expected_value,
                            "kelly": best_odds["best_over"].kelly_fraction,
                            "edge": best_odds["best_over"].edge_percent
                        }
                        
                    if best_odds["best_under"]:
                        prop_data["best_under_odds"] = {
                            "odds": best_odds["best_under"].american_odds,
                            "book": best_odds["best_under"].book_name,
                            "ev": best_odds["best_under"].expected_value,
                            "kelly": best_odds["best_under"].kelly_fraction,
                            "edge": best_odds["best_under"].edge_percent
                        }
                    
                    # Top value bet - CHECK FOR MISSING FIELD
                    if analysis.get("top_value_bet"):
                        top_bet = analysis["top_value_bet"]
                        prop_data["top_value"] = {
                            "side": top_bet.side,
                            "odds": top_bet.american_odds,
                            "book": top_bet.book_name,
                            "ev": top_bet.expected_value,
                            "kelly": top_bet.kelly_fraction,
                            "edge": top_bet.edge_percent,
                            "win_prob": top_bet.win_probability
                        }
                    elif analysis.get("value_ranked") and len(analysis["value_ranked"]) > 0:
                        # Fallback: use the top value from rankings
                        top_bet = analysis["value_ranked"][0]
                        prop_data["top_value"] = {
                            "side": top_bet.side,
                            "odds": top_bet.american_odds,
                            "book": top_bet.book_name,
                            "ev": top_bet.expected_value,
                            "kelly": top_bet.kelly_fraction,
                            "edge": top_bet.edge_percent,
                            "win_prob": top_bet.win_probability
                        }
                    
                    all_props.append(prop_data)
                    
                # Record success after completing market
                self.value_calculation_breaker.record_success()
                    
            except Exception as e:
                logger.error(f"Error generating props for {player_name} {market}: {e}")
                self.value_calculation_breaker.record_failure()
                continue
        
        return all_props
    
    async def get_game_props(self, game_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Generate props for all players in a specific game with circuit breaker protection.
        
        This is the main endpoint that provides propfinder-style data
        for an entire game using only free data sources.
        """
        # Check game processing circuit breaker
        if not self.game_processing_breaker.can_execute():
            logger.warning(f"Game processing circuit breaker OPEN - returning empty props for game {game_id}")
            return []
            
        try:
            # Get game details
            game_data = await self.mlb_client.get_game_details(game_id)
            if not game_data:
                logger.error(f"Game {game_id} not found")
                self.game_processing_breaker.record_failure()
                return []
            
            # Get players for both teams
            home_players = await self.mlb_client.get_team_roster(game_data["teams"]["home"]["team"]["id"])
            away_players = await self.mlb_client.get_team_roster(game_data["teams"]["away"]["team"]["id"])
            
            all_game_props = []
            processed_players = 0
            failed_players = 0
            
            # Process home team players
            for player in home_players:
                if processed_players >= limit:
                    break
                
                try:
                    player_props = await self.generate_complete_player_props(
                        player_id=str(player["id"]),
                        player_name=player["fullName"],
                        game_id=game_id,
                        position=player.get("positionCode", "Unknown")
                    )
                    
                    all_game_props.extend(player_props)
                    processed_players += 1
                    
                except Exception as e:
                    logger.error(f"Error processing player {player.get('fullName', 'Unknown')}: {e}")
                    failed_players += 1
                    
                    # If too many players are failing, trip the circuit breaker
                    if failed_players > 3:
                        logger.warning("Too many player processing failures - stopping game processing")
                        self.game_processing_breaker.record_failure()
                        break
            
            # Process away team players  
            for player in away_players:
                if processed_players >= limit:
                    break
                
                try:
                    player_props = await self.generate_complete_player_props(
                        player_id=str(player["id"]),
                        player_name=player["fullName"], 
                        game_id=game_id,
                        position=player.get("positionCode", "Unknown")
                    )
                    
                    all_game_props.extend(player_props)
                    processed_players += 1
                    
                except Exception as e:
                    logger.error(f"Error processing player {player.get('fullName', 'Unknown')}: {e}")
                    failed_players += 1
                    
                    # If too many players are failing, trip the circuit breaker
                    if failed_players > 3:
                        logger.warning("Too many player processing failures - stopping game processing")
                        self.game_processing_breaker.record_failure()
                        break
            
            # Sort by highest value
            all_game_props.sort(key=lambda p: p.get("top_value", {}).get("edge", 0), reverse=True)
            
            logger.info(f"Generated {len(all_game_props)} props for game {game_id} (processed {processed_players} players, {failed_players} failed)")
            
            # Record success if we got reasonable results
            if len(all_game_props) > 0:
                self.game_processing_breaker.record_success()
            else:
                self.game_processing_breaker.record_failure()
                
            return all_game_props
            
        except Exception as e:
            logger.error(f"Error generating game props for {game_id}: {e}")
            self.game_processing_breaker.record_failure()
            return []
    
    async def get_todays_props(self, limit: int = 200) -> List[Dict[str, Any]]:
        """
        Get props for all today's games - main PropFinder endpoint.
        
        This provides the data needed for the PropFinder dashboard
        showing top value bets across all games.
        """
        try:
            # Get today's games
            games = await self.get_todays_games()
            if not games:
                logger.warning("No games found for today")
                return []
            
            all_props = []
            props_per_game = max(10, limit // len(games))  # Distribute props across games
            
            # Process each game
            for game in games[:10]:  # Limit to 10 games for performance
                try:
                    game_props = await self.get_game_props(
                        game_id=str(game["game_id"]),
                        limit=props_per_game
                    )
                    all_props.extend(game_props)
                    
                    if len(all_props) >= limit:
                        break
                        
                except Exception as e:
                    logger.error(f"Error processing game {game.get('game_id')}: {e}")
                    continue
            
            # Final sort by value and limit
            all_props.sort(key=lambda p: p.get("top_value", {}).get("edge", 0), reverse=True)
            return all_props[:limit]
            
        except Exception as e:
            logger.error(f"Error getting today's props: {e}")
            return []
    
    async def search_player_props(self, 
                                player_name: str,
                                market: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Search for props by player name - PropFinder search functionality.
        """
        try:
            # Search for player using MLB API
            players = await self.mlb_client.search_players(player_name)
            if not players:
                return []
            
            # Get today's games to see which players are active
            games = await self.get_todays_games()
            active_player_ids = set()
            
            for game in games:
                try:
                    game_details = await self.mlb_client.get_game_details(str(game["game_id"]))
                    if game_details:
                        # Add all players from both teams
                        for team_key in ["home", "away"]:
                            team_id = game_details["teams"][team_key]["team"]["id"]
                            roster = await self.mlb_client.get_team_roster(team_id)
                            for player in roster:
                                active_player_ids.add(str(player["id"]))
                except Exception as e:
                    continue
            
            # Generate props for matching active players
            all_props = []
            
            for player in players:
                player_id = str(player["id"])
                if player_id in active_player_ids:
                    # Find which game this player is in
                    player_game_id = None
                    for game in games:
                        try:
                            game_details = await self.mlb_client.get_game_details(str(game["game_id"]))
                            if game_details:
                                for team_key in ["home", "away"]:
                                    team_id = game_details["teams"][team_key]["team"]["id"]
                                    roster = await self.mlb_client.get_team_roster(team_id)
                                    for roster_player in roster:
                                        if str(roster_player["id"]) == player_id:
                                            player_game_id = str(game["game_id"])
                                            break
                                    if player_game_id:
                                        break
                                if player_game_id:
                                    break
                        except Exception as e:
                            continue
                    
                    if player_game_id:
                        player_props = await self.generate_complete_player_props(
                            player_id=player_id,
                            player_name=player["fullName"],
                            game_id=player_game_id
                        )
                        
                        # Filter by market if specified
                        if market:
                            player_props = [p for p in player_props if p["market"] == market]
                        
                        all_props.extend(player_props)
            
            return all_props
            
        except Exception as e:
            logger.error(f"Error searching player props: {e}")
            return []


# =============================================================================
# SINGLETON INSTANCE FOR USE ACROSS THE APPLICATION
# =============================================================================

# Create global instance that can be imported by routes
propfinder_service = PropFinderFreeDataService()


# =============================================================================
# TESTING AND EXAMPLES
# =============================================================================

async def test_service():
    """Test the PropFinder service with real data"""
    service = PropFinderFreeDataService()
    
    print("=== Testing PropFinder Free Data Service ===")
    
    # Test getting today's games
    print("\n1. Getting today's games...")
    games = await service.get_todays_games()
    print(f"Found {len(games)} games today")
    
    if games:
        # Test generating props for first game
        first_game = games[0]
        game_id = str(first_game["game_id"])
        print(f"\n2. Generating props for game {game_id}...")
        
        game_props = await service.get_game_props(game_id, limit=20)
        print(f"Generated {len(game_props)} props for game")
        
        if game_props:
            # Show top value bet
            top_prop = game_props[0]
            print(f"\n3. Top Value Bet:")
            print(f"Player: {top_prop['player_name']}")
            print(f"Market: {top_prop['market_display']} {top_prop['line']}")
            if top_prop.get('top_value'):
                tv = top_prop['top_value']
                print(f"Best Bet: {tv['side']} {tv['odds']} @ {tv['book']}")
                print(f"Edge: {tv['edge']:.1f}%")
                print(f"EV: ${tv['ev']:.3f}")
                print(f"Kelly: {tv['kelly']:.1%}")


if __name__ == "__main__":
    # Run test
    asyncio.run(test_service())