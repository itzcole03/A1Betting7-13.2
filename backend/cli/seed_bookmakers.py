"""CLI entrypoint to seed bookmaker registry."""
import logging
import sys

def main():
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    try:
        from backend.database import sync_engine
        from sqlalchemy.orm import Session
        from backend.services.seed_bookmakers import seed_bookmakers_sync

        with Session(sync_engine) as session:
            seeded = seed_bookmakers_sync(session)
            logger.info(f"Seeded {len(seeded)} bookmakers")
            for b in seeded:
                logger.info(f" - {b.name} ({b.display_name})")

    except Exception as e:
        logger.error(f"Failed to seed bookmakers: {e}")
        sys.exit(2)

if __name__ == '__main__':
    main()
