#!/usr/bin/env python3
"""
Direct test of Ollama integration with PropOllama
"""

import asyncio
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from enhanced_propollama_engine import EnhancedPropOllamaEngine
from utils.llm_engine import llm_engine


class MockModelManager:
    def get_status(self):
        return {
            "status": "ready",
            "models_ready": 5,
            "total_models": 5,
            "ensemble_accuracy": 0.964,
        }

    def get_predictions(self):
        return [
            {
                "id": "test",
                "sport": "basketball",
                "event": "Lakers vs Warriors",
                "prediction": "LeBron James Over 25.5 Points",
                "confidence": 0.78,
                "shap_values": {"recent_form": 0.25, "matchup": 0.20},
                "explanation": "Strong recent form",
            }
        ]


async def direct_ollama_test():
    """Test direct Ollama connection"""
    print("🔗 Testing direct Ollama connection...")

    try:
        # Force refresh models
        await llm_engine.refresh_models()
        print(f"✅ Models available: {llm_engine.models}")

        # Test simple generation
        response = await llm_engine.generate_text(
            "You are PropOllama. Say hello and confirm you're working.",
            max_tokens=50,
            temperature=0.7,
        )
        print(f"✅ Ollama response: {response}")

        # Test PropOllama with real integration
        mock_manager = MockModelManager()
        engine = EnhancedPropOllamaEngine(mock_manager)

        class MockRequest:
            def __init__(self, msg):
                self.message = msg
                self.analysisType = None
                self.conversationId = None

        # Test with a real sports query
        request = MockRequest("Should I bet on LeBron James over 25.5 points tonight?")
        response = await engine.process_chat_message(request)

        print(f"✅ PropOllama analysis: {response['content'][:150]}...")
        print(f"✅ Confidence: {response['confidence']}%")
        print(f"✅ Model used: {response['model_used']}")

        return True

    except Exception as e:
        print(f"❌ Direct Ollama test failed: {e}")
        return False


if __name__ == "__main__":
    asyncio.run(direct_ollama_test())
