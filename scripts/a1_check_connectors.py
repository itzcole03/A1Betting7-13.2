import asyncio
import sys
sys.path.append(r"C:\Users\bcmad\Downloads\A1Betting7-13.2")
# Import ingestion package so connector modules register themselves on import
import backend.ingestion  # noqa: F401
from backend.services import unified_data_fetcher as u

async def check():
    try:
        print('Connectors:', u.list_connectors())
        events = await u.fetch_all_events()
        print('Fetched events count:', len(events))
        if events:
            e = events[0]
            print('First event id:', getattr(e, 'id', None))
            props = await u.fetch_props_for_event(e.id)
            print('Props for first event:', len(props))
        else:
            print('No events returned; skipping props fetch')
    except Exception as exc:
        import traceback
        traceback.print_exc()

asyncio.get_event_loop().run_until_complete(check())
