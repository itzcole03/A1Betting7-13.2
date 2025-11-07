def test_enriched_prop_edge_cases():
    # Missing optional fields
    pi = PlayerInfo(name="Edge Player", team="Edge Team", position="C")
    ep = EnrichedProp(
        player_info=pi,
        summary="Edge summary",
        deep_analysis="Edge analysis",
        statistics=[],
        insights=[],
    )
    assert ep.player_info.name == "Edge Player"
    assert ep.statistics == []
    assert ep.insights == []
    # Serialization roundtrip
    d = ep.model_dump()
    ep2 = EnrichedProp(**d)
    assert ep2.player_info.name == "Edge Player"
    # Empty BetAnalysisResponse
    bar = BetAnalysisResponse(
        analysis="Empty",
        confidence=0.0,
        recommendation="N/A",
        key_factors=[],
        processing_time=0.0,
        cached=False,
        enriched_props=[],
    )
    assert bar.enriched_props == []


import pytest

from backend.models.api_models import (
    BetAnalysisResponse,
    EnrichedProp,
    Insight,
    PlayerInfo,
    StatisticPoint,
)


def test_player_info():
    pi = PlayerInfo(
        name="Test Player", team="Testers", position="RF", image_url=None, score=99
    )
    assert pi.name == "Test Player"
    assert pi.team == "Testers"
    assert pi.position == "RF"
    assert pi.score == 99


def test_statistic_point():
    sp = StatisticPoint(label="Game 1", value=1.5)
    assert sp.label == "Game 1"
    assert sp.value == 1.5


def test_insight():
    ins = Insight(type="trend", text="Consistent under performer")
    assert ins.type == "trend"
    assert ins.text == "Consistent under performer"


def test_enriched_prop():
    pi = PlayerInfo(name="Test Player", team="Testers", position="RF")
    stats = [StatisticPoint(label=f"Game {i+1}", value=i) for i in range(3)]
    insights = [Insight(type="trend", text="Test insight")]
    ep = EnrichedProp(
        player_info=pi,
        summary="Test summary",
        deep_analysis="Test analysis",
        statistics=stats,
        insights=insights,
        prop_id="test1",
        stat_type="hits",
        line=1.5,
        recommendation="UNDER",
        confidence=88.5,
    )
    assert ep.player_info.name == "Test Player"
    assert ep.summary == "Test summary"
    assert len(ep.statistics) == 3
    assert ep.insights[0].type == "trend"
    assert ep.recommendation == "UNDER"


def test_bet_analysis_response():
    pi = PlayerInfo(name="Test Player", team="Testers", position="RF")
    stats = [StatisticPoint(label=f"Game {i+1}", value=i) for i in range(2)]
    insights = [Insight(type="trend", text="Test insight")]
    ep = EnrichedProp(
        player_info=pi,
        summary="Test summary",
        deep_analysis="Test analysis",
        statistics=stats,
        insights=insights,
        prop_id="test1",
        stat_type="hits",
        line=1.5,
        recommendation="UNDER",
        confidence=88.5,
    )
    bar = BetAnalysisResponse(
        analysis="Test analysis",
        confidence=88.5,
        recommendation="UNDER",
        key_factors=["trend"],
        processing_time=0.1,
        cached=False,
        enriched_props=[ep],
    )
    assert bar.analysis == "Test analysis"
    assert bar.enriched_props[0].player_info.name == "Test Player"
    assert bar.key_factors == ["trend"]
    assert bar.recommendation == "UNDER"
    assert isinstance(bar.enriched_props, list)
    # Test serialization
    d = bar.model_dump()
    assert "enriched_props" in d
    assert d["enriched_props"][0]["player_info"]["name"] == "Test Player"
