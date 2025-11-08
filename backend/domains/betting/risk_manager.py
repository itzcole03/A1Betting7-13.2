"""Risk management."""

from typing import Dict, Any

class RiskManager:
    """
    Phase 4: Advanced risk management for real money betting
    """

    def __init__(self):
        self.daily_loss_limit = 0.05  # Max 5% daily loss
        self.session_bet_limit = 0.25  # Max 25% of bankroll in active bets
        self.consecutive_loss_limit = 3  # Stop after 3 consecutive losses

    def assess_bet_risk(
        self,
        bet_recommendation,
        bankroll,
        daily_pnl=0,
        active_bets=0,
        recent_results=None,
    ):
        """Comprehensive risk assessment for betting recommendation"""
        recent_results = recent_results or []

        # Check daily loss limit
        if daily_pnl < -(bankroll * self.daily_loss_limit):
            return self._block_bet("Daily loss limit reached")

        # Check session bet limit
        if active_bets > (bankroll * self.session_bet_limit):
            return self._block_bet("Too many active bets")

        # Check consecutive losses
        consecutive_losses = self._count_consecutive_losses(recent_results)
        if consecutive_losses >= self.consecutive_loss_limit:
            return self._block_bet("Consecutive loss limit reached")

        # All checks passed
        return {
            "approved": True,
            "risk_score": self._calculate_risk_score(bet_recommendation, bankroll),
            "adjusted_bet_size": bet_recommendation["bet_amount"],
            "risk_factors": {
                "daily_pnl": daily_pnl,
                "active_bets": active_bets,
                "consecutive_losses": consecutive_losses,
            },
        }

    def _block_bet(self, reason):
        """Block bet due to risk management"""
        return {
            "approved": False,
            "reason": reason,
            "risk_score": 1.0,
            "adjusted_bet_size": 0.0,
        }

    def _count_consecutive_losses(self, recent_results):
        """Count consecutive losses from recent results"""
        consecutive = 0
        for result in reversed(recent_results[-10:]):  # Check last 10 bets
            if result == "loss":
                consecutive += 1
            else:
                break
        return consecutive

    def _calculate_risk_score(self, bet_recommendation, bankroll):
        """Calculate overall risk score (0 = low risk, 1 = high risk)"""
        confidence_risk = 1 - bet_recommendation["confidence"]
        size_risk = bet_recommendation["bet_amount"] / bankroll
        ev_risk = max(0, 0.1 - bet_recommendation["expected_value"])

        return (confidence_risk + size_risk + ev_risk) / 3


# Phase 4: Initialize advanced ML and betting components (after class definitions)
try:
    core_ml_engine = CoreMLEngine(ml_loader)
    betting_analyzer = BettingAnalyzer()
    risk_manager = RiskManager()
    logger.info("🚀 Phase 4: Advanced betting components initialized successfully")
except Exception as e:
    logger.error(f"Phase 4: Component initialization error: {e}")
    # Fallback to basic components
    core_ml_engine = None
    betting_analyzer = None
    risk_manager = None


# Phase 4: Enhanced Betting Recommendations API
