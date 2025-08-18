"""Add sport columns and provider state enhancements

Revision ID: 20250818_add_sport_columns
Revises: b1573a5e9618
Create Date: 2025-08-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20250818_add_sport_columns'
down_revision: Union[str, Sequence[str], None] = 'b1573a5e9618'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema to add sport dimension support"""
    
    # Add sport columns to core tables (with defaults for backward compatibility)
    
    # Props table - core prop data needs sport dimension
    try:
        op.add_column('props', sa.Column('sport', sa.String(10), nullable=True))
        op.execute("UPDATE props SET sport = 'NBA' WHERE sport IS NULL")
        op.alter_column('props', 'sport', nullable=False)
        op.create_index('idx_props_sport', 'props', ['sport'])
        op.create_index('idx_props_sport_prop_type', 'props', ['sport', 'prop_type'])
    except Exception as e:
        print(f"Props table sport column likely already exists: {e}")
    
    # Market quotes table - denormalized sport for faster queries
    try:
        op.add_column('market_quotes', sa.Column('sport', sa.String(10), nullable=True))
        op.execute("UPDATE market_quotes SET sport = 'NBA' WHERE sport IS NULL")
        op.alter_column('market_quotes', 'sport', nullable=False)
        op.create_index('idx_market_quotes_sport', 'market_quotes', ['sport'])
        op.create_index('idx_market_quotes_sport_timestamp', 'market_quotes', ['sport', 'timestamp'])
    except Exception as e:
        print(f"Market quotes table sport column likely already exists: {e}")
    
    # Edges table - critical for sport isolation in edge detection
    try:
        op.add_column('edges', sa.Column('sport', sa.String(10), nullable=True))
        op.execute("UPDATE edges SET sport = 'NBA' WHERE sport IS NULL")
        op.alter_column('edges', 'sport', nullable=False) 
        op.create_index('idx_edges_sport', 'edges', ['sport'])
        op.create_index('idx_edges_sport_status', 'edges', ['sport', 'status'])
        op.create_index('idx_edges_sport_score', 'edges', ['sport', 'edge_score'])
    except Exception as e:
        print(f"Edges table sport column likely already exists: {e}")
        
    # Valuations table - sport-aware valuations
    try:
        op.add_column('valuations', sa.Column('sport', sa.String(10), nullable=True))
        op.execute("UPDATE valuations SET sport = 'NBA' WHERE sport IS NULL")
        op.alter_column('valuations', 'sport', nullable=False)
        op.create_index('idx_valuations_sport', 'valuations', ['sport'])
        op.create_index('idx_valuations_sport_prop', 'valuations', ['sport', 'prop_id'])
    except Exception as e:
        print(f"Valuations table sport column likely already exists: {e}")
    
    # Model predictions table - model predictions per sport
    try:
        op.add_column('model_predictions', sa.Column('sport', sa.String(10), nullable=True))
        op.execute("UPDATE model_predictions SET sport = 'NBA' WHERE sport IS NULL")
        op.alter_column('model_predictions', 'sport', nullable=False)
        op.create_index('idx_model_predictions_sport', 'model_predictions', ['sport'])
        op.create_index('idx_model_predictions_sport_type', 'model_predictions', ['sport', 'prop_type'])
    except Exception as e:
        print(f"Model predictions table sport column likely already exists: {e}")
    
    # Provider states table enhancement - support multi-sport provider capabilities
    try:
        op.create_table('provider_states',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('provider_name', sa.String(100), nullable=False),
            sa.Column('sport', sa.String(10), nullable=False),
            sa.Column('enabled', sa.Boolean(), nullable=False, default=True),
            sa.Column('healthy', sa.Boolean(), nullable=False, default=False),
            sa.Column('last_health_check', sa.DateTime(timezone=True), nullable=True),
            sa.Column('last_fetch_timestamp', sa.DateTime(timezone=True), nullable=True),
            sa.Column('supported_sports', sa.JSON(), nullable=True),  # List of sports this provider supports
            sa.Column('capability_flags', sa.JSON(), nullable=True),  # Provider-specific capabilities
            sa.Column('configuration', sa.JSON(), nullable=True),     # Provider-specific config
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('provider_name', 'sport', name='uq_provider_sport')
        )
        op.create_index('idx_provider_states_sport', 'provider_states', ['sport'])
        op.create_index('idx_provider_states_enabled', 'provider_states', ['enabled'])
        op.create_index('idx_provider_states_healthy', 'provider_states', ['healthy'])
        op.create_index('idx_provider_states_name_sport', 'provider_states', ['provider_name', 'sport'])
    except Exception as e:
        print(f"Provider states table likely already exists: {e}")
    
    # Ticket legs table - ensure sport awareness for cross-sport portfolios
    try:
        op.add_column('ticket_legs', sa.Column('sport', sa.String(10), nullable=True))
        op.execute("UPDATE ticket_legs SET sport = 'NBA' WHERE sport IS NULL")
        op.alter_column('ticket_legs', 'sport', nullable=False)
        op.create_index('idx_ticket_legs_sport', 'ticket_legs', ['sport'])
        op.create_index('idx_ticket_legs_ticket_sport', 'ticket_legs', ['ticket_id', 'sport'])
    except Exception as e:
        print(f"Ticket legs table sport column likely already exists: {e}")
    
    # Optimization runs table - sport-aware portfolio optimization
    try:
        op.add_column('optimization_runs', sa.Column('sport', sa.String(10), nullable=True))
        op.execute("UPDATE optimization_runs SET sport = 'NBA' WHERE sport IS NULL")
        op.alter_column('optimization_runs', 'sport', nullable=False)
        op.create_index('idx_optimization_runs_sport', 'optimization_runs', ['sport'])
        op.create_index('idx_optimization_runs_sport_status', 'optimization_runs', ['sport', 'status'])
    except Exception as e:
        print(f"Optimization runs table sport column likely already exists: {e}")
        
    # Historical prop outcomes table - sport dimension for historical analysis
    try:
        op.add_column('historical_prop_outcomes', sa.Column('sport', sa.String(10), nullable=True))
        op.execute("UPDATE historical_prop_outcomes SET sport = 'NBA' WHERE sport IS NULL")
        op.alter_column('historical_prop_outcomes', 'sport', nullable=False)
        op.create_index('idx_historical_outcomes_sport', 'historical_prop_outcomes', ['sport'])
        op.create_index('idx_historical_outcomes_sport_date', 'historical_prop_outcomes', ['sport', 'event_date'])
    except Exception as e:
        print(f"Historical prop outcomes table sport column likely already exists: {e}")
    
    # Create composite indexes for performance optimization
    try:
        # Multi-column indexes for common query patterns
        op.create_index('idx_props_sport_player_type', 'props', ['sport', 'player_id', 'prop_type'])
        op.create_index('idx_edges_sport_prop_status', 'edges', ['sport', 'prop_id', 'status'])
        op.create_index('idx_valuations_sport_created', 'valuations', ['sport', 'created_at'])
    except Exception as e:
        print(f"Composite indexes creation failed (may already exist): {e}")


def downgrade() -> None:
    """Downgrade schema to remove sport dimension support"""
    
    # Remove sport columns and related indexes
    
    # Drop composite indexes
    try:
        op.drop_index('idx_props_sport_player_type', table_name='props')
        op.drop_index('idx_edges_sport_prop_status', table_name='edges')
        op.drop_index('idx_valuations_sport_created', table_name='valuations')
    except Exception:
        pass
    
    # Props table
    try:
        op.drop_index('idx_props_sport_prop_type', table_name='props')
        op.drop_index('idx_props_sport', table_name='props')
        op.drop_column('props', 'sport')
    except Exception:
        pass
    
    # Market quotes table
    try:
        op.drop_index('idx_market_quotes_sport_timestamp', table_name='market_quotes')
        op.drop_index('idx_market_quotes_sport', table_name='market_quotes')
        op.drop_column('market_quotes', 'sport')
    except Exception:
        pass
    
    # Edges table
    try:
        op.drop_index('idx_edges_sport_score', table_name='edges')
        op.drop_index('idx_edges_sport_status', table_name='edges')
        op.drop_index('idx_edges_sport', table_name='edges')
        op.drop_column('edges', 'sport')
    except Exception:
        pass
        
    # Valuations table
    try:
        op.drop_index('idx_valuations_sport_prop', table_name='valuations')
        op.drop_index('idx_valuations_sport', table_name='valuations')
        op.drop_column('valuations', 'sport')
    except Exception:
        pass
    
    # Model predictions table
    try:
        op.drop_index('idx_model_predictions_sport_type', table_name='model_predictions')
        op.drop_index('idx_model_predictions_sport', table_name='model_predictions')
        op.drop_column('model_predictions', 'sport')
    except Exception:
        pass
    
    # Provider states table
    try:
        op.drop_table('provider_states')
    except Exception:
        pass
    
    # Ticket legs table
    try:
        op.drop_index('idx_ticket_legs_ticket_sport', table_name='ticket_legs')
        op.drop_index('idx_ticket_legs_sport', table_name='ticket_legs')
        op.drop_column('ticket_legs', 'sport')
    except Exception:
        pass
    
    # Optimization runs table
    try:
        op.drop_index('idx_optimization_runs_sport_status', table_name='optimization_runs')
        op.drop_index('idx_optimization_runs_sport', table_name='optimization_runs')
        op.drop_column('optimization_runs', 'sport')
    except Exception:
        pass
        
    # Historical prop outcomes table
    try:
        op.drop_index('idx_historical_outcomes_sport_date', table_name='historical_prop_outcomes')
        op.drop_index('idx_historical_outcomes_sport', table_name='historical_prop_outcomes')
        op.drop_column('historical_prop_outcomes', 'sport')
    except Exception:
        pass