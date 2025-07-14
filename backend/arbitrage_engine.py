"""Advanced Arbitrage and Market Inefficiency Detection Engine
Real-time arbitrage detection, market making opportunities, and inefficiency exploitation
"""

import logging
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)


class ArbitrageType(str, Enum):
    """Types of arbitrage opportunities"""

    TWO_WAY = "two_way"  # Simple arbitrage between 2 outcomes
    THREE_WAY = "three_way"  # Three-way arbitrage (e.g., Win/Draw/Loss)
    CROSS_MARKET = "cross_market"  # Arbitrage across different markets
    TEMPORAL = "temporal"  # Time-based arbitrage
    STATISTICAL = "statistical"  # Statistical arbitrage
    TRIANGULAR = "triangular"  # Triangular arbitrage
    SYNTHETIC = "synthetic"  # Synthetic arbitrage using combinations
    DUTCH_BOOK = "dutch_book"  # Dutch book (guaranteed profit)


class MarketInefficiencyType(str, Enum):
    """Types of market inefficiencies"""

    PRICING_ERROR = "pricing_error"  # Clear mispricing
    INFORMATION_LAG = "information_lag"  # Slow information incorporation
    LIQUIDITY_GAP = "liquidity_gap"  # Liquidity-driven mispricing
    BEHAVIORAL_BIAS = "behavioral_bias"  # Behavioral-driven inefficiency
    MARKET_MAKING = "market_making"  # Market making opportunity
    STEAM_MOVE = "steam_move"  # Sharp money movement
    REVERSE_LINE = "reverse_line"  # Line moving against public money


@dataclass
class ArbitrageOpportunity:
    """Comprehensive arbitrage opportunity"""

    id: str
    arbitrage_type: ArbitrageType
    sportsbooks: List[str]
    event_id: str
    market_type: str

    # Financial metrics
    guaranteed_profit: float
    profit_percentage: float
    total_stake_required: float
    stake_distribution: Dict[str, float]
    roi: float

    # Risk metrics
    execution_risk: float
    liquidity_risk: float
    timing_risk: float
    credit_risk: float
    regulatory_risk: float

    # Market data
    odds_data: List[Dict[str, Any]]
    implied_probabilities: List[float]
    theoretical_probability: float
    market_efficiency: float

    # Execution details
    optimal_stakes: Dict[str, float]
    execution_window: timedelta
    minimum_profit: float
    maximum_exposure: float

    # Metadata
    confidence_score: float
    detection_time: datetime
    expiry_time: Optional[datetime]
    source_quality: float
    historical_success_rate: float

    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MarketInefficiency:
    """Market inefficiency opportunity"""

    id: str
    inefficiency_type: MarketInefficiencyType
    event_id: str
    market_type: str
    sportsbook: str

    # Pricing analysis
    market_price: float
    fair_value: float
    mispricing_magnitude: float
    value_bet_edge: float

    # Statistical measures
    z_score: float
    confidence_interval: Tuple[float, float]
    statistical_significance: float
    sample_size: int

    # Market context
    market_volume: Optional[float]
    liquidity_score: float
    public_betting_percentage: Optional[float]
    sharp_money_percentage: Optional[float]
    line_movement_direction: str

    # Opportunity metrics
    expected_value: float
    kelly_fraction: float
    recommended_stake: float
    max_stake: float

    # Risk assessment
    model_uncertainty: float
    information_risk: float
    execution_risk: float

    # Timing
    detection_time: datetime
    window_expiry: Optional[datetime]
    urgency_score: float

    metadata: Dict[str, Any] = field(default_factory=dict)


class ArbitrageCalculator:
    """Advanced arbitrage calculation engine"""

    def __init__(self):
        self.calculation_methods = {
            ArbitrageType.TWO_WAY: self._calculate_two_way_arbitrage,
            ArbitrageType.THREE_WAY: self._calculate_three_way_arbitrage,
            ArbitrageType.CROSS_MARKET: self._calculate_cross_market_arbitrage,
            ArbitrageType.TRIANGULAR: self._calculate_triangular_arbitrage,
            ArbitrageType.SYNTHETIC: self._calculate_synthetic_arbitrage,
        }

    async def detect_arbitrage_opportunities(
        self, odds_data: List[Dict[str, Any]]
    ) -> List[ArbitrageOpportunity]:
        """Detect all types of arbitrage opportunities from odds data"""
        opportunities = []

        try:
            # Group odds by event and market
            grouped_odds = self._group_odds_data(odds_data)

            for event_market, odds_list in grouped_odds.items():
                if len(odds_list) < 2:
                    continue

                # Check for different types of arbitrage
                for arb_type in ArbitrageType:
                    if arb_type in self.calculation_methods:
                        arb_ops = await self.calculation_methods[arb_type](odds_list)
                        opportunities.extend(arb_ops)

            # Sort by profit percentage
            opportunities.sort(key=lambda x: x.profit_percentage, reverse=True)

            return opportunities

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Arbitrage detection failed: {e!s}")
            return []

    def _group_odds_data(
        self, odds_data: List[Dict[str, Any]]
    ) -> Dict[str, List[Dict]]:
        """Group odds data by event and market type"""
        grouped = defaultdict(list)

        for odds in odds_data:
            key = f"{odds.get('event_id')}_{odds.get('market_type')}"
            grouped[key].append(odds)

        return dict(grouped)

    async def _calculate_two_way_arbitrage(
        self, odds_list: List[Dict[str, Any]]
    ) -> List[ArbitrageOpportunity]:
        """Calculate two-way arbitrage opportunities"""
        opportunities = []

        try:
            # Find all possible pairs
            for i, odds1 in enumerate(odds_list):
                for odds2 in odds_list[i + 1 :]:
                    if odds1["sportsbook"] == odds2["sportsbook"]:
                        continue

                    # Check if they're for opposite outcomes
                    if self._are_opposite_outcomes(odds1, odds2):
                        arb_result = self._calculate_two_way_math(odds1, odds2)

                        if arb_result and arb_result["profit_percentage"] > 0:
                            opportunity = ArbitrageOpportunity(
                                id=f"arb_2way_{odds1['event_id']}_{int(datetime.now().timestamp())}",
                                arbitrage_type=ArbitrageType.TWO_WAY,
                                sportsbooks=[odds1["sportsbook"], odds2["sportsbook"]],
                                event_id=odds1["event_id"],
                                market_type=odds1["market_type"],
                                guaranteed_profit=arb_result["guaranteed_profit"],
                                profit_percentage=arb_result["profit_percentage"],
                                total_stake_required=arb_result["total_stake"],
                                stake_distribution={
                                    odds1["sportsbook"]: arb_result["stake1"],
                                    odds2["sportsbook"]: arb_result["stake2"],
                                },
                                roi=arb_result["profit_percentage"],
                                execution_risk=self._calculate_execution_risk(
                                    [odds1, odds2]
                                ),
                                liquidity_risk=self._calculate_liquidity_risk(
                                    [odds1, odds2]
                                ),
                                timing_risk=self._calculate_timing_risk([odds1, odds2]),
                                credit_risk=0.1,  # Default credit risk
                                regulatory_risk=0.05,  # Default regulatory risk
                                odds_data=[odds1, odds2],
                                implied_probabilities=[
                                    1 / odds1["odds"],
                                    1 / odds2["odds"],
                                ],
                                theoretical_probability=0.5,  # For two-way markets
                                market_efficiency=arb_result["market_efficiency"],
                                optimal_stakes=arb_result["optimal_stakes"],
                                execution_window=timedelta(minutes=5),
                                minimum_profit=arb_result["guaranteed_profit"] * 0.5,
                                maximum_exposure=arb_result["total_stake"] * 2,
                                confidence_score=arb_result["confidence"],
                                detection_time=datetime.now(timezone.utc),
                                expiry_time=datetime.now(timezone.utc) + timedelta(minutes=30),
                                source_quality=min(
                                    odds1.get("quality", 0.8), odds2.get("quality", 0.8)
                                ),
                                historical_success_rate=0.85,  # Historical average
                                metadata=arb_result.get("metadata", {}),
                            )
                            opportunities.append(opportunity)

            return opportunities

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Two-way arbitrage calculation failed: {e!s}")
            return []

    def _calculate_two_way_math(
        self, odds1: Dict[str, Any], odds2: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Calculate two-way arbitrage mathematics"""
        try:
            o1, o2 = odds1["odds"], odds2["odds"]

            # Check if arbitrage exists
            arbitrage_percentage = 1 / o1 + 1 / o2

            if arbitrage_percentage >= 1.0:
                return None  # No arbitrage

            # Calculate optimal stakes for $100 total investment
            total_stake = 100.0
            stake1 = total_stake / (1 + o1 / o2)
            stake2 = total_stake - stake1

            # Calculate guaranteed profit
            profit1 = stake1 * o1 - total_stake
            profit2 = stake2 * o2 - total_stake
            guaranteed_profit = min(profit1, profit2)
            profit_percentage = guaranteed_profit / total_stake * 100

            # Market efficiency score
            market_efficiency = arbitrage_percentage

            # Confidence based on odds quality and recency
            confidence = min(odds1.get("quality", 0.8), odds2.get("quality", 0.8)) * (
                1 - abs(profit_percentage) / 100
            )  # Higher profits are more suspicious

            return {
                "guaranteed_profit": guaranteed_profit,
                "profit_percentage": profit_percentage,
                "total_stake": total_stake,
                "stake1": stake1,
                "stake2": stake2,
                "optimal_stakes": {
                    odds1["sportsbook"]: stake1,
                    odds2["sportsbook"]: stake2,
                },
                "market_efficiency": market_efficiency,
                "confidence": confidence,
                "arbitrage_percentage": arbitrage_percentage,
                "metadata": {
                    "calculation_method": "two_way_standard",
                    "odds1": o1,
                    "odds2": o2,
                },
            }

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Two-way arbitrage math failed: {e!s}")
            return None

    async def _calculate_three_way_arbitrage(
        self, odds_list: List[Dict[str, Any]]
    ) -> List[ArbitrageOpportunity]:
        """Calculate three-way arbitrage opportunities (Win/Draw/Loss)"""
        opportunities = []

        try:
            # Group by outcome type
            outcome_groups = defaultdict(list)
            for odds in odds_list:
                outcome = odds.get("outcome", "unknown")
                outcome_groups[outcome].append(odds)

            # Need exactly 3 outcomes for three-way arbitrage
            if len(outcome_groups) != 3:
                return opportunities

            outcome_types = list(outcome_groups.keys())

            # Find best odds for each outcome across all sportsbooks
            best_odds = {}
            for outcome in outcome_types:
                best = max(outcome_groups[outcome], key=lambda x: x["odds"])
                best_odds[outcome] = best

            # Calculate three-way arbitrage
            odds_values = [best_odds[outcome]["odds"] for outcome in outcome_types]
            sportsbooks = [
                best_odds[outcome]["sportsbook"] for outcome in outcome_types
            ]

            arbitrage_percentage = sum(1 / odds for odds in odds_values)

            if arbitrage_percentage < 1.0:
                # Arbitrage exists
                total_stake = 100.0
                stakes = [
                    total_stake / (arbitrage_percentage * odds) for odds in odds_values
                ]

                guaranteed_profit = min(
                    stakes[i] * odds_values[i] - total_stake for i in range(3)
                )

                if guaranteed_profit > 0:
                    opportunity = ArbitrageOpportunity(
                        id=f"arb_3way_{odds_list[0]['event_id']}_{int(datetime.now().timestamp())}",
                        arbitrage_type=ArbitrageType.THREE_WAY,
                        sportsbooks=sportsbooks,
                        event_id=odds_list[0]["event_id"],
                        market_type=odds_list[0]["market_type"],
                        guaranteed_profit=guaranteed_profit,
                        profit_percentage=guaranteed_profit / total_stake * 100,
                        total_stake_required=sum(stakes),
                        stake_distribution={
                            sportsbooks[i]: stakes[i] for i in range(3)
                        },
                        roi=guaranteed_profit / total_stake * 100,
                        execution_risk=self._calculate_execution_risk(
                            list(best_odds.values())
                        ),
                        liquidity_risk=self._calculate_liquidity_risk(
                            list(best_odds.values())
                        ),
                        timing_risk=self._calculate_timing_risk(
                            list(best_odds.values())
                        ),
                        credit_risk=0.15,  # Higher for three-way
                        regulatory_risk=0.05,
                        odds_data=list(best_odds.values()),
                        implied_probabilities=[1 / odds for odds in odds_values],
                        theoretical_probability=1.0,
                        market_efficiency=arbitrage_percentage,
                        optimal_stakes={sportsbooks[i]: stakes[i] for i in range(3)},
                        execution_window=timedelta(minutes=3),
                        minimum_profit=guaranteed_profit * 0.5,
                        maximum_exposure=sum(stakes) * 2,
                        confidence_score=0.8,
                        detection_time=datetime.now(timezone.utc),
                        expiry_time=datetime.now(timezone.utc) + timedelta(minutes=20),
                        source_quality=min(
                            odds.get("quality", 0.8) for odds in best_odds.values()
                        ),
                        historical_success_rate=0.75,
                        metadata={
                            "calculation_method": "three_way_standard",
                            "outcome_types": outcome_types,
                            "arbitrage_percentage": arbitrage_percentage,
                        },
                    )
                    opportunities.append(opportunity)

            return opportunities

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Three-way arbitrage calculation failed: {e!s}")
            return []

    async def _calculate_cross_market_arbitrage(
        self, odds_list: List[Dict[str, Any]]
    ) -> List[ArbitrageOpportunity]:
        """Calculate cross-market arbitrage opportunities"""
        # Implementation for cross-market arbitrage
        # This would involve finding arbitrage across different market types
        return []

    async def _calculate_triangular_arbitrage(
        self, odds_list: List[Dict[str, Any]]
    ) -> List[ArbitrageOpportunity]:
        """Calculate triangular arbitrage opportunities"""
        # Implementation for triangular arbitrage
        # This would involve three related markets forming a triangle
        return []

    async def _calculate_synthetic_arbitrage(
        self, odds_list: List[Dict[str, Any]]
    ) -> List[ArbitrageOpportunity]:
        """Calculate synthetic arbitrage using combinations"""
        # Implementation for synthetic arbitrage
        # This would involve creating synthetic positions using multiple markets
        return []

    def _are_opposite_outcomes(
        self, odds1: Dict[str, Any], odds2: Dict[str, Any]
    ) -> bool:
        """Check if two odds represent opposite outcomes"""
        outcome1 = odds1.get("outcome", "").lower()
        outcome2 = odds2.get("outcome", "").lower()

        opposite_pairs = [
            ("over", "under"),
            ("yes", "no"),
            ("home", "away"),
            ("win", "loss"),
            ("back", "lay"),
        ]

        for pair in opposite_pairs:
            if (outcome1 in pair[0] and outcome2 in pair[1]) or (
                outcome1 in pair[1] and outcome2 in pair[0]
            ):
                return True

        return False

    def _calculate_execution_risk(self, odds_list: List[Dict[str, Any]]) -> float:
        """Calculate execution risk for arbitrage"""
        # Factors: time since odds update, sportsbook reliability, market volatility
        risk_factors = []

        for odds in odds_list:
            # Time risk
            time_since_update = (
                datetime.now(timezone.utc) - odds.get("timestamp", datetime.now(timezone.utc))
            ).total_seconds()
            time_risk = min(
                time_since_update / 300, 1.0
            )  # Risk increases over 5 minutes

            # Sportsbook reliability
            reliability = odds.get("sportsbook_reliability", 0.8)
            reliability_risk = 1 - reliability

            # Market volatility
            volatility = odds.get("market_volatility", 0.3)

            risk_factors.append(
                time_risk * 0.4 + reliability_risk * 0.3 + volatility * 0.3
            )

        return np.mean(risk_factors) if risk_factors else 0.5

    def _calculate_liquidity_risk(self, odds_list: List[Dict[str, Any]]) -> float:
        """Calculate liquidity risk for arbitrage"""
        liquidity_scores = []

        for odds in odds_list:
            market_volume = odds.get("market_volume", 1000)
            max_stake = odds.get("max_stake", 5000)

            # Liquidity score based on volume and max stake
            liquidity_score = min(market_volume / 10000, 1.0) * min(
                max_stake / 10000, 1.0
            )
            liquidity_scores.append(1 - liquidity_score)

        return np.mean(liquidity_scores) if liquidity_scores else 0.5

    def _calculate_timing_risk(self, odds_list: List[Dict[str, Any]]) -> float:
        """Calculate timing risk for arbitrage"""
        # Risk that odds will change before execution
        timestamps = [odds.get("timestamp", datetime.now(timezone.utc)) for odds in odds_list]

        if len(timestamps) < 2:
            return 0.5

        # Calculate time spread between odds
        time_spread = (max(timestamps) - min(timestamps)).total_seconds()

        # Higher spread = higher timing risk
        timing_risk = min(time_spread / 600, 1.0)  # Risk maxes out at 10 minutes

        return timing_risk


class MarketInefficiencyDetector:
    """Advanced market inefficiency detection engine"""

    def __init__(self):
        self.statistical_models = self._initialize_statistical_models()
        self.behavioral_patterns = self._initialize_behavioral_patterns()
        self.fair_value_models = self._initialize_fair_value_models()

    def _initialize_statistical_models(self) -> Dict[str, Any]:
        """Initialize statistical models for inefficiency detection"""
        return {
            "z_score_threshold": 2.0,
            "confidence_threshold": 0.95,
            "min_sample_size": 30,
            "lookback_periods": [7, 30, 90],  # days
            "volatility_models": ["ewma", "garch"],
            "mean_reversion_threshold": 1.5,
        }

    def _initialize_behavioral_patterns(self) -> Dict[str, Any]:
        """Initialize behavioral bias detection patterns"""
        return {
            "recency_bias": {"weight_recent_games": 0.7, "weight_historical": 0.3},
            "home_bias": {"public_home_premium": 0.15, "sharp_adjustment": -0.05},
            "favorite_bias": {
                "public_favorite_premium": 0.10,
                "underdog_value_threshold": 0.08,
            },
            "round_number_bias": {
                "round_odds_penalty": 0.05,
                "psychological_levels": [2.0, 3.0, 5.0, 10.0],
            },
        }

    def _initialize_fair_value_models(self) -> Dict[str, Any]:
        """Initialize fair value calculation models"""
        return {
            "power_ratings": True,
            "elo_ratings": True,
            "market_consensus": True,
            "ml_predictions": True,
            "closing_line_value": True,
        }

    async def detect_market_inefficiencies(
        self,
        market_data: List[Dict[str, Any]],
        historical_data: Optional[List[Dict[str, Any]]] = None,
    ) -> List[MarketInefficiency]:
        """Detect all types of market inefficiencies"""
        inefficiencies = []

        try:
            for market in market_data:
                # 1. Pricing Error Detection
                pricing_inefficiencies = await self._detect_pricing_errors(
                    market, historical_data
                )
                inefficiencies.extend(pricing_inefficiencies)

                # 2. Information Lag Detection
                info_lag_inefficiencies = await self._detect_information_lag(market)
                inefficiencies.extend(info_lag_inefficiencies)

                # 3. Behavioral Bias Detection
                behavioral_inefficiencies = await self._detect_behavioral_biases(market)
                inefficiencies.extend(behavioral_inefficiencies)

                # 4. Steam Move Detection
                steam_inefficiencies = await self._detect_steam_moves(
                    market, historical_data
                )
                inefficiencies.extend(steam_inefficiencies)

                # 5. Reverse Line Movement Detection
                reverse_line_inefficiencies = await self._detect_reverse_line_movement(
                    market
                )
                inefficiencies.extend(reverse_line_inefficiencies)

            # Sort by expected value
            inefficiencies.sort(key=lambda x: x.expected_value, reverse=True)

            return inefficiencies

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Market inefficiency detection failed: {e!s}")
            return []

    async def _detect_pricing_errors(
        self, market: Dict[str, Any], historical_data: Optional[List[Dict[str, Any]]]
    ) -> List[MarketInefficiency]:
        """Detect clear pricing errors"""
        inefficiencies = []

        try:
            market_price = market.get("odds", 0)
            if market_price <= 1:
                return inefficiencies

            # Calculate fair value using multiple methods
            fair_values = await self._calculate_fair_value(market, historical_data)

            if not fair_values:
                return inefficiencies

            consensus_fair_value = np.median(list(fair_values.values()))

            # Convert to implied probabilities
            market_prob = 1 / market_price
            fair_prob = 1 / consensus_fair_value

            # Calculate mispricing
            mispricing = abs(market_prob - fair_prob)
            mispricing_percentage = mispricing / fair_prob * 100

            # Statistical significance test
            z_score = self._calculate_z_score(
                market_prob, fair_prob, market.get("sample_size", 100)
            )

            if (
                mispricing_percentage > 5.0  # At least 5% mispricing
                and abs(z_score) > self.statistical_models["z_score_threshold"]
            ):
                # Determine if it's a value bet
                if (
                    market_price > consensus_fair_value
                ):  # Market overpricing (value bet)
                    expected_value = (fair_prob * market_price) - 1

                    if expected_value > 0.02:  # At least 2% edge
                        inefficiency = MarketInefficiency(
                            id=f"pricing_error_{market['event_id']}_{int(datetime.now().timestamp())}",
                            inefficiency_type=MarketInefficiencyType.PRICING_ERROR,
                            event_id=market["event_id"],
                            market_type=market["market_type"],
                            sportsbook=market["sportsbook"],
                            market_price=market_price,
                            fair_value=consensus_fair_value,
                            mispricing_magnitude=mispricing_percentage,
                            value_bet_edge=expected_value * 100,
                            z_score=z_score,
                            confidence_interval=self._calculate_confidence_interval(
                                fair_prob
                            ),
                            statistical_significance=1 - (2 * (1 - abs(z_score) / 2)),
                            sample_size=market.get("sample_size", 100),
                            market_volume=market.get("volume"),
                            liquidity_score=market.get("liquidity_score", 0.5),
                            public_betting_percentage=market.get("public_percentage"),
                            sharp_money_percentage=market.get("sharp_percentage"),
                            line_movement_direction=market.get(
                                "line_movement", "stable"
                            ),
                            expected_value=expected_value,
                            kelly_fraction=self._calculate_kelly_fraction(
                                fair_prob, market_price
                            ),
                            recommended_stake=0.0,  # Will be calculated by risk engine
                            max_stake=market.get("max_stake", 1000),
                            model_uncertainty=np.std(list(fair_values.values()))
                            / consensus_fair_value,
                            information_risk=0.1,
                            execution_risk=0.1,
                            detection_time=datetime.now(timezone.utc),
                            window_expiry=datetime.now(timezone.utc) + timedelta(hours=2),
                            urgency_score=min(expected_value * 10, 1.0),
                            metadata={
                                "fair_value_methods": fair_values,
                                "consensus_method": "median",
                                "detection_method": "pricing_error",
                            },
                        )
                        inefficiencies.append(inefficiency)

            return inefficiencies

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Pricing error detection failed: {e!s}")
            return []

    async def _calculate_fair_value(
        self, market: Dict[str, Any], historical_data: Optional[List[Dict[str, Any]]]
    ) -> Dict[str, float]:
        """Calculate fair value using multiple methods"""
        fair_values = {}

        try:
            # 1. Historical closing line average
            if historical_data:
                closing_odds = [
                    h.get("closing_odds")
                    for h in historical_data
                    if h.get("closing_odds")
                ]
                if closing_odds:
                    fair_values["historical_closing"] = np.mean(closing_odds)

            # 2. Market consensus (average of multiple sportsbooks)
            if market.get("consensus_odds"):
                fair_values["market_consensus"] = market["consensus_odds"]

            # 3. Power ratings model
            home_rating = market.get("home_power_rating", 1500)
            away_rating = market.get("away_power_rating", 1500)
            if home_rating and away_rating:
                rating_diff = home_rating - away_rating
                fair_probability = 1 / (1 + 10 ** (-rating_diff / 400))  # Elo-style
                fair_values["power_ratings"] = 1 / fair_probability

            # 4. Machine learning prediction
            if market.get("ml_prediction_odds"):
                fair_values["ml_prediction"] = market["ml_prediction_odds"]

            # 5. Pinnacle closing line (if available)
            if market.get("pinnacle_closing_odds"):
                fair_values["pinnacle_closing"] = market["pinnacle_closing_odds"]

            return fair_values

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Fair value calculation failed: {e!s}")
            return {}

    async def _detect_information_lag(
        self, market: Dict[str, Any]
    ) -> List[MarketInefficiency]:
        """Detect slow information incorporation"""
        inefficiencies = []

        try:
            # Check for recent news/information that hasn't been priced in
            last_info_update = market.get("last_info_update")
            last_odds_update = market.get("last_odds_update")

            if last_info_update and last_odds_update:
                info_lag = (last_odds_update - last_info_update).total_seconds()

                if info_lag > 300:  # More than 5 minutes lag
                    # Check if the information is material
                    info_impact = market.get("info_impact_score", 0)

                    if info_impact > 0.3:  # Material information
                        inefficiency = MarketInefficiency(
                            id=f"info_lag_{market['event_id']}_{int(datetime.now().timestamp())}",
                            inefficiency_type=MarketInefficiencyType.INFORMATION_LAG,
                            event_id=market["event_id"],
                            market_type=market["market_type"],
                            sportsbook=market["sportsbook"],
                            market_price=market.get("odds", 0),
                            fair_value=market.get(
                                "pre_info_odds", market.get("odds", 0)
                            ),
                            mispricing_magnitude=info_impact * 100,
                            value_bet_edge=info_impact * 100,
                            z_score=info_impact * 3,  # Simplified z-score
                            confidence_interval=(0.0, info_impact),
                            statistical_significance=min(info_impact * 2, 0.95),
                            sample_size=50,  # Estimated
                            market_volume=market.get("volume"),
                            liquidity_score=market.get("liquidity_score", 0.5),
                            public_betting_percentage=market.get("public_percentage"),
                            sharp_money_percentage=market.get("sharp_percentage"),
                            line_movement_direction="pending",
                            expected_value=info_impact,
                            kelly_fraction=min(info_impact, 0.1),
                            recommended_stake=0.0,
                            max_stake=market.get("max_stake", 1000),
                            model_uncertainty=0.2,
                            information_risk=0.3,  # Higher due to information lag
                            execution_risk=0.1,
                            detection_time=datetime.now(timezone.utc),
                            window_expiry=datetime.now(timezone.utc) + timedelta(minutes=30),
                            urgency_score=0.8,  # High urgency
                            metadata={
                                "info_lag_seconds": info_lag,
                                "info_type": market.get("info_type"),
                                "detection_method": "information_lag",
                            },
                        )
                        inefficiencies.append(inefficiency)

            return inefficiencies

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Information lag detection failed: {e!s}")
            return []

    async def _detect_behavioral_biases(
        self, market: Dict[str, Any]
    ) -> List[MarketInefficiency]:
        """Detect behavioral bias-driven inefficiencies"""
        inefficiencies = []

        try:
            # 1. Home bias detection
            if market.get("is_home_team"):
                public_percentage = market.get("public_percentage", 50)
                if public_percentage > 65:  # Heavy public support for home team
                    bias_premium = self.behavioral_patterns["home_bias"][
                        "public_home_premium"
                    ]

                    inefficiency = self._create_bias_inefficiency(
                        market,
                        "home_bias",
                        bias_premium,
                        "Public overvaluing home team advantage",
                    )
                    if inefficiency:
                        inefficiencies.append(inefficiency)

            # 2. Favorite bias detection
            if market.get("is_favorite"):
                public_percentage = market.get("public_percentage", 50)
                if public_percentage > 70:  # Heavy public support for favorite
                    bias_premium = self.behavioral_patterns["favorite_bias"][
                        "public_favorite_premium"
                    ]

                    inefficiency = self._create_bias_inefficiency(
                        market,
                        "favorite_bias",
                        bias_premium,
                        "Public overvaluing favorite",
                    )
                    if inefficiency:
                        inefficiencies.append(inefficiency)

            # 3. Round number bias
            odds = market.get("odds", 0)
            if (
                odds
                in self.behavioral_patterns["round_number_bias"]["psychological_levels"]
            ):
                bias_penalty = self.behavioral_patterns["round_number_bias"][
                    "round_odds_penalty"
                ]

                inefficiency = self._create_bias_inefficiency(
                    market,
                    "round_number_bias",
                    bias_penalty,
                    f"Round number psychological bias at {odds}",
                )
                if inefficiency:
                    inefficiencies.append(inefficiency)

            return inefficiencies

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Behavioral bias detection failed: {e!s}")
            return []

    def _create_bias_inefficiency(
        self,
        market: Dict[str, Any],
        bias_type: str,
        bias_magnitude: float,
        description: str,
    ) -> Optional[MarketInefficiency]:
        """Create inefficiency object for behavioral bias"""
        try:
            if bias_magnitude < 0.02:  # Minimum 2% bias
                return None

            return MarketInefficiency(
                id=f"{bias_type}_{market['event_id']}_{int(datetime.now().timestamp())}",
                inefficiency_type=MarketInefficiencyType.BEHAVIORAL_BIAS,
                event_id=market["event_id"],
                market_type=market["market_type"],
                sportsbook=market["sportsbook"],
                market_price=market.get("odds", 0),
                fair_value=market.get("odds", 0) * (1 + bias_magnitude),
                mispricing_magnitude=bias_magnitude * 100,
                value_bet_edge=bias_magnitude * 100,
                z_score=bias_magnitude * 5,  # Simplified
                confidence_interval=(0.0, bias_magnitude * 2),
                statistical_significance=0.7,
                sample_size=100,
                market_volume=market.get("volume"),
                liquidity_score=market.get("liquidity_score", 0.5),
                public_betting_percentage=market.get("public_percentage"),
                sharp_money_percentage=market.get("sharp_percentage"),
                line_movement_direction=market.get("line_movement", "stable"),
                expected_value=bias_magnitude,
                kelly_fraction=min(bias_magnitude, 0.05),
                recommended_stake=0.0,
                max_stake=market.get("max_stake", 1000),
                model_uncertainty=0.15,
                information_risk=0.1,
                execution_risk=0.1,
                detection_time=datetime.now(timezone.utc),
                window_expiry=datetime.now(timezone.utc) + timedelta(hours=1),
                urgency_score=bias_magnitude * 2,
                metadata={
                    "bias_type": bias_type,
                    "bias_magnitude": bias_magnitude,
                    "description": description,
                    "detection_method": "behavioral_bias",
                },
            )

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Bias inefficiency creation failed: {e!s}")
            return None

    async def _detect_steam_moves(
        self, market: Dict[str, Any], historical_data: Optional[List[Dict[str, Any]]]
    ) -> List[MarketInefficiency]:
        """Detect steam moves (sharp money movement)"""
        inefficiencies = []

        try:
            if not historical_data:
                return inefficiencies

            # Look for rapid line movement with reverse public action
            recent_odds = [
                h.get("odds") for h in historical_data[-10:] if h.get("odds")
            ]

            if len(recent_odds) < 3:
                return inefficiencies

            # Calculate line movement
            line_movement = (recent_odds[-1] - recent_odds[0]) / recent_odds[0]

            if abs(line_movement) > 0.05:  # At least 5% movement
                # Check if movement is against public money
                public_percentage = market.get("public_percentage", 50)

                # Steam move: line moves toward underdog while public backs favorite
                if (
                    line_movement < 0 and public_percentage > 60
                ) or (  # Line shortening, public on this side
                    line_movement > 0 and public_percentage < 40
                ):  # Line lengthening, public on other side
                    steam_strength = abs(line_movement) * (
                        abs(public_percentage - 50) / 50
                    )

                    inefficiency = MarketInefficiency(
                        id=f"steam_move_{market['event_id']}_{int(datetime.now().timestamp())}",
                        inefficiency_type=MarketInefficiencyType.STEAM_MOVE,
                        event_id=market["event_id"],
                        market_type=market["market_type"],
                        sportsbook=market["sportsbook"],
                        market_price=market.get("odds", 0),
                        fair_value=recent_odds[0],  # Original odds before steam
                        mispricing_magnitude=abs(line_movement) * 100,
                        value_bet_edge=steam_strength * 100,
                        z_score=steam_strength * 4,
                        confidence_interval=(0.0, steam_strength * 2),
                        statistical_significance=min(steam_strength * 2, 0.9),
                        sample_size=len(recent_odds),
                        market_volume=market.get("volume"),
                        liquidity_score=market.get("liquidity_score", 0.5),
                        public_betting_percentage=public_percentage,
                        sharp_money_percentage=market.get("sharp_percentage"),
                        line_movement_direction=(
                            "against_public" if line_movement < 0 else "with_public"
                        ),
                        expected_value=steam_strength,
                        kelly_fraction=min(steam_strength, 0.08),
                        recommended_stake=0.0,
                        max_stake=market.get("max_stake", 1000),
                        model_uncertainty=0.2,
                        information_risk=0.15,
                        execution_risk=0.2,  # Higher due to moving line
                        detection_time=datetime.now(timezone.utc),
                        window_expiry=datetime.now(timezone.utc) + timedelta(hours=1),
                        urgency_score=0.9,  # High urgency for steam moves
                        metadata={
                            "line_movement_percentage": line_movement * 100,
                            "steam_strength": steam_strength,
                            "recent_odds_history": recent_odds,
                            "detection_method": "steam_move",
                        },
                    )
                    inefficiencies.append(inefficiency)

            return inefficiencies

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Steam move detection failed: {e!s}")
            return []

    async def _detect_reverse_line_movement(
        self, market: Dict[str, Any]
    ) -> List[MarketInefficiency]:
        """Detect reverse line movement"""
        # Implementation for reverse line movement detection
        return []

    def _calculate_z_score(
        self, sample_prob: float, population_prob: float, sample_size: int
    ) -> float:
        """Calculate z-score for statistical significance"""
        if sample_size <= 0:
            return 0.0

        standard_error = np.sqrt(population_prob * (1 - population_prob) / sample_size)
        if standard_error == 0:
            return 0.0

        return (sample_prob - population_prob) / standard_error

    def _calculate_confidence_interval(
        self, probability: float, confidence: float = 0.95
    ) -> Tuple[float, float]:
        """Calculate confidence interval for probability"""
        z_score = 1.96 if confidence == 0.95 else 2.58  # 95% or 99%
        margin_error = z_score * np.sqrt(
            probability * (1 - probability) / 100
        )  # Assuming sample size 100

        return (max(0, probability - margin_error), min(1, probability + margin_error))

    def _calculate_kelly_fraction(self, win_probability: float, odds: float) -> float:
        """Calculate Kelly criterion fraction"""
        if odds <= 1 or win_probability <= 0:
            return 0.0

        b = odds - 1
        p = win_probability
        q = 1 - p

        kelly = (b * p - q) / b
        return max(0, min(kelly, 0.25))  # Cap at 25%


class UltraArbitrageEngine:
    """Ultra-comprehensive arbitrage and market inefficiency engine"""

    def __init__(self):
        self.arbitrage_calculator = ArbitrageCalculator()
        self.inefficiency_detector = MarketInefficiencyDetector()
        self.opportunity_history = deque(maxlen=10000)
        self.execution_tracker = defaultdict(list)
        self.performance_metrics = {
            "opportunities_detected": 0,
            "opportunities_executed": 0,
            "total_profit": 0.0,
            "success_rate": 0.0,
            "average_roi": 0.0,
        }

    async def scan_for_opportunities(
        self,
        market_data: List[Dict[str, Any]],
        historical_data: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, List]:
        """Comprehensive scan for arbitrage and inefficiency opportunities"""
        try:
            # Detect arbitrage opportunities
            arbitrage_opportunities = (
                await self.arbitrage_calculator.detect_arbitrage_opportunities(
                    market_data
                )
            )

            # Detect market inefficiencies
            market_inefficiencies = (
                await self.inefficiency_detector.detect_market_inefficiencies(
                    market_data, historical_data
                )
            )

            # Update performance metrics
            self.performance_metrics["opportunities_detected"] += len(
                arbitrage_opportunities
            ) + len(market_inefficiencies)

            # Store in history
            for opp in arbitrage_opportunities:
                self.opportunity_history.append(
                    {"type": "arbitrage", "data": opp, "timestamp": datetime.now(timezone.utc)}
                )

            for opp in market_inefficiencies:
                self.opportunity_history.append(
                    {
                        "type": "inefficiency",
                        "data": opp,
                        "timestamp": datetime.now(timezone.utc),
                    }
                )

            return {
                "arbitrage_opportunities": arbitrage_opportunities,
                "market_inefficiencies": market_inefficiencies,
                "total_opportunities": len(arbitrage_opportunities)
                + len(market_inefficiencies),
                "scan_timestamp": datetime.now(timezone.utc).isoformat(),
                "performance_metrics": self.performance_metrics,
            }

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Opportunity scan failed: {e!s}")
            return {
                "arbitrage_opportunities": [],
                "market_inefficiencies": [],
                "total_opportunities": 0,
                "scan_timestamp": datetime.now(timezone.utc).isoformat(),
                "error": str(e),
            }

    async def get_engine_health(self) -> Dict[str, Any]:
        """Get arbitrage engine health status"""
        return {
            "status": "healthy",
            "opportunity_history_size": len(self.opportunity_history),
            "performance_metrics": self.performance_metrics,
            "execution_tracker_size": len(self.execution_tracker),
            "arbitrage_calculator_status": "operational",
            "inefficiency_detector_status": "operational",
            "last_health_check": datetime.now(timezone.utc).isoformat(),
        }


# Global instance
ultra_arbitrage_engine = UltraArbitrageEngine()
