"""
Parlay Analytics Calculator Service

Provides comprehensive parlay betting analytics including:
- Payout calculations with accurate odds conversion
- Expected value analysis with fair odds comparison
- Correlation warnings for same-player markets
- Risk assessment and probability calculations

Author: A1Betting Parlay Analytics System
"""

import logging
from typing import List, Dict, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger("propollama")


class CorrelationLevel(Enum):
    """Correlation risk levels for parlay legs"""
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EXTREME = "extreme"


@dataclass
class ParlayLeg:
    """Individual leg of a parlay bet"""
    player: str
    market: str
    odds: int  # American odds format
    our_fair_odds: int  # Our calculated fair odds
    team: Optional[str] = None
    stat_type: Optional[str] = None


@dataclass
class CorrelationWarning:
    """Warning about correlated legs in parlay"""
    level: CorrelationLevel
    message: str
    affected_legs: List[int]  # Indices of affected legs
    risk_factor: float  # Multiplier for risk assessment


@dataclass
class ParlayAnalytics:
    """Complete parlay analysis results"""
    total_payout: float
    implied_probability: float
    fair_probability: float
    expected_value_percent: float
    correlation_warnings: List[CorrelationWarning]
    risk_assessment: str
    individual_leg_analysis: List[Dict[str, Any]]


class ParlayCalculator:
    """
    Advanced parlay calculator with correlation analysis and EV computation
    """
    
    def __init__(self):
        self.correlation_patterns = self._initialize_correlation_patterns()
    
    def _initialize_correlation_patterns(self) -> Dict[str, Dict[str, float]]:
        """Initialize known correlation patterns between market types"""
        return {
            # Same player correlations
            "same_player_same_game": {
                "points_rebounds": 0.6,  # Scoring often correlates with rebounding
                "points_assists": 0.4,   # Playmakers often score
                "rebounds_blocks": 0.7,  # Big men stats
                "assists_turnovers": -0.3,  # More assists, fewer turnovers
                "points_three_pointers": 0.8,  # Three-point specialists
            },
            # Same team correlations
            "same_team_totals": {
                "team_points_player_points": 0.5,
                "team_rebounds_player_rebounds": 0.6,
            },
            # Game flow correlations
            "game_flow": {
                "total_points_pace": 0.7,
                "blowout_garbage_time": -0.4,
            }
        }
    
    def american_to_decimal(self, american_odds: int) -> float:
        """Convert American odds to decimal odds"""
        if american_odds > 0:
            return (american_odds / 100) + 1
        else:
            return (100 / abs(american_odds)) + 1
    
    def decimal_to_implied_probability(self, decimal_odds: float) -> float:
        """Convert decimal odds to implied probability"""
        return 1 / decimal_odds
    
    def compute_parlay_payout(self, legs_odds: List[int]) -> float:
        """
        Compute parlay payout from individual leg odds
        
        Args:
            legs_odds: List of American odds for each leg
            
        Returns:
            Total payout multiplier (decimal odds)
        """
        try:
            if not legs_odds:
                raise ValueError("Cannot compute payout for empty parlay")
            
            total_decimal_odds = 1.0
            
            for odds in legs_odds:
                if odds == 0:
                    raise ValueError("Odds cannot be zero")
                
                decimal_odds = self.american_to_decimal(odds)
                total_decimal_odds *= decimal_odds
            
            logger.info(f"Computed parlay payout: {total_decimal_odds:.3f} from {len(legs_odds)} legs")
            return total_decimal_odds
            
        except Exception as e:
            logger.error(f"Error computing parlay payout: {e}")
            raise
    
    def compute_conditional_ev(
        self, 
        legs_fair_odds: List[int], 
        legs_market_odds: List[int]
    ) -> Tuple[float, float, float]:
        """
        Compute conditional expected value for parlay
        
        Args:
            legs_fair_odds: Our calculated fair odds for each leg
            legs_market_odds: Market odds for each leg
            
        Returns:
            Tuple of (fair_probability, implied_probability, ev_percent)
        """
        try:
            if len(legs_fair_odds) != len(legs_market_odds):
                raise ValueError("Fair odds and market odds must have same length")
            
            # Calculate individual probabilities
            fair_probs = []
            implied_probs = []
            
            for fair_odds, market_odds in zip(legs_fair_odds, legs_market_odds):
                fair_decimal = self.american_to_decimal(fair_odds)
                market_decimal = self.american_to_decimal(market_odds)
                
                fair_prob = self.decimal_to_implied_probability(fair_decimal)
                implied_prob = self.decimal_to_implied_probability(market_decimal)
                
                fair_probs.append(fair_prob)
                implied_probs.append(implied_prob)
            
            # Calculate combined probabilities (assuming independence)
            combined_fair_prob = 1.0
            combined_implied_prob = 1.0
            
            for fair_prob, implied_prob in zip(fair_probs, implied_probs):
                combined_fair_prob *= fair_prob
                combined_implied_prob *= implied_prob
            
            # Calculate expected value
            market_payout = self.compute_parlay_payout(legs_market_odds)
            expected_return = combined_fair_prob * market_payout
            ev_percent = (expected_return - 1.0) * 100
            
            logger.info(f"Computed conditional EV: {ev_percent:.2f}% "
                       f"(Fair: {combined_fair_prob:.3f}, Implied: {combined_implied_prob:.3f})")
            
            return combined_fair_prob, combined_implied_prob, ev_percent
            
        except Exception as e:
            logger.error(f"Error computing conditional EV: {e}")
            raise
    
    def detect_correlations(self, legs: List[ParlayLeg]) -> List[CorrelationWarning]:
        """
        Detect correlations between parlay legs using simple heuristics
        
        Args:
            legs: List of parlay legs to analyze
            
        Returns:
            List of correlation warnings
        """
        warnings = []
        
        try:
            # Check for same-player markets
            player_markets = {}
            for i, leg in enumerate(legs):
                player = leg.player.lower() if leg.player else ""
                if player not in player_markets:
                    player_markets[player] = []
                player_markets[player].append((i, leg.market.lower()))
            
            # Analyze same-player correlations
            for player, markets in player_markets.items():
                if len(markets) > 1 and player:  # Skip empty player names
                    market_types = [market[1] for market in markets]
                    leg_indices = [market[0] for market in markets]
                    
                    # Check for known correlation patterns
                    correlation_level = self._assess_same_player_correlation(market_types)
                    
                    if correlation_level != CorrelationLevel.NONE:
                        risk_factor = self._get_risk_factor(correlation_level)
                        message = self._generate_correlation_message(player, market_types, correlation_level)
                        
                        warnings.append(CorrelationWarning(
                            level=correlation_level,
                            message=message,
                            affected_legs=leg_indices,
                            risk_factor=risk_factor
                        ))
            
            # Check for same-team correlations
            team_legs = {}
            for i, leg in enumerate(legs):
                team = leg.team.lower() if leg.team else ""
                if team not in team_legs:
                    team_legs[team] = []
                team_legs[team].append((i, leg))
            
            for team, team_leg_data in team_legs.items():
                if len(team_leg_data) > 2 and team:  # 3+ legs from same team
                    leg_indices = [data[0] for data in team_leg_data]
                    warnings.append(CorrelationWarning(
                        level=CorrelationLevel.MEDIUM,
                        message=f"Multiple bets on {team.title()} players may be correlated due to team performance",
                        affected_legs=leg_indices,
                        risk_factor=1.3
                    ))
            
            logger.info(f"Detected {len(warnings)} correlation warnings for {len(legs)} legs")
            return warnings
            
        except Exception as e:
            logger.error(f"Error detecting correlations: {e}")
            return []
    
    def _assess_same_player_correlation(self, market_types: List[str]) -> CorrelationLevel:
        """Assess correlation level for same-player markets"""
        
        # Define high-correlation combinations
        high_correlation_pairs = [
            ("points", "rebounds"),
            ("rebounds", "blocks"),
            ("points", "three_pointers"),
            ("assists", "points"),
        ]
        
        extreme_correlation_pairs = [
            ("points", "field_goals"),
            ("three_pointers", "three_point_percentage"),
            ("free_throws", "free_throw_percentage"),
        ]
        
        # Check for exact matches or partial matches
        for market1, market2 in extreme_correlation_pairs:
            if any(market1 in mt for mt in market_types) and any(market2 in mt for mt in market_types):
                return CorrelationLevel.EXTREME
        
        for market1, market2 in high_correlation_pairs:
            if any(market1 in mt for mt in market_types) and any(market2 in mt for mt in market_types):
                return CorrelationLevel.HIGH
        
        # If 3+ markets for same player, at least medium correlation
        if len(market_types) >= 3:
            return CorrelationLevel.MEDIUM
        
        # If 2 markets for same player, low correlation
        if len(market_types) == 2:
            return CorrelationLevel.LOW
        
        return CorrelationLevel.NONE
    
    def _get_risk_factor(self, level: CorrelationLevel) -> float:
        """Get risk multiplier for correlation level"""
        risk_factors = {
            CorrelationLevel.NONE: 1.0,
            CorrelationLevel.LOW: 1.1,
            CorrelationLevel.MEDIUM: 1.3,
            CorrelationLevel.HIGH: 1.6,
            CorrelationLevel.EXTREME: 2.0,
        }
        return risk_factors.get(level, 1.0)
    
    def _generate_correlation_message(
        self, 
        player: str, 
        market_types: List[str], 
        level: CorrelationLevel
    ) -> str:
        """Generate user-friendly correlation warning message"""
        
        player_title = player.title()
        markets_str = ", ".join(market_types)
        
        if level == CorrelationLevel.EXTREME:
            return f"⚠️ EXTREME CORRELATION: {player_title}'s {markets_str} are highly dependent on each other"
        elif level == CorrelationLevel.HIGH:
            return f"🔴 HIGH CORRELATION: {player_title}'s {markets_str} often move together"
        elif level == CorrelationLevel.MEDIUM:
            return f"🟡 MEDIUM CORRELATION: {player_title}'s {markets_str} may be somewhat related"
        else:
            return f"🟢 LOW CORRELATION: {player_title}'s {markets_str} have minimal correlation"
    
    def analyze_parlay(self, legs: List[ParlayLeg]) -> ParlayAnalytics:
        """
        Perform comprehensive parlay analysis
        
        Args:
            legs: List of parlay legs to analyze
            
        Returns:
            Complete parlay analytics
        """
        try:
            if not legs:
                raise ValueError("Cannot analyze empty parlay")
            
            # Extract odds for calculations
            market_odds = [leg.odds for leg in legs]
            fair_odds = [leg.our_fair_odds for leg in legs]
            
            # Calculate basic metrics
            total_payout = self.compute_parlay_payout(market_odds)
            fair_prob, implied_prob, ev_percent = self.compute_conditional_ev(fair_odds, market_odds)
            
            # Detect correlations
            correlation_warnings = self.detect_correlations(legs)
            
            # Adjust EV based on correlations
            correlation_adjustment = 1.0
            for warning in correlation_warnings:
                correlation_adjustment *= warning.risk_factor
            
            adjusted_ev = ev_percent / correlation_adjustment
            
            # Generate risk assessment
            risk_assessment = self._generate_risk_assessment(
                ev_percent, correlation_warnings, len(legs)
            )
            
            # Analyze individual legs
            individual_analysis = []
            for i, leg in enumerate(legs):
                leg_decimal = self.american_to_decimal(leg.odds)
                fair_decimal = self.american_to_decimal(leg.our_fair_odds)
                
                leg_analysis = {
                    "leg_index": i,
                    "player": leg.player,
                    "market": leg.market,
                    "odds": leg.odds,
                    "implied_probability": self.decimal_to_implied_probability(leg_decimal),
                    "fair_probability": self.decimal_to_implied_probability(fair_decimal),
                    "individual_ev": ((self.decimal_to_implied_probability(fair_decimal) * leg_decimal) - 1) * 100
                }
                individual_analysis.append(leg_analysis)
            
            analytics = ParlayAnalytics(
                total_payout=total_payout,
                implied_probability=implied_prob,
                fair_probability=fair_prob,
                expected_value_percent=adjusted_ev,
                correlation_warnings=correlation_warnings,
                risk_assessment=risk_assessment,
                individual_leg_analysis=individual_analysis
            )
            
            logger.info(f"Completed parlay analysis: EV={adjusted_ev:.2f}%, "
                       f"Payout={total_payout:.2f}x, Warnings={len(correlation_warnings)}")
            
            return analytics
            
        except Exception as e:
            logger.error(f"Error analyzing parlay: {e}")
            raise
    
    def _generate_risk_assessment(
        self, 
        ev_percent: float, 
        warnings: List[CorrelationWarning], 
        num_legs: int
    ) -> str:
        """Generate overall risk assessment for parlay"""
        
        high_risk_factors = 0
        
        # Check EV
        if ev_percent < -10:
            high_risk_factors += 1
        
        # Check correlations
        extreme_correlations = sum(1 for w in warnings if w.level == CorrelationLevel.EXTREME)
        high_correlations = sum(1 for w in warnings if w.level == CorrelationLevel.HIGH)
        
        if extreme_correlations > 0:
            high_risk_factors += 2
        elif high_correlations > 0:
            high_risk_factors += 1
        
        # Check parlay size
        if num_legs > 6:
            high_risk_factors += 1
        elif num_legs > 4:
            high_risk_factors += 0.5
        
        # Generate assessment
        if high_risk_factors >= 3:
            return "HIGH RISK: Multiple risk factors present. Consider smaller parlays or better odds."
        elif high_risk_factors >= 1.5:
            return "MEDIUM RISK: Some risk factors present. Proceed with caution."
        elif ev_percent > 5:
            return "LOW RISK: Positive expected value with manageable correlations."
        else:
            return "STANDARD RISK: Typical parlay risk profile."


# Create singleton instance
parlay_calculator = ParlayCalculator()