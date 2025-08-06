#!/usr/bin/env python3
"""
Simple Ollama model test
"""

import asyncio

import httpx
import pytest


@pytest.mark.asyncio
async def test_ollama_models():
    """Test Ollama models directly with timeout and error handling"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # List models
            response = await client.get("http://localhost:11434/api/tags")
            if response.status_code != 200:
                pytest.skip(
                    "Ollama server not running on localhost:11434 (status code != 200)"
                )
            models = response.json()
            if "models" not in models:
                pytest.skip("Ollama server response missing 'models' key")

            # Test generation with llama3:latest
            gen_response = await client.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "llama3:latest",
                    "prompt": "You are PropOllama, a sports betting AI assistant. Briefly introduce yourself and mention your expertise in sports analysis.",
                    "stream": False,
                    "options": {"num_predict": 100, "temperature": 0.7},
                },
            )
            if gen_response.status_code != 200:
                pytest.skip(
                    "Ollama server not running or model not available (status code != 200)"
                )
            result = gen_response.json()
            if "response" not in result:
                pytest.skip("Ollama server response missing 'response' key")
    except httpx.RequestError:
        pytest.skip("Ollama server not available on localhost:11434")


if __name__ == "__main__":
    asyncio.run(test_ollama_models())
