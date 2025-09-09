"""
Synthetic variants for end-to-end smart signals:
- NBA high-value opportunity should pass threshold
- MLB poor-value opportunity should be filtered out by threshold

Each writes a JSON summary if SYNTHETIC_REPORT_DIR is provided.
"""
import json
import os
from pathlib import Path
from typing import Any, Dict

import pytest
from unittest.mock import patch


def _write_summary(name: str, payload: Dict[str, Any]) -> None:
    out_dir = os.getenv("SYNTHETIC_REPORT_DIR")
    if not out_dir:
        print(json.dumps({"name": name, **payload}, indent=2, sort_keys=True))
        return
    p = Path(out_dir)
    p.mkdir(parents=True, exist_ok=True)
    f = p / f"{name}.json"
    f.write_text(json.dumps(payload, indent=2, sort_keys=True))


@pytest.fixture(scope="module")
def client():
    with patch.dict(os.environ, {"ENABLE_SMART_SIGNALS": "true"}, clear=False):
        from fastapi.testclient import TestClient
        from backend.core.app import create_app
        from backend.services.smart_signals import smart_signals_service

        smart_signals_service.enabled = True
        app = create_app()
        yield TestClient(app)


@pytest.mark.asyncio
async def test_nba_high_value_signal(monkeypatch, client):
    from backend.services.simple_propfinder_service import SimplePropFinderService

    async def fake_get_opportunities(self, filters=None):  # type: ignore
        return {
            "opportunities": [
                {
                    "id": "nba_superstar_points_999",
                    "player": "Super Star",
                    "team": "LAL",
                    "opponent": "DEN",
                    "sport": "NBA",
                    "market": "Points",
                    "opening_line": 25.5,
                    "line": 27.0,
                    "line_movement": 1.5,
                    "movement_direction": "favorable",
                    "odds": -102,
                    "edge": 10.5,
                    "ev_percent": 10.5,
                    "vig": 2.8,
                    "hasArbitrage": True,
                    "arbitrageProfitPct": 3.2,
                    "numBookmakers": 5,
                    "bookmakers": [
                        {"name": "DK", "odds": -102, "line": 27.0},
                        {"name": "FD", "odds": +110, "line": 26.5},
                        {"name": "CZ", "odds": -108, "line": 27.0},
                        {"name": "MG", "odds": -105, "line": 27.0},
                        {"name": "PB", "odds": -110, "line": 27.0},
                    ],
                    "confidence": 84.0,
                }
            ]
        }

    monkeypatch.setattr(SimplePropFinderService, "get_opportunities", fake_get_opportunities, raising=True)

    resp = client.get("/api/signals/smart", params={"sport": "NBA", "min_score": 75, "limit": 10})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    opps = data.get("opportunities", [])
    assert len(opps) == 1
    top = opps[0]
    assert top.get("sport") == "NBA"
    assert top.get("smartScore", 0) >= 75

    payload = {
        "request": {"sport": "NBA", "min_score": 75, "limit": 10},
        "counts": {"total": data.get("total_count"), "filtered": data.get("filtered_count")},
        "top_smartScore": top.get("smartScore"),
        "top_factors": sorted([f.get("name") for f in top.get("signalFactors", [])]),
    }
    _write_summary("nba_high_value_signal", payload)


@pytest.mark.asyncio
async def test_mlb_poor_value_filtered(monkeypatch, client):
    from backend.services.simple_propfinder_service import SimplePropFinderService

    async def fake_get_opportunities(self, filters=None):  # type: ignore
        return {
            "opportunities": [
                {
                    "id": "mlb_low_ev_001",
                    "player": "Cold Bat",
                    "team": "MIA",
                    "opponent": "ATL",
                    "sport": "MLB",
                    "market": "Hits",
                    "opening_line": 1.5,
                    "line": 1.5,
                    "line_movement": 0.0,
                    "movement_direction": "neutral",
                    "odds": -125,
                    "edge": 0.5,
                    "ev_percent": 0.5,
                    "vig": 9.5,
                    "hasArbitrage": False,
                    "arbitrageProfitPct": 0.0,
                    "numBookmakers": 1,
                    "bookmakers": [{"name": "OnlyBook", "odds": -125, "line": 1.5}],
                    "confidence": 42.0,
                }
            ]
        }

    monkeypatch.setattr(SimplePropFinderService, "get_opportunities", fake_get_opportunities, raising=True)

    # min_score set high to ensure it filters out the poor-value opp
    resp = client.get("/api/signals/smart", params={"sport": "MLB", "min_score": 70, "limit": 10})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    opps = data.get("opportunities", [])
    assert len(opps) == 0

    payload = {
        "request": {"sport": "MLB", "min_score": 70, "limit": 10},
        "counts": {"total": data.get("total_count"), "filtered": data.get("filtered_count")},
        "note": "poor-value correctly filtered",
    }
    _write_summary("mlb_poor_value_filtered", payload)
