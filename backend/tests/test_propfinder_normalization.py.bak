import os
from datetime import datetime, timezone

from backend.services.propfinder_data_service import (
    PropFinderDataService,
    PropOpportunity,
    Sport,
    MarketType,
    Pick,
    Venue,
    MatchupHistory,
    LineMovement,
    Trend,
    SharpMoney,
)


def _make_sample_opportunity(confidence: float, ai_probability: float) -> PropOpportunity:
    return PropOpportunity(
        id="test",
        player="Player",
        playerImage=None,
        team="TST",
        teamLogo=None,
        opponent="OPP",
        opponentLogo=None,
        sport=Sport.MLB,
        market=MarketType.HITS,
        line=1.0,
        pick=Pick.OVER,
        odds=-110,
        impliedProbability=45.0,
        aiProbability=ai_probability,
        edge=0.0,
        confidence=confidence,
        projectedValue=1.0,
        volume=100,
        trend=Trend.STABLE,
        trendStrength=50,
        timeToGame="1h",
        venue=Venue.HOME,
        weather=None,
        injuries=[],
        recentForm=[1.0, 1.0, 1.0, 1.0, 1.0],
        matchupHistory=MatchupHistory(games=10, average=1.0, hitRate=50),
        lineMovement=LineMovement(open=1.0, current=1.0, direction=Trend.STABLE),
        bookmakers=[],
        isBookmarked=False,
        tags=["Real MLB Data"],
        socialSentiment=50,
        sharpMoney=SharpMoney.MODERATE,
        lastUpdated=datetime.now(timezone.utc),
    )


def test_normalize_opportunities_list_lifts_low_confidence(monkeypatch):
    monkeypatch.setenv("MLB_CONFIDENCE_NORMALIZATION", "true")
    svc = PropFinderDataService()

    opp = _make_sample_opportunity(confidence=15.0, ai_probability=15.0)
    svc._normalize_opportunities_list([opp])

    # For input 15.0 the mapping adds +8 -> 23.0 per normalization rules
    assert opp.confidence == 23.0
    assert opp.aiProbability == 23.0


def test_no_normalization_when_flag_disabled(monkeypatch):
    monkeypatch.setenv("MLB_CONFIDENCE_NORMALIZATION", "false")
    svc = PropFinderDataService()

    opp = _make_sample_opportunity(confidence=12.0, ai_probability=12.0)
    svc._normalize_opportunities_list([opp])

    assert opp.confidence == 12.0
    assert opp.aiProbability == 12.0
