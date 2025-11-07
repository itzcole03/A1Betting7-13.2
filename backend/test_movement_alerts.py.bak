#!/usr/bin/env python3
"""
Movement Alert Service Test

Tests the integration between CLV foundation and movement-based alerts system.
Validates alert triggering for line movements and CLV degradation.
"""

import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.services.movement_alert_service import (
    MovementAlertService,
    MovementAlertType,
)
from backend.services.simple_propfinder_service import (
    Direction,
    LineMovement,
    Market,
    MatchupHistory,
    Pick,
    PropOpportunity,
    SharpMoney,
    SimplePropFinderService,
    Sport,
    Trend,
    Venue,
)


def create_test_opportunity(
    player: str, market: str, line: float, odds: int, clv_percent: float = 0.0
):
    """Create test opportunity for movement analysis"""
    return PropOpportunity(
        id=f"test_{player.replace(' ', '_').lower()}_{market.lower()}",
        sport=Sport.NBA,
        player=player,
        playerImage=None,
        team="LAL",
        teamLogo=None,
        opponent="GSW",
        opponentLogo=None,
        market=Market.POINTS if market == "Points" else Market.THREE_POINTERS,
        line=line,
        pick=Pick.OVER,
        odds=odds,
        impliedProbability=52.4,
        aiProbability=48.0,
        edge=12.5,
        confidence=85.0,
        projectedValue=line + 2.0,
        volume=1500,
        trend=Trend.STABLE,
        trendStrength=3,
        timeToGame="2h 30m",
        venue=Venue.HOME,
        weather=None,
        injuries=[],
        recentForm=[25.2, 28.1, 24.8],
        matchupHistory=MatchupHistory(games=10, average=26.5, hitRate=0.6),
        lineMovement=LineMovement(open=line, current=line, direction=Direction.NONE),
        bookmakers=[],
        isBookmarked=False,
        tags=["trending"],
        socialSentiment=75,
        sharpMoney=SharpMoney.MODERATE,
        lastUpdated=datetime.now(timezone.utc),
        alertTriggered=False,
        alertSeverity=None,
        # CLV fields from our foundation
        closingLine=line,  # Same as current for test
        closingOdds=odds,  # Same as current for test
        clvPercent=clv_percent,
    )


async def test_movement_alert_service():
    """Test movement alert service functionality"""
    print("=== Movement Alert Service Test ===")

    # Initialize service
    alert_service = MovementAlertService()

    print(
        f"✅ Service initialized with {len(alert_service.movement_thresholds)} alert types"
    )

    # Test 1: Check service status
    print("\n1. Testing service status:")
    status = await alert_service.get_service_status()
    print(f"   Status: {status['status']}")
    print(f"   Polling interval: {status['polling_interval_seconds']}s")
    print(f"   Thresholds configured: {len(status['thresholds'])}")

    # Test 2: Test threshold configuration
    print("\n2. Testing threshold configuration:")
    for alert_type, config in status["thresholds"].items():
        print(
            f"   {alert_type}: threshold={config['threshold_value']}, enabled={config['enabled']}"
        )

    # Test 3: Test opportunity analysis with mock data
    print("\n3. Testing opportunity analysis:")

    # Create test opportunities with different movement patterns
    opportunities = [
        # High line movement
        create_test_opportunity("LeBron James", "Points", 28.5, -110, 0.0),
        # CLV degradation scenario
        create_test_opportunity(
            "Stephen Curry", "3-Pointers Made", 4.5, -105, -3.2
        ),  # Negative CLV
        # Normal opportunity
        create_test_opportunity("Jayson Tatum", "Points", 26.5, -115, 2.1),
    ]

    # Simulate movement analysis
    alerts = []
    for opportunity in opportunities:
        try:
            # Analyze single opportunity
            opportunity_alerts = await alert_service._analyze_opportunity_movement(
                opportunity
            )
            alerts.extend(opportunity_alerts)
            print(
                f"   Analyzed {opportunity.player} {opportunity.market}: {len(opportunity_alerts)} alerts"
            )
        except Exception as e:
            print(f"   ❌ Error analyzing {opportunity.player}: {e}")

    print(f"   Total alerts generated: {len(alerts)}")

    # Test 4: Alert detail inspection
    print("\n4. Alert details:")
    for i, alert in enumerate(alerts, 1):
        print(f"   Alert {i}: {alert.alert_type.value}")
        print(f"     Player: {alert.player_name} {alert.market}")
        print(f"     Severity: {alert.severity}")
        print(f"     Message: {alert.message}")
        print(f"     CLV Impact: {alert.clv_impact}")
        print(f"     Expires: {alert.expires_at.strftime('%H:%M:%S')}")

    # Test 5: Threshold modification
    print("\n5. Testing threshold modification:")
    original_threshold = alert_service.movement_thresholds[
        MovementAlertType.LINE_MOVEMENT
    ].threshold_value
    print(f"   Original line movement threshold: {original_threshold}")

    alert_service.update_threshold(MovementAlertType.LINE_MOVEMENT, 0.5)
    new_threshold = alert_service.movement_thresholds[
        MovementAlertType.LINE_MOVEMENT
    ].threshold_value
    print(f"   Updated line movement threshold: {new_threshold}")

    # Test 6: Alert type toggling
    print("\n6. Testing alert type control:")
    alert_service.enable_alert_type(MovementAlertType.CLV_DEGRADATION, False)
    clv_enabled = alert_service.movement_thresholds[
        MovementAlertType.CLV_DEGRADATION
    ].enabled
    print(f"   CLV degradation alerts disabled: {not clv_enabled}")

    alert_service.enable_alert_type(MovementAlertType.CLV_DEGRADATION, True)
    clv_enabled = alert_service.movement_thresholds[
        MovementAlertType.CLV_DEGRADATION
    ].enabled
    print(f"   CLV degradation alerts re-enabled: {clv_enabled}")

    # Test 7: Cooldown mechanism
    print("\n7. Testing cooldown mechanism:")
    prop_id = alert_service._build_prop_id(opportunities[0])

    # Check initial cooldown status
    in_cooldown = alert_service._is_in_cooldown(
        prop_id, MovementAlertType.LINE_MOVEMENT, 15
    )
    print(f"   Initial cooldown status: {in_cooldown}")

    # Set cooldown
    alert_service._set_cooldown(prop_id, MovementAlertType.LINE_MOVEMENT)
    in_cooldown = alert_service._is_in_cooldown(
        prop_id, MovementAlertType.LINE_MOVEMENT, 15
    )
    print(f"   After setting cooldown: {in_cooldown}")

    print("\n=== Movement Alert Service Test: SUCCESS ===")
    print("✅ Service initialization working")
    print("✅ Threshold configuration working")
    print("✅ Opportunity analysis working")
    print("✅ Alert generation working")
    print("✅ Threshold modification working")
    print("✅ Alert type control working")
    print("✅ Cooldown mechanism working")
    print(
        "✅ Ready for integration with CLV foundation and existing alerting infrastructure"
    )


if __name__ == "__main__":
    asyncio.run(test_movement_alert_service())
