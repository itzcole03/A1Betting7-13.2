"""
MLB Valuation Engine - Section 3 Implementation

This module implements MLB-specific valuation nuances and edge detection logic:
- Half-integer line adjustments for baseball props
- Binary prop handling with binomial probability calculations  
- Payout normalization specific to baseball markets
- Contextual factors (ballpark, weather, matchups)
"""

import logging
import math
from dataclasses import dataclass
from enum import Enum
from typing import Dict, Any, Optional, List, Tuple

logger = logging.getLogger(__name__)


class MLBPropCategory(Enum):
    """MLB-specific prop categories for valuation"""
    BINARY_OUTCOME = "binary_outcome"  # Hits, Home Runs, RBI
    COUNTING_STAT = "counting_stat"    # Strikeouts, Walks, Stolen Bases  
    CONTINUOUS_STAT = "continuous_stat" # Innings Pitched, ERA, WHIP
    TEAM_TOTAL = "team_total"          # Team runs, hits, total bases


class LineType(Enum):
    """Types of betting lines"""
    HALF_INTEGER = "half_integer"  # 1.5, 2.5, 6.5, etc.
    INTEGER = "integer"            # 1, 2, 6, etc.  
    FRACTIONAL = "fractional"      # 5.1 innings (5⅓), etc.


@dataclass
class MLBMarketContext:
    """Contextual factors affecting MLB prop valuation"""
    ballpark: Optional[str] = None
    weather_conditions: Optional[str] = None
    pitcher_handedness: Optional[str] = None  # "L", "R"
    batter_handedness: Optional[str] = None   # "L", "R", "S" (switch)
    home_away: Optional[str] = None           # "home", "away"
    game_situation: Optional[str] = None      # "day_game", "night_game"
    recent_form: Optional[Dict[str, float]] = None  # Recent performance metrics


@dataclass
class PayoutStructure:
    """Represents betting market payout structure"""
    over_odds: float      # American odds for over bet (+110, -120, etc.)
    under_odds: float     # American odds for under bet
    line: float           # The line/threshold
    vig_percentage: float # Sportsbook vig/juice percentage


class MLBValuationEngine:
    """
    Advanced MLB-specific valuation engine with nuanced edge detection
    
    Section 3: Valuation & Edge Detection Nuance for MLB
    """
    
    def __init__(self):
        self.name = "mlb_valuation_engine"
        self.version = "1.0"
        
        # MLB-specific confidence thresholds by prop category and line type
        self.confidence_thresholds = {
            MLBPropCategory.BINARY_OUTCOME: {
                LineType.HALF_INTEGER: 0.68,  # Higher threshold for half-lines
                LineType.INTEGER: 0.62,       # Standard for integer lines
                LineType.FRACTIONAL: 0.65     # Medium threshold for fractional
            },
            MLBPropCategory.COUNTING_STAT: {
                LineType.HALF_INTEGER: 0.65,
                LineType.INTEGER: 0.60,
                LineType.FRACTIONAL: 0.62
            },
            MLBPropCategory.CONTINUOUS_STAT: {
                LineType.HALF_INTEGER: 0.58,  # Lower for continuous variables
                LineType.INTEGER: 0.55,
                LineType.FRACTIONAL: 0.60     # Higher for fractional innings
            },
            MLBPropCategory.TEAM_TOTAL: {
                LineType.HALF_INTEGER: 0.63,
                LineType.INTEGER: 0.58,
                LineType.FRACTIONAL: 0.60
            }
        }
        
        logger.info("MLB Valuation Engine initialized")
    
    async def evaluate_prop_value(
        self,
        *,
        prediction: Dict[str, Any],
        market_line: float,
        payout_structure: PayoutStructure,
        prop_type: str,
        market_context: Optional[MLBMarketContext] = None
    ) -> Dict[str, Any]:
        """
        Comprehensive MLB prop value evaluation
        
        Args:
            prediction: Model prediction with distribution info
            market_line: Betting line/threshold
            payout_structure: Market odds and vig info
            prop_type: Type of MLB prop
            market_context: Contextual factors
            
        Returns:
            dict: Comprehensive valuation analysis
        """
        try:
            logger.debug(f"Evaluating MLB prop value: {prop_type} line={market_line}")
            
            # Step 1: Classify prop and line type
            prop_category = self._classify_prop_category(prop_type)
            line_type = self._classify_line_type(market_line)
            
            # Step 2: Calculate base edge with distribution-specific logic
            base_edge = await self._calculate_base_edge(
                prediction, market_line, prop_category
            )
            
            # Step 3: Apply MLB-specific adjustments
            adjusted_edge = self._apply_mlb_adjustments(
                base_edge, prop_category, line_type, market_context
            )
            
            # Step 4: Normalize for payout structure
            normalized_edge = self._normalize_for_payout(
                adjusted_edge, payout_structure
            )
            
            # Step 5: Determine final edge assessment
            edge_assessment = self._assess_final_edge(
                normalized_edge, prop_category, line_type
            )
            
            # Step 6: Calculate expected value
            expected_value = self._calculate_expected_value(
                normalized_edge, payout_structure
            )
            
            return {
                "prop_type": prop_type,
                "prop_category": prop_category.value,
                "line_type": line_type.value,
                "market_line": market_line,
                "base_edge": base_edge,
                "mlb_adjusted_edge": adjusted_edge,
                "payout_normalized_edge": normalized_edge,
                "edge_assessment": edge_assessment,
                "expected_value": expected_value,
                "market_context_applied": market_context is not None,
                "valuation_timestamp": self._get_timestamp()
            }
            
        except Exception as e:
            logger.error(f"Error in MLB prop valuation: {e}")
            return {
                "error": str(e),
                "prop_type": prop_type,
                "market_line": market_line,
                "success": False
            }
    
    def _classify_prop_category(self, prop_type: str) -> MLBPropCategory:
        """Classify MLB prop into valuation category"""
        prop_upper = prop_type.upper()
        
        if prop_upper in ["HITS", "HOME_RUNS", "RBI", "RUNS"]:
            return MLBPropCategory.BINARY_OUTCOME
        elif prop_upper in ["STRIKEOUTS_PITCHER", "WALKS", "STOLEN_BASES", "OUTS_RECORDED"]:
            return MLBPropCategory.COUNTING_STAT
        elif prop_upper in ["INNINGS_PITCHED", "ERA", "WHIP"]:
            return MLBPropCategory.CONTINUOUS_STAT
        elif prop_upper in ["TEAM_RUNS", "TEAM_HITS", "TOTAL_BASES"]:
            return MLBPropCategory.TEAM_TOTAL
        else:
            return MLBPropCategory.COUNTING_STAT  # Default fallback
    
    def _classify_line_type(self, line: float) -> LineType:
        """Classify betting line type"""
        # Check if it's a half-integer (1.5, 2.5, etc.)
        if abs(line - round(line)) == 0.5:
            return LineType.HALF_INTEGER
        
        # Check if it's fractional innings (5.1, 6.2, etc.)
        fractional_part = line - int(line)
        if fractional_part in [0.1, 0.2]:  # Baseball fractional innings
            return LineType.FRACTIONAL
        
        # Otherwise it's an integer line
        return LineType.INTEGER
    
    async def _calculate_base_edge(
        self, 
        prediction: Dict[str, Any], 
        market_line: float,
        prop_category: MLBPropCategory
    ) -> Dict[str, Any]:
        """Calculate base edge using distribution-specific logic"""
        
        pred_mean = prediction.get("mean", 0)
        pred_variance = prediction.get("variance", 0)
        distribution_family = prediction.get("distribution_family", "NORMAL")
        
        # Raw edge calculation
        edge_raw = pred_mean - market_line
        edge_percentage = (edge_raw / market_line * 100) if market_line > 0 else 0
        
        # Calculate probability of over using appropriate distribution
        if distribution_family == "BINOMIAL":
            prob_over = self._calculate_binomial_probability(
                prediction, market_line
            )
        elif distribution_family in ["POISSON", "MLB_POISSON"]:
            prob_over = self._calculate_poisson_probability(
                pred_mean, market_line
            )
        else:  # NORMAL or MLB_NORMAL
            prob_over = self._calculate_normal_probability(
                pred_mean, pred_variance, market_line
            )
        
        return {
            "edge_raw": edge_raw,
            "edge_percentage": edge_percentage, 
            "probability_over": prob_over,
            "probability_under": 1 - prob_over,
            "distribution_used": distribution_family,
            "confidence": prob_over if edge_raw > 0 else (1 - prob_over)
        }
    
    def _calculate_binomial_probability(self, prediction: Dict[str, Any], line: float) -> float:
        """Calculate probability for binomial distribution"""
        binomial_params = prediction.get("binomial_params", {})
        n_trials = binomial_params.get("n", 4)
        success_prob = binomial_params.get("p", 0.25)
        
        try:
            from scipy.stats import binom
            return 1 - binom.cdf(int(line), n_trials, success_prob)
        except ImportError:
            # Fallback: Normal approximation to binomial
            mean = n_trials * success_prob
            variance = n_trials * success_prob * (1 - success_prob)
            return self._calculate_normal_probability(mean, variance, line)
    
    def _calculate_poisson_probability(self, lambda_param: float, line: float) -> float:
        """Calculate probability for Poisson distribution"""
        try:
            from scipy.stats import poisson
            return 1 - poisson.cdf(int(line), lambda_param)
        except ImportError:
            # Fallback: Normal approximation for large lambda
            if lambda_param > 10:
                return self._calculate_normal_probability(lambda_param, lambda_param, line)
            else:
                # Simple heuristic for small lambda
                return max(0, min(1, (lambda_param - line) / lambda_param + 0.5))
    
    def _calculate_normal_probability(self, mean: float, variance: float, line: float) -> float:
        """Calculate probability for normal distribution"""
        if variance <= 0:
            return 0.5
        
        std_dev = math.sqrt(variance)
        z_score = (line - mean) / std_dev
        
        # Using error function approximation
        try:
            from scipy.stats import norm
            return 1 - norm.cdf(z_score)
        except ImportError:
            # Fallback: Error function approximation
            return 0.5 * (1 - math.erf(z_score / math.sqrt(2)))
    
    def _apply_mlb_adjustments(
        self,
        base_edge: Dict[str, Any], 
        prop_category: MLBPropCategory,
        line_type: LineType,
        market_context: Optional[MLBMarketContext]
    ) -> Dict[str, Any]:
        """Apply MLB-specific adjustments to base edge calculation"""
        
        adjusted_edge = base_edge.copy()
        adjustments_applied = []
        
        # 1. Half-integer line adjustment
        if line_type == LineType.HALF_INTEGER:
            # Half-integer lines require higher confidence due to no push possibility
            confidence_boost = 0.02  # 2% confidence boost required
            adjusted_edge["confidence"] = base_edge["confidence"] + confidence_boost
            adjustments_applied.append("half_integer_boost")
        
        # 2. Binary prop adjustments
        if prop_category == MLBPropCategory.BINARY_OUTCOME:
            # Binary outcomes are more predictable in MLB
            if base_edge["probability_over"] > 0.7 or base_edge["probability_over"] < 0.3:
                # Strong predictions get slight confidence boost
                adjusted_edge["confidence"] *= 1.05
                adjustments_applied.append("binary_strong_prediction_boost")
        
        # 3. Market context adjustments
        if market_context:
            context_adjustment = self._calculate_context_adjustment(market_context)
            adjusted_edge["confidence"] *= context_adjustment
            adjusted_edge["context_adjustment_factor"] = context_adjustment
            adjustments_applied.append("market_context")
        
        # 4. Ballpark factor adjustment (if available)
        if market_context and market_context.ballpark:
            ballpark_factor = self._get_ballpark_factor(
                market_context.ballpark, 
                prop_category
            )
            adjusted_edge["edge_raw"] *= ballpark_factor
            adjusted_edge["edge_percentage"] *= ballpark_factor
            adjustments_applied.append("ballpark_factor")
        
        adjusted_edge["mlb_adjustments_applied"] = adjustments_applied
        return adjusted_edge
    
    def _calculate_context_adjustment(self, context: MLBMarketContext) -> float:
        """Calculate adjustment factor based on market context"""
        adjustment_factor = 1.0
        
        # Pitcher vs batter handedness matchup
        if context.pitcher_handedness and context.batter_handedness:
            if context.pitcher_handedness != context.batter_handedness:
                # Opposite handedness = slight advantage to batter
                adjustment_factor *= 1.02
            else:
                # Same handedness = slight advantage to pitcher
                adjustment_factor *= 0.98
        
        # Home/away adjustment
        if context.home_away == "home":
            adjustment_factor *= 1.01  # Slight home field advantage
        elif context.home_away == "away":
            adjustment_factor *= 0.99  # Slight road disadvantage
        
        # Weather conditions
        if context.weather_conditions:
            if "wind_out" in context.weather_conditions.lower():
                # Wind blowing out favors offense
                adjustment_factor *= 1.03
            elif "wind_in" in context.weather_conditions.lower():
                # Wind blowing in favors pitching
                adjustment_factor *= 0.97
        
        return max(0.9, min(1.1, adjustment_factor))  # Clamp between 0.9 and 1.1
    
    def _get_ballpark_factor(self, ballpark: str, prop_category: MLBPropCategory) -> float:
        """Get ballpark adjustment factor"""
        # Simplified ballpark factors (in production, this would be from a database)
        offensive_ballparks = ["coors_field", "yankee_stadium", "fenway_park"]
        pitcher_friendly = ["petco_park", "marlins_park", "tropicana_field"]
        
        if prop_category in [MLBPropCategory.BINARY_OUTCOME, MLBPropCategory.TEAM_TOTAL]:
            if ballpark.lower() in offensive_ballparks:
                return 1.05  # 5% boost to offensive props
            elif ballpark.lower() in pitcher_friendly:
                return 0.95  # 5% reduction for offensive props
        
        elif prop_category == MLBPropCategory.COUNTING_STAT:
            # Pitching stats benefit from pitcher-friendly parks
            if ballpark.lower() in pitcher_friendly:
                return 1.05
            elif ballpark.lower() in offensive_ballparks:
                return 0.95
        
        return 1.0  # No adjustment for unknown ballparks
    
    def _normalize_for_payout(
        self, 
        adjusted_edge: Dict[str, Any], 
        payout_structure: PayoutStructure
    ) -> Dict[str, Any]:
        """Normalize edge calculation for actual payout structure"""
        
        normalized_edge = adjusted_edge.copy()
        
        # Convert American odds to decimal
        over_decimal = self._american_to_decimal_odds(payout_structure.over_odds)
        under_decimal = self._american_to_decimal_odds(payout_structure.under_odds)
        
        # Calculate implied probabilities
        over_implied_prob = 1 / over_decimal
        under_implied_prob = 1 / under_decimal
        
        # Calculate true probabilities (removing vig)
        total_implied = over_implied_prob + under_implied_prob
        true_over_prob = over_implied_prob / total_implied
        true_under_prob = under_implied_prob / total_implied
        
        # Calculate fair value based on our prediction
        our_over_prob = adjusted_edge["probability_over"]
        our_under_prob = 1 - our_over_prob
        
        # Expected value calculations
        over_ev = (our_over_prob * (over_decimal - 1)) - (our_under_prob * 1)
        under_ev = (our_under_prob * (under_decimal - 1)) - (our_over_prob * 1)
        
        # Add payout-normalized metrics
        normalized_edge.update({
            "over_implied_probability": over_implied_prob,
            "under_implied_probability": under_implied_prob,
            "true_over_probability": true_over_prob,
            "true_under_probability": true_under_prob,
            "over_expected_value": over_ev,
            "under_expected_value": under_ev,
            "vig_percentage": payout_structure.vig_percentage,
            "best_bet_side": "over" if over_ev > under_ev else "under",
            "max_expected_value": max(over_ev, under_ev)
        })
        
        return normalized_edge
    
    def _american_to_decimal_odds(self, american_odds: float) -> float:
        """Convert American odds to decimal odds"""
        if american_odds > 0:
            return (american_odds / 100) + 1
        else:
            return (100 / abs(american_odds)) + 1
    
    def _assess_final_edge(
        self, 
        normalized_edge: Dict[str, Any], 
        prop_category: MLBPropCategory,
        line_type: LineType
    ) -> Dict[str, Any]:
        """Make final edge assessment based on all factors"""
        
        confidence = normalized_edge.get("confidence", 0)
        max_ev = normalized_edge.get("max_expected_value", 0)
        
        # Get category and line-type specific threshold
        threshold = self.confidence_thresholds[prop_category][line_type]
        
        # Determine if we have a betting edge
        has_edge = confidence > threshold and max_ev > 0.02  # 2% minimum EV
        
        # Classify edge strength
        if max_ev > 0.15:  # 15%+ EV
            edge_strength = "STRONG"
        elif max_ev > 0.08:  # 8%+ EV
            edge_strength = "MODERATE"
        elif max_ev > 0.02:  # 2%+ EV
            edge_strength = "WEAK"
        else:
            edge_strength = "NO_EDGE"
        
        # Calculate risk assessment
        confidence_margin = confidence - threshold
        risk_level = "LOW" if confidence_margin > 0.1 else ("MEDIUM" if confidence_margin > 0.05 else "HIGH")
        
        return {
            "has_edge": has_edge,
            "edge_strength": edge_strength,
            "risk_level": risk_level,
            "confidence_vs_threshold": confidence_margin,
            "threshold_used": threshold,
            "minimum_ev_met": max_ev > 0.02,
            "recommended_action": normalized_edge["best_bet_side"] if has_edge else "NO_BET"
        }
    
    def _calculate_expected_value(
        self, 
        normalized_edge: Dict[str, Any], 
        payout_structure: PayoutStructure
    ) -> Dict[str, Any]:
        """Calculate detailed expected value analysis"""
        
        max_ev = normalized_edge.get("max_expected_value", 0)
        best_side = normalized_edge.get("best_bet_side", "over")
        
        # Calculate Kelly Criterion bet size
        if best_side == "over":
            win_prob = normalized_edge["probability_over"]
            decimal_odds = self._american_to_decimal_odds(payout_structure.over_odds)
        else:
            win_prob = normalized_edge["probability_under"]
            decimal_odds = self._american_to_decimal_odds(payout_structure.under_odds)
        
        kelly_fraction = self._calculate_kelly_fraction(win_prob, decimal_odds)
        
        return {
            "max_expected_value": max_ev,
            "best_bet_side": best_side,
            "kelly_fraction": kelly_fraction,
            "recommended_stake": min(kelly_fraction, 0.05),  # Cap at 5% of bankroll
            "profit_per_dollar": max_ev,
            "long_term_roi": max_ev * 100  # As percentage
        }
    
    def _calculate_kelly_fraction(self, win_prob: float, decimal_odds: float) -> float:
        """Calculate Kelly Criterion bet fraction"""
        if decimal_odds <= 1.0 or win_prob <= 0:
            return 0.0
        
        # Kelly formula: f = (bp - q) / b
        # where b = decimal_odds - 1, p = win_prob, q = 1 - win_prob
        b = decimal_odds - 1
        p = win_prob
        q = 1 - win_prob
        
        kelly = (b * p - q) / b
        return max(0, kelly)  # Never bet negative amounts
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()
    
    async def health_check(self) -> Dict[str, Any]:
        """Service health check"""
        try:
            # Test key functions
            test_line_type = self._classify_line_type(1.5)
            test_prop_category = self._classify_prop_category("HITS")
            
            return {
                "service": self.name,
                "version": self.version,
                "status": "healthy",
                "capabilities": {
                    "half_integer_handling": test_line_type == LineType.HALF_INTEGER,
                    "binary_prop_support": test_prop_category == MLBPropCategory.BINARY_OUTCOME,
                    "payout_normalization": True,
                    "context_adjustments": True,
                    "kelly_criterion": True
                }
            }
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "service": self.name,
                "version": self.version,
                "status": "degraded",
                "error": str(e)
            }


# Global service instance
mlb_valuation_engine = MLBValuationEngine()