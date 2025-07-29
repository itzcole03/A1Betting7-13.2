import asyncio
import logging
import os
import sys

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure backend/ is in sys.path for direct script execution
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.etl_providerx_sample import etl_job
from backend.models.base import Base
from backend.services.mlb_provider_client import MLBProviderClient

logging.basicConfig(level=logging.INFO)


async def run_async_etl():
    # Setup DB session (use production or dev DB as needed)
    engine = create_engine("sqlite:///./a1betting_fallback.db", echo=False)
    SessionLocal = sessionmaker(bind=engine)
    Base.metadata.create_all(engine)
    db_session = SessionLocal()
    mlb_client = MLBProviderClient()
    await etl_job_async(mlb_client, db_session)
    db_session.close()


async def etl_job_async(api_client, session):
    # Wraps the sync etl_job to support async get_data
    try:
        raw_data = await api_client.get_data()
        if session is not None:
            from backend.etl_providerx_sample import load_data

            load_data(session, raw_data)
            logging.info(
                "MLB ETL job completed: %d teams, %d events, %d odds processed.",
                len(raw_data.get("teams", [])),
                len(raw_data.get("events", [])),
                len(raw_data.get("odds", [])),
            )
        else:
            logging.warning("No database session provided. Skipping load stage.")
    except Exception as err:
        logging.error("MLB ETL job failed: %s", err, exc_info=True)


if __name__ == "__main__":
    asyncio.run(run_async_etl())
