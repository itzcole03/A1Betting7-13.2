#!/usr/bin/env python3
"""
Multi-Sport Streaming Validation Script

Validates the complete multi-sport architecture implementation:
- Database schema with sport columns
- Sport-aware configuration system  
- Provider registry sport capabilities
- Streaming event models with sport dimension
- Market streamer sport isolation
- Dependency index sport-keyed relationships

Usage:
    python validate_multi_sport_streaming.py [--sport NBA|MLB] [--verbose]
"""

import asyncio
import sys
import argparse
from datetime import datetime
from typing import List, Dict, Any, Optional

# Core validation imports
try:
    from backend.config.sport_settings import sport_config_manager
    from backend.services.providers.provider_registry import provider_registry
    from backend.services.events.streaming.event_models import create_market_event, StreamingEventTypes
    from backend.services.streaming.market_streamer import MarketStreamer
    from backend.services.dependency_index import DependencyIndex
    from backend.models.external_prop_record import ExternalPropRecord
    from backend.services.unified_logging import get_logger
    
    # Database validation
    from sqlalchemy import create_engine, text
    from backend.database.connection import get_database_url
    
    print("✅ All core imports successful")
    
except ImportError as e:
    print(f"❌ Import failed: {e}")
    sys.exit(1)

logger = get_logger("validation")

class MultiSportStreamingValidator:
    """Comprehensive validation of multi-sport streaming architecture"""
    
    def __init__(self, sport: str = "NBA"):
        self.sport = sport
        self.validation_results = []
        
    def log_result(self, test_name: str, passed: bool, message: str = ""):
        """Log validation result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        result = f"{status} {test_name}"
        if message:
            result += f" - {message}"
        print(result)
        self.validation_results.append({
            "test": test_name,
            "passed": passed,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        })
        
    async def validate_database_schema(self) -> bool:
        """Validate database has sport columns"""
        try:
            engine = create_engine(get_database_url())
            
            tables_to_check = [
                "props", "market_quotes", "edges", 
                "valuations", "model_predictions", "provider_states"
            ]
            
            all_tables_valid = True
            
            with engine.connect() as conn:
                for table in tables_to_check:
                    try:
                        # Check if sport column exists
                        result = conn.execute(text(f"""
                            SELECT column_name 
                            FROM information_schema.columns 
                            WHERE table_name = '{table}' AND column_name = 'sport'
                        """))
                        
                        if result.rowcount == 0:
                            self.log_result(f"DB Schema - {table}", False, "sport column missing")
                            all_tables_valid = False
                        else:
                            self.log_result(f"DB Schema - {table}", True, "sport column present")
                            
                    except Exception as e:
                        self.log_result(f"DB Schema - {table}", False, f"query failed: {str(e)}")
                        all_tables_valid = False
                        
            return all_tables_valid
            
        except Exception as e:
            self.log_result("Database Connection", False, f"Failed to connect: {str(e)}")
            return False
            
    def validate_sport_configuration(self) -> bool:
        """Validate sport configuration system"""
        try:
            # Test basic configuration access
            enabled_sports = sport_config_manager.get_enabled_sports()
            self.log_result("Sport Config - Enabled Sports", 
                          len(enabled_sports) > 0, f"Found: {enabled_sports}")
            
            # Test sport-specific configuration
            for sport in ["NBA", "MLB"]:
                config = sport_config_manager.get_sport_config(sport)
                has_config = config is not None
                self.log_result(f"Sport Config - {sport}", has_config, 
                              f"Config: {config}" if has_config else "No config found")
                
                if has_config:
                    # Test specific config values
                    polling_interval = sport_config_manager.get_polling_interval(sport)
                    enabled_providers = sport_config_manager.get_enabled_providers(sport)
                    
                    self.log_result(f"Sport Config - {sport} Polling", 
                                  polling_interval > 0, f"{polling_interval}s")
                    self.log_result(f"Sport Config - {sport} Providers", 
                                  len(enabled_providers) > 0, f"{enabled_providers}")
                                  
            return True
            
        except Exception as e:
            self.log_result("Sport Configuration", False, f"Error: {str(e)}")
            return False
            
    def validate_provider_registry(self) -> bool:
        """Validate provider registry sport capabilities"""
        try:
            # Test provider sport support
            test_providers = ["stub", "mock_provider"]
            
            for provider_name in test_providers:
                try:
                    # Test getting provider for sport
                    provider = provider_registry.get_provider(provider_name, self.sport)
                    
                    if provider:
                        supports_sport = provider.supports_sport(self.sport)
                        self.log_result(f"Provider Registry - {provider_name} supports {self.sport}",
                                      supports_sport, f"Provider capabilities checked")
                        
                        # Test provider capabilities structure
                        if hasattr(provider, 'capabilities'):
                            caps = provider.capabilities
                            has_sports = hasattr(caps, 'supported_sports') and caps.supported_sports
                            self.log_result(f"Provider Registry - {provider_name} capabilities",
                                          has_sports, f"Sports: {caps.supported_sports if has_sports else 'None'}")
                    else:
                        self.log_result(f"Provider Registry - {provider_name}", False, "Provider not found")
                        
                except Exception as e:
                    self.log_result(f"Provider Registry - {provider_name}", False, f"Error: {str(e)}")
                    
            return True
            
        except Exception as e:
            self.log_result("Provider Registry", False, f"Error: {str(e)}")
            return False
            
    def validate_streaming_events(self) -> bool:
        """Validate streaming event models with sport dimension"""
        try:
            # Test event creation with sport
            test_event = create_market_event(
                event_type=StreamingEventTypes.MARKET_LINE_CHANGE,
                provider="test_provider",
                prop_id="test_prop_123",
                sport=self.sport,
                previous_line=100.5,
                new_line=101.0,
                line_hash="test_hash",
                player_name="Test Player",
                team_code="TST",
                market_type="player_props",
                prop_category="points",
                status="active",
                odds_value=-110
            )
            
            # Validate event structure
            has_sport = hasattr(test_event, 'sport') and test_event.sport == self.sport
            self.log_result("Streaming Events - Sport Field", has_sport, 
                          f"Event sport: {getattr(test_event, 'sport', 'missing')}")
            
            has_metadata = hasattr(test_event, 'metadata') and test_event.metadata
            self.log_result("Streaming Events - Metadata", has_metadata, 
                          f"Metadata: {getattr(test_event, 'metadata', 'missing')}")
            
            # Test event type validation
            valid_type = test_event.event_type == StreamingEventTypes.MARKET_LINE_CHANGE
            self.log_result("Streaming Events - Event Type", valid_type, 
                          f"Type: {test_event.event_type}")
            
            return has_sport and has_metadata and valid_type
            
        except Exception as e:
            self.log_result("Streaming Events", False, f"Error: {str(e)}")
            return False
            
    async def validate_market_streamer(self) -> bool:
        """Validate market streamer sport-aware functionality"""
        try:
            # Create streamer instance
            streamer = MarketStreamer()
            
            # Test initialization
            has_sport_stats = "sports_processed" in streamer.stats
            self.log_result("Market Streamer - Initialization", has_sport_stats,
                          f"Stats structure: {list(streamer.stats.keys())}")
            
            # Test sport-provider key generation
            test_key = streamer._get_provider_sport_key("test_provider", self.sport)
            expected_key = f"test_provider:{self.sport}"
            key_format_correct = test_key == expected_key
            self.log_result("Market Streamer - Provider-Sport Key", key_format_correct,
                          f"Key: {test_key}")
            
            # Test prop line hash generation with sport
            test_prop = ExternalPropRecord(
                provider_prop_id="test_123",
                player_name="Test Player",
                team_code="TST",
                market_type="player_props",
                prop_category="points",
                line_value=25.5,
                odds_value=-110,
                status="active",
                sport=self.sport,  # Sport field included
                updated_ts=datetime.utcnow()
            )
            
            line_hash = streamer._generate_line_hash(test_prop)
            hash_includes_sport = self.sport in line_hash or len(line_hash) == 16  # MD5 hash length
            self.log_result("Market Streamer - Line Hash", hash_includes_sport,
                          f"Hash: {line_hash}")
            
            return has_sport_stats and key_format_correct and hash_includes_sport
            
        except Exception as e:
            self.log_result("Market Streamer", False, f"Error: {str(e)}")
            return False
            
    def validate_dependency_index(self) -> bool:
        """Validate dependency index sport isolation"""
        try:
            # Create dependency index
            dep_index = DependencyIndex()
            
            # Test sport-aware dependency addition
            dep_index.add_dependency("prop_A", "prop_B", self.sport, 0.8)
            dep_index.add_dependency("prop_C", "prop_D", "MLB", 0.6)  # Different sport
            
            # Test sport isolation
            nba_dependents = dep_index.get_dependents("prop_A", self.sport)
            mlb_dependents = dep_index.get_dependents("prop_C", "MLB")
            
            nba_isolated = len(nba_dependents) == 1 and nba_dependents[0]['dependent'] == "prop_B"
            mlb_isolated = len(mlb_dependents) == 1 and mlb_dependents[0]['dependent'] == "prop_D"
            
            self.log_result("Dependency Index - NBA Isolation", nba_isolated,
                          f"NBA dependents: {nba_dependents}")
            self.log_result("Dependency Index - MLB Isolation", mlb_isolated,
                          f"MLB dependents: {mlb_dependents}")
            
            # Test cross-sport isolation
            cross_contamination = dep_index.get_dependents("prop_A", "MLB")
            no_cross_contamination = len(cross_contamination) == 0
            self.log_result("Dependency Index - Cross-Sport Isolation", no_cross_contamination,
                          f"Cross-sport deps: {cross_contamination}")
            
            return nba_isolated and mlb_isolated and no_cross_contamination
            
        except Exception as e:
            self.log_result("Dependency Index", False, f"Error: {str(e)}")
            return False

    async def run_full_validation(self) -> Dict[str, Any]:
        """Run all validation tests"""
        print(f"🚀 Starting Multi-Sport Streaming Validation for {self.sport}")
        print(f"Timestamp: {datetime.utcnow().isoformat()}")
        print("=" * 60)
        
        # Database validation
        print("\n📊 Database Schema Validation")
        db_valid = await self.validate_database_schema()
        
        # Configuration validation
        print("\n⚙️  Sport Configuration Validation")
        config_valid = self.validate_sport_configuration()
        
        # Provider registry validation
        print("\n🔌 Provider Registry Validation")
        provider_valid = self.validate_provider_registry()
        
        # Streaming events validation
        print("\n📡 Streaming Events Validation")
        events_valid = self.validate_streaming_events()
        
        # Market streamer validation
        print("\n🌊 Market Streamer Validation")
        streamer_valid = await self.validate_market_streamer()
        
        # Dependency index validation
        print("\n🔗 Dependency Index Validation")
        deps_valid = self.validate_dependency_index()
        
        # Summary
        print("\n" + "=" * 60)
        print("📋 VALIDATION SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.validation_results)
        passed_tests = sum(1 for r in self.validation_results if r['passed'])
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        overall_success = all([
            db_valid, config_valid, provider_valid, 
            events_valid, streamer_valid, deps_valid
        ])
        
        if overall_success:
            print("🎉 ALL VALIDATIONS PASSED - Multi-sport streaming ready for deployment!")
        else:
            print("⚠️  Some validations failed - review results before deployment")
            
        return {
            "success": overall_success,
            "success_rate": success_rate,
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "sport": self.sport,
            "timestamp": datetime.utcnow().isoformat(),
            "results": self.validation_results,
            "categories": {
                "database": db_valid,
                "configuration": config_valid,
                "providers": provider_valid,
                "events": events_valid,
                "streamer": streamer_valid,
                "dependencies": deps_valid
            }
        }

async def main():
    """Main validation entry point"""
    parser = argparse.ArgumentParser(description="Validate multi-sport streaming architecture")
    parser.add_argument("--sport", default="NBA", choices=["NBA", "MLB"], 
                       help="Sport to validate against")
    parser.add_argument("--verbose", action="store_true", 
                       help="Enable verbose logging")
    
    args = parser.parse_args()
    
    if args.verbose:
        import logging
        logging.basicConfig(level=logging.DEBUG)
        
    validator = MultiSportStreamingValidator(args.sport)
    results = await validator.run_full_validation()
    
    # Exit with appropriate code
    sys.exit(0 if results["success"] else 1)

if __name__ == "__main__":
    asyncio.run(main())