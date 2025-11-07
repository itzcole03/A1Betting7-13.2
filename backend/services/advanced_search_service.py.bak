"""
Advanced Search and Filter Service
Provides comprehensive search and filtering capabilities across all data types
"""

import asyncio
import logging
import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Set, Union, Tuple
from dataclasses import dataclass, field
from enum import Enum
import json
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)

class SearchOperator(Enum):
    """Search operators for filtering"""
    EQUALS = "eq"
    NOT_EQUALS = "ne"
    CONTAINS = "contains"
    NOT_CONTAINS = "not_contains"
    STARTS_WITH = "starts_with"
    ENDS_WITH = "ends_with"
    GREATER_THAN = "gt"
    GREATER_EQUAL = "gte"
    LESS_THAN = "lt"
    LESS_EQUAL = "lte"
    BETWEEN = "between"
    IN = "in"
    NOT_IN = "not_in"
    REGEX = "regex"
    FUZZY = "fuzzy"
    IS_NULL = "is_null"
    NOT_NULL = "not_null"

class DataType(Enum):
    """Data types for filtering"""
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    DATE = "date"
    DATETIME = "datetime"
    ARRAY = "array"
    OBJECT = "object"

@dataclass
class FilterCondition:
    """Individual filter condition"""
    field: str
    operator: SearchOperator
    value: Any
    data_type: DataType = DataType.STRING
    case_sensitive: bool = False
    
    def matches(self, item: Dict[str, Any]) -> bool:
        """Check if item matches this filter condition"""
        field_value = self._get_nested_value(item, self.field)
        
        if field_value is None:
            return self.operator in [SearchOperator.IS_NULL, SearchOperator.NOT_EQUALS]
        
        # Handle null checks
        if self.operator == SearchOperator.IS_NULL:
            return field_value is None
        elif self.operator == SearchOperator.NOT_NULL:
            return field_value is not None
        
        # Convert values for comparison
        field_value = self._convert_value(field_value)
        compare_value = self._convert_value(self.value)
        
        # Apply case sensitivity for strings
        if self.data_type == DataType.STRING and not self.case_sensitive:
            if isinstance(field_value, str):
                field_value = field_value.lower()
            if isinstance(compare_value, str):
                compare_value = compare_value.lower()
        
        # Apply operator
        try:
            if self.operator == SearchOperator.EQUALS:
                return field_value == compare_value
            elif self.operator == SearchOperator.NOT_EQUALS:
                return field_value != compare_value
            elif self.operator == SearchOperator.CONTAINS:
                return str(compare_value) in str(field_value)
            elif self.operator == SearchOperator.NOT_CONTAINS:
                return str(compare_value) not in str(field_value)
            elif self.operator == SearchOperator.STARTS_WITH:
                return str(field_value).startswith(str(compare_value))
            elif self.operator == SearchOperator.ENDS_WITH:
                return str(field_value).endswith(str(compare_value))
            elif self.operator == SearchOperator.GREATER_THAN:
                return field_value > compare_value
            elif self.operator == SearchOperator.GREATER_EQUAL:
                return field_value >= compare_value
            elif self.operator == SearchOperator.LESS_THAN:
                return field_value < compare_value
            elif self.operator == SearchOperator.LESS_EQUAL:
                return field_value <= compare_value
            elif self.operator == SearchOperator.BETWEEN:
                if isinstance(compare_value, (list, tuple)) and len(compare_value) == 2:
                    return compare_value[0] <= field_value <= compare_value[1]
                return False
            elif self.operator == SearchOperator.IN:
                if isinstance(compare_value, (list, tuple, set)):
                    return field_value in compare_value
                return field_value == compare_value
            elif self.operator == SearchOperator.NOT_IN:
                if isinstance(compare_value, (list, tuple, set)):
                    return field_value not in compare_value
                return field_value != compare_value
            elif self.operator == SearchOperator.REGEX:
                pattern = re.compile(str(compare_value), re.IGNORECASE if not self.case_sensitive else 0)
                return bool(pattern.search(str(field_value)))
            elif self.operator == SearchOperator.FUZZY:
                similarity = SequenceMatcher(None, str(field_value), str(compare_value)).ratio()
                threshold = 0.7  # 70% similarity threshold
                return similarity >= threshold
            
            return False
            
        except Exception as e:
            logger.warning(f"Error applying filter condition: {e}")
            return False
    
    def _get_nested_value(self, item: Dict[str, Any], field_path: str) -> Any:
        """Get value from nested object using dot notation"""
        try:
            value = item
            for key in field_path.split('.'):
                if isinstance(value, dict):
                    value = value.get(key)
                elif isinstance(value, list) and key.isdigit():
                    value = value[int(key)]
                else:
                    return None
            return value
        except:
            return None
    
    def _convert_value(self, value: Any) -> Any:
        """Convert value to appropriate type"""
        if value is None:
            return None
        
        try:
            if self.data_type == DataType.INTEGER:
                return int(value)
            elif self.data_type == DataType.FLOAT:
                return float(value)
            elif self.data_type == DataType.BOOLEAN:
                if isinstance(value, str):
                    return value.lower() in ['true', '1', 'yes', 'on']
                return bool(value)
            elif self.data_type == DataType.DATE:
                if isinstance(value, str):
                    return datetime.strptime(value, '%Y-%m-%d').date()
                return value
            elif self.data_type == DataType.DATETIME:
                if isinstance(value, str):
                    # Try multiple datetime formats
                    for fmt in ['%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d']:
                        try:
                            return datetime.strptime(value, fmt)
                        except ValueError:
                            continue
                    return datetime.fromisoformat(value.replace('Z', '+00:00'))
                return value
            elif self.data_type == DataType.STRING:
                return str(value)
            
            return value
            
        except Exception as e:
            logger.warning(f"Error converting value {value} to {self.data_type}: {e}")
            return value

@dataclass
class SearchQuery:
    """Complex search query with multiple conditions"""
    conditions: List[FilterCondition] = field(default_factory=list)
    logic_operator: str = "AND"  # "AND" or "OR"
    text_search: Optional[str] = None
    text_fields: List[str] = field(default_factory=list)
    sort_by: Optional[str] = None
    sort_order: str = "asc"  # "asc" or "desc"
    limit: Optional[int] = None
    offset: int = 0
    
    def matches(self, item: Dict[str, Any]) -> bool:
        """Check if item matches this search query"""
        # Check text search first
        if self.text_search and not self._matches_text_search(item):
            return False
        
        # If no conditions, return True (text search already passed)
        if not self.conditions:
            return True
        
        # Apply filter conditions
        if self.logic_operator.upper() == "AND":
            return all(condition.matches(item) for condition in self.conditions)
        else:  # OR
            return any(condition.matches(item) for condition in self.conditions)
    
    def _matches_text_search(self, item: Dict[str, Any]) -> bool:
        """Check if item matches text search"""
        if not self.text_search:
            return True
        
        search_text = self.text_search.lower()
        
        # If specific fields specified, search only those
        if self.text_fields:
            for field in self.text_fields:
                field_value = self._get_nested_value(item, field)
                if field_value and search_text in str(field_value).lower():
                    return True
            return False
        
        # Otherwise search all string values
        return self._search_all_values(item, search_text)
    
    def _search_all_values(self, obj: Any, search_text: str) -> bool:
        """Recursively search all values in object"""
        if isinstance(obj, dict):
            return any(self._search_all_values(value, search_text) for value in obj.values())
        elif isinstance(obj, (list, tuple)):
            return any(self._search_all_values(item, search_text) for item in obj)
        elif isinstance(obj, str):
            return search_text in obj.lower()
        else:
            return search_text in str(obj).lower()
    
    def _get_nested_value(self, item: Dict[str, Any], field_path: str) -> Any:
        """Get value from nested object using dot notation"""
        try:
            value = item
            for key in field_path.split('.'):
                if isinstance(value, dict):
                    value = value.get(key)
                elif isinstance(value, list) and key.isdigit():
                    value = value[int(key)]
                else:
                    return None
            return value
        except:
            return None

@dataclass
class SearchFacet:
    """Faceted search result for aggregations"""
    field: str
    values: Dict[str, int] = field(default_factory=dict)
    
@dataclass
class SearchResult:
    """Search result with metadata"""
    items: List[Dict[str, Any]]
    total_count: int
    filtered_count: int
    facets: List[SearchFacet] = field(default_factory=list)
    query_time_ms: float = 0.0
    
class AdvancedSearchService:
    """Advanced search and filtering service"""
    
    def __init__(self):
        self.search_indexes = {}  # Field -> value mappings for fast searching
        self.data_cache = {}  # Category -> data mappings
        
    async def search(
        self, 
        data: List[Dict[str, Any]], 
        query: SearchQuery,
        facet_fields: Optional[List[str]] = None
    ) -> SearchResult:
        """Perform advanced search on data"""
        start_time = datetime.now()
        
        # Filter data
        filtered_items = [item for item in data if query.matches(item)]
        
        # Sort results
        if query.sort_by:
            filtered_items = self._sort_items(filtered_items, query.sort_by, query.sort_order)
        
        # Apply pagination
        total_filtered = len(filtered_items)
        if query.limit:
            start_idx = query.offset
            end_idx = start_idx + query.limit
            paginated_items = filtered_items[start_idx:end_idx]
        else:
            paginated_items = filtered_items[query.offset:]
        
        # Calculate facets
        facets = []
        if facet_fields:
            facets = self._calculate_facets(filtered_items, facet_fields)
        
        # Calculate query time
        query_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return SearchResult(
            items=paginated_items,
            total_count=len(data),
            filtered_count=total_filtered,
            facets=facets,
            query_time_ms=query_time
        )
    
    def _sort_items(self, items: List[Dict[str, Any]], sort_field: str, sort_order: str) -> List[Dict[str, Any]]:
        """Sort items by field"""
        try:
            def get_sort_value(item):
                value = self._get_nested_value(item, sort_field)
                # Handle None values
                if value is None:
                    return "" if sort_order == "asc" else "zzz"
                return value
            
            reverse = sort_order.lower() == "desc"
            return sorted(items, key=get_sort_value, reverse=reverse)
            
        except Exception as e:
            logger.warning(f"Error sorting items: {e}")
            return items
    
    def _calculate_facets(self, items: List[Dict[str, Any]], facet_fields: List[str]) -> List[SearchFacet]:
        """Calculate facet counts"""
        facets = []
        
        for field in facet_fields:
            facet = SearchFacet(field=field)
            
            for item in items:
                value = self._get_nested_value(item, field)
                if value is not None:
                    # Handle array values
                    if isinstance(value, (list, tuple)):
                        for v in value:
                            key = str(v)
                            facet.values[key] = facet.values.get(key, 0) + 1
                    else:
                        key = str(value)
                        facet.values[key] = facet.values.get(key, 0) + 1
            
            # Sort facet values by count
            facet.values = dict(sorted(facet.values.items(), key=lambda x: x[1], reverse=True))
            facets.append(facet)
        
        return facets
    
    def _get_nested_value(self, item: Dict[str, Any], field_path: str) -> Any:
        """Get value from nested object using dot notation"""
        try:
            value = item
            for key in field_path.split('.'):
                if isinstance(value, dict):
                    value = value.get(key)
                elif isinstance(value, list) and key.isdigit():
                    value = value[int(key)]
                else:
                    return None
            return value
        except:
            return None
    
    async def suggest_completions(
        self, 
        data: List[Dict[str, Any]], 
        field: str, 
        partial_text: str, 
        max_suggestions: int = 10
    ) -> List[str]:
        """Get autocomplete suggestions for a field"""
        suggestions = set()
        partial_lower = partial_text.lower()
        
        for item in data:
            value = self._get_nested_value(item, field)
            if value and isinstance(value, str):
                value_lower = value.lower()
                if partial_lower in value_lower:
                    suggestions.add(value)
                    if len(suggestions) >= max_suggestions * 2:  # Get more to filter better
                        break
        
        # Sort by relevance (starts with partial text first)
        suggestions_list = list(suggestions)
        suggestions_list.sort(key=lambda x: (
            not x.lower().startswith(partial_lower),  # Starts with first
            len(x),  # Then by length
            x.lower()  # Then alphabetically
        ))
        
        return suggestions_list[:max_suggestions]
    
    async def get_field_statistics(
        self, 
        data: List[Dict[str, Any]], 
        field: str
    ) -> Dict[str, Any]:
        """Get statistics for a numeric field"""
        values = []
        
        for item in data:
            value = self._get_nested_value(item, field)
            if value is not None and isinstance(value, (int, float)):
                values.append(value)
        
        if not values:
            return {"error": "No numeric values found"}
        
        values.sort()
        count = len(values)
        
        return {
            "count": count,
            "min": min(values),
            "max": max(values),
            "mean": sum(values) / count,
            "median": values[count // 2] if count % 2 == 1 else (values[count // 2 - 1] + values[count // 2]) / 2,
            "unique_values": len(set(values)),
            "percentiles": {
                "25th": values[int(count * 0.25)],
                "75th": values[int(count * 0.75)],
                "90th": values[int(count * 0.90)],
                "95th": values[int(count * 0.95)]
            }
        }
    
    def create_search_query(
        self,
        filters: Optional[Dict[str, Any]] = None,
        text_search: Optional[str] = None,
        text_fields: Optional[List[str]] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "asc",
        limit: Optional[int] = None,
        offset: int = 0
    ) -> SearchQuery:
        """Create a search query from parameters"""
        conditions = []
        
        if filters:
            for field, filter_spec in filters.items():
                if isinstance(filter_spec, dict):
                    operator = SearchOperator(filter_spec.get("operator", "eq"))
                    value = filter_spec.get("value")
                    data_type = DataType(filter_spec.get("data_type", "string"))
                    case_sensitive = filter_spec.get("case_sensitive", False)
                else:
                    # Simple value filter
                    operator = SearchOperator.EQUALS
                    value = filter_spec
                    data_type = DataType.STRING
                    case_sensitive = False
                
                condition = FilterCondition(
                    field=field,
                    operator=operator,
                    value=value,
                    data_type=data_type,
                    case_sensitive=case_sensitive
                )
                conditions.append(condition)
        
        return SearchQuery(
            conditions=conditions,
            text_search=text_search,
            text_fields=text_fields or [],
            sort_by=sort_by,
            sort_order=sort_order,
            limit=limit,
            offset=offset
        )

# Global service instance
advanced_search_service = AdvancedSearchService()

# Utility functions for common search patterns
async def search_players(
    data: List[Dict[str, Any]], 
    player_name: Optional[str] = None,
    sport: Optional[str] = None,
    team: Optional[str] = None,
    position: Optional[str] = None
) -> SearchResult:
    """Search for players with common filters"""
    filters = {}
    
    if sport:
        filters["sport"] = {"operator": "eq", "value": sport, "case_sensitive": False}
    if team:
        filters["team"] = {"operator": "contains", "value": team, "case_sensitive": False}
    if position:
        filters["position"] = {"operator": "eq", "value": position, "case_sensitive": False}
    
    query = advanced_search_service.create_search_query(
        filters=filters,
        text_search=player_name,
        text_fields=["player_name", "name"],
        sort_by="player_name"
    )
    
    return await advanced_search_service.search(data, query)

async def search_odds(
    data: List[Dict[str, Any]],
    sport: Optional[str] = None,
    player_name: Optional[str] = None,
    bet_type: Optional[str] = None,
    min_odds: Optional[int] = None,
    max_odds: Optional[int] = None,
    sportsbook: Optional[str] = None
) -> SearchResult:
    """Search for odds with common filters"""
    filters = {}
    
    if sport:
        filters["sport"] = {"operator": "eq", "value": sport, "case_sensitive": False}
    if bet_type:
        filters["bet_type"] = {"operator": "contains", "value": bet_type, "case_sensitive": False}
    if min_odds is not None:
        filters["odds"] = {"operator": "gte", "value": min_odds, "data_type": "integer"}
    if max_odds is not None:
        if "odds" in filters:
            # Combine with existing odds filter
            filters["odds"] = {"operator": "between", "value": [min_odds or -1000, max_odds], "data_type": "integer"}
        else:
            filters["odds"] = {"operator": "lte", "value": max_odds, "data_type": "integer"}
    if sportsbook:
        filters["provider"] = {"operator": "eq", "value": sportsbook, "case_sensitive": False}
    
    query = advanced_search_service.create_search_query(
        filters=filters,
        text_search=player_name,
        text_fields=["player_name", "event"],
        sort_by="odds",
        sort_order="desc"
    )
    
    return await advanced_search_service.search(data, query, facet_fields=["sport", "bet_type", "provider"])
