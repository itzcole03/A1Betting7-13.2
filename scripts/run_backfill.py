"""Runner to execute backfill CLI using project Python."""
import sys
import os

if __name__ == '__main__':
    # Example: python scripts/run_backfill.py --dry-run --database-url sqlite:///scripts/test_backfill_local.db
    args = sys.argv[1:]
    # Ensure project root is importable
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

    # Parse simple args
    dry_run = '--dry-run' in args
    db_url = None
    if '--database-url' in args:
        idx = args.index('--database-url')
        if idx + 1 < len(args):
            db_url = args[idx + 1]

    from scripts.backfill_bestline_names import run_backfill
    run_backfill(database_url=db_url, dry_run=dry_run)
