"""
Advanced Search and Filtering API Routes
Provides comprehensive search and filtering capabilities
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Body, Depends

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException
from pydantic import BaseModel, Field

from ..services.advanced_search_service import (
    advanced_search_service,
    SearchQuery,
    FilterCondition,
    SearchOperator,
    DataType,
    SearchResult,
    search_players,
    search_odds
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/search", tags=["Advanced Search"])

# Pydantic models for request/response
class FilterConditionModel(BaseModel):
    field: str
    operator: str
    value: Any
    data_type: str = "string"
    case_sensitive: bool = False

class SearchQueryModel(BaseModel):
    conditions: List[FilterConditionModel] = []
    logic_operator: str = "AND"
    text_search: Optional[str] = None
    text_fields: List[str] = []
    sort_by: Optional[str] = None
    sort_order: str = "asc"
    limit: Optional[int] = None
    offset: int = 0

class SearchRequestModel(BaseModel):
    query: SearchQueryModel
    data: List[Dict[str, Any]]
    facet_fields: List[str] = []

class FacetModel(BaseModel):
    field: str
    values: Dict[str, int]

class SearchResultModel(BaseModel):
    items: List[Dict[str, Any]]
    total_count: int
    filtered_count: int
    facets: List[FacetModel] = []
    query_time_ms: float

# Mock data for testing when backend services unavailable
MOCK_PLAYER_DATA = [
    {
        "player_name": "LeBron James",
        "team": "Los Angeles Lakers",
        "sport": "nba",
        "position": "SF",
        "age": 38,
        "points_per_game": 25.3,
        "rebounds_per_game": 7.3,
        "assists_per_game": 6.8
    },
    {
        "player_name": "Stephen Curry",
        "team": "Golden State Warriors", 
        "sport": "nba",
        "position": "PG",
        "age": 35,
        "points_per_game": 29.5,
        "rebounds_per_game": 6.1,
        "assists_per_game": 6.3
    },
    {
        "player_name": "Giannis Antetokounmpo",
        "team": "Milwaukee Bucks",
        "sport": "nba", 
        "position": "PF",
        "age": 28,
        "points_per_game": 31.1,
        "rebounds_per_game": 11.8,
        "assists_per_game": 5.7
    },
    {
        "player_name": "Patrick Mahomes",
        "team": "Kansas City Chiefs",
        "sport": "nfl",
        "position": "QB",
        "age": 28,
        "passing_yards": 4839,
        "touchdowns": 37,
        "interceptions": 13
    },
    {
        "player_name": "Josh Allen",
        "team": "Buffalo Bills",
        "sport": "nfl", 
        "position": "QB",
        "age": 27,
        "passing_yards": 4304,
        "touchdowns": 29,
        "interceptions": 18
    }
]

MOCK_ODDS_DATA = [
    {
        "player_name": "LeBron James",
        "sport": "nba",
        "bet_type": "Points",
        "line": 25.5,
        "odds": -110,
        "provider": "DraftKings",
        "side": "over",
        "timestamp": "2024-01-20T10:00:00Z"
    },
    {
        "player_name": "LeBron James", 
        "sport": "nba",
        "bet_type": "Points",
        "line": 25.5,
        "odds": -110,
        "provider": "BetMGM",
        "side": "under",
        "timestamp": "2024-01-20T10:00:00Z"
    },
    {
        "player_name": "Stephen Curry",
        "sport": "nba",
        "bet_type": "3-Pointers Made",
        "line": 4.5,
        "odds": +105,
        "provider": "DraftKings",
        "side": "over",
        "timestamp": "2024-01-20T10:00:00Z"
    },
    {
        "player_name": "Patrick Mahomes",
        "sport": "nfl",
        "bet_type": "Passing Yards",
        "line": 275.5,
        "odds": -115,
        "provider": "Caesars",
        "side": "over", 
        "timestamp": "2024-01-20T10:00:00Z"
    }
]

@router.post("/execute", response_model=SearchResultModel)
async def execute_search(request: SearchRequestModel) -> SearchResultModel:
    """Execute advanced search with custom query"""
    try:
        # Convert Pydantic models to service models
        conditions = []
        for condition_model in request.query.conditions:
            condition = FilterCondition(
                field=condition_model.field,
                operator=SearchOperator(condition_model.operator),
                value=condition_model.value,
                data_type=DataType(condition_model.data_type),
                case_sensitive=condition_model.case_sensitive
            )
            conditions.append(condition)
        
        query = SearchQuery(
            conditions=conditions,
            logic_operator=request.query.logic_operator,
            text_search=request.query.text_search,
            text_fields=request.query.text_fields,
            sort_by=request.query.sort_by,
            sort_order=request.query.sort_order,
            limit=request.query.limit,
            offset=request.query.offset
        )
        
        # Execute search
        result = await advanced_search_service.search(
            request.data, 
            query, 
            request.facet_fields
        )
        
        # Convert to response model
        facets = [
            FacetModel(field=facet.field, values=facet.values)
            for facet in result.facets
        ]
        
        return ResponseBuilder.success(SearchResultModel(
            items=result.items,
            total_count=result.total_count,
            filtered_count=result.filtered_count,
            facets=facets,
            query_time_ms=result.query_time_ms
        ))
        
    except Exception as e:
        logger.error(f"Error executing search: {e}")
        raise BusinessLogicException("f"Search execution failed: {str(e")}")

@router.get("/players", response_model=SearchResultModel)
async def search_players_endpoint(
    player_name: Optional[str] = Query(None, description="Player name to search for"),
    sport: Optional[str] = Query(None, description="Sport filter (nba, nfl, mlb, nhl)"),
    team: Optional[str] = Query(None, description="Team filter"),
    position: Optional[str] = Query(None, description="Position filter"),
    limit: Optional[int] = Query(50, description="Maximum results to return"),
    offset: int = Query(0, description="Number of results to skip")
) -> SearchResultModel:
    """Search for players with common filters"""
    try:
        # Use mock data for demo - in production this would fetch from database
        data = MOCK_PLAYER_DATA
        
        result = await search_players(
            data=data,
            player_name=player_name,
            sport=sport,
            team=team,
            position=position
        )
        
        # Apply pagination
        if limit:
            result.items = result.items[offset:offset + limit]
        
        # Convert to response model
        facets = [
            FacetModel(field=facet.field, values=facet.values)
            for facet in result.facets
        ]
        
        return ResponseBuilder.success(SearchResultModel(
            items=result.items,
            total_count=result.total_count,
            filtered_count=result.filtered_count,
            facets=facets,
            query_time_ms=result.query_time_ms
        ))
        
    except Exception as e:
        logger.error(f"Error searching players: {e}")
        raise BusinessLogicException("f"Player search failed: {str(e")}")

@router.get("/odds", response_model=SearchResultModel)
async def search_odds_endpoint(
    sport: Optional[str] = Query(None, description="Sport filter"),
    player_name: Optional[str] = Query(None, description="Player name filter"),
    bet_type: Optional[str] = Query(None, description="Bet type filter"),
    min_odds: Optional[int] = Query(None, description="Minimum odds"),
    max_odds: Optional[int] = Query(None, description="Maximum odds"),
    sportsbook: Optional[str] = Query(None, description="Sportsbook filter"),
    limit: Optional[int] = Query(50, description="Maximum results to return"),
    offset: int = Query(0, description="Number of results to skip")
) -> SearchResultModel:
    """Search for odds with common filters"""
    try:
        # Use mock data for demo - in production this would fetch from sportsbook service
        data = MOCK_ODDS_DATA
        
        result = await search_odds(
            data=data,
            sport=sport,
            player_name=player_name,
            bet_type=bet_type,
            min_odds=min_odds,
            max_odds=max_odds,
            sportsbook=sportsbook
        )
        
        # Apply pagination
        if limit:
            result.items = result.items[offset:offset + limit]
        
        # Convert to response model
        facets = [
            FacetModel(field=facet.field, values=facet.values)
            for facet in result.facets
        ]
        
        return ResponseBuilder.success(SearchResultModel(
            items=result.items,
            total_count=result.total_count,
            filtered_count=result.filtered_count,
            facets=facets,
            query_time_ms=result.query_time_ms
        ))
        
    except Exception as e:
        logger.error(f"Error searching odds: {e}")
        raise BusinessLogicException("f"Odds search failed: {str(e")}")

@router.get("/suggestions/{field}", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_autocomplete_suggestions(
    field: str,
    text: str = Query(..., description="Partial text for autocomplete"),
    data_type: str = Query("players", description="Data type to search (players, odds)"),
    max_suggestions: int = Query(10, description="Maximum suggestions to return")
) -> List[str]:
    """Get autocomplete suggestions for a field"""
    try:
        # Select data based on type
        if data_type == "players":
            data = MOCK_PLAYER_DATA
        elif data_type == "odds":
            data = MOCK_ODDS_DATA
        else:
            raise BusinessLogicException("Invalid data_type")
        
        suggestions = await advanced_search_service.suggest_completions(
            data=data,
            field=field,
            partial_text=text,
            max_suggestions=max_suggestions
        )
        
        return ResponseBuilder.success(suggestions)
        
    except Exception as e:
        logger.error(f"Error getting suggestions: {e}")
        raise BusinessLogicException("f"Suggestions failed: {str(e")}")

@router.get("/statistics/{field}", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_field_statistics(
    field: str,
    data_type: str = Query("players", description="Data type to analyze (players, odds)")
) -> Dict[str, Any]:
    """Get statistics for a numeric field"""
    try:
        # Select data based on type
        if data_type == "players":
            data = MOCK_PLAYER_DATA
        elif data_type == "odds":
            data = MOCK_ODDS_DATA
        else:
            raise BusinessLogicException("Invalid data_type")
        
        stats = await advanced_search_service.get_field_statistics(data, field)
        return ResponseBuilder.success(stats)
        
    except Exception as e:
        logger.error(f"Error getting field statistics: {e}")
        raise BusinessLogicException("f"Statistics failed: {str(e")}")

@router.get("/operators", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_search_operators() -> Dict[str, List[str]]:
    """Get available search operators by data type"""
    return ResponseBuilder.success({
        "string": ["eq", "ne", "contains", "not_contains", "starts_with", "ends_with", "regex", "fuzzy"],
        "numeric": ["eq", "ne", "gt", "gte", "lt", "lte", "between"],
        "array": ["in", "not_in", "contains"],
        "boolean": ["eq", "ne"],
        "date": ["eq", "ne", "gt", "gte", "lt", "lte", "between"],
        "null_checks": ["is_null", "not_null"]
    })

@router.get("/fields", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_searchable_fields() -> Dict[str, Dict[str, str]]:
    """Get available searchable fields by data type"""
    return ResponseBuilder.success({
        "players": {
            "player_name": "string",
            "team": "string", 
            "sport": "string",
            "position": "string",
            "age": "integer",
            "points_per_game": "float",
            "rebounds_per_game": "float",
            "assists_per_game": "float"
        }),
        "odds": {
            "player_name": "string",
            "sport": "string",
            "bet_type": "string",
            "line": "float",
            "odds": "integer",
            "provider": "string",
            "side": "string",
            "timestamp": "datetime"
        }
    }

@router.post("/saved-searches", response_model=StandardAPIResponse[Dict[str, Any]])
async def save_search_query(
    name: str = Body(...),
    query: SearchQueryModel = Body(...),
    description: Optional[str] = Body(None)
) -> Dict[str, Any]:
    """Save a search query for reuse"""
    # In production, this would save to database
    saved_search = {
        "id": f"search_{datetime.now().timestamp()}",
        "name": name,
        "description": description,
        "query": query.dict(),
        "created_at": datetime.now().isoformat(),
        "usage_count": 0
    }
    
    return ResponseBuilder.success({
        "status": "success",
        "message": "Search query saved successfully",
        "search": saved_search
    })

@router.get("/saved-searches", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_saved_searches() -> List[Dict[str, Any]]:
    """Get saved search queries"""
    # Mock saved searches for demo
    return ResponseBuilder.success([
        {
            "id": "search_1",
            "name": "High Scoring NBA Players",
            "description": "NBA players averaging over 25 PPG",
            "query": {
                "conditions": [
                    {
                        "field": "sport",
                        "operator": "eq",
                        "value": "nba",
                        "data_type": "string"
                    },
                    {
                        "field": "points_per_game",
                        "operator": "gt", 
                        "value": 25,
                        "data_type": "float"
                    }
                ]),
                "sort_by": "points_per_game",
                "sort_order": "desc"
            },
            "created_at": "2024-01-20T10:00:00Z",
            "usage_count": 15
        },
        {
            "id": "search_2", 
            "name": "Positive Odds NBA Props",
            "description": "NBA player props with positive odds",
            "query": {
                "conditions": [
                    {
                        "field": "sport",
                        "operator": "eq",
                        "value": "nba",
                        "data_type": "string"
                    },
                    {
                        "field": "odds",
                        "operator": "gt",
                        "value": 0,
                        "data_type": "integer"
                    }
                ],
                "sort_by": "odds",
                "sort_order": "desc"
            },
            "created_at": "2024-01-19T15:30:00Z",
            "usage_count": 8
        }
    ]

@router.get("/health", response_model=StandardAPIResponse[Dict[str, Any]])
async def search_health_check() -> Dict[str, Any]:
    """Health check for search service"""
    return ResponseBuilder.success({
        "status": "healthy",
        "service": "advanced-search",
        "features": {
            "text_search": True,
            "advanced_filtering": True,
            "faceted_search": True,
            "autocomplete": True,
            "statistics": True,
            "saved_searches": True
        }),
        "operators_supported": len(SearchOperator),
        "data_types_supported": len(DataType),
        "timestamp": datetime.now().isoformat()
    }
