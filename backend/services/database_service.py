"""Minimal DatabaseService shim used by player dashboard tests.

This provides a tiny DatabaseService class so imports succeed. The real
database service lives elsewhere; tests only need the symbol to be importable
and constructible.
"""
from typing import Any, Dict, List, Optional


class DatabaseService:
    """Bare-bones shim of the production database service.

    The class intentionally offers no real DB connections; it provides
    methods that can be safely called in tests if needed (returning simple
    mockable values).
    """

    def __init__(self):
        # No external side effects on construction
        self.connected = False

    def connect(self) -> None:
        self.connected = True

    def close(self) -> None:
        self.connected = False

    async def fetch_player_by_id(self, player_id: str) -> Optional[Dict[str, Any]]:
        # Minimal async-compatible stub; real tests mock DB client methods as needed
        return None

    async def search_players(self, query: str, sport: str, limit: int = 10) -> List[Dict[str, Any]]:
        # Return an empty list by default; tests that need concrete data should
        # monkeypatch this method.
        return []


__all__ = ["DatabaseService"]
