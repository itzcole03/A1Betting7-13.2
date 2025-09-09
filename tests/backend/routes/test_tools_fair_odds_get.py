import pytest
from fastapi.testclient import TestClient

from backend.core.app import create_app


@pytest.fixture(scope="module")
def client():
    app = create_app()
    with TestClient(app) as c:
        yield c


def test_fair_odds_get_basic(client: TestClient):
    resp = client.get(
        "/api/tools/fair-odds",
        params={
            "projection_value": 8.5,
            "market_line": 8.0,
            "market_type": "over_under",
            "distribution_type": "normal",
            "margin_percent": 0,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["fair_odds_decimal"] > 1
    assert "fair_odds_american" in data


def test_fair_odds_get_with_book_and_kelly(client: TestClient):
    resp = client.get(
        "/api/tools/fair-odds",
        params={
            "projection_value": 8.5,
            "market_line": 8.0,
            "book_odds_american": -110,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "comparison" in data
    assert "kelly_sizing" in data
