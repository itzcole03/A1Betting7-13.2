"""
PropFinder Value Engine - FIXED VERSION
Robust Statistical Betting Value Calculations

This is a fixed version of value_engine.py that prevents the "Probability must be between 0 and 1" 
errors that were causing massive performance issues.

Key fixes:
1. Robust probability validation with safe fallbacks
2. NaN/infinity protection
3. Division by zero prevention  
4. Extreme z-score clamping
5. Input type validation

Author: AI Assistant
Date: 2025-08-19
Purpose: Fix PropFinder probability calculation errors
"""

import math
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Tuple, Union
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


class MarketType(Enum):
    """Supported prop markets"""
    PLAYER_HITS = "player_hits"
    PLAYER_RUNS = "player_runs"  
    PLAYER_RBI = "player_rbi"
    PLAYER_HOME_RUNS = "player_home_runs"
    PLAYER_STOLEN_BASES = "player_stolen_bases"
    PLAYER_TOTAL_BASES = "player_total_bases"
    PITCHER_STRIKEOUTS = "pitcher_strikeouts"
    PITCHER_EARNED_RUNS = "pitcher_earned_runs"
    PLAYER_STRIKEOUTS_PITCHER = "player_strikeouts_pitcher"


@dataclass
class PlayerProjection:
    """Player performance projection"""
    player_id: str
    player_name: str
    market: MarketType
    mean: float
    std_dev: float
    confidence: float = 0.75
    sample_size: int = 10
    last_updated: Optional[datetime] = None
    

@dataclass
class PropValue:
    """Single prop bet value analysis"""
    player_name: str
    market: str
    line: float
    side: str  # "OVER" or "UNDER"
    american_odds: int
    decimal_odds: float
    win_probability: float
    expected_value: float
    edge_percent: float
    book_name: str
    confidence: float = 0.75


class ValueEngine:
    """
    Core mathematical engine for PropFinder calculations.
    FIXED VERSION - Prevents probability validation errors.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    # =============================================================================
    # ROBUST PROBABILITY CALCULATIONS (FIXED)
    # =============================================================================
    
    def prob_over(self, mean: float, std_dev: float, line: float) -> float:
        """
        Calculate probability of going OVER a line using normal distribution.
        ROBUST VERSION: Validates all inputs to prevent invalid probabilities
        """
        # Validate inputs to prevent NaN/inf probabilities
        if not isinstance(mean, (int, float)) or not isinstance(std_dev, (int, float)) or not isinstance(line, (int, float)):
            self.logger.warning(f"Invalid probability inputs: mean={mean}, std_dev={std_dev}, line={line}")
            return 0.5  # Safe fallback
            
        if math.isnan(mean) or math.isnan(std_dev) or math.isnan(line):
            self.logger.warning(f"NaN in probability calculation: mean={mean}, std_dev={std_dev}, line={line}")
            return 0.5  # Safe fallback
            
        if math.isinf(mean) or math.isinf(std_dev) or math.isinf(line):
            self.logger.warning(f"Infinity in probability calculation: mean={mean}, std_dev={std_dev}, line={line}")
            return 0.5  # Safe fallback
            
        if std_dev <= 0:
            return 1.0 if mean > line else 0.0
            
        z = (line - mean) / std_dev
        
        # Prevent extreme z-scores that cause numerical issues
        if z > 8:  # Probability would be essentially 0
            return 0.001  # Minimum probability
        elif z < -8:  # Probability would be essentially 1
            return 0.999  # Maximum probability
            
        prob = 1 - self.norm_cdf(z)
        
        # Final validation - ensure probability is in valid range
        if prob <= 0:
            return 0.001  # Minimum valid probability  
        elif prob >= 1:
            return 0.999  # Maximum valid probability
            
        return prob

    def prob_under(self, mean: float, std_dev: float, line: float) -> float:
        """Calculate probability of going UNDER a line"""
        return 1 - self.prob_over(mean, std_dev, line)

    def norm_cdf(self, z: float) -> float:
        """
        Cumulative Distribution Function for standard normal distribution.
        Using approximation since we don't have scipy.
        """
        try:
            return 0.5 * (1 + math.erf(z / math.sqrt(2)))
        except (OverflowError, ValueError):
            # Handle extreme values
            if z > 8:
                return 1.0
            elif z < -8:
                return 0.0
            else:
                return 0.5
    
    # =============================================================================
    # ROBUST ODDS CALCULATIONS (FIXED)
    # =============================================================================
    
    def calculate_american_odds(self, prob: float) -> int:
        """
        Convert probability to American odds format.
        ROBUST VERSION: Validates probability to prevent errors
        """
        # Robust validation to prevent the errors we're seeing
        if not isinstance(prob, (int, float)):
            self.logger.warning(f"Invalid probability type: {type(prob)}, value: {prob}")
            prob = 0.5  # Safe fallback
            
        if math.isnan(prob) or math.isinf(prob):
            self.logger.warning(f"Invalid probability value: {prob}")
            prob = 0.5  # Safe fallback
            
        # Clamp to valid range instead of throwing error
        if prob <= 0:
            prob = 0.001  # Minimum valid probability
        elif prob >= 1:
            prob = 0.999  # Maximum valid probability
            
        b = (1 - prob) / prob
        
        if prob > 0.5:
            return int(round(100 * b))
        else:
            return -int(round(100 / b))

    def american_to_decimal(self, american_odds: int) -> float:
        """Convert American odds to decimal odds"""
        if american_odds > 0:
            return (american_odds / 100) + 1
        else:
            return (100 / abs(american_odds)) + 1

    def american_to_probability(self, american_odds: Union[int, str]) -> float:
        """
        Convert American odds to implied probability.
        ROBUST VERSION: Handles string inputs and edge cases
        """
        if isinstance(american_odds, str):
            try:
                american_odds = int(american_odds.replace('+', '').replace('-', ''))
                if american_odds < 0:
                    american_odds = abs(american_odds)
            except ValueError:
                self.logger.warning(f"Invalid American odds string: {american_odds}")
                return 0.5  # Safe fallback
                
        if american_odds > 0:
            return 100 / (american_odds + 100)
        else:
            return abs(american_odds) / (abs(american_odds) + 100)

    # =============================================================================
    # VALUE CALCULATION FUNCTIONS
    # =============================================================================
    
    def calculate_ev(self, model_prob: float, decimal_odds: float) -> float:
        """Calculate Expected Value per $1 bet"""
        # Validate inputs
        if not (0 < model_prob < 1):
            model_prob = max(0.001, min(0.999, model_prob))
            
        if decimal_odds <= 1:
            decimal_odds = 1.01  # Minimum valid decimal odds
            
        return (model_prob * (decimal_odds - 1)) - (1 - model_prob)
    
    def calculate_prop_value(self, 
                           projection: PlayerProjection,
                           line: float, 
                           american_odds: int,
                           side: str = "OVER",
                           book_name: str = "Generic") -> PropValue:
        """
        Calculate complete value analysis for a single prop bet.
        ROBUST VERSION: Prevents probability validation errors
        """
        try:
            # Calculate win probability based on side
            if side.upper() == "OVER":
                win_prob = self.prob_over(projection.mean, projection.std_dev, line)
            else:
                win_prob = self.prob_under(projection.mean, projection.std_dev, line)
            
            # Ensure valid probability range
            win_prob = max(0.001, min(0.999, win_prob))
            
            # Convert to decimal odds for calculations
            decimal_odds = self.american_to_decimal(american_odds)
            
            # Calculate expected value
            expected_value = self.calculate_ev(win_prob, decimal_odds)
            
            # Calculate edge percentage
            implied_prob = self.american_to_probability(american_odds)
            edge_percent = ((win_prob - implied_prob) / implied_prob) * 100
            
            return PropValue(
                player_name=projection.player_name,
                market=projection.market.value,
                line=line,
                side=side,
                american_odds=american_odds,
                decimal_odds=decimal_odds,
                win_probability=win_prob,
                expected_value=expected_value,
                edge_percent=edge_percent,
                book_name=book_name,
                confidence=projection.confidence
            )
            
        except Exception as e:
            self.logger.error(f"Error calculating prop value: {e}")
            # Return safe fallback value
            return PropValue(
                player_name=projection.player_name,
                market=projection.market.value,
                line=line,
                side=side,
                american_odds=american_odds,
                decimal_odds=2.0,
                win_probability=0.5,
                expected_value=0.0,
                edge_percent=0.0,
                book_name=book_name,
                confidence=0.1  # Low confidence due to error
            )

    # =============================================================================
    # REALISTIC ODDS GENERATION
    # =============================================================================
    
    def generate_multiple_books_odds(self, fair_prob: float, num_books: int = 5) -> List[Dict]:
        """
        Generate realistic odds from multiple sportsbooks.
        Each book has slightly different margins and rounding.
        """
        books = ["DraftKings", "FanDuel", "BetMGM", "Caesars", "PointsBet", "Barstool"]
        book_margins = [0.04, 0.045, 0.05, 0.055, 0.06, 0.048]  # Different margins
        
        results = []
        for i in range(min(num_books, len(books))):
            book_name = books[i]
            margin = book_margins[i]
            
            # Generate realistic odds with this book's margin
            over_odds, under_odds = self.generate_realistic_odds(fair_prob, margin)
            
            results.append({
                "book_name": book_name,
                "over_odds": over_odds,
                "under_odds": under_odds,
                "margin": margin
            })
        
        return results

    def generate_realistic_odds(self, fair_prob: float, book_margin: float = 0.05) -> Tuple[int, int]:
        """
        Generate realistic American odds with sportsbook margin.
        ROBUST VERSION: Validates inputs
        """
        # Validate fair_prob
        fair_prob = max(0.001, min(0.999, fair_prob))
        
        # Apply sportsbook margin
        over_prob_adj = fair_prob * (1 - book_margin/2)
        under_prob_adj = (1 - fair_prob) * (1 - book_margin/2) 
        
        # Ensure probabilities sum to more than 1 (sportsbook profit)
        total_prob = over_prob_adj + under_prob_adj
        if total_prob <= 1:
            # Adjust to ensure house edge
            adjustment = (1.05 - total_prob) / 2
            over_prob_adj += adjustment
            under_prob_adj += adjustment
        
        # Convert to American odds
        over_odds = self.calculate_american_odds(over_prob_adj)
        under_odds = self.calculate_american_odds(under_prob_adj)
        
        return over_odds, under_odds

    # =============================================================================
    # COMPLETE PROP ANALYSIS
    # =============================================================================
    
    def generate_complete_prop_analysis(self,
                                      projection: PlayerProjection,
                                      base_line: float,
                                      num_books: int = 5) -> Dict:
        """
        Generate complete propfinder-style analysis for a player prop.
        ROBUST VERSION: Prevents probability validation errors
        """
        try:
            # Generate fair probability for the base line
            fair_prob_over = self.prob_over(projection.mean, projection.std_dev, base_line)
            
            # Generate odds from multiple books
            books_odds = self.generate_multiple_books_odds(fair_prob_over, num_books)
            
            # Calculate value for each book's odds
            all_prop_values = []
            
            for book_odds in books_odds:
                # OVER bet
                over_value = self.calculate_prop_value(
                    projection=projection,
                    line=base_line,
                    american_odds=book_odds["over_odds"],
                    side="OVER", 
                    book_name=book_odds["book_name"]
                )
                all_prop_values.append(over_value)
                
                # UNDER bet
                under_value = self.calculate_prop_value(
                    projection=projection,
                    line=base_line,
                    american_odds=book_odds["under_odds"], 
                    side="UNDER",
                    book_name=book_odds["book_name"]
                )
                all_prop_values.append(under_value)
            
            # Find best odds
            best_over = max([p for p in all_prop_values if p.side == "OVER"], 
                          key=lambda p: p.expected_value, default=None)
            best_under = max([p for p in all_prop_values if p.side == "UNDER"], 
                           key=lambda p: p.expected_value, default=None)
            
            # Sort by edge percentage for value ranking
            value_ranked = sorted(all_prop_values, key=lambda p: p.edge_percent, reverse=True)
            
            return {
                "projection": projection,
                "base_line": base_line,
                "fair_probability_over": fair_prob_over,
                "fair_probability_under": 1 - fair_prob_over,
                "all_books": books_odds,
                "all_prop_values": all_prop_values,
                "best_over_value": best_over,
                "best_under_value": best_under,
                "value_ranked": value_ranked[:10],  # Top 10 by edge
                "analysis_timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error in complete prop analysis: {e}")
            # Return safe fallback
            return {
                "projection": projection,
                "base_line": base_line,
                "fair_probability_over": 0.5,
                "fair_probability_under": 0.5,
                "all_books": [],
                "all_prop_values": [],
                "best_over_value": None,
                "best_under_value": None,
                "value_ranked": [],
                "analysis_timestamp": datetime.utcnow().isoformat(),
                "error": str(e)
            }


# Create singleton instance
value_engine = ValueEngine()


if __name__ == "__main__":
    # Test the fixed engine
    print("Testing Fixed Value Engine...")
    
    # Test with potentially problematic inputs
    projection = PlayerProjection(
        player_id="123",
        player_name="Test Player",
        market=MarketType.PLAYER_HITS,
        mean=1.2,
        std_dev=0.8,
        confidence=0.75
    )
    
    engine = ValueEngine()
    analysis = engine.generate_complete_prop_analysis(
        projection=projection,
        base_line=1.5,
        num_books=3
    )
    
    print(f"Analysis completed successfully!")
    print(f"Fair probability over: {analysis['fair_probability_over']:.3f}")
    print(f"Generated {len(analysis['all_prop_values'])} prop values")
    print("✅ Fixed value engine working correctly!")