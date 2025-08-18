"""
MLB Binary Prop Handler - Section 3 Implementation

Specialized handling for MLB binary proposition bets with binomial probability calculations.
Binary props include: Hits, Home Runs, RBI, Runs, Stolen Bases, etc.
"""

import logging
import math
from dataclasses import dataclass
from enum import Enum
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)


class BinaryPropType(Enum):
    """MLB Binary Proposition Types"""
    HITS = "hits"
    HOME_RUNS = "home_runs" 
    RBI = "rbi"
    RUNS = "runs"
    STOLEN_BASES = "stolen_bases"
    WALKS = "walks"
    DOUBLES = "doubles"
    TRIPLES = "triples"
    STRIKEOUTS_BATTER = "strikeouts_batter"
    HIT_BY_PITCH = "hit_by_pitch"


@dataclass
class BinaryPropParameters:
    """Parameters for binary prop valuation"""
    attempts: int           # Number of opportunities (at-bats, plate appearances)
    success_rate: float     # Historical success rate (batting avg, HR rate, etc.)
    confidence_interval: float = 0.95  # Statistical confidence level
    sample_size: int = 100  # Historical sample size for success rate
    
    
@dataclass
class BinaryPropResult:
    """Result of binary prop valuation"""
    prop_type: str
    line: float
    probability_over: float
    probability_under: float
    probability_exact: float  # Probability of hitting exactly the line (for integer lines)
    expected_value: float
    confidence: float
    binomial_params: Dict[str, Any]
    edge_analysis: Dict[str, Any]


class MLBBinaryPropHandler:
    """
    Specialized handler for MLB binary proposition bets
    
    Handles props where outcome is binary success/failure over multiple attempts:
    - Hits (success = hit, attempt = at-bat)
    - Home Runs (success = HR, attempt = at-bat or plate appearance)  
    - RBI (success = RBI, attempt = RBI opportunity)
    - Runs (success = run scored, attempt = plate appearance)
    """
    
    def __init__(self):
        self.name = "mlb_binary_prop_handler"
        self.version = "1.0"
        
        # Default attempt counts for different prop types
        self.default_attempts = {
            BinaryPropType.HITS: 4,           # ~4 at-bats per game
            BinaryPropType.HOME_RUNS: 4,      # ~4 at-bats per game
            BinaryPropType.RBI: 3,            # ~3 RBI opportunities per game  
            BinaryPropType.RUNS: 4,           # ~4 plate appearances per game
            BinaryPropType.STOLEN_BASES: 2,   # ~2 steal opportunities per game
            BinaryPropType.WALKS: 4,          # ~4 plate appearances per game
            BinaryPropType.DOUBLES: 4,        # ~4 at-bats per game
            BinaryPropType.TRIPLES: 4,        # ~4 at-bats per game  
            BinaryPropType.STRIKEOUTS_BATTER: 4, # ~4 at-bats per game
            BinaryPropType.HIT_BY_PITCH: 4,   # ~4 plate appearances per game
        }
        
        # Typical success rates for MLB players (these would come from player data)
        self.typical_success_rates = {
            BinaryPropType.HITS: 0.250,       # .250 batting average
            BinaryPropType.HOME_RUNS: 0.050,  # 5% HR rate  
            BinaryPropType.RBI: 0.200,        # 20% RBI rate on opportunities
            BinaryPropType.RUNS: 0.150,       # 15% run scoring rate
            BinaryPropType.STOLEN_BASES: 0.100, # 10% steal rate on opportunities
            BinaryPropType.WALKS: 0.080,      # 8% walk rate
            BinaryPropType.DOUBLES: 0.045,    # 4.5% double rate
            BinaryPropType.TRIPLES: 0.008,    # 0.8% triple rate
            BinaryPropType.STRIKEOUTS_BATTER: 0.220, # 22% K rate
            BinaryPropType.HIT_BY_PITCH: 0.010, # 1% HBP rate
        }
        
        logger.info("MLB Binary Prop Handler initialized")
    
    async def evaluate_binary_prop(
        self,
        *,
        prop_type: str,
        line: float,
        player_data: Dict[str, Any],
        game_context: Optional[Dict[str, Any]] = None
    ) -> BinaryPropResult:
        """
        Evaluate a binary MLB proposition bet
        
        Args:
            prop_type: Type of binary prop (hits, home_runs, etc.)
            line: Betting line/threshold
            player_data: Player performance data
            game_context: Game-specific context
            
        Returns:
            BinaryPropResult: Comprehensive binary prop analysis
        """
        try:
            logger.debug(f"Evaluating binary prop: {prop_type} line={line}")
            
            # Step 1: Parse prop type and parameters
            binary_prop_type = self._parse_prop_type(prop_type)
            prop_params = self._extract_prop_parameters(
                binary_prop_type, player_data, game_context
            )
            
            # Step 2: Calculate binomial probabilities
            probabilities = self._calculate_binomial_probabilities(
                prop_params, line
            )
            
            # Step 3: Assess edge and confidence
            edge_analysis = self._analyze_binary_edge(
                probabilities, prop_params, line
            )
            
            # Step 4: Calculate expected value (placeholder - needs market odds)
            expected_value = self._estimate_expected_value(
                probabilities, edge_analysis
            )
            
            return BinaryPropResult(
                prop_type=prop_type,
                line=line,
                probability_over=probabilities["over"],
                probability_under=probabilities["under"],
                probability_exact=probabilities.get("exact", 0),
                expected_value=expected_value,
                confidence=edge_analysis["confidence"],
                binomial_params={
                    "n": prop_params.attempts,
                    "p": prop_params.success_rate,
                    "confidence_interval": prop_params.confidence_interval
                },
                edge_analysis=edge_analysis
            )
            
        except Exception as e:
            logger.error(f"Error evaluating binary prop: {e}")
            raise
    
    def _parse_prop_type(self, prop_type: str) -> BinaryPropType:
        """Parse prop type string to enum"""
        prop_upper = prop_type.upper().replace("_", " ").replace("-", " ")
        
        if "HIT" in prop_upper and "HOME" not in prop_upper:
            return BinaryPropType.HITS
        elif "HOME" in prop_upper and "RUN" in prop_upper:
            return BinaryPropType.HOME_RUNS
        elif "RBI" in prop_upper:
            return BinaryPropType.RBI
        elif "RUN" in prop_upper and "HOME" not in prop_upper:
            return BinaryPropType.RUNS
        elif "STOLEN" in prop_upper and "BASE" in prop_upper:
            return BinaryPropType.STOLEN_BASES
        elif "WALK" in prop_upper:
            return BinaryPropType.WALKS
        elif "DOUBLE" in prop_upper:
            return BinaryPropType.DOUBLES
        elif "TRIPLE" in prop_upper:
            return BinaryPropType.TRIPLES
        elif "STRIKEOUT" in prop_upper and "BATTER" in prop_upper:
            return BinaryPropType.STRIKEOUTS_BATTER
        elif "HIT BY PITCH" in prop_upper or "HBP" in prop_upper:
            return BinaryPropType.HIT_BY_PITCH
        else:
            # Default to hits if can't determine
            logger.warning(f"Unknown binary prop type: {prop_type}, defaulting to hits")
            return BinaryPropType.HITS
    
    def _extract_prop_parameters(
        self,
        binary_prop_type: BinaryPropType,
        player_data: Dict[str, Any], 
        game_context: Optional[Dict[str, Any]]
    ) -> BinaryPropParameters:
        """Extract binomial parameters for the prop"""
        
        # Get attempts (opportunities) - use player data if available
        attempts = player_data.get("projected_attempts") or \
                  player_data.get("avg_attempts") or \
                  self.default_attempts[binary_prop_type]
        
        # Get success rate from player data
        success_rate = self._get_player_success_rate(binary_prop_type, player_data)
        
        # Apply game context adjustments
        if game_context:
            success_rate = self._adjust_for_game_context(
                success_rate, binary_prop_type, game_context
            )
        
        # Get sample size for confidence calculation
        sample_size = player_data.get("games_played", 100)
        
        return BinaryPropParameters(
            attempts=int(attempts),
            success_rate=success_rate,
            sample_size=sample_size
        )
    
    def _get_player_success_rate(
        self, 
        binary_prop_type: BinaryPropType, 
        player_data: Dict[str, Any]
    ) -> float:
        """Extract player-specific success rate"""
        
        # Map prop type to expected data fields
        rate_field_map = {
            BinaryPropType.HITS: ["batting_average", "avg", "hit_rate"],
            BinaryPropType.HOME_RUNS: ["hr_rate", "home_run_rate", "hr_per_ab"],
            BinaryPropType.RBI: ["rbi_rate", "rbi_per_opportunity", "rbi_rate"],
            BinaryPropType.RUNS: ["runs_rate", "run_rate", "runs_per_pa"],
            BinaryPropType.STOLEN_BASES: ["sb_rate", "steal_rate", "sb_success_rate"],
            BinaryPropType.WALKS: ["walk_rate", "bb_rate", "walk_percentage"],
            BinaryPropType.DOUBLES: ["double_rate", "doubles_per_ab"],
            BinaryPropType.TRIPLES: ["triple_rate", "triples_per_ab"],
            BinaryPropType.STRIKEOUTS_BATTER: ["strikeout_rate", "k_rate"],
            BinaryPropType.HIT_BY_PITCH: ["hbp_rate", "hit_by_pitch_rate"],
        }
        
        possible_fields = rate_field_map[binary_prop_type]
        
        # Try to find the rate in player data
        for field in possible_fields:
            if field in player_data and player_data[field] is not None:
                rate = float(player_data[field])
                # Validate rate is reasonable
                if 0 <= rate <= 1:
                    return rate
        
        # Fallback to typical rate
        typical_rate = self.typical_success_rates[binary_prop_type]
        logger.debug(f"Using typical success rate {typical_rate} for {binary_prop_type}")
        return typical_rate
    
    def _adjust_for_game_context(
        self,
        base_rate: float,
        binary_prop_type: BinaryPropType,
        game_context: Dict[str, Any]
    ) -> float:
        """Adjust success rate based on game context"""
        
        adjusted_rate = base_rate
        
        # Pitcher handedness vs batter handedness
        pitcher_hand = game_context.get("pitcher_handedness", "R")
        batter_hand = game_context.get("batter_handedness", "R") 
        
        if binary_prop_type in [BinaryPropType.HITS, BinaryPropType.HOME_RUNS]:
            if pitcher_hand != batter_hand:
                # Platoon advantage
                adjusted_rate *= 1.08  # 8% boost for favorable matchup
            else:
                # Platoon disadvantage  
                adjusted_rate *= 0.92  # 8% reduction for unfavorable matchup
        
        # Home vs Away
        home_away = game_context.get("home_away", "home")
        if home_away == "home":
            # Slight home field advantage for offensive stats
            if binary_prop_type in [BinaryPropType.HITS, BinaryPropType.HOME_RUNS, 
                                   BinaryPropType.RBI, BinaryPropType.RUNS]:
                adjusted_rate *= 1.02
        
        # Ballpark effects
        ballpark = game_context.get("ballpark")
        if ballpark:
            ballpark_factor = self._get_ballpark_factor(ballpark, binary_prop_type)
            adjusted_rate *= ballpark_factor
        
        # Weather effects
        weather = game_context.get("weather_conditions", "")
        if "wind_out" in weather.lower():
            # Wind blowing out helps offensive stats
            if binary_prop_type in [BinaryPropType.HITS, BinaryPropType.HOME_RUNS]:
                adjusted_rate *= 1.05
        elif "wind_in" in weather.lower():
            # Wind blowing in hurts offensive stats
            if binary_prop_type in [BinaryPropType.HITS, BinaryPropType.HOME_RUNS]:
                adjusted_rate *= 0.95
        
        # Clamp adjusted rate to reasonable bounds
        return max(0.01, min(0.99, adjusted_rate))
    
    def _get_ballpark_factor(self, ballpark: str, binary_prop_type: BinaryPropType) -> float:
        """Get ballpark adjustment factor for binary props"""
        
        # Simplified ballpark factors (would be from comprehensive database)
        hitter_friendly = {
            "coors_field": 1.08,
            "yankee_stadium": 1.05, 
            "fenway_park": 1.04,
            "great_american_ballpark": 1.03
        }
        
        pitcher_friendly = {
            "petco_park": 0.92,
            "marlins_park": 0.95,
            "tropicana_field": 0.94,
            "kauffman_stadium": 0.93
        }
        
        ballpark_key = ballpark.lower().replace(" ", "_")
        
        # Apply factor based on prop type
        if binary_prop_type in [BinaryPropType.HITS, BinaryPropType.HOME_RUNS, 
                               BinaryPropType.RBI, BinaryPropType.RUNS]:
            # Offensive stats benefit from hitter-friendly parks
            if ballpark_key in hitter_friendly:
                return hitter_friendly[ballpark_key]
            elif ballpark_key in pitcher_friendly:
                return pitcher_friendly[ballpark_key]
        
        return 1.0  # No adjustment for unknown ballparks or non-offensive props
    
    def _calculate_binomial_probabilities(
        self,
        prop_params: BinaryPropParameters,
        line: float
    ) -> Dict[str, float]:
        """Calculate binomial probabilities for over/under/exact"""
        
        n = prop_params.attempts
        p = prop_params.success_rate
        
        try:
            from scipy.stats import binom
            
            # P(X > line) = 1 - P(X <= line)
            prob_over = 1 - binom.cdf(int(line), n, p)
            
            # P(X < line) = P(X <= line-1)  
            prob_under = binom.cdf(int(line - 1), n, p)
            
            # P(X = line) for integer lines
            prob_exact = binom.pmf(int(line), n, p) if line == int(line) else 0
            
            return {
                "over": prob_over,
                "under": prob_under, 
                "exact": prob_exact
            }
            
        except ImportError:
            # Fallback: Normal approximation to binomial
            logger.debug("Using normal approximation for binomial probabilities")
            return self._normal_approximation_probabilities(n, p, line)
    
    def _normal_approximation_probabilities(
        self, 
        n: int, 
        p: float, 
        line: float
    ) -> Dict[str, float]:
        """Normal approximation to binomial distribution"""
        
        mean = n * p
        variance = n * p * (1 - p)
        
        if variance <= 0:
            return {"over": 0.5, "under": 0.5, "exact": 0}
        
        std_dev = math.sqrt(variance)
        
        # Continuity correction for discrete to continuous approximation
        z_over = (line + 0.5 - mean) / std_dev  # P(X > line)
        z_under = (line - 0.5 - mean) / std_dev  # P(X < line)
        
        try:
            from scipy.stats import norm
            prob_over = 1 - norm.cdf(z_over)
            prob_under = norm.cdf(z_under)
        except ImportError:
            # Use error function approximation
            prob_over = 0.5 * (1 - math.erf(z_over / math.sqrt(2)))
            prob_under = 0.5 * (1 + math.erf(z_under / math.sqrt(2)))
        
        return {
            "over": prob_over,
            "under": prob_under,
            "exact": 0  # Continuous approximation doesn't give exact probabilities
        }
    
    def _analyze_binary_edge(
        self,
        probabilities: Dict[str, float],
        prop_params: BinaryPropParameters,
        line: float
    ) -> Dict[str, Any]:
        """Analyze edge for binary prop"""
        
        prob_over = probabilities["over"]
        prob_under = probabilities["under"]
        
        # Calculate confidence based on stronger side
        confidence = max(prob_over, prob_under)
        
        # Determine edge direction
        if prob_over > prob_under:
            edge_side = "over"
            edge_probability = prob_over
        else:
            edge_side = "under" 
            edge_probability = prob_under
        
        # Calculate expected result vs line
        expected_result = prop_params.attempts * prop_params.success_rate
        raw_edge = expected_result - line
        
        # Confidence interval for binomial proportion
        confidence_interval = self._calculate_confidence_interval(prop_params)
        
        return {
            "edge_side": edge_side,
            "edge_probability": edge_probability,
            "confidence": confidence,
            "expected_result": expected_result,
            "raw_edge": raw_edge,
            "edge_percentage": (raw_edge / line * 100) if line > 0 else 0,
            "confidence_interval": confidence_interval,
            "sample_size": prop_params.sample_size,
            "statistical_significance": confidence > 0.65  # 65% threshold for binary props
        }
    
    def _calculate_confidence_interval(
        self, 
        prop_params: BinaryPropParameters
    ) -> Dict[str, float]:
        """Calculate confidence interval for success rate estimate"""
        
        p = prop_params.success_rate
        n = prop_params.sample_size
        confidence_level = prop_params.confidence_interval
        
        # Standard error of proportion
        se = math.sqrt((p * (1 - p)) / n)
        
        # Z-score for confidence level (approximation)
        if confidence_level >= 0.99:
            z_score = 2.576
        elif confidence_level >= 0.95:
            z_score = 1.96
        elif confidence_level >= 0.90:
            z_score = 1.645
        else:
            z_score = 1.96  # Default to 95%
        
        margin_of_error = z_score * se
        
        return {
            "lower_bound": max(0, p - margin_of_error),
            "upper_bound": min(1, p + margin_of_error),
            "margin_of_error": margin_of_error,
            "confidence_level": confidence_level
        }
    
    def _estimate_expected_value(
        self,
        probabilities: Dict[str, float], 
        edge_analysis: Dict[str, Any]
    ) -> float:
        """Estimate expected value (simplified without market odds)"""
        
        # Simplified EV calculation - would need actual market odds
        prob_over = probabilities["over"]
        prob_under = probabilities["under"]
        
        # Assume standard -110 odds for both sides
        decimal_odds = 1.909  # -110 in decimal
        
        # EV for over bet
        ev_over = (prob_over * (decimal_odds - 1)) - ((1 - prob_over) * 1)
        
        # EV for under bet  
        ev_under = (prob_under * (decimal_odds - 1)) - ((1 - prob_under) * 1)
        
        return max(ev_over, ev_under)
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check for binary prop handler"""
        try:
            # Test key functionality
            test_params = BinaryPropParameters(
                attempts=4,
                success_rate=0.25
            )
            
            test_probs = self._calculate_binomial_probabilities(test_params, 1.5)
            
            return {
                "service": self.name,
                "version": self.version,
                "status": "healthy",
                "capabilities": {
                    "binomial_calculations": test_probs["over"] > 0,
                    "prop_type_parsing": True,
                    "context_adjustments": True,
                    "confidence_intervals": True
                }
            }
            
        except Exception as e:
            logger.error(f"Binary prop handler health check failed: {e}")
            return {
                "service": self.name,
                "version": self.version, 
                "status": "degraded",
                "error": str(e)
            }


# Global service instance
mlb_binary_prop_handler = MLBBinaryPropHandler()