# PrizePicks API Scraper (import-safe)
# Fetches props from the backend API endpoint and saves to CSV
# Usage: python scripts/prizepicks_api_scraper.py

API_URL = "https://api.prizepicks.com/projections"


def fetch_projections(api_url: str = API_URL, headers: dict | None = None) -> list:
    """Fetch projections from PrizePicks API.

    Network I/O is performed only when `fetch_projections` or `main()` is called.
    This function defers optional imports so importing the module is safe.
    """
    try:
        import requests
    except Exception:
        raise RuntimeError("`requests` is required to fetch PrizePicks projections")

    default_headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Referer": "https://app.prizepicks.com/",
        "Origin": "https://app.prizepicks.com",
        "Content-Type": "application/json",
    }

    hdrs = headers or default_headers
    resp = requests.get(api_url, headers=hdrs)
    resp.raise_for_status()
    data = resp.json()
    return data.get("data", [])


def main():
    try:
        raw = fetch_projections()
    except RuntimeError as exc:
        print(f"Skipping fetch: {exc}")
        return

    try:
        import pandas as pd
        import time

        all_props = []
        for proj in raw:
            attrs = proj.get("attributes", {})
            player = attrs.get("name", "")
            stat_type = attrs.get("stat_type", "")
            line_score = attrs.get("line_score", "")
            league = attrs.get("league", "")
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
            csv_name = f"prizepicks_props_{int(time.time())}.csv"
            df.to_csv(csv_name, index=False)
            print(f"Saved {len(all_props)} props to {csv_name}.")
        else:
            print("No props found in API response.")
    except Exception:
        print("No projections fetched or pandas not available.")


if __name__ == "__main__":
    main()
