"""
Expected Value (EV) Calculation Service
Comprehensive EV calculation engine integrating bankroll management, Kelly criterion,
valuation engine, and prediction systems for optimal betting recommendations.
"""

import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Union
from enum import Enum

import numpy as np
from pydantic import BaseModel

from backend.services.bankroll_service import bankroll_service, BetRecommendation
from backend.services.advanced_kelly_engine import get_kelly_engine, KellyVariant
from backend.services.valuation.valuation_engine import valuation_engine
from backend.services.valuation.payout import (
    compute_expected_value,
    get_default_payout_schema,
    convert_american_to_decimal,
    implied_probability_from_odds
)
from backend.services.calculations import calculate_prop_edge, calculate_prop_confidence
from backend.services.enhanced_ml_service import enhanced_ml_service
from backend.utils.enhanced_logging import get_logger

logger = get_logger("ev_calculation_service")


class EVCalculationMethod(Enum):
    """Methods for calculating expected value"""
    KELLY_CRITERION = "kelly_criterion"
    VALUATION_ENGINE = "valuation_engine"
    PROP_EDGE = "prop_edge"
    ENSEMBLE = "ensemble"


class EVConfidenceLevel(Enum):
    """Confidence levels for EV calculations"""
    VERY_LOW = "very_low"      # < 0.02 EV
    LOW = "low"               # 0.02 - 0.05 EV
    MODERATE = "moderate"     # 0.05 - 0.10 EV
    HIGH = "high"             # 0.10 - 0.20 EV
    VERY_HIGH = "very_high"   # > 0.20 EV


class EVFilterCriteria(BaseModel):
    """Criteria for filtering bets by EV"""
    min_ev: float = 0.02      # Minimum expected value threshold
    min_confidence: float = 0.6  # Minimum confidence threshold
    max_risk: float = 0.25    # Maximum risk per bet (% of bankroll)
    sports: Optional[List[str]] = None  # Filter by sports
    bet_types: Optional[List[str]] = None  # Filter by bet types
    max_bets: int = 10        # Maximum number of recommendations


@dataclass
class EVCalculationResult:
    """Comprehensive EV calculation result"""
    bet_id: str
    sport: str
    game: str
    bet_type: str
    description: str

    # Core EV metrics
    expected_value: float
    expected_value_pct: float  # EV as percentage
    confidence_score: float
    confidence_level: EVConfidenceLevel

    # Probability and odds
    true_probability: float
    implied_probability: float
    offered_odds: float
    decimal_odds: float

    # Kelly criterion results
    kelly_fraction: float
    recommended_stake: float
    recommended_stake_pct: float

    # Risk metrics
    risk_of_ruin: float
    edge: float
    volatility_score: float

    # Calculation metadata
    calculation_method: EVCalculationMethod
    calculation_timestamp: datetime
    reasoning: List[str]

    # Additional context
    player_stats: Optional[Dict[str, Any]] = None
    game_context: Optional[Dict[str, Any]] = None
    market_data: Optional[Dict[str, Any]] = None


class EVCalculationService:
    """
    Comprehensive Expected Value calculation service
    Integrates multiple calculation methods for optimal betting recommendations
    """

    def __init__(self):
        self.kelly_engine = get_kelly_engine()
        self.min_ev_threshold = 0.02  # 2% minimum edge
        self.min_confidence_threshold = 0.6  # 60% minimum confidence
        self.max_bet_size_pct = 0.25  # 25% of bankroll max

    async def calculate_comprehensive_ev(
        self,
        bet_data: Dict[str, Any],
        bankroll: float = 1000.0,
        method: EVCalculationMethod = EVCalculationMethod.ENSEMBLE
    ) -> Optional[EVCalculationResult]:
        """
        Calculate comprehensive expected value using multiple methods

        Args:
            bet_data: Betting opportunity data
            bankroll: Current bankroll amount
            method: EV calculation method to use

        Returns:
            EVCalculationResult or None if calculation fails
        """
        try:
            # Extract bet data
            bet_id = bet_data.get("bet_id", f"{bet_data.get('sport', 'unknown')}_{datetime.now().timestamp()}")
            sport = bet_data.get("sport", "Unknown")
            game = bet_data.get("game", "Unknown Game")
            bet_type = bet_data.get("bet_type", "moneyline")
            description = bet_data.get("description", f"{bet_type} bet")

            # Get odds and convert to decimal
            offered_odds = bet_data.get("odds", -110)
            decimal_odds = convert_american_to_decimal(offered_odds) if isinstance(offered_odds, int) else offered_odds

            # Calculate implied probability
            implied_probability = implied_probability_from_odds(offered_odds, "american")

            # Get ML prediction for true probability
            true_probability = await self._get_true_probability(bet_data)
            if true_probability is None:
                logger.warning(f"Could not get true probability for bet {bet_id}")
                return None

            # Calculate edge
            edge = true_probability - implied_probability

            # Calculate expected value
            expected_value = edge * bankroll * self.max_bet_size_pct
            expected_value_pct = edge

            # Calculate confidence score
            confidence_score = await self._calculate_confidence_score(bet_data, true_probability)

            # Determine confidence level
            confidence_level = self._get_confidence_level(confidence_score)

            # Calculate Kelly criterion
            kelly_result = await self.kelly_engine.calculate_optimal_bet_size(
                await self._create_betting_opportunity(bet_data, true_probability),
                KellyVariant.ADAPTIVE
            )

            # Calculate risk of ruin
            risk_of_ruin = self.kelly_engine.calculate_risk_of_ruin(
                kelly_result.recommended_fraction,
                edge
            )

            # Calculate volatility score
            volatility_score = await self._calculate_volatility_score(bet_data)

            # Generate reasoning
            reasoning = await self._generate_ev_reasoning(
                bet_data, edge, confidence_score, kelly_result
            )

            # Create result
            result = EVCalculationResult(
                bet_id=bet_id,
                sport=sport,
                game=game,
                bet_type=bet_type,
                description=description,
                expected_value=expected_value,
                expected_value_pct=expected_value_pct,
                confidence_score=confidence_score,
                confidence_level=confidence_level,
                true_probability=true_probability,
                implied_probability=implied_probability,
                offered_odds=offered_odds,
                decimal_odds=decimal_odds,
                kelly_fraction=kelly_result.recommended_fraction,
                recommended_stake=kelly_result.recommended_bet_size,
                recommended_stake_pct=kelly_result.bankroll_percentage,
                risk_of_ruin=risk_of_ruin,
                edge=edge,
                volatility_score=volatility_score,
                calculation_method=method,
                calculation_timestamp=datetime.now(),
                reasoning=reasoning,
                player_stats=bet_data.get("player_stats"),
                game_context=bet_data.get("game_context"),
                market_data=bet_data.get("market_data")
            )

            logger.info(f"EV calculation completed for {bet_id}: EV={expected_value_pct:.4f}, Confidence={confidence_score:.2f}")
            return result

        except Exception as e:
            logger.error(f"EV calculation failed for bet {bet_data.get('bet_id', 'unknown')}: {e}")
            return None

    async def calculate_ev_batch(
        self,
        bet_data_list: List[Dict[str, Any]],
        bankroll: float = 1000.0,
        filter_criteria: Optional[EVFilterCriteria] = None
    ) -> List[EVCalculationResult]:
        """
        Calculate EV for multiple bets and apply filtering

        Args:
            bet_data_list: List of betting opportunities
            bankroll: Current bankroll amount
            filter_criteria: Optional filtering criteria

        Returns:
            List of filtered EV calculation results
        """
        try:
            # Calculate EV for all bets
            tasks = [
                self.calculate_comprehensive_ev(bet_data, bankroll)
                for bet_data in bet_data_list
            ]

            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Filter out failed calculations and exceptions
            valid_results = [
                result for result in results
                if isinstance(result, EVCalculationResult) and result is not None
            ]

            # Apply filtering criteria
            if filter_criteria:
                valid_results = self._apply_filter_criteria(valid_results, filter_criteria)

            # Sort by EV and confidence
            valid_results.sort(
                key=lambda x: x.expected_value_pct * x.confidence_score,
                reverse=True
            )

            logger.info(f"EV batch calculation completed: {len(valid_results)}/{len(bet_data_list)} successful")
            return valid_results

        except Exception as e:
            logger.error(f"EV batch calculation failed: {e}")
            return []

    async def get_ev_recommendations(
        self,
        sport: Optional[str] = None,
        bankroll: float = 1000.0,
        filter_criteria: Optional[EVFilterCriteria] = None
    ) -> List[EVCalculationResult]:
        """
        Get EV-based betting recommendations

        Args:
            sport: Optional sport filter
            bankroll: Current bankroll amount
            filter_criteria: Optional filtering criteria

        Returns:
            List of EV-based recommendations
        """
        try:
            # Get betting opportunities from bankroll service
            opportunities = await bankroll_service._get_betting_opportunities(sport or "All")

            # Calculate EV for all opportunities
            ev_results = await self.calculate_ev_batch(opportunities, bankroll, filter_criteria)

            # Convert to BetRecommendation format for compatibility
            recommendations = []
            for ev_result in ev_results:
                recommendation = BetRecommendation(
                    bet_id=ev_result.bet_id,
                    sport=ev_result.sport,
                    game=ev_result.game,
                    bet_type=ev_result.bet_type,
                    description=ev_result.description,
                    odds=ev_result.offered_odds,
                    probability=ev_result.true_probability,
                    expected_value=ev_result.expected_value_pct,
                    kelly_percentage=ev_result.kelly_fraction,
                    recommended_stake=ev_result.recommended_stake,
                    confidence=ev_result.confidence_score,
                    risk_level=ev_result.confidence_level.value,
                    reasoning=ev_result.reasoning
                )
                recommendations.append(recommendation)

            logger.info(f"Generated {len(recommendations)} EV-based recommendations")
            return ev_results

        except Exception as e:
            logger.error(f"Failed to get EV recommendations: {e}")
            return []

    async def _get_true_probability(self, bet_data: Dict[str, Any]) -> Optional[float]:
        """Get true probability estimate from ML models"""
        try:
            # Try enhanced ML service first
            if hasattr(enhanced_ml_service, 'predict_enhanced'):
                prediction = await enhanced_ml_service.predict_enhanced(
                    bet_data.get("sport", "MLB"),
                    bet_data.get("features", {})
                )
                if prediction and "prediction" in prediction:
                    return prediction["prediction"]

            # Fallback to basic prop confidence calculation
            attributes = {
                "player_avg": bet_data.get("player_avg", 0.5),
                "line": bet_data.get("line", 0.0),
                "variance": bet_data.get("variance", 1.0),
                "games_played": bet_data.get("games_played", 10)
            }

            confidence = await calculate_prop_confidence(attributes)
            return confidence

        except Exception as e:
            logger.error(f"Failed to get true probability: {e}")
            return None

    async def _calculate_confidence_score(self, bet_data: Dict[str, Any], true_probability: float) -> float:
        """Calculate confidence score for EV calculation"""
        try:
            # Base confidence on probability certainty
            base_confidence = min(true_probability, 1 - true_probability) * 2

            # Adjust for sample size
            games_played = bet_data.get("games_played", 10)
            sample_confidence = min(games_played / 20.0, 1.0)

            # Adjust for variance
            variance = bet_data.get("variance", 1.0)
            variance_confidence = max(0.1, 1.0 - (variance / 10.0))

            # Combine factors
            confidence_score = (
                base_confidence * 0.5 +
                sample_confidence * 0.3 +
                variance_confidence * 0.2
            )

            return max(0.0, min(1.0, confidence_score))

        except Exception as e:
            logger.error(f"Failed to calculate confidence score: {e}")
            return 0.5

    def _get_confidence_level(self, confidence_score: float) -> EVConfidenceLevel:
        """Determine confidence level from score"""
        if confidence_score >= 0.8:
            return EVConfidenceLevel.VERY_HIGH
        elif confidence_score >= 0.7:
            return EVConfidenceLevel.HIGH
        elif confidence_score >= 0.6:
            return EVConfidenceLevel.MODERATE
        elif confidence_score >= 0.5:
            return EVConfidenceLevel.LOW
        else:
            return EVConfidenceLevel.VERY_LOW

    async def _calculate_volatility_score(self, bet_data: Dict[str, Any]) -> float:
        """Calculate volatility score for the bet"""
        try:
            variance = bet_data.get("variance", 1.0)
            mean = bet_data.get("player_avg", 0.0)

            if mean <= 0:
                return 1.0

            # Volatility = sqrt(variance) / mean
            volatility = (variance ** 0.5) / mean

            # Cap at reasonable maximum
            return min(volatility, 5.0)

        except Exception as e:
            logger.error(f"Failed to calculate volatility score: {e}")
            return 1.0

    async def _create_betting_opportunity(self, bet_data: Dict[str, Any], true_probability: float):
        """Create BettingOpportunity object for Kelly engine"""
        from backend.services.advanced_kelly_engine import BettingOpportunity

        return BettingOpportunity(
            opportunity_id=bet_data.get("bet_id", "unknown"),
            description=bet_data.get("description", "Betting opportunity"),
            sport=bet_data.get("sport", "Unknown"),
            market_type=bet_data.get("bet_type", "moneyline"),
            offered_odds=float(bet_data.get("odds", -110)),
            true_probability=true_probability,
            confidence_interval=(max(0, true_probability - 0.1), min(1, true_probability + 0.1)),
            max_bet_limit=bet_data.get("max_bet_limit", 1000),
            sportsbook=bet_data.get("sportsbook", "Unknown"),
            expires_at=datetime.now() + timedelta(hours=24)
        )

    async def _generate_ev_reasoning(
        self,
        bet_data: Dict[str, Any],
        edge: float,
        confidence_score: float,
        kelly_result
    ) -> List[str]:
        """Generate reasoning for EV calculation"""
        reasoning = []

        # Edge reasoning
        if edge > 0.05:
            reasoning.append(".2%")
        elif edge > 0.02:
            reasoning.append(".2%")
        else:
            reasoning.append(".2%")

        # Confidence reasoning
        if confidence_score > 0.8:
            reasoning.append(".1%")
        elif confidence_score > 0.7:
            reasoning.append(".1%")
        elif confidence_score > 0.6:
            reasoning.append(".1%")

        # Kelly reasoning
        if kelly_result.recommended_fraction > 0.05:
            reasoning.append(".1%")
        elif kelly_result.recommended_fraction > 0.02:
            reasoning.append(".1%")

        # Risk reasoning
        if kelly_result.risk_of_ruin < 0.1:
            reasoning.append("Low risk of ruin (<10%)")
        elif kelly_result.risk_of_ruin < 0.25:
            reasoning.append("Moderate risk of ruin (<25%)")

        return reasoning

    def _apply_filter_criteria(
        self,
        results: List[EVCalculationResult],
        criteria: EVFilterCriteria
    ) -> List[EVCalculationResult]:
        """Apply filtering criteria to EV results"""
        filtered = []

        for result in results:
            # EV threshold
            if result.expected_value_pct < criteria.min_ev:
                continue

            # Confidence threshold
            if result.confidence_score < criteria.min_confidence:
                continue

            # Risk threshold
            if result.recommended_stake_pct > criteria.max_risk:
                continue

            # Sport filter
            if criteria.sports and result.sport not in criteria.sports:
                continue

            # Bet type filter
            if criteria.bet_types and result.bet_type not in criteria.bet_types:
                continue

            filtered.append(result)

        # Limit number of results
        return filtered[:criteria.max_bets]


# Global EV calculation service instance
ev_calculation_service = EVCalculationService()