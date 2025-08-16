"""
Pagination Service - Server-side pagination with partial hydration
Provides cursor-based and offset-based pagination for large datasets
with support for filtering, sorting, and partial data hydration.
"""

import hashlib
import json
import math
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple, Union, Callable
from datetime import datetime
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class SortOrder(Enum):
    ASC = "asc"
    DESC = "desc"


class PaginationStrategy(Enum):
    OFFSET = "offset"      # Traditional offset-based (page numbers)
    CURSOR = "cursor"      # Cursor-based (for real-time data)
    HYBRID = "hybrid"      # Combines both for flexibility


@dataclass
class PaginationParams:
    """Parameters for pagination requests"""
    page: int = 1
    limit: int = 50
    cursor: Optional[str] = None
    sort_by: Optional[str] = None
    sort_order: SortOrder = SortOrder.DESC
    strategy: PaginationStrategy = PaginationStrategy.OFFSET
    
    # Filtering parameters
    filters: Optional[Dict[str, Any]] = None
    search_query: Optional[str] = None
    
    # Hydration parameters
    include_fields: Optional[List[str]] = None
    exclude_fields: Optional[List[str]] = None
    hydrate_level: str = "full"  # full, minimal, custom


@dataclass
class PaginationResult:
    """Result of paginated query with metadata"""
    items: List[Dict[str, Any]]
    page: int
    limit: int
    total_items: int
    total_pages: int
    has_next: bool
    has_previous: bool
    next_cursor: Optional[str]
    previous_cursor: Optional[str]
    
    # Performance metadata
    query_time_ms: int
    cache_hit: bool = False
    hydrated_fields: Optional[List[str]] = None
    
    # Navigation helpers
    @property
    def is_first_page(self) -> bool:
        return self.page == 1
    
    @property
    def is_last_page(self) -> bool:
        return self.page == self.total_pages
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "items": self.items,
            "pagination": {
                "page": self.page,
                "limit": self.limit,
                "total_items": self.total_items,
                "total_pages": self.total_pages,
                "has_next": self.has_next,
                "has_previous": self.has_previous,
                "next_cursor": self.next_cursor,
                "previous_cursor": self.previous_cursor,
                "is_first_page": self.is_first_page,
                "is_last_page": self.is_last_page
            },
            "meta": {
                "query_time_ms": self.query_time_ms,
                "cache_hit": self.cache_hit,
                "hydrated_fields": self.hydrated_fields
            }
        }


class DataHydrator:
    """Handles partial data hydration for performance optimization"""
    
    HYDRATION_LEVELS = {
        "minimal": ["id", "name", "value", "confidence"],
        "standard": ["id", "name", "value", "confidence", "player_name", "team", "sport"],
        "full": None,  # All fields
        "analytics": ["id", "name", "value", "confidence", "player_name", "team", 
                     "sport", "odds", "analysis", "trends", "ml_confidence"]
    }
    
    @classmethod
    def hydrate_items(
        cls,
        items: List[Dict[str, Any]],
        params: PaginationParams
    ) -> Tuple[List[Dict[str, Any]], List[str]]:
        """Apply hydration rules to items based on parameters"""
        
        if not items:
            return items, []
        
        # Determine fields to include
        if params.include_fields:
            target_fields = params.include_fields
        elif params.hydrate_level in cls.HYDRATION_LEVELS:
            target_fields = cls.HYDRATION_LEVELS[params.hydrate_level]
            if target_fields is None:  # Full hydration
                target_fields = list(items[0].keys()) if items else []
        else:
            target_fields = cls.HYDRATION_LEVELS["standard"]
        
        # Remove excluded fields
        if params.exclude_fields:
            target_fields = [f for f in target_fields if f not in params.exclude_fields]
        
        # Apply hydration
        hydrated_items = []
        for item in items:
            hydrated_item = {
                field: item.get(field) 
                for field in target_fields 
                if field in item
            }
            hydrated_items.append(hydrated_item)
        
        return hydrated_items, target_fields


class CursorGenerator:
    """Generates and validates pagination cursors"""
    
    @staticmethod
    def generate_cursor(item: Dict[str, Any], sort_field: str) -> str:
        """Generate cursor from item and sort field"""
        
        cursor_data = {
            "sort_value": item.get(sort_field),
            "id": item.get("id", item.get("prop_id", "")),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        cursor_json = json.dumps(cursor_data, sort_keys=True, separators=(',', ':'))
        cursor_hash = hashlib.md5(cursor_json.encode()).hexdigest()
        
        # Combine for validation
        return f"{cursor_hash}:{json.dumps(cursor_data)}"
    
    @staticmethod
    def decode_cursor(cursor: str) -> Optional[Dict[str, Any]]:
        """Decode and validate cursor"""
        
        try:
            if ":" not in cursor:
                return None
            
            cursor_hash, cursor_data_str = cursor.split(":", 1)
            cursor_data = json.loads(cursor_data_str)
            
            # Validate hash
            expected_hash = hashlib.md5(cursor_data_str.encode()).hexdigest()
            if cursor_hash != expected_hash:
                logger.warning(f"Invalid cursor hash: {cursor}")
                return None
            
            return cursor_data
            
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"Failed to decode cursor: {e}")
            return None


class PaginationService:
    """Main service for handling paginated queries"""
    
    def __init__(self, cache_service=None):
        self.cache = cache_service
        self.hydrator = DataHydrator()
        self.cursor_generator = CursorGenerator()
    
    async def paginate_data(
        self,
        data_source: Union[List[Dict[str, Any]], Callable],
        params: PaginationParams,
        cache_key: Optional[str] = None
    ) -> PaginationResult:
        """Main pagination method supporting multiple strategies"""
        
        start_time = datetime.utcnow()
        
        # Try cache first
        if cache_key and self.cache:
            cached_result = await self._get_cached_result(cache_key, params)
            if cached_result:
                return cached_result
        
        # Get data
        if callable(data_source):
            # Dynamic data source
            data = await data_source(params) if hasattr(data_source, '__await__') else data_source(params)
        else:
            # Static data
            data = data_source
        
        # Apply filtering
        filtered_data = self._apply_filters(data, params)
        
        # Apply sorting
        sorted_data = self._apply_sorting(filtered_data, params)
        
        # Apply pagination strategy
        if params.strategy == PaginationStrategy.CURSOR:
            result = await self._paginate_cursor(sorted_data, params)
        elif params.strategy == PaginationStrategy.HYBRID:
            result = await self._paginate_hybrid(sorted_data, params)
        else:
            result = await self._paginate_offset(sorted_data, params)
        
        # Apply hydration
        hydrated_items, hydrated_fields = self.hydrator.hydrate_items(result.items, params)
        result.items = hydrated_items
        result.hydrated_fields = hydrated_fields
        
        # Calculate query time
        query_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        result.query_time_ms = int(query_time)
        
        # Cache result
        if cache_key and self.cache:
            await self._cache_result(cache_key, params, result)
        
        return result
    
    def _apply_filters(
        self,
        data: List[Dict[str, Any]],
        params: PaginationParams
    ) -> List[Dict[str, Any]]:
        """Apply filtering to data"""
        
        if not params.filters and not params.search_query:
            return data
        
        filtered_data = data
        
        # Apply field-specific filters
        if params.filters:
            for field, value in params.filters.items():
                if isinstance(value, dict):
                    # Range or comparison filters
                    if "min" in value or "max" in value:
                        filtered_data = [
                            item for item in filtered_data
                            if self._apply_range_filter(item.get(field), value)
                        ]
                    elif "in" in value:
                        # List membership
                        filtered_data = [
                            item for item in filtered_data
                            if item.get(field) in value["in"]
                        ]
                else:
                    # Exact match
                    filtered_data = [
                        item for item in filtered_data
                        if item.get(field) == value
                    ]
        
        # Apply search query
        if params.search_query:
            search_lower = params.search_query.lower()
            filtered_data = [
                item for item in filtered_data
                if self._matches_search_query(item, search_lower)
            ]
        
        return filtered_data
    
    def _apply_range_filter(self, value: Any, range_filter: Dict[str, Any]) -> bool:
        """Apply range filter to a value"""
        
        if value is None:
            return False
        
        try:
            numeric_value = float(value)
            
            if "min" in range_filter and numeric_value < range_filter["min"]:
                return False
            
            if "max" in range_filter and numeric_value > range_filter["max"]:
                return False
            
            return True
            
        except (ValueError, TypeError):
            return False
    
    def _matches_search_query(self, item: Dict[str, Any], query: str) -> bool:
        """Check if item matches search query"""
        
        searchable_fields = ["name", "player_name", "team", "description", "sport"]
        
        for field in searchable_fields:
            if field in item and item[field]:
                if query in str(item[field]).lower():
                    return True
        
        return False
    
    def _apply_sorting(
        self,
        data: List[Dict[str, Any]],
        params: PaginationParams
    ) -> List[Dict[str, Any]]:
        """Apply sorting to data"""
        
        if not params.sort_by:
            return data
        
        def sort_key(item):
            value = item.get(params.sort_by)
            
            # Handle None values
            if value is None:
                return float('-inf') if params.sort_order == SortOrder.ASC else float('inf')
            
            # Handle numeric values
            if isinstance(value, (int, float)):
                return value
            
            # Handle string values
            if isinstance(value, str):
                return value.lower()
            
            # Default to string representation
            return str(value).lower()
        
        try:
            return sorted(
                data,
                key=sort_key,
                reverse=(params.sort_order == SortOrder.DESC)
            )
        except Exception as e:
            logger.warning(f"Failed to sort data: {e}")
            return data
    
    async def _paginate_offset(
        self,
        data: List[Dict[str, Any]],
        params: PaginationParams
    ) -> PaginationResult:
        """Offset-based pagination (traditional page numbers)"""
        
        total_items = len(data)
        total_pages = math.ceil(total_items / params.limit) if params.limit > 0 else 1
        
        # Calculate offset
        offset = (params.page - 1) * params.limit
        
        # Get page items
        items = data[offset:offset + params.limit]
        
        return PaginationResult(
            items=items,
            page=params.page,
            limit=params.limit,
            total_items=total_items,
            total_pages=total_pages,
            has_next=params.page < total_pages,
            has_previous=params.page > 1,
            next_cursor=None,
            previous_cursor=None,
            query_time_ms=0  # Will be set later
        )
    
    async def _paginate_cursor(
        self,
        data: List[Dict[str, Any]],
        params: PaginationParams
    ) -> PaginationResult:
        """Cursor-based pagination (for real-time data)"""
        
        sort_field = params.sort_by or "id"
        
        # Decode cursor if provided
        cursor_data = None
        if params.cursor:
            cursor_data = self.cursor_generator.decode_cursor(params.cursor)
        
        # Filter data based on cursor
        if cursor_data and "sort_value" in cursor_data:
            if params.sort_order == SortOrder.DESC:
                data = [
                    item for item in data
                    if (item.get(sort_field) or 0) < (cursor_data["sort_value"] or 0)
                ]
            else:
                data = [
                    item for item in data
                    if (item.get(sort_field) or 0) > (cursor_data["sort_value"] or 0)
                ]
        
        # Get page items
        items = data[:params.limit]
        
        # Generate cursors
        next_cursor = None
        if len(items) == params.limit and len(data) > params.limit:
            next_cursor = self.cursor_generator.generate_cursor(items[-1], sort_field)
        
        previous_cursor = None
        if cursor_data:
            # For previous cursor, we'd need to query in reverse
            previous_cursor = "prev_" + (params.cursor or "")
        
        # Estimate total (not exact for cursor pagination)
        total_items = len(data) + (params.page - 1) * params.limit
        
        return PaginationResult(
            items=items,
            page=params.page,
            limit=params.limit,
            total_items=total_items,
            total_pages=0,  # Not applicable for cursor pagination
            has_next=next_cursor is not None,
            has_previous=cursor_data is not None,
            next_cursor=next_cursor,
            previous_cursor=previous_cursor,
            query_time_ms=0
        )
    
    async def _paginate_hybrid(
        self,
        data: List[Dict[str, Any]],
        params: PaginationParams
    ) -> PaginationResult:
        """Hybrid pagination (combines offset and cursor)"""
        
        # Use offset for basic pagination
        offset_result = await self._paginate_offset(data, params)
        
        # Add cursor support
        if offset_result.items:
            sort_field = params.sort_by or "id"
            
            if offset_result.has_next:
                offset_result.next_cursor = self.cursor_generator.generate_cursor(
                    offset_result.items[-1], sort_field
                )
            
            if offset_result.has_previous and len(offset_result.items) > 0:
                offset_result.previous_cursor = self.cursor_generator.generate_cursor(
                    offset_result.items[0], sort_field
                )
        
        return offset_result
    
    async def _get_cached_result(
        self,
        cache_key: str,
        params: PaginationParams
    ) -> Optional[PaginationResult]:
        """Get cached pagination result"""
        
        if not self.cache:
            return None
        
        # Create cache key with parameters
        params_hash = hashlib.md5(
            json.dumps(params.__dict__, sort_keys=True, default=str).encode()
        ).hexdigest()[:8]
        
        full_cache_key = f"{cache_key}:{params_hash}"
        
        try:
            cached_data = await self.cache.get(full_cache_key)
            if cached_data:
                result = PaginationResult(**cached_data)
                result.cache_hit = True
                return result
        except Exception as e:
            logger.warning(f"Failed to get cached result: {e}")
        
        return None
    
    async def _cache_result(
        self,
        cache_key: str,
        params: PaginationParams,
        result: PaginationResult
    ) -> None:
        """Cache pagination result"""
        
        if not self.cache:
            return
        
        # Create cache key with parameters
        params_hash = hashlib.md5(
            json.dumps(params.__dict__, sort_keys=True, default=str).encode()
        ).hexdigest()[:8]
        
        full_cache_key = f"{cache_key}:{params_hash}"
        
        try:
            # Cache for 5 minutes by default
            cache_ttl = 300
            
            # Shorter cache for real-time data
            if "live" in cache_key or "real-time" in cache_key:
                cache_ttl = 60
            
            cache_data = {
                "items": result.items,
                "page": result.page,
                "limit": result.limit,
                "total_items": result.total_items,
                "total_pages": result.total_pages,
                "has_next": result.has_next,
                "has_previous": result.has_previous,
                "next_cursor": result.next_cursor,
                "previous_cursor": result.previous_cursor,
                "query_time_ms": result.query_time_ms,
                "hydrated_fields": result.hydrated_fields
            }
            
            await self.cache.set(full_cache_key, cache_data, ttl=cache_ttl)
            
        except Exception as e:
            logger.warning(f"Failed to cache result: {e}")


# Factory function for creating pagination service
def create_pagination_service(cache_service=None) -> PaginationService:
    """Create pagination service with optional cache"""
    return PaginationService(cache_service=cache_service)


# Helper function for extracting pagination params from request
def extract_pagination_params(
    page: int = 1,
    limit: int = 50,
    cursor: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: str = "desc",
    strategy: str = "offset",
    search: Optional[str] = None,
    hydrate_level: str = "standard",
    include_fields: Optional[str] = None,
    exclude_fields: Optional[str] = None,
    **filters
) -> PaginationParams:
    """Extract pagination parameters from query parameters"""
    
    # Validate and convert parameters
    page = max(1, page)
    limit = max(1, min(1000, limit))  # Cap at 1000 items
    
    try:
        sort_order_enum = SortOrder(sort_order.lower())
    except ValueError:
        sort_order_enum = SortOrder.DESC
    
    try:
        strategy_enum = PaginationStrategy(strategy.lower())
    except ValueError:
        strategy_enum = PaginationStrategy.OFFSET
    
    # Parse field lists
    include_list = include_fields.split(",") if include_fields else None
    exclude_list = exclude_fields.split(",") if exclude_fields else None
    
    return PaginationParams(
        page=page,
        limit=limit,
        cursor=cursor,
        sort_by=sort_by,
        sort_order=sort_order_enum,
        strategy=strategy_enum,
        filters=filters or None,
        search_query=search,
        hydrate_level=hydrate_level,
        include_fields=include_list,
        exclude_fields=exclude_list
    )