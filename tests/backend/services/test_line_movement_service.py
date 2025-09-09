"""
Tests for LineMovementService

Validates snapshot recording, opportunity enrichment, and movement calculations.
Tests both database and in-memory fallback modes.
"""

from backend.services.line_movement_service import line_movement_service
from types import SimpleNamespace
import time
import pytest


def test_line_movement_basic():
    """Test basic snapshot and enrichment workflow"""
    # Create a test opportunity
    opp = SimpleNamespace(
        sport="MLB", 
        player="Test Player", 
        market="Hits", 
        line=1.5, 
        odds=-110
    )
    
    # Record initial snapshot
    line_movement_service.record_snapshot(opp)
    line_movement_service.enrich_opportunity(opp)
    
    # Should have opening and latest values
    assert getattr(opp, "openingLine", None) == 1.5
    assert getattr(opp, "latestLine", None) == 1.5
    assert getattr(opp, "openingOdds", None) == -110
    assert getattr(opp, "latestOdds", None) == -110
    assert getattr(opp, "lineChange", None) == 0.0
    assert getattr(opp, "oddsChange", None) == 0
    assert getattr(opp, "movementDirection", None) == "flat"


def test_line_movement_with_changes():
    """Test line movement detection with changed values"""
    # Create test opportunity
    opp = SimpleNamespace(
        sport="MLB",
        player="Movement Player", 
        market="Hits",
        line=1.5,
        odds=-110
    )
    
    # Record initial snapshot
    line_movement_service.record_snapshot(opp)
    line_movement_service.enrich_opportunity(opp)
    
    # Modify line and odds to simulate movement
    opp.line = 2.0
    opp.odds = -105
    
    # Record second snapshot (should be throttled unless we bypass)
    # Temporarily bypass throttle by clearing last snapshot time
    opp_id = line_movement_service._build_id(opp)
    line_movement_service._last_snapshot.pop(opp_id, None)
    
    line_movement_service.record_snapshot(opp)
    line_movement_service.enrich_opportunity(opp)

    # Verify movement calculations
    assert getattr(opp, "openingLine", None) == 1.5  # Original line
    assert getattr(opp, "latestLine", None) == 2.0   # New line
    assert getattr(opp, "lineChange", None) == 0.5   # Difference
    assert getattr(opp, "movementDirection", None) == "up"  # Direction
    assert getattr(opp, "openingOdds", None) == -110  # Original odds
    assert getattr(opp, "latestOdds", None) == -105   # New odds
    assert getattr(opp, "oddsChange", None) == 5      # Odds difference


def test_movement_direction_detection():
    """Test movement direction calculations"""
    # Test upward movement
    opp_up = SimpleNamespace(
        sport="NBA",
        player="Up Player",
        market="Points", 
        line=25.5,
        odds=-110
    )
    line_movement_service.record_snapshot(opp_up)
    opp_up.line = 26.0
    
    opp_id = line_movement_service._build_id(opp_up)
    line_movement_service._last_snapshot.pop(opp_id, None)
    
    line_movement_service.record_snapshot(opp_up)
    line_movement_service.enrich_opportunity(opp_up)
    assert getattr(opp_up, "movementDirection", None) == "up"
    
    # Test downward movement
    opp_down = SimpleNamespace(
        sport="NBA",
        player="Down Player", 
        market="Points",
        line=25.5,
        odds=-110
    )
    line_movement_service.record_snapshot(opp_down)
    opp_down.line = 24.0
    
    opp_id = line_movement_service._build_id(opp_down)
    line_movement_service._last_snapshot.pop(opp_id, None)
    
    line_movement_service.record_snapshot(opp_down)
    line_movement_service.enrich_opportunity(opp_down)
    assert getattr(opp_down, "movementDirection", None) == "down"


def test_opportunity_id_generation():
    """Test stable opportunity ID generation"""
    opp1 = SimpleNamespace(sport="NBA", player="LeBron James", market="Points", line=25.5)
    opp2 = SimpleNamespace(sport="NBA", player="LeBron James", market="Points", line=26.0)  # Different line
    
    id1 = line_movement_service._build_id(opp1)
    id2 = line_movement_service._build_id(opp2)
    
    # Should be same ID for same player/market (line excluded for movement tracking)
    assert id1 == id2
    assert "NBA" in id1
    assert "LeBron James" in id1
    assert "Points" in id1
    assert "25.5" not in id1  # Line should NOT be in ID


def test_enum_handling():
    """Test handling of enum values in opportunity fields"""
    from backend.services.simple_propfinder_service import Sport, Market
    
    opp = SimpleNamespace(
        sport=Sport.NBA,
        player="Enum Player", 
        market=Market.POINTS,
        line=25.5,
        odds=-110
    )
    
    # Should handle enums gracefully
    opp_id = line_movement_service._build_id(opp)
    assert "NBA" in opp_id
    assert "Points" in opp_id
    
    line_movement_service.record_snapshot(opp)
    line_movement_service.enrich_opportunity(opp)
    
    # Should work without errors
    assert getattr(opp, "openingLine", None) is not None


def test_throttling_behavior():
    """Test snapshot throttling to prevent excessive DB writes"""
    opp = SimpleNamespace(
        sport="NFL",
        player="Throttle Player",
        market="Receiving Yards", 
        line=75.5,
        odds=-110
    )
    
    # Record first snapshot
    line_movement_service.record_snapshot(opp)
    
    # Immediately try to record again (should be throttled)
    opp.line = 76.0  # Change line
    line_movement_service.record_snapshot(opp)
    
    # Enrichment should still show original values due to throttling
    line_movement_service.enrich_opportunity(opp)
    assert getattr(opp, "openingLine", None) == 75.5
    assert getattr(opp, "latestLine", None) == 75.5  # No change due to throttle


def test_missing_data_handling():
    """Test graceful handling of missing or invalid data"""
    opp = SimpleNamespace(
        sport="NBA",
        player="Incomplete Player",
        market="Points"
        # Missing line and odds
    )
    
    # Should not crash with missing data
    line_movement_service.record_snapshot(opp)
    line_movement_service.enrich_opportunity(opp)
    
    # Should handle None values gracefully
    opp_none = SimpleNamespace(
        sport="NBA",
        player="None Player",
        market="Points",
        line=None,
        odds=None
    )
    
    line_movement_service.record_snapshot(opp_none)
    line_movement_service.enrich_opportunity(opp_none)


def test_history_retrieval():
    """Test historical snapshot retrieval"""
    opp = SimpleNamespace(
        sport="NHL",
        player="History Player",
        market="Goals",
        line=0.5,
        odds=-120
    )
    
    line_movement_service.record_snapshot(opp)
    opp_id = line_movement_service._build_id(opp)
    
    # Get history
    history = line_movement_service.get_history(opp_id, limit=10)
    
    # Should return some data (exact format depends on storage mode)
    assert isinstance(history, list)


def test_service_initialization():
    """Test service initialization and singleton behavior"""
    # Should be same instance
    service1 = line_movement_service
    from backend.services.line_movement_service import LineMovementService
    service2 = LineMovementService.get_instance()
    
    assert service1 is service2
    
    # Should initialize storage
    service1.init_storage()
    assert service1._initialized is True


def test_fallback_mode_handling():
    """Test in-memory fallback when database unavailable"""
    # Service should handle database unavailability gracefully
    # and fall back to in-memory storage
    service = line_movement_service
    
    # Force in-memory mode for testing
    original_db = service._db
    service._db = None
    service.in_memory_only = True
    
    try:
        opp = SimpleNamespace(
            sport="NBA", 
            player="Fallback Player",
            market="Points",
            line=28.5,
            odds=-110
        )
        
        service.record_snapshot(opp)
        service.enrich_opportunity(opp)
        
        # Should still work in memory mode
        assert getattr(opp, "openingLine", None) == 28.5
        
    finally:
        # Restore original state
        service._db = original_db
        service.in_memory_only = False


def test_rounding_precision():
    """Test line change rounding precision"""
    opp = SimpleNamespace(
        sport="MLB",
        player="Precision Player", 
        market="Hits",
        line=1.12345,
        odds=-110
    )
    
    line_movement_service.record_snapshot(opp)
    opp.line = 1.67890
    
    opp_id = line_movement_service._build_id(opp)
    line_movement_service._last_snapshot.pop(opp_id, None)
    
    line_movement_service.record_snapshot(opp)
    line_movement_service.enrich_opportunity(opp)
    
    # Should round to 3 decimal places
    line_change = getattr(opp, "lineChange", None)
    assert line_change == 0.555  # Rounded to 3 decimal places