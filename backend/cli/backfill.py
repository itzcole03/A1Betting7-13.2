"""Management CLI for running backfill_bestline_names.run_backfill

Usage:
    python -m backend.cli.backfill [--dry-run] [--database-url <url>]
"""
import argparse
import logging
import sys

def main(argv=None):
    parser = argparse.ArgumentParser(prog="backfill")
    parser.add_argument("--dry-run", action="store_true", help="Do not commit changes; show planned updates")
    parser.add_argument("--database-url", type=str, help="Optional database URL to target")
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    try:
        # Ensure project root and scripts/ are importable
        import os
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        if project_root not in sys.path:
            sys.path.insert(0, project_root)

        try:
            from scripts.backfill_bestline_names import run_backfill
        except Exception:
            # Fallback: import by module path if available
            from backend.scripts.backfill_bestline_names import run_backfill

        # run_backfill supports a database_url argument and will behave accordingly
        run_backfill(database_url=args.database_url, dry_run=args.dry_run)
        logger.info("Backfill completed")
    except Exception as e:
        logger.error(f"Backfill failed: {e}")
        sys.exit(2)


if __name__ == '__main__':
    main()
