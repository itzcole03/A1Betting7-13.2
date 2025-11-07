#!/usr/bin/env python3
"""
Create provider_states and portfolio_rationales tables directly
"""

import sqlite3
import os

def main():
    # Database path relative to backend directory
    db_path = '../a1betting.db'
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if provider_states table exists
        cursor.execute('SELECT name FROM sqlite_master WHERE type="table" AND name="provider_states"')
        if not cursor.fetchone():
            print('Creating provider_states table...')
            cursor.execute('''
            CREATE TABLE provider_states (
                id INTEGER PRIMARY KEY,
                provider_name VARCHAR(100) NOT NULL,
                sport VARCHAR(20) NOT NULL DEFAULT 'NBA',
                status VARCHAR(20) NOT NULL DEFAULT 'INACTIVE',
                is_enabled BOOLEAN NOT NULL DEFAULT 1,
                poll_interval_seconds INTEGER NOT NULL DEFAULT 60,
                timeout_seconds INTEGER NOT NULL DEFAULT 30,
                max_retries INTEGER NOT NULL DEFAULT 3,
                last_fetch_attempt DATETIME,
                last_successful_fetch DATETIME,
                last_error TEXT,
                consecutive_errors INTEGER NOT NULL DEFAULT 0,
                total_requests INTEGER NOT NULL DEFAULT 0,
                successful_requests INTEGER NOT NULL DEFAULT 0,
                failed_requests INTEGER NOT NULL DEFAULT 0,
                average_response_time_ms FLOAT,
                total_props_fetched INTEGER NOT NULL DEFAULT 0,
                unique_props_seen INTEGER NOT NULL DEFAULT 0,
                last_prop_count INTEGER,
                capabilities JSON,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )''')
            
            cursor.execute('CREATE INDEX ix_provider_states_provider_name ON provider_states (provider_name)')
            cursor.execute('CREATE INDEX ix_provider_states_sport ON provider_states (sport)')
            cursor.execute('CREATE INDEX ix_provider_states_sport_provider ON provider_states (sport, provider_name)')
            cursor.execute('CREATE INDEX ix_provider_states_sport_status ON provider_states (sport, status)')
            print('✅ provider_states table created successfully')
        else:
            print('ℹ️ provider_states table already exists')

        # Check if portfolio_rationales table exists  
        cursor.execute('SELECT name FROM sqlite_master WHERE type="table" AND name="portfolio_rationales"')
        if not cursor.fetchone():
            print('Creating portfolio_rationales table...')
            cursor.execute('''
            CREATE TABLE portfolio_rationales (
                id INTEGER PRIMARY KEY,
                request_id VARCHAR(100) NOT NULL UNIQUE,
                rationale_type VARCHAR(50) NOT NULL,
                portfolio_data_hash VARCHAR(64) NOT NULL,
                portfolio_data JSON NOT NULL,
                context_data JSON,
                user_preferences JSON,
                narrative TEXT NOT NULL,
                key_points JSON NOT NULL,
                confidence FLOAT NOT NULL,
                generation_time_ms INTEGER NOT NULL,
                model_info JSON NOT NULL,
                prompt_tokens INTEGER,
                completion_tokens INTEGER,
                total_cost FLOAT,
                user_rating INTEGER,
                user_feedback TEXT,
                is_flagged BOOLEAN NOT NULL DEFAULT 0,
                cache_hits INTEGER NOT NULL DEFAULT 1,
                last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )''')
            
            cursor.execute('CREATE INDEX ix_portfolio_rationales_request_id ON portfolio_rationales (request_id)')
            cursor.execute('CREATE INDEX ix_portfolio_rationales_rationale_type ON portfolio_rationales (rationale_type)')
            cursor.execute('CREATE INDEX ix_portfolio_rationales_portfolio_data_hash ON portfolio_rationales (portfolio_data_hash)')
            cursor.execute('CREATE INDEX ix_rationale_type_hash ON portfolio_rationales (rationale_type, portfolio_data_hash)')
            cursor.execute('CREATE INDEX ix_rationale_expires_at ON portfolio_rationales (expires_at)')
            cursor.execute('CREATE INDEX ix_rationale_created_at ON portfolio_rationales (created_at)')
            print('✅ portfolio_rationales table created successfully')
        else:
            print('ℹ️ portfolio_rationales table already exists')

        conn.commit()
        print('✅ Database schema finalization completed')
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    main()