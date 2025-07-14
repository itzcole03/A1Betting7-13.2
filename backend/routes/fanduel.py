from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter(tags=["FanDuel"])


@router.get("/lockedbets")
async def get_fanduel_lockedbets():
    """Return fast mock FanDuel locked bets for development/testing."""
    now = datetime.now(timezone.utc)
    bets = [
        {
            "id": "mock_fd_nfl_mahomes_1",
            "event": "Chiefs vs Bills",
            "market": "Passing Yards",
            "odds": "+120",
            "prediction": "OVER",
            "timestamp": now.isoformat(),
            "sportsbook": "FanDuel",
            "label": "FanDuel",
        },
        {
            "id": "mock_fd_nba_curry_2",
            "event": "Warriors vs Lakers",
            "market": "Three Pointers Made",
            "odds": "-110",
            "prediction": "UNDER",
            "timestamp": now.isoformat(),
            "sportsbook": "FanDuel",
            "label": "FanDuel",
        },
    ]
    return bets
