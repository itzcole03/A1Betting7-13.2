import pytest

from backend.models.api_models import (
    BetAnalysisResponse,
    EnrichedProp,
    Insight,
    PlayerInfo,
    StatisticPoint,
)


def test_player_info_field_metadata():
    pi = PlayerInfo(
        name="Meta Player",
        team="Meta Team",
        position="1B",
        image_url="http://img",
        score=42.0,
    )
    assert PlayerInfo.model_fields["name"].description == "Player's full name"
    assert (
        PlayerInfo.model_fields["team"].description
        == "Player's team name or abbreviation"
    )
    assert (
        PlayerInfo.model_fields["position"].description
        == "Player's position (e.g., 'P', 'OF')"
    )
    assert (
        PlayerInfo.model_fields["image_url"].description == "URL to player image/avatar"
    )
    assert (
        PlayerInfo.model_fields["score"].description
        == "Player's projected or actual score"
    )


def test_statistic_point_field_metadata():
    sp = StatisticPoint(label="AVG", value=0.333)
    assert (
        StatisticPoint.model_fields["label"].description
        == "Label for the statistic (e.g., 'AVG', 'HR')"
    )
    assert StatisticPoint.model_fields["value"].description == "Value for the statistic"


def test_insight_field_metadata():
    ins = Insight(type="trend", text="Hot streak")
    assert (
        Insight.model_fields["type"].description
        == "Type of insight (e.g., 'trend', 'defense', 'pitcher')"
    )
    assert Insight.model_fields["text"].description == "Insight text or explanation"


def test_enriched_prop_field_metadata():
    pi = PlayerInfo(name="Meta Player", team="Meta Team", position="1B")
    ep = EnrichedProp(
        player_info=pi,
        summary="Meta summary",
        deep_analysis="Meta analysis",
        statistics=[],
        insights=[],
    )
    assert EnrichedProp.model_fields["player_info"].description == "Player information"
    assert (
        EnrichedProp.model_fields["summary"].description
        == "Short summary of the prop or bet"
    )
    assert (
        EnrichedProp.model_fields["deep_analysis"].description
        == "Detailed analysis and reasoning"
    )
    assert (
        EnrichedProp.model_fields["statistics"].description
        == "List of key statistics for the prop/player"
    )
    assert (
        EnrichedProp.model_fields["insights"].description
        == "List of insights or notes about the prop/player"
    )
    assert (
        EnrichedProp.model_fields["prop_id"].description
        == "Legacy: Unique identifier for the prop"
    )
    assert (
        EnrichedProp.model_fields["stat_type"].description
        == "Legacy: Statistic type (e.g., 'HR', 'SO')"
    )
    assert (
        EnrichedProp.model_fields["line"].description
        == "Legacy: Betting line for the prop"
    )
    assert (
        EnrichedProp.model_fields["recommendation"].description
        == "Legacy: Model recommendation (e.g., 'over', 'under')"
    )
    assert (
        EnrichedProp.model_fields["confidence"].description
        == "Legacy: Model confidence score (0-1)"
    )


def test_bet_analysis_response_field_metadata():
    pi = PlayerInfo(name="Meta Player", team="Meta Team", position="1B")
    ep = EnrichedProp(
        player_info=pi,
        summary="Meta summary",
        deep_analysis="Meta analysis",
        statistics=[],
        insights=[],
    )
    bar = BetAnalysisResponse(
        analysis="Meta analysis",
        confidence=0.99,
        recommendation="over",
        key_factors=["meta"],
        processing_time=0.01,
        cached=True,
        enriched_props=[ep],
    )
    assert (
        BetAnalysisResponse.model_fields["analysis"].description
        == "Overall analysis summary for the bet(s)"
    )
    assert (
        BetAnalysisResponse.model_fields["confidence"].description
        == "Overall model confidence (0-1)"
    )
    assert (
        BetAnalysisResponse.model_fields["recommendation"].description
        == "Overall recommendation (e.g., 'over', 'under', 'no bet')"
    )
    assert (
        BetAnalysisResponse.model_fields["key_factors"].description
        == "List of key factors influencing the analysis"
    )
    assert (
        bar.model_fields["processing_time"].description
        == "Time taken to process the analysis (seconds)"
    )
    assert (
        bar.model_fields["cached"].description
        == "Whether the response was served from cache"
    )
    assert (
        bar.model_fields["enriched_props"].description
        == "List of enriched prop objects for display"
    )
