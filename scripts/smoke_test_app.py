import asyncio
import json

try:
    import httpx
except Exception as e:
    print('MISSING_DEPENDENCY:httpx')
    raise

from backend.core.app import app

async def main():
    # Older httpx versions do not accept `app=` in AsyncClient constructor.
    # Use ASGITransport for compatibility.
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url='http://testserver') as client:
        resp = await client.get('/health')
        print('HEALTH_STATUS:', resp.status_code)
        try:
            data = resp.json()
            print('HEALTH_BODY_KEYS:', list(data.keys())[:10])
        except Exception:
            print('HEALTH_BODY_TEXT:', resp.text[:400])

        resp2 = await client.get('/api/propfinder/opportunities')
        print('PROPFINDER_STATUS:', resp2.status_code)
        try:
            data2 = resp2.json()
            if isinstance(data2, dict):
                keys = list(data2.keys())
                print('PROPFINDER_KEYS:', keys[:10])
                # print sample first item if present
                if 'data' in data2 and isinstance(data2['data'], dict):
                    # nested
                    print('PROPFINDER_DATA_KEYS:', list(data2['data'].keys())[:10])
            else:
                print('PROPFINDER_BODY_TYPE:', type(data2))
        except Exception:
            print('PROPFINDER_BODY_TEXT:', resp2.text[:800])

if __name__ == '__main__':
    asyncio.run(main())
