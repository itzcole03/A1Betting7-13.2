"""
Unified Multiple Sportsbook Integration Service

This service orchestrates multiple sportsbook APIs (DraftKings, BetMGM, Caesars, etc.)
to provide unified access to odds, lines, and market data across all platforms.

Features:
- Unified data interface across all sportsbooks
- Parallel data fetching for performance
- Arbitrage opportunity detection
- Line comparison and best odds finding
- Error handling and failover
- Rate limiting management
- Data normalization and standardization
"""

import asyncio
import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple, Union
from dataclasses import dataclass, field
from enum import Enum
import statistics

from .sportsbook_apis.draftkings_api import DraftKingsAPI, DraftKingsOdds
from .sportsbook_apis.betmgm_api import BetMGMAPI, BetMGMOdds
from .sportsbook_apis.caesars_api import CaesarsAPI, CaesarsOdds

logger = logging.getLogger(__name__)

class SportsbookProvider(Enum):
    """Supported sportsbook providers"""
    DRAFTKINGS = "draftkings"
    BETMGM = "betmgm"
    CAESARS = "caesars"
    FANDUEL = "fanduel"  # Future implementation
    POINTSBET = "pointsbet"  # Future implementation

@dataclass
class UnifiedOdds:
    """Unified odds structure across all sportsbooks"""
    provider: str
    event_id: str
    market_id: str
    player_name: str
    team: str
    opponent: str
    league: str
    sport: str
    market_type: str  # 'player_props', 'game_lines'
    bet_type: str
    line: float
    odds: int  # American odds
    decimal_odds: float
    side: str  # 'over', 'under', 'home', 'away'
    timestamp: datetime
    game_time: datetime
    status: str = "active"
    confidence_score: float = 0.8  # API reliability score
    
@dataclass
class BestOdds:
    """Best odds comparison across all sportsbooks"""
    player_name: str
    bet_type: str
    line: float
    
    # Best Over odds
    best_over_odds: int
    best_over_provider: str
    best_over_decimal: float
    
    # Best Under odds  
    best_under_odds: int
    best_under_provider: str
    best_under_decimal: float
    
    # Market analysis
    total_books: int
    line_consensus: float
    sharp_move: bool = False
    arbitrage_opportunity: bool = False
    arbitrage_profit: float = 0.0
    
    # Source data
    all_odds: List[UnifiedOdds] = field(default_factory=list)

@dataclass
class ArbitrageOpportunity:
    """Arbitrage betting opportunity"""
    player_name: str
    bet_type: str
    line: float
    
    # Over side
    over_odds: int
    over_provider: str
    over_stake_percentage: float
    
    # Under side
    under_odds: int
    under_provider: str
    under_stake_percentage: float
    
    # Profit calculation
    guaranteed_profit_percentage: float
    minimum_bet_amount: float
    expected_return: float
    
    confidence_level: str  # 'high', 'medium', 'low'
    time_sensitivity: str  # 'urgent', 'moderate', 'stable'

class UnifiedSportsbookService:
    """
    Service to manage multiple sportsbook APIs and provide unified data access.
    """
    
    def __init__(self, 
                 enabled_providers: Optional[List[SportsbookProvider]] = None,
                 max_concurrent_requests: int = 5,
                 timeout_seconds: int = 30):
        
        self.enabled_providers = enabled_providers or [
            SportsbookProvider.DRAFTKINGS,
            SportsbookProvider.BETMGM,
            SportsbookProvider.CAESARS
        ]
        
        self.max_concurrent_requests = max_concurrent_requests
        self.timeout_seconds = timeout_seconds
        
        # Initialize API clients
        self.clients = {}
        self._init_clients()
        
        # Performance tracking
        self.performance_stats = {
            provider.value: {
                'requests': 0,
                'successes': 0,
                'failures': 0,
                'avg_response_time': 0.0,
                'last_success': None,
                'reliability_score': 1.0
            }
            for provider in self.enabled_providers
        }
    
    def _init_clients(self):
        """Initialize sportsbook API clients"""
        for provider in self.enabled_providers:
            if provider == SportsbookProvider.DRAFTKINGS:
                self.clients[provider.value] = DraftKingsAPI()
            elif provider == SportsbookProvider.BETMGM:
                self.clients[provider.value] = BetMGMAPI()
            elif provider == SportsbookProvider.CAESARS:
                self.clients[provider.value] = CaesarsAPI()
            # Add more providers as they're implemented
    
    async def __aenter__(self):
        """Async context manager entry"""
        # Initialize all client sessions
        for provider_name, client in self.clients.items():
            try:
                await client.__aenter__()
                logger.info(f"Initialized {provider_name} client")
            except Exception as e:
                logger.error(f"Failed to initialize {provider_name} client: {e}")
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        # Close all client sessions
        for provider_name, client in self.clients.items():
            try:
                await client.__aexit__(exc_type, exc_val, exc_tb)
            except Exception as e:
                logger.error(f"Error closing {provider_name} client: {e}")
    
    async def get_all_player_props(self, sport: str, player_name: Optional[str] = None) -> List[UnifiedOdds]:
        """Get player props from all enabled sportsbooks"""
        tasks = []
        
        for provider in self.enabled_providers:
            task = self._fetch_provider_props(provider, sport, player_name)
            tasks.append(task)
        
        # Execute all requests concurrently with semaphore
        semaphore = asyncio.Semaphore(self.max_concurrent_requests)
        
        async def bounded_fetch(task):
            async with semaphore:
                return await task
        
        bounded_tasks = [bounded_fetch(task) for task in tasks]
        results = await asyncio.gather(*bounded_tasks, return_exceptions=True)
        
        # Combine all results
        all_props = []
        for i, result in enumerate(results):
            provider = self.enabled_providers[i]
            
            if isinstance(result, Exception):
                logger.error(f"Error fetching from {provider.value}: {result}")
                self._update_performance_stats(provider.value, success=False)
            else:
                self._update_performance_stats(provider.value, success=True)
                all_props.extend(result)
        
        return all_props
    
    async def _fetch_provider_props(self, provider: SportsbookProvider, sport: str, player_name: Optional[str] = None) -> List[UnifiedOdds]:
        """Fetch player props from a specific provider"""
        client = self.clients.get(provider.value)
        if not client:
            return []
        
        start_time = time.time()
        
        try:
            if provider == SportsbookProvider.DRAFTKINGS:
                if player_name:
                    raw_props = await client.search_player_props(player_name, sport)
                else:
                    raw_props = await client.get_player_props(sport)
                
                return [self._normalize_draftkings_odds(prop) for prop in raw_props]
                
            elif provider == SportsbookProvider.BETMGM:
                if player_name:
                    raw_props = await client.search_player_props(player_name, sport)
                else:
                    raw_props = await client.get_player_props(sport)
                
                return [self._normalize_betmgm_odds(prop) for prop in raw_props]
                
            elif provider == SportsbookProvider.CAESARS:
                if player_name:
                    raw_props = await client.search_player_props(player_name, sport)
                else:
                    raw_props = await client.get_player_props(sport)
                
                return [self._normalize_caesars_odds(prop) for prop in raw_props]
            
            return []
            
        except Exception as e:
            logger.error(f"Error fetching props from {provider.value}: {e}")
            return []
        
        finally:
            response_time = time.time() - start_time
            self._update_response_time(provider.value, response_time)
    
    def _normalize_draftkings_odds(self, prop: DraftKingsOdds) -> UnifiedOdds:
        """Normalize DraftKings odds to unified format"""
        return UnifiedOdds(
            provider="draftkings",
            event_id=prop.event_id,
            market_id=f"dk_{prop.event_id}_{prop.bet_type}",
            player_name=prop.player_name,
            team=prop.team,
            opponent=prop.opponent,
            league=prop.league,
            sport=prop.sport,
            market_type=prop.market_type,
            bet_type=prop.bet_type,
            line=prop.line,
            odds=prop.over_odds,  # Take over odds as primary
            decimal_odds=self._american_to_decimal(prop.over_odds),
            side='over',
            timestamp=prop.timestamp,
            game_time=prop.game_time,
            status=prop.status,
            confidence_score=self.performance_stats["draftkings"]["reliability_score"]
        )
    
    def _normalize_betmgm_odds(self, prop: BetMGMOdds) -> UnifiedOdds:
        """Normalize BetMGM odds to unified format"""
        return UnifiedOdds(
            provider="betmgm",
            event_id=prop.fixture_id,
            market_id=f"bmgm_{prop.fixture_id}_{prop.bet_type}",
            player_name=prop.player_name,
            team=prop.team,
            opponent=prop.opponent,
            league=prop.league,
            sport=prop.sport,
            market_type=prop.market_type,
            bet_type=prop.bet_type,
            line=prop.line,
            odds=prop.odds,
            decimal_odds=self._american_to_decimal(prop.odds),
            side=prop.side,
            timestamp=prop.timestamp,
            game_time=prop.game_time,
            status=prop.status,
            confidence_score=self.performance_stats["betmgm"]["reliability_score"]
        )
    
    def _normalize_caesars_odds(self, prop: CaesarsOdds) -> UnifiedOdds:
        """Normalize Caesars odds to unified format"""
        return UnifiedOdds(
            provider="caesars",
            event_id=prop.event_id,
            market_id=prop.market_id,
            player_name=prop.player_name,
            team=prop.team,
            opponent=prop.opponent,
            league=prop.league,
            sport=prop.sport,
            market_type=prop.market_type,
            bet_type=prop.bet_type,
            line=prop.line,
            odds=prop.odds,
            decimal_odds=prop.decimal_odds,
            side=prop.side,
            timestamp=prop.timestamp,
            game_time=prop.game_time,
            status=prop.status,
            confidence_score=self.performance_stats["caesars"]["reliability_score"]
        )
    
    def _american_to_decimal(self, american_odds: int) -> float:
        """Convert American odds to decimal odds"""
        if american_odds > 0:
            return (american_odds / 100) + 1
        else:
            return (100 / abs(american_odds)) + 1
    
    def find_best_odds(self, all_odds: List[UnifiedOdds]) -> List[BestOdds]:
        """Find best odds for each player/bet_type combination"""
        # Group odds by player and bet type
        grouped_odds = {}
        
        for odds in all_odds:
            key = (odds.player_name, odds.bet_type, odds.line)
            if key not in grouped_odds:
                grouped_odds[key] = {'over': [], 'under': []}
            
            if odds.side in grouped_odds[key]:
                grouped_odds[key][odds.side].append(odds)
        
        best_odds_list = []
        
        for (player_name, bet_type, line), sides in grouped_odds.items():
            over_odds = sides.get('over', [])
            under_odds = sides.get('under', [])
            
            if not over_odds or not under_odds:
                continue  # Need both sides for comparison
            
            # Find best over odds (highest number = better for bettor)
            best_over = max(over_odds, key=lambda x: x.odds)
            
            # Find best under odds (highest number = better for bettor)
            best_under = max(under_odds, key=lambda x: x.odds)
            
            # Calculate market metrics
            all_market_odds = over_odds + under_odds
            total_books = len(set(odds.provider for odds in all_market_odds))
            
            # Check for arbitrage
            arb_opportunity, arb_profit = self._check_arbitrage(best_over, best_under)
            
            best_odds_list.append(BestOdds(
                player_name=player_name,
                bet_type=bet_type,
                line=line,
                best_over_odds=best_over.odds,
                best_over_provider=best_over.provider,
                best_over_decimal=best_over.decimal_odds,
                best_under_odds=best_under.odds,
                best_under_provider=best_under.provider,
                best_under_decimal=best_under.decimal_odds,
                total_books=total_books,
                line_consensus=line,  # Could calculate weighted average
                arbitrage_opportunity=arb_opportunity,
                arbitrage_profit=arb_profit,
                all_odds=all_market_odds
            ))
        
        return best_odds_list
    
    def _check_arbitrage(self, over_odds: UnifiedOdds, under_odds: UnifiedOdds) -> Tuple[bool, float]:
        """Check if there's an arbitrage opportunity between two odds"""
        # Calculate implied probabilities
        over_prob = 1 / over_odds.decimal_odds
        under_prob = 1 / under_odds.decimal_odds
        
        # If sum of probabilities < 1, there's arbitrage
        total_prob = over_prob + under_prob
        
        if total_prob < 1.0:
            profit_margin = (1 - total_prob) * 100  # Percentage profit
            return True, profit_margin
        
        return False, 0.0
    
    def find_arbitrage_opportunities(self, all_odds: List[UnifiedOdds], min_profit: float = 2.0) -> List[ArbitrageOpportunity]:
        """Find arbitrage opportunities across all sportsbooks"""
        best_odds = self.find_best_odds(all_odds)
        
        arbitrage_opportunities = []
        
        for odds in best_odds:
            if odds.arbitrage_opportunity and odds.arbitrage_profit >= min_profit:
                # Calculate stake percentages
                over_decimal = odds.best_over_decimal
                under_decimal = odds.best_under_decimal
                
                over_stake_pct = (1 / over_decimal) / ((1 / over_decimal) + (1 / under_decimal))
                under_stake_pct = (1 / under_decimal) / ((1 / over_decimal) + (1 / under_decimal))
                
                # Determine confidence and time sensitivity
                confidence = self._calculate_arbitrage_confidence(odds)
                time_sensitivity = self._calculate_time_sensitivity(odds)
                
                arbitrage_opportunities.append(ArbitrageOpportunity(
                    player_name=odds.player_name,
                    bet_type=odds.bet_type,
                    line=odds.line,
                    over_odds=odds.best_over_odds,
                    over_provider=odds.best_over_provider,
                    over_stake_percentage=over_stake_pct * 100,
                    under_odds=odds.best_under_odds,
                    under_provider=odds.best_under_provider,
                    under_stake_percentage=under_stake_pct * 100,
                    guaranteed_profit_percentage=odds.arbitrage_profit,
                    minimum_bet_amount=100.0,  # Default minimum
                    expected_return=odds.arbitrage_profit,  # Simplified
                    confidence_level=confidence,
                    time_sensitivity=time_sensitivity
                ))
        
        # Sort by profit potential
        arbitrage_opportunities.sort(key=lambda x: x.guaranteed_profit_percentage, reverse=True)
        
        return arbitrage_opportunities
    
    def _calculate_arbitrage_confidence(self, odds: BestOdds) -> str:
        """Calculate confidence level for arbitrage opportunity"""
        if odds.total_books >= 3 and odds.arbitrage_profit >= 5.0:
            return 'high'
        elif odds.total_books >= 2 and odds.arbitrage_profit >= 3.0:
            return 'medium'
        else:
            return 'low'
    
    def _calculate_time_sensitivity(self, odds: BestOdds) -> str:
        """Calculate time sensitivity for arbitrage opportunity"""
        # Check how recent the odds are
        now = datetime.now()
        most_recent = max(odds.all_odds, key=lambda x: x.timestamp)
        
        time_diff = (now - most_recent.timestamp).total_seconds()
        
        if time_diff < 300:  # 5 minutes
            return 'urgent'
        elif time_diff < 1800:  # 30 minutes
            return 'moderate'
        else:
            return 'stable'
    
    def _update_performance_stats(self, provider: str, success: bool, response_time: float = 0.0):
        """Update performance statistics for a provider"""
        stats = self.performance_stats[provider]
        stats['requests'] += 1
        
        if success:
            stats['successes'] += 1
            stats['last_success'] = datetime.now()
        else:
            stats['failures'] += 1
        
        # Update reliability score (0.0 to 1.0)
        stats['reliability_score'] = stats['successes'] / stats['requests']
        
        if response_time > 0:
            # Update average response time
            total_time = stats['avg_response_time'] * (stats['requests'] - 1)
            stats['avg_response_time'] = (total_time + response_time) / stats['requests']
    
    def _update_response_time(self, provider: str, response_time: float):
        """Update response time for a provider"""
        stats = self.performance_stats[provider]
        if stats['requests'] > 0:
            total_time = stats['avg_response_time'] * stats['requests']
            stats['avg_response_time'] = (total_time + response_time) / (stats['requests'] + 1)
    
    def get_performance_report(self) -> Dict[str, Any]:
        """Get performance report for all providers"""
        return {
            'providers': self.performance_stats,
            'summary': {
                'total_providers': len(self.enabled_providers),
                'healthy_providers': sum(1 for stats in self.performance_stats.values() 
                                       if stats['reliability_score'] > 0.8),
                'avg_reliability': statistics.mean(stats['reliability_score'] 
                                                 for stats in self.performance_stats.values()),
                'fastest_provider': min(self.performance_stats.items(), 
                                      key=lambda x: x[1]['avg_response_time'])[0]
            }
        }

# Example usage and testing
async def test_unified_sportsbook_service():
    """Test the unified sportsbook service"""
    async with UnifiedSportsbookService() as service:
        print("Testing Unified Sportsbook Service...")
        
        # Get NBA player props from all providers
        all_props = await service.get_all_player_props('nba')
        print(f"Total props found across all sportsbooks: {len(all_props)}")
        
        # Find best odds
        best_odds = service.find_best_odds(all_props)
        print(f"Unique player/bet combinations: {len(best_odds)}")
        
        # Find arbitrage opportunities
        arbitrage_ops = service.find_arbitrage_opportunities(all_props, min_profit=1.0)
        print(f"Arbitrage opportunities found: {len(arbitrage_ops)}")
        
        if arbitrage_ops:
            top_arb = arbitrage_ops[0]
            print(f"Best arbitrage: {top_arb.player_name} {top_arb.bet_type} - {top_arb.guaranteed_profit_percentage:.2f}% profit")
        
        # Performance report
        performance = service.get_performance_report()
        print(f"Provider performance: {performance['summary']}")

if __name__ == "__main__":
    asyncio.run(test_unified_sportsbook_service())
