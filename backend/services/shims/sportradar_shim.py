"""Minimal SportRadar shim for tests.

Provides deterministic method signatures used in the codebase. Real
integration tests should use the real client; unit tests can import this shim.
"""
from typing import Dict, Any, List


class SportRadarShim:
    def __init__(self, api_key: str = "test-key"):
        self.api_key = api_key

    async def fetch_game_schedule(self, sport: str, date: str) -> List[Dict[str, Any]]:
        # Return a small deterministic schedule
        return [
            {"game_id": 1, "home": "HomeTeam", "away": "AwayTeam", "date": date, "sport": sport}
        ]

    async def fetch_odds_for_game(self, game_id: int) -> Dict[str, Any]:
        return {"game_id": game_id, "odds": [{"bookmaker": "MockBook", "line": -110}]}
