#!/usr/bin/env python3
"""
Simple Ollama model test
"""

import httpx
import pytest


@pytest.mark.asyncio
async def test_ollama_models():
    """Test Ollama models directly"""
    async with httpx.AsyncClient() as client:
        # List models
        response = await client.get("http://localhost:11434/api/tags")
        assert (
            response.status_code == 200
        ), f"Failed to list models: {response.status_code}"
        models = response.json()
        assert "models" in models, "No models found in response"

        # Test generation with llama3:8b
        gen_response = await client.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3:8b",
                "prompt": "You are PropOllama, a sports betting AI assistant. Briefly introduce yourself and mention your expertise in sports analysis.",
                "stream": False,
                "options": {"num_predict": 100, "temperature": 0.7},
            },
        )
        assert (
            gen_response.status_code == 200
        ), f"Generation failed: {gen_response.status_code}"
        result = gen_response.json()
        assert "response" in result, "No response from model"


if __name__ == "__main__":
    asyncio.run(test_ollama_models())
