import asyncio

import httpx


async def test_prizepicks_api():
    url = "https://api.prizepicks.com/projections"
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; PrizePicksBot/1.0; +https://yourdomain.com)",
        "Accept": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            print(f"Status: {response.status_code}")
            print(f"Headers: {response.headers}")
            print(f"Text (first 500 chars): {response.text[:500]}")
            response.raise_for_status()
            data = response.json()
            print(f"Keys: {list(data.keys())}")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    asyncio.run(test_prizepicks_api())
