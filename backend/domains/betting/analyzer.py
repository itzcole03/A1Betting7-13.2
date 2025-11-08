"""Betting analyzer."""

from typing import Dict, Any, List

class BettingAnalyzer:
    """
    Phase 4: Advanced betting analysis with expected value calculations
    and real money betting recommendations
    """

    def __init__(self):
        self.bankroll_default = 1000.0  # Default bankroll
        self.min_confidence = 0.75  # Minimum confidence for betting
        self.min_expected_value = 0.05  # Minimum 5% expected value
        self.max_bet_percentage = 0.1  # Max 10% of bankroll per bet

    def analyze_betting_opportunity(self, prediction, line, odds=-110, bankroll=None):
        """
        Analyze betting opportunity and generate real money recommendations
        """
        bankroll = bankroll or self.bankroll_default

        # Skip low confidence predictions
        if prediction["confidence"] < self.min_confidence:
            return self._no_bet_recommendation(prediction, "Low confidence")

        # Calculate implied probability from odds
        implied_prob = self._odds_to_probability(odds)

        # Calculate our predicted probability
        our_prob = prediction["confidence"]

        # Calculate expected value
        expected_value = self._calculate_expected_value(our_prob, odds)

        # Skip negative expected value bets
        if expected_value < self.min_expected_value:
            return self._no_bet_recommendation(prediction, "Negative expected value")

        # Calculate optimal bet size using Kelly Criterion
        bet_size = self._kelly_criterion_bet_size(our_prob, odds, bankroll)

        # Generate betting recommendation
        return {
            "recommendation": "BET" if bet_size > 0 else "NO BET",
            "prediction": prediction["prediction"],
            "confidence": prediction["confidence"],
            "bet_amount": round(bet_size, 2),
            "expected_value": round(expected_value, 4),
            "expected_profit": round(bet_size * expected_value, 2),
            "roi_percentage": round(expected_value * 100, 2),
            "risk_level": self._assess_risk_level(
                prediction["confidence"], expected_value
            ),
            "odds": odds,
            "implied_probability": round(implied_prob, 4),
            "our_probability": round(our_prob, 4),
            "edge": round(our_prob - implied_prob, 4),
            "models_used": prediction.get("models_used", []),
            "phase": "phase_4_real_betting",
            "bankroll_percentage": round((bet_size / bankroll) * 100, 2),
        }

    def _odds_to_probability(self, odds):
        """Convert American odds to implied probability"""
        if odds > 0:
            return 100 / (odds + 100)
        else:
            return abs(odds) / (abs(odds) + 100)

    def _calculate_expected_value(self, our_prob, odds):
        """Calculate expected value of the bet"""
        if odds > 0:
            payout_multiplier = odds / 100
        else:
            payout_multiplier = 100 / abs(odds)

        # EV = (probability of win * payout) - (probability of loss * stake)
        expected_value = (our_prob * payout_multiplier) - ((1 - our_prob) * 1)
        return expected_value

    def _kelly_criterion_bet_size(self, our_prob, odds, bankroll):
        """Calculate optimal bet size using Kelly Criterion"""
        if odds > 0:
            decimal_odds = (odds / 100) + 1
        else:
            decimal_odds = (100 / abs(odds)) + 1

        # Kelly Formula: f = (bp - q) / b
        # where b = decimal odds - 1, p = our probability, q = 1 - p
        b = decimal_odds - 1
        p = our_prob
        q = 1 - p

        kelly_fraction = (b * p - q) / b

        # Cap at maximum bet percentage for safety
        kelly_fraction = min(kelly_fraction, self.max_bet_percentage)
        kelly_fraction = max(kelly_fraction, 0)  # No negative bets

        return bankroll * kelly_fraction

    def _assess_risk_level(self, confidence, expected_value):
        """Assess risk level of the betting opportunity"""
        if confidence > 0.85 and expected_value > 0.15:
            return "LOW"
        elif confidence > 0.78 and expected_value > 0.08:
            return "MEDIUM"
        elif confidence > 0.75 and expected_value > 0.05:
            return "HIGH"
        else:
            return "VERY HIGH"

    def _no_bet_recommendation(self, prediction, reason):
        """Generate no-bet recommendation"""
        return {
            "recommendation": "NO BET",
            "reason": reason,
            "prediction": prediction["prediction"],
            "confidence": prediction["confidence"],
            "bet_amount": 0.0,
            "expected_value": 0.0,
            "expected_profit": 0.0,
            "roi_percentage": 0.0,
            "risk_level": "NO RISK",
            "phase": "phase_4_no_bet",
        }


# Phase 4: Risk Manager for Bankroll Management
