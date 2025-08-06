import asyncio

import httpx
import pytest


@pytest.mark.asyncio
async def test_prizepicks_api():
    url = "https://api.prizepicks.com/projections"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://app.prizepicks.com/",
        "Origin": "https://app.prizepicks.com",
        "Connection": "keep-alive",
        "DNT": "1",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
    }
    params = {
        "per_page": "10",
        "single_stat": "true",
        "include": "new_player,league,stat_type",
    }
    async with httpx.AsyncClient(
        timeout=10.0, headers=headers, follow_redirects=True
    ) as client:
        try:
            response = await client.get(url, params=params)
            print(f"Status: {response.status_code}")
            print(f"Headers: {response.headers}")
            print(f"Body: {response.text[:500]}")
        except Exception as e:
            print(f"Exception: {e}")


if __name__ == "__main__":
    asyncio.run(test_prizepicks_api())
