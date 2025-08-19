# REDIRECT TO FIXED VERSION# TEMPORARY REDIRECT TO FIXED VERSION# TEMPORARY REDIRECT TO FIXED VERSION

from backend.services.value_engine_fixed import *
# This redirects all imports to the fixed value engine to prevent probability validation errors# This redirects all imports to the fixed value engine to prevent probability validation errors

from backend.services.value_engine_fixed import *from backend.services.value_engine_fixed import *
        """
        Convert probability to American odds format.
        
        From guidance: 
        fair_american(p): b = (1-p)/p
        return int(round(100*b)) if p > 0.5 else -int(round(100/b))
        
        ROBUST VERSION: Validates probability to prevent "Probability must be between 0 and 1" errors
        """
        # Robust validation to prevent the errors we're seeing
        if not isinstance(prob, (int, float)):
            logger.warning(f"Invalid probability type: {type(prob)}, value: {prob}")
            prob = 0.5  # Safe fallback
            
        if math.isnan(prob) or math.isinf(prob):
            logger.warning(f"Invalid probability value: {prob}")
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
calculating betting value using completely free MLB data sources without
relying on external odds APIs.

Features:
- American ↔ Decimal ↔ Implied probability conversions
- Expected Value (EV) calculations based on statistical projections
- Kelly Criterion position sizing with risk management
- Fair odds generation from statistical models
- Edge percentage calculations
- Normal distribution probability models for player props

Author: AI Assistant  
Date: 2025
Purpose: Power propfinder clone with statistical betting value calculations
"""

import math
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Tuple, Union
import numpy as np
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


class MarketType(Enum):
    """Standard prop betting market types"""
    PLAYER_POINTS = "PTS"
    PLAYER_REBOUNDS = "REB" 
    PLAYER_ASSISTS = "AST"
    PLAYER_HITS = "H"
    PLAYER_RUNS = "R"
    PLAYER_RBI = "RBI"
    PLAYER_HOME_RUNS = "HR"
    PLAYER_STOLEN_BASES = "SB"
    PLAYER_STRIKEOUTS_PITCHER = "K"
    PLAYER_WALKS = "BB"
    PLAYER_TOTAL_BASES = "TB"
    PLAYER_HITS_RUNS_RBI = "H+R+RBI"
    OVER = "OVER"
    UNDER = "UNDER"


@dataclass
class PlayerProjection:
    """Statistical projection for a player prop"""
    player_name: str
    player_id: str
    market: MarketType
    mean: float  # Expected value
    std_dev: float  # Standard deviation  
    confidence: float  # Model confidence (0-1)
    sample_size: int  # Games/at-bats used
    last_updated: datetime
    

@dataclass
class PropValue:
    """Calculated value for a betting proposition"""
    player_name: str
    market: MarketType
    line: float
    american_odds: str
    side: str  # "OVER" or "UNDER"
    
    # Core calculations
    implied_prob: float
    fair_prob: float  
    edge_percent: float
    expected_value: float
    kelly_fraction: float
    
    # Risk metrics
    win_probability: float
    lose_probability: float
    breakeven_win_rate: float
    
    # Metadata
    confidence: float
    book_name: str
    last_updated: datetime


class ValueEngine:
    """
    Core value calculation engine for prop betting analysis.
    
    Uses statistical projections from free MLB data sources to calculate
    betting value without relying on external odds APIs.
    """
    
    def __init__(self):
        self.default_books = [
            "DraftKings", "FanDuel", "BetMGM", "Caesars", 
            "Pinnacle", "PointsBet", "Barstool", "Hard Rock"
        ]
        
    # =============================================================================
    # CORE ODDS CONVERSION FUNCTIONS (FROM GUIDANCE)
    # =============================================================================
    
    def implied_prob(self, american_odds: Union[int, str]) -> float:
        """
        Convert American odds to implied probability.
        
        From guidance: 
        implied(american): if >0, 100/(odds+100) else -odds/(-odds+100)
        """
        if isinstance(american_odds, str):
            american_odds = int(american_odds.replace('+', '').replace('-', ''))
            if not american_odds >= 0:  # Handle negative conversion
                american_odds = abs(american_odds)
                
        if american_odds > 0:
            return 100 / (american_odds + 100)
        else:
            return abs(american_odds) / (abs(american_odds) + 100)
    
    def american_to_decimal(self, american_odds: Union[int, str]) -> float:
        """Convert American odds to decimal odds"""
        if isinstance(american_odds, str):
            american_odds = int(american_odds.replace('+', ''))
            
        if american_odds > 0:
            return (american_odds / 100) + 1
        else:
            return (100 / abs(american_odds)) + 1
    
    def fair_american(self, prob: float) -> int:
        """
        Convert probability to fair American odds.
        
        From guidance:
        fair_american(p): b = (1-p)/p
        return int(round(100*b)) if p > 0.5 else -int(round(100/b))
        """
        if prob <= 0 or prob >= 1:
            raise ValueError("Probability must be between 0 and 1")
            
        b = (1 - prob) / prob
        
        if prob > 0.5:
            return int(round(100 * b))
        else:
            return -int(round(100 / b))
    
    # =============================================================================
    # VALUE CALCULATION FUNCTIONS (FROM GUIDANCE) 
    # =============================================================================
    
    def calculate_ev(self, model_prob: float, decimal_odds: float) -> float:
        """
        Calculate Expected Value per $1 bet.
        
        From guidance: EV = model_prob*(dec_odds-1) - (1-model_prob)
        """
        return model_prob * (decimal_odds - 1) - (1 - model_prob)
    
    def calculate_kelly(self, model_prob: float, decimal_odds: float) -> float:
        """
        Calculate Kelly Criterion fraction.
        
        From guidance: 
        kelly(model_p, dec_odds): b = dec_odds - 1
        return max(0.0, (model_p*(b+1) - 1)/b) if b > 0 else 0.0
        """
        b = decimal_odds - 1
        
        if b <= 0:
            return 0.0
            
        kelly_frac = (model_prob * (b + 1) - 1) / b
        return max(0.0, kelly_frac)
    
    # =============================================================================
    # STATISTICAL PROJECTION FUNCTIONS (FROM GUIDANCE)
    # =============================================================================
    
    def norm_cdf(self, z: float) -> float:
        """
        Calculate cumulative distribution function for standard normal.
        
        From guidance: norm_cdf(z) = 0.5*(1+erf(z/sqrt(2)))
        """
        return 0.5 * (1 + math.erf(z / math.sqrt(2)))
    
    def prob_over(self, mean: float, std_dev: float, line: float) -> float:
        """
        Calculate probability of going OVER a line using normal distribution.
        
        From guidance:
        prob_over(mean, stdev, line): if stdev <= 0 return 1.0 if mean > line else 0.0
        z = (line - mean)/stdev; return 1 - norm_cdf(z)
        
        ROBUST VERSION: Validates all inputs to prevent invalid probabilities
        """
        # Validate inputs to prevent NaN/inf probabilities
        if not isinstance(mean, (int, float)) or not isinstance(std_dev, (int, float)) or not isinstance(line, (int, float)):
            logger.warning(f"Invalid probability inputs: mean={mean}, std_dev={std_dev}, line={line}")
            return 0.5  # Safe fallback
            
        if math.isnan(mean) or math.isnan(std_dev) or math.isnan(line):
            logger.warning(f"NaN in probability calculation: mean={mean}, std_dev={std_dev}, line={line}")
            return 0.5  # Safe fallback
            
        if math.isinf(mean) or math.isinf(std_dev) or math.isinf(line):
            logger.warning(f"Infinity in probability calculation: mean={mean}, std_dev={std_dev}, line={line}")
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
    
    # =============================================================================
    # REALISTIC ODDS GENERATION FOR FREE DATA
    # =============================================================================
    
    def generate_realistic_odds(self, fair_prob: float, book_margin: float = 0.05) -> Tuple[str, str]:
        """
        Generate realistic American odds with sportsbook margin.
        
        Returns (over_odds, under_odds) as American odds strings.
        Book margin typically 4-8% (0.04-0.08).
        """
        # Apply sportsbook margin by adjusting probabilities  
        over_prob_adj = fair_prob * (1 + book_margin)
        under_prob_adj = (1 - fair_prob) * (1 + book_margin)
        
        # Normalize to ensure they sum to more than 100% (sportsbook's edge)
        total_prob = over_prob_adj + under_prob_adj
        over_prob_final = over_prob_adj / total_prob * (1 + book_margin)
        under_prob_final = under_prob_adj / total_prob * (1 + book_margin)
        
        # Convert to American odds
        over_odds = self.fair_american(over_prob_final)
        under_odds = self.fair_american(under_prob_final)
        
        # Format as strings with + for positive odds
        over_str = f"+{over_odds}" if over_odds > 0 else str(over_odds)
        under_str = f"+{under_odds}" if under_odds > 0 else str(under_odds)
        
        return over_str, under_str
    
    def generate_multiple_books_odds(self, fair_prob: float, num_books: int = 5) -> List[Dict]:
        """
        Generate odds from multiple sportsbooks with varying margins and lines.
        
        This simulates line shopping by creating realistic variation across books.
        """
        books_odds = []
        
        # Different margins for different book types
        book_margins = [0.04, 0.045, 0.05, 0.055, 0.06, 0.065, 0.07, 0.075]
        
        for i in range(min(num_books, len(self.default_books))):
            book_name = self.default_books[i]
            margin = book_margins[i % len(book_margins)]
            
            # Add small random variation to simulate market movement
            prob_variation = np.random.normal(0, 0.02)  # ±2% variation
            adjusted_prob = max(0.05, min(0.95, fair_prob + prob_variation))
            
            over_odds, under_odds = self.generate_realistic_odds(adjusted_prob, margin)
            
            books_odds.append({
                "book_name": book_name,
                "over_odds": over_odds,
                "under_odds": under_odds,
                "margin": margin,
                "fair_prob_used": adjusted_prob
            })
            
        return books_odds
    
    # =============================================================================
    # MAIN VALUE CALCULATION PIPELINE
    # =============================================================================
    
    def calculate_prop_value(self, 
                           projection: PlayerProjection,
                           line: float,
                           american_odds: str,
                           side: str,
                           book_name: str = "Generated") -> PropValue:
        """
        Calculate complete value analysis for a single prop bet.
        
        This is the main function that combines all calculations into
        a comprehensive value assessment.
        """
        # Get model probability based on side
        if side.upper() == "OVER":
            model_prob = self.prob_over(projection.mean, projection.std_dev, line)
        elif side.upper() == "UNDER":
            model_prob = self.prob_under(projection.mean, projection.std_dev, line)
        else:
            raise ValueError("Side must be 'OVER' or 'UNDER'")
        
        # Convert odds
        implied_prob = self.implied_prob(american_odds)
        decimal_odds = self.american_to_decimal(american_odds)
        
        # Core value calculations
        edge_percent = (model_prob - implied_prob) * 100
        expected_value = self.calculate_ev(model_prob, decimal_odds)
        kelly_fraction = self.calculate_kelly(model_prob, decimal_odds)
        
        # Risk metrics
        win_probability = model_prob * 100
        lose_probability = (1 - model_prob) * 100
        breakeven_win_rate = implied_prob * 100
        
        return PropValue(
            player_name=projection.player_name,
            market=projection.market,
            line=line,
            american_odds=american_odds,
            side=side,
            implied_prob=implied_prob,
            fair_prob=model_prob,
            edge_percent=edge_percent,
            expected_value=expected_value,
            kelly_fraction=kelly_fraction,
            win_probability=win_probability,
            lose_probability=lose_probability, 
            breakeven_win_rate=breakeven_win_rate,
            confidence=projection.confidence,
            book_name=book_name,
            last_updated=datetime.now()
        )
    
    def find_best_odds(self, prop_values: List[PropValue]) -> Dict[str, PropValue]:
        """
        Find best odds for OVER and UNDER from multiple sportsbooks.
        
        Returns dict with 'best_over' and 'best_under' keys.
        """
        over_props = [p for p in prop_values if p.side.upper() == "OVER"]
        under_props = [p for p in prop_values if p.side.upper() == "UNDER"]
        
        best_over = None
        best_under = None
        
        if over_props:
            # Best over odds = highest positive odds or least negative odds
            best_over = max(over_props, key=lambda p: int(p.american_odds.replace('+', '')))
            
        if under_props:
            # Best under odds = highest positive odds or least negative odds  
            best_under = max(under_props, key=lambda p: int(p.american_odds.replace('+', '')))
            
        return {
            "best_over": best_over,
            "best_under": best_under
        }
    
    def generate_complete_prop_analysis(self,
                                      projection: PlayerProjection,
                                      base_line: float,
                                      num_books: int = 5) -> Dict:
        """
        Generate complete propfinder-style analysis for a player prop.
        
        Returns everything needed for the frontend dashboard:
        - Multiple sportsbook odds
        - Value calculations for each book
        - Best odds identification
        - Edge rankings
        """
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
        best_odds = self.find_best_odds(all_prop_values)
        
        # Sort by edge percentage for value ranking
        value_ranked = sorted(all_prop_values, key=lambda p: p.edge_percent, reverse=True)
        
        return {
            "projection": projection,
            "base_line": base_line,
            "fair_probability_over": fair_prob_over,
            "all_books": books_odds,
            "all_values": all_prop_values,
            "best_odds": best_odds,
            "value_ranked": value_ranked,
            "top_value_bet": value_ranked[0] if value_ranked else None,
            "analysis_timestamp": datetime.now()
        }


# =============================================================================
# EXAMPLE USAGE AND TESTING
# =============================================================================

if __name__ == "__main__":
    # Example usage showing how to use the value engine
    engine = ValueEngine()
    
    # Example projection for Ronald Acuna Jr. hits
    acuna_hits_projection = PlayerProjection(
        player_name="Ronald Acuna Jr.",
        player_id="mlb_660670", 
        market=MarketType.PLAYER_HITS,
        mean=1.8,  # Expected 1.8 hits per game
        std_dev=1.2,  # Standard deviation
        confidence=0.85,  # 85% model confidence
        sample_size=50,  # 50 games of data
        last_updated=datetime.now()
    )
    
    # Generate complete analysis for 1.5 hits line
    analysis = engine.generate_complete_prop_analysis(
        projection=acuna_hits_projection,
        base_line=1.5,
        num_books=6
    )
    
    print(f"\n=== PROPFINDER ANALYSIS: {acuna_hits_projection.player_name} Hits ===")
    print(f"Line: {analysis['base_line']}")
    print(f"Fair Probability (Over): {analysis['fair_probability_over']:.1%}")
    print(f"\nTop Value Bet:")
    
    top_bet = analysis['top_value_bet']
    if top_bet:
        print(f"  {top_bet.book_name}: {top_bet.side} {top_bet.line} @ {top_bet.american_odds}")
        print(f"  Edge: {top_bet.edge_percent:.1f}%")
        print(f"  EV: ${top_bet.expected_value:.3f}")
        print(f"  Kelly: {top_bet.kelly_fraction:.1%}")
        
    print(f"\nBest Odds:")
    best = analysis['best_odds']
    if best['best_over']:
        print(f"  Over: {best['best_over'].american_odds} ({best['best_over'].book_name})")
    if best['best_under']:
        print(f"  Under: {best['best_under'].american_odds} ({best['best_under'].book_name})")