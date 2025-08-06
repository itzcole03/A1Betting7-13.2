import requests


def test_mlb_bet_analysis_structure():
    url = "http://localhost:8000/api/mlb-bet-analysis?min_confidence=70&max_results=3"
    response = requests.get(url)
    assert response.status_code == 200
    data = response.json()
    assert "enriched_props" in data
    assert isinstance(data["enriched_props"], list)
    for prop in data["enriched_props"]:
        assert "player_info" in prop
        assert "summary" in prop
        assert "deep_analysis" in prop
        assert "statistics" in prop
        assert "insights" in prop
        # Check player_info fields
        pi = prop["player_info"]
        assert "name" in pi
        assert "team" in pi
        assert "position" in pi
        # Check statistics is a list of dicts with label/value
        stats = prop["statistics"]
        assert isinstance(stats, list)
        for s in stats:
            assert "label" in s and "value" in s
        # Check insights is a list of dicts with type/text
        insights = prop["insights"]
        assert isinstance(insights, list)
        for ins in insights:
            assert "type" in ins and "text" in ins


if __name__ == "__main__":
    test_mlb_bet_analysis_structure()
    print("MLB bet analysis structure test passed.")
