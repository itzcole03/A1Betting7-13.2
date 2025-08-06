import pytest

from backend.services.comprehensive_prop_generator import ComprehensivePropGenerator


@pytest.mark.asyncio
async def test_generate_game_props_phase2_stats():
    generator = ComprehensivePropGenerator()
    # Use a valid game_id from /mlb/todays-games endpoint for real data
    game_id = 776879  # Replace with a valid game_id if needed
    result = await generator.generate_game_props(game_id, optimize_performance=True)
    assert isinstance(result, dict)
    assert "props" in result
    assert "phase2_stats" in result
    assert isinstance(result["phase2_stats"], dict)
    assert result["phase2_stats"].get("total_props_generated", 0) > 0
    assert result["phase2_stats"].get("high_confidence_props", 0) > 0
