"""
Test LLM Prompt Templates

Tests the prompt template building functionality for edge explanations.
"""

import pytest
from datetime import datetime

from backend.services.llm.prompt_templates import (
    build_edge_explanation_prompt,
    EdgeContext,
    PROMPT_TEMPLATE_VERSION
)


def test_prompt_template_version_constant():
    """Test that prompt template version is defined"""
    assert PROMPT_TEMPLATE_VERSION == "v1"


def test_build_edge_explanation_prompt_basic():
    """Test basic prompt generation with minimal context"""
    context = EdgeContext(
        player_name="Test Player",
        team="Test Team",
        prop_type="POINTS",
        offered_line=25.5,
        fair_line=23.8,
        prob_over=0.45,
        ev=0.08,
        model_version_name="test_model_v1",
        model_version_id=1,
        volatility_score=0.35,
        recent_lines=[]
    )
    
    prompt = build_edge_explanation_prompt(context)
    
    # Check that prompt contains required elements
    assert "Test Player" in prompt
    assert "Test Team" in prompt
    assert "Points" in prompt  # Normalized from "POINTS"
    assert "25.5" in prompt
    assert "23.8" in prompt
    assert "0.450" in prompt
    assert "+0.0800" in prompt  # EV formatting
    assert "0.35" in prompt
    assert "test_model_v1" in prompt
    
    # Check prompt structure
    assert "Analyze this sports betting opportunity" in prompt
    assert "INSTRUCTIONS:" in prompt
    assert len(prompt) > 100  # Should be substantial


def test_build_edge_explanation_prompt_with_recent_lines():
    """Test prompt generation with recent line history"""
    recent_lines = [
        {"line": 26.0, "timestamp": datetime(2024, 1, 1, 12, 0)},
        {"line": 25.0, "timestamp": datetime(2024, 1, 1, 10, 0)},
    ]
    
    context = EdgeContext(
        player_name="Test Player",
        team="Test Team", 
        prop_type="ASSISTS",
        offered_line=7.5,
        fair_line=8.2,
        prob_over=0.62,
        ev=-0.05,
        model_version_name="test_model_v1",
        model_version_id=1,
        volatility_score=0.75,
        recent_lines=recent_lines
    )
    
    prompt = build_edge_explanation_prompt(context)
    
    # Check recent lines are included
    assert "Recent lines:" in prompt
    assert "26.0" in prompt
    assert "25.0" in prompt
    
    # Check negative edge is handled
    assert "negative edge" in prompt.lower()
    

def test_build_edge_explanation_prompt_sanitization():
    """Test that input sanitization works properly"""
    context = EdgeContext(
        player_name="Very Long Player Name That Should Be Truncated Because It Exceeds Reasonable Limits",
        team="Team<script>alert('xss')</script>",
        prop_type="WEIRD_PROP_TYPE_123",
        offered_line=10.0,
        fair_line=12.0,
        prob_over=0.65,
        ev=0.15,
        model_version_name="model_v1",
        model_version_id=1,
        volatility_score=0.25,
        recent_lines=[]
    )
    
    prompt = build_edge_explanation_prompt(context)
    
    # Check sanitization
    player_line = [line for line in prompt.split('\n') if 'Player:' in line][0]
    assert len(player_line) < 100  # Should be truncated
    assert '<script>' not in prompt
    assert 'Weird_Prop_Type_123' in prompt  # Should be title cased


def test_build_edge_explanation_prompt_missing_context():
    """Test fallback behavior with missing context"""
    context = EdgeContext(
        player_name="",  # Empty name
        team="",
        prop_type="",
        offered_line=5.0,
        fair_line=6.0,
        prob_over=0.55,
        ev=0.02,
        model_version_name="model_v1",
        model_version_id=1,
        volatility_score=0.40,
        recent_lines=[]
    )
    
    prompt = build_edge_explanation_prompt(context)
    
    # Should still generate a valid prompt (minimal version)
    assert len(prompt) > 50
    assert "5.0" in prompt  # Should include the numeric values
    assert "6.0" in prompt


if __name__ == "__main__":
    # Run tests directly
    test_prompt_template_version_constant()
    test_build_edge_explanation_prompt_basic()
    test_build_edge_explanation_prompt_with_recent_lines()
    test_build_edge_explanation_prompt_sanitization()
    test_build_edge_explanation_prompt_missing_context()
    print("All prompt template tests passed!")