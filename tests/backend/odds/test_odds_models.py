import pytest
from backend.odds.odds_models import ConsensusEntry


def test_implied_to_american_positive():
    # Probability less than 0.5 yields plus odds
    american = ConsensusEntry.implied_to_american(0.40)
    assert american > 0


def test_implied_to_american_negative():
    american = ConsensusEntry.implied_to_american(0.60)
    assert american < 0


def test_implied_to_american_edge_cases():
    # Implementation clamps extremes to +/-400 sentinel values
    assert ConsensusEntry.implied_to_american(0.0) == 400
    assert ConsensusEntry.implied_to_american(1.0) == -400

