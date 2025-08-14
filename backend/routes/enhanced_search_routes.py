"""
Enhanced Search Routes
Phase 3: Advanced search and filtering capabilities with AI-powered suggestions

Features:
- AI-powered search suggestions
- Advanced filtering with facets
- Saved searches and query history
- Intelligent autocomplete
- Search analytics and optimization
"""

import asyncio
import json
import logging
import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union

from fastapi import APIRouter, Depends, HTTPException, Query, Request

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException
from pydantic import BaseModel, Field

# Core services
from ..services.core.unified_cache_service import get_cache
from ..services.core.unified_ml_service import get_ml_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/search", tags=["Enhanced Search"])


# Pydantic models
class SearchCondition(BaseModel):
    field: str
    operator: str
    value: Union[str, int, float, bool, List[str]]
    data_type: str
    case_sensitive: bool = False


class SearchQuery(BaseModel):
    conditions: List[SearchCondition] = []
    logic_operator: str = "AND"
    text_search: str = ""
    text_fields: List[str] = []
    sort_by: str = ""
    sort_order: str = "asc"
    limit: int = 50
    offset: int = 0


class SearchResult(BaseModel):
    items: List[Dict[str, Any]]
    total_count: int
    filtered_count: int
    facets: List[Dict[str, Any]]
    query_time_ms: float
    suggestions: List[str] = []


class SmartSuggestion(BaseModel):
    type: str  # 'ai', 'trending', 'recent', 'popular'
    text: str
    confidence: float
    metadata: Dict[str, Any]


class AISuggestionRequest(BaseModel):
    text: str
    data_type: str
    context: Dict[str, Any] = {}


class SavedSearch(BaseModel):
    name: str
    description: Optional[str] = None
    query: SearchQuery
    tags: List[str] = []
    is_public: bool = False


# Search analytics tracking
search_analytics = {
    "total_searches": 0,
    "popular_terms": {},
    "trending_searches": [],
    "user_patterns": {},
}


@router.post("/ai-suggestions", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_ai_suggestions(
    request: AISuggestionRequest,
) -> Dict[str, List[SmartSuggestion]]:
    """
    Generate AI-powered search suggestions based on user input
    """
    try:
        cache = await get_cache()
        ml_service = await get_ml_service()

        # Cache key for suggestions
        cache_key = f"ai_suggestions:{request.data_type}:{hash(request.text)}"

        # Check cache first
        cached_suggestions = await cache.get(cache_key)
        if cached_suggestions:
            return ResponseBuilder.success({"suggestions": cached_suggestions})

        suggestions = []

        # 1. AI-powered contextual suggestions
        ai_suggestions = await generate_ai_suggestions(
            request.text, request.data_type, request.context
        )
        suggestions.extend(ai_suggestions)

        # 2. Trending searches
        trending_suggestions = await generate_trending_suggestions(
            request.text, request.data_type
        )
        suggestions.extend(trending_suggestions)

        # 3. Recent popular searches
        popular_suggestions = await generate_popular_suggestions(
            request.text, request.data_type
        )
        suggestions.extend(popular_suggestions)

        # 4. Intelligent autocomplete
        autocomplete_suggestions = await generate_autocomplete_suggestions(
            request.text, request.data_type
        )
        suggestions.extend(autocomplete_suggestions)

        # Sort by confidence and limit results
        suggestions.sort(key=lambda x: x.confidence, reverse=True)
        top_suggestions = suggestions[:10]

        # Cache for 5 minutes
        await cache.set(cache_key, top_suggestions, ttl=300)

        return ResponseBuilder.success({"suggestions": top_suggestions})

    except Exception as e:
        logger.error(f"Error generating AI suggestions: {e}")
        return ResponseBuilder.success({"suggestions": []})


async def generate_ai_suggestions(
    text: str, data_type: str, context: Dict[str, Any]
) -> List[SmartSuggestion]:
    """Generate AI-powered contextual suggestions"""
    suggestions = []

    try:
        ml_service = await get_ml_service()

        # Use ML service for semantic suggestions
        if len(text) >= 3:
            # Player name completion for props
            if data_type == "props" or data_type == "players":
                player_suggestions = await suggest_player_names(text)
                for suggestion in player_suggestions:
                    suggestions.append(
                        SmartSuggestion(
                            type="ai",
                            text=suggestion["name"],
                            confidence=suggestion["confidence"],
                            metadata={
                                "type": "player",
                                "team": suggestion.get("team", ""),
                            },
                        )
                    )

            # Contextual search completions
            contextual_suggestions = await generate_contextual_suggestions(
                text, data_type, context
            )
            suggestions.extend(contextual_suggestions)

    except Exception as e:
        logger.error(f"Error in AI suggestions: {e}")

    return ResponseBuilder.success(suggestions)


async def suggest_player_names(partial_name: str) -> List[Dict[str, Any]]:
    """Suggest player names based on partial input"""
    try:
        cache = await get_cache()

        # Get player data from cache or database
        players_key = "all_players_index"
        players_data = await cache.get(players_key)

        if not players_data:
            # Mock player data - in production, fetch from database
            players_data = [
                {"name": "LeBron James", "team": "LAL", "sport": "NBA"},
                {"name": "Mike Trout", "team": "LAA", "sport": "MLB"},
                {"name": "Aaron Judge", "team": "NYY", "sport": "MLB"},
                {"name": "Stephen Curry", "team": "GSW", "sport": "NBA"},
                {"name": "Patrick Mahomes", "team": "KC", "sport": "NFL"},
                {"name": "Josh Allen", "team": "BUF", "sport": "NFL"},
                {"name": "Connor McDavid", "team": "EDM", "sport": "NHL"},
                {"name": "Nathan MacKinnon", "team": "COL", "sport": "NHL"},
            ]
            await cache.set(players_key, players_data, ttl=3600)  # Cache for 1 hour

        # Fuzzy matching
        partial_lower = partial_name.lower()
        matches = []

        for player in players_data:
            player_name_lower = player["name"].lower()

            # Calculate similarity score
            if partial_lower in player_name_lower:
                if player_name_lower.startswith(partial_lower):
                    confidence = 0.9  # High confidence for prefix matches
                else:
                    confidence = 0.7  # Medium confidence for contains matches

                matches.append(
                    {
                        "name": player["name"],
                        "team": player["team"],
                        "sport": player["sport"],
                        "confidence": confidence,
                    }
                )

        # Sort by confidence and return ResponseBuilder.success(top) matches
        matches.sort(key=lambda x: x["confidence"], reverse=True)
        return ResponseBuilder.success(matches)[:5]

    except Exception as e:
        logger.error(f"Error suggesting player names: {e}")
        return ResponseBuilder.success([])


async def generate_contextual_suggestions(
    text: str, data_type: str, context: Dict[str, Any]
) -> List[SmartSuggestion]:
    """Generate contextual suggestions based on data type and user context"""
    suggestions = []

    try:
        # Recent searches context
        recent_searches = context.get("recentSearches", [])

        # Data type specific suggestions
        if data_type == "props":
            prop_suggestions = [
                "points over",
                "assists over",
                "rebounds over",
                "strikeouts over",
                "hits over",
                "RBIs over",
                "passing yards over",
                "rushing yards over",
                "touchdowns over",
            ]

            for suggestion in prop_suggestions:
                if text.lower() in suggestion.lower() or suggestion.lower().startswith(
                    text.lower()
                ):
                    suggestions.append(
                        SmartSuggestion(
                            type="ai",
                            text=f"{text} {suggestion}",
                            confidence=0.8,
                            metadata={"category": "prop_type"},
                        )
                    )

        elif data_type == "players":
            # Position-based suggestions
            positions = [
                "guard",
                "forward",
                "center",
                "pitcher",
                "catcher",
                "quarterback",
                "running back",
            ]
            for position in positions:
                if text.lower() in position:
                    suggestions.append(
                        SmartSuggestion(
                            type="ai",
                            text=f"{position} {text}",
                            confidence=0.7,
                            metadata={"category": "position"},
                        )
                    )

        elif data_type == "odds":
            # Market type suggestions
            markets = ["moneyline", "spread", "total", "player props", "team props"]
            for market in markets:
                if text.lower() in market.lower():
                    suggestions.append(
                        SmartSuggestion(
                            type="ai",
                            text=f"{text} {market}",
                            confidence=0.75,
                            metadata={"category": "market_type"},
                        )
                    )

    except Exception as e:
        logger.error(f"Error generating contextual suggestions: {e}")

    return ResponseBuilder.success(suggestions)


async def generate_trending_suggestions(
    text: str, data_type: str
) -> List[SmartSuggestion]:
    """Generate trending search suggestions"""
    suggestions = []

    try:
        # Mock trending data - in production, analyze recent search patterns
        trending_terms = {
            "props": [
                "LeBron James points",
                "Aaron Judge home runs",
                "Josh Allen passing yards",
            ],
            "players": ["injury report", "starting lineup", "DFS value"],
            "odds": ["line movement", "arbitrage", "best odds"],
        }

        terms = trending_terms.get(data_type, [])
        for term in terms:
            if text.lower() in term.lower():
                suggestions.append(
                    SmartSuggestion(
                        type="trending",
                        text=term,
                        confidence=0.6,
                        metadata={"trend_score": 0.8},
                    )
                )

    except Exception as e:
        logger.error(f"Error generating trending suggestions: {e}")

    return ResponseBuilder.success(suggestions)


async def generate_popular_suggestions(
    text: str, data_type: str
) -> List[SmartSuggestion]:
    """Generate popular search suggestions based on historical data"""
    suggestions = []

    try:
        # Mock popular searches - in production, use analytics data
        popular_searches = search_analytics.get("popular_terms", {})

        for term, count in popular_searches.items():
            if text.lower() in term.lower() and count > 10:
                suggestions.append(
                    SmartSuggestion(
                        type="popular",
                        text=term,
                        confidence=min(
                            0.8, count / 100
                        ),  # Scale confidence by popularity
                        metadata={"search_count": count},
                    )
                )

    except Exception as e:
        logger.error(f"Error generating popular suggestions: {e}")

    return ResponseBuilder.success(suggestions)


async def generate_autocomplete_suggestions(
    text: str, data_type: str
) -> List[SmartSuggestion]:
    """Generate intelligent autocomplete suggestions"""
    suggestions = []

    try:
        # Common completions based on data type
        completions = {
            "props": {
                "po": ["points over", "points under"],
                "as": ["assists over", "assists under"],
                "re": ["rebounds over", "rebounds under"],
                "st": ["strikeouts over", "strikeouts under"],
                "pa": ["passing yards over", "passing touchdowns over"],
            },
            "players": {
                "le": ["LeBron James", "Luka Doncic"],
                "st": ["Stephen Curry", "Steph Curry"],
                "ke": ["Kevin Durant", "Kemba Walker"],
                "ja": ["Jayson Tatum", "James Harden"],
            },
        }

        data_completions = completions.get(data_type, {})
        text_prefix = text.lower()[:2]

        if text_prefix in data_completions:
            for completion in data_completions[text_prefix]:
                if completion.lower().startswith(text.lower()):
                    suggestions.append(
                        SmartSuggestion(
                            type="ai",
                            text=completion,
                            confidence=0.85,
                            metadata={"type": "autocomplete"},
                        )
                    )

    except Exception as e:
        logger.error(f"Error generating autocomplete suggestions: {e}")

    return ResponseBuilder.success(suggestions)


@router.post("/execute", response_model=StandardAPIResponse[Dict[str, Any]])
async def execute_search(query: SearchQuery) -> SearchResult:
    """
    Execute advanced search with filtering, faceting, and analytics
    """
    start_time = datetime.now()

    try:
        # Track search analytics
        search_analytics["total_searches"] += 1
        if query.text_search:
            term = query.text_search.lower()
            search_analytics["popular_terms"][term] = (
                search_analytics["popular_terms"].get(term, 0) + 1
            )

        # Execute search based on conditions
        results = await perform_search(query)

        # Calculate query time
        query_time = (datetime.now() - start_time).total_seconds() * 1000

        # Generate facets
        facets = await generate_search_facets(results, query)

        return ResponseBuilder.success(SearchResult(
            items=results["items"],
            total_count=results["total_count"],
            filtered_count=len(results["items"])),
            facets=facets,
            query_time_ms=query_time,
            suggestions=[],
        )

    except Exception as e:
        logger.error(f"Error executing search: {e}")
        raise BusinessLogicException("Search execution failed")


async def perform_search(query: SearchQuery) -> Dict[str, Any]:
    """Perform the actual search based on query conditions"""
    try:
        cache = await get_cache()

        # Mock search results - in production, query actual database
        mock_data = {
            "props": [
                {
                    "id": 1,
                    "player": "LeBron James",
                    "prop_type": "points",
                    "line": 25.5,
                    "prediction": 27.2,
                    "confidence": 0.85,
                    "ev": 0.12,
                },
                {
                    "id": 2,
                    "player": "Stephen Curry",
                    "prop_type": "assists",
                    "line": 6.5,
                    "prediction": 7.8,
                    "confidence": 0.78,
                    "ev": 0.18,
                },
                {
                    "id": 3,
                    "player": "Aaron Judge",
                    "prop_type": "home_runs",
                    "line": 1.5,
                    "prediction": 1.2,
                    "confidence": 0.72,
                    "ev": -0.05,
                },
            ],
            "players": [
                {
                    "id": 1,
                    "name": "LeBron James",
                    "team": "LAL",
                    "position": "SF",
                    "age": 39,
                    "sport": "NBA",
                },
                {
                    "id": 2,
                    "name": "Stephen Curry",
                    "team": "GSW",
                    "position": "PG",
                    "age": 35,
                    "sport": "NBA",
                },
                {
                    "id": 3,
                    "name": "Aaron Judge",
                    "team": "NYY",
                    "position": "OF",
                    "age": 31,
                    "sport": "MLB",
                },
            ],
            "odds": [
                {
                    "id": 1,
                    "sportsbook": "DraftKings",
                    "sport": "NBA",
                    "market": "moneyline",
                    "odds": -110,
                    "line": None,
                },
                {
                    "id": 2,
                    "sportsbook": "FanDuel",
                    "sport": "NBA",
                    "market": "spread",
                    "odds": -105,
                    "line": -7.5,
                },
                {
                    "id": 3,
                    "sportsbook": "BetMGM",
                    "sport": "MLB",
                    "market": "total",
                    "odds": -108,
                    "line": 8.5,
                },
            ],
        }

        # Default to props if no specific data type
        items = mock_data.get("props", [])

        # Apply text search
        if query.text_search:
            text_lower = query.text_search.lower()
            items = [
                item
                for item in items
                if any(
                    text_lower in str(item.get(field, "")).lower()
                    for field in item.keys()
                )
            ]

        # Apply conditions
        for condition in query.conditions:
            items = apply_condition(items, condition)

        # Apply sorting
        if query.sort_by:
            reverse = query.sort_order == "desc"
            items.sort(key=lambda x: x.get(query.sort_by, 0), reverse=reverse)

        # Apply pagination
        start_idx = query.offset
        end_idx = start_idx + query.limit
        paginated_items = items[start_idx:end_idx]

        return ResponseBuilder.success({
            "items": paginated_items,
            "total_count": len(mock_data.get("props", [])),
        })

    except Exception as e:
        logger.error(f"Error performing search: {e}")
        return ResponseBuilder.success({"items": [], "total_count": 0})


def apply_condition(items: List[Dict], condition: SearchCondition) -> List[Dict]:
    """Apply a single search condition to filter items"""
    try:
        filtered_items = []

        for item in items:
            field_value = item.get(condition.field)
            if field_value is None:
                continue

            # Apply operator logic
            if condition.operator == "equals":
                if str(field_value).lower() == str(condition.value).lower():
                    filtered_items.append(item)
            elif condition.operator == "contains":
                if str(condition.value).lower() in str(field_value).lower():
                    filtered_items.append(item)
            elif condition.operator == "greater_than":
                if isinstance(field_value, (int, float)) and field_value > float(
                    condition.value
                ):
                    filtered_items.append(item)
            elif condition.operator == "less_than":
                if isinstance(field_value, (int, float)) and field_value < float(
                    condition.value
                ):
                    filtered_items.append(item)
            elif condition.operator == "range":
                if isinstance(condition.value, list) and len(condition.value) == 2:
                    min_val, max_val = condition.value
                    if (
                        isinstance(field_value, (int, float))
                        and min_val <= field_value <= max_val
                    ):
                        filtered_items.append(item)

        return ResponseBuilder.success(filtered_items)

    except Exception as e:
        logger.error(f"Error applying condition: {e}")
        return ResponseBuilder.success(items)


async def generate_search_facets(
    results: Dict[str, Any], query: SearchQuery
) -> List[Dict[str, Any]]:
    """Generate search facets for result filtering"""
    facets = []

    try:
        items = results.get("items", [])
        if not items:
            return ResponseBuilder.success(facets)

        # Generate facets for categorical fields
        categorical_fields = [
            "team",
            "position",
            "sport",
            "sportsbook",
            "market",
            "prop_type",
        ]

        for field in categorical_fields:
            field_values = {}
            for item in items:
                value = item.get(field)
                if value:
                    field_values[str(value)] = field_values.get(str(value), 0) + 1

            if field_values:
                facets.append(
                    {
                        "field": field,
                        "label": field.replace("_", " ").title(),
                        "values": field_values,
                    }
                )

        return ResponseBuilder.success(facets)

    except Exception as e:
        logger.error(f"Error generating facets: {e}")
        return ResponseBuilder.success([])


@router.post("/save", response_model=StandardAPIResponse[Dict[str, Any]])
async def save_search(saved_search: SavedSearch) -> Dict[str, str]:
    """Save a search query for later use"""
    try:
        cache = await get_cache()

        # Generate unique ID
        search_id = f"saved_search_{datetime.now().timestamp()}"

        # Create saved search object
        search_data = {
            "id": search_id,
            "name": saved_search.name,
            "description": saved_search.description,
            "query": saved_search.query.dict(),
            "tags": saved_search.tags,
            "is_public": saved_search.is_public,
            "created_at": datetime.now().isoformat(),
            "last_used": datetime.now().isoformat(),
            "use_count": 0,
        }

        # Save to cache
        await cache.set(
            f"saved_search:{search_id}", search_data, ttl=86400 * 30
        )  # 30 days

        return ResponseBuilder.success({"search_id": search_id, "message": "Search saved successfully"})

    except Exception as e:
        logger.error(f"Error saving search: {e}")
        raise BusinessLogicException("Failed to save search")


@router.get("/saved", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_saved_searches() -> Dict[str, List[Dict]]:
    """Get all saved searches for the user"""
    try:
        cache = await get_cache()

        # Mock saved searches - in production, query user's saved searches
        saved_searches = [
            {
                "id": "search_1",
                "name": "High Value Props",
                "description": "Props with positive EV and high confidence",
                "created_at": "2024-01-15T10:00:00",
                "last_used": "2024-01-20T15:30:00",
                "use_count": 15,
                "tags": ["props", "high-value"],
            },
            {
                "id": "search_2",
                "name": "NBA Guards",
                "description": "All NBA point guards and shooting guards",
                "created_at": "2024-01-10T08:00:00",
                "last_used": "2024-01-19T12:00:00",
                "use_count": 8,
                "tags": ["players", "nba"],
            },
        ]

        return ResponseBuilder.success({"saved_searches": saved_searches})

    except Exception as e:
        logger.error(f"Error getting saved searches: {e}")
        return ResponseBuilder.success({"saved_searches": []})


@router.get("/history", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_search_history() -> Dict[str, List[Dict]]:
    """Get search history for the user"""
    try:
        # Mock search history - in production, get from user session/database
        history = [
            {
                "text_search": "LeBron James points",
                "timestamp": "2024-01-20T15:30:00",
                "conditions": [
                    {"field": "player", "operator": "equals", "value": "LeBron James"}
                ],
                "result_count": 5,
            },
            {
                "text_search": "high confidence props",
                "timestamp": "2024-01-20T14:15:00",
                "conditions": [
                    {"field": "confidence", "operator": "greater_than", "value": 0.8}
                ],
                "result_count": 12,
            },
        ]

        return ResponseBuilder.success({"search_history": history})

    except Exception as e:
        logger.error(f"Error getting search history: {e}")
        return ResponseBuilder.success({"search_history": []})


@router.get("/analytics", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_search_analytics() -> Dict[str, Any]:
    """Get search analytics and statistics"""
    try:
        return ResponseBuilder.success({
            "total_searches": search_analytics["total_searches"],
            "popular_terms": dict(
                sorted(
                    search_analytics["popular_terms"].items(),
                    key=lambda x: x[1],
                    reverse=True,
                )[:10]
            ),
            "trending_searches": search_analytics.get("trending_searches", []),
        })

    except Exception as e:
        logger.error(f"Error getting search analytics: {e}")
        return ResponseBuilder.success({"total_searches": 0, "popular_terms": {}), "trending_searches": []}


@router.get("/field-metadata/{data_type}", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_field_metadata(data_type: str) -> Dict[str, Any]:
    """Get available fields and operators for a data type"""
    try:
        metadata = {
            "props": {
                "fields": {
                    "player": {"type": "text", "label": "Player Name"},
                    "prop_type": {
                        "type": "select",
                        "label": "Prop Type",
                        "options": ["points", "assists", "rebounds"],
                    },
                    "line": {"type": "number", "label": "Line Value"},
                    "prediction": {"type": "number", "label": "Prediction"},
                    "confidence": {"type": "number", "label": "Confidence"},
                    "ev": {"type": "number", "label": "Expected Value"},
                },
                "operators": {
                    "text": ["equals", "contains", "starts_with"],
                    "number": ["equals", "greater_than", "less_than", "range"],
                    "select": ["equals", "in"],
                },
            },
            "players": {
                "fields": {
                    "name": {"type": "text", "label": "Player Name"},
                    "team": {"type": "select", "label": "Team"},
                    "position": {"type": "select", "label": "Position"},
                    "age": {"type": "number", "label": "Age"},
                    "sport": {"type": "select", "label": "Sport"},
                },
                "operators": {
                    "text": ["equals", "contains", "starts_with"],
                    "number": ["equals", "greater_than", "less_than", "range"],
                    "select": ["equals", "in"],
                },
            },
        }

        return ResponseBuilder.success(metadata.get(data_type, {"fields": {}, "operators": {}}))

    except Exception as e:
        logger.error(f"Error getting field metadata: {e}")
        return ResponseBuilder.success({"fields": {}), "operators": {}}
