"""
Bankroll Management and Betting Features Service
Implements Kelly Criterion, bet tracking, portfolio optimization, and risk management.
"""

import asyncio
import math
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from pydantic import BaseModel

from backend.services.enhanced_ml_service import enhanced_ml_service
from backend.services.user_auth_service import user_auth_service
from backend.utils.enhanced_logging import get_logger

logger = get_logger("bankroll_service")


class BetRecommendation(BaseModel):
    """Bet recommendation model"""

    bet_id: str
    sport: str
    game: str
    bet_type: str
    description: str
    odds: float
    probability: float
    expected_value: float
    kelly_percentage: float
    recommended_stake: float
    confidence: float
    risk_level: str
    reasoning: List[str]


class PortfolioOptimization(BaseModel):
    """Portfolio optimization model"""

    total_allocation: float
    max_risk: float
    expected_return: float
    sharpe_ratio: float
    recommendations: List[BetRecommendation]
    diversification_score: float
    correlation_matrix: Dict[str, Dict[str, float]]


class BankrollStatus(BaseModel):
    """Bankroll status model"""

    current_balance: float
    starting_balance: float
    total_wagered: float
    total_winnings: float
    net_profit: float
    roi_percentage: float
    win_rate: float
    average_odds: float
    largest_win: float
    largest_loss: float
    current_streak: int
    longest_winning_streak: int
    risk_of_ruin: float


class RiskMetrics(BaseModel):
    """Risk metrics model"""

    value_at_risk_95: float
    value_at_risk_99: float
    expected_shortfall: float
    maximum_drawdown: float
    volatility: float
    beta: float
    alpha: float
    information_ratio: float


class BankrollManagementService:
    """Service for bankroll management and betting optimization"""

    def __init__(self):
        self.default_bankroll = 1000.0
        self.max_bet_percentage = 0.25  # Max 25% of bankroll on single bet
        self.min_edge_threshold = 0.02  # Minimum 2% edge for bet consideration
        self.risk_free_rate = 0.02  # 2% annual risk-free rate

    async def initialize(self):
        """Initialize bankroll management service"""
        try:
            logger.info("Bankroll management service initialized")
        except Exception as e:
            logger.error(f"Failed to initialize bankroll service: {e}")
            raise

    async def calculate_kelly_criterion(
        self, probability: float, odds: float, bankroll: float
    ) -> Dict[str, Any]:
        """Calculate Kelly Criterion bet sizing"""
        try:
            # Convert American odds to decimal
            if odds > 0:
                decimal_odds = (odds / 100) + 1
            else:
                decimal_odds = (100 / abs(odds)) + 1

            # Kelly formula: f = (bp - q) / b
            # where b = odds-1, p = probability, q = 1-p
            b = decimal_odds - 1
            p = probability
            q = 1 - p

            # Kelly percentage
            kelly_percentage = (b * p - q) / b

            # Apply safety margin (quarter Kelly for conservative approach)
            conservative_kelly = kelly_percentage * 0.25

            # Ensure we don't exceed maximum bet percentage
            final_percentage = min(conservative_kelly, self.max_bet_percentage)

            # Calculate recommended stake
            recommended_stake = max(0, bankroll * final_percentage)

            # Calculate expected value
            expected_value = (probability * (decimal_odds - 1)) - (1 - probability)

            return {
                "kelly_percentage": kelly_percentage,
                "conservative_kelly": conservative_kelly,
                "final_percentage": final_percentage,
                "recommended_stake": recommended_stake,
                "expected_value": expected_value,
                "decimal_odds": decimal_odds,
                "edge": expected_value,
                "should_bet": expected_value > self.min_edge_threshold
                and final_percentage > 0,
            }

        except Exception as e:
            logger.error(f"Error calculating Kelly criterion: {e}")
            return {
                "kelly_percentage": 0,
                "recommended_stake": 0,
                "expected_value": 0,
                "should_bet": False,
                "error": str(e),
            }

    async def generate_bet_recommendations(
        self, user_id: str, sport: str = None
    ) -> List[BetRecommendation]:
        """Generate personalized bet recommendations"""
        try:
            # Get user preferences and bankroll
            user_data = await self._get_user_betting_data(user_id)
            bankroll = user_data.get("bankroll", self.default_bankroll)
            risk_tolerance = user_data.get("risk_tolerance", "medium")

            # Get available betting opportunities
            opportunities = await self._get_betting_opportunities(sport)

            recommendations = []

            for opp in opportunities:
                # Get ML prediction for this opportunity
                prediction = await self._get_ml_prediction(opp)

                if prediction and prediction.get("confidence", 0) > 0.7:
                    # Calculate Kelly sizing
                    kelly_calc = await self.calculate_kelly_criterion(
                        prediction["prediction"], opp["odds"], bankroll
                    )

                    if kelly_calc["should_bet"]:
                        # Adjust for risk tolerance
                        adjusted_stake = self._adjust_for_risk_tolerance(
                            kelly_calc["recommended_stake"], risk_tolerance
                        )

                        recommendation = BetRecommendation(
                            bet_id=opp["id"],
                            sport=opp["sport"],
                            game=opp["game"],
                            bet_type=opp["bet_type"],
                            description=opp["description"],
                            odds=opp["odds"],
                            probability=prediction["prediction"],
                            expected_value=kelly_calc["expected_value"],
                            kelly_percentage=kelly_calc["kelly_percentage"],
                            recommended_stake=adjusted_stake,
                            confidence=prediction["confidence"],
                            risk_level=self._calculate_risk_level(
                                kelly_calc["kelly_percentage"]
                            ),
                            reasoning=self._generate_reasoning(
                                opp, prediction, kelly_calc
                            ),
                        )

                        recommendations.append(recommendation)

            # Sort by expected value and confidence
            recommendations.sort(
                key=lambda x: x.expected_value * x.confidence, reverse=True
            )

            # Limit to top 10 recommendations
            return recommendations[:10]

        except Exception as e:
            logger.error(f"Error generating bet recommendations: {e}")
            return []

    async def optimize_portfolio(
        self,
        user_id: str,
        recommendations: List[BetRecommendation],
        max_allocation: float = None,
    ) -> PortfolioOptimization:
        """Optimize betting portfolio using modern portfolio theory"""
        try:
            if not recommendations:
                return self._empty_portfolio()

            user_data = await self._get_user_betting_data(user_id)
            bankroll = user_data.get("bankroll", self.default_bankroll)

            if max_allocation is None:
                max_allocation = bankroll * 0.50  # Max 50% of bankroll

            # Calculate correlation matrix
            correlation_matrix = await self._calculate_bet_correlations(recommendations)

            # Optimize portfolio weights
            optimized_weights = self._optimize_portfolio_weights(
                recommendations, correlation_matrix, max_allocation
            )

            # Apply weights to recommendations
            optimized_recommendations = []
            total_allocation = 0

            for i, rec in enumerate(recommendations):
                if optimized_weights[i] > 0:
                    optimized_stake = optimized_weights[i] * max_allocation

                    # Update recommendation with optimized stake
                    rec.recommended_stake = optimized_stake
                    optimized_recommendations.append(rec)
                    total_allocation += optimized_stake

            # Calculate portfolio metrics
            expected_return = sum(
                rec.expected_value * rec.recommended_stake
                for rec in optimized_recommendations
            )

            portfolio_variance = self._calculate_portfolio_variance(
                optimized_recommendations, correlation_matrix
            )

            sharpe_ratio = (expected_return - self.risk_free_rate) / math.sqrt(
                portfolio_variance
            )
            diversification_score = self._calculate_diversification_score(
                optimized_recommendations
            )

            return PortfolioOptimization(
                total_allocation=total_allocation,
                max_risk=math.sqrt(portfolio_variance),
                expected_return=expected_return,
                sharpe_ratio=sharpe_ratio,
                recommendations=optimized_recommendations,
                diversification_score=diversification_score,
                correlation_matrix=correlation_matrix,
            )

        except Exception as e:
            logger.error(f"Error optimizing portfolio: {e}")
            return self._empty_portfolio()

    async def get_bankroll_status(self, user_id: str) -> BankrollStatus:
        """Get current bankroll status and statistics"""
        try:
            # Get user betting history
            betting_history = await self._get_user_betting_history(user_id)

            if not betting_history:
                return self._default_bankroll_status()

            # Calculate metrics
            df = pd.DataFrame(betting_history)

            current_balance = (
                df["balance_after"].iloc[-1] if not df.empty else self.default_bankroll
            )
            starting_balance = (
                df["balance_before"].iloc[0] if not df.empty else self.default_bankroll
            )
            total_wagered = df["stake"].sum()
            total_winnings = df["payout"].sum()
            net_profit = total_winnings - total_wagered

            roi_percentage = (
                (net_profit / total_wagered * 100) if total_wagered > 0 else 0
            )
            win_rate = (df["outcome"] == "win").mean() * 100 if not df.empty else 0
            average_odds = df["odds"].mean() if not df.empty else 0

            largest_win = (
                df[df["outcome"] == "win"]["profit"].max()
                if not df[df["outcome"] == "win"].empty
                else 0
            )
            largest_loss = (
                df[df["outcome"] == "loss"]["profit"].min()
                if not df[df["outcome"] == "loss"].empty
                else 0
            )

            # Calculate streaks
            current_streak, longest_winning_streak = self._calculate_streaks(df)

            # Calculate risk of ruin
            risk_of_ruin = self._calculate_risk_of_ruin(df, current_balance)

            return BankrollStatus(
                current_balance=current_balance,
                starting_balance=starting_balance,
                total_wagered=total_wagered,
                total_winnings=total_winnings,
                net_profit=net_profit,
                roi_percentage=roi_percentage,
                win_rate=win_rate,
                average_odds=average_odds,
                largest_win=largest_win,
                largest_loss=largest_loss,
                current_streak=current_streak,
                longest_winning_streak=longest_winning_streak,
                risk_of_ruin=risk_of_ruin,
            )

        except Exception as e:
            logger.error(f"Error getting bankroll status: {e}")
            return self._default_bankroll_status()

    async def calculate_risk_metrics(self, user_id: str) -> RiskMetrics:
        """Calculate comprehensive risk metrics"""
        try:
            betting_history = await self._get_user_betting_history(user_id)

            if not betting_history:
                return self._default_risk_metrics()

            df = pd.DataFrame(betting_history)
            returns = df["profit"].values if not df.empty else np.array([0])

            # Value at Risk calculations
            var_95 = np.percentile(returns, 5)
            var_99 = np.percentile(returns, 1)

            # Expected Shortfall (Conditional VaR)
            es_95 = (
                returns[returns <= var_95].mean()
                if len(returns[returns <= var_95]) > 0
                else 0
            )

            # Maximum Drawdown
            cumulative = np.cumsum(returns)
            running_max = np.maximum.accumulate(cumulative)
            drawdown = cumulative - running_max
            max_drawdown = drawdown.min()

            # Volatility
            volatility = np.std(returns) if len(returns) > 1 else 0

            # Market beta and alpha (simplified)
            beta = self._calculate_beta(returns)
            alpha = np.mean(returns) - (self.risk_free_rate * beta)

            # Information ratio
            excess_returns = returns - self.risk_free_rate
            information_ratio = (
                np.mean(excess_returns) / np.std(excess_returns)
                if np.std(excess_returns) > 0
                else 0
            )

            return RiskMetrics(
                value_at_risk_95=var_95,
                value_at_risk_99=var_99,
                expected_shortfall=es_95,
                maximum_drawdown=max_drawdown,
                volatility=volatility,
                beta=beta,
                alpha=alpha,
                information_ratio=information_ratio,
            )

        except Exception as e:
            logger.error(f"Error calculating risk metrics: {e}")
            return self._default_risk_metrics()

    # Helper methods

    async def _get_user_betting_data(self, user_id: str) -> Dict[str, Any]:
        """Get user betting preferences and bankroll"""
        # This would integrate with user_auth_service
        return {
            "bankroll": 1000.0,
            "risk_tolerance": "medium",
            "max_bet_size": 100.0,
            "favorite_sports": ["NFL", "NBA"],
        }

    async def _get_betting_opportunities(
        self, sport: str = None
    ) -> List[Dict[str, Any]]:
        """Get current betting opportunities"""
        # Mock data - would integrate with real odds APIs
        opportunities = [
            {
                "id": "nfl_001",
                "sport": "NFL",
                "game": "Chiefs vs Bills",
                "bet_type": "moneyline",
                "description": "Kansas City Chiefs to win",
                "odds": -150,
            },
            {
                "id": "nba_001",
                "sport": "NBA",
                "game": "Lakers vs Warriors",
                "bet_type": "spread",
                "description": "Lakers -2.5",
                "odds": -110,
            },
            {
                "id": "mlb_001",
                "sport": "MLB",
                "game": "Yankees vs Red Sox",
                "bet_type": "total",
                "description": "Over 9.5 runs",
                "odds": -105,
            },
        ]

        if sport:
            opportunities = [opp for opp in opportunities if opp["sport"] == sport]

        return opportunities

    async def _get_ml_prediction(
        self, opportunity: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Get ML prediction for betting opportunity"""
        try:
            # Sample features for the opportunity
            features = {
                "home_team_rating": 1600,
                "away_team_rating": 1550,
                "home_advantage": 0.1,
            }

            prediction = await enhanced_ml_service.predict_enhanced(
                opportunity["sport"], features
            )

            return prediction

        except Exception as e:
            logger.error(f"Error getting ML prediction: {e}")
            return None

    def _adjust_for_risk_tolerance(self, stake: float, risk_tolerance: str) -> float:
        """Adjust stake based on user's risk tolerance"""
        multipliers = {
            "conservative": 0.5,
            "moderate": 0.75,
            "medium": 1.0,
            "aggressive": 1.25,
            "high": 1.5,
        }

        multiplier = multipliers.get(risk_tolerance, 1.0)
        return stake * multiplier

    def _calculate_risk_level(self, kelly_percentage: float) -> str:
        """Calculate risk level based on Kelly percentage"""
        if kelly_percentage <= 0.02:
            return "very_low"
        elif kelly_percentage <= 0.05:
            return "low"
        elif kelly_percentage <= 0.10:
            return "medium"
        elif kelly_percentage <= 0.20:
            return "high"
        else:
            return "very_high"

    def _generate_reasoning(
        self, opportunity: Dict, prediction: Dict, kelly_calc: Dict
    ) -> List[str]:
        """Generate reasoning for bet recommendation"""
        reasoning = []

        if kelly_calc["expected_value"] > 0.05:
            reasoning.append(
                f"Strong positive expected value: {kelly_calc['expected_value']:.2%}"
            )

        if prediction["confidence"] > 0.8:
            reasoning.append(f"High model confidence: {prediction['confidence']:.1%}")

        if kelly_calc["kelly_percentage"] > 0.02:
            reasoning.append(
                f"Kelly Criterion suggests {kelly_calc['kelly_percentage']:.1%} allocation"
            )

        reasoning.append(f"Predicted probability: {prediction['prediction']:.1%}")

        return reasoning

    async def _calculate_bet_correlations(
        self, recommendations: List[BetRecommendation]
    ) -> Dict[str, Dict[str, float]]:
        """Calculate correlation matrix for bets"""
        # Simplified correlation calculation
        # In practice, this would analyze game correlations, player correlations, etc.

        n_bets = len(recommendations)
        correlation_matrix = {}

        for i, bet1 in enumerate(recommendations):
            correlation_matrix[bet1.bet_id] = {}
            for j, bet2 in enumerate(recommendations):
                if i == j:
                    correlation = 1.0
                elif bet1.sport == bet2.sport and bet1.game == bet2.game:
                    correlation = 0.8  # Same game bets are highly correlated
                elif bet1.sport == bet2.sport:
                    correlation = 0.3  # Same sport bets have moderate correlation
                else:
                    correlation = 0.1  # Different sports have low correlation

                correlation_matrix[bet1.bet_id][bet2.bet_id] = correlation

        return correlation_matrix

    def _optimize_portfolio_weights(
        self,
        recommendations: List[BetRecommendation],
        correlation_matrix: Dict,
        max_allocation: float,
    ) -> List[float]:
        """Optimize portfolio weights using mean-variance optimization"""
        n_bets = len(recommendations)

        if n_bets == 0:
            return []

        # Simple equal-weight allocation for now
        # In practice, this would use quadratic programming to optimize
        equal_weight = 1.0 / n_bets

        # Adjust weights based on expected value and confidence
        weights = []
        total_score = sum(
            rec.expected_value * rec.confidence for rec in recommendations
        )

        for rec in recommendations:
            if total_score > 0:
                weight = (rec.expected_value * rec.confidence) / total_score
            else:
                weight = equal_weight
            weights.append(weight)

        # Normalize weights
        weight_sum = sum(weights)
        if weight_sum > 0:
            weights = [w / weight_sum for w in weights]
        else:
            weights = [equal_weight] * n_bets

        return weights

    def _calculate_portfolio_variance(
        self, recommendations: List[BetRecommendation], correlation_matrix: Dict
    ) -> float:
        """Calculate portfolio variance"""
        if not recommendations:
            return 0.0

        # Simplified variance calculation
        # Assumes each bet has similar variance
        individual_variance = 0.1  # 10% variance per bet

        total_variance = 0
        for i, bet1 in enumerate(recommendations):
            for j, bet2 in enumerate(recommendations):
                weight1 = bet1.recommended_stake
                weight2 = bet2.recommended_stake
                correlation = correlation_matrix.get(bet1.bet_id, {}).get(
                    bet2.bet_id, 0
                )

                if i == j:
                    total_variance += weight1 * weight2 * individual_variance
                else:
                    total_variance += (
                        weight1 * weight2 * correlation * individual_variance
                    )

        return total_variance

    def _calculate_diversification_score(
        self, recommendations: List[BetRecommendation]
    ) -> float:
        """Calculate portfolio diversification score"""
        if not recommendations:
            return 0.0

        # Count unique sports and bet types
        sports = set(rec.sport for rec in recommendations)
        bet_types = set(rec.bet_type for rec in recommendations)

        # Score based on diversity
        sport_diversity = min(len(sports) / 4, 1.0)  # Max 4 sports
        bet_type_diversity = min(len(bet_types) / 3, 1.0)  # Max 3 bet types

        return (sport_diversity + bet_type_diversity) / 2

    async def _get_user_betting_history(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user betting history"""
        # Mock data - would integrate with database
        return [
            {
                "bet_id": "1",
                "stake": 50,
                "odds": -110,
                "outcome": "win",
                "payout": 95.45,
                "profit": 45.45,
                "balance_before": 1000,
                "balance_after": 1045.45,
                "date": datetime.now() - timedelta(days=1),
            },
            {
                "bet_id": "2",
                "stake": 25,
                "odds": 150,
                "outcome": "loss",
                "payout": 0,
                "profit": -25,
                "balance_before": 1045.45,
                "balance_after": 1020.45,
                "date": datetime.now(),
            },
        ]

    def _calculate_streaks(self, df: pd.DataFrame) -> Tuple[int, int]:
        """Calculate current streak and longest winning streak"""
        if df.empty:
            return 0, 0

        # Current streak
        current_streak = 0
        longest_winning_streak = 0
        current_winning_streak = 0

        for outcome in df["outcome"].iloc[::-1]:  # Reverse to start from most recent
            if current_streak == 0:
                current_streak = 1 if outcome == "win" else -1
            elif (outcome == "win" and current_streak > 0) or (
                outcome == "loss" and current_streak < 0
            ):
                current_streak += 1 if outcome == "win" else -1
            else:
                break

        # Longest winning streak
        for outcome in df["outcome"]:
            if outcome == "win":
                current_winning_streak += 1
                longest_winning_streak = max(
                    longest_winning_streak, current_winning_streak
                )
            else:
                current_winning_streak = 0

        return current_streak, longest_winning_streak

    def _calculate_risk_of_ruin(
        self, df: pd.DataFrame, current_balance: float
    ) -> float:
        """Calculate risk of ruin probability"""
        if df.empty or current_balance <= 0:
            return 1.0

        # Simplified risk of ruin calculation
        avg_bet_size = df["stake"].mean()
        win_rate = (df["outcome"] == "win").mean()

        if win_rate <= 0.5 or avg_bet_size <= 0:
            return 1.0

        # Number of bets until ruin
        bets_to_ruin = current_balance / avg_bet_size

        # Risk of ruin approximation
        if win_rate > 0.5:
            q_over_p = (1 - win_rate) / win_rate
            risk_of_ruin = q_over_p**bets_to_ruin
        else:
            risk_of_ruin = 1.0

        return min(risk_of_ruin, 1.0)

    def _calculate_beta(self, returns: np.ndarray) -> float:
        """Calculate beta (simplified - assumes market return is 0)"""
        if len(returns) < 2:
            return 1.0

        # Simplified beta calculation
        variance = np.var(returns)
        if variance > 0:
            return min(variance / 0.01, 2.0)  # Cap beta at 2.0
        else:
            return 1.0

    def _empty_portfolio(self) -> PortfolioOptimization:
        """Return empty portfolio optimization"""
        return PortfolioOptimization(
            total_allocation=0.0,
            max_risk=0.0,
            expected_return=0.0,
            sharpe_ratio=0.0,
            recommendations=[],
            diversification_score=0.0,
            correlation_matrix={},
        )

    def _default_bankroll_status(self) -> BankrollStatus:
        """Return default bankroll status"""
        return BankrollStatus(
            current_balance=self.default_bankroll,
            starting_balance=self.default_bankroll,
            total_wagered=0.0,
            total_winnings=0.0,
            net_profit=0.0,
            roi_percentage=0.0,
            win_rate=0.0,
            average_odds=0.0,
            largest_win=0.0,
            largest_loss=0.0,
            current_streak=0,
            longest_winning_streak=0,
            risk_of_ruin=0.0,
        )

    def _default_risk_metrics(self) -> RiskMetrics:
        """Return default risk metrics"""
        return RiskMetrics(
            value_at_risk_95=0.0,
            value_at_risk_99=0.0,
            expected_shortfall=0.0,
            maximum_drawdown=0.0,
            volatility=0.0,
            beta=1.0,
            alpha=0.0,
            information_ratio=0.0,
        )


# Global bankroll management service instance
bankroll_service = BankrollManagementService()
