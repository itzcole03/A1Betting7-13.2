import asyncio
import importlib.util
import os
import sys

import pydantic
import pytest

# Ensure the project root is in sys.path for 'backend' imports
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

propollama_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "routes", "propollama.py")
)
spec = importlib.util.spec_from_file_location("propollama", propollama_path)
propollama = importlib.util.module_from_spec(spec)
sys.modules["propollama"] = propollama
spec.loader.exec_module(propollama)

pre_llm_business_logic = propollama.pre_llm_business_logic
build_ensemble_prompt = propollama.build_ensemble_prompt
post_llm_business_logic = propollama.post_llm_business_logic
BetAnalysisRequest = propollama.BetAnalysisRequest


def test_pre_llm_business_logic_valid():
    req = BetAnalysisRequest(
        userId="user1",
        sessionId="sess1",
        selectedProps=[
            {
                "player": "LeBron James",
                "statType": "points",
                "line": 28.5,
                "choice": "over",
                "odds": "+120",
            }
        ],
        entryAmount=10.0,
    )
    props, entry_amt, user, session = asyncio.run(pre_llm_business_logic(req))
    assert user == "user1"
    assert session == "sess1"
    assert entry_amt == 10.0
    assert props[0]["validated"] is True
    assert props[0]["enriched"] is True
    # Check for new enrichment fields
    assert "ensemble_prediction" in props[0]
    assert "feature_set" in props[0]
    assert isinstance(props[0]["ensemble_prediction"], dict)
    assert isinstance(props[0]["feature_set"], dict)


def test_pre_llm_business_logic_invalid_user():
    with pytest.raises(pydantic.ValidationError):
        req = BetAnalysisRequest(
            userId=None,
            sessionId="sess1",
            selectedProps=[
                {
                    "player": "A",
                    "statType": "points",
                    "line": 1,
                    "choice": "over",
                    "odds": "+100",
                }
            ],
            entryAmount=10.0,
        )
        asyncio.run(pre_llm_business_logic(req))


def test_build_ensemble_prompt():
    props = [
        {
            "player": "LeBron James",
            "statType": "points",
            "line": 28.5,
            "choice": "over",
            "odds": "+120",
        }
    ]
    prompt = build_ensemble_prompt(props, 10.0, "user1", "sess1")
    assert "LeBron James" in prompt
    assert "points" in prompt
    assert "Entry Amount" in prompt


def test_post_llm_business_logic_parsing():
    llm_response = """
    Risk Assessment: High risk due to correlated props.
    Correlation Analysis: Props are highly correlated.
    Payout Potential: High payout if successful.
    Recommendation: Avoid
    Confidence Score (1-10): 4
    Key Factors: - High correlation, - Unlikely outcome
    """
    props = [
        {
            "player": "LeBron James",
            "statType": "points",
            "line": 28.5,
            "choice": "over",
            "odds": "+120",
            "ensemble_prediction": {
                "predicted_value": 30.1,
                "confidence": 0.85,
                "recommendation": "OVER",
                "risk_score": 12.0,
                "win_probability": 0.7,
                "over_probability": 0.7,
                "under_probability": 0.3,
            },
            "feature_set": {
                "stat_mean": 25.0,
                "stat_std": 2.5,
                "player_recent_avg": 27.0,
                "player_career_avg": 26.5,
                "player_consistency": 0.9,
            },
        }
    ]
    result = asyncio.run(
        post_llm_business_logic(llm_response, props, 10.0, "user1", "sess1")
    )
    import json

    parsed = json.loads(result)
    assert parsed["risk_assessment"].startswith("High risk")
    assert parsed["confidence_score"] == 4
    assert "Low confidence score" in parsed["warnings"][0]
    assert "Recommendation is negative" in parsed["warnings"][1]
    # Check for enriched_props in output
    assert "enriched_props" in parsed
    assert isinstance(parsed["enriched_props"], list)
    assert "ensemble_prediction" in parsed["enriched_props"][0]
    assert "key_features" in parsed["enriched_props"][0]
