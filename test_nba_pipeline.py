"""
Test Suite for NBA Data Pipeline

This test suite verifies that the NBA data pipeline is correctly implemented
and all components work together without errors.
"""

import sys
import asyncio
from datetime import datetime

# Add project root to path
sys.path.insert(0, '/home/ubuntu/A1Betting7-13.2')


def test_imports():
    """Test that all NBA pipeline components can be imported."""
    print("\n" + "=" * 80)
    print("TEST 1: Import Tests")
    print("=" * 80)
    
    try:
        from backend.services.nba_provider_client import (
            nba_provider_client,
            NBAProviderClient
        )
        print("✅ NBA Provider Client imported")
    except Exception as e:
        print(f"❌ Failed to import NBA Provider Client: {e}")
        return False
    
    try:
        from backend.services.nba_data_adapter import (
            nba_data_adapter,
            NBADataAdapter,
            get_nba_teams,
            get_nba_players,
            get_nba_games,
            get_nba_props
        )
        print("✅ NBA Data Adapter imported")
    except Exception as e:
        print(f"❌ Failed to import NBA Data Adapter: {e}")
        return False
    
    print("✅ All imports successful")
    return True


def test_provider_client_structure():
    """Test that the provider client has the expected methods."""
    print("\n" + "=" * 80)
    print("TEST 2: Provider Client Structure")
    print("=" * 80)
    
    from backend.services.nba_provider_client import nba_provider_client
    
    required_methods = [
        'fetch_teams',
        'fetch_players',
        'fetch_todays_games',
        'fetch_games_for_date',
        'generate_player_props'
    ]
    
    for method in required_methods:
        if hasattr(nba_provider_client, method):
            print(f"✅ Method '{method}' exists")
        else:
            print(f"❌ Method '{method}' missing")
            return False
    
    print("✅ All required methods exist")
    return True


def test_adapter_structure():
    """Test that the adapter has the expected methods."""
    print("\n" + "=" * 80)
    print("TEST 3: Data Adapter Structure")
    print("=" * 80)
    
    from backend.services.nba_data_adapter import nba_data_adapter
    
    required_methods = [
        'get_all_teams',
        'get_team_by_abbreviation',
        'get_team_roster',
        'get_todays_games',
        'get_games_for_date',
        'get_player_props',
        'get_active_players',
        'find_player_by_name',
        'get_upcoming_games',
        'clear_cache',
        'get_cache_stats'
    ]
    
    for method in required_methods:
        if hasattr(nba_data_adapter, method):
            print(f"✅ Method '{method}' exists")
        else:
            print(f"❌ Method '{method}' missing")
            return False
    
    print("✅ All required methods exist")
    return True


def test_cache_functionality():
    """Test that the cache works correctly."""
    print("\n" + "=" * 80)
    print("TEST 4: Cache Functionality")
    print("=" * 80)
    
    from backend.services.nba_data_adapter import nba_data_adapter
    
    # Get initial cache stats
    stats = nba_data_adapter.get_cache_stats()
    print(f"✅ Initial cache stats: {stats}")
    
    # Clear cache
    nba_data_adapter.clear_cache()
    stats_after_clear = nba_data_adapter.get_cache_stats()
    
    if stats_after_clear['total_cached_keys'] == 0:
        print("✅ Cache cleared successfully")
    else:
        print(f"❌ Cache not cleared: {stats_after_clear}")
        return False
    
    print("✅ Cache functionality works")
    return True


async def test_async_methods():
    """Test that async methods can be called."""
    print("\n" + "=" * 80)
    print("TEST 5: Async Method Calls")
    print("=" * 80)
    
    from backend.services.nba_data_adapter import nba_data_adapter
    
    try:
        # Test get_all_teams (should work even without nba_api)
        teams = await nba_data_adapter.get_all_teams(use_cache=False)
        print(f"✅ get_all_teams() called successfully (returned {len(teams)} teams)")
        
        # Test get_active_players
        players = await nba_data_adapter.get_active_players(use_cache=False)
        print(f"✅ get_active_players() called successfully (returned {len(players)} players)")
        
        # Test get_todays_games
        games = await nba_data_adapter.get_todays_games(use_cache=False)
        print(f"✅ get_todays_games() called successfully (returned {len(games)} games)")
        
        # Test get_player_props
        props = await nba_data_adapter.get_player_props(use_cache=False)
        print(f"✅ get_player_props() called successfully (returned {len(props)} props)")
        
        print("✅ All async methods callable")
        return True
        
    except Exception as e:
        print(f"❌ Async method call failed: {e}")
        return False


def test_no_mock_data_in_provider():
    """Verify that the provider client doesn't use mock data."""
    print("\n" + "=" * 80)
    print("TEST 6: No Mock Data in Provider Client")
    print("=" * 80)
    
    import re
    
    with open('/home/ubuntu/A1Betting7-13.2/backend/services/nba_provider_client.py', 'r') as f:
        content = f.read()
    
    # Check for mock/random patterns
    mock_patterns = [
        r'random\.randint',
        r'random\.choice',
        r'random\.uniform',
        r'np\.random\.',
        r'def.*_mock_',
        r'mock_data\s*='
    ]
    
    found_mock = False
    for pattern in mock_patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        if matches:
            print(f"❌ Found mock pattern: {pattern} ({len(matches)} occurrences)")
            found_mock = True
    
    if not found_mock:
        print("✅ No mock data patterns found in provider client")
        return True
    else:
        print("❌ Mock data patterns detected")
        return False


def test_no_mock_data_in_adapter():
    """Verify that the adapter doesn't use mock data."""
    print("\n" + "=" * 80)
    print("TEST 7: No Mock Data in Adapter")
    print("=" * 80)
    
    import re
    
    with open('/home/ubuntu/A1Betting7-13.2/backend/services/nba_data_adapter.py', 'r') as f:
        content = f.read()
    
    # Check for mock/random patterns
    mock_patterns = [
        r'random\.randint',
        r'random\.choice',
        r'random\.uniform',
        r'np\.random\.',
        r'def.*_mock_',
        r'mock_data\s*='
    ]
    
    found_mock = False
    for pattern in mock_patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        if matches:
            print(f"❌ Found mock pattern: {pattern} ({len(matches)} occurrences)")
            found_mock = True
    
    if not found_mock:
        print("✅ No mock data patterns found in adapter")
        return True
    else:
        print("❌ Mock data patterns detected")
        return False


def test_convenience_functions():
    """Test the convenience functions."""
    print("\n" + "=" * 80)
    print("TEST 8: Convenience Functions")
    print("=" * 80)
    
    from backend.services.nba_data_adapter import (
        get_nba_teams,
        get_nba_players,
        get_nba_games,
        get_nba_props
    )
    
    # Just verify they're callable
    print("✅ get_nba_teams() exists")
    print("✅ get_nba_players() exists")
    print("✅ get_nba_games() exists")
    print("✅ get_nba_props() exists")
    
    print("✅ All convenience functions exist")
    return True


async def run_all_tests():
    """Run all tests."""
    print("\n" + "=" * 80)
    print("NBA DATA PIPELINE TEST SUITE")
    print("=" * 80)
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = []
    
    # Synchronous tests
    results.append(("Import Tests", test_imports()))
    results.append(("Provider Client Structure", test_provider_client_structure()))
    results.append(("Data Adapter Structure", test_adapter_structure()))
    results.append(("Cache Functionality", test_cache_functionality()))
    results.append(("No Mock Data in Provider", test_no_mock_data_in_provider()))
    results.append(("No Mock Data in Adapter", test_no_mock_data_in_adapter()))
    results.append(("Convenience Functions", test_convenience_functions()))
    
    # Async tests
    results.append(("Async Method Calls", await test_async_methods()))
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print("\n" + "=" * 80)
    print(f"Results: {passed}/{total} tests passed")
    print("=" * 80)
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! 🎉")
        return True
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return False


if __name__ == "__main__":
    # Run the test suite
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1)
