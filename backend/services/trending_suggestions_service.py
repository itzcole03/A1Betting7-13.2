from __future__ import annotations

from typing import List


def get_trending_suggestions(sport: str, limit: int) -> List[str]:
    """Dummy implementation for tests. Returns a list of suggestions.
    
    Args:
        sport: The sport to get suggestions for
        limit: Maximum number of suggestions to return
        
    Returns:
        List of trending suggestion strings
    """
    return [f"{sport} trending suggestion {i+1}" for i in range(limit)]
