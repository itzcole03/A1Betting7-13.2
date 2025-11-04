#!/usr/bin/env python3
"""
Debug script to test Phase 1.2 data generation in SimplePropFinderService
"""

import sys
import os
import json
from typing import Dict, Any

# Add backend directory to path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

from services.simple_propfinder_service import SimplePropFinderService

def test_phase12_methods():
    """Test the Phase 1.2 methods directly"""
    service = SimplePropFinderService()
    
    print("=== Testing Phase 1.2 Methods ===\n")
    
    # Generate sample bookmaker data
    prop_id = "test_nba_lebron_james_points_1"
    line = 27.5
    base_odds = -110
    
    print(f"Generating multi-bookmaker odds for line: {line}, base odds: {base_odds}")
    bookmakers = service._generate_multi_book_odds(line, base_odds, prop_id)
    
    print(f"Generated {len(bookmakers)} bookmakers:")
    for i, book in enumerate(bookmakers):
        print(f"  {i+1}. {book['name']}: {book['odds']} (line: {book['line']}, available: {book.get('is_available', True)})")
    
    print(f"\n=== Testing _find_best_odds ===")
    best_line_data = service._find_best_odds(bookmakers)
    print(f"Best line data: {json.dumps(best_line_data, indent=2)}")
    
    print(f"\n=== Testing _detect_arbitrage_opportunity ===") 
    arbitrage_data = service._detect_arbitrage_opportunity(bookmakers, line)
    print(f"Arbitrage data: {json.dumps(arbitrage_data, indent=2)}")
    
    print(f"\n=== Final Phase 1.2 Field Values ===")
    print(f"bestBookmaker: {best_line_data.get('best_bookmaker', 'N/A')}")
    print(f"lineSpread: {best_line_data.get('line_spread', 0.0)}")
    print(f"oddsSpread: {best_line_data.get('odds_spread', 0)}")
    print(f"numBookmakers: {best_line_data.get('num_bookmakers', 0)}")
    print(f"hasArbitrage: {arbitrage_data.get('has_arbitrage', False)}")
    print(f"arbitrageProfitPct: {arbitrage_data.get('profit_pct', 0.0)}")

def test_full_api_flow():
    """Test the full API flow with a single opportunity"""
    print(f"\n=== Testing Full API Flow ===")
    
    service = SimplePropFinderService()
    opportunities = service.get_opportunities()
    
    if opportunities:
        first_opp = opportunities[0]
        print(f"First opportunity Phase 1.2 fields:")
        print(f"  bestBookmaker: {first_opp.bestBookmaker}")
        print(f"  lineSpread: {first_opp.lineSpread}")
        print(f"  oddsSpread: {first_opp.oddsSpread}")
        print(f"  numBookmakers: {first_opp.numBookmakers}")
        print(f"  hasArbitrage: {first_opp.hasArbitrage}")
        print(f"  arbitrageProfitPct: {first_opp.arbitrageProfitPct}")
        
        print(f"\n  Bookmaker data preview:")
        for i, book in enumerate(first_opp.bookmakers[:3]):  # First 3 bookmakers
            print(f"    {i+1}. {book['name']}: {book['odds']}")
    else:
        print("No opportunities generated!")

if __name__ == "__main__":
    try:
        test_phase12_methods()
        test_full_api_flow()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()