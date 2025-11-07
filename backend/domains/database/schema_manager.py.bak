"""
Schema Manager - Database schema optimization and migration utilities
Handles database consolidation, indexing strategy, and performance optimization
"""

import logging
from typing import Dict, List, Optional, Any
from sqlalchemy import create_engine, MetaData, text, inspect
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone
import asyncio
from contextlib import asynccontextmanager

from .optimized_models import Base, OptimizedUser, OptimizedMatch, OptimizedPrediction, OptimizedBet, OptimizedOdds, OptimizedPlayerStats, OptimizedTeamStats, OptimizedGameEvents

logger = logging.getLogger(__name__)

class SchemaManager:
    """Database schema optimization and consolidation manager"""
    
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.engine = None
        self.session_factory = None
        self.metadata = MetaData()
        
    def initialize(self):
        """Initialize database connection and session factory"""
        try:
            self.engine = create_engine(
                self.database_url,
                echo=False,  # Set to True for SQL logging
                pool_size=20,
                max_overflow=30,
                pool_timeout=30,
                pool_recycle=3600,
                pool_pre_ping=True,
                connect_args={
                    "options": "-c timezone=UTC"
                } if "postgresql" in self.database_url else {}
            )
            
            self.session_factory = sessionmaker(
                bind=self.engine,
                autocommit=False,
                autoflush=False
            )
            
            logger.info("Database schema manager initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize schema manager: {e}")
            raise
    
    @asynccontextmanager
    async def get_session(self):
        """Get database session with proper cleanup"""
        session = self.session_factory()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            session.close()
    
    def create_optimized_schema(self):
        """Create optimized database schema with all tables and indexes"""
        try:
            logger.info("Creating optimized database schema...")
            
            # Drop existing optimized tables if they exist (for clean migration)
            self._drop_optimized_tables()
            
            # Create all optimized tables
            Base.metadata.create_all(bind=self.engine)
            
            # Create additional indexes for performance
            self._create_performance_indexes()
            
            # Create views for common queries
            self._create_performance_views()
            
            logger.info("Optimized database schema created successfully")
            
        except Exception as e:
            logger.error(f"Failed to create optimized schema: {e}")
            raise
    
    def _drop_optimized_tables(self):
        """Drop existing optimized tables"""
        optimized_tables = [
            "game_events_optimized",
            "team_stats_optimized", 
            "player_stats_optimized",
            "odds_optimized",
            "bets_optimized",
            "predictions_optimized",
            "matches_optimized",
            "users_optimized"
        ]
        
        with self.engine.begin() as conn:
            for table in optimized_tables:
                try:
                    conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
                except Exception as e:
                    logger.warning(f"Could not drop table {table}: {e}")
    
    def _create_performance_indexes(self):
        """Create additional performance indexes"""
        performance_indexes = [
            # Cross-table query optimization
            "CREATE INDEX IF NOT EXISTS idx_user_bets_performance ON bets_optimized(user_id, status, placed_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_match_predictions_performance ON predictions_optimized(match_id, confidence_score DESC, created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_odds_comparison ON odds_optimized(match_id, market_type, sportsbook, updated_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_player_recent_stats ON player_stats_optimized(player_name, season, updated_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_team_performance ON team_stats_optimized(team_name, season, wins DESC, losses ASC)",
            
            # Text search optimization (if using PostgreSQL)
            "CREATE INDEX IF NOT EXISTS idx_player_name_search ON player_stats_optimized USING gin(to_tsvector('english', player_name))",
            "CREATE INDEX IF NOT EXISTS idx_team_name_search ON team_stats_optimized USING gin(to_tsvector('english', team_name))",
            
            # Analytical queries optimization
            "CREATE INDEX IF NOT EXISTS idx_bets_analytics ON bets_optimized(user_id, bet_type, status, placed_at, profit_loss)",
            "CREATE INDEX IF NOT EXISTS idx_predictions_accuracy ON predictions_optimized(algorithm_used, historical_accuracy DESC, created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_matches_live_featured ON matches_optimized(status, is_featured, start_time) WHERE status IN ('live', 'scheduled')",
            
            # Time-based partitioning indexes
            "CREATE INDEX IF NOT EXISTS idx_bets_monthly ON bets_optimized(date_trunc('month', placed_at), user_id)",
            "CREATE INDEX IF NOT EXISTS idx_predictions_daily ON predictions_optimized(date_trunc('day', created_at), match_id)",
        ]
        
        with self.engine.begin() as conn:
            for index_sql in performance_indexes:
                try:
                    conn.execute(text(index_sql))
                    logger.debug(f"Created index: {index_sql[:50]}...")
                except Exception as e:
                    # Skip if index already exists or not supported
                    if "already exists" not in str(e).lower():
                        logger.warning(f"Could not create index: {e}")
    
    def _create_performance_views(self):
        """Create database views for common complex queries"""
        views = {
            "user_performance_summary": """
                CREATE OR REPLACE VIEW user_performance_summary AS
                SELECT 
                    u.id as user_id,
                    u.username,
                    u.bankroll,
                    u.total_profit_loss,
                    COUNT(b.id) as total_bets,
                    COUNT(CASE WHEN b.status = 'won' THEN 1 END) as wins,
                    COUNT(CASE WHEN b.status = 'lost' THEN 1 END) as losses,
                    ROUND(
                        COUNT(CASE WHEN b.status = 'won' THEN 1 END) * 100.0 / 
                        NULLIF(COUNT(CASE WHEN b.status IN ('won', 'lost') THEN 1 END), 0), 2
                    ) as win_percentage,
                    SUM(CASE WHEN b.status = 'won' THEN b.profit_loss ELSE 0 END) as total_winnings,
                    SUM(CASE WHEN b.status = 'lost' THEN ABS(b.profit_loss) ELSE 0 END) as total_losses,
                    AVG(b.amount) as avg_bet_amount,
                    MAX(b.placed_at) as last_bet_date
                FROM users_optimized u
                LEFT JOIN bets_optimized b ON u.id = b.user_id
                GROUP BY u.id, u.username, u.bankroll, u.total_profit_loss
            """,
            
            "match_predictions_summary": """
                CREATE OR REPLACE VIEW match_predictions_summary AS
                SELECT 
                    m.id as match_id,
                    m.home_team,
                    m.away_team,
                    m.sport,
                    m.league,
                    m.start_time,
                    m.status,
                    p.confidence_score,
                    p.most_likely_outcome,
                    p.prediction_strength,
                    p.algorithm_used,
                    p.historical_accuracy,
                    COUNT(b.id) as total_bets_on_match,
                    SUM(b.amount) as total_volume
                FROM matches_optimized m
                LEFT JOIN predictions_optimized p ON m.id = p.match_id
                LEFT JOIN bets_optimized b ON m.id = b.match_id
                GROUP BY m.id, m.home_team, m.away_team, m.sport, m.league, 
                         m.start_time, m.status, p.confidence_score, p.most_likely_outcome,
                         p.prediction_strength, p.algorithm_used, p.historical_accuracy
            """,
            
            "odds_comparison_view": """
                CREATE OR REPLACE VIEW odds_comparison_view AS
                SELECT 
                    m.id as match_id,
                    m.home_team,
                    m.away_team,
                    m.start_time,
                    o.market_type,
                    o.sportsbook,
                    o.home_odds,
                    o.away_odds,
                    o.draw_odds,
                    o.spread_value,
                    o.total_value,
                    o.is_best_odds,
                    o.updated_at,
                    ROW_NUMBER() OVER (
                        PARTITION BY m.id, o.market_type 
                        ORDER BY o.updated_at DESC
                    ) as recency_rank
                FROM matches_optimized m
                JOIN odds_optimized o ON m.id = o.match_id
                WHERE m.status IN ('scheduled', 'live')
            """,
            
            "player_performance_trends": """
                CREATE OR REPLACE VIEW player_performance_trends AS
                SELECT 
                    ps.player_name,
                    ps.team,
                    ps.sport,
                    ps.position,
                    ps.season,
                    ps.games_played,
                    ps.injury_status,
                    ps.form_trend,
                    ps.updated_at,
                    LAG(ps.form_trend) OVER (
                        PARTITION BY ps.player_name 
                        ORDER BY ps.updated_at
                    ) as previous_form,
                    COUNT(*) OVER (
                        PARTITION BY ps.player_name
                    ) as total_updates
                FROM player_stats_optimized ps
                ORDER BY ps.player_name, ps.updated_at DESC
            """
        }
        
        with self.engine.begin() as conn:
            for view_name, view_sql in views.items():
                try:
                    conn.execute(text(view_sql))
                    logger.info(f"Created view: {view_name}")
                except Exception as e:
                    logger.warning(f"Could not create view {view_name}: {e}")
    
    def migrate_legacy_data(self):
        """Migrate data from legacy tables to optimized schema"""
        logger.info("Starting legacy data migration...")
        
        migration_queries = self._get_migration_queries()
        
        with self.engine.begin() as conn:
            for table_name, query in migration_queries.items():
                try:
                    logger.info(f"Migrating {table_name}...")
                    result = conn.execute(text(query))
                    logger.info(f"Migrated {result.rowcount} rows to {table_name}")
                except Exception as e:
                    logger.error(f"Failed to migrate {table_name}: {e}")
        
        logger.info("Legacy data migration completed")
    
    def _get_migration_queries(self) -> Dict[str, str]:
        """Get SQL queries for migrating legacy data"""
        return {
            "users_optimized": """
                INSERT INTO users_optimized (
                    id, username, email, hashed_password, api_key_encrypted,
                    first_name, last_name, is_active, is_verified, risk_tolerance,
                    preferred_stake, settings, created_at, updated_at, last_login
                )
                SELECT 
                    id, username, email, hashed_password, api_key_encrypted,
                    first_name, last_name, 
                    CASE WHEN is_active = 1 THEN true ELSE false END,
                    CASE WHEN is_verified = 1 THEN true ELSE false END,
                    COALESCE(risk_tolerance, 'moderate'),
                    COALESCE(preferred_stake, 50.0),
                    COALESCE(settings, '{}'),
                    created_at, updated_at, last_login
                FROM users
                WHERE NOT EXISTS (
                    SELECT 1 FROM users_optimized WHERE users_optimized.id = users.id
                )
            """,
            
            "matches_optimized": """
                INSERT INTO matches_optimized (
                    id, home_team, away_team, sport, league, season, week,
                    start_time, end_time, status, home_score, away_score,
                    venue, sportsradar_id, the_odds_api_id, is_featured,
                    has_live_odds, created_at, updated_at
                )
                SELECT 
                    id, home_team, away_team, sport, league, season, week,
                    start_time, end_time, COALESCE(status, 'scheduled'),
                    home_score, away_score, venue, sportsradar_id, the_odds_api_id,
                    COALESCE(is_featured, false), COALESCE(has_live_odds, false),
                    created_at, updated_at
                FROM matches
                WHERE NOT EXISTS (
                    SELECT 1 FROM matches_optimized WHERE matches_optimized.id = matches.id
                )
            """,
            
            "predictions_optimized": """
                INSERT INTO predictions_optimized (
                    id, match_id, home_win_probability, away_win_probability,
                    draw_probability, confidence_score, over_under_prediction,
                    spread_prediction, total_score_prediction, model_version,
                    algorithm_used, historical_accuracy, created_at, updated_at
                )
                SELECT 
                    id, match_id, home_win_probability, away_win_probability,
                    COALESCE(draw_probability, 0.0), confidence_score,
                    over_under_prediction, spread_prediction, total_score_prediction,
                    COALESCE(model_version, 'v1.0.0'), 
                    COALESCE(algorithm_used, 'ensemble'),
                    COALESCE(historical_accuracy, 0.0),
                    created_at, updated_at
                FROM predictions
                WHERE NOT EXISTS (
                    SELECT 1 FROM predictions_optimized WHERE predictions_optimized.id = predictions.id
                )
            """,
            
            "bets_optimized": """
                INSERT INTO bets_optimized (
                    id, user_id, match_id, amount, odds, bet_type, selection,
                    potential_winnings, status, sportsbook, placed_at, settled_at,
                    created_at, updated_at
                )
                SELECT 
                    id, user_id, match_id, amount, odds, bet_type, selection,
                    potential_winnings, COALESCE(status, 'pending'),
                    'unknown' as sportsbook, placed_at, settled_at,
                    created_at, updated_at
                FROM bets
                WHERE NOT EXISTS (
                    SELECT 1 FROM bets_optimized WHERE bets_optimized.id = bets.id
                )
            """
        }
    
    def analyze_performance(self) -> Dict[str, Any]:
        """Analyze database performance and provide optimization recommendations"""
        performance_analysis = {
            "table_sizes": {},
            "index_usage": {},
            "slow_queries": [],
            "recommendations": []
        }
        
        with self.engine.begin() as conn:
            # Analyze table sizes
            try:
                result = conn.execute(text("""
                    SELECT 
                        schemaname,
                        tablename,
                        attname,
                        n_distinct,
                        correlation
                    FROM pg_stats 
                    WHERE schemaname = 'public' 
                    AND tablename LIKE '%_optimized'
                    ORDER BY tablename, attname
                """))
                
                for row in result:
                    table = row.tablename
                    if table not in performance_analysis["table_sizes"]:
                        performance_analysis["table_sizes"][table] = {}
                    performance_analysis["table_sizes"][table][row.attname] = {
                        "n_distinct": row.n_distinct,
                        "correlation": row.correlation
                    }
                    
            except Exception as e:
                logger.warning(f"Could not analyze table statistics: {e}")
            
            # Check index usage
            try:
                result = conn.execute(text("""
                    SELECT 
                        schemaname,
                        tablename,
                        indexname,
                        idx_tup_read,
                        idx_tup_fetch
                    FROM pg_stat_user_indexes 
                    WHERE schemaname = 'public'
                    AND tablename LIKE '%_optimized'
                    ORDER BY idx_tup_read DESC
                """))
                
                for row in result:
                    performance_analysis["index_usage"][row.indexname] = {
                        "table": row.tablename,
                        "reads": row.idx_tup_read,
                        "fetches": row.idx_tup_fetch
                    }
                    
            except Exception as e:
                logger.warning(f"Could not analyze index usage: {e}")
        
        # Generate recommendations
        self._generate_performance_recommendations(performance_analysis)
        
        return performance_analysis
    
    def _generate_performance_recommendations(self, analysis: Dict[str, Any]):
        """Generate performance optimization recommendations"""
        recommendations = []
        
        # Check for unused indexes
        for index_name, stats in analysis["index_usage"].items():
            if stats["reads"] == 0:
                recommendations.append(f"Consider removing unused index: {index_name}")
        
        # Check for tables with high cardinality that might benefit from partitioning
        for table, columns in analysis["table_sizes"].items():
            for column, stats in columns.items():
                if column in ["placed_at", "created_at"] and stats["n_distinct"] > 10000:
                    recommendations.append(f"Consider partitioning {table} by {column}")
        
        analysis["recommendations"] = recommendations
    
    def create_partitions(self):
        """Create table partitions for large tables"""
        partitioning_queries = [
            # Partition bets by month
            """
            CREATE TABLE IF NOT EXISTS bets_optimized_y2024m01 
            PARTITION OF bets_optimized 
            FOR VALUES FROM ('2024-01-01') TO ('2024-02-01')
            """,
            
            # Partition predictions by month  
            """
            CREATE TABLE IF NOT EXISTS predictions_optimized_y2024m01
            PARTITION OF predictions_optimized
            FOR VALUES FROM ('2024-01-01') TO ('2024-02-01')
            """
        ]
        
        with self.engine.begin() as conn:
            for query in partitioning_queries:
                try:
                    conn.execute(text(query))
                    logger.info("Created partition")
                except Exception as e:
                    logger.warning(f"Could not create partition: {e}")
    
    def optimize_database(self):
        """Run comprehensive database optimization"""
        optimization_commands = [
            "VACUUM ANALYZE users_optimized",
            "VACUUM ANALYZE matches_optimized", 
            "VACUUM ANALYZE predictions_optimized",
            "VACUUM ANALYZE bets_optimized",
            "VACUUM ANALYZE odds_optimized",
            "REINDEX INDEX CONCURRENTLY idx_user_lookup",
            "REINDEX INDEX CONCURRENTLY idx_match_teams",
            "REINDEX INDEX CONCURRENTLY idx_prediction_match_user"
        ]
        
        with self.engine.begin() as conn:
            for command in optimization_commands:
                try:
                    conn.execute(text(command))
                    logger.info(f"Executed: {command}")
                except Exception as e:
                    logger.warning(f"Could not execute {command}: {e}")
    
    def get_schema_info(self) -> Dict[str, Any]:
        """Get comprehensive schema information"""
        inspector = inspect(self.engine)
        
        schema_info = {
            "tables": {},
            "indexes": {},
            "foreign_keys": {},
            "total_tables": 0,
            "total_indexes": 0
        }
        
        tables = inspector.get_table_names()
        optimized_tables = [t for t in tables if t.endswith('_optimized')]
        
        for table in optimized_tables:
            schema_info["tables"][table] = {
                "columns": len(inspector.get_columns(table)),
                "indexes": len(inspector.get_indexes(table)),
                "foreign_keys": len(inspector.get_foreign_keys(table))
            }
            
            schema_info["total_tables"] += 1
            schema_info["total_indexes"] += len(inspector.get_indexes(table))
        
        return schema_info


# Global schema manager instance
schema_manager = None

def get_schema_manager(database_url: str) -> SchemaManager:
    """Get or create global schema manager instance"""
    global schema_manager
    if schema_manager is None:
        schema_manager = SchemaManager(database_url)
        schema_manager.initialize()
    return schema_manager
