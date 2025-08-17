"""
Tests for Prop Mapper

Test suite covering raw data transformation,
normalization logic, and line hash computation.
"""

import pytest
from datetime import datetime

from backend.ingestion.normalization.prop_mapper import (
    map_raw_to_normalized, compute_line_hash, derive_prop_type, 
    validate_normalized_prop, PropMappingError
)
from backend.ingestion.models.dto import (
    RawExternalPropDTO, NormalizedPropDTO, PropTypeEnum, PayoutType, PayoutSchema
)
from backend.ingestion.normalization.taxonomy_service import TaxonomyService, TaxonomyError


class TestPropMapper:
    """Test cases for prop mapper functionality."""
    
    @pytest.fixture
    def taxonomy_service(self):
        """Taxonomy service instance for testing."""
        return TaxonomyService()
    
    @pytest.fixture
    def sample_raw_prop(self):
        """Sample raw prop for testing."""
        return RawExternalPropDTO(
            external_player_id="player_12345",
            player_name="LeBron James",
            team_code="LAL", 
            prop_category="Points",
            line_value=25.5,
            provider_prop_id="nba_prop_12345",
            payout_type=PayoutType.STANDARD,
            over_odds=-110,
            under_odds=-110,
            updated_ts="2024-01-15T10:30:00Z",
            provider_name="test_provider",
            additional_data={
                "position": "PF",
                "game_id": "game_123",
                "market_id": "market_456"
            }
        )
    
    def test_map_raw_to_normalized_success(self, taxonomy_service, sample_raw_prop):
        """Test successful mapping from raw to normalized DTO."""
        
        result = map_raw_to_normalized(sample_raw_prop, taxonomy_service)
        
        # Should return normalized DTO
        assert isinstance(result, NormalizedPropDTO)
        assert result.player_name == "LeBron James"
        assert result.team_abbreviation == "LAL"
        assert result.prop_type == PropTypeEnum.POINTS
        assert result.offered_line == 25.5
        assert result.payout_schema.over == -110
        assert result.payout_schema.under == -110
        assert result.source == "test_provider"
        assert result.sport == "NBA"
        
        # External IDs should be preserved
        assert result.external_ids["provider_player_id"] == "player_12345"
        assert result.external_ids["provider_prop_id"] == "nba_prop_12345"
        assert result.external_ids["provider_name"] == "test_provider"
        
        # Line hash should be computed
        assert result.line_hash is not None
        assert len(result.line_hash) == 64  # SHA-256 hex
        
        # Position should be extracted
        assert result.position == "PF"
    
    def test_map_raw_to_normalized_team_normalization(self, taxonomy_service):
        """Test team code normalization during mapping."""
        
        # Test various team formats
        test_cases = [
            ("Lakers", "LAL"),
            ("GSW", "GSW"), 
            ("GOLDEN STATE", "GSW"),
            ("boston", "BOS"),
            ("Heat", "MIA")
        ]
        
        for input_team, expected_team in test_cases:
            raw_prop = RawExternalPropDTO(
                external_player_id="test_player",
                player_name="Test Player",
                team_code=input_team,
                prop_category="Points",
                line_value=20.5,
                provider_prop_id="test_prop",
                over_odds=-110,
                under_odds=-110,
                updated_ts="2024-01-15T10:30:00Z"
            )
            
            result = map_raw_to_normalized(raw_prop, taxonomy_service)
            assert result.team_abbreviation == expected_team, f"Expected {expected_team} for input {input_team}"
    
    def test_map_raw_to_normalized_prop_category_normalization(self, taxonomy_service):
        """Test prop category normalization during mapping."""
        
        test_cases = [
            ("Points", PropTypeEnum.POINTS),
            ("Assists", PropTypeEnum.ASSISTS),
            ("PTS", PropTypeEnum.POINTS),
            ("Player Points", PropTypeEnum.POINTS),
            ("3-Point Field Goals Made", PropTypeEnum.THREE_POINTERS_MADE),
            ("Rebounds", PropTypeEnum.REBOUNDS),
            ("Steals", PropTypeEnum.STEALS),
            ("Blocks", PropTypeEnum.BLOCKS),
            ("Turnovers", PropTypeEnum.TURNOVERS)
        ]
        
        for input_category, expected_type in test_cases:
            raw_prop = RawExternalPropDTO(
                external_player_id="test_player",
                player_name="Test Player",
                team_code="LAL",
                prop_category=input_category,
                line_value=15.5,
                provider_prop_id="test_prop",
                over_odds=-110,
                under_odds=-110,
                updated_ts="2024-01-15T10:30:00Z"
            )
            
            result = map_raw_to_normalized(raw_prop, taxonomy_service)
            assert result.prop_type == expected_type, f"Expected {expected_type} for input {input_category}"
    
    def test_map_raw_to_normalized_taxonomy_error_propagation(self, taxonomy_service):
        """Test that taxonomy errors are properly propagated."""
        
        # Unknown team should raise PropMappingError
        raw_prop = RawExternalPropDTO(
            external_player_id="test_player",
            player_name="Test Player", 
            team_code="UNKNOWN_TEAM",
            prop_category="Points",
            line_value=20.5,
            provider_prop_id="test_prop",
            over_odds=-110,
            under_odds=-110,
            updated_ts="2024-01-15T10:30:00Z"
        )
        
        with pytest.raises(PropMappingError):
            map_raw_to_normalized(raw_prop, taxonomy_service)
        
        # Unknown prop category should raise PropMappingError
        raw_prop.team_code = "LAL"
        raw_prop.prop_category = "Unknown Stat Category"
        
        with pytest.raises(PropMappingError):
            map_raw_to_normalized(raw_prop, taxonomy_service)
    
    def test_compute_line_hash_deterministic(self):
        """Test that line hash computation is deterministic."""
        
        payout_schema = PayoutSchema(type=PayoutType.STANDARD, over=-110, under=-110)
        
        # Same inputs should produce same hash
        hash1 = compute_line_hash(PropTypeEnum.POINTS, 25.5, payout_schema)
        hash2 = compute_line_hash(PropTypeEnum.POINTS, 25.5, payout_schema)
        
        assert hash1 == hash2
        assert len(hash1) == 64  # SHA-256 hex
        
        # Different inputs should produce different hashes
        hash3 = compute_line_hash(PropTypeEnum.POINTS, 26.5, payout_schema)
        assert hash1 != hash3
        
        hash4 = compute_line_hash(PropTypeEnum.ASSISTS, 25.5, payout_schema)
        assert hash1 != hash4
    
    def test_compute_line_hash_with_different_payouts(self):
        """Test line hash computation with different payout schemas."""
        
        payout1 = PayoutSchema(type=PayoutType.STANDARD, over=-110, under=-110)
        payout2 = PayoutSchema(type=PayoutType.STANDARD, over=-115, under=-110)
        payout3 = PayoutSchema(type=PayoutType.FLEX, over=-110, under=-110)
        
        # Different payouts should produce different hashes
        hash1 = compute_line_hash(PropTypeEnum.POINTS, 20.5, payout1)
        hash2 = compute_line_hash(PropTypeEnum.POINTS, 20.5, payout2)
        hash3 = compute_line_hash(PropTypeEnum.POINTS, 20.5, payout3)
        
        assert hash1 != hash2
        assert hash1 != hash3
        assert hash2 != hash3
    
    def test_compute_line_hash_with_none_odds(self):
        """Test line hash computation handles None odds."""
        
        # Should handle None over odds
        payout1 = PayoutSchema(type=PayoutType.STANDARD, over=None, under=-110)
        hash1 = compute_line_hash(PropTypeEnum.POINTS, 20.5, payout1)
        assert len(hash1) == 64
        
        # Should handle None under odds
        payout2 = PayoutSchema(type=PayoutType.STANDARD, over=-110, under=None)
        hash2 = compute_line_hash(PropTypeEnum.POINTS, 20.5, payout2)
        assert len(hash2) == 64
        
        # Should handle both None
        payout3 = PayoutSchema(type=PayoutType.STANDARD, over=None, under=None)
        hash3 = compute_line_hash(PropTypeEnum.POINTS, 20.5, payout3)
        assert len(hash3) == 64
        
        # All should be different
        assert hash1 != hash2
        assert hash1 != hash3  
        assert hash2 != hash3
    
    def test_derive_prop_type_success(self, taxonomy_service):
        """Test successful prop type derivation."""
        
        assert derive_prop_type("Points", taxonomy_service) == PropTypeEnum.POINTS
        assert derive_prop_type("Assists", taxonomy_service) == PropTypeEnum.ASSISTS
        assert derive_prop_type("PTS", taxonomy_service) == PropTypeEnum.POINTS
    
    def test_derive_prop_type_unknown_category(self, taxonomy_service):
        """Test prop type derivation with unknown category."""
        
        with pytest.raises(PropMappingError):
            derive_prop_type("Unknown Category", taxonomy_service)
    
    def test_validate_normalized_prop_valid(self, taxonomy_service, sample_raw_prop):
        """Test validation of valid normalized prop."""
        
        normalized = map_raw_to_normalized(sample_raw_prop, taxonomy_service)
        assert validate_normalized_prop(normalized) is True
    
    def test_validate_normalized_prop_invalid_cases(self):
        """Test validation of invalid normalized props."""
        
        payout_schema = PayoutSchema(type=PayoutType.STANDARD, over=-110, under=-110)
        
        # Empty player name
        invalid_prop = NormalizedPropDTO(
            player_id=None,
            player_name="",
            team_abbreviation="LAL",
            prop_type=PropTypeEnum.POINTS,
            offered_line=25.5,
            source="test",
            payout_schema=payout_schema,
            external_ids={"test": "123"},
            timestamp=datetime.utcnow(),
            line_hash="test_hash",
            position=None,
            sport="NBA"
        )
        assert validate_normalized_prop(invalid_prop) is False
        
        # Empty team abbreviation
        invalid_prop.player_name = "Test Player"
        invalid_prop.team_abbreviation = ""
        assert validate_normalized_prop(invalid_prop) is False
        
        # Negative line value
        invalid_prop.team_abbreviation = "LAL"
        invalid_prop.offered_line = -5.0
        assert validate_normalized_prop(invalid_prop) is False
        
        # Empty source
        invalid_prop.offered_line = 25.5
        invalid_prop.source = ""
        assert validate_normalized_prop(invalid_prop) is False
        
        # Empty line hash
        invalid_prop.source = "test"
        invalid_prop.line_hash = ""
        assert validate_normalized_prop(invalid_prop) is False
    
    def test_mapping_preserves_decimal_precision(self, taxonomy_service):
        """Test that decimal line values are preserved precisely."""
        
        test_lines = [25.5, 10.0, 7.5, 12.25, 8.75]
        
        for line_value in test_lines:
            raw_prop = RawExternalPropDTO(
                external_player_id="test_player",
                player_name="Test Player",
                team_code="LAL",
                prop_category="Points",
                line_value=line_value,
                provider_prop_id="test_prop",
                over_odds=-110,
                under_odds=-110,
                updated_ts="2024-01-15T10:30:00Z"
            )
            
            result = map_raw_to_normalized(raw_prop, taxonomy_service)
            assert result.offered_line == line_value
    
    def test_batch_mapping_consistency(self, taxonomy_service):
        """Test consistent behavior when mapping multiple props."""
        
        raw_props = []
        for i in range(10):
            raw_props.append(RawExternalPropDTO(
                external_player_id=f"player_{i}",
                player_name=f"Player {i}",
                team_code="LAL",
                prop_category="Points",
                line_value=20.5 + i,
                provider_prop_id=f"prop_{i}",
                over_odds=-110,
                under_odds=-110,
                updated_ts="2024-01-15T10:30:00Z"
            ))
        
        # Map all props
        results = []
        for raw_prop in raw_props:
            result = map_raw_to_normalized(raw_prop, taxonomy_service)
            results.append(result)
        
        # All should be successfully mapped
        assert len(results) == 10
        
        # Each should have unique line hash (different player names and lines)
        line_hashes = [result.line_hash for result in results]
        assert len(set(line_hashes)) == 10
        
        # All should have same prop type and team
        assert all(result.prop_type == PropTypeEnum.POINTS for result in results)
        assert all(result.team_abbreviation == "LAL" for result in results)