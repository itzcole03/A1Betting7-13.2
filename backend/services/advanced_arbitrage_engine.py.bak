"""
Advanced Arbitrage Detection Engine
Sophisticated arbitrage opportunity detection across 15+ sportsbooks with 
enhanced algorithms, risk analysis, and automated execution recommendations.
Part of Phase 4.2: Elite Betting Operations and Automation
"""

import asyncio
import json
import logging
import time
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Set, NamedTuple
from dataclasses import dataclass, asdict, field
from enum import Enum
import numpy as np
import pandas as pd
from collections import defaultdict, deque
import aiohttp
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class ArbitrageType(Enum):
    TWO_WAY = "two_way"          # Simple 2-outcome arbitrage (e.g., moneyline)
    THREE_WAY = "three_way"      # 3-outcome arbitrage (e.g., win/draw/loss)
    MULTI_WAY = "multi_way"      # Complex multi-outcome arbitrage
    CROSS_MARKET = "cross_market" # Different market types
    SURE_BET = "sure_bet"        # Guaranteed profit regardless of outcome
    MIDDLE = "middle"            # Betting both sides with chance to win both

class RiskLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EXTREME = "extreme"

class ArbitrageStatus(Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    EXECUTED = "executed"
    MONITORING = "monitoring"
    STALE = "stale"

@dataclass
class SportsbookOdds:
    """Enhanced odds structure for arbitrage analysis"""
    sportsbook: str
    game_id: str
    market_type: str
    selection: str
    odds_american: int
    odds_decimal: float
    line: Optional[float]
    timestamp: datetime
    volume: float = 0.0
    max_bet: float = 10000.0
    reliability_score: float = 1.0
    last_updated: Optional[datetime] = None

@dataclass 
class ArbitrageOpportunity:
    """Comprehensive arbitrage opportunity structure"""
    opportunity_id: str
    sport: str
    game_id: str
    game_description: str
    arbitrage_type: ArbitrageType
    total_return: float
    profit_percentage: float
    guaranteed_profit: float
    required_stakes: Dict[str, float]
    sportsbooks_involved: List[str]
    odds_combinations: List[SportsbookOdds]
    risk_level: RiskLevel
    time_window: timedelta
    confidence_score: float
    execution_complexity: int  # 1-10 scale
    market_efficiency: float
    expected_hold_time: timedelta
    status: ArbitrageStatus
    created_at: datetime
    expires_at: datetime
    reasoning: str
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class ArbitragePortfolio:
    """Portfolio of arbitrage opportunities"""
    total_opportunities: int
    active_opportunities: int
    total_expected_profit: float
    average_return: float
    risk_distribution: Dict[RiskLevel, int]
    sportsbook_distribution: Dict[str, int]
    success_rate: float
    updated_at: datetime

class AdvancedArbitrageEngine:
    """
    Advanced arbitrage detection engine with sophisticated algorithms
    and multi-sportsbook integration
    """
    
    def __init__(self):
        self.opportunities: Dict[str, ArbitrageOpportunity] = {}
        self.historical_odds: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.sportsbook_reliabilities: Dict[str, float] = {}
        self.market_efficiencies: Dict[str, float] = {}
        self.execution_history: List[Dict] = []
        self.real_time_monitoring = False
        
        # Enhanced sportsbook configuration
        self.sportsbooks = {
            'draftkings': {'priority': 1, 'reliability': 0.98, 'max_bet': 50000, 'speed': 'fast'},
            'fanduel': {'priority': 1, 'reliability': 0.97, 'max_bet': 50000, 'speed': 'fast'},
            'betmgm': {'priority': 2, 'reliability': 0.96, 'max_bet': 25000, 'speed': 'medium'},
            'caesars': {'priority': 2, 'reliability': 0.95, 'max_bet': 25000, 'speed': 'medium'},
            'pointsbet': {'priority': 3, 'reliability': 0.94, 'max_bet': 15000, 'speed': 'medium'},
            'barstool': {'priority': 3, 'reliability': 0.93, 'max_bet': 15000, 'speed': 'slow'},
            'betrivers': {'priority': 3, 'reliability': 0.93, 'max_bet': 15000, 'speed': 'medium'},
            'unibet': {'priority': 4, 'reliability': 0.92, 'max_bet': 10000, 'speed': 'slow'},
            'william_hill': {'priority': 4, 'reliability': 0.91, 'max_bet': 10000, 'speed': 'slow'},
            'bet365': {'priority': 2, 'reliability': 0.97, 'max_bet': 30000, 'speed': 'fast'},
            'pinnacle': {'priority': 1, 'reliability': 0.99, 'max_bet': 100000, 'speed': 'fast'},
            'bovada': {'priority': 3, 'reliability': 0.90, 'max_bet': 5000, 'speed': 'slow'},
            'mybookie': {'priority': 4, 'reliability': 0.88, 'max_bet': 3000, 'speed': 'slow'},
            'betonline': {'priority': 4, 'reliability': 0.89, 'max_bet': 5000, 'speed': 'slow'},
            'sportsbetting': {'priority': 4, 'reliability': 0.87, 'max_bet': 2500, 'speed': 'slow'}
        }
        
        # Initialize reliability scores
        for book, config in self.sportsbooks.items():
            self.sportsbook_reliabilities[book] = config['reliability']

    def american_to_decimal(self, american_odds: int) -> float:
        """Convert American odds to decimal format"""
        if american_odds > 0:
            return (american_odds / 100) + 1
        else:
            return (100 / abs(american_odds)) + 1

    def decimal_to_american(self, decimal_odds: float) -> int:
        """Convert decimal odds to American format"""
        if decimal_odds >= 2.0:
            return int((decimal_odds - 1) * 100)
        else:
            return int(-100 / (decimal_odds - 1))

    def calculate_implied_probability(self, decimal_odds: float) -> float:
        """Calculate implied probability from decimal odds"""
        return 1.0 / decimal_odds

    def calculate_arbitrage_stakes(self, odds_list: List[float], total_stake: float) -> List[float]:
        """Calculate optimal stakes for arbitrage opportunity"""
        implied_probs = [1/odds for odds in odds_list]
        total_prob = sum(implied_probs)
        
        if total_prob >= 1.0:
            return []  # No arbitrage opportunity
        
        # Calculate individual stakes
        stakes = []
        for prob in implied_probs:
            stake = (prob / total_prob) * total_stake
            stakes.append(stake)
        
        return stakes

    async def detect_two_way_arbitrage(self, game_odds: Dict[str, List[SportsbookOdds]]) -> List[ArbitrageOpportunity]:
        """Detect two-way arbitrage opportunities (e.g., moneyline, totals)"""
        opportunities = []
        
        for market_type, odds_list in game_odds.items():
            if len(odds_list) < 2:
                continue
                
            # Group odds by selection
            selections = defaultdict(list)
            for odds in odds_list:
                selections[odds.selection].append(odds)
            
            # Need exactly 2 selections for two-way arbitrage
            if len(selections) != 2:
                continue
                
            selection_names = list(selections.keys())
            
            # Find best odds for each selection
            best_odds = {}
            for selection, odds_for_selection in selections.items():
                best_odds[selection] = max(odds_for_selection, key=lambda x: x.odds_decimal)
            
            # Check for arbitrage
            odds_values = [best_odds[sel].odds_decimal for sel in selection_names]
            total_implied_prob = sum(1/odds for odds in odds_values)
            
            if total_implied_prob < 0.98:  # Account for rounding and slight inefficiencies
                # Calculate arbitrage details
                profit_percentage = ((1 / total_implied_prob) - 1) * 100
                
                # Calculate optimal stakes for $1000 total
                stakes = self.calculate_arbitrage_stakes(odds_values, 1000)
                
                if stakes:
                    # Calculate guaranteed profit
                    min_return = min(stakes[i] * odds_values[i] for i in range(len(stakes)))
                    guaranteed_profit = min_return - sum(stakes)
                    
                    # Determine risk level
                    risk_level = self._assess_risk_level(best_odds, profit_percentage)
                    
                    # Create opportunity
                    opportunity = ArbitrageOpportunity(
                        opportunity_id=self._generate_opportunity_id(game_odds, market_type),
                        sport=best_odds[selection_names[0]].game_id.split('_')[0],
                        game_id=best_odds[selection_names[0]].game_id,
                        game_description=f"{selection_names[0]} vs {selection_names[1]}",
                        arbitrage_type=ArbitrageType.TWO_WAY,
                        total_return=min_return,
                        profit_percentage=profit_percentage,
                        guaranteed_profit=guaranteed_profit,
                        required_stakes={
                            best_odds[selection_names[i]].sportsbook: stakes[i] 
                            for i in range(len(stakes))
                        },
                        sportsbooks_involved=[best_odds[sel].sportsbook for sel in selection_names],
                        odds_combinations=[best_odds[sel] for sel in selection_names],
                        risk_level=risk_level,
                        time_window=timedelta(minutes=15),
                        confidence_score=self._calculate_confidence_score(best_odds, profit_percentage),
                        execution_complexity=2,
                        market_efficiency=total_implied_prob,
                        expected_hold_time=timedelta(hours=2),
                        status=ArbitrageStatus.ACTIVE,
                        created_at=datetime.now(),
                        expires_at=datetime.now() + timedelta(minutes=15),
                        reasoning=f"Two-way arbitrage in {market_type} with {profit_percentage:.2f}% guaranteed profit"
                    )
                    
                    opportunities.append(opportunity)
        
        return opportunities

    async def detect_three_way_arbitrage(self, game_odds: Dict[str, List[SportsbookOdds]]) -> List[ArbitrageOpportunity]:
        """Detect three-way arbitrage opportunities (e.g., win/draw/loss)"""
        opportunities = []
        
        for market_type, odds_list in game_odds.items():
            if len(odds_list) < 3:
                continue
                
            # Group odds by selection
            selections = defaultdict(list)
            for odds in odds_list:
                selections[odds.selection].append(odds)
            
            # Need exactly 3 selections for three-way arbitrage
            if len(selections) != 3:
                continue
                
            selection_names = list(selections.keys())
            
            # Find best odds for each selection
            best_odds = {}
            for selection, odds_for_selection in selections.items():
                best_odds[selection] = max(odds_for_selection, key=lambda x: x.odds_decimal)
            
            # Check for arbitrage
            odds_values = [best_odds[sel].odds_decimal for sel in selection_names]
            total_implied_prob = sum(1/odds for odds in odds_values)
            
            if total_implied_prob < 0.97:  # Slightly more conservative for 3-way
                # Calculate arbitrage details
                profit_percentage = ((1 / total_implied_prob) - 1) * 100
                
                # Calculate optimal stakes for $1000 total
                stakes = self.calculate_arbitrage_stakes(odds_values, 1000)
                
                if stakes:
                    # Calculate guaranteed profit
                    min_return = min(stakes[i] * odds_values[i] for i in range(len(stakes)))
                    guaranteed_profit = min_return - sum(stakes)
                    
                    # Determine risk level
                    risk_level = self._assess_risk_level(best_odds, profit_percentage)
                    
                    # Create opportunity
                    opportunity = ArbitrageOpportunity(
                        opportunity_id=self._generate_opportunity_id(game_odds, market_type),
                        sport=best_odds[selection_names[0]].game_id.split('_')[0],
                        game_id=best_odds[selection_names[0]].game_id,
                        game_description=f"{' / '.join(selection_names)}",
                        arbitrage_type=ArbitrageType.THREE_WAY,
                        total_return=min_return,
                        profit_percentage=profit_percentage,
                        guaranteed_profit=guaranteed_profit,
                        required_stakes={
                            best_odds[selection_names[i]].sportsbook: stakes[i] 
                            for i in range(len(stakes))
                        },
                        sportsbooks_involved=[best_odds[sel].sportsbook for sel in selection_names],
                        odds_combinations=[best_odds[sel] for sel in selection_names],
                        risk_level=risk_level,
                        time_window=timedelta(minutes=10),
                        confidence_score=self._calculate_confidence_score(best_odds, profit_percentage),
                        execution_complexity=3,
                        market_efficiency=total_implied_prob,
                        expected_hold_time=timedelta(hours=1.5),
                        status=ArbitrageStatus.ACTIVE,
                        created_at=datetime.now(),
                        expires_at=datetime.now() + timedelta(minutes=10),
                        reasoning=f"Three-way arbitrage in {market_type} with {profit_percentage:.2f}% guaranteed profit"
                    )
                    
                    opportunities.append(opportunity)
        
        return opportunities

    async def detect_cross_market_arbitrage(self, all_game_odds: Dict[str, Dict[str, List[SportsbookOdds]]]) -> List[ArbitrageOpportunity]:
        """Detect arbitrage opportunities across different market types"""
        opportunities = []
        
        for game_id, markets in all_game_odds.items():
            # Look for correlation between spreads and totals
            if 'spread' in markets and 'total' in markets:
                spread_arbs = await self._find_correlated_arbitrage(
                    markets['spread'], markets['total'], 'spread_total'
                )
                opportunities.extend(spread_arbs)
            
            # Look for moneyline vs spread arbitrage
            if 'moneyline' in markets and 'spread' in markets:
                ml_spread_arbs = await self._find_correlated_arbitrage(
                    markets['moneyline'], markets['spread'], 'moneyline_spread'
                )
                opportunities.extend(ml_spread_arbs)
        
        return opportunities

    async def _find_correlated_arbitrage(self, market1_odds: List[SportsbookOdds], 
                                       market2_odds: List[SportsbookOdds], 
                                       correlation_type: str) -> List[ArbitrageOpportunity]:
        """Find arbitrage opportunities between correlated markets"""
        # This is a simplified implementation - real-world would require 
        # sophisticated correlation analysis
        opportunities = []
        
        # Example: Look for inefficiencies between markets
        for odds1 in market1_odds:
            for odds2 in market2_odds:
                if odds1.sportsbook != odds2.sportsbook:
                    # Calculate theoretical correlation
                    efficiency_gap = self._calculate_market_efficiency_gap(odds1, odds2)
                    
                    if efficiency_gap > 0.02:  # 2% efficiency gap threshold
                        opportunity = ArbitrageOpportunity(
                            opportunity_id=f"{correlation_type}_{odds1.game_id}_{int(time.time())}",
                            sport=odds1.game_id.split('_')[0],
                            game_id=odds1.game_id,
                            game_description=f"Cross-market {correlation_type}",
                            arbitrage_type=ArbitrageType.CROSS_MARKET,
                            total_return=1000 * (1 + efficiency_gap),
                            profit_percentage=efficiency_gap * 100,
                            guaranteed_profit=1000 * efficiency_gap,
                            required_stakes={
                                odds1.sportsbook: 500,
                                odds2.sportsbook: 500
                            },
                            sportsbooks_involved=[odds1.sportsbook, odds2.sportsbook],
                            odds_combinations=[odds1, odds2],
                            risk_level=RiskLevel.MEDIUM,
                            time_window=timedelta(minutes=20),
                            confidence_score=0.75,
                            execution_complexity=4,
                            market_efficiency=1 - efficiency_gap,
                            expected_hold_time=timedelta(hours=3),
                            status=ArbitrageStatus.ACTIVE,
                            created_at=datetime.now(),
                            expires_at=datetime.now() + timedelta(minutes=20),
                            reasoning=f"Cross-market inefficiency detected between {correlation_type}"
                        )
                        opportunities.append(opportunity)
        
        return opportunities

    def _calculate_market_efficiency_gap(self, odds1: SportsbookOdds, odds2: SportsbookOdds) -> float:
        """Calculate efficiency gap between two market odds"""
        # Simplified calculation - real implementation would be more complex
        prob1 = 1 / odds1.odds_decimal
        prob2 = 1 / odds2.odds_decimal
        return abs(prob1 - prob2) * 0.5  # Simple efficiency gap metric

    def _assess_risk_level(self, best_odds: Dict[str, SportsbookOdds], profit_percentage: float) -> RiskLevel:
        """Assess risk level of arbitrage opportunity"""
        # Check sportsbook reliability
        min_reliability = min(
            self.sportsbook_reliabilities.get(odds.sportsbook, 0.5) 
            for odds in best_odds.values()
        )
        
        # Check profit margin
        if profit_percentage < 1.0:
            risk_score = 0.3
        elif profit_percentage < 2.0:
            risk_score = 0.5
        elif profit_percentage < 5.0:
            risk_score = 0.7
        else:
            risk_score = 0.9
        
        # Adjust for sportsbook reliability
        risk_score *= min_reliability
        
        if risk_score >= 0.8:
            return RiskLevel.LOW
        elif risk_score >= 0.6:
            return RiskLevel.MEDIUM
        elif risk_score >= 0.4:
            return RiskLevel.HIGH
        else:
            return RiskLevel.EXTREME

    def _calculate_confidence_score(self, best_odds: Dict[str, SportsbookOdds], profit_percentage: float) -> float:
        """Calculate confidence score for arbitrage opportunity"""
        # Base confidence from profit percentage
        base_confidence = min(profit_percentage / 10.0, 0.8)
        
        # Adjust for sportsbook reliability
        avg_reliability = np.mean([
            self.sportsbook_reliabilities.get(odds.sportsbook, 0.5) 
            for odds in best_odds.values()
        ])
        
        # Time factor (fresher odds = higher confidence)
        time_factor = 1.0
        for odds in best_odds.values():
            if odds.last_updated:
                age_minutes = (datetime.now() - odds.last_updated).total_seconds() / 60
                time_factor = min(time_factor, max(0.5, 1 - (age_minutes / 30)))
        
        return min(0.99, base_confidence * avg_reliability * time_factor)

    def _generate_opportunity_id(self, game_odds: Dict[str, List[SportsbookOdds]], market_type: str) -> str:
        """Generate unique opportunity ID"""
        # Create hash from game details and timestamp
        content = f"{market_type}_{int(time.time())}_{len(game_odds)}"
        return hashlib.md5(content.encode()).hexdigest()[:16]

    async def scan_all_arbitrage_opportunities(self) -> Dict[str, List[ArbitrageOpportunity]]:
        """Comprehensive scan for all types of arbitrage opportunities"""
        # Get mock data for demonstration
        all_game_odds = await self._get_comprehensive_odds_data()
        
        all_opportunities = {
            'two_way': [],
            'three_way': [],
            'cross_market': [],
            'sure_bets': [],
            'middles': []
        }
        
        for game_id, game_odds in all_game_odds.items():
            # Two-way arbitrage
            two_way_opps = await self.detect_two_way_arbitrage(game_odds)
            all_opportunities['two_way'].extend(two_way_opps)
            
            # Three-way arbitrage
            three_way_opps = await self.detect_three_way_arbitrage(game_odds)
            all_opportunities['three_way'].extend(three_way_opps)
        
        # Cross-market arbitrage
        cross_market_opps = await self.detect_cross_market_arbitrage(all_game_odds)
        all_opportunities['cross_market'].extend(cross_market_opps)
        
        # Store opportunities
        for category, opportunities in all_opportunities.items():
            for opp in opportunities:
                self.opportunities[opp.opportunity_id] = opp
        
        return all_opportunities

    async def _get_comprehensive_odds_data(self) -> Dict[str, Dict[str, List[SportsbookOdds]]]:
        """Get comprehensive odds data from all sportsbooks"""
        # Mock data for demonstration - in production, this would fetch from real APIs
        mock_data = {}
        
        # Generate sample games
        games = [
            'nfl_chiefs_bills', 'nfl_cowboys_giants', 'nba_lakers_celtics',
            'nba_warriors_nets', 'mlb_yankees_redsox', 'nhl_rangers_bruins'
        ]
        
        for game_id in games:
            mock_data[game_id] = {
                'moneyline': [],
                'spread': [],
                'total': []
            }
            
            # Generate odds for each sportsbook
            for sportsbook in list(self.sportsbooks.keys())[:8]:  # Use first 8 sportsbooks
                # Moneyline odds
                home_ml = np.random.randint(-200, 300)
                away_ml = self._calculate_opposing_odds(home_ml)
                
                mock_data[game_id]['moneyline'].extend([
                    SportsbookOdds(
                        sportsbook=sportsbook,
                        game_id=game_id,
                        market_type='moneyline',
                        selection='home',
                        odds_american=home_ml,
                        odds_decimal=self.american_to_decimal(home_ml),
                        line=None,
                        timestamp=datetime.now(),
                        reliability_score=self.sportsbooks[sportsbook]['reliability']
                    ),
                    SportsbookOdds(
                        sportsbook=sportsbook,
                        game_id=game_id,
                        market_type='moneyline',
                        selection='away',
                        odds_american=away_ml,
                        odds_decimal=self.american_to_decimal(away_ml),
                        line=None,
                        timestamp=datetime.now(),
                        reliability_score=self.sportsbooks[sportsbook]['reliability']
                    )
                ])
                
                # Spread odds
                spread_line = np.random.uniform(-7.5, 7.5)
                spread_odds = np.random.randint(-120, -100)
                
                mock_data[game_id]['spread'].extend([
                    SportsbookOdds(
                        sportsbook=sportsbook,
                        game_id=game_id,
                        market_type='spread',
                        selection='home',
                        odds_american=spread_odds,
                        odds_decimal=self.american_to_decimal(spread_odds),
                        line=spread_line,
                        timestamp=datetime.now(),
                        reliability_score=self.sportsbooks[sportsbook]['reliability']
                    ),
                    SportsbookOdds(
                        sportsbook=sportsbook,
                        game_id=game_id,
                        market_type='spread',
                        selection='away',
                        odds_american=spread_odds,
                        odds_decimal=self.american_to_decimal(spread_odds),
                        line=-spread_line,
                        timestamp=datetime.now(),
                        reliability_score=self.sportsbooks[sportsbook]['reliability']
                    )
                ])
                
                # Total odds
                total_line = np.random.uniform(45.5, 55.5)
                total_odds = np.random.randint(-120, -100)
                
                mock_data[game_id]['total'].extend([
                    SportsbookOdds(
                        sportsbook=sportsbook,
                        game_id=game_id,
                        market_type='total',
                        selection='over',
                        odds_american=total_odds,
                        odds_decimal=self.american_to_decimal(total_odds),
                        line=total_line,
                        timestamp=datetime.now(),
                        reliability_score=self.sportsbooks[sportsbook]['reliability']
                    ),
                    SportsbookOdds(
                        sportsbook=sportsbook,
                        game_id=game_id,
                        market_type='total',
                        selection='under',
                        odds_american=total_odds,
                        odds_decimal=self.american_to_decimal(total_odds),
                        line=total_line,
                        timestamp=datetime.now(),
                        reliability_score=self.sportsbooks[sportsbook]['reliability']
                    )
                ])
        
        return mock_data

    def _calculate_opposing_odds(self, odds: int) -> int:
        """Calculate opposing odds that create realistic market"""
        decimal = self.american_to_decimal(odds)
        implied_prob = 1 / decimal
        opposing_prob = 1 - implied_prob
        # Add some vig
        opposing_prob *= 0.95
        opposing_decimal = 1 / opposing_prob
        return self.decimal_to_american(opposing_decimal)

    async def get_portfolio_summary(self) -> ArbitragePortfolio:
        """Get comprehensive portfolio summary"""
        active_opps = [opp for opp in self.opportunities.values() if opp.status == ArbitrageStatus.ACTIVE]
        
        total_expected_profit = sum(opp.guaranteed_profit for opp in active_opps)
        average_return = np.mean([opp.profit_percentage for opp in active_opps]) if active_opps else 0
        
        risk_distribution = {
            RiskLevel.LOW: len([opp for opp in active_opps if opp.risk_level == RiskLevel.LOW]),
            RiskLevel.MEDIUM: len([opp for opp in active_opps if opp.risk_level == RiskLevel.MEDIUM]),
            RiskLevel.HIGH: len([opp for opp in active_opps if opp.risk_level == RiskLevel.HIGH]),
            RiskLevel.EXTREME: len([opp for opp in active_opps if opp.risk_level == RiskLevel.EXTREME])
        }
        
        sportsbook_dist = defaultdict(int)
        for opp in active_opps:
            for sportsbook in opp.sportsbooks_involved:
                sportsbook_dist[sportsbook] += 1
        
        return ArbitragePortfolio(
            total_opportunities=len(self.opportunities),
            active_opportunities=len(active_opps),
            total_expected_profit=total_expected_profit,
            average_return=average_return,
            risk_distribution=risk_distribution,
            sportsbook_distribution=dict(sportsbook_dist),
            success_rate=0.87,  # Mock value
            updated_at=datetime.now()
        )

# Global instance
_arbitrage_engine = None

def get_arbitrage_engine() -> AdvancedArbitrageEngine:
    """Get singleton instance of arbitrage engine"""
    global _arbitrage_engine
    if _arbitrage_engine is None:
        _arbitrage_engine = AdvancedArbitrageEngine()
    return _arbitrage_engine
