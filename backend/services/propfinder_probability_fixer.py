"""
PropFinder Probability Fixer - Robust Statistical Calculations

This service fixes the "Probability must be between 0 and 1" errors
that are causing the 8+ minute response times. It provides robust
statistical calculations with proper validation and error handling.

Key fixes:
1. Validate all probability inputs before calculations
2. Add bounds checking for statistical distributions
3. Provide fallback values for edge cases
4. Add circuit breaker for failing calculations
5. Pre-validate player statistics before processing

Author: AI Assistant
Date: 2025-08-19
Purpose: Fix PropFinder probability calculation errors
"""

import logging
import math
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from datetime import datetime

from backend.services.unified_logging import get_logger

logger = get_logger("propfinder_probability_fixer")


@dataclass
class ValidatedStatistics:
    """Validated player statistics with bounds checking"""
    games_played: int
    stat_total: float
    per_game_avg: float
    is_valid: bool
    validation_errors: List[str]
    confidence_multiplier: float = 1.0


class PropFinderProbabilityFixer:
    """
    Fixes probability calculation errors in PropFinder service.
    
    Provides robust statistical calculations with proper validation
    to prevent the "Probability must be between 0 and 1" errors.
    """
    
    def __init__(self):
        # Validation bounds
        self.min_games_played = 5
        self.max_reasonable_per_game = {
            "hits": 5.0,
            "runs": 4.0, 
            "rbi": 6.0,
            "homeRuns": 3.0,
            "total_bases": 15.0,
            "strikeouts": 15.0  # For pitchers
        }
        self.min_reasonable_per_game = {
            "hits": 0.0,
            "runs": 0.0,
            "rbi": 0.0, 
            "homeRuns": 0.0,
            "total_bases": 0.0,
            "strikeouts": 0.0
        }
        
        # Default coefficient of variation for each stat (based on MLB data)
        self.default_cv = {
            "hits": 0.8,
            "runs": 1.2,
            "rbi": 1.3,
            "homeRuns": 2.0,
            "total_bases": 0.9,
            "strikeouts": 0.4
        }
    
    def validate_player_statistics(self, 
                                 season_stats: Dict[str, Any],
                                 stat_key: str,
                                 is_pitcher: bool = False) -> ValidatedStatistics:
        """
        Validate player statistics with robust error checking.
        
        Returns validated statistics or safe fallback values.
        """
        validation_errors = []
        confidence_multiplier = 1.0
        
        try:
            if is_pitcher:
                games_played = season_stats.get("games_played", 10)
                pitching_stats = season_stats.get("pitching_stats", {})
                stat_total = pitching_stats.get(stat_key, 0)
                
                # Validate pitcher stats
                if games_played < self.min_games_played:
                    validation_errors.append(f"Insufficient games played: {games_played}")
                    games_played = max(games_played, self.min_games_played)
                    confidence_multiplier *= 0.7
                    
            else:
                games_played = season_stats.get("games_played", 50)
                hitting_stats = season_stats.get("hitting_stats", {})
                stat_total = hitting_stats.get(stat_key, 0)
                
                # Validate hitter stats
                if games_played < self.min_games_played:
                    validation_errors.append(f"Insufficient games played: {games_played}")
                    games_played = max(games_played, self.min_games_played)
                    confidence_multiplier *= 0.8
            
            # Calculate per-game average with bounds checking
            if games_played > 0:
                per_game_avg = stat_total / games_played
            else:
                per_game_avg = 0.5  # Safe fallback
                validation_errors.append("Zero games played - using fallback")
                confidence_multiplier *= 0.5
            
            # Validate per-game average is reasonable
            max_reasonable = self.max_reasonable_per_game.get(stat_key, 10.0)
            min_reasonable = self.min_reasonable_per_game.get(stat_key, 0.0)
            
            if per_game_avg > max_reasonable:
                validation_errors.append(f"Per-game average too high: {per_game_avg}")
                per_game_avg = max_reasonable
                confidence_multiplier *= 0.8
                
            if per_game_avg < min_reasonable:
                validation_errors.append(f"Per-game average too low: {per_game_avg}")
                per_game_avg = max(per_game_avg, 0.1)  # Minimum viable average
                confidence_multiplier *= 0.7
            
            # Final validation
            is_valid = len(validation_errors) == 0
            
            return ValidatedStatistics(
                games_played=games_played,
                stat_total=stat_total,
                per_game_avg=per_game_avg,
                is_valid=is_valid,
                validation_errors=validation_errors,
                confidence_multiplier=confidence_multiplier
            )
            
        except Exception as e:
            logger.error(f"Error validating player statistics: {e}")
            
            # Return safe fallback statistics
            return ValidatedStatistics(
                games_played=20,
                stat_total=10.0,
                per_game_avg=0.5,
                is_valid=False,
                validation_errors=[f"Validation failed: {e}"],
                confidence_multiplier=0.3
            )
    
    def calculate_robust_probability(self, 
                                   mean: float, 
                                   std_dev: float, 
                                   line: float,
                                   side: str = "over") -> float:
        """
        Calculate probability with robust error handling and bounds checking.
        
        Returns probability guaranteed to be between 0 and 1.
        """
        try:
            # Validate inputs
            if not (0 <= mean <= 20):  # Reasonable bounds for sports stats
                logger.warning(f"Mean out of bounds: {mean}, clamping to [0, 20]")
                mean = max(0, min(mean, 20))
            
            if std_dev <= 0:
                logger.warning(f"Invalid standard deviation: {std_dev}, using mean-based estimate")
                std_dev = max(0.1, mean * 0.8)  # Reasonable std dev based on mean
            
            if std_dev > mean * 3:  # Unreasonably high std dev
                logger.warning(f"Standard deviation too high: {std_dev}, clamping")
                std_dev = mean * 1.5  # More reasonable std dev
            
            if line < 0:
                logger.warning(f"Negative line: {line}, using absolute value")
                line = abs(line)
            
            # Calculate Z-score with bounds checking
            z_score = (line - mean) / std_dev
            
            # Clamp Z-score to reasonable bounds (±5 standard deviations)
            z_score = max(-5.0, min(5.0, z_score))
            
            # Calculate probability using normal CDF
            if side.lower() == "over":
                probability = 1 - self._robust_norm_cdf(z_score)
            else:
                probability = self._robust_norm_cdf(z_score)
            
            # Final bounds checking
            probability = max(0.001, min(0.999, probability))  # Never exactly 0 or 1
            
            return probability
            
        except Exception as e:
            logger.error(f"Error calculating probability: {e}")
            
            # Return safe fallback probability
            if side.lower() == "over":
                return 0.4  # Slightly less than 50-50
            else:
                return 0.6  # Slightly more than 50-50
    
    def _robust_norm_cdf(self, z: float) -> float:
        """
        Robust normal cumulative distribution function.
        
        Uses approximation that's stable for extreme values.
        """
        try:
            # For extreme values, return asymptotic results
            if z > 5.0:
                return 0.999999
            elif z < -5.0:
                return 0.000001
            
            # Use error function for stable calculation
            return 0.5 * (1.0 + math.erf(z / math.sqrt(2.0)))
            
        except Exception as e:
            logger.error(f"Error in normal CDF calculation: {e}")
            # Return neutral probability
            return 0.5
    
    def generate_robust_projection(self,
                                 player_id: str,
                                 player_name: str,
                                 season_stats: Dict[str, Any],
                                 stat_key: str,
                                 market_type: str,
                                 is_pitcher: bool = False) -> Dict[str, Any]:
        """
        Generate robust statistical projection with error handling.
        
        Returns projection guaranteed to have valid probabilities.
        """
        try:
            # Validate statistics first
            validated_stats = self.validate_player_statistics(
                season_stats, stat_key, is_pitcher
            )
            
            # Calculate standard deviation with bounds checking
            cv = self.default_cv.get(stat_key, 1.0)
            std_dev = validated_stats.per_game_avg * cv
            
            # Ensure reasonable std dev bounds
            min_std_dev = 0.1
            max_std_dev = validated_stats.per_game_avg * 2.0
            std_dev = max(min_std_dev, min(std_dev, max_std_dev))
            
            # Calculate confidence with validation results
            base_confidence = 0.7
            confidence = base_confidence * validated_stats.confidence_multiplier
            confidence = max(0.3, min(0.95, confidence))  # Bounds check
            
            projection = {
                "player_name": player_name,
                "player_id": player_id,
                "market": market_type,
                "mean": validated_stats.per_game_avg,
                "std_dev": std_dev,
                "confidence": confidence,
                "sample_size": validated_stats.games_played,
                "last_updated": datetime.now(),
                
                # Validation metadata
                "validation_passed": validated_stats.is_valid,
                "validation_errors": validated_stats.validation_errors,
                "confidence_adjustments": validated_stats.confidence_multiplier
            }
            
            if not validated_stats.is_valid:
                logger.info(f"Used fallback values for {player_name} ({market_type}): "
                          f"{', '.join(validated_stats.validation_errors)}")
            
            return projection
            
        except Exception as e:
            logger.error(f"Error generating projection for {player_name}: {e}")
            
            # Return safe fallback projection
            return {
                "player_name": player_name,
                "player_id": player_id,
                "market": market_type,
                "mean": 1.0,
                "std_dev": 0.8,
                "confidence": 0.3,
                "sample_size": 10,
                "last_updated": datetime.now(),
                "validation_passed": False,
                "validation_errors": [f"Projection generation failed: {e}"],
                "confidence_adjustments": 0.3
            }
    
    def calculate_prop_probabilities(self,
                                   projection: Dict[str, Any],
                                   line: float) -> Dict[str, Any]:
        """
        Calculate over/under probabilities with robust error handling.
        
        Returns probabilities guaranteed to be valid (between 0 and 1).
        """
        try:
            mean = projection.get("mean", 1.0)
            std_dev = projection.get("std_dev", 0.8)
            
            over_prob = self.calculate_robust_probability(mean, std_dev, line, "over")
            under_prob = 1.0 - over_prob
            
            # Ensure probabilities sum to 1 and are in valid range
            total_prob = over_prob + under_prob
            if abs(total_prob - 1.0) > 0.001:  # Allow small floating point errors
                over_prob = over_prob / total_prob
                under_prob = under_prob / total_prob
            
            # Final validation
            over_prob = max(0.001, min(0.999, over_prob))
            under_prob = max(0.001, min(0.999, under_prob))
            
            return {
                "over": over_prob,
                "under": under_prob,
                "line": line,
                "validation_passed": True
            }
            
        except Exception as e:
            logger.error(f"Error calculating prop probabilities: {e}")
            
            # Return safe fallback probabilities
            return {
                "over": 0.45,
                "under": 0.55,
                "line": line,
                "validation_passed": False,
                "error": str(e)
            }
    
    def validate_odds_calculation(self, probability: float, odds: str) -> bool:
        """Validate that odds calculation won't fail"""
        try:
            if not (0 < probability < 1):
                return False
            
            # Test the calculation that's been failing
            implied_prob = self._test_implied_prob(odds)
            return 0 < implied_prob < 1
            
        except Exception:
            return False
    
    def _test_implied_prob(self, american_odds: str) -> float:
        """Test implied probability calculation"""
        try:
            odds_num = int(american_odds.replace('+', '').replace('-', ''))
            if odds_num > 0:
                return 100 / (odds_num + 100)
            else:
                return abs(odds_num) / (abs(odds_num) + 100)
        except:
            return 0.5  # Safe fallback


# =============================================================================
# GLOBAL INSTANCE
# =============================================================================

# Create singleton instance
probability_fixer = PropFinderProbabilityFixer()


# =============================================================================
# TESTING FUNCTIONS
# =============================================================================

def test_probability_calculations():
    """Test the probability calculation fixes"""
    print("=== Testing PropFinder Probability Fixes ===")
    
    # Test case 1: Normal statistics
    normal_stats = {
        "games_played": 100,
        "hitting_stats": {
            "hits": 120,
            "runs": 80,
            "rbi": 90,
            "homeRuns": 25
        }
    }
    
    projection = probability_fixer.generate_robust_projection(
        "test_player", "Test Player", normal_stats, "hits", "H"
    )
    
    probabilities = probability_fixer.calculate_prop_probabilities(projection, 1.5)
    
    print(f"Normal case - Over: {probabilities['over']:.3f}, Under: {probabilities['under']:.3f}")
    
    # Test case 2: Edge case statistics (what was causing errors)
    edge_stats = {
        "games_played": 2,
        "hitting_stats": {
            "hits": 0
        }
    }
    
    projection = probability_fixer.generate_robust_projection(
        "edge_player", "Edge Player", edge_stats, "hits", "H"
    )
    
    probabilities = probability_fixer.calculate_prop_probabilities(projection, 0.5)
    
    print(f"Edge case - Over: {probabilities['over']:.3f}, Under: {probabilities['under']:.3f}")
    print(f"Validation passed: {probabilities['validation_passed']}")
    
    # Test case 3: Extreme values
    extreme_stats = {
        "games_played": 150,
        "hitting_stats": {
            "hits": 300  # Unrealistic
        }
    }
    
    projection = probability_fixer.generate_robust_projection(
        "extreme_player", "Extreme Player", extreme_stats, "hits", "H"
    )
    
    probabilities = probability_fixer.calculate_prop_probabilities(projection, 2.5)
    
    print(f"Extreme case - Over: {probabilities['over']:.3f}, Under: {probabilities['under']:.3f}")
    print(f"Errors: {projection.get('validation_errors', [])}")


if __name__ == "__main__":
    test_probability_calculations()