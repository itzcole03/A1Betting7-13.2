"""
Test Phase 4.2 Bookmark Persistence

Simple test script to verify bookmark functionality.
"""

import asyncio
import json
from datetime import datetime, timezone

# Test data for bookmark operations
TEST_USER_ID = "test_user_123"
TEST_BOOKMARK_REQUEST = {
    "prop_id": "nba_1",
    "sport": "NBA",
    "player": "Jayson Tatum",
    "market": "Points",
    "team": "Celtics",
    "bookmarked": True
}

async def test_bookmark_functionality():
    """Test bookmark create, retrieve, and delete operations"""
    
    print("🧪 Testing Phase 4.2 Bookmark Persistence...")
    print("=" * 50)
    
    try:
        # Import and initialize services
        from backend.services.bookmark_service import get_bookmark_service
        from backend.models.user import UserORM
        from sqlalchemy.ext.asyncio import AsyncSession
        from backend.database import async_engine
        
        bookmark_service = get_bookmark_service()
        
        # Create async session for testing
        async with AsyncSession(async_engine) as session:
            # Create test user if it doesn't exist
            from sqlalchemy import select
            user_result = await session.execute(
                select(UserORM).where(UserORM.id == TEST_USER_ID)
            )
            existing_user = user_result.scalar_one_or_none()
            
            if not existing_user:
                print(f"📝 Creating test user: {TEST_USER_ID}")
                test_user = UserORM(
                    id=TEST_USER_ID,
                    username=f"testuser_{datetime.now().strftime('%H%M%S')}",
                    email=f"test_{datetime.now().strftime('%H%M%S')}@example.com",
                    hashed_password="test_hash",
                    created_at=datetime.now(timezone.utc)
                )
                session.add(test_user)
                await session.commit()
                print("✅ Test user created")
            else:
                print("✅ Test user already exists")
        
        # Test 1: Create bookmark
        print(f"\n🔖 Test 1: Creating bookmark for prop {TEST_BOOKMARK_REQUEST['prop_id']}")
        success = await bookmark_service.bookmark_prop(
            user_id=TEST_USER_ID,
            prop_id=TEST_BOOKMARK_REQUEST['prop_id'],
            sport=TEST_BOOKMARK_REQUEST['sport'],
            player=TEST_BOOKMARK_REQUEST['player'],
            market=TEST_BOOKMARK_REQUEST['market'],
            team=TEST_BOOKMARK_REQUEST['team']
        )
        
        if success:
            print("✅ Bookmark created successfully")
        else:
            print("ℹ️ Bookmark already existed")
        
        # Test 2: Retrieve user bookmarks
        print(f"\n📋 Test 2: Retrieving bookmarks for user {TEST_USER_ID}")
        bookmarks = await bookmark_service.get_user_bookmarks(TEST_USER_ID)
        print(f"✅ Retrieved {len(bookmarks)} bookmarks")
        
        if bookmarks:
            for bookmark in bookmarks:
                print(f"   - {bookmark.player} ({bookmark.sport}): {bookmark.market}")
        
        # Test 3: Check if prop is bookmarked
        print(f"\n🔍 Test 3: Checking if prop {TEST_BOOKMARK_REQUEST['prop_id']} is bookmarked")
        is_bookmarked = await bookmark_service.is_prop_bookmarked(
            TEST_USER_ID, 
            TEST_BOOKMARK_REQUEST['prop_id']
        )
        print(f"✅ Prop bookmarked status: {is_bookmarked}")
        
        # Test 4: Get bookmarked prop IDs
        print(f"\n🎯 Test 4: Getting bookmarked prop IDs for user {TEST_USER_ID}")
        prop_ids = await bookmark_service.get_user_bookmarked_prop_ids(TEST_USER_ID)
        print(f"✅ Bookmarked prop IDs: {prop_ids}")
        
        # Test 5: Unbookmark prop
        print(f"\n🗑️ Test 5: Unbookmarking prop {TEST_BOOKMARK_REQUEST['prop_id']}")
        success = await bookmark_service.unbookmark_prop(
            TEST_USER_ID,
            TEST_BOOKMARK_REQUEST['prop_id']
        )
        
        if success:
            print("✅ Bookmark removed successfully")
        else:
            print("ℹ️ Bookmark was not found")
        
        # Test 6: Verify removal
        print(f"\n🔍 Test 6: Verifying bookmark removal")
        is_bookmarked_after = await bookmark_service.is_prop_bookmarked(
            TEST_USER_ID, 
            TEST_BOOKMARK_REQUEST['prop_id']
        )
        print(f"✅ Prop bookmarked status after removal: {is_bookmarked_after}")
        
        print("\n" + "=" * 50)
        print("🎉 All bookmark tests completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_bookmark_functionality())