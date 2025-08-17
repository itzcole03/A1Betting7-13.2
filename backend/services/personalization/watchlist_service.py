"""
Watchlist Service

Manages user watchlists for tracking specific props, players, and betting opportunities.
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from backend.models.risk_personalization import Watchlist, WatchlistItem
from backend.services.unified_config import unified_config

logger = logging.getLogger(__name__)


class WatchlistService:
    """Service for managing user watchlists"""
    
    def __init__(self):
        self.config = unified_config
        
    def create_watchlist(
        self,
        user_id: str,
        name: str,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new watchlist for user
        
        Args:
            user_id: User ID
            name: Watchlist name
            description: Optional description
            
        Returns:
            Created watchlist data
        """
        
        logger.info(
            "Creating watchlist: user_id=%s, name=%s",
            user_id, name
        )
        
        # In real implementation, this would create database record
        watchlist = Watchlist(
            user_id=user_id,
            name=name,
            description=description,
            created_at=datetime.now(timezone.utc),
            is_active=True
        )
        
        # TODO: Save to database and get real ID
        watchlist.id = 1  # Mock ID
        
        result = {
            "id": watchlist.id,
            "user_id": watchlist.user_id,
            "name": watchlist.name,
            "description": watchlist.description,
            "created_at": watchlist.created_at.isoformat(),
            "is_active": watchlist.is_active,
            "item_count": 0
        }
        
        logger.info("Watchlist created: id=%s, user_id=%s", watchlist.id, user_id)
        return result
        
    def add_watchlist_item(
        self,
        watchlist_id: int,
        user_id: str,
        prop_id: Optional[str] = None,
        player_id: Optional[str] = None,
        prop_type: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Add item to watchlist
        
        Args:
            watchlist_id: Watchlist ID
            user_id: User ID (for authorization)
            prop_id: Optional specific prop ID
            player_id: Optional player ID
            prop_type: Optional prop type
            notes: Optional notes
            
        Returns:
            Created watchlist item data
        """
        
        logger.info(
            "Adding watchlist item: watchlist_id=%s, user_id=%s, prop_id=%s, player_id=%s",
            watchlist_id, user_id, prop_id, player_id
        )
        
        # Validate that at least one identifier is provided
        if not any([prop_id, player_id, prop_type]):
            raise ValueError("At least one of prop_id, player_id, or prop_type must be provided")
            
        # Check for existing item (uniqueness constraint)
        if self._item_exists(watchlist_id, prop_id, player_id):
            raise ValueError("Item already exists in watchlist")
            
        # In real implementation, verify watchlist belongs to user
        # and create database record
        item = WatchlistItem(
            watchlist_id=watchlist_id,
            prop_id=prop_id,
            player_id=player_id,
            prop_type=prop_type,
            notes=notes,
            created_at=datetime.now(timezone.utc),
            is_active=True
        )
        
        # TODO: Save to database and get real ID
        item.id = 1  # Mock ID
        
        result = {
            "id": item.id,
            "watchlist_id": item.watchlist_id,
            "prop_id": item.prop_id,
            "player_id": item.player_id,
            "prop_type": item.prop_type,
            "notes": item.notes,
            "created_at": item.created_at.isoformat(),
            "is_active": item.is_active
        }
        
        logger.info("Watchlist item added: id=%s, watchlist_id=%s", item.id, watchlist_id)
        return result
        
    def get_user_watchlists(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all watchlists for a user
        
        Args:
            user_id: User ID
            
        Returns:
            List of watchlist data
        """
        
        logger.info("Retrieving watchlists: user_id=%s", user_id)
        
        # In real implementation, query database
        # For now, return mock data
        watchlists = [
            {
                "id": 1,
                "user_id": user_id,
                "name": "High EV Props",
                "description": "Props with high expected value",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "is_active": True,
                "item_count": 5
            },
            {
                "id": 2,
                "user_id": user_id,
                "name": "Favorite Players",
                "description": "Players I like to bet on",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "is_active": True,
                "item_count": 3
            }
        ]
        
        logger.info("Retrieved watchlists: user_id=%s, count=%s", user_id, len(watchlists))
        return watchlists
        
    def get_watchlist_items(self, watchlist_id: int, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all items in a watchlist
        
        Args:
            watchlist_id: Watchlist ID
            user_id: User ID (for authorization)
            
        Returns:
            List of watchlist items
        """
        
        logger.info("Retrieving watchlist items: watchlist_id=%s, user_id=%s", watchlist_id, user_id)
        
        # In real implementation, verify ownership and query database
        # For now, return mock data
        items = [
            {
                "id": 1,
                "watchlist_id": watchlist_id,
                "prop_id": None,
                "player_id": "lebron_james",
                "prop_type": "POINTS",
                "notes": "Usually good value on over",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "is_active": True
            },
            {
                "id": 2,
                "watchlist_id": watchlist_id,
                "prop_id": "specific_prop_123",
                "player_id": "stephen_curry",
                "prop_type": "THREE_POINTERS",
                "notes": "Check this before every Warriors game",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "is_active": True
            }
        ]
        
        logger.info("Retrieved watchlist items: watchlist_id=%s, count=%s", watchlist_id, len(items))
        return items
        
    def get_watchlist_edges(
        self,
        user_id: str,
        watchlist_id: int,
        edges_pool: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """
        Get edges that match watchlist items
        
        Args:
            user_id: User ID
            watchlist_id: Watchlist ID
            edges_pool: Optional pool of edges to filter from
            
        Returns:
            List of matching edges
        """
        
        logger.info("Getting watchlist edges: user_id=%s, watchlist_id=%s", user_id, watchlist_id)
        
        # Get watchlist items
        items = self.get_watchlist_items(watchlist_id, user_id)
        
        # In real implementation, this would query edges that match the watchlist criteria
        # For now, return mock matching edges
        matching_edges = []
        
        for item in items:
            # Create mock edge that matches this watchlist item
            mock_edge = {
                "id": f"edge_{item['id']}",
                "player_id": item["player_id"],
                "prop_type": item["prop_type"],
                "player_name": self._get_player_name(item["player_id"]),
                "ev": 0.08,  # 8% EV
                "probability": 0.65,
                "odds": 1.85,
                "line": 25.5,
                "over_under": "over",
                "watchlist_match": True,
                "watchlist_notes": item["notes"],
                "sportsbook": "DraftKings"
            }
            matching_edges.append(mock_edge)
            
        logger.info("Found matching edges: watchlist_id=%s, matches=%s", watchlist_id, len(matching_edges))
        return matching_edges
        
    def remove_watchlist_item(self, item_id: int, user_id: str) -> bool:
        """
        Remove item from watchlist
        
        Args:
            item_id: Watchlist item ID
            user_id: User ID (for authorization)
            
        Returns:
            True if removed successfully
        """
        
        logger.info("Removing watchlist item: item_id=%s, user_id=%s", item_id, user_id)
        
        # In real implementation, verify ownership and delete from database
        # For now, just return success
        logger.info("Watchlist item removed: item_id=%s", item_id)
        return True
        
    def update_watchlist(
        self,
        watchlist_id: int,
        user_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Dict[str, Any]:
        """
        Update watchlist properties
        
        Args:
            watchlist_id: Watchlist ID
            user_id: User ID (for authorization)
            name: Optional new name
            description: Optional new description
            is_active: Optional active status
            
        Returns:
            Updated watchlist data
        """
        
        logger.info("Updating watchlist: watchlist_id=%s, user_id=%s", watchlist_id, user_id)
        
        # In real implementation, verify ownership and update database
        # For now, return mock updated data
        updated = {
            "id": watchlist_id,
            "user_id": user_id,
            "name": name or "Updated Watchlist",
            "description": description,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_active": is_active if is_active is not None else True,
            "item_count": 2
        }
        
        logger.info("Watchlist updated: watchlist_id=%s", watchlist_id)
        return updated
        
    def delete_watchlist(self, watchlist_id: int, user_id: str) -> bool:
        """
        Delete entire watchlist
        
        Args:
            watchlist_id: Watchlist ID
            user_id: User ID (for authorization)
            
        Returns:
            True if deleted successfully
        """
        
        logger.info("Deleting watchlist: watchlist_id=%s, user_id=%s", watchlist_id, user_id)
        
        # In real implementation, verify ownership and delete from database
        # This would also cascade delete all watchlist items
        logger.info("Watchlist deleted: watchlist_id=%s", watchlist_id)
        return True
        
    def _item_exists(
        self,
        watchlist_id: int,
        prop_id: Optional[str],
        player_id: Optional[str]
    ) -> bool:
        """Check if watchlist item already exists"""
        
        # In real implementation, query database for existing item
        # For now, always return False (no duplicates)
        return False
        
    def _get_player_name(self, player_id: Optional[str]) -> str:
        """Get display name for player"""
        
        # Mock player name mapping
        player_names = {
            "lebron_james": "LeBron James",
            "stephen_curry": "Stephen Curry",
            "giannis_antetokounmpo": "Giannis Antetokounmpo",
            "kevin_durant": "Kevin Durant",
            "nikola_jokic": "Nikola Jokic"
        }
        
        return player_names.get(player_id or "", player_id or "Unknown Player")


# Singleton instance
watchlist_service = WatchlistService()