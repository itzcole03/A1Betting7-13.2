#!/usr/bin/env python3
"""
NBA Ingestion CLI Script

Command-line interface for executing NBA data ingestion pipeline.
Provides manual execution capabilities with flexible parameters.

Usage:
    python scripts/run_nba_ingestion.py --limit 50
    python scripts/run_nba_ingestion.py --no-upsert
"""

import asyncio
import argparse
import sys
import logging
from pathlib import Path
import os

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Execute NBA data ingestion pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                          # Run with default settings
  %(prog)s --limit 100              # Limit to 100 props
  %(prog)s --no-upsert              # Read-only mode (no database writes)
  %(prog)s --limit 25 --verbose     # Limit props and enable verbose logging
        """
    )
    
    parser.add_argument(
        '--limit',
        type=int,
        default=None,
        metavar='N',
        help='Maximum number of props to process (default: no limit)'
    )
    
    parser.add_argument(
        '--no-upsert',
        action='store_true',
        help='Disable database upserts (read-only mode)'
    )
    
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose logging (DEBUG level)'
    )
    
    parser.add_argument(
        '--quiet',
        action='store_true',
        help='Quiet mode (WARNING level and above only)'
    )
    
    args = parser.parse_args()
    
    # Set logging level based on arguments
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
        logger.info("Verbose logging enabled")
    elif args.quiet:
        logging.getLogger().setLevel(logging.WARNING)
    
    # Validate arguments
    if args.limit is not None and args.limit <= 0:
        logger.error("Error: --limit must be a positive integer")
        sys.exit(2)
    
    logger.info("Starting NBA data ingestion pipeline...")
    logger.info(f"Parameters: limit={args.limit}, allow_upsert={not args.no_upsert}")
    
    try:
        # Import and run the ingestion pipeline
        from backend.ingestion.pipeline import run_nba_ingestion
        
        result = await run_nba_ingestion(
            limit=args.limit,
            allow_upsert=not args.no_upsert
        )
        
        # Report results
        print("\n" + "="*60)
        print("NBA INGESTION RESULTS")
        print("="*60)
        print(f"Status: {result.status.upper()}")
        print(f"Duration: {result.duration_ms}ms" if result.duration_ms else "Duration: N/A")
        print(f"Started: {result.started_at}")
        print(f"Finished: {result.finished_at}" if result.finished_at else "Finished: N/A")
        print()
        print("COUNTS:")
        print(f"  Raw props fetched: {result.total_raw}")
        print(f"  New players: {result.total_new_players}")
        print(f"  New props: {result.total_new_props}")
        print(f"  New quotes: {result.total_new_quotes}")
        print(f"  Line changes: {result.total_line_changes}")
        print(f"  Unchanged: {result.total_unchanged}")
        print(f"  Errors: {len(result.errors)}")
        
        if result.errors:
            print("\nERRORS:")
            for i, error in enumerate(result.errors[:5], 1):  # Show first 5 errors
                print(f"  {i}. {error.error_type}: {error.message}")
                if error.external_prop_id:
                    print(f"     Prop ID: {error.external_prop_id}")
            
            if len(result.errors) > 5:
                print(f"  ... and {len(result.errors) - 5} more errors")
        
        print(f"\nSuccess Rate: {result.success_rate:.1f}%")
        print(f"Ingest Run ID: {result.ingest_run_id}")
        print("="*60)
        
        # Exit with appropriate code
        if result.status == "success":
            logger.info("NBA ingestion completed successfully")
            sys.exit(0)
        elif result.status == "partial":
            logger.warning(f"NBA ingestion completed with {len(result.errors)} errors")
            sys.exit(1)
        else:  # failed
            logger.error(f"NBA ingestion failed with {len(result.errors)} errors")
            sys.exit(1)
            
    except KeyboardInterrupt:
        logger.info("Ingestion interrupted by user")
        sys.exit(130)  # Standard exit code for SIGINT
        
    except ImportError as e:
        logger.error(f"Import error - ensure you're running from project root: {e}")
        sys.exit(3)
        
    except Exception as e:
        logger.error(f"Unexpected error during ingestion: {e}", exc_info=True)
        sys.exit(1)


def validate_environment():
    """Validate that required environment is available."""
    try:
        # Check if we can import the required modules
        from backend.ingestion.pipeline import run_nba_ingestion
        from backend.ingestion.sources import default_nba_provider
        from backend.ingestion.normalization import taxonomy_service
        
        logger.debug("Environment validation passed")
        return True
        
    except ImportError as e:
        logger.error(f"Environment validation failed: {e}")
        logger.error("Ensure you're running from the project root directory")
        logger.error("and all dependencies are installed.")
        return False


if __name__ == "__main__":
    # Validate environment before starting
    if not validate_environment():
        sys.exit(4)
    
    # Run the async main function
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Script interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"Script failed: {e}", exc_info=True)
        sys.exit(1)