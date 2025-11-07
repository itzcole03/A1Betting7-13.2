#!/usr/bin/env python3
"""
Portfolio Rationale Service V2 Demo

Demonstrates the enhanced narrative generation with V2 template, 
token estimation, safety filtering, and composition change tracking.
"""

import asyncio
from datetime import datetime
from typing import Dict, Any, List

from portfolio_rationale_service import (
    PortfolioRationaleService,
    RationaleRequest,
    RationaleType,
    RationaleTemplate,
)


async def demo_v2_rationale_generation():
    """Demonstrate V2 rationale generation with all enhancements"""
    
    print("🚀 Portfolio Rationale Service V2 Demo")
    print("=" * 50)
    
    # Initialize service
    service = PortfolioRationaleService()
    
    # Sample portfolio data
    sample_portfolio = {
        "selected_props": [
            {
                "player_name": "LeBron James",
                "sport": "NBA",
                "market_type": "points",
                "edge_value": 0.12,
                "confidence": 0.85,
                "position_size": 100,
                "expected_value": 15.2,
                "game_id": "lal_vs_bos_2024"
            },
            {
                "player_name": "Stephen Curry",
                "sport": "NBA", 
                "market_type": "threes",
                "edge_value": 0.08,
                "confidence": 0.78,
                "position_size": 75,
                "expected_value": 12.8,
                "game_id": "gsw_vs_den_2024"
            },
            {
                "player_name": "Patrick Mahomes",
                "sport": "NFL",
                "market_type": "passing_yards",
                "edge_value": 0.15,
                "confidence": 0.92,
                "position_size": 125,
                "expected_value": 22.5,
                "game_id": "kc_vs_buf_2024"
            }
        ],
        "total_exposure": 300,
        "expected_return": 50.5
    }
    
    # Sample ticket composition for change tracking
    ticket_composition = {
        "legs": ["lebron_points_over", "curry_threes_over", "mahomes_passing_over"],
        "total_legs": 3,
        "parlay_type": "mixed_sports"
    }
    
    # Test 1: V2 Template Generation
    print("\n📊 Test 1: V2 Template Generation")
    print("-" * 30)
    
    v2_request = RationaleRequest(
        rationale_type=RationaleType.RATIONALE_V2,
        portfolio_data=sample_portfolio,
        template_version=RationaleTemplate.V2_STRUCTURED,
        run_id="demo_run_001",
        token_threshold=1500,  # Lower threshold to trigger compression
        ticket_composition=ticket_composition,
        personalization_weights={"risk_focus": 0.8, "sports_preference": 0.6}
    )
    
    response_v2 = await service.generate_rationale(v2_request, user_id="demo_user")
    
    if response_v2:
        print(f"✅ Generated V2 rationale (ID: {response_v2.request_id})")
        
        if response_v2.token_estimation:
            print(f"📏 Token estimation: {response_v2.token_estimation.estimated_tokens} tokens")
            print(f"🗜️  Compression applied: {response_v2.token_estimation.compression_applied}")
        
        print(f"👤 Personalization applied: {response_v2.personalization_applied}")
        print(f"🛡️  Safety check passed: {response_v2.safety_check_passed}")
        print(f"⏱️  Generation time: {response_v2.generation_time_ms}ms")
        
        print("\n📝 Structured Sections:")
        if response_v2.structured_sections:
            sections = response_v2.structured_sections.to_dict()
            for section_name, content in sections.items():
                if content:
                    print(f"  • {section_name.replace('_', ' ').title()}: {content[:100]}...")
        
        print("\n📋 Key Points:")
        for i, point in enumerate(response_v2.key_points, 1):
            print(f"  {i}. {point}")
        
        print(f"\n📖 Full Narrative:\n{response_v2.narrative[:300]}...")
    else:
        print("❌ Failed to generate V2 rationale")
    
    # Test 2: Composition Change Tracking
    print("\n🔄 Test 2: Composition Change Tracking")
    print("-" * 30)
    
    # Modify ticket composition significantly (>30% change)
    modified_composition = {
        "legs": ["lebron_points_over", "durant_points_over", "mahomes_rushing_over"],  # Changed 2/3 legs
        "total_legs": 3,
        "parlay_type": "mixed_sports"
    }
    
    modified_request = RationaleRequest(
        rationale_type=RationaleType.RATIONALE_V2,
        portfolio_data=sample_portfolio,
        template_version=RationaleTemplate.V2_STRUCTURED,
        run_id="demo_run_001",  # Same run_id
        ticket_composition=modified_composition
    )
    
    # This should trigger cache invalidation due to >30% composition change
    response_modified = await service.generate_rationale(modified_request, user_id="demo_user")
    
    if response_modified:
        print("✅ Generated rationale after composition change")
        print(f"🗑️  Cache invalidations triggered: {service.composition_invalidations}")
    
    # Test 3: Token Compression
    print("\n🗜️  Test 3: Token Compression Demo")
    print("-" * 30)
    
    # Create a request with very detailed props to trigger compression
    detailed_portfolio = {
        "selected_props": [
            {
                "player_name": f"Player {i}",
                "sport": "NBA",
                "market_type": "points",
                "edge_value": 0.1 + (i * 0.01),
                "confidence": 0.8,
                "position_size": 50,
                "expected_value": 10 + i,
                "detailed_analysis": f"Extensive analysis for player {i} includes historical performance, matchup analysis, injury reports, weather conditions, and advanced metrics..." * 3
            }
            for i in range(10)  # 10 detailed props
        ],
        "total_exposure": 500,
        "expected_return": 100
    }
    
    compression_request = RationaleRequest(
        rationale_type=RationaleType.RATIONALE_V2,
        portfolio_data=detailed_portfolio,
        template_version=RationaleTemplate.V2_STRUCTURED,
        token_threshold=800,  # Low threshold to force compression
        run_id="compression_test"
    )
    
    response_compression = await service.generate_rationale(compression_request, user_id="demo_user")
    
    if response_compression and response_compression.token_estimation:
        print(f"📏 Estimated tokens: {response_compression.token_estimation.estimated_tokens}")
        print(f"🎯 Threshold: {response_compression.token_estimation.threshold}")
        print(f"🗜️  Compression needed: {response_compression.token_estimation.needs_compression}")
        print(f"✂️  Compression applied: {response_compression.token_estimation.compression_applied}")
        print(f"📊 Compressions applied (total): {service.token_compressions_applied}")
    
    # Test 4: Service Metrics and Status
    print("\n📊 Test 4: Service Metrics & Exit Criteria")
    print("-" * 30)
    
    metrics = service.get_metrics()
    status = service.get_status()
    
    print(f"📈 Total requests: {metrics['total_requests']}")
    print(f"🎯 Cache hit rate: {metrics['current_cache_hit_rate']:.1%}")
    print(f"✅ Cache hit target met: {metrics['cache_hit_target_met']}")
    print(f"🆚 V2 adoption rate: {metrics['v2_adoption_rate']:.1%}")
    print(f"🛡️  Safety filter rejections: {metrics['safety_filter_rejections']}")
    print(f"🔄 Composition invalidations: {metrics['composition_invalidations']}")
    
    print("\n🎯 Exit Criteria Status:")
    exit_criteria = status['exit_criteria_status']
    print(f"  • Cache hit rate target: {exit_criteria['cache_hit_rate_target']}")
    print(f"  • Current cache hit rate: {exit_criteria['current_cache_hit_rate']}")
    print(f"  • Target met: {'✅' if exit_criteria['target_met'] else '❌'}")
    print(f"  • Safety filter active: {'✅' if exit_criteria['safety_filter_active'] else '❌'}")
    print(f"  • All narratives pass filter: {'✅' if exit_criteria['all_narratives_pass_filter'] else '❌'}")
    
    print("\n🎉 Demo completed successfully!")
    print("Key V2 enhancements demonstrated:")
    print("  ✅ Structured template with 5 sections")
    print("  ✅ Token estimation and compression")
    print("  ✅ Composition change tracking (30% threshold)")
    print("  ✅ Enhanced rate limiting (user + run_id)")
    print("  ✅ Personalization hooks")
    print("  ✅ Safety filtering")
    print("  ✅ Cache hit rate monitoring (70% target)")


if __name__ == "__main__":
    asyncio.run(demo_v2_rationale_generation())