"""
Runner for backfilling best line bookmaker name fields.
"""
import sys, os
ROOT = os.path.dirname(os.path.dirname(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from scripts.backfill_bestline_names import run_backfill

if __name__ == '__main__':
    run_backfill()
