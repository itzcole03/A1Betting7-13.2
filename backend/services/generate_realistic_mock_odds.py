# Best-practices mock data generator for MLB odds (for backend development only)


def generate_realistic_mock_odds():
    """
    Returns a list of realistic mock odds for MLB games, including all required fields for frontend mapping and prediction.
    Use ONLY for development/testing. In production, do not fallback to mock data.
    """
    return [
        {
            "event_id": "mock-evt-001",
            "provider_id": "mock-provider",
            "stat_type": "totals",
            "event_name": "Yankees vs Red Sox",
            "matchup": "Yankees vs Red Sox",
            "team_name": "Yankees",
            "opponent_name": "Red Sox",
            "line": 8.5,
            "line_score": 8.5,
            "start_time": "2025-07-29T19:00:00Z",
            "overOdds": 1.85,
            "underOdds": 2.05,
            "confidence": 0.78,
            "odds": [
                {"team_name": "Over", "value": 1.85},
                {"team_name": "Under", "value": 2.05},
            ],
            "player_name": "Yankees",
        },
        {
            "event_id": "mock-evt-002",
            "provider_id": "mock-provider",
            "stat_type": "spreads",
            "event_name": "Dodgers vs Giants",
            "matchup": "Dodgers vs Giants",
            "team_name": "Dodgers",
            "opponent_name": "Giants",
            "line": -1.5,
            "line_score": -1.5,
            "start_time": "2025-07-29T21:00:00Z",
            "value": 1.95,
            "confidence": 0.72,
            "player_name": "Dodgers",
        },
        # Add more realistic props as needed
    ]


# Usage in backend (for dev only):
# odds = generate_realistic_mock_odds()
