"""
Create bookmarks table for Phase 4.2

Simple script to create the bookmarks table in the database.
"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from backend.database import async_engine

async def create_bookmarks_table():
    """Create bookmarks table with proper schema"""
    
    print("📊 Creating bookmarks table for Phase 4.2...")
    
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        prop_id TEXT NOT NULL,
        sport TEXT NOT NULL,
        player TEXT NOT NULL,
        market TEXT NOT NULL,
        team TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(user_id, prop_id)
    );
    """
    
    create_indexes_sql = [
        "CREATE INDEX IF NOT EXISTS ix_bookmarks_user_id ON bookmarks (user_id);",
        "CREATE INDEX IF NOT EXISTS ix_bookmarks_prop_id ON bookmarks (prop_id);",
        "CREATE INDEX IF NOT EXISTS ix_bookmarks_sport ON bookmarks (sport);"
    ]
    
    try:
        async with AsyncSession(async_engine) as session:
            # Create table
            await session.execute(text(create_table_sql))
            print("✅ Bookmarks table created")
            
            # Create indexes
            for index_sql in create_indexes_sql:
                await session.execute(text(index_sql))
            
            print("✅ Indexes created")
            
            await session.commit()
            print("✅ Database changes committed")
            
    except Exception as e:
        print(f"❌ Error creating bookmarks table: {e}")

if __name__ == "__main__":
    asyncio.run(create_bookmarks_table())