"""
Prompt Templates for LLM Edge Explanations

Provides structured prompt building for edge explanations with context extraction.
"""

from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from datetime import datetime

from backend.services.unified_logging import get_logger

logger = get_logger("prompt_templates")

# Template version for cache key generation
PROMPT_TEMPLATE_VERSION = "v1"


@dataclass
class EdgeContext:
    """Context information for edge explanation prompts"""
    
    # Player and game info
    player_name: str
    team: str
    prop_type: str
    
    # Lines and predictions
    offered_line: float
    fair_line: float
    prob_over: float
    ev: float
    
    # Model info
    model_version_name: str
    model_version_id: int  # Add model_version_id field
    volatility_score: float
    
    # Historical context
    recent_lines: List[Dict[str, Any]]  # [{"line": float, "timestamp": datetime}, ...]
    recent_model_means: Optional[List[float]] = None
    distribution_family: Optional[str] = None
    
    # Additional metadata
    edge_id: Optional[int] = None
    confidence_score: Optional[float] = None


def build_edge_explanation_prompt(edge_context: EdgeContext) -> str:
    """
    Build a structured prompt for LLM edge explanation generation
    
    Args:
        edge_context: Context information for the edge
        
    Returns:
        str: Formatted prompt for LLM generation
    """
    
    # Validate required context
    if not edge_context.player_name or not edge_context.prop_type:
        logger.warning("Missing required context for prompt generation")
        return _build_minimal_prompt(edge_context)
    
    # Sanitize inputs for safety
    player_name = _sanitize_name(edge_context.player_name)
    team = _sanitize_name(edge_context.team) if edge_context.team else "Unknown"
    prop_type = _sanitize_prop_type(edge_context.prop_type)
    
    # Determine edge direction and strength
    edge_direction = "positive" if edge_context.ev > 0 else "negative"
    edge_strength = _categorize_edge_strength(edge_context.ev)
    volatility_level = _categorize_volatility(edge_context.volatility_score)
    
    # Build recent lines context
    recent_lines_text = _format_recent_lines(edge_context.recent_lines)
    
    # Build model prediction context
    model_context = _format_model_context(edge_context)
    
    prompt = f"""Analyze this sports betting opportunity and provide a clear, concise explanation.

Player: {player_name}
Team: {team}
Prop Type: {prop_type}
Offered Line: {edge_context.offered_line:.1f}
Fair Value Prediction: {edge_context.fair_line:.1f}
Probability Over: {edge_context.prob_over:.3f}
Expected Value: {edge_context.ev:+.4f}
Volatility Score: {edge_context.volatility_score:.2f}

Model Information:
{model_context}

Recent Market Context:
{recent_lines_text}

INSTRUCTIONS:
- Explain why this {edge_direction} edge exists in 2-3 sentences
- Identify key contributing factors (recent performance, matchup, etc.)
- Note volatility level ({volatility_level}) and what it means for risk
- Provide comparison context relative to typical lines for this prop type
- Keep explanation under 150 words, be specific and actionable
- Use neutral, analytical tone - highlight both opportunities and risks

Focus on practical insights for decision-making rather than generic analysis."""

    return prompt


def build_comparative_prompt(edge_a: EdgeContext, edge_b: EdgeContext) -> str:
    """
    Build a prompt for comparing two edges (scaffold for future use)
    
    Args:
        edge_a: First edge context
        edge_b: Second edge context
        
    Returns:
        str: Formatted comparative prompt
    """
    # TODO: Implement comparative analysis prompt
    return f"""TODO: Comparative analysis between {edge_a.player_name} {edge_a.prop_type} 
and {edge_b.player_name} {edge_b.prop_type}. 
This feature will be implemented in a future iteration."""


def _build_minimal_prompt(edge_context: EdgeContext) -> str:
    """Build minimal prompt when required context is missing"""
    return f"""Provide a brief analysis for this betting opportunity:
Prediction: {edge_context.fair_line:.1f} vs Line: {edge_context.offered_line:.1f}
Expected Value: {edge_context.ev:+.4f}
Volatility: {edge_context.volatility_score:.2f}

Keep analysis under 100 words."""


def _sanitize_name(name: str) -> str:
    """Sanitize player/team names for prompt safety"""
    if not name:
        return "Unknown"
    
    # Limit length and remove problematic characters
    sanitized = name.strip()[:40]
    sanitized = ''.join(c for c in sanitized if c.isalnum() or c in ' .-')
    
    return sanitized if sanitized else "Unknown"


def _sanitize_prop_type(prop_type: str) -> str:
    """Sanitize prop type for prompt safety"""
    if not prop_type:
        return "prop"
    
    # Normalize common prop types
    prop_map = {
        "POINTS": "Points",
        "ASSISTS": "Assists", 
        "REBOUNDS": "Rebounds",
        "HITS": "Hits",
        "STRIKEOUTS": "Strikeouts",
        "RBI": "RBI",
        "HOME_RUNS": "Home Runs"
    }
    
    normalized = prop_map.get(prop_type.upper(), prop_type.title())
    return normalized[:30]  # Limit length


def _categorize_edge_strength(ev: float) -> str:
    """Categorize edge strength based on expected value"""
    if abs(ev) >= 0.15:
        return "strong"
    elif abs(ev) >= 0.08:
        return "moderate"  
    elif abs(ev) >= 0.03:
        return "weak"
    else:
        return "minimal"


def _categorize_volatility(volatility: float) -> str:
    """Categorize volatility level"""
    if volatility >= 0.8:
        return "very high"
    elif volatility >= 0.6:
        return "high"
    elif volatility >= 0.4:
        return "moderate"
    elif volatility >= 0.2:
        return "low"
    else:
        return "very low"


def _format_recent_lines(recent_lines: List[Dict[str, Any]]) -> str:
    """Format recent lines for prompt context"""
    if not recent_lines:
        return "No recent line history available."
    
    # Sort by timestamp (most recent first)
    sorted_lines = sorted(recent_lines, key=lambda x: x.get('timestamp', datetime.min), reverse=True)
    
    lines_text = []
    for i, line_data in enumerate(sorted_lines[:3]):  # Last 3 lines
        line_val = line_data.get('line', 0.0)
        timestamp = line_data.get('timestamp')
        
        if timestamp:
            time_str = timestamp.strftime("%m/%d %H:%M") if hasattr(timestamp, 'strftime') else str(timestamp)
            lines_text.append(f"  {time_str}: {line_val:.1f}")
        else:
            lines_text.append(f"  Recent line {i+1}: {line_val:.1f}")
    
    return "Recent lines:\n" + "\n".join(lines_text) if lines_text else "No recent line data."


def _format_model_context(edge_context: EdgeContext) -> str:
    """Format model context information"""
    context_parts = [f"Model: {edge_context.model_version_name}"]
    
    if edge_context.distribution_family:
        context_parts.append(f"Distribution: {edge_context.distribution_family}")
    
    if edge_context.confidence_score:
        context_parts.append(f"Confidence: {edge_context.confidence_score:.2f}")
    
    if edge_context.recent_model_means:
        recent_mean = sum(edge_context.recent_model_means) / len(edge_context.recent_model_means)
        context_parts.append(f"Recent Model Average: {recent_mean:.1f}")
    
    return "\n".join(context_parts)