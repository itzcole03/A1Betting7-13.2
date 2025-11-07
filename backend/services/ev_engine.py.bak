"""
Expected Value (EV) Engine

Computes positive expected value for betting opportunities by comparing our fair odds
assessments against market odds. Provides comprehensive EV calculations, odds conversions,
and tier classification for identifying profitable betting opportunities.
"""

import logging
from typing import Optional, Tuple, Dict, Any
from enum import Enum
import math

logger = logging.getLogger("ev_engine")


class EVTier(Enum):
    """EV classification tiers"""
    LOW = "low"           # 0-3% EV
    MODERATE = "moderate" # 3-8% EV  
    HIGH = "high"         # 8%+ EV
    NEGATIVE = "negative" # <0% EV


class EVEngine:
    """Expected Value computation engine for betting opportunities"""
    
    def __init__(self):
        self.logger = logging.getLogger("ev_engine")
        
    @staticmethod
    def american_to_decimal(american_odds: int) -> float:
        """
        Convert American odds to decimal odds
        
        Args:
            american_odds: American odds format (e.g., -110, +150)
            
        Returns:
            Decimal odds (e.g., 1.91, 2.50)
        """
        try:
            if american_odds is None:
                return 1.0
                
            odds = int(american_odds)
            
            if odds == 0:
                return 1.0
                
            if odds > 0:
                # Positive American odds: decimal = (american / 100) + 1
                return (odds / 100) + 1
            else:
                # Negative American odds: decimal = (100 / |american|) + 1
                return (100 / abs(odds)) + 1
        except (ValueError, TypeError):
            return 1.0
    
    @staticmethod
    def decimal_to_american(decimal_odds: float) -> int:
        """
        Convert decimal odds to American odds
        
        Args:
            decimal_odds: Decimal odds (e.g., 1.91, 2.50)
            
        Returns:
            American odds (e.g., -110, +150)
        """
        try:
            if decimal_odds is None:
                return 100
                
            odds = float(decimal_odds)
            
            if odds <= 1.0:
                return 0
                
            if odds >= 2.0:
                # decimal >= 2.0: american = (decimal - 1) * 100
                return int((odds - 1) * 100)
            else:
                # decimal < 2.0: american = -100 / (decimal - 1)
                return int(-100 / (odds - 1))
        except (ValueError, TypeError, ZeroDivisionError):
            return 100
    
    @staticmethod
    def implied_probability(decimal_odds: float) -> float:
        """
        Calculate implied probability from decimal odds
        
        Args:
            decimal_odds: Decimal odds
            
        Returns:
            Implied probability as percentage (0-100)
        """
        if decimal_odds <= 0:
            return 0.0
        return (1 / decimal_odds) * 100
    
    @staticmethod
    def probability_to_decimal_odds(probability_percent: float) -> float:
        """
        Convert probability percentage to decimal odds
        
        Args:
            probability_percent: Probability as percentage (0-100)
            
        Returns:
            Decimal odds
        """
        if probability_percent <= 0 or probability_percent >= 100:
            return 1.0
        return 100 / probability_percent
    
    def compute_ev(self, our_fair_odds_decimal: float, market_decimal_odds: float) -> float:
        """
        Compute expected value percentage
        
        Formula: EV% = ((Market_Odds * Our_Win_Probability) - 1) * 100
        Where Our_Win_Probability = 1 / Our_Fair_Odds
        
        Args:
            our_fair_odds_decimal: Our assessment of fair decimal odds
            market_decimal_odds: Market's offered decimal odds
            
        Returns:
            Expected value as percentage (positive = profitable)
        """
        try:
            # Handle invalid inputs
            if our_fair_odds_decimal is None or market_decimal_odds is None:
                return 0.0
                
            # Convert to float if needed
            fair_odds = float(our_fair_odds_decimal)
            market_odds = float(market_decimal_odds)
            
            if fair_odds <= 0 or market_odds <= 0:
                return 0.0
            
            # Our assessed win probability
            our_win_probability = 1 / fair_odds
            
            # Expected value calculation
            # EV = (Payout * Win_Probability) - Stake
            # EV% = ((Market_Odds * Win_Probability) - 1) * 100
            ev_decimal = (market_odds * our_win_probability) - 1
            ev_percent = ev_decimal * 100
            
            self.logger.debug(f"EV Calculation: Fair={fair_odds:.3f}, "
                            f"Market={market_odds:.3f}, "
                            f"Win%={our_win_probability:.3f}, EV%={ev_percent:.2f}")
            
            return round(ev_percent, 2)
            
        except (ValueError, ZeroDivisionError, TypeError) as e:
            self.logger.warning(f"EV computation error: {e}")
            return 0.0
    
    def compute_ev_american(self, our_fair_american: int, market_american: int) -> float:
        """
        Compute EV using American odds format
        
        Args:
            our_fair_american: Our fair assessment in American odds
            market_american: Market odds in American format
            
        Returns:
            Expected value as percentage
        """
        try:
            # Handle invalid inputs
            if our_fair_american is None or market_american is None:
                return 0.0
                
            # Convert to int if needed
            fair_american = int(our_fair_american)
            market_american_int = int(market_american)
            
            fair_decimal = self.american_to_decimal(fair_american)
            market_decimal = self.american_to_decimal(market_american_int)
            return self.compute_ev(fair_decimal, market_decimal)
        except (ValueError, TypeError) as e:
            self.logger.warning(f"American EV computation error: {e}")
            return 0.0
    
    @staticmethod
    @staticmethod
    def classify_ev(ev_percent: float) -> EVTier:
        """
        Classify EV percentage into tiers
        
        Args:
            ev_percent: Expected value percentage
            
        Returns:
            EVTier classification
        """
        if ev_percent <= 0:  # Changed from < 0 to <= 0 to handle error cases
            return EVTier.NEGATIVE
        elif ev_percent < 3:
            return EVTier.LOW
        elif ev_percent < 8:
            return EVTier.MODERATE
        else:
            return EVTier.HIGH
    
    def analyze_opportunity(
        self, 
        our_fair_odds: float, 
        market_odds: float,
        odds_format: str = "decimal"
    ) -> Dict[str, Any]:
        """
        Comprehensive EV analysis of a betting opportunity
        
        Args:
            our_fair_odds: Our fair odds assessment
            market_odds: Market offered odds
            odds_format: "decimal" or "american"
            
        Returns:
            Dictionary with EV analysis results
        """
        try:
            # Convert to decimal first for validation
            if odds_format == "american":
                fair_decimal = self.american_to_decimal(int(our_fair_odds))
                market_decimal = self.american_to_decimal(int(market_odds))
            else:
                fair_decimal = float(our_fair_odds)
                market_decimal = float(market_odds)
                
            # Check for invalid inputs after conversion
            if fair_decimal <= 0 or market_decimal <= 0:
                error_msg = f"Invalid odds after conversion: fair={fair_decimal}, market={market_decimal}"
                self.logger.warning(error_msg)
                return {
                    "ev_percent": 0.0,
                    "ev_tier": EVTier.NEGATIVE.value,
                    "our_fair_odds_decimal": fair_decimal,
                    "market_odds_decimal": market_decimal,
                    "our_implied_probability": 0.0,
                    "market_implied_probability": 0.0,
                    "probability_edge": 0.0,
                    "is_profitable": False,
                    "recommendation": "Negative EV (0.0%)",
                    "error": error_msg
                }
            
            # Compute EV
            ev_percent = self.compute_ev(fair_decimal, market_decimal)
            ev_tier = self.classify_ev(ev_percent)
            
            # Calculate probabilities
            our_implied_prob = self.implied_probability(fair_decimal)
            market_implied_prob = self.implied_probability(market_decimal)
            
            # Edge calculation
            probability_edge = our_implied_prob - market_implied_prob
            
            return {
                "ev_percent": ev_percent,
                "ev_tier": ev_tier.value,
                "our_fair_odds_decimal": fair_decimal,
                "market_odds_decimal": market_decimal,
                "our_implied_probability": round(our_implied_prob, 2),
                "market_implied_probability": round(market_implied_prob, 2),
                "probability_edge": round(probability_edge, 2),
                "is_profitable": ev_percent > 0,
                "recommendation": self._get_recommendation(ev_percent, ev_tier)
            }
            
        except Exception as e:
            self.logger.error(f"EV analysis error: {e}")
            return {
                "ev_percent": 0.0,
                "ev_tier": EVTier.NEGATIVE.value,
                "error": str(e)
            }
    
    @staticmethod
    def _get_recommendation(ev_percent: float, ev_tier: EVTier) -> str:
        """Get betting recommendation based on EV analysis"""
        if ev_tier == EVTier.HIGH:
            return f"Strong bet (+{ev_percent:.1f}% EV)"
        elif ev_tier == EVTier.MODERATE:
            return f"Good bet (+{ev_percent:.1f}% EV)"
        elif ev_tier == EVTier.LOW:
            return f"Small edge (+{ev_percent:.1f}% EV)"
        else:
            return f"Negative EV ({ev_percent:.1f}%)"
    
    def batch_analyze(self, opportunities: list) -> list:
        """
        Analyze multiple opportunities for EV
        
        Args:
            opportunities: List of opportunity dictionaries
            
        Returns:
            List of opportunities enriched with EV data
        """
        enriched_opportunities = []
        
        for opp in opportunities:
            try:
                # Extract odds data (flexible field names)
                our_odds = opp.get("fairOdds") or opp.get("projectedOdds") or opp.get("confidence")
                market_odds = opp.get("odds") or opp.get("marketOdds") or opp.get("bookmakerOdds")
                
                if our_odds and market_odds:
                    # Determine odds format
                    odds_format = "american" if isinstance(market_odds, int) else "decimal"
                    
                    # Analyze opportunity
                    ev_analysis = self.analyze_opportunity(our_odds, market_odds, odds_format)
                    
                    # Enrich opportunity with EV data
                    enriched_opp = {**opp}
                    enriched_opp.update({
                        "evPercent": ev_analysis["ev_percent"],
                        "evTier": ev_analysis["ev_tier"],
                        "isProfitable": ev_analysis["is_profitable"],
                        "recommendation": ev_analysis["recommendation"]
                    })
                    
                    enriched_opportunities.append(enriched_opp)
                else:
                    # No odds data available - add opportunity without EV
                    enriched_opportunities.append(opp)
                    
            except Exception as e:
                self.logger.warning(f"Batch EV analysis error for opportunity: {e}")
                enriched_opportunities.append(opp)
        
        return enriched_opportunities


# Global EV engine instance
ev_engine = EVEngine()


def compute_ev(our_fair_odds_decimal: float, market_decimal_odds: float) -> float:
    """
    Quick EV computation function
    
    Args:
        our_fair_odds_decimal: Our fair odds assessment in decimal format
        market_decimal_odds: Market odds in decimal format
        
    Returns:
        Expected value percentage
    """
    return ev_engine.compute_ev(our_fair_odds_decimal, market_decimal_odds)


def compute_ev_details(projection_prob: float, market_american_odds: int, stake: float = 100.0) -> Dict[str, float]:
    """
    Canonical EV details computation from a probability and market American odds.

    Args:
        projection_prob: Our win probability as a fraction (0.0 - 1.0).
        market_american_odds: Market odds in American format (e.g., -110, +120).
        stake: Stake amount for EV calculation, defaults to 100.0.

    Returns:
        Dict with keys:
          - implied_prob_market: Market implied probability (percent, 0-100)
          - implied_prob_fair: Our implied probability (percent, 0-100)
          - fair_american_odds: Our fair odds in American format (int)
          - edge_pct: Probability edge (implied_prob_fair - implied_prob_market)
          - expected_value_per_100: EV for a $100 stake (or given stake)

    Raises:
        ValueError: If projection_prob is not within [0.0, 1.0].
    """
    # Validate inputs
    if projection_prob is None or not (0.0 <= float(projection_prob) <= 1.0):
        raise ValueError("projection_prob must be between 0.0 and 1.0")

    # Convert inputs
    p = float(projection_prob)
    market_decimal = EVEngine.american_to_decimal(int(market_american_odds))

    # Fair odds from probability
    # If p == 0, fair decimal would be inf; guard by returning neutral values
    if p == 0.0:
        fair_decimal = math.inf
        fair_american = 100  # neutral default
        implied_prob_fair = 0.0
    else:
        fair_decimal = 1.0 / p
        fair_american = EVEngine.decimal_to_american(fair_decimal)
        implied_prob_fair = round(p * 100.0, 2)

    # Market implied probability (percent)
    implied_market = EVEngine.implied_probability(market_decimal)

    # Edge as probability points (our minus market)
    edge_pct = round(implied_prob_fair - round(implied_market, 2), 2)

    # Expected value per stake using decimal odds payout model
    # EV = p * profit_if_win + (1 - p) * (-stake)
    profit_if_win = (market_decimal - 1.0) * stake
    expected_value = round(p * profit_if_win - (1.0 - p) * stake, 2)

    return {
        "implied_prob_market": round(implied_market, 2),
        "implied_prob_fair": implied_prob_fair,
        "fair_american_odds": int(fair_american),
        "edge_pct": edge_pct,
        "expected_value_per_100": expected_value if stake == 100.0 else round(expected_value * (100.0 / stake), 2),
    }


def classify_ev(ev_percent: float) -> str:
    """
    Quick EV classification function
    
    Args:
        ev_percent: Expected value percentage
        
    Returns:
        EV tier as string
    """
    return ev_engine.classify_ev(ev_percent).value


# Convenience functions for common use cases
def american_to_decimal(american_odds: int) -> float:
    """Convert American odds to decimal"""
    return EVEngine.american_to_decimal(american_odds)


def decimal_to_american(decimal_odds: float) -> int:
    """Convert decimal odds to American"""
    return EVEngine.decimal_to_american(decimal_odds)


def implied_probability(decimal_odds: float) -> float:
    """Calculate implied probability from decimal odds"""
    return EVEngine.implied_probability(decimal_odds)