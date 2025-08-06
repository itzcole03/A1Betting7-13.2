#!/usr/bin/env python3
"""
Quick debug test to identify the prop generation issue
"""
import asyncio
import logging
import os
import sys

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.services.baseball_savant_client import BaseballSavantClient

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def debug_prop_generation():
    """
    Debug the prop generation issue step by step
    """
    client = BaseballSavantClient()

    print("=" * 50)
    print("DEBUG: Single Player Prop Generation Test")
    print("=" * 50)

    # Test with a single hard-coded player ID
    test_player_id = 116997  # From the logs

    print(f"Testing prop generation for player {test_player_id}")

    try:
        # Call the get_player_statcast_data method directly
        result = await client.get_player_statcast_data(test_player_id)

        print(f"Result type: {type(result)}")
        print(
            f"Result keys: {result.keys() if isinstance(result, dict) else 'Not a dict'}"
        )

        if isinstance(result, dict):
            prop_opportunities = result.get("prop_opportunities", [])
            print(f"Prop opportunities: {len(prop_opportunities)}")

            if prop_opportunities:
                print("Sample props:")
                for i, prop in enumerate(prop_opportunities[:3]):
                    print(f"  {i+1}. {prop}")
            else:
                print("No prop opportunities found!")

                # Let's debug why
                print(f"Player stats structure:")
                for key, value in result.items():
                    if key != "prop_opportunities":
                        print(f"  {key}: {type(value)} = {value}")
        else:
            print(f"Unexpected result: {result}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(debug_prop_generation())
