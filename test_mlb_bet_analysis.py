import requests

url = "http://localhost:8000/api/v1/mlb-bet-analysis?min_confidence=70&max_results=5"
response = requests.get(url)
print(response.json())
