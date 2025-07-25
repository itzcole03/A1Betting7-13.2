import logging
from typing import Any, Dict, List

import httpx
from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/api", tags=["Trending Suggestions"])

# Example: The Odds API endpoint and key (replace with your real key)
ODDS_API_KEY = "YOUR_API_KEY"
ODDS_API_URL = "https://api.the-odds-api.com/v4/sports/basketball_nba/odds?regions=us&markets=h2h&apiKey={key}"


@router.get("/trending-suggestions", response_model=List[Dict[str, Any]])
async def get_trending_suggestions() -> List[Dict[str, Any]]:
    """
    Fetch trending money lines for chat suggestions from The Odds API
    """
    try:
        url = ODDS_API_URL.format(key=ODDS_API_KEY)
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
        suggestions = []
        for event in data:
            home = event.get("home_team")
            away = event.get("away_team")
            if home and away:
                suggestions.append(
                    {
                        "prompt": f"NBA: {home} vs {away} Money Line",
                        "type": "moneyline",
                        "teams": [home, away],
                        "odds": event.get("bookmakers", []),
                    }
                )
        # Fallback if no suggestions
        if not suggestions:
            suggestions = [
                {"prompt": "What are today's top NBA money lines?", "type": "default"}
            ]
        return suggestions
    except Exception as e:
        logging.error(f"Error fetching trending suggestions: {e}")
        return [{"prompt": "What are today's top NBA money lines?", "type": "default"}]
