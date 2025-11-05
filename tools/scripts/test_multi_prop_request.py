import requests

"""Utility script to test PropOllama endpoints.

This module performs network I/O only when executed directly. Importing
the module for tests or discovery will not trigger HTTP requests.
"""

# Adjust the URL if your backend is running elsewhere
URL = "http://localhost:8000/api/propollama/final_analysis"

PAYLOAD = {
    "userId": "testuser",
    "sessionId": "session123",
    "entryAmount": 50.0,
    "selectedProps": [
        {
            "player": "LeBron James",
            "statType": "points",
            "line": 27.5,
            "choice": "over",
            "odds": "+100",
            "sport": "basketball_nba",
        },
        {
            "player": "Anthony Davis",
            "statType": "rebounds",
            "line": 10.5,
            "choice": "under",
            "odds": "-110",
            "sport": "basketball_nba",
        },
    ],
}

HEADERS = {"Content-Type": "application/json"}


def check_health(base_url: str = "http://localhost:8000") -> None:
    """Simple health check to ensure backend is reachable."""
    try:
        resp = requests.get(f"{base_url}/health", timeout=5)
        print("Health check status:", resp.status_code)
    except Exception as e:
        print("Health check failed:", e)


def post_sample(url: str = URL, payload: dict = PAYLOAD, headers: dict = HEADERS) -> None:
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        print("Status Code:", response.status_code)
        print("Response:", response.text)
    except Exception as e:
        print("Request failed:", e)


def main() -> None:
    check_health()
    post_sample()


if __name__ == "__main__":
    main()
