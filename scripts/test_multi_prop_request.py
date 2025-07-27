import requests

# Adjust the URL if your backend is running elsewhere
url = "http://localhost:8000/api/propollama/final_analysis"

payload = {
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

headers = {"Content-Type": "application/json"}


def check_health():
    for endpoint in ["/api/propollama/health", "/api/propollama/readiness"]:
        url = f"http://localhost:8000{endpoint}"
        try:
            resp = requests.get(url, timeout=10)
            print(f"Health check {endpoint}: {resp.status_code} {resp.text}")
        except Exception as e:
            print(f"Health check {endpoint} failed: {e}")


if __name__ == "__main__":
    check_health()

response = requests.post(url, json=payload, headers=headers, timeout=30)
print("Status Code:", response.status_code)
print("Response:", response.text)
