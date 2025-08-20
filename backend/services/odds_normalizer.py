"""
Canonical Odds Normalizer & No-Vig Calculator

This module provides core functionality for PropFinder's odds normalization and edge detection.
Converts American odds to decimal, calculates implied probabilities, and removes vigorish (vig)
to determine true market probabilities and betting edges.

Key Features:
- American odds to decimal conversion
- Implied probability calculations
- No-vig probability normalization for 2-way and n-way markets
- Edge calculation: aiProbability - impliedProbability
- Support for multiple sportsbooks with best line detection

Usage:
    normalizer = OddsNormalizer()
    result = normalizer.normalize_market_odds(bookmaker_odds)
    edge = normalizer.calculate_edge(ai_probability, result.implied_probability)
"""

from typing import Dict, List, Tuple, Optional, Union
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
import logging

logger = logging.getLogger(__name__)

@dataclass
class NormalizedOdds:
    """Normalized odds result with all calculations"""
    american_odds: int
    decimal_odds: float
    implied_probability: float
    no_vig_probability: Optional[float] = None
    edge: Optional[float] = None
    confidence: Optional[float] = None
    bookmaker: Optional[str] = None

@dataclass
class MarketNormalization:
    """Complete market normalization results"""
    total_vig: float
    individual_odds: List[NormalizedOdds]
    best_over_odds: Optional[NormalizedOdds] = None
    best_under_odds: Optional[NormalizedOdds] = None
    market_efficiency: Optional[float] = None

class OddsNormalizer:
    """
    Core odds normalization service for PropFinder functionality.
    
    Implements mathematical formulas for odds conversion and vig removal:
    - American to Decimal: odds > 0 ? 1 + odds/100 : 1 + 100/abs(odds)
    - Implied Probability: 1 / decimal_odds
    - No-vig Normalization: p_i / sum(p_i) for all outcomes
    """
    
    def __init__(self, precision: int = 4):
        """
        Initialize odds normalizer.
        
        Args:
            precision: Decimal precision for calculations (default: 4)
        """
        self.precision = precision
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    def american_to_decimal(self, odds: int) -> float:
        """
        Convert American odds to decimal odds.
        
        Formula:
        - Positive odds: 1 + odds/100
        - Negative odds: 1 + 100/abs(odds)
        
        Args:
            odds: American odds (e.g., +150, -120)
            
        Returns:
            Decimal odds (e.g., 2.50, 1.83)
            
        Examples:
            >>> normalizer = OddsNormalizer()
            >>> normalizer.american_to_decimal(150)  # +150
            2.5
            >>> normalizer.american_to_decimal(-120)  # -120
            1.8333
        """
        if not isinstance(odds, int) or odds == 0:
            raise ValueError(f"Invalid American odds: {odds}. Must be non-zero integer.")
        
        if odds > 0:
            decimal = 1 + odds / 100.0
        else:
            decimal = 1 + 100.0 / abs(odds)
        
        return round(decimal, self.precision)
    
    def decimal_to_american(self, decimal_odds: float) -> int:
        """
        Convert decimal odds to American odds.
        
        Args:
            decimal_odds: Decimal odds (e.g., 2.50)
            
        Returns:
            American odds (e.g., +150)
        """
        if decimal_odds < 1.0:
            raise ValueError(f"Invalid decimal odds: {decimal_odds}. Must be >= 1.0")
        
        if decimal_odds >= 2.0:
            # Positive American odds
            american = int((decimal_odds - 1) * 100)
        else:
            # Negative American odds
            american = int(-100 / (decimal_odds - 1))
        
        return american
    
    def implied_prob_from_american(self, odds: int) -> float:
        """
        Calculate implied probability from American odds.
        
        Args:
            odds: American odds
            
        Returns:
            Implied probability (0.0 to 1.0)
            
        Examples:
            >>> normalizer.implied_prob_from_american(-110)
            0.5238  # 52.38%
        """
        decimal = self.american_to_decimal(odds)
        probability = 1.0 / decimal
        return round(probability, self.precision)
    
    def implied_prob_from_decimal(self, decimal_odds: float) -> float:
        """Calculate implied probability from decimal odds."""
        if decimal_odds <= 0:
            raise ValueError(f"Invalid decimal odds: {decimal_odds}")
        
        probability = 1.0 / decimal_odds
        return round(probability, self.precision)
    
    def remove_vig_two_way(self, over_prob: float, under_prob: float) -> Tuple[float, float]:
        """
        Remove vigorish from two-way market (over/under).
        
        Formula: p_normalized = p_implied / (p_over + p_under)
        
        Args:
            over_prob: Implied probability for OVER
            under_prob: Implied probability for UNDER
            
        Returns:
            Tuple of (no_vig_over_prob, no_vig_under_prob)
            
        Examples:
            >>> normalizer.remove_vig_two_way(0.5238, 0.5238)  # Both -110
            (0.5, 0.5)  # True 50/50 after vig removal
        """
        if over_prob <= 0 or under_prob <= 0:
            raise ValueError("Probabilities must be positive")
        
        total_prob = over_prob + under_prob
        
        if total_prob <= 1.0:
            self.logger.warning(f"No vig detected. Total prob: {total_prob}")
            return over_prob, under_prob
        
        no_vig_over = over_prob / total_prob
        no_vig_under = under_prob / total_prob
        
        return (
            round(no_vig_over, self.precision),
            round(no_vig_under, self.precision)
        )
    
    def remove_vig_n_way(self, probabilities: List[float]) -> List[float]:
        """
        Remove vigorish from n-way market (multiple outcomes).
        
        Args:
            probabilities: List of implied probabilities
            
        Returns:
            List of no-vig probabilities that sum to 1.0
        """
        if not probabilities or any(p <= 0 for p in probabilities):
            raise ValueError("All probabilities must be positive")
        
        total_prob = sum(probabilities)
        
        if total_prob <= 1.0:
            self.logger.warning(f"No vig detected in n-way market. Total: {total_prob}")
            return probabilities
        
        no_vig_probs = [p / total_prob for p in probabilities]
        return [round(p, self.precision) for p in no_vig_probs]
    
    def calculate_vig_percentage(self, probabilities: List[float]) -> float:
        """
        Calculate the vigorish percentage in a market.
        
        Vig % = (sum of implied probabilities - 1) * 100
        
        Args:
            probabilities: List of implied probabilities
            
        Returns:
            Vigorish percentage
        """
        total_prob = sum(probabilities)
        vig_percentage = (total_prob - 1.0) * 100
        return round(vig_percentage, 2)
    
    def calculate_edge(self, ai_probability: float, implied_probability: float) -> float:
        """
        Calculate betting edge: AI probability - market implied probability.
        
        Positive edge indicates value bet opportunity.
        
        Args:
            ai_probability: AI model's probability prediction (0.0 to 1.0)
            implied_probability: Market's implied probability (0.0 to 1.0)
            
        Returns:
            Edge value (positive = value bet, negative = bad bet)
            
        Examples:
            >>> normalizer.calculate_edge(0.65, 0.52)  # AI: 65%, Market: 52%
            0.13  # 13% edge - strong value bet
        """
        if not (0 <= ai_probability <= 1) or not (0 <= implied_probability <= 1):
            raise ValueError("Probabilities must be between 0 and 1")
        
        edge = ai_probability - implied_probability
        return round(edge, self.precision)
    
    def normalize_bookmaker_odds(
        self, 
        bookmaker_odds: Dict[str, Dict[str, int]]
    ) -> MarketNormalization:
        """
        Normalize odds from multiple bookmakers for a single market.
        
        Args:
            bookmaker_odds: {
                'DraftKings': {'over': -110, 'under': -110},
                'FanDuel': {'over': -105, 'under': -115},
                ...
            }
            
        Returns:
            MarketNormalization with vig-removed probabilities and best lines
        """
        if not bookmaker_odds:
            raise ValueError("No bookmaker odds provided")
        
        normalized_odds = []
        all_over_odds = []
        all_under_odds = []
        
        for bookmaker, lines in bookmaker_odds.items():
            if 'over' not in lines or 'under' not in lines:
                self.logger.warning(f"Incomplete odds for {bookmaker}: {lines}")
                continue
            
            try:
                # Calculate implied probabilities
                over_prob = self.implied_prob_from_american(lines['over'])
                under_prob = self.implied_prob_from_american(lines['under'])
                
                # Remove vig for this bookmaker's market
                no_vig_over, no_vig_under = self.remove_vig_two_way(over_prob, under_prob)
                
                # Create normalized odds objects
                over_normalized = NormalizedOdds(
                    american_odds=lines['over'],
                    decimal_odds=self.american_to_decimal(lines['over']),
                    implied_probability=over_prob,
                    no_vig_probability=no_vig_over,
                    bookmaker=bookmaker
                )
                
                under_normalized = NormalizedOdds(
                    american_odds=lines['under'],
                    decimal_odds=self.american_to_decimal(lines['under']),
                    implied_probability=under_prob,
                    no_vig_probability=no_vig_under,
                    bookmaker=bookmaker
                )
                
                normalized_odds.extend([over_normalized, under_normalized])
                all_over_odds.append(over_normalized)
                all_under_odds.append(under_normalized)
                
            except Exception as e:
                self.logger.error(f"Error normalizing odds for {bookmaker}: {e}")
                continue
        
        if not normalized_odds:
            raise ValueError("No valid odds could be normalized")
        
        # Find best odds (highest decimal odds = best value for bettor)
        best_over = max(all_over_odds, key=lambda x: x.decimal_odds) if all_over_odds else None
        best_under = max(all_under_odds, key=lambda x: x.decimal_odds) if all_under_odds else None
        
        # Calculate overall market vig
        all_probs = [odds.implied_probability for odds in normalized_odds]
        # For two-way markets, calculate vig from pairs
        market_pairs = []
        for i in range(0, len(all_probs), 2):
            if i + 1 < len(all_probs):
                market_pairs.append(all_probs[i] + all_probs[i + 1])
        
        avg_vig = sum(p - 1.0 for p in market_pairs) / len(market_pairs) if market_pairs else 0
        
        return MarketNormalization(
            total_vig=round(avg_vig * 100, 2),  # Convert to percentage
            individual_odds=normalized_odds,
            best_over_odds=best_over,
            best_under_odds=best_under,
            market_efficiency=round(1.0 / (1.0 + abs(avg_vig)), 3) if avg_vig != 0 else 1.0
        )
    
    def find_best_line(
        self, 
        bookmaker_odds: Dict[str, Dict[str, int]], 
        side: str = 'over'
    ) -> Optional[NormalizedOdds]:
        """
        Find the best available line across all bookmakers for a specific side.
        
        Args:
            bookmaker_odds: Dictionary of bookmaker odds
            side: 'over' or 'under'
            
        Returns:
            NormalizedOdds object for the best line, or None if not found
        """
        if side not in ['over', 'under']:
            raise ValueError("Side must be 'over' or 'under'")
        
        best_odds = None
        best_decimal = 0
        
        for bookmaker, lines in bookmaker_odds.items():
            if side not in lines:
                continue
            
            try:
                american_odds = lines[side]
                decimal_odds = self.american_to_decimal(american_odds)
                
                if decimal_odds > best_decimal:
                    best_decimal = decimal_odds
                    best_odds = NormalizedOdds(
                        american_odds=american_odds,
                        decimal_odds=decimal_odds,
                        implied_probability=self.implied_prob_from_american(american_odds),
                        bookmaker=bookmaker
                    )
            
            except Exception as e:
                self.logger.error(f"Error processing {bookmaker} {side} odds: {e}")
                continue
        
        return best_odds
    
    def format_odds_display(self, odds: Union[int, float], format_type: str = 'american') -> str:
        """
        Format odds for display in UI.
        
        Args:
            odds: Odds value
            format_type: 'american', 'decimal', or 'percentage'
            
        Returns:
            Formatted odds string
        """
        if format_type == 'american':
            if isinstance(odds, float):
                odds = self.decimal_to_american(odds)
            return f"+{odds}" if odds > 0 else str(odds)
        
        elif format_type == 'decimal':
            if isinstance(odds, int):
                odds = self.american_to_decimal(odds)
            return f"{odds:.2f}"
        
        elif format_type == 'percentage':
            if isinstance(odds, int):
                prob = self.implied_prob_from_american(odds)
            else:
                prob = self.implied_prob_from_decimal(odds)
            return f"{prob * 100:.1f}%"
        
        else:
            raise ValueError(f"Invalid format_type: {format_type}")


# Utility functions for PropFinder integration
def create_propfinder_odds_response(
    normalizer: OddsNormalizer,
    bookmaker_odds: Dict[str, Dict[str, int]],
    ai_probability: float,
    side: str = 'over'
) -> Dict:
    """
    Create PropFinder-compatible odds response with edge calculations.
    
    This function integrates with the existing PropFinderDataService
    to provide normalized odds data in the expected API format.
    """
    try:
        # Normalize the market
        market_norm = normalizer.normalize_bookmaker_odds(bookmaker_odds)
        
        # Find best line for the specified side
        best_line = market_norm.best_over_odds if side == 'over' else market_norm.best_under_odds
        
        if not best_line:
            raise ValueError(f"No {side} odds available")
        
        # Calculate edge using no-vig probability
        edge = normalizer.calculate_edge(ai_probability, best_line.no_vig_probability)
        
        # Format response for PropFinder API
        return {
            'odds': best_line.american_odds,
            'impliedProbability': round(best_line.no_vig_probability * 100, 1),
            'aiProbability': round(ai_probability * 100, 1),
            'edge': round(edge * 100, 1),
            'bookmakers': [
                {
                    'name': odds.bookmaker,
                    'odds': odds.american_odds,
                    'line': None,  # Populated by caller if needed
                    'impliedProb': round(odds.no_vig_probability * 100, 1)
                }
                for odds in market_norm.individual_odds
                if (side == 'over' and odds.american_odds > 0) or 
                   (side == 'under' and odds.american_odds < 0)
            ],
            'marketEfficiency': market_norm.market_efficiency,
            'totalVig': market_norm.total_vig
        }
    
    except Exception as e:
        logger.error(f"Error creating PropFinder odds response: {e}")
        raise


# Example usage and test cases
if __name__ == "__main__":
    # Example: PropFinder odds normalization
    normalizer = OddsNormalizer()
    
    # Sample bookmaker odds for Over/Under 8.5 Runs
    sample_odds = {
        'DraftKings': {'over': -110, 'under': -110},
        'FanDuel': {'over': -105, 'under': -115},
        'BetMGM': {'over': -108, 'under': -112}
    }
    
    # Normalize the market
    result = normalizer.normalize_bookmaker_odds(sample_odds)
    
    print("=== PropFinder Odds Normalization Example ===")
    print(f"Market Vig: {result.total_vig}%")
    print(f"Market Efficiency: {result.market_efficiency}")
    print(f"Best Over Line: {result.best_over_odds.bookmaker} {result.best_over_odds.american_odds}")
    print(f"Best Under Line: {result.best_under_odds.bookmaker} {result.best_under_odds.american_odds}")
    
    # Example edge calculation with AI prediction
    ai_prediction = 0.58  # AI model says 58% chance of OVER
    edge = normalizer.calculate_edge(ai_prediction, result.best_over_odds.no_vig_probability)
    print(f"Edge for OVER bet: {edge * 100:.1f}%")
    
    # Create PropFinder API response
    api_response = create_propfinder_odds_response(
        normalizer, sample_odds, ai_prediction, 'over'
    )
    print(f"PropFinder API Response: {api_response}")