"""
Smart Signals Service
Computes composite signal scores for betting opportunities based on multiple factors.
"""
import logging
import os
from dataclasses import dataclass
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta

logger = logging.getLogger("propollama.smart_signals")


@dataclass
class SignalFactor:
    """Individual factor contributing to the signal score."""
    name: str
    value: float  # 0-100 scale
    weight: float  # Relative importance
    description: str


@dataclass 
class SmartSignal:
    """Complete smart signal analysis result."""
    score: float  # 0-100 composite score
    factors: List[SignalFactor]
    confidence: float  # 0-1 confidence in the signal
    timestamp: str
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response."""
        return {
            "score": round(self.score, 2),
            "factors": [
                {
                    "name": f.name,
                    "value": round(f.value, 2),
                    "weight": f.weight,
                    "description": f.description
                }
                for f in self.factors
            ],
            "confidence": round(self.confidence, 3),
            "timestamp": self.timestamp
        }


class SmartSignalsService:
    """Service for computing smart signals from betting opportunities."""
    
    def __init__(self):
        self.enabled = os.getenv("ENABLE_SMART_SIGNALS", "false").lower() == "true"
        
        # Factor weights - can be tuned based on performance
        self.weights = {
            "ev_percent": 0.30,      # Expected value is crucial
            "line_movement": 0.20,   # Line movement indicates sharp action
            "arbitrage": 0.25,       # Arbitrage opportunities are valuable
            "vig": 0.15,            # Low vig = better value
            "book_diversity": 0.10   # More books = more reliable
        }
        
        logger.info(f"SmartSignalsService initialized - enabled: {self.enabled}")
    
    def compute_signal(self, opportunity: Dict[str, Any]) -> Optional[SmartSignal]:
        """
        Compute smart signal score for a betting opportunity.
        
        Args:
            opportunity: Dictionary containing opportunity data
            
        Returns:
            SmartSignal with score 0-100 and contributing factors, or None if disabled/invalid
        """
        if not self.enabled:
            logger.debug("Smart signals disabled via feature flag")
            return None
            
        if not opportunity:
            logger.warning("Empty opportunity provided to compute_signal")
            return None
            
        try:
            factors = []
            
            # Factor 1: Expected Value Percentage
            ev_factor = self._compute_ev_factor(opportunity)
            if ev_factor:
                factors.append(ev_factor)
            
            # Factor 2: Recent Line Movement
            movement_factor = self._compute_line_movement_factor(opportunity)
            if movement_factor:
                factors.append(movement_factor)
            
            # Factor 3: Arbitrage Potential
            arbitrage_factor = self._compute_arbitrage_factor(opportunity)
            if arbitrage_factor:
                factors.append(arbitrage_factor)
            
            # Factor 4: Vig Analysis
            vig_factor = self._compute_vig_factor(opportunity)
            if vig_factor:
                factors.append(vig_factor)
            
            # Factor 5: Book Diversity
            diversity_factor = self._compute_book_diversity_factor(opportunity)
            if diversity_factor:
                factors.append(diversity_factor)
            
            if not factors:
                logger.warning("No valid factors computed for opportunity")
                return None
            
            # Compute weighted composite score
            total_weighted_score = sum(f.value * f.weight for f in factors)
            total_weight = sum(f.weight for f in factors)
            
            if total_weight == 0:
                logger.warning("Total weight is zero")
                return None
            
            composite_score = total_weighted_score / total_weight
            
            # Confidence based on number of available factors
            confidence = min(len(factors) / 5.0, 1.0)  # Max confidence with all 5 factors
            
            signal = SmartSignal(
                score=composite_score,
                factors=factors,
                confidence=confidence,
                timestamp=datetime.utcnow().isoformat()
            )
            
            logger.debug(f"Computed signal score: {composite_score:.2f} with {len(factors)} factors")
            return signal
            
        except Exception as e:
            logger.error(f"Error computing signal: {e}", exc_info=True)
            return None
    
    def _compute_ev_factor(self, opportunity: Dict[str, Any]) -> Optional[SignalFactor]:
        """Compute expected value factor."""
        try:
            # Look for EV in various possible fields
            ev_percent = opportunity.get("ev_percent") or opportunity.get("edge")
            
            if ev_percent is None:
                # Try to compute from odds if available
                odds = opportunity.get("odds")
                implied_prob = opportunity.get("implied_probability")
                true_prob = opportunity.get("true_probability")
                
                if odds and implied_prob and true_prob:
                    ev_percent = (true_prob - implied_prob) * 100
                else:
                    return None
            
            # Normalize EV to 0-100 scale
            # EV of 5% = 50 points, 10% = 75 points, 15%+ = 100 points
            if ev_percent <= 0:
                score = 0
            elif ev_percent >= 15:
                score = 100
            else:
                score = min(100, max(0, (ev_percent / 15.0) * 100))
            
            return SignalFactor(
                name="ev_percent",
                value=score,
                weight=self.weights["ev_percent"],
                description=f"Expected value: {ev_percent:.2f}%"
            )
            
        except Exception as e:
            logger.debug(f"Could not compute EV factor: {e}")
            return None
    
    def _compute_line_movement_factor(self, opportunity: Dict[str, Any]) -> Optional[SignalFactor]:
        """Compute line movement factor."""
        try:
            line_movement = opportunity.get("line_movement")
            movement_direction = opportunity.get("movement_direction", "neutral")
            
            if line_movement is None:
                # Check for opening/current line comparison
                opening_line = opportunity.get("opening_line")
                current_line = opportunity.get("line")
                
                if opening_line and current_line:
                    line_movement = abs(current_line - opening_line)
                    movement_direction = "favorable" if current_line > opening_line else "unfavorable"
                else:
                    return None
            
            # Score based on movement magnitude and direction
            if movement_direction == "favorable":
                # Favorable movement gets higher scores
                if line_movement >= 1.0:
                    score = 100
                elif line_movement >= 0.5:
                    score = 75
                elif line_movement >= 0.25:
                    score = 50
                else:
                    score = 25
            elif movement_direction == "unfavorable":
                # Unfavorable movement gets lower scores
                score = max(0, 50 - (line_movement * 25))
            else:
                # Neutral movement
                score = 40
            
            return SignalFactor(
                name="line_movement",
                value=score,
                weight=self.weights["line_movement"],
                description=f"Line movement: {movement_direction} ({line_movement:.2f})"
            )
            
        except Exception as e:
            logger.debug(f"Could not compute line movement factor: {e}")
            return None
    
    def _compute_arbitrage_factor(self, opportunity: Dict[str, Any]) -> Optional[SignalFactor]:
        """Compute arbitrage potential factor."""
        try:
            has_arbitrage = opportunity.get("hasArbitrage", False)
            arbitrage_profit = opportunity.get("arbitrageProfitPct", 0)
            
            if has_arbitrage and arbitrage_profit > 0:
                # Direct arbitrage opportunity
                if arbitrage_profit >= 5.0:
                    score = 100
                elif arbitrage_profit >= 3.0:
                    score = 85
                elif arbitrage_profit >= 1.0:
                    score = 70
                else:
                    score = 50
            else:
                # Check for potential arbitrage indicators
                odds_spread = opportunity.get("oddsSpread", 0)
                line_spread = opportunity.get("lineSpread", 0)
                
                if odds_spread >= 50:  # Large odds difference
                    score = 60
                elif odds_spread >= 30:
                    score = 40
                elif line_spread >= 1.0:  # Significant line differences
                    score = 30
                else:
                    score = 10
            
            return SignalFactor(
                name="arbitrage",
                value=score,
                weight=self.weights["arbitrage"],
                description=f"Arbitrage potential: {arbitrage_profit:.2f}% profit"
            )
            
        except Exception as e:
            logger.debug(f"Could not compute arbitrage factor: {e}")
            return None
    
    def _compute_vig_factor(self, opportunity: Dict[str, Any]) -> Optional[SignalFactor]:
        """Compute vig (bookmaker margin) factor."""
        try:
            vig = opportunity.get("vig")
            
            if vig is None:
                # Try to compute from odds
                over_odds = opportunity.get("overOdds") or opportunity.get("odds")
                under_odds = opportunity.get("underOdds")
                
                if over_odds and under_odds:
                    # Convert American odds to implied probabilities
                    over_implied = self._american_to_implied(over_odds)
                    under_implied = self._american_to_implied(under_odds)
                    vig = (over_implied + under_implied - 1) * 100
                else:
                    return None
            
            # Lower vig = higher score
            if vig <= 2.0:
                score = 100  # Excellent vig
            elif vig <= 4.0:
                score = 80   # Good vig
            elif vig <= 6.0:
                score = 60   # Average vig
            elif vig <= 8.0:
                score = 40   # Poor vig
            else:
                score = 20   # Very poor vig
            
            return SignalFactor(
                name="vig",
                value=score,
                weight=self.weights["vig"],
                description=f"Vig: {vig:.2f}%"
            )
            
        except Exception as e:
            logger.debug(f"Could not compute vig factor: {e}")
            return None
    
    def _compute_book_diversity_factor(self, opportunity: Dict[str, Any]) -> Optional[SignalFactor]:
        """Compute bookmaker diversity factor."""
        try:
            num_bookmakers = opportunity.get("numBookmakers", 1)
            bookmakers = opportunity.get("bookmakers", [])
            
            if bookmakers:
                num_bookmakers = len(bookmakers)
            
            # More bookmakers = higher score (more market validation)
            if num_bookmakers >= 8:
                score = 100
            elif num_bookmakers >= 6:
                score = 85
            elif num_bookmakers >= 4:
                score = 70
            elif num_bookmakers >= 2:
                score = 55
            else:
                score = 30
            
            return SignalFactor(
                name="book_diversity",
                value=score,
                weight=self.weights["book_diversity"],
                description=f"Available at {num_bookmakers} bookmakers"
            )
            
        except Exception as e:
            logger.debug(f"Could not compute book diversity factor: {e}")
            return None
    
    def _american_to_implied(self, american_odds: int) -> float:
        """Convert American odds to implied probability."""
        if american_odds > 0:
            return 100 / (american_odds + 100)
        else:
            return abs(american_odds) / (abs(american_odds) + 100)


# Global service instance
smart_signals_service = SmartSignalsService()