"""
Calculation Services

This module contains business logic calculations for betting analysis.
"""

import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


async def calculate_prop_confidence(attributes: Dict[str, Any]) -> float:
    """Calculate confidence level for a prop bet"""
    try:
        # Extract relevant attributes
        player_avg = attributes.get("player_avg", 0.0)
        line = attributes.get("line", 0.0)
        variance = attributes.get("variance", 1.0)
        games_played = attributes.get("games_played", 1)
        
        # Base confidence calculation
        base_confidence = 0.5
        
        # Adjust based on player performance vs line
        if player_avg > line:
            base_confidence += 0.2
        elif player_avg < line:
            base_confidence -= 0.1
            
        # Adjust based on variance (lower variance = higher confidence)
        variance_factor = max(0.1, 1.0 - (variance / 10.0))
        base_confidence *= variance_factor
        
        # Adjust based on sample size
        sample_factor = min(1.0, games_played / 20.0)
        base_confidence *= (0.7 + 0.3 * sample_factor)
        
        # Ensure confidence is between 0 and 1
        return max(0.0, min(1.0, base_confidence))
        
    except Exception as e:
        logger.error(f"Error calculating prop confidence: {e}")
        return 0.5


async def calculate_prop_edge(attributes: Dict[str, Any]) -> float:
    """Calculate edge for a prop bet"""
    try:
        # Extract relevant attributes
        player_avg = attributes.get("player_avg", 0.0)
        line = attributes.get("line", 0.0)
        odds = attributes.get("odds", 2.0)
        
        # Calculate implied probability from odds
        implied_prob = 1.0 / odds
        
        # Calculate our estimated probability
        if player_avg > line:
            # Player averages above the line
            estimated_prob = 0.6  # Conservative estimate
        else:
            # Player averages below the line
            estimated_prob = 0.4  # Conservative estimate
            
        # Calculate edge
        edge = estimated_prob - implied_prob
        
        return edge
        
    except Exception as e:
        logger.error(f"Error calculating prop edge: {e}")
        return 0.0


async def calculate_prop_projection(attributes: Dict[str, Any]) -> float:
    """Calculate projected value for a prop bet"""
    try:
        # Extract relevant attributes
        player_avg = attributes.get("player_avg", 0.0)
        line = attributes.get("line", 0.0)
        variance = attributes.get("variance", 1.0)
        recent_form = attributes.get("recent_form", 0.0)
        
        # Base projection on player average
        projection = player_avg
        
        # Adjust for recent form (weighted average)
        if recent_form > 0:
            projection = (player_avg * 0.7) + (recent_form * 0.3)
            
        # Adjust for variance (regression to mean)
        if variance > 2.0:
            projection = (projection * 0.8) + (line * 0.2)
            
        return projection
        
    except Exception as e:
        logger.error(f"Error calculating prop projection: {e}")
        return attributes.get("player_avg", 0.0) 