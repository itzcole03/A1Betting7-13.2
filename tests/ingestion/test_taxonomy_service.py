"""
Tests for Taxonomy Service

Test suite covering prop category and team normalization,
caching behavior, and error handling.
"""

import pytest
from datetime import datetime
from threading import Thread
import time

from backend.ingestion.normalization.taxonomy_service import TaxonomyService, TaxonomyError
from backend.ingestion.models.dto import PropTypeEnum


class TestTaxonomyService:
    """Test cases for taxonomy service functionality."""
    
    @pytest.fixture
    def taxonomy_service(self):
        """Fresh taxonomy service instance for each test."""
        return TaxonomyService()
    
    def test_normalize_prop_category_mapped_values(self, taxonomy_service):
        """Test normalization of mapped prop categories."""
        
        # Test exact matches
        assert taxonomy_service.normalize_prop_category("Points") == PropTypeEnum.POINTS
        assert taxonomy_service.normalize_prop_category("Assists") == PropTypeEnum.ASSISTS
        assert taxonomy_service.normalize_prop_category("Rebounds") == PropTypeEnum.REBOUNDS
        
        # Test variations
        assert taxonomy_service.normalize_prop_category("points") == PropTypeEnum.POINTS
        assert taxonomy_service.normalize_prop_category("Player Points") == PropTypeEnum.POINTS
        assert taxonomy_service.normalize_prop_category("3-Point Field Goals Made") == PropTypeEnum.THREE_POINTERS_MADE
        
        # Test abbreviations
        assert taxonomy_service.normalize_prop_category("PTS") == PropTypeEnum.POINTS
        assert taxonomy_service.normalize_prop_category("AST") == PropTypeEnum.ASSISTS
        assert taxonomy_service.normalize_prop_category("REB") == PropTypeEnum.REBOUNDS
    
    def test_normalize_prop_category_case_insensitive(self, taxonomy_service):
        """Test case insensitive prop category matching."""
        
        assert taxonomy_service.normalize_prop_category("POINTS") == PropTypeEnum.POINTS
        assert taxonomy_service.normalize_prop_category("points") == PropTypeEnum.POINTS
        assert taxonomy_service.normalize_prop_category("Points") == PropTypeEnum.POINTS
        assert taxonomy_service.normalize_prop_category("pOiNtS") == PropTypeEnum.POINTS
    
    def test_normalize_prop_category_partial_matches(self, taxonomy_service):
        """Test partial matching for common patterns."""
        
        # Should match based on keyword
        assert taxonomy_service.normalize_prop_category("Total Point Scored") == PropTypeEnum.POINTS
        assert taxonomy_service.normalize_prop_category("Player Assist Total") == PropTypeEnum.ASSISTS
        assert taxonomy_service.normalize_prop_category("Defensive Rebounds") == PropTypeEnum.REBOUNDS
        assert taxonomy_service.normalize_prop_category("Three Point Makes") == PropTypeEnum.THREE_POINTERS_MADE
        assert taxonomy_service.normalize_prop_category("Steal Count") == PropTypeEnum.STEALS
        assert taxonomy_service.normalize_prop_category("Block Total") == PropTypeEnum.BLOCKS
        assert taxonomy_service.normalize_prop_category("Turnover Count") == PropTypeEnum.TURNOVERS
    
    def test_normalize_prop_category_unknown_raises_error(self, taxonomy_service):
        """Test that unknown prop categories raise TaxonomyError."""
        
        with pytest.raises(TaxonomyError, match="Unknown prop category"):
            taxonomy_service.normalize_prop_category("Completely Unknown Stat")
        
        with pytest.raises(TaxonomyError, match="Unknown prop category"):
            taxonomy_service.normalize_prop_category("XYZ123")
        
        with pytest.raises(TaxonomyError):
            taxonomy_service.normalize_prop_category("")
    
    def test_normalize_team_code_standard_abbreviations(self, taxonomy_service):
        """Test normalization of standard NBA team abbreviations."""
        
        # Standard abbreviations should return themselves
        assert taxonomy_service.normalize_team_code("LAL") == "LAL"
        assert taxonomy_service.normalize_team_code("GSW") == "GSW"
        assert taxonomy_service.normalize_team_code("BOS") == "BOS"
        assert taxonomy_service.normalize_team_code("MIA") == "MIA"
    
    def test_normalize_team_code_variations(self, taxonomy_service):
        """Test normalization of team name variations."""
        
        # Full team names
        assert taxonomy_service.normalize_team_code("Los Angeles Lakers") == "LAL"
        assert taxonomy_service.normalize_team_code("GOLDEN STATE") == "GSW"
        assert taxonomy_service.normalize_team_code("boston") == "BOS"
        
        # Alternative abbreviations
        assert taxonomy_service.normalize_team_code("GS") == "GSW"
        assert taxonomy_service.normalize_team_code("LAK") == "LAL"
        assert taxonomy_service.normalize_team_code("BRK") == "BKN"
        
        # Team nicknames
        assert taxonomy_service.normalize_team_code("Lakers") == "LAL"
        assert taxonomy_service.normalize_team_code("Warriors") == "GSW"
        assert taxonomy_service.normalize_team_code("Celtics") == "BOS"
    
    def test_normalize_team_code_case_insensitive(self, taxonomy_service):
        """Test case insensitive team code matching."""
        
        assert taxonomy_service.normalize_team_code("lal") == "LAL"
        assert taxonomy_service.normalize_team_code("gsw") == "GSW"
        assert taxonomy_service.normalize_team_code("LAKERS") == "LAL"
        assert taxonomy_service.normalize_team_code("warriors") == "GSW"
    
    def test_normalize_team_code_unknown_raises_error(self, taxonomy_service):
        """Test that unknown team codes raise TaxonomyError."""
        
        with pytest.raises(TaxonomyError, match="Unknown team identifier"):
            taxonomy_service.normalize_team_code("XYZ")
        
        with pytest.raises(TaxonomyError, match="Unknown team identifier"):
            taxonomy_service.normalize_team_code("UNKNOWN TEAM")
    
    def test_caching_behavior(self, taxonomy_service):
        """Test that mappings are cached and timestamps updated."""
        
        # Check initial state
        initial_reload_time = taxonomy_service.last_reload_timestamp
        assert initial_reload_time is not None
        
        # Verify mappings are loaded
        assert taxonomy_service.prop_mapping_count > 0
        assert taxonomy_service.team_mapping_count > 0
        
        # Test that repeated calls don't change timestamp
        time.sleep(0.01)  # Small delay
        taxonomy_service.normalize_prop_category("Points")
        assert taxonomy_service.last_reload_timestamp == initial_reload_time
    
    def test_reload_updates_timestamp(self, taxonomy_service):
        """Test that reload() updates the timestamp."""
        
        initial_timestamp = taxonomy_service.last_reload_timestamp
        
        # Wait a bit to ensure timestamp difference
        time.sleep(0.01)
        
        # Reload mappings
        taxonomy_service.reload()
        
        # Timestamp should be updated
        new_timestamp = taxonomy_service.last_reload_timestamp
        assert new_timestamp > initial_timestamp
    
    def test_add_prop_mapping(self, taxonomy_service):
        """Test adding new prop category mappings."""
        
        # Add custom mapping
        custom_category = "Custom Stat Type"
        taxonomy_service.add_prop_mapping(custom_category, PropTypeEnum.POINTS)
        
        # Should now normalize correctly
        assert taxonomy_service.normalize_prop_category(custom_category) == PropTypeEnum.POINTS
        
        # Mapping count should increase
        original_count = len(taxonomy_service._prop_mapping_cache)
        taxonomy_service.add_prop_mapping("Another Custom", PropTypeEnum.ASSISTS)
        assert len(taxonomy_service._prop_mapping_cache) == original_count + 1
    
    def test_add_team_mapping(self, taxonomy_service):
        """Test adding new team mappings."""
        
        # Add custom team mapping
        custom_team = "CUSTOM"
        taxonomy_service.add_team_mapping(custom_team, "CUS")
        
        # Should now normalize correctly
        assert taxonomy_service.normalize_team_code(custom_team) == "CUS"
        
        # Mapping count should increase
        original_count = len(taxonomy_service._team_mapping_cache)
        taxonomy_service.add_team_mapping("ANOTHER", "ANO")
        assert len(taxonomy_service._team_mapping_cache) == original_count + 1
    
    def test_get_supported_types(self, taxonomy_service):
        """Test getting supported prop types and teams."""
        
        prop_types = taxonomy_service.get_supported_prop_types()
        teams = taxonomy_service.get_supported_teams()
        
        # Should contain expected values
        assert PropTypeEnum.POINTS in prop_types
        assert PropTypeEnum.ASSISTS in prop_types
        assert PropTypeEnum.REBOUNDS in prop_types
        
        assert "LAL" in teams
        assert "GSW" in teams
        assert "BOS" in teams
    
    def test_validation_methods(self, taxonomy_service):
        """Test prop and team validation methods."""
        
        # Valid categories should return True
        assert taxonomy_service.validate_prop_category("Points") is True
        assert taxonomy_service.validate_prop_category("Assists") is True
        
        # Invalid categories should return False
        assert taxonomy_service.validate_prop_category("Unknown Category") is False
        assert taxonomy_service.validate_prop_category("") is False
        
        # Valid teams should return True
        assert taxonomy_service.validate_team_code("LAL") is True
        assert taxonomy_service.validate_team_code("Lakers") is True
        
        # Invalid teams should return False
        assert taxonomy_service.validate_team_code("XYZ") is False
        assert taxonomy_service.validate_team_code("") is False
    
    def test_thread_safety(self, taxonomy_service):
        """Test thread safety of taxonomy operations."""
        
        results = []
        errors = []
        
        def normalize_props():
            try:
                for i in range(100):
                    result = taxonomy_service.normalize_prop_category("Points")
                    results.append(result)
            except Exception as e:
                errors.append(e)
        
        # Run concurrent normalizations
        threads = []
        for _ in range(5):
            thread = Thread(target=normalize_props)
            threads.append(thread)
            thread.start()
        
        # Wait for completion
        for thread in threads:
            thread.join()
        
        # Should have no errors and consistent results
        assert len(errors) == 0
        assert len(results) == 500  # 100 per thread * 5 threads
        assert all(result == PropTypeEnum.POINTS for result in results)
    
    def test_comprehensive_nba_teams_coverage(self, taxonomy_service):
        """Test that all 30 NBA teams are covered."""
        
        expected_teams = [
            "ATL", "BOS", "BKN", "CHA", "CHI", "CLE", "DAL", "DEN", "DET", "GSW",
            "HOU", "IND", "LAC", "LAL", "MEM", "MIA", "MIL", "MIN", "NOP", "NYK", 
            "OKC", "ORL", "PHI", "PHX", "POR", "SAC", "SAS", "TOR", "UTA", "WAS"
        ]
        
        supported_teams = taxonomy_service.get_supported_teams()
        
        # All 30 NBA teams should be supported
        for team in expected_teams:
            assert team in supported_teams, f"Team {team} not supported"
        
        # Test that they all normalize to themselves
        for team in expected_teams:
            assert taxonomy_service.normalize_team_code(team) == team


class TestTaxonomySingleton:
    """Test the global taxonomy service singleton."""
    
    def test_singleton_instance(self):
        """Test that taxonomy_service is a singleton."""
        from backend.ingestion.normalization.taxonomy_service import taxonomy_service
        
        # Should be the same instance
        from backend.ingestion.normalization.taxonomy_service import taxonomy_service as service2
        assert taxonomy_service is service2
        
        # Should have mappings loaded
        assert taxonomy_service.prop_mapping_count > 0
        assert taxonomy_service.team_mapping_count > 0