"""
Bookmark Service

Service layer for managing user bookmarks of prop opportunities.
Implements Phase 4.2 - Bookmark Persistence & UX functionality.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import select, delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.bookmark import Bookmark, BookmarkORM
from backend.models.user import UserORM
from backend.database import async_engine

logger = logging.getLogger(__name__)


class BookmarkService:
    """Service for managing user bookmarks"""
    
    def __init__(self):
        self.logger = logger
    
    async def bookmark_prop(
        self,
        user_id: str,
        prop_id: str,
        sport: str,
        player: str,
        market: str,
        team: str,
        session: Optional[AsyncSession] = None
    ) -> bool:
        """
        Bookmark a prop opportunity for a user
        
        Args:
            user_id: User ID
            prop_id: Prop opportunity ID
            sport: Sport name (NBA, MLB, etc.)
            player: Player name
            market: Betting market (Points, Rebounds, etc.)
            team: Team name
            session: Optional database session
            
        Returns:
            bool: True if bookmarked successfully, False if already bookmarked
            
        Raises:
            ValueError: If user not found
        """
        if session is None:
            from sqlalchemy.ext.asyncio import AsyncSession
            async with AsyncSession(async_engine) as session:
                return await self.bookmark_prop(user_id, prop_id, sport, player, market, team, session)
        
        try:
            # Check if user exists
            user_result = await session.execute(
                select(UserORM).where(UserORM.id == user_id)
            )
            user = user_result.scalar_one_or_none()
            if not user:
                raise ValueError(f"User not found: {user_id}")
            
            # Check if bookmark already exists
            existing_result = await session.execute(
                select(BookmarkORM).where(
                    BookmarkORM.user_id == user_id,
                    BookmarkORM.prop_id == prop_id
                )
            )
            existing_bookmark = existing_result.scalar_one_or_none()
            
            if existing_bookmark:
                self.logger.info(f"Bookmark already exists for user {user_id}, prop {prop_id}")
                return False
            
            # Create new bookmark
            bookmark = BookmarkORM(
                id=str(uuid.uuid4()),
                user_id=user_id,
                prop_id=prop_id,
                sport=sport,
                player=player,
                market=market,
                team=team,
                created_at=datetime.now(timezone.utc)
            )
            
            session.add(bookmark)
            await session.commit()
            
            self.logger.info(f"Bookmarked prop {prop_id} for user {user_id}")
            return True
            
        except IntegrityError as e:
            await session.rollback()
            self.logger.warning(f"Integrity error bookmarking prop {prop_id} for user {user_id}: {e}")
            return False
        except Exception as e:
            await session.rollback()
            self.logger.error(f"Error bookmarking prop {prop_id} for user {user_id}: {e}")
            raise
    
    async def unbookmark_prop(
        self,
        user_id: str,
        prop_id: str,
        session: Optional[AsyncSession] = None
    ) -> bool:
        """
        Remove bookmark for a prop opportunity
        
        Args:
            user_id: User ID
            prop_id: Prop opportunity ID
            session: Optional database session
            
        Returns:
            bool: True if unbookmarked successfully, False if bookmark didn't exist
            
        Raises:
            ValueError: If user not found
        """
        if session is None:
            from sqlalchemy.ext.asyncio import AsyncSession
            async with AsyncSession(async_engine) as session:
                return await self.unbookmark_prop(user_id, prop_id, session)
        
        try:
            # Check if user exists
            user_result = await session.execute(
                select(UserORM).where(UserORM.id == user_id)
            )
            user = user_result.scalar_one_or_none()
            if not user:
                raise ValueError(f"User not found: {user_id}")
            
            # Delete bookmark
            result = await session.execute(
                delete(BookmarkORM).where(
                    BookmarkORM.user_id == user_id,
                    BookmarkORM.prop_id == prop_id
                )
            )
            
            await session.commit()
            
            deleted_count = result.rowcount
            if deleted_count > 0:
                self.logger.info(f"Unbookmarked prop {prop_id} for user {user_id}")
                return True
            else:
                self.logger.info(f"No bookmark found for user {user_id}, prop {prop_id}")
                return False
            
        except Exception as e:
            await session.rollback()
            self.logger.error(f"Error unbookmarking prop {prop_id} for user {user_id}: {e}")
            raise
    
    async def get_user_bookmarks(
        self,
        user_id: str,
        sport: Optional[str] = None,
        limit: int = 100,
        session: Optional[AsyncSession] = None
    ) -> List[BookmarkORM]:
        """
        Get all bookmarks for a user
        
        Args:
            user_id: User ID
            sport: Optional sport filter
            limit: Maximum number of bookmarks to return
            session: Optional database session
            
        Returns:
            List[BookmarkORM]: List of user bookmarks
            
        Raises:
            ValueError: If user not found
        """
        if session is None:
            from sqlalchemy.ext.asyncio import AsyncSession
            async with AsyncSession(async_engine) as session:
                return await self.get_user_bookmarks(user_id, sport, limit, session)
        
        try:
            # Check if user exists
            user_result = await session.execute(
                select(UserORM).where(UserORM.id == user_id)
            )
            user = user_result.scalar_one_or_none()
            if not user:
                raise ValueError(f"User not found: {user_id}")
            
            # Build query
            query = select(BookmarkORM).where(BookmarkORM.user_id == user_id)
            
            if sport:
                query = query.where(BookmarkORM.sport == sport)
            
            # Order by most recent first and limit results
            query = query.order_by(BookmarkORM.created_at.desc()).limit(limit)
            
            result = await session.execute(query)
            bookmarks = result.scalars().all()
            
            self.logger.debug(f"Retrieved {len(bookmarks)} bookmarks for user {user_id}")
            return list(bookmarks)
            
        except ValueError:
            raise
        except Exception as e:
            self.logger.error(f"Error retrieving bookmarks for user {user_id}: {e}")
            raise
    
    async def get_user_bookmarked_prop_ids(
        self,
        user_id: str,
        session: Optional[AsyncSession] = None
    ) -> set[str]:
        """
        Get set of bookmarked prop IDs for a user (for efficient lookup)
        
        Args:
            user_id: User ID
            session: Optional database session
            
        Returns:
            set[str]: Set of bookmarked prop IDs
        """
        if session is None:
            from sqlalchemy.ext.asyncio import AsyncSession
            async with AsyncSession(async_engine) as session:
                return await self.get_user_bookmarked_prop_ids(user_id, session)
        
        try:
            result = await session.execute(
                select(BookmarkORM.prop_id).where(BookmarkORM.user_id == user_id)
            )
            prop_ids = result.scalars().all()
            
            return set(prop_ids)
            
        except Exception as e:
            self.logger.error(f"Error retrieving bookmarked prop IDs for user {user_id}: {e}")
            return set()
    
    async def is_prop_bookmarked(
        self,
        user_id: str,
        prop_id: str,
        session: Optional[AsyncSession] = None
    ) -> bool:
        """
        Check if a prop is bookmarked by a user
        
        Args:
            user_id: User ID
            prop_id: Prop opportunity ID
            session: Optional database session
            
        Returns:
            bool: True if bookmarked, False otherwise
        """
        if session is None:
            from sqlalchemy.ext.asyncio import AsyncSession
            async with AsyncSession(async_engine) as session:
                return await self.is_prop_bookmarked(user_id, prop_id, session)
        
        try:
            result = await session.execute(
                select(BookmarkORM).where(
                    BookmarkORM.user_id == user_id,
                    BookmarkORM.prop_id == prop_id
                )
            )
            bookmark = result.scalar_one_or_none()
            
            return bookmark is not None
            
        except Exception as e:
            self.logger.error(f"Error checking if prop {prop_id} is bookmarked for user {user_id}: {e}")
            return False


# Singleton instance
_bookmark_service = None

def get_bookmark_service() -> BookmarkService:
    """Get singleton bookmark service instance"""
    global _bookmark_service
    if _bookmark_service is None:
        _bookmark_service = BookmarkService()
    return _bookmark_service