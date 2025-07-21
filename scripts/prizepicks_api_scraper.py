# PrizePicks API Scraper (2024)
# Fetches props from the backend API endpoint and saves to CSV
# Requirements: pip install requests pandas

import pandas as pd
import requests

API_URL = "https://api.prizepicks.com/projections"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Referer": "https://app.prizepicks.com/",
    "Origin": "https://app.prizepicks.com",
    "Content-Type": "application/json",
}

response = requests.get(API_URL, headers=headers)
if response.status_code == 200:
    data = response.json()
    projections = data.get("data", [])
    all_props = []
    for proj in projections:
        player = proj.get("attributes", {}).get("name", "")
        stat_type = proj.get("attributes", {}).get("stat_type", "")
        line_score = proj.get("attributes", {}).get("line_score", "")
        league = proj.get("attributes", {}).get("league", "")
        all_props.append(
            {
                "Player": player,
                "Prop Type": stat_type,
                "Prop Value": line_score,
                "League": league,
            }
        )
    if all_props:
        df = pd.DataFrame(all_props)
        df.to_csv("prizepicks_props.csv", index=False)
        print(f"Saved {len(all_props)} props to prizepicks_props.csv.")
    else:
        print("No props found in API response.")
else:
    print(f"Failed to fetch props: {response.status_code}")
