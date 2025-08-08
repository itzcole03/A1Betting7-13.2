"""
Risk Tools Service - Kelly Criterion calculations and bankroll management
Provides mathematical utilities for optimal bet sizing and risk assessment
"""

import logging
import math
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
import json

logger = logging.getLogger(__name__)

class RiskLevel(Enum):
    """Risk level classification"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EXTREME = "extreme"

@dataclass
class KellyInputs:
    """Input parameters for Kelly Criterion calculation"""
    win_probability: float  # 0.0 to 1.0
    american_odds: int      # e.g., -110, +150
    bankroll: float         # Total bankroll amount
    kelly_fraction: float   # 0.0 to 1.0 (fraction of Kelly to use)
    max_bet_percentage: float = 5.0  # Maximum bet as % of bankroll

@dataclass
class KellyResult:
    """Result of Kelly Criterion calculation"""
    optimal_bet_size: float
    optimal_bet_percentage: float
    expected_value: float
    expected_return_percentage: float
    kelly_percentage: float
    risk_level: RiskLevel
    warnings: List[str]
    recommendations: List[str]
    
    # Additional metrics
    decimal_odds: float
    implied_probability: float
    edge: float  # Expected edge over the market
    volatility_estimate: float
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "optimal_bet_size": round(self.optimal_bet_size, 2),
            "optimal_bet_percentage": round(self.optimal_bet_percentage, 2),
            "expected_value": round(self.expected_value, 2),
            "expected_return_percentage": round(self.expected_return_percentage, 2),
            "kelly_percentage": round(self.kelly_percentage, 2),
            "risk_level": self.risk_level.value,
            "warnings": self.warnings,
            "recommendations": self.recommendations,
            "decimal_odds": round(self.decimal_odds, 3),
            "implied_probability": round(self.implied_probability, 3),
            "edge": round(self.edge, 3),
            "volatility_estimate": round(self.volatility_estimate, 3)
        }

@dataclass
class BankrollSession:
    """Individual betting session record"""
    id: str
    timestamp: datetime
    kelly_inputs: KellyInputs
    kelly_result: KellyResult
    actual_bet_size: Optional[float] = None
    outcome: Optional[str] = None  # 'win', 'loss', 'push'
    profit_loss: Optional[float] = None
    bankroll_after: Optional[float] = None

@dataclass
class BankrollStats:
    """Bankroll performance statistics"""
    total_sessions: int
    win_rate: float
    total_profit_loss: float
    average_bet_size: float
    average_profit_per_bet: float
    roi_percentage: float
    max_drawdown: float
    max_drawdown_percentage: float
    sharpe_ratio: float
    kelly_adherence_score: float  # How closely actual bets followed Kelly recommendations

class RiskToolsService:
    """Service for Kelly Criterion calculations and bankroll management"""
    
    def __init__(self):
        self.sessions_cache: Dict[str, List[BankrollSession]] = {}
        
    def calculate_kelly(self, inputs: KellyInputs) -> KellyResult:
        """
        Calculate optimal bet size using Kelly Criterion
        
        Kelly formula: f* = (bp - q) / b
        where:
        - f* = fraction of bankroll to bet
        - b = net odds (decimal odds - 1)
        - p = probability of winning
        - q = probability of losing (1 - p)
        """
        
        # Input validation
        if not (0 < inputs.win_probability < 1):
            raise ValueError("Win probability must be between 0 and 1")
        
        if inputs.bankroll <= 0:
            raise ValueError("Bankroll must be positive")
        
        if not (0 < inputs.kelly_fraction <= 1):
            raise ValueError("Kelly fraction must be between 0 and 1")
        
        # Convert American odds to decimal odds
        decimal_odds = self._american_to_decimal_odds(inputs.american_odds)
        net_odds = decimal_odds - 1.0  # Net return per dollar
        
        # Calculate implied probability from odds
        implied_probability = 1.0 / decimal_odds
        
        # Calculate edge (true probability - implied probability)
        edge = inputs.win_probability - implied_probability
        
        # Calculate raw Kelly percentage
        p = inputs.win_probability
        q = 1.0 - p
        
        if net_odds <= 0:
            kelly_percentage = 0.0  # Can't bet on negative odds profitably
        else:
            kelly_percentage = (net_odds * p - q) / net_odds
        
        # Apply Kelly fraction
        adjusted_kelly = kelly_percentage * inputs.kelly_fraction
        
        # Apply maximum bet limit
        optimal_bet_percentage = max(0.0, min(adjusted_kelly * 100, inputs.max_bet_percentage))
        
        # Calculate bet size
        optimal_bet_size = (optimal_bet_percentage / 100.0) * inputs.bankroll
        
        # Calculate expected value
        expected_value = (p * net_odds - q) * optimal_bet_size
        expected_return_percentage = (expected_value / optimal_bet_size * 100) if optimal_bet_size > 0 else 0
        
        # Determine risk level
        risk_level = self._determine_risk_level(optimal_bet_percentage, kelly_percentage * 100)
        
        # Generate warnings and recommendations
        warnings, recommendations = self._generate_advice(
            inputs, kelly_percentage * 100, optimal_bet_percentage, edge
        )
        
        # Estimate volatility (simplified model)
        volatility_estimate = self._estimate_volatility(p, net_odds, optimal_bet_percentage / 100)
        
        return KellyResult(
            optimal_bet_size=optimal_bet_size,
            optimal_bet_percentage=optimal_bet_percentage,
            expected_value=expected_value,
            expected_return_percentage=expected_return_percentage,
            kelly_percentage=kelly_percentage * 100,
            risk_level=risk_level,
            warnings=warnings,
            recommendations=recommendations,
            decimal_odds=decimal_odds,
            implied_probability=implied_probability,
            edge=edge,
            volatility_estimate=volatility_estimate
        )
    
    def calculate_fractional_kelly(
        self, 
        inputs: KellyInputs, 
        fractions: List[float]
    ) -> Dict[float, KellyResult]:
        """Calculate Kelly results for multiple fractions"""
        
        results = {}
        
        for fraction in fractions:
            modified_inputs = KellyInputs(
                win_probability=inputs.win_probability,
                american_odds=inputs.american_odds,
                bankroll=inputs.bankroll,
                kelly_fraction=fraction,
                max_bet_percentage=inputs.max_bet_percentage
            )
            
            results[fraction] = self.calculate_kelly(modified_inputs)
        
        return results
    
    def simulate_kelly_outcomes(
        self, 
        inputs: KellyInputs, 
        num_simulations: int = 1000,
        num_bets: int = 100
    ) -> Dict[str, Any]:
        """
        Monte Carlo simulation of Kelly betting outcomes
        
        Simulates multiple betting sequences to estimate:
        - Expected final bankroll
        - Probability of ruin
        - Maximum drawdown distribution
        """
        
        kelly_result = self.calculate_kelly(inputs)
        bet_fraction = kelly_result.optimal_bet_percentage / 100.0
        
        final_bankrolls = []
        max_drawdowns = []
        
        for _ in range(num_simulations):
            bankroll = inputs.bankroll
            peak_bankroll = bankroll
            max_drawdown = 0.0
            
            for _ in range(num_bets):
                bet_size = bankroll * bet_fraction
                
                # Simulate bet outcome
                if self._random_outcome(inputs.win_probability):
                    # Win
                    profit = bet_size * (kelly_result.decimal_odds - 1)
                    bankroll += profit
                else:
                    # Loss
                    bankroll -= bet_size
                
                # Track drawdown
                if bankroll > peak_bankroll:
                    peak_bankroll = bankroll
                
                current_drawdown = (peak_bankroll - bankroll) / peak_bankroll
                max_drawdown = max(max_drawdown, current_drawdown)
                
                # Check for ruin
                if bankroll <= 0:
                    bankroll = 0
                    break
            
            final_bankrolls.append(bankroll)
            max_drawdowns.append(max_drawdown)
        
        # Calculate statistics
        ruin_probability = sum(1 for b in final_bankrolls if b == 0) / num_simulations
        avg_final_bankroll = sum(final_bankrolls) / num_simulations
        median_final_bankroll = sorted(final_bankrolls)[num_simulations // 2]
        avg_max_drawdown = sum(max_drawdowns) / num_simulations
        
        return {
            "num_simulations": num_simulations,
            "num_bets": num_bets,
            "starting_bankroll": inputs.bankroll,
            "avg_final_bankroll": round(avg_final_bankroll, 2),
            "median_final_bankroll": round(median_final_bankroll, 2),
            "ruin_probability": round(ruin_probability, 3),
            "avg_max_drawdown": round(avg_max_drawdown, 3),
            "percentile_outcomes": {
                "p10": round(sorted(final_bankrolls)[num_simulations // 10], 2),
                "p25": round(sorted(final_bankrolls)[num_simulations // 4], 2),
                "p75": round(sorted(final_bankrolls)[3 * num_simulations // 4], 2),
                "p90": round(sorted(final_bankrolls)[9 * num_simulations // 10], 2)
            }
        }
    
    def calculate_optimal_kelly_fraction(
        self, 
        win_probability: float,
        american_odds: int,
        target_max_drawdown: float = 0.2  # 20% max drawdown target
    ) -> float:
        """
        Find optimal Kelly fraction to achieve target maximum drawdown
        
        Uses iterative approach to find fraction that balances growth with risk
        """
        
        # Test different fractions
        test_fractions = [i/100.0 for i in range(5, 101, 5)]  # 5% to 100% in 5% steps
        
        best_fraction = 0.25  # Default quarter Kelly
        
        for fraction in test_fractions:
            inputs = KellyInputs(
                win_probability=win_probability,
                american_odds=american_odds,
                bankroll=1000,  # Use standard bankroll for comparison
                kelly_fraction=fraction
            )
            
            # Run quick simulation
            simulation = self.simulate_kelly_outcomes(inputs, num_simulations=100, num_bets=50)
            
            # If average max drawdown is within target, update best fraction
            if simulation["avg_max_drawdown"] <= target_max_drawdown:
                best_fraction = fraction
            else:
                break  # Drawdown too high, use previous fraction
        
        return best_fraction
    
    def save_session(self, user_id: str, session: BankrollSession) -> None:
        """Save a betting session for tracking"""
        
        if user_id not in self.sessions_cache:
            self.sessions_cache[user_id] = []
        
        # Keep last 100 sessions per user
        self.sessions_cache[user_id] = [session] + self.sessions_cache[user_id][:99]
    
    def get_user_sessions(self, user_id: str, limit: int = 50) -> List[BankrollSession]:
        """Get user's betting sessions"""
        
        return self.sessions_cache.get(user_id, [])[:limit]
    
    def calculate_bankroll_stats(self, user_id: str) -> Optional[BankrollStats]:
        """Calculate comprehensive bankroll statistics for a user"""
        
        sessions = self.get_user_sessions(user_id)
        completed_sessions = [s for s in sessions if s.outcome and s.profit_loss is not None]
        
        if len(completed_sessions) < 2:
            return None
        
        # Basic stats
        total_sessions = len(completed_sessions)
        wins = sum(1 for s in completed_sessions if s.outcome == 'win')
        win_rate = wins / total_sessions
        
        total_profit_loss = sum(s.profit_loss for s in completed_sessions)
        total_bet_amount = sum(s.actual_bet_size for s in completed_sessions if s.actual_bet_size)
        
        avg_bet_size = total_bet_amount / total_sessions if total_sessions > 0 else 0
        avg_profit_per_bet = total_profit_loss / total_sessions
        roi_percentage = (total_profit_loss / total_bet_amount * 100) if total_bet_amount > 0 else 0
        
        # Calculate drawdown
        running_bankroll = completed_sessions[-1].kelly_inputs.bankroll  # Start with initial
        peak_bankroll = running_bankroll
        max_drawdown = 0.0
        
        returns = []
        
        for session in reversed(completed_sessions):  # Chronological order
            running_bankroll += session.profit_loss
            
            if running_bankroll > peak_bankroll:
                peak_bankroll = running_bankroll
            
            current_drawdown = peak_bankroll - running_bankroll
            max_drawdown = max(max_drawdown, current_drawdown)
            
            # Calculate return for Sharpe ratio
            if session.actual_bet_size and session.actual_bet_size > 0:
                bet_return = session.profit_loss / session.actual_bet_size
                returns.append(bet_return)
        
        max_drawdown_percentage = (max_drawdown / peak_bankroll * 100) if peak_bankroll > 0 else 0
        
        # Calculate Sharpe ratio (simplified - using bet returns)
        if len(returns) > 1:
            avg_return = sum(returns) / len(returns)
            return_variance = sum((r - avg_return) ** 2 for r in returns) / (len(returns) - 1)
            return_std = math.sqrt(return_variance)
            sharpe_ratio = (avg_return / return_std) if return_std > 0 else 0
        else:
            sharpe_ratio = 0
        
        # Kelly adherence score
        kelly_adherence_scores = []
        for session in completed_sessions:
            if session.actual_bet_size and session.kelly_result.optimal_bet_size > 0:
                adherence = min(1.0, session.actual_bet_size / session.kelly_result.optimal_bet_size)
                kelly_adherence_scores.append(adherence)
        
        kelly_adherence_score = (sum(kelly_adherence_scores) / len(kelly_adherence_scores) 
                               if kelly_adherence_scores else 0)
        
        return BankrollStats(
            total_sessions=total_sessions,
            win_rate=win_rate,
            total_profit_loss=total_profit_loss,
            average_bet_size=avg_bet_size,
            average_profit_per_bet=avg_profit_per_bet,
            roi_percentage=roi_percentage,
            max_drawdown=max_drawdown,
            max_drawdown_percentage=max_drawdown_percentage,
            sharpe_ratio=sharpe_ratio,
            kelly_adherence_score=kelly_adherence_score
        )
    
    def _american_to_decimal_odds(self, american_odds: int) -> float:
        """Convert American odds to decimal odds"""
        if american_odds > 0:
            return (american_odds / 100.0) + 1.0
        else:
            return (100.0 / abs(american_odds)) + 1.0
    
    def _determine_risk_level(self, bet_percentage: float, kelly_percentage: float) -> RiskLevel:
        """Determine risk level based on bet size"""
        
        if bet_percentage >= 15 or kelly_percentage >= 20:
            return RiskLevel.EXTREME
        elif bet_percentage >= 8 or kelly_percentage >= 12:
            return RiskLevel.HIGH
        elif bet_percentage >= 3 or kelly_percentage >= 6:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW
    
    def _generate_advice(
        self, 
        inputs: KellyInputs, 
        kelly_percentage: float, 
        bet_percentage: float, 
        edge: float
    ) -> Tuple[List[str], List[str]]:
        """Generate warnings and recommendations"""
        
        warnings = []
        recommendations = []
        
        # Warnings
        if edge <= 0:
            warnings.append("Negative expected value - this bet is not mathematically profitable")
        
        if inputs.win_probability < 0.52 and inputs.american_odds > -120:
            warnings.append("Low win probability combined with poor odds creates high risk")
        
        if bet_percentage > 10:
            warnings.append("Very high bet size may lead to significant bankroll volatility")
        
        if inputs.kelly_fraction > 0.5:
            warnings.append("High Kelly fraction increases risk of large drawdowns")
        
        if kelly_percentage > 25:
            warnings.append("Extremely high Kelly percentage suggests potential error in inputs")
        
        if inputs.bankroll < 20 * (bet_percentage / 100 * inputs.bankroll):
            warnings.append("Insufficient bankroll for long-term Kelly strategy sustainability")
        
        # Recommendations
        if edge > 0 and bet_percentage < 1:
            recommendations.append("Small bet size may limit profit potential despite positive edge")
        
        if inputs.kelly_fraction < 0.25 and edge > 0.05:
            recommendations.append("Consider increasing Kelly fraction for higher edge opportunities")
        
        if bet_percentage < 0.5:
            recommendations.append("Very conservative sizing - good for capital preservation")
        
        if 1 <= bet_percentage <= 3:
            recommendations.append("Moderate sizing provides good balance of growth and risk")
        
        if edge > 0.03:
            recommendations.append("Significant edge detected - ensure bet size reflects opportunity")
        
        if inputs.american_odds < -200:
            recommendations.append("Heavy favorites may not provide sufficient value despite high win probability")
        
        return warnings, recommendations
    
    def _estimate_volatility(self, win_prob: float, net_odds: float, bet_fraction: float) -> float:
        """Estimate portfolio volatility using simplified model"""
        
        # Expected return per bet
        expected_return = win_prob * net_odds - (1 - win_prob)
        
        # Variance of single bet outcome
        win_outcome = net_odds
        loss_outcome = -1
        
        variance = (win_prob * (win_outcome - expected_return) ** 2 + 
                   (1 - win_prob) * (loss_outcome - expected_return) ** 2)
        
        # Scale by bet fraction
        portfolio_variance = variance * (bet_fraction ** 2)
        
        return math.sqrt(portfolio_variance)
    
    def _random_outcome(self, win_probability: float) -> bool:
        """Generate random outcome for simulation"""
        import random
        return random.random() < win_probability

# Singleton instance
_risk_tools_service = None

def get_risk_tools_service() -> RiskToolsService:
    """Get singleton risk tools service instance"""
    global _risk_tools_service
    if _risk_tools_service is None:
        _risk_tools_service = RiskToolsService()
    return _risk_tools_service
