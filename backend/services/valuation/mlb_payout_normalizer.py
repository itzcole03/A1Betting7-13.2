"""
MLB Payout Normalization Service - Section 3 Implementation

Handles payout normalization, vig calculation, and true odds conversion
specific to baseball betting markets.
"""

import logging
import math
from dataclasses import dataclass
from enum import Enum
from typing import Dict, Any, Optional, List, Tuple

logger = logging.getLogger(__name__)


class OddsFormat(Enum):
    """Supported odds formats"""
    AMERICAN = "american"      # +150, -120, etc.
    DECIMAL = "decimal"        # 2.50, 1.83, etc.
    FRACTIONAL = "fractional"  # 3/2, 5/6, etc.
    IMPLIED = "implied"        # 0.40, 0.625, etc. (as probability)


class MarketType(Enum):
    """MLB betting market types"""
    PLAYER_PROP = "player_prop"      # Individual player props
    TEAM_TOTAL = "team_total"        # Team run totals
    GAME_TOTAL = "game_total"        # Game run totals  
    MONEYLINE = "moneyline"          # Win/loss bets
    RUN_LINE = "run_line"            # Spread bets
    FIRST_INNING = "first_inning"    # First inning props


@dataclass
class OddsQuote:
    """Single odds quote"""
    odds: float                # Raw odds value
    format: OddsFormat        # Format of the odds
    side: str                 # "over", "under", "yes", "no", etc.
    line: Optional[float] = None  # Associated line/threshold


@dataclass
class MarketOdds:
    """Complete market odds structure"""
    quotes: List[OddsQuote]   # All quotes for this market
    market_type: MarketType   # Type of betting market
    prop_type: Optional[str] = None  # Specific prop type if applicable
    player: Optional[str] = None     # Player name if applicable
    
    
@dataclass
class NormalizedMarket:
    """Normalized market with true probabilities and vig removed"""
    true_probabilities: Dict[str, float]  # Vig-removed probabilities
    implied_probabilities: Dict[str, float]  # Raw implied probabilities
    decimal_odds: Dict[str, float]       # All odds in decimal format
    vig_percentage: float                # Total market vig
    overround: float                     # Market overround
    fair_odds: Dict[str, float]          # Fair odds with vig removed
    
    
class MLBPayoutNormalizer:
    """
    MLB-specific payout normalization service
    
    Handles:
    - Vig calculation and removal
    - True odds conversion
    - Market efficiency analysis
    - MLB-specific market adjustments
    """
    
    def __init__(self):
        self.name = "mlb_payout_normalizer"
        self.version = "1.0"
        
        # MLB market vig expectations by market type
        self.typical_vig_ranges = {
            MarketType.PLAYER_PROP: (0.04, 0.08),    # 4-8% vig on player props
            MarketType.TEAM_TOTAL: (0.045, 0.065),   # 4.5-6.5% vig on team totals
            MarketType.GAME_TOTAL: (0.04, 0.06),     # 4-6% vig on game totals
            MarketType.MONEYLINE: (0.02, 0.05),      # 2-5% vig on moneylines
            MarketType.RUN_LINE: (0.03, 0.055),      # 3-5.5% vig on run lines
            MarketType.FIRST_INNING: (0.05, 0.09),   # 5-9% vig on specialty props
        }
        
        # Standard market structures
        self.standard_prop_odds = -110  # Standard American odds for props
        
        logger.info("MLB Payout Normalizer initialized")
    
    async def normalize_market(
        self,
        market_odds: MarketOdds,
        context: Optional[Dict[str, Any]] = None
    ) -> NormalizedMarket:
        """
        Normalize MLB betting market odds
        
        Args:
            market_odds: Market odds structure
            context: Additional market context
            
        Returns:
            NormalizedMarket: Normalized market with true probabilities
        """
        try:
            logger.debug(f"Normalizing MLB market: {market_odds.market_type}")
            
            # Step 1: Convert all odds to decimal format
            decimal_odds = self._convert_to_decimal_odds(market_odds.quotes)
            
            # Step 2: Calculate implied probabilities
            implied_probabilities = self._calculate_implied_probabilities(decimal_odds)
            
            # Step 3: Calculate vig and overround
            vig_analysis = self._analyze_vig(implied_probabilities, market_odds.market_type)
            
            # Step 4: Remove vig to get true probabilities
            true_probabilities = self._remove_vig(
                implied_probabilities, 
                vig_analysis["vig_percentage"]
            )
            
            # Step 5: Calculate fair odds
            fair_odds = self._calculate_fair_odds(true_probabilities)
            
            # Step 6: Apply MLB-specific adjustments
            if context:
                fair_odds = self._apply_mlb_adjustments(
                    fair_odds, market_odds, context
                )
            
            return NormalizedMarket(
                true_probabilities=true_probabilities,
                implied_probabilities=implied_probabilities,
                decimal_odds=decimal_odds,
                vig_percentage=vig_analysis["vig_percentage"],
                overround=vig_analysis["overround"],
                fair_odds=fair_odds
            )
            
        except Exception as e:
            logger.error(f"Error normalizing MLB market: {e}")
            raise
    
    def _convert_to_decimal_odds(self, quotes: List[OddsQuote]) -> Dict[str, float]:
        """Convert all odds quotes to decimal format"""
        decimal_odds = {}
        
        for quote in quotes:
            side = quote.side
            
            if quote.format == OddsFormat.DECIMAL:
                decimal_odds[side] = quote.odds
                
            elif quote.format == OddsFormat.AMERICAN:
                decimal_odds[side] = self._american_to_decimal(quote.odds)
                
            elif quote.format == OddsFormat.FRACTIONAL:
                decimal_odds[side] = self._fractional_to_decimal(quote.odds)
                
            elif quote.format == OddsFormat.IMPLIED:
                # Implied probability to decimal odds
                decimal_odds[side] = 1 / quote.odds if quote.odds > 0 else 1.0
                
            else:
                logger.warning(f"Unknown odds format: {quote.format}")
                decimal_odds[side] = 2.0  # Default fallback
        
        return decimal_odds
    
    def _american_to_decimal(self, american_odds: float) -> float:
        """Convert American odds to decimal odds"""
        if american_odds > 0:
            return (american_odds / 100) + 1
        else:
            return (100 / abs(american_odds)) + 1
    
    def _fractional_to_decimal(self, fractional_odds: float) -> float:
        """Convert fractional odds to decimal odds"""
        # Assuming fractional odds are passed as decimal representation
        # e.g., 3/2 = 1.5, 5/6 = 0.833, etc.
        return fractional_odds + 1
    
    def _calculate_implied_probabilities(self, decimal_odds: Dict[str, float]) -> Dict[str, float]:
        """Calculate implied probabilities from decimal odds"""
        implied_probabilities = {}
        
        for side, odds in decimal_odds.items():
            if odds > 0:
                implied_probabilities[side] = 1 / odds
            else:
                logger.warning(f"Invalid decimal odds for {side}: {odds}")
                implied_probabilities[side] = 0.5  # Default fallback
        
        return implied_probabilities
    
    def _analyze_vig(
        self, 
        implied_probabilities: Dict[str, float], 
        market_type: MarketType
    ) -> Dict[str, Any]:
        """Analyze market vig and overround"""
        
        # Calculate total implied probability (overround)
        total_implied = sum(implied_probabilities.values())
        
        # Overround is the excess over 1.0
        overround = total_implied - 1.0
        
        # Vig percentage is overround expressed as percentage
        vig_percentage = overround
        
        # Check if vig is within expected range for market type
        expected_range = self.typical_vig_ranges.get(market_type, (0.04, 0.08))
        vig_within_range = expected_range[0] <= vig_percentage <= expected_range[1]
        
        # Classify market efficiency
        if vig_percentage < 0.03:
            efficiency = "VERY_EFFICIENT"
        elif vig_percentage < 0.05:
            efficiency = "EFFICIENT"  
        elif vig_percentage < 0.08:
            efficiency = "MODERATE"
        elif vig_percentage < 0.12:
            efficiency = "INEFFICIENT"
        else:
            efficiency = "VERY_INEFFICIENT"
        
        return {
            "overround": overround,
            "vig_percentage": vig_percentage,
            "vig_within_expected_range": vig_within_range,
            "expected_vig_range": expected_range,
            "market_efficiency": efficiency,
            "total_implied_probability": total_implied
        }
    
    def _remove_vig(
        self, 
        implied_probabilities: Dict[str, float], 
        vig_percentage: float
    ) -> Dict[str, float]:
        """Remove vig to calculate true probabilities"""
        
        if vig_percentage <= 0:
            return implied_probabilities.copy()
        
        # Proportional vig removal method
        true_probabilities = {}
        total_implied = sum(implied_probabilities.values())
        
        for side, implied_prob in implied_probabilities.items():
            # Remove vig proportionally
            true_prob = implied_prob / total_implied
            true_probabilities[side] = true_prob
        
        return true_probabilities
    
    def _calculate_fair_odds(self, true_probabilities: Dict[str, float]) -> Dict[str, float]:
        """Calculate fair odds from true probabilities"""
        fair_odds = {}
        
        for side, true_prob in true_probabilities.items():
            if true_prob > 0:
                fair_odds[side] = 1 / true_prob
            else:
                fair_odds[side] = float('inf')  # Infinite odds for zero probability
        
        return fair_odds
    
    def _apply_mlb_adjustments(
        self,
        fair_odds: Dict[str, float],
        market_odds: MarketOdds,
        context: Dict[str, Any]
    ) -> Dict[str, float]:
        """Apply MLB-specific adjustments to fair odds"""
        
        adjusted_odds = fair_odds.copy()
        
        # Adjustment 1: Weather effects
        weather = context.get("weather_conditions", "")
        if "rain" in weather.lower() or "wind" in weather.lower():
            # Weather creates uncertainty - slightly increase vig expectation
            for side in adjusted_odds:
                adjusted_odds[side] *= 1.01  # 1% adjustment for weather uncertainty
        
        # Adjustment 2: Time of day effects
        game_time = context.get("game_time", "")
        if "day" in game_time.lower():
            # Day games can have different characteristics
            if market_odds.market_type == MarketType.PLAYER_PROP:
                # Day games might favor certain player props
                for side in adjusted_odds:
                    adjusted_odds[side] *= 1.005  # 0.5% adjustment
        
        # Adjustment 3: Series context
        series_game = context.get("series_game", 1)
        if series_game > 2:
            # Later games in series may have more predictable patterns
            for side in adjusted_odds:
                adjusted_odds[side] *= 0.995  # Slight reduction in uncertainty
        
        # Adjustment 4: Playoff vs regular season
        game_importance = context.get("game_importance", "regular")
        if game_importance == "playoff":
            # Playoff games may be more unpredictable
            for side in adjusted_odds:
                adjusted_odds[side] *= 1.02  # 2% adjustment for playoff uncertainty
        
        return adjusted_odds
    
    def calculate_kelly_criterion(
        self,
        true_probability: float,
        decimal_odds: float,
        bankroll_fraction_cap: float = 0.05
    ) -> Dict[str, Any]:
        """
        Calculate Kelly Criterion bet sizing
        
        Args:
            true_probability: True probability of outcome
            decimal_odds: Market decimal odds
            bankroll_fraction_cap: Maximum fraction of bankroll to risk
            
        Returns:
            dict: Kelly analysis including recommended bet size
        """
        if decimal_odds <= 1.0 or true_probability <= 0:
            return {
                "kelly_fraction": 0.0,
                "recommended_bet": 0.0,
                "expected_growth": 0.0,
                "risk_assessment": "NO_BET"
            }
        
        # Kelly formula: f = (bp - q) / b
        # where b = decimal_odds - 1, p = true_probability, q = 1 - true_probability
        b = decimal_odds - 1
        p = true_probability
        q = 1 - true_probability
        
        kelly_fraction = (b * p - q) / b
        
        # Apply safety caps
        if kelly_fraction < 0:
            # Negative Kelly means no bet
            recommended_bet = 0.0
            risk_assessment = "NO_EDGE"
        elif kelly_fraction > bankroll_fraction_cap:
            # Cap at maximum allowed fraction
            recommended_bet = bankroll_fraction_cap
            risk_assessment = "HIGH_EDGE_CAPPED"
        else:
            recommended_bet = kelly_fraction
            if kelly_fraction > 0.02:
                risk_assessment = "MODERATE_EDGE"
            else:
                risk_assessment = "LOW_EDGE"
        
        # Expected growth rate
        if recommended_bet > 0:
            expected_growth = p * math.log(1 + recommended_bet * b) + q * math.log(1 - recommended_bet)
        else:
            expected_growth = 0.0
        
        return {
            "kelly_fraction": kelly_fraction,
            "recommended_bet": recommended_bet,
            "expected_growth": expected_growth,
            "risk_assessment": risk_assessment,
            "true_probability": true_probability,
            "market_odds": decimal_odds
        }
    
    def analyze_market_value(
        self,
        normalized_market: NormalizedMarket,
        our_predictions: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Analyze market value based on our predictions vs market
        
        Args:
            normalized_market: Normalized market odds
            our_predictions: Our probability predictions for each outcome
            
        Returns:
            dict: Value analysis for each market outcome
        """
        value_analysis = {}
        
        for side, our_prob in our_predictions.items():
            if side not in normalized_market.fair_odds:
                continue
                
            market_fair_odds = normalized_market.fair_odds[side]
            market_true_prob = normalized_market.true_probabilities[side]
            
            # Calculate value metrics
            probability_edge = our_prob - market_true_prob
            odds_value = (1 / our_prob) / market_fair_odds if our_prob > 0 else 0
            
            # Kelly calculation
            kelly_analysis = self.calculate_kelly_criterion(
                our_prob, 
                normalized_market.decimal_odds.get(side, 2.0)
            )
            
            # Value assessment
            if probability_edge > 0.05:  # 5%+ edge
                value_tier = "STRONG_VALUE"
            elif probability_edge > 0.02:  # 2%+ edge
                value_tier = "MODERATE_VALUE"
            elif probability_edge > 0.005:  # 0.5%+ edge
                value_tier = "WEAK_VALUE"
            else:
                value_tier = "NO_VALUE"
            
            value_analysis[side] = {
                "our_probability": our_prob,
                "market_true_probability": market_true_prob,
                "probability_edge": probability_edge,
                "odds_value_ratio": odds_value,
                "kelly_analysis": kelly_analysis,
                "value_tier": value_tier,
                "expected_value": kelly_analysis["expected_growth"]
            }
        
        # Find best bet
        best_bet = None
        best_ev = -1
        
        for side, analysis in value_analysis.items():
            if analysis["expected_value"] > best_ev:
                best_ev = analysis["expected_value"]
                best_bet = side
        
        return {
            "value_analysis": value_analysis,
            "best_bet": best_bet,
            "max_expected_value": best_ev,
            "market_efficiency": normalized_market.vig_percentage < 0.05
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check for payout normalizer"""
        try:
            # Test odds conversion
            test_american = self._american_to_decimal(-110)
            test_decimal_valid = abs(test_american - 1.909) < 0.001
            
            # Test vig calculation
            test_implied = {"over": 0.525, "under": 0.525}
            vig_analysis = self._analyze_vig(test_implied, MarketType.PLAYER_PROP)
            vig_calculation_valid = abs(vig_analysis["vig_percentage"] - 0.05) < 0.001
            
            return {
                "service": self.name,
                "version": self.version,
                "status": "healthy",
                "capabilities": {
                    "odds_conversion": test_decimal_valid,
                    "vig_calculation": vig_calculation_valid,
                    "kelly_criterion": True,
                    "market_analysis": True,
                    "mlb_adjustments": True
                }
            }
            
        except Exception as e:
            logger.error(f"Payout normalizer health check failed: {e}")
            return {
                "service": self.name,
                "version": self.version,
                "status": "degraded", 
                "error": str(e)
            }


# Global service instance
mlb_payout_normalizer = MLBPayoutNormalizer()