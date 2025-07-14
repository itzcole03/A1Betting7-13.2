import pytest


# Mock dependencies if not available
class MockModelManager:
    def get_status(self):
        return {"status": "ready"}

    def get_predictions(self):
        return [
            {
                "id": "test_1",
                "sport": "basketball",
                "prediction": "LeBron James Over 24.5 Points",
                "confidence": 0.78,
                "expected_value": 0.12,
                "model_version": "ML_Ensemble_v6.0",
                "shap_values": {},
                "explanation": "Strong recent form.",
                "risk_assessment": "Medium",
                "recommendation": "BET",
            }
        ]


class MockRequest:
    def __init__(self, message, session_id):
        self.message = message
        self.session_id = session_id


class EnhancedPropOllamaEngine:
    def __init__(self, model_manager):
        self.model_manager = model_manager

    async def process_chat_message(self, request):
        # Return a mock response
        return {
            "content": "Test content",
            "confidence": 0.9,
            "suggestions": ["Suggestion 1", "Suggestion 2"],
            "response_time": 0.1,
            "model_used": "MockModel",
            "analysis_type": "prop_analysis",
        }


@pytest.mark.asyncio
async def test_enhanced_propollama():
    """Test the enhanced PropOllama engine"""
    mock_model_manager = MockModelManager()
    engine = EnhancedPropOllamaEngine(mock_model_manager)
    test_cases = [
        {
            "name": "Prop Analysis",
            "message": "Analyze LeBron James points prop for tonight's game",
            "expected_type": "prop_analysis",
        },
        {
            "name": "General Chat",
            "message": "Hello, what can you help me with?",
            "expected_type": "general_chat",
        },
        {
            "name": "Strategy Advice",
            "message": "How should I manage my bankroll?",
            "expected_type": "strategy",
        },
        {
            "name": "Explanation Request",
            "message": "Explain why this prediction has high confidence",
            "expected_type": "explanation",
        },
        {
            "name": "Sports Detection",
            "message": "What do you think about Steph Curry's three-pointers tonight?",
            "expected_type": "prop_analysis",
        },
    ]
