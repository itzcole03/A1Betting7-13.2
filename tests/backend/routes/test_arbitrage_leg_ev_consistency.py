import math
import pytest

pytestmark = pytest.mark.filterwarnings(
    "ignore::DeprecationWarning:pydantic.*",
)
from fastapi.testclient import TestClient
from backend.main import app

# Assumptions:
# - There exists an arbitrage-related route producing leg_ev_details structure.
# - If not present in current dataset, this test should be updated with the actual route.
# For now we will call a refresh/feed generation then inspect ev feed opportunities
# and simulate a recompute using the ev formula from backend.models.ev_models.

from backend.models.ev_models import calculate_expected_value
from backend.services.ev_feed_service import ev_feed_service

client = TestClient(app)

@pytest.mark.asyncio
async def test_arbitrage_leg_ev_probability_and_edge_consistency():
    # Trigger at least one generation (manual refresh) if route exists; else generate directly
    # We reuse the service generation method to produce opportunities.
    opps = await ev_feed_service._generate_ev_opportunities()
    assert opps, "Expected generated EV opportunities for consistency check"

    # Take subset for speed
    sample = opps[:10]

    for opp in sample:
        # Compute implied probabilities using model helpers
        market_prob = opp.implied_probability
        fair_prob = opp.fair_implied_probability
        assert 0 <= market_prob <= 1, "market implied probability out of bounds"
        assert 0 <= fair_prob <= 1, "fair implied probability out of bounds"

        # Recompute EV percent via helper and compare tolerance
        recompute = calculate_expected_value(opp.market_odds, opp.our_fair_odds)
        # Stored ev_percent rounded to 2 decimals; allow small diff
        diff = abs(recompute.ev_percent - opp.ev_percent)
        assert diff < 0.05, f"EV percent drift too large: {diff}"

        # High precision recompute vs truncated storage tolerance path (1e-6 unrealistic with rounding)
        # This assertion ensures at least sign consistency.
        assert (recompute.ev_percent >= 0) == (opp.ev_percent >= 0)
