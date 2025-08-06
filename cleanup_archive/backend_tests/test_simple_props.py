#!/usr/bin/env python3
"""
Simple test props server to verify frontend integration
"""
import json
from datetime import datetime, timezone
from typing import Any, Dict, List


def generate_test_props() -> List[Dict[str, Any]]:
    """Generate simple test props with real player data"""
    current_time = datetime.now(timezone.utc)

    props = [
        {
            "id": "test_mlb_judge_1",
            "player_name": "Aaron Judge",
            "team": "NYY",
            "position": "OF",
            "sport": "MLB",
            "league": "MLB",
            "stat_type": "Home Runs",
            "line": 1.5,
            "over_odds": -125,
            "under_odds": -105,
            "confidence": 87.5,
            "expected_value": 2.3,
            "kelly_fraction": 0.045,
            "recommendation": "OVER",
            "game_time": (current_time).isoformat(),
            "opponent": "vs LAA",
            "venue": "Yankee Stadium",
            "source": "Test Data",
            "status": "active",
            "updated_at": current_time.isoformat(),
            "ensemble_prediction": 0.62,
            "ensemble_confidence": 87.5,
            "win_probability": 0.575,
            "risk_score": 22.8,
            "source_engines": ["test_engine"],
            "engine_weights": {"test_engine": 1.0},
            "ai_explanation": {
                "explanation": "Aaron Judge has been on fire lately, averaging 1.8 home runs per game over his last 5 games. Against Angels pitching, he has a strong track record with 4 HRs in 8 games this season.",
                "generated_at": current_time.isoformat(),
                "confidence_breakdown": {"statistical_analysis": 87.5},
                "key_factors": ["Hot streak", "Strong vs LAA", "Home field advantage"],
                "risk_level": "low",
            },
            "line_score": 1.5,
            "value_rating": 12.4,
            "kelly_percentage": 4.5,
        },
        {
            "id": "test_mlb_betts_2",
            "player_name": "Mookie Betts",
            "team": "LAD",
            "position": "OF",
            "sport": "MLB",
            "league": "MLB",
            "stat_type": "Total Bases",
            "line": 2.5,
            "over_odds": -110,
            "under_odds": -120,
            "confidence": 82.1,
            "expected_value": 1.8,
            "kelly_fraction": 0.038,
            "recommendation": "OVER",
            "game_time": (current_time).isoformat(),
            "opponent": "vs SD",
            "venue": "Dodger Stadium",
            "source": "Test Data",
            "status": "active",
            "updated_at": current_time.isoformat(),
            "ensemble_prediction": 0.58,
            "ensemble_confidence": 82.1,
            "win_probability": 0.541,
            "risk_score": 26.3,
            "source_engines": ["test_engine"],
            "engine_weights": {"test_engine": 1.0},
            "ai_explanation": {
                "explanation": "Mookie Betts has been consistent with total bases, averaging 2.8 per game. The matchup against Padres pitching is favorable, and he's hitting well at home.",
                "generated_at": current_time.isoformat(),
                "confidence_breakdown": {"statistical_analysis": 82.1},
                "key_factors": [
                    "Consistent performer",
                    "Home advantage",
                    "Good matchup",
                ],
                "risk_level": "low",
            },
            "line_score": 2.5,
            "value_rating": 8.7,
            "kelly_percentage": 3.8,
        },
        {
            "id": "test_wnba_wilson_3",
            "player_name": "A'ja Wilson",
            "team": "LAS",
            "position": "F",
            "sport": "WNBA",
            "league": "WNBA",
            "stat_type": "Points",
            "line": 24.5,
            "over_odds": -115,
            "under_odds": -115,
            "confidence": 79.3,
            "expected_value": 1.5,
            "kelly_fraction": 0.032,
            "recommendation": "OVER",
            "game_time": (current_time).isoformat(),
            "opponent": "vs NY",
            "venue": "Michelob Ultra Arena",
            "source": "Test Data",
            "status": "active",
            "updated_at": current_time.isoformat(),
            "ensemble_prediction": 0.55,
            "ensemble_confidence": 79.3,
            "win_probability": 0.528,
            "risk_score": 29.1,
            "source_engines": ["test_engine"],
            "engine_weights": {"test_engine": 1.0},
            "ai_explanation": {
                "explanation": "A'ja Wilson is averaging 25.2 points per game this season and has gone over 24.5 in 7 of her last 10 games. Strong matchup against Liberty defense.",
                "generated_at": current_time.isoformat(),
                "confidence_breakdown": {"statistical_analysis": 79.3},
                "key_factors": ["Season average", "Recent form", "Matchup advantage"],
                "risk_level": "medium",
            },
            "line_score": 24.5,
            "value_rating": 6.2,
            "kelly_percentage": 3.2,
        },
    ]

    return props


if __name__ == "__main__":
    props = generate_test_props()
    print(json.dumps(props, indent=2))
