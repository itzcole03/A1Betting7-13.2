"""
Advanced Kelly Criterion Engine with Dynamic Risk Management
Sophisticated betting size optimization with risk controls, portfolio management,
and dynamic parameter adjustment based on performance metrics.
Part of Phase 4.3: Elite Betting Operations and Automation
"""

import asyncio
import json
import logging
import time
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Union
from dataclasses import dataclass, field
from enum import Enum
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class RiskProfile(Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"
    EXTREME = "extreme"

class BetType(Enum):
    MONEYLINE = "moneyline"
    SPREAD = "spread"
    TOTAL = "total"
    PROP = "prop"
    PARLAY = "parlay"
    ARBITRAGE = "arbitrage"

class KellyVariant(Enum):
    CLASSIC = "classic"
    FRACTIONAL = "fractional"
    ADAPTIVE = "adaptive"
    PORTFOLIO = "portfolio"
    MULTI_OUTCOME = "multi_outcome"

@dataclass
class BettingOpportunity:
    """Enhanced betting opportunity for Kelly analysis"""
    opportunity_id: str
    description: str
    sport: str
    market_type: BetType
    offered_odds: float  # decimal odds
    true_probability: float  # estimated probability of winning
    confidence_interval: Tuple[float, float]  # probability confidence range
    max_bet_limit: float
    sportsbook: str
    expires_at: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class KellyResult:
    """Kelly criterion calculation result"""
    opportunity_id: str
    classic_kelly_fraction: float
    recommended_fraction: float
    recommended_bet_size: float
    expected_value: float
    expected_growth_rate: float
    risk_of_ruin: float
    bankroll_percentage: float
    confidence_score: float
    risk_warnings: List[str]
    variant_used: KellyVariant
    calculation_metadata: Dict[str, Any]

@dataclass
class PortfolioMetrics:
    """Portfolio risk and performance metrics"""
    total_bankroll: float
    allocated_capital: float
    available_capital: float
    expected_return: float
    portfolio_variance: float
    sharpe_ratio: float
    max_drawdown: float
    kelly_leverage: float
    correlation_risk: float
    diversification_score: float
    risk_adjusted_kelly: float

@dataclass
class RiskManagementSettings:
    """Risk management configuration"""
    max_bet_percentage: float = 0.1  # Maximum 10% of bankroll per bet
    max_daily_risk: float = 0.25     # Maximum 25% of bankroll at risk per day
    max_total_exposure: float = 0.5   # Maximum 50% of bankroll exposed
    min_edge_threshold: float = 0.02  # Minimum 2% edge required
    min_confidence_threshold: float = 0.7  # Minimum 70% confidence
    kelly_fraction_cap: float = 0.25  # Cap Kelly at 25%
    drawdown_stop_loss: float = 0.2   # Stop betting at 20% drawdown
    correlation_limit: float = 0.7    # Limit correlated bets
    volatility_adjustment: bool = True
    dynamic_sizing: bool = True

class AdvancedKellyEngine:
    """
    Advanced Kelly Criterion engine with sophisticated risk management,
    portfolio optimization, and dynamic parameter adjustment
    """
    
    def __init__(self, initial_bankroll: float = 10000.0):
        self.initial_bankroll = initial_bankroll
        self.current_bankroll = initial_bankroll
        self.betting_history: List[Dict] = []
        self.active_bets: Dict[str, BettingOpportunity] = {}
        self.risk_settings = RiskManagementSettings()
        self.performance_metrics: Dict = {}
        self.correlation_matrix: Optional[np.ndarray] = None
        
        # Dynamic parameters that adjust based on performance
        self.volatility_estimate = 0.2
        self.confidence_factor = 1.0
        self.drawdown_factor = 1.0
        self.streak_factor = 1.0
        
    def calculate_classic_kelly(self, probability: float, odds: float) -> float:
        """Calculate classic Kelly criterion"""
        # Kelly formula: f = (bp - q) / b
        # where b = decimal odds - 1, p = probability, q = 1 - p
        if probability <= 0 or probability >= 1:
            return 0.0
        
        b = odds - 1  # Net odds received
        p = probability
        q = 1 - p
        
        kelly_fraction = (b * p - q) / b
        return max(0, kelly_fraction)  # Never bet negative Kelly
    
    def calculate_fractional_kelly(self, kelly_fraction: float, fraction: float = 0.25) -> float:
        """Calculate fractional Kelly (typically 1/4 Kelly)"""
        return kelly_fraction * fraction
    
    def calculate_adaptive_kelly(self, kelly_fraction: float, opportunity: BettingOpportunity) -> float:
        """Calculate adaptive Kelly based on confidence and recent performance"""
        base_kelly = kelly_fraction
        
        # Adjust for confidence interval width
        prob_low, prob_high = opportunity.confidence_interval
        confidence_width = prob_high - prob_low
        confidence_adjustment = 1 - (confidence_width * 2)  # Wider interval = more conservative
        
        # Adjust for recent performance
        performance_adjustment = self._get_performance_adjustment()
        
        # Adjust for portfolio concentration
        concentration_adjustment = self._get_concentration_adjustment()
        
        # Combine adjustments
        total_adjustment = (
            confidence_adjustment * 
            performance_adjustment * 
            concentration_adjustment * 
            self.confidence_factor
        )
        
        return base_kelly * max(0.1, min(1.0, total_adjustment))
    
    def calculate_portfolio_kelly(self, opportunities: List[BettingOpportunity]) -> Dict[str, float]:
        """Calculate optimal Kelly fractions for portfolio of bets"""
        if not opportunities:
            return {}
        
        # Build expected returns vector
        expected_returns = []
        for opp in opportunities:
            edge = (opp.true_probability * opp.offered_odds) - 1
            expected_returns.append(edge)
        
        expected_returns = np.array(expected_returns)
        
        # Build covariance matrix (simplified)
        n = len(opportunities)
        if self.correlation_matrix is None or self.correlation_matrix.shape[0] != n:
            # Simple correlation model based on sport and market type
            corr_matrix = self._build_correlation_matrix(opportunities)
        else:
            corr_matrix = self.correlation_matrix
        
        # Estimate variances (simplified)
        variances = np.array([self._estimate_bet_variance(opp) for opp in opportunities])
        cov_matrix = np.outer(np.sqrt(variances), np.sqrt(variances)) * corr_matrix
        
        # Portfolio Kelly optimization: f = C^-1 * μ
        try:
            inv_cov = np.linalg.inv(cov_matrix)
            kelly_fractions = inv_cov @ expected_returns
            
            # Apply constraints
            kelly_fractions = np.maximum(0, kelly_fractions)  # No shorting
            total_kelly = np.sum(kelly_fractions)
            
            # Scale down if total Kelly is too high
            max_total_kelly = 0.5  # Maximum 50% of bankroll
            if total_kelly > max_total_kelly:
                kelly_fractions = kelly_fractions * (max_total_kelly / total_kelly)
            
            return {
                opp.opportunity_id: float(kelly_fractions[i]) 
                for i, opp in enumerate(opportunities)
            }
        except np.linalg.LinAlgError:
            # Fallback to individual Kelly calculations
            return {
                opp.opportunity_id: self.calculate_adaptive_kelly(
                    self.calculate_classic_kelly(opp.true_probability, opp.offered_odds),
                    opp
                ) for opp in opportunities
            }
    
    def _build_correlation_matrix(self, opportunities: List[BettingOpportunity]) -> np.ndarray:
        """Build correlation matrix for betting opportunities"""
        n = len(opportunities)
        corr_matrix = np.eye(n)  # Start with identity matrix
        
        for i in range(n):
            for j in range(i + 1, n):
                opp1, opp2 = opportunities[i], opportunities[j]
                
                # Correlation factors
                sport_corr = 0.3 if opp1.sport == opp2.sport else 0.1
                market_corr = 0.2 if opp1.market_type == opp2.market_type else 0.05
                sportsbook_corr = 0.1 if opp1.sportsbook == opp2.sportsbook else 0.0
                
                # Time correlation (same game)
                time_corr = 0.0
                if hasattr(opp1, 'game_id') and hasattr(opp2, 'game_id'):
                    if opp1.metadata.get('game_id') == opp2.metadata.get('game_id'):
                        time_corr = 0.8  # High correlation for same game
                
                total_corr = min(0.9, sport_corr + market_corr + sportsbook_corr + time_corr)
                corr_matrix[i, j] = corr_matrix[j, i] = total_corr
        
        return corr_matrix
    
    def _estimate_bet_variance(self, opportunity: BettingOpportunity) -> float:
        """Estimate variance for a betting opportunity"""
        # Simplified variance estimation
        p = opportunity.true_probability
        odds = opportunity.offered_odds
        
        # Variance of binary outcome
        win_loss_variance = p * (1 - p) * (odds - 1) ** 2
        
        # Add confidence interval uncertainty
        prob_low, prob_high = opportunity.confidence_interval
        uncertainty_variance = ((prob_high - prob_low) / 4) ** 2  # Rough approximation
        
        return win_loss_variance + uncertainty_variance
    
    def _get_performance_adjustment(self) -> float:
        """Get performance-based adjustment factor"""
        if len(self.betting_history) < 10:
            return 1.0  # Not enough history
        
        recent_results = self.betting_history[-20:]  # Last 20 bets
        win_rate = sum(1 for bet in recent_results if bet.get('won', False)) / len(recent_results)
        expected_win_rate = np.mean([bet.get('probability', 0.5) for bet in recent_results])
        
        # Adjust based on actual vs expected performance
        performance_ratio = win_rate / max(0.1, expected_win_rate)
        
        # Conservative adjustment
        if performance_ratio < 0.8:
            return 0.7  # Reduce bet sizes if underperforming
        elif performance_ratio > 1.2:
            return min(1.3, 1 + (performance_ratio - 1) * 0.3)  # Modest increase if overperforming
        else:
            return 1.0
    
    def _get_concentration_adjustment(self) -> float:
        """Get adjustment factor based on portfolio concentration"""
        if not self.active_bets:
            return 1.0
        
        # Calculate concentration in sports/markets
        sport_exposure = {}
        market_exposure = {}
        
        for bet_id, opp in self.active_bets.items():
            sport_exposure[opp.sport] = sport_exposure.get(opp.sport, 0) + 1
            market_exposure[opp.market_type] = market_exposure.get(opp.market_type, 0) + 1
        
        # Calculate concentration score
        total_bets = len(self.active_bets)
        max_sport_concentration = max(sport_exposure.values()) / total_bets if total_bets > 0 else 0
        max_market_concentration = max(market_exposure.values()) / total_bets if total_bets > 0 else 0
        
        concentration_score = max(max_sport_concentration, max_market_concentration)
        
        # Reduce bet sizes if too concentrated
        if concentration_score > 0.6:
            return 0.7
        elif concentration_score > 0.4:
            return 0.85
        else:
            return 1.0
    
    def calculate_risk_of_ruin(self, kelly_fraction: float, edge: float, num_bets: int = 1000) -> float:
        """Calculate probability of losing significant portion of bankroll"""
        if kelly_fraction <= 0 or edge <= 0:
            return 1.0
        
        # Simplified risk of ruin calculation for Kelly betting
        # This is an approximation - exact calculation is complex
        ruin_threshold = 0.5  # 50% drawdown considered "ruin"
        
        # Monte Carlo simulation approach (simplified)
        volatility = self.volatility_estimate
        drift = edge * kelly_fraction
        
        # Risk of ruin approximation
        if drift > 0:
            risk = np.exp(-2 * drift * np.log(1 / ruin_threshold) / (volatility ** 2))
        else:
            risk = 1.0
        
        return min(1.0, max(0.0, risk))
    
    def apply_risk_management(self, kelly_result: KellyResult, opportunity: BettingOpportunity) -> KellyResult:
        """Apply risk management rules and constraints"""
        warnings = []
        
        # Cap at maximum bet percentage
        if kelly_result.bankroll_percentage > self.risk_settings.max_bet_percentage:
            kelly_result.recommended_fraction = self.risk_settings.max_bet_percentage
            kelly_result.bankroll_percentage = self.risk_settings.max_bet_percentage
            warnings.append(f"Bet size capped at {self.risk_settings.max_bet_percentage:.1%} due to risk limits")
        
        # Check minimum edge threshold
        edge = (opportunity.true_probability * opportunity.offered_odds) - 1
        if edge < self.risk_settings.min_edge_threshold:
            kelly_result.recommended_fraction = 0
            kelly_result.bankroll_percentage = 0
            warnings.append(f"Bet rejected: Edge {edge:.2%} below minimum threshold {self.risk_settings.min_edge_threshold:.2%}")
        
        # Check confidence threshold
        prob_low, prob_high = opportunity.confidence_interval
        confidence_width = prob_high - prob_low
        if confidence_width > (1 - self.risk_settings.min_confidence_threshold):
            kelly_result.recommended_fraction *= 0.5
            kelly_result.bankroll_percentage *= 0.5
            warnings.append("Bet size reduced due to low confidence")
        
        # Check daily risk exposure
        daily_exposure = self._calculate_daily_exposure()
        if daily_exposure > self.risk_settings.max_daily_risk:
            kelly_result.recommended_fraction = 0
            kelly_result.bankroll_percentage = 0
            warnings.append("Bet rejected: Daily risk limit exceeded")
        
        # Check total portfolio exposure
        total_exposure = self._calculate_total_exposure()
        if total_exposure > self.risk_settings.max_total_exposure:
            reduction_factor = self.risk_settings.max_total_exposure / total_exposure
            kelly_result.recommended_fraction *= reduction_factor
            kelly_result.bankroll_percentage *= reduction_factor
            warnings.append("Bet size reduced due to portfolio exposure limits")
        
        # Update bet size
        kelly_result.recommended_bet_size = (
            kelly_result.bankroll_percentage * self.current_bankroll
        )
        
        # Apply bet limit constraints
        if kelly_result.recommended_bet_size > opportunity.max_bet_limit:
            kelly_result.recommended_bet_size = opportunity.max_bet_limit
            kelly_result.bankroll_percentage = opportunity.max_bet_limit / self.current_bankroll
            warnings.append("Bet size limited by sportsbook maximum")
        
        kelly_result.risk_warnings = warnings
        return kelly_result
    
    def _calculate_daily_exposure(self) -> float:
        """Calculate current daily risk exposure"""
        today = datetime.now().date()
        daily_bets = [
            bet for bet in self.betting_history 
            if datetime.fromisoformat(bet['timestamp']).date() == today
        ]
        
        total_daily_risk = sum(bet.get('amount', 0) for bet in daily_bets)
        return total_daily_risk / self.current_bankroll
    
    def _calculate_total_exposure(self) -> float:
        """Calculate total portfolio exposure"""
        total_exposure = sum(
            bet.get('amount', 0) for bet in self.betting_history 
            if bet.get('status') == 'active'
        )
        return total_exposure / self.current_bankroll
    
    async def calculate_optimal_bet_size(
        self, 
        opportunity: BettingOpportunity,
        variant: KellyVariant = KellyVariant.ADAPTIVE
    ) -> KellyResult:
        """Calculate optimal bet size using specified Kelly variant"""
        
        # Calculate classic Kelly
        classic_kelly = self.calculate_classic_kelly(
            opportunity.true_probability, 
            opportunity.offered_odds
        )
        
        # Apply variant-specific calculation
        if variant == KellyVariant.CLASSIC:
            recommended_fraction = classic_kelly
        elif variant == KellyVariant.FRACTIONAL:
            recommended_fraction = self.calculate_fractional_kelly(classic_kelly)
        elif variant == KellyVariant.ADAPTIVE:
            recommended_fraction = self.calculate_adaptive_kelly(classic_kelly, opportunity)
        else:
            recommended_fraction = classic_kelly
        
        # Calculate metrics
        edge = (opportunity.true_probability * opportunity.offered_odds) - 1
        expected_value = edge * recommended_fraction * self.current_bankroll
        expected_growth_rate = recommended_fraction * edge
        risk_of_ruin = self.calculate_risk_of_ruin(recommended_fraction, edge)
        
        # Create initial result
        kelly_result = KellyResult(
            opportunity_id=opportunity.opportunity_id,
            classic_kelly_fraction=classic_kelly,
            recommended_fraction=recommended_fraction,
            recommended_bet_size=recommended_fraction * self.current_bankroll,
            expected_value=expected_value,
            expected_growth_rate=expected_growth_rate,
            risk_of_ruin=risk_of_ruin,
            bankroll_percentage=recommended_fraction,
            confidence_score=self._calculate_confidence_score(opportunity),
            risk_warnings=[],
            variant_used=variant,
            calculation_metadata={
                'edge': edge,
                'true_probability': opportunity.true_probability,
                'offered_odds': opportunity.offered_odds,
                'confidence_interval': opportunity.confidence_interval,
                'bankroll': self.current_bankroll,
                'volatility_estimate': self.volatility_estimate
            }
        )
        
        # Apply risk management
        kelly_result = self.apply_risk_management(kelly_result, opportunity)
        
        return kelly_result
    
    def _calculate_confidence_score(self, opportunity: BettingOpportunity) -> float:
        """Calculate confidence score for the betting opportunity"""
        prob_low, prob_high = opportunity.confidence_interval
        confidence_width = prob_high - prob_low
        
        # Base confidence from interval width
        interval_confidence = 1 - (confidence_width * 2)
        
        # Edge magnitude confidence
        edge = (opportunity.true_probability * opportunity.offered_odds) - 1
        edge_confidence = min(1.0, edge * 10)  # Scale edge to confidence
        
        # Time to expiry confidence (closer expiry = lower confidence for line movement)
        time_to_expiry = (opportunity.expires_at - datetime.now()).total_seconds() / 3600
        time_confidence = min(1.0, time_to_expiry / 24)  # Full confidence at 24+ hours
        
        # Combine factors
        overall_confidence = (
            interval_confidence * 0.4 +
            edge_confidence * 0.4 +
            time_confidence * 0.2
        )
        
        return max(0.0, min(1.0, overall_confidence))
    
    async def calculate_portfolio_optimization(
        self, 
        opportunities: List[BettingOpportunity]
    ) -> Dict[str, KellyResult]:
        """Calculate optimal portfolio allocation across multiple opportunities"""
        
        if not opportunities:
            return {}
        
        # Calculate portfolio Kelly fractions
        portfolio_fractions = self.calculate_portfolio_kelly(opportunities)
        
        results = {}
        for opportunity in opportunities:
            kelly_fraction = portfolio_fractions.get(opportunity.opportunity_id, 0)
            
            # Create Kelly result for this opportunity
            edge = (opportunity.true_probability * opportunity.offered_odds) - 1
            expected_value = edge * kelly_fraction * self.current_bankroll
            expected_growth_rate = kelly_fraction * edge
            risk_of_ruin = self.calculate_risk_of_ruin(kelly_fraction, edge)
            
            kelly_result = KellyResult(
                opportunity_id=opportunity.opportunity_id,
                classic_kelly_fraction=self.calculate_classic_kelly(
                    opportunity.true_probability, opportunity.offered_odds
                ),
                recommended_fraction=kelly_fraction,
                recommended_bet_size=kelly_fraction * self.current_bankroll,
                expected_value=expected_value,
                expected_growth_rate=expected_growth_rate,
                risk_of_ruin=risk_of_ruin,
                bankroll_percentage=kelly_fraction,
                confidence_score=self._calculate_confidence_score(opportunity),
                risk_warnings=[],
                variant_used=KellyVariant.PORTFOLIO,
                calculation_metadata={
                    'portfolio_allocation': True,
                    'total_opportunities': len(opportunities),
                    'edge': edge,
                    'bankroll': self.current_bankroll
                }
            )
            
            # Apply risk management
            kelly_result = self.apply_risk_management(kelly_result, opportunity)
            results[opportunity.opportunity_id] = kelly_result
        
        return results
    
    async def get_portfolio_metrics(self) -> PortfolioMetrics:
        """Calculate comprehensive portfolio metrics"""
        if not self.active_bets:
            return PortfolioMetrics(
                total_bankroll=self.current_bankroll,
                allocated_capital=0,
                available_capital=self.current_bankroll,
                expected_return=0,
                portfolio_variance=0,
                sharpe_ratio=0,
                max_drawdown=0,
                kelly_leverage=0,
                correlation_risk=0,
                diversification_score=1.0,
                risk_adjusted_kelly=0
            )
        
        # Calculate allocated capital
        allocated_capital = sum(
            bet.get('amount', 0) for bet in self.betting_history 
            if bet.get('status') == 'active'
        )
        
        # Calculate expected return and variance
        expected_returns = []
        for bet_id, opportunity in self.active_bets.items():
            edge = (opportunity.true_probability * opportunity.offered_odds) - 1
            expected_returns.append(edge)
        
        expected_return = np.mean(expected_returns) if expected_returns else 0
        portfolio_variance = np.var(expected_returns) if len(expected_returns) > 1 else 0
        
        # Calculate Sharpe ratio (simplified)
        risk_free_rate = 0.02  # 2% annual
        sharpe_ratio = (expected_return - risk_free_rate) / np.sqrt(portfolio_variance) if portfolio_variance > 0 else 0
        
        # Calculate max drawdown from history
        max_drawdown = self._calculate_max_drawdown()
        
        # Calculate diversification score
        diversification_score = self._calculate_diversification_score()
        
        return PortfolioMetrics(
            total_bankroll=self.current_bankroll,
            allocated_capital=allocated_capital,
            available_capital=self.current_bankroll - allocated_capital,
            expected_return=expected_return,
            portfolio_variance=portfolio_variance,
            sharpe_ratio=sharpe_ratio,
            max_drawdown=max_drawdown,
            kelly_leverage=allocated_capital / self.current_bankroll,
            correlation_risk=self._calculate_correlation_risk(),
            diversification_score=diversification_score,
            risk_adjusted_kelly=expected_return * diversification_score
        )
    
    def _calculate_max_drawdown(self) -> float:
        """Calculate maximum drawdown from betting history"""
        if len(self.betting_history) < 2:
            return 0.0
        
        bankroll_history = [self.initial_bankroll]
        running_bankroll = self.initial_bankroll
        
        for bet in self.betting_history:
            if bet.get('result') == 'win':
                running_bankroll += bet.get('profit', 0)
            elif bet.get('result') == 'loss':
                running_bankroll -= bet.get('amount', 0)
            bankroll_history.append(running_bankroll)
        
        # Calculate maximum drawdown
        peak = bankroll_history[0]
        max_dd = 0
        
        for value in bankroll_history:
            if value > peak:
                peak = value
            drawdown = (peak - value) / peak
            max_dd = max(max_dd, drawdown)
        
        return max_dd
    
    def _calculate_correlation_risk(self) -> float:
        """Calculate portfolio correlation risk"""
        if len(self.active_bets) < 2:
            return 0.0
        
        opportunities = list(self.active_bets.values())
        corr_matrix = self._build_correlation_matrix(opportunities)
        
        # Average correlation as risk measure
        n = len(opportunities)
        total_corr = np.sum(corr_matrix) - n  # Subtract diagonal
        avg_correlation = total_corr / (n * (n - 1)) if n > 1 else 0
        
        return avg_correlation
    
    def _calculate_diversification_score(self) -> float:
        """Calculate portfolio diversification score"""
        if not self.active_bets:
            return 1.0
        
        # Count unique sports, markets, sportsbooks
        sports = set()
        markets = set()
        sportsbooks = set()
        
        for opportunity in self.active_bets.values():
            sports.add(opportunity.sport)
            markets.add(opportunity.market_type)
            sportsbooks.add(opportunity.sportsbook)
        
        # Score based on diversity
        sport_score = min(1.0, len(sports) / 4)  # Max score at 4+ sports
        market_score = min(1.0, len(markets) / 3)  # Max score at 3+ markets
        sportsbook_score = min(1.0, len(sportsbooks) / 3)  # Max score at 3+ sportsbooks
        
        return (sport_score + market_score + sportsbook_score) / 3


# Global instance
_kelly_engine = None

def get_kelly_engine() -> AdvancedKellyEngine:
    """Get singleton instance of Kelly engine"""
    global _kelly_engine
    if _kelly_engine is None:
        _kelly_engine = AdvancedKellyEngine()
    return _kelly_engine
