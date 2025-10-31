"""
Smart Signals Service - Intelligent betting signal detection and scoring
"""

import json
import logging
from dataclasses import asdict
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from backend.models.smart_signals import (
    SignalComponent,
    SignalRationale,
    SignalStrength,
    SignalType,
    SmartSignal,
    SmartSignalRequest,
    SmartSignalResponse,
)

logger = logging.getLogger("smart_signals")


class SmartSignalsService:
    """Service for detecting and scoring smart betting signals"""

    def __init__(self, db_session: Optional[Session] = None):
        self.db_session = db_session

        # Scoring weights (should sum to 1.0)
        self.component_weights = {
            "ev_score": 0.35,  # Expected value is most important
            "trend_score": 0.25,  # Consistency matters
            "juice_score": 0.20,  # Low juice provides better value
            "line_movement_score": 0.20,  # Favorable movement indicates sharp action
        }

        # Thresholds for signal qualification
        self.min_qualification_score = 70.0
        self.max_signals_per_request = 100

    async def generate_smart_signals(
        self, request: SmartSignalRequest
    ) -> SmartSignalResponse:
        """Generate smart signals based on request parameters"""
        try:
            # For prototype, generate mock signals with realistic scoring
            signals = await self._generate_mock_signals(request)

            # Filter and sort signals
            qualified_signals = [
                s for s in signals if s["overall_score"] >= request.min_score
            ]
            qualified_signals.sort(key=lambda x: x["overall_score"], reverse=True)

            # Limit results
            limited_signals = qualified_signals[: request.limit]

            # Calculate metadata
            total_count = len(signals)
            qualified_count = len(qualified_signals)
            avg_score = (
                sum(s["overall_score"] for s in signals) / len(signals)
                if signals
                else 0
            )
            strongest_signal = qualified_signals[0] if qualified_signals else None

            return SmartSignalResponse(
                signals=limited_signals,
                total_count=total_count,
                qualified_count=qualified_count,
                avg_score=round(avg_score, 1),
                strongest_signal=strongest_signal,
                metadata={
                    "request_sport": request.sport,
                    "min_score_filter": request.min_score,
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                    "score_breakdown": {
                        "very_strong": len(
                            [s for s in signals if s["overall_score"] >= 85]
                        ),
                        "strong": len(
                            [s for s in signals if 75 <= s["overall_score"] < 85]
                        ),
                        "moderate": len(
                            [s for s in signals if 60 <= s["overall_score"] < 75]
                        ),
                        "weak": len([s for s in signals if s["overall_score"] < 60]),
                    },
                },
            )

        except Exception as e:
            logger.error(f"Error generating smart signals: {e}")
            return SmartSignalResponse(
                signals=[],
                total_count=0,
                qualified_count=0,
                avg_score=0.0,
                strongest_signal=None,
                metadata={"error": str(e)},
            )

    async def _generate_mock_signals(self, request: SmartSignalRequest) -> List[dict]:
        """Generate realistic mock signals for prototype"""
        mock_players = [
            {"name": "Aaron Judge", "team": "NYY", "opponent": "BOS"},
            {"name": "Mookie Betts", "team": "LAD", "opponent": "SF"},
            {"name": "Ronald Acuña Jr.", "team": "ATL", "opponent": "PHI"},
            {"name": "Juan Soto", "team": "SD", "opponent": "COL"},
            {"name": "Vladimir Guerrero Jr.", "team": "TOR", "opponent": "TB"},
            {"name": "Mike Trout", "team": "LAA", "opponent": "HOU"},
            {"name": "Freddie Freeman", "team": "LAD", "opponent": "SF"},
            {"name": "Trea Turner", "team": "PHI", "opponent": "ATL"},
            {"name": "Jose Altuve", "team": "HOU", "opponent": "LAA"},
            {"name": "Francisco Lindor", "team": "NYM", "opponent": "WSH"},
        ]

        mock_markets = [
            {"type": "over_under", "stat": "Total Bases", "lines": [1.5, 2.5, 3.5]},
            {"type": "over_under", "stat": "Hits", "lines": [0.5, 1.5, 2.5]},
            {"type": "over_under", "stat": "RBIs", "lines": [0.5, 1.5, 2.5]},
            {"type": "over_under", "stat": "Runs", "lines": [0.5, 1.5]},
            {"type": "over_under", "stat": "Home Runs", "lines": [0.5]},
        ]

        signals = []

        # Generate signals for each player/market combination
        for player in mock_players[:8]:  # Limit to 8 players for prototype
            for market in mock_markets[:3]:  # Limit to 3 markets per player
                for line in market["lines"][:2]:  # Limit to 2 lines per market
                    signal = await self._create_mock_signal(
                        player, market, line, request.sport
                    )
                    if signal["overall_score"] >= 40:  # Only include reasonable signals
                        signals.append(signal)

        return signals

    async def _create_mock_signal(
        self, player: dict, market: dict, line: float, sport: str
    ) -> dict:
        """Create a single mock signal with realistic scoring"""
        import random

        # Generate component scores (0-100)
        ev_score = random.uniform(45, 95)
        trend_score = random.uniform(40, 90)
        juice_score = random.uniform(50, 95)
        line_movement_score = random.uniform(30, 85)

        # Calculate weighted overall score
        overall_score = (
            ev_score * self.component_weights["ev_score"]
            + trend_score * self.component_weights["trend_score"]
            + juice_score * self.component_weights["juice_score"]
            + line_movement_score * self.component_weights["line_movement_score"]
        )

        # Generate supporting data
        ev_percent = (ev_score - 50) * 0.2  # Maps score to EV percentage
        hit_rate = 0.45 + (trend_score / 100) * 0.3  # 45-75% hit rate
        juice_percent = 10 - (juice_score / 100) * 7  # 3-10% juice
        line_movement = (line_movement_score - 50) * 0.02  # -1.0 to +1.0 line movement

        # Generate odds
        base_odds = random.choice([-110, -105, -115, -120, +100, +105])
        over_odds = base_odds + random.randint(-10, 10)
        under_odds = base_odds + random.randint(-10, 10)

        # Generate rationales based on scores
        rationales = []
        if ev_score >= 70:
            rationales.append(f"High EV {ev_percent:.1f}%")
        if trend_score >= 70:
            rationales.append(f"Hitting {hit_rate:.1%} over last 10 games")
        if juice_score >= 75:
            rationales.append(f"Low vig {juice_percent:.1f}%")
        if line_movement_score >= 65 and line_movement > 0:
            rationales.append(f"Line dropped {abs(line_movement):.1f}")
        elif line_movement_score >= 65 and line_movement < 0:
            rationales.append(f"Line moved favorably {abs(line_movement):.1f}")

        # Ensure at least one rationale
        if not rationales:
            rationales.append("Positive expected value detected")

        # Determine signal strength
        if overall_score >= 85:
            strength = SignalStrength.VERY_STRONG.value
        elif overall_score >= 75:
            strength = SignalStrength.STRONG.value
        elif overall_score >= 60:
            strength = SignalStrength.MODERATE.value
        else:
            strength = SignalStrength.WEAK.value

        # Determine signal types
        signal_types = []
        if ev_score >= 70:
            signal_types.append(SignalType.HIGH_EV.value)
        if trend_score >= 70:
            signal_types.append(SignalType.CONSISTENT_TREND.value)
        if juice_score >= 75:
            signal_types.append(SignalType.LOW_JUICE.value)
        if line_movement_score >= 65:
            signal_types.append(SignalType.FAVORABLE_LINE_MOVEMENT.value)

        return {
            "id": f"signal_{random.randint(1000, 9999)}",
            "sport": sport,
            "game_id": f"game_{random.randint(100, 999)}",
            "player_name": player["name"],
            "team": player["team"],
            "opponent": player["opponent"],
            "market_type": market["type"],
            "stat_type": market["stat"],
            "line": line,
            "over_odds": over_odds,
            "under_odds": under_odds,
            "sportsbook": random.choice(["DraftKings", "FanDuel", "BetMGM", "Caesars"]),
            "overall_score": round(overall_score, 1),
            "signal_strength": strength,
            "signal_types": signal_types,
            "ev_score": round(ev_score, 1),
            "trend_score": round(trend_score, 1),
            "juice_score": round(juice_score, 1),
            "line_movement_score": round(line_movement_score, 1),
            "expected_value_percent": round(ev_percent, 1),
            "hit_rate_trend": round(hit_rate, 3),
            "juice_percent": round(juice_percent, 1),
            "line_movement": round(line_movement, 1),
            "rationales": rationales,
            "component_breakdown": {
                "ev_component": {
                    "score": round(ev_score, 1),
                    "weight": self.component_weights["ev_score"],
                    "contribution": round(
                        ev_score * self.component_weights["ev_score"], 1
                    ),
                },
                "trend_component": {
                    "score": round(trend_score, 1),
                    "weight": self.component_weights["trend_score"],
                    "contribution": round(
                        trend_score * self.component_weights["trend_score"], 1
                    ),
                },
                "juice_component": {
                    "score": round(juice_score, 1),
                    "weight": self.component_weights["juice_score"],
                    "contribution": round(
                        juice_score * self.component_weights["juice_score"], 1
                    ),
                },
                "line_movement_component": {
                    "score": round(line_movement_score, 1),
                    "weight": self.component_weights["line_movement_score"],
                    "contribution": round(
                        line_movement_score
                        * self.component_weights["line_movement_score"],
                        1,
                    ),
                },
            },
            "is_active": True,
            "is_qualified": overall_score >= self.min_qualification_score,
            "strength_level": strength,
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=4)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    def calculate_signal_score(self, components: List[SignalComponent]) -> float:
        """Calculate weighted signal score from components"""
        total_score = 0.0
        total_weight = 0.0

        for component in components:
            weighted_score = component.score * component.weight
            total_score += weighted_score
            total_weight += component.weight

        # Normalize to 0-100 scale
        if total_weight > 0:
            return min(100.0, max(0.0, total_score / total_weight))
        return 0.0

    def generate_rationales(self, components: List[SignalComponent]) -> List[str]:
        """Generate human-readable rationales from signal components"""
        rationales = []

        for component in components:
            if component.score >= 70:  # Only include strong components
                rationales.append(component.rationale)

        return rationales

    async def save_signal(self, signal_data: dict) -> Optional[SmartSignal]:
        """Save a smart signal to database"""
        if not self.db_session:
            return None

        try:
            signal = SmartSignal(
                sport=signal_data["sport"],
                game_id=signal_data["game_id"],
                player_name=signal_data.get("player_name"),
                market_type=signal_data["market_type"],
                stat_type=signal_data.get("stat_type"),
                line=signal_data.get("line"),
                over_odds=signal_data.get("over_odds"),
                under_odds=signal_data.get("under_odds"),
                sportsbook=signal_data.get("sportsbook"),
                overall_score=signal_data["overall_score"],
                signal_strength=signal_data["signal_strength"],
                signal_types=json.dumps(signal_data.get("signal_types", [])),
                ev_score=signal_data.get("ev_score"),
                trend_score=signal_data.get("trend_score"),
                juice_score=signal_data.get("juice_score"),
                line_movement_score=signal_data.get("line_movement_score"),
                expected_value_percent=signal_data.get("expected_value_percent"),
                hit_rate_trend=signal_data.get("hit_rate_trend"),
                juice_percent=signal_data.get("juice_percent"),
                line_movement=signal_data.get("line_movement"),
                rationales=json.dumps(signal_data.get("rationales", [])),
                component_breakdown=json.dumps(signal_data.get("component_breakdown")),
                is_active=True,
            )

            self.db_session.add(signal)
            self.db_session.commit()
            return signal

        except Exception as e:
            logger.error(f"Error saving signal: {e}")
            self.db_session.rollback()
            return None

    async def get_active_signals(
        self, sport: Optional[str] = None, min_score: float = 70.0
    ) -> List[SmartSignal]:
        """Get active signals from database"""
        if not self.db_session:
            return []

        try:
            query = self.db_session.query(SmartSignal).filter(
                SmartSignal.is_active == True, SmartSignal.overall_score >= min_score
            )

            if sport:
                query = query.filter(SmartSignal.sport == sport)

            return query.order_by(SmartSignal.overall_score.desc()).all()

        except Exception as e:
            logger.error(f"Error fetching signals: {e}")
            return []


# Global service instance
smart_signals_service = SmartSignalsService()
