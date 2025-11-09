#!/bin/bash
# A1Betting Quick Cleanup Script
# Execute this to remove dead code and establish NBA-only data pipeline

set -e  # Exit on error

echo "================================================================================"
echo "A1BETTING COMPREHENSIVE CLEANUP - AUTOMATED EXECUTION"
echo "================================================================================"

# Create backup directories
echo "Creating backup directories..."
mkdir -p deleted_services/phase1_unused
mkdir -p deleted_services/phase2_mock_data
mkdir -p deleted_services/phase3_non_nba

# Count services before cleanup
BEFORE_COUNT=$(find backend/services -name "*.py" -type f | wc -l)
echo "Services before cleanup: $BEFORE_COUNT"

echo ""
echo "================================================================================"
echo "PHASE 1: DELETING UNUSED SERVICES (43 files)"
echo "================================================================================"

# Large unused services
echo "Deleting large unused services..."
mv backend/services/enhanced_integration_manager.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - enhanced_integration_manager.py not found"
mv backend/services/odds_storage_service.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - odds_storage_service.py not found"
mv backend/services/export_service.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - export_service.py not found"
mv backend/services/database_migration_service.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - database_migration_service.py not found"
mv backend/services/cache/cache_warming_service.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - cache_warming_service.py not found"
mv backend/services/optimized_database_service.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - optimized_database_service.py not found"
mv backend/services/metrics/correlation_ticketing_metrics.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - correlation_ticketing_metrics.py not found"
mv backend/services/websocket_data_streamer.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - websocket_data_streamer.py not found"
mv backend/services/ingestion/edge_trigger.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - edge_trigger.py not found"
mv backend/services/database_health_checker.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - database_health_checker.py not found"

# Medium unused services
echo "Deleting medium unused services..."
mv backend/services/provider_resilience_integration.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - provider_resilience_integration.py not found"
mv backend/services/cache/simple_cache_warmer.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - simple_cache_warmer.py not found"
mv backend/services/propollama_intelligence_service.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - propollama_intelligence_service.py not found"
mv backend/services/redis_cache_service.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - redis_cache_service.py not found"
mv backend/services/llm_hooks.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - llm_hooks.py not found"
mv backend/services/player_performance_service.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - player_performance_service.py not found"
mv backend/services/test_rationale_v2_demo.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - test_rationale_v2_demo.py not found"
mv backend/services/database/analyze_database.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - analyze_database.py not found"
mv backend/services/transaction_service.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - transaction_service.py not found"
mv backend/services/statcast_ml_integration_simple.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - statcast_ml_integration_simple.py not found"

# Small unused services
echo "Deleting small unused services..."
mv backend/services/database_migration.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - database_migration.py not found"
mv backend/services/cache/distributed_cache_service.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - distributed_cache_service.py not found"
mv backend/services/cache/cache_invalidation_service.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - cache_invalidation_service.py not found"
mv backend/services/cache/cache.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - cache.py not found"
mv backend/services/external/api_integration_service.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - api_integration_service.py not found"
mv backend/services/external/api_integration.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - api_integration.py not found"
mv backend/services/ingestion/ingestion_pipeline.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - ingestion_pipeline.py not found"
mv backend/services/metrics/metrics_service.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - metrics_service.py not found"
mv backend/services/metrics/model_metrics_service.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - model_metrics_service.py not found"
mv backend/services/database/database_service.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - database_service.py not found"
mv backend/services/odds_normalization.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - odds_normalization.py not found"
mv backend/services/generate_realistic_mock_odds.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - generate_realistic_mock_odds.py not found"
mv backend/services/enhanced_ml_shim.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - enhanced_ml_shim.py not found"
mv backend/services/real_data_service.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - real_data_service.py not found"
mv backend/services/external/api_integration_v2.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - api_integration_v2.py not found"
mv backend/services/email_service.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - email_service.py not found"
mv backend/services/mlb_feature_engineering.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - mlb_feature_engineering.py not found"
mv backend/services/websocket_manager.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - websocket_manager.py not found"
mv backend/services/optimized_data_service.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - optimized_data_service.py not found"
mv backend/services/real_ultra_accuracy_engine.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - real_ultra_accuracy_engine.py not found"
mv backend/services/optimized_intelligent_caching_service.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - optimized_intelligent_caching_service.py not found"
mv backend/services/cache/redis_rate_limiter.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - redis_rate_limiter.py not found"
mv backend/services/real_sportsbook_service.py deleted_services/phase1_unused/ 2>/dev/null || echo "  - real_sportsbook_service.py not found"

echo ""
echo "================================================================================"
echo "PHASE 2: REMOVING NON-NBA SERVICES"
echo "================================================================================"

# Delete MLB services
echo "Deleting MLB services..."
mv backend/services/mlb_provider_client.py deleted_services/phase3_non_nba/ 2>/dev/null || echo "  - mlb_provider_client.py not found"
mv backend/services/mlb_stats_api_client.py deleted_services/phase3_non_nba/ 2>/dev/null || echo "  - mlb_stats_api_client.py not found"
mv backend/services/baseball_savant_client.py deleted_services/phase3_non_nba/ 2>/dev/null || echo "  - baseball_savant_client.py not found"
mv backend/services/enhanced_baseball_savant_client.py deleted_services/phase3_non_nba/ 2>/dev/null || echo "  - enhanced_baseball_savant_client.py not found"

# Count services after cleanup
AFTER_COUNT=$(find backend/services -name "*.py" -type f | wc -l)
DELETED_COUNT=$((BEFORE_COUNT - AFTER_COUNT))

echo ""
echo "================================================================================"
echo "CLEANUP SUMMARY"
echo "================================================================================"
echo "Services before: $BEFORE_COUNT"
echo "Services after: $AFTER_COUNT"
echo "Services deleted: $DELETED_COUNT"
echo ""
echo "Deleted files moved to: deleted_services/"
echo ""
echo "Next steps:"
echo "1. Review backend/services/nba_provider_client.py and remove mock data"
echo "2. Update services to use nba_provider_client.py instead of mock data"
echo "3. Test backend to ensure no import errors"
echo "4. Verify only real NBA API data is being used"
echo "================================================================================"
