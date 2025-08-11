"""
Dashboard Customization Routes
Phase 3: Advanced UI Features - Backend support for customizable dashboards

Features:
- Save/load dashboard layouts
- Widget data provisioning
- User preferences management
- Dashboard templates
- Real-time data updates
"""

import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

# Core services
from backend.services.unified_cache_service import get_cache

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard Customization"])


# Pydantic models
class Widget(BaseModel):
    id: str
    type: str
    title: str
    x: int
    y: int
    width: int
    height: int
    config: Dict[str, Any] = {}
    visible: bool = True
    data_source: Optional[str] = None
    refresh_interval: Optional[int] = 30


class DashboardLayout(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    widgets: List[Widget]
    grid_cols: int = 6
    created_at: str
    last_modified: str
    is_default: bool = False
    is_public: bool = False
    tags: List[str] = []


class WidgetDataRequest(BaseModel):
    widget_id: str
    widget_type: str
    config: Dict[str, Any] = {}
    time_range: Optional[str] = "7d"


class DashboardPreferences(BaseModel):
    user_id: str
    default_layout_id: str
    auto_refresh: bool = True
    refresh_interval: int = 30
    theme: str = "light"
    compact_mode: bool = False


@router.get("/layouts")
async def get_dashboard_layouts(
    user_id: Optional[str] = Query(None), include_public: bool = Query(True)
) -> Dict[str, List[DashboardLayout]]:
    """Get available dashboard layouts for a user"""
    try:
        cache = await get_cache()

        # Mock layouts - in production, fetch from database
        mock_layouts = [
            {
                "id": "default",
                "name": "Default Dashboard",
                "description": "Standard sports betting overview",
                "widgets": [
                    {
                        "id": "profit_card",
                        "type": "stats_card",
                        "title": "Total Profit",
                        "x": 0,
                        "y": 0,
                        "width": 2,
                        "height": 1,
                        "config": {"metric": "total_profit", "format": "currency"},
                        "visible": True,
                        "refresh_interval": 30,
                    },
                    {
                        "id": "recent_bets",
                        "type": "recent_bets",
                        "title": "Recent Activity",
                        "x": 2,
                        "y": 0,
                        "width": 4,
                        "height": 2,
                        "config": {"limit": 10, "show_status": True},
                        "visible": True,
                        "refresh_interval": 10,
                    },
                    {
                        "id": "opportunities",
                        "type": "prop_opportunities",
                        "title": "Top Opportunities",
                        "x": 0,
                        "y": 1,
                        "width": 4,
                        "height": 2,
                        "config": {"min_confidence": 0.8, "min_ev": 0.05},
                        "visible": True,
                        "refresh_interval": 60,
                    },
                ],
                "grid_cols": 6,
                "created_at": "2024-01-01T00:00:00Z",
                "last_modified": "2024-01-01T00:00:00Z",
                "is_default": True,
                "is_public": False,
                "tags": ["default"],
            },
            {
                "id": "analytics_focused",
                "name": "Analytics Dashboard",
                "description": "Performance and analytics focused",
                "widgets": [
                    {
                        "id": "performance_chart",
                        "type": "line_chart",
                        "title": "Performance Over Time",
                        "x": 0,
                        "y": 0,
                        "width": 4,
                        "height": 2,
                        "config": {
                            "data_source": "performance_history",
                            "timeframe": "30d",
                        },
                        "visible": True,
                        "refresh_interval": 300,
                    },
                    {
                        "id": "roi_card",
                        "type": "stats_card",
                        "title": "ROI",
                        "x": 4,
                        "y": 0,
                        "width": 2,
                        "height": 1,
                        "config": {"metric": "roi", "format": "percentage"},
                        "visible": True,
                        "refresh_interval": 60,
                    },
                    {
                        "id": "sport_breakdown",
                        "type": "pie_chart",
                        "title": "Performance by Sport",
                        "x": 4,
                        "y": 1,
                        "width": 2,
                        "height": 2,
                        "config": {
                            "data_source": "sport_performance",
                            "group_by": "sport",
                        },
                        "visible": True,
                        "refresh_interval": 300,
                    },
                ],
                "grid_cols": 6,
                "created_at": "2024-01-01T00:00:00Z",
                "last_modified": "2024-01-01T00:00:00Z",
                "is_default": False,
                "is_public": True,
                "tags": ["analytics", "performance"],
            },
            {
                "id": "live_trading",
                "name": "Live Trading",
                "description": "Real-time opportunities and monitoring",
                "widgets": [
                    {
                        "id": "live_odds",
                        "type": "live_odds",
                        "title": "Live Odds",
                        "x": 0,
                        "y": 0,
                        "width": 3,
                        "height": 2,
                        "config": {
                            "sports": ["NBA", "NFL"],
                            "markets": ["moneyline", "spread"],
                        },
                        "visible": True,
                        "refresh_interval": 5,
                    },
                    {
                        "id": "arbitrage_ops",
                        "type": "prop_opportunities",
                        "title": "Arbitrage Opportunities",
                        "x": 3,
                        "y": 0,
                        "width": 3,
                        "height": 2,
                        "config": {"opportunity_type": "arbitrage", "min_profit": 2.0},
                        "visible": True,
                        "refresh_interval": 15,
                    },
                    {
                        "id": "bankroll_monitor",
                        "type": "bankroll_tracker",
                        "title": "Bankroll Monitor",
                        "x": 0,
                        "y": 2,
                        "width": 3,
                        "height": 2,
                        "config": {"show_projection": True, "timeframe": "1d"},
                        "visible": True,
                        "refresh_interval": 30,
                    },
                ],
                "grid_cols": 6,
                "created_at": "2024-01-01T00:00:00Z",
                "last_modified": "2024-01-01T00:00:00Z",
                "is_default": False,
                "is_public": True,
                "tags": ["live", "trading", "real-time"],
            },
        ]

        # Filter layouts based on user access
        layouts = []
        for layout_data in mock_layouts:
            # Convert to DashboardLayout object for validation
            layout = DashboardLayout(**layout_data)

            # Include if it's public or user owns it
            if layout.is_public or user_id:
                layouts.append(layout)

        return {"layouts": layouts}

    except Exception as e:
        logger.error(f"Error getting dashboard layouts: {e}")
        raise HTTPException(status_code=500, detail="Failed to get dashboard layouts")


@router.get("/layouts/{layout_id}")
async def get_dashboard_layout(layout_id: str) -> DashboardLayout:
    """Get a specific dashboard layout"""
    try:
        cache = await get_cache()

        # Check cache first
        cached_layout = await cache.get(f"dashboard_layout:{layout_id}")
        if cached_layout:
            return DashboardLayout(**cached_layout)

        # Mock layout fetch - in production, query database
        if layout_id == "default":
            layout_data = {
                "id": "default",
                "name": "Default Dashboard",
                "description": "Standard sports betting overview",
                "widgets": [
                    {
                        "id": "profit_card",
                        "type": "stats_card",
                        "title": "Total Profit",
                        "x": 0,
                        "y": 0,
                        "width": 2,
                        "height": 1,
                        "config": {"metric": "total_profit", "format": "currency"},
                        "visible": True,
                        "refresh_interval": 30,
                    }
                ],
                "grid_cols": 6,
                "created_at": "2024-01-01T00:00:00Z",
                "last_modified": "2024-01-01T00:00:00Z",
                "is_default": True,
                "is_public": False,
                "tags": ["default"],
            }

            layout = DashboardLayout(**layout_data)

            # Cache for 1 hour
            await cache.set(f"dashboard_layout:{layout_id}", layout.dict(), ttl=3600)

            return layout

        raise HTTPException(status_code=404, detail="Dashboard layout not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting dashboard layout {layout_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get dashboard layout")


@router.post("/layouts")
async def save_dashboard_layout(layout: DashboardLayout) -> Dict[str, str]:
    """Save a dashboard layout"""
    try:
        cache = await get_cache()

        # Update timestamp
        layout.last_modified = datetime.now().isoformat()

        # Generate ID if not provided
        if not layout.id:
            layout.id = f"layout_{int(datetime.now().timestamp())}"

        # Save to cache (in production, save to database)
        await cache.set(
            f"dashboard_layout:{layout.id}", layout.dict(), ttl=86400 * 30
        )  # 30 days

        # Also save to user's layouts list
        user_layouts_key = f"user_layouts:default"  # In production, use actual user ID
        user_layouts = await cache.get(user_layouts_key) or []

        # Update or add layout ID to user's list
        if layout.id not in user_layouts:
            user_layouts.append(layout.id)
            await cache.set(user_layouts_key, user_layouts, ttl=86400 * 30)

        return {
            "layout_id": layout.id,
            "message": "Dashboard layout saved successfully",
        }

    except Exception as e:
        logger.error(f"Error saving dashboard layout: {e}")
        raise HTTPException(status_code=500, detail="Failed to save dashboard layout")


@router.delete("/layouts/{layout_id}")
async def delete_dashboard_layout(layout_id: str) -> Dict[str, str]:
    """Delete a dashboard layout"""
    try:
        cache = await get_cache()

        # Delete from cache (in production, delete from database)
        await cache.delete(f"dashboard_layout:{layout_id}")

        # Remove from user's layouts list
        user_layouts_key = f"user_layouts:default"  # In production, use actual user ID
        user_layouts = await cache.get(user_layouts_key) or []

        if layout_id in user_layouts:
            user_layouts.remove(layout_id)
            await cache.set(user_layouts_key, user_layouts, ttl=86400 * 30)

        return {"message": "Dashboard layout deleted successfully"}

    except Exception as e:
        logger.error(f"Error deleting dashboard layout {layout_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete dashboard layout")


@router.post("/widget-data")
async def get_widget_data(request: WidgetDataRequest) -> Dict[str, Any]:
    """Get data for a specific widget"""
    try:
        cache = await get_cache()

        # Check cache first
        cache_key = f"widget_data:{request.widget_id}:{hash(str(request.config))}"
        cached_data = await cache.get(cache_key)
        if cached_data:
            return cached_data

        # Generate mock data based on widget type
        widget_data = await generate_widget_data(
            request.widget_type, request.config, request.time_range
        )

        # Cache for appropriate duration based on widget type
        cache_ttl = get_widget_cache_ttl(request.widget_type)
        await cache.set(cache_key, widget_data, ttl=cache_ttl)

        return widget_data

    except Exception as e:
        logger.error(f"Error getting widget data for {request.widget_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get widget data")


async def generate_widget_data(
    widget_type: str, config: Dict[str, Any], time_range: str
) -> Dict[str, Any]:
    """Generate mock data for different widget types"""

    if widget_type == "stats_card":
        metric = config.get("metric", "total_profit")
        if metric == "total_profit":
            return {
                "value": 2547.83,
                "change": 12.3,
                "label": "Total Profit",
                "trend": "up",
                "previous_value": 2265.45,
            }
        elif metric == "roi":
            return {
                "value": 15.7,
                "change": 2.1,
                "label": "ROI (%)",
                "trend": "up",
                "previous_value": 13.6,
            }
        elif metric == "win_rate":
            return {
                "value": 67.5,
                "change": -1.2,
                "label": "Win Rate (%)",
                "trend": "down",
                "previous_value": 68.7,
            }

    elif widget_type == "line_chart":
        data_source = config.get("data_source", "performance_history")
        timeframe = config.get("timeframe", "30d")

        # Generate time series data
        days = 30 if timeframe == "30d" else 7 if timeframe == "7d" else 1
        data_points = []

        base_value = 1000
        for i in range(days):
            date = datetime.now() - timedelta(days=days - i - 1)
            value = base_value + (i * 50) + (random.random() - 0.5) * 200
            data_points.append(
                {
                    "date": date.strftime("%Y-%m-%d"),
                    "value": round(value, 2),
                    "label": f"Day {i+1}",
                }
            )

        return {
            "data": data_points,
            "summary": {
                "total_change": data_points[-1]["value"] - data_points[0]["value"],
                "avg_value": sum(p["value"] for p in data_points) / len(data_points),
                "max_value": max(p["value"] for p in data_points),
                "min_value": min(p["value"] for p in data_points),
            },
        }

    elif widget_type == "recent_bets":
        limit = config.get("limit", 10)
        show_status = config.get("show_status", True)

        mock_bets = []
        players = [
            "LeBron James",
            "Stephen Curry",
            "Aaron Judge",
            "Josh Allen",
            "Connor McDavid",
        ]
        props = [
            "Points",
            "Assists",
            "Rebounds",
            "Strikeouts",
            "Passing Yards",
            "Goals",
        ]
        statuses = ["won", "lost", "pending"]

        for i in range(limit):
            bet = {
                "id": f"bet_{i}",
                "player": random.choice(players),
                "prop": random.choice(props),
                "line": round(random.uniform(5, 50), 1),
                "odds": random.choice([-110, -105, +100, +105, +110]),
                "amount": round(random.uniform(10, 100), 2),
                "timestamp": (
                    datetime.now() - timedelta(hours=random.randint(1, 168))
                ).isoformat(),
                "sportsbook": random.choice(
                    ["DraftKings", "FanDuel", "BetMGM", "Caesars"]
                ),
            }

            if show_status:
                bet["status"] = random.choice(statuses)
                if bet["status"] == "won":
                    bet["payout"] = bet["amount"] * (1 + abs(bet["odds"]) / 100)
                elif bet["status"] == "lost":
                    bet["payout"] = 0

            mock_bets.append(bet)

        return {
            "bets": mock_bets,
            "summary": {
                "total_amount": sum(bet["amount"] for bet in mock_bets),
                "won_count": len([b for b in mock_bets if b.get("status") == "won"]),
                "lost_count": len([b for b in mock_bets if b.get("status") == "lost"]),
                "pending_count": len(
                    [b for b in mock_bets if b.get("status") == "pending"]
                ),
            },
        }

    elif widget_type == "prop_opportunities":
        min_confidence = config.get("min_confidence", 0.7)
        min_ev = config.get("min_ev", 0.0)

        opportunities = []
        players = [
            "LeBron James",
            "Stephen Curry",
            "Aaron Judge",
            "Josh Allen",
            "Connor McDavid",
        ]
        props = [
            "Points Over",
            "Assists Over",
            "Rebounds Over",
            "Strikeouts Over",
            "Passing Yards Over",
        ]

        for i in range(8):
            confidence = random.uniform(min_confidence, 1.0)
            ev = random.uniform(min_ev, 0.25)

            opp = {
                "id": f"opp_{i}",
                "player": random.choice(players),
                "prop": random.choice(props),
                "line": round(random.uniform(10, 40), 1),
                "prediction": round(random.uniform(12, 45), 1),
                "confidence": round(confidence, 3),
                "ev": round(ev, 3),
                "odds": random.choice([-110, -105, +100, +105]),
                "sportsbook": random.choice(["DraftKings", "FanDuel", "BetMGM"]),
                "expires_at": (
                    datetime.now() + timedelta(hours=random.randint(1, 24))
                ).isoformat(),
                "sport": random.choice(["NBA", "NFL", "MLB", "NHL"]),
            }

            opportunities.append(opp)

        # Sort by EV descending
        opportunities.sort(key=lambda x: x["ev"], reverse=True)

        return {
            "opportunities": opportunities,
            "summary": {
                "total_opportunities": len(opportunities),
                "avg_confidence": sum(opp["confidence"] for opp in opportunities)
                / len(opportunities),
                "avg_ev": sum(opp["ev"] for opp in opportunities) / len(opportunities),
                "best_ev": max(opp["ev"] for opp in opportunities),
            },
        }

    elif widget_type == "bankroll_tracker":
        show_projection = config.get("show_projection", False)
        timeframe = config.get("timeframe", "7d")

        current_balance = 5247.83
        starting_balance = 5000.00

        history = []
        days = 7 if timeframe == "7d" else 30 if timeframe == "30d" else 1

        for i in range(days):
            date = datetime.now() - timedelta(days=days - i - 1)
            balance = starting_balance + (i * 35) + random.uniform(-50, 100)
            history.append(
                {
                    "date": date.strftime("%Y-%m-%d"),
                    "balance": round(balance, 2),
                    "change": round(balance - starting_balance, 2),
                }
            )

        data = {
            "current_balance": current_balance,
            "starting_balance": starting_balance,
            "total_change": current_balance - starting_balance,
            "change_percentage": (
                (current_balance - starting_balance) / starting_balance
            )
            * 100,
            "history": history,
        }

        if show_projection:
            # Simple linear projection
            avg_daily_change = sum(h["change"] for h in history[-7:]) / 7
            projected_7d = current_balance + (avg_daily_change * 7)
            projected_30d = current_balance + (avg_daily_change * 30)

            data["projections"] = {
                "7_days": round(projected_7d, 2),
                "30_days": round(projected_30d, 2),
                "avg_daily_change": round(avg_daily_change, 2),
            }

        return data

    # Default fallback
    return {
        "message": f"Mock data for {widget_type}",
        "timestamp": datetime.now().isoformat(),
        "config": config,
    }


def get_widget_cache_ttl(widget_type: str) -> int:
    """Get appropriate cache TTL for different widget types"""
    cache_ttls = {
        "stats_card": 60,  # 1 minute
        "line_chart": 300,  # 5 minutes
        "recent_bets": 30,  # 30 seconds
        "prop_opportunities": 60,  # 1 minute
        "live_odds": 10,  # 10 seconds
        "bankroll_tracker": 120,  # 2 minutes
        "performance_metrics": 300,  # 5 minutes
        "news_feed": 600,  # 10 minutes
    }

    return cache_ttls.get(widget_type, 300)  # Default 5 minutes


@router.get("/preferences")
async def get_dashboard_preferences(user_id: str = Query(...)) -> DashboardPreferences:
    """Get user dashboard preferences"""
    try:
        cache = await get_cache()

        # Check cache first
        prefs = await cache.get(f"dashboard_prefs:{user_id}")
        if prefs:
            return DashboardPreferences(**prefs)

        # Default preferences
        default_prefs = DashboardPreferences(
            user_id=user_id,
            default_layout_id="default",
            auto_refresh=True,
            refresh_interval=30,
            theme="light",
            compact_mode=False,
        )

        # Cache for 24 hours
        await cache.set(f"dashboard_prefs:{user_id}", default_prefs.dict(), ttl=86400)

        return default_prefs

    except Exception as e:
        logger.error(f"Error getting dashboard preferences for user {user_id}: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to get dashboard preferences"
        )


@router.post("/preferences")
async def save_dashboard_preferences(
    preferences: DashboardPreferences,
) -> Dict[str, str]:
    """Save user dashboard preferences"""
    try:
        cache = await get_cache()

        # Save to cache (in production, save to database)
        await cache.set(
            f"dashboard_prefs:{preferences.user_id}", preferences.dict(), ttl=86400 * 30
        )

        return {"message": "Dashboard preferences saved successfully"}

    except Exception as e:
        logger.error(f"Error saving dashboard preferences: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to save dashboard preferences"
        )


@router.get("/templates")
async def get_dashboard_templates() -> Dict[str, List[Dict[str, Any]]]:
    """Get available dashboard templates"""
    try:
        templates = [
            {
                "id": "beginner",
                "name": "Beginner",
                "description": "Simple dashboard for new users",
                "category": "starter",
                "widgets": ["stats_card", "recent_bets"],
                "preview_image": "/templates/beginner.png",
            },
            {
                "id": "professional",
                "name": "Professional Trader",
                "description": "Advanced analytics and monitoring",
                "category": "advanced",
                "widgets": [
                    "line_chart",
                    "prop_opportunities",
                    "bankroll_tracker",
                    "performance_metrics",
                ],
                "preview_image": "/templates/professional.png",
            },
            {
                "id": "live_betting",
                "name": "Live Betting",
                "description": "Real-time opportunities and monitoring",
                "category": "live",
                "widgets": ["live_odds", "prop_opportunities", "recent_bets"],
                "preview_image": "/templates/live_betting.png",
            },
        ]

        return {"templates": templates}

    except Exception as e:
        logger.error(f"Error getting dashboard templates: {e}")
        raise HTTPException(status_code=500, detail="Failed to get dashboard templates")


# Import required modules for mock data generation
import random
from datetime import timedelta
