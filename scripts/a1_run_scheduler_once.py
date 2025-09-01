import asyncio
import logging

logging.basicConfig(level=logging.INFO)

from backend.ingestion import scheduler_runner as scheduler


async def main():
    await scheduler.run_once()


if __name__ == "__main__":
    asyncio.run(main())
