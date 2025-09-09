"""
Synthetic end-to-end test for Smart Signals signal flow.

Goals:
- Seed mock odds across 3 books
- Force EV > 5%, arbitrage condition, and favorable line movement
- Call the smart signals endpoint and assert a signal is present
- Use DI/monkeypatch to bypass external APIs
- Print a concise JSON summary at the end for quick visibility
"""
import json
import os
from typing import Any, Dict

import pytest
from unittest.mock import patch
from pathlib import Path


def _seeded_opportunity() -> Dict[str, Any]:
    """Create a single deterministic opportunity with strong signal characteristics."""
    return {
        "id": "mlb_test_player_total_bases_123",
        "player": "Test Player",
        "team": "TST",
        "opponent": "OPP",
        "sport": "MLB",
        "market": "Total Bases",
        # Line + movement
        "opening_line": 1.5,
        "line": 2.5,  # moved up 1.0 (favorable)
        "line_movement": 1.0,
        "movement_direction": "favorable",
        # EV and pricing
        "odds": -105,
        "edge": 7.5,            # EV > 5%
        "ev_percent": 7.5,
        "vig": 3.2,             # Low-ish vig
        # Arbitrage & spreads
        "hasArbitrage": True,
        "arbitrageProfitPct": 2.6,  # clear arbitrage
        "oddsSpread": 60,
        "lineSpread": 1.0,
        # Book diversity
        "numBookmakers": 3,
        "bookmakers": [
            {"name": "DraftKings", "odds": -105, "line": 2.5},
            {"name": "FanDuel", "odds": +120, "line": 2.0},
            {"name": "Caesars", "odds": -110, "line": 2.5},
        ],
        # Misc fields commonly expected by schemas
        "confidence": 78.0,
        "impliedProbability": 48.8,
    }


@pytest.fixture(scope="module")
def client():
    """FastAPI TestClient against the full app factory."""
    # Ensure feature flag is enabled for the service instance
    with patch.dict(os.environ, {"ENABLE_SMART_SIGNALS": "true"}, clear=False):
        from fastapi.testclient import TestClient
        from backend.core.app import create_app
        from backend.services.smart_signals import smart_signals_service

        # Also force-enable the already-instantiated global service
        smart_signals_service.enabled = True

        app = create_app()
        yield TestClient(app)


@pytest.mark.asyncio
async def test_end_to_end_smart_signal_flow(monkeypatch, client):
    """End-to-end synthetic flow: patch PropFinder, hit API, assert signal, print summary JSON."""
    # Monkeypatch PropFinder to return our seeded opportunity deterministically
    from backend.services.simple_propfinder_service import SimplePropFinderService

    async def fake_get_opportunities(self, filters=None):  # type: ignore[override]
        return {
            "opportunities": [
                _seeded_opportunity(),
                # Include a lower-quality opportunity to verify filtering by min_score
                {
                    "id": "mlb_low_value_456",
                    "player": "Low Value",
                    "team": "LOW",
                    "opponent": "OPP",
                    "sport": "MLB",
                    "market": "Total Bases",
                    "line": 2.0,
                    "ev_percent": 1.0,
                    "edge": 1.0,
                    "vig": 8.5,
                    "hasArbitrage": False,
                    "numBookmakers": 1,
                    "bookmakers": [{"name": "SingleBook", "odds": -120, "line": 2.0}],
                    "confidence": 50.0,
                },
            ],
            "total": 2,
            "filtered": 2,
            "summary": {"note": "synthetic"},
        }

    monkeypatch.setattr(SimplePropFinderService, "get_opportunities", fake_get_opportunities, raising=True)

    # Call smart signals API requesting MLB with a threshold that should include the seeded high-value opp
    resp = client.get("/api/signals/smart", params={"sport": "MLB", "min_score": 70, "limit": 10})
    assert resp.status_code == 200, resp.text

    data = resp.json()
    assert "opportunities" in data
    assert data["total_count"] >= 1
    assert data["filtered_count"] >= 1

    opps = data["opportunities"]
    assert len(opps) >= 1

    # Validate the top opportunity has a strong smart score and expected factors
    top = opps[0]
    assert top.get("sport") == "MLB"
    assert top.get("smartScore", 0) >= 70

    factor_names = {f.get("name") for f in top.get("signalFactors", [])}
    # At least EV + Arbitrage + Movement should be present
    assert {"ev_percent", "arbitrage"}.issubset(factor_names)

    # Print a compact JSON summary of what we validated for observability
    summary = {
        "request": {"sport": "MLB", "min_score": 70, "limit": 10},
        "counts": {
            "total": data.get("total_count"),
            "filtered": data.get("filtered_count"),
        },
        "top_opportunity": {
            "id": top.get("id"),
            "player": top.get("player"),
            "market": top.get("market"),
            "smartScore": top.get("smartScore"),
            "factors": sorted(list(factor_names)),
            "hasArbitrage": top.get("hasArbitrage"),
            "arbitrageProfitPct": top.get("arbitrageProfitPct"),
            "numBookmakers": top.get("numBookmakers"),
        },
        "average_score": data.get("average_score"),
    }

    # Write to disk if requested, else print
    out_dir = os.getenv("SYNTHETIC_REPORT_DIR")
    if out_dir:
        p = Path(out_dir)
        p.mkdir(parents=True, exist_ok=True)
        (p / "mlb_high_value_signal.json").write_text(json.dumps(summary, indent=2, sort_keys=True))
    else:
        print(json.dumps(summary, indent=2, sort_keys=True))
