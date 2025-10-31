import asyncio
import logging

from backend.services.propfinder_data_service import PropFinderDataService

logging.basicConfig(level=logging.INFO)


async def main():
    svc = PropFinderDataService()
    # initialize services if needed
    try:
        await svc._initialize_services()
    except Exception:
        pass
    res = await svc.get_prop_opportunities()
    print(f"Fetched {len(res)} opportunities from PropFinder service")


if __name__ == "__main__":
    asyncio.run(main())
