"""Add provider_states and portfolio_rationales tables

Revision ID: c1234567890
Revises: b1573a5e9618
Create Date: 2025-08-17 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1234567890'
down_revision: Union[str, Sequence[str], None] = 'b1573a5e9618'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create provider_states table
    op.create_table('provider_states',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('provider_name', sa.String(100), nullable=False),
        sa.Column('sport', sa.String(20), nullable=False, default='NBA'),
        sa.Column('status', sa.Enum('ACTIVE', 'INACTIVE', 'ERROR', 'MAINTENANCE', name='providerstatus'), nullable=False),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, default=True),
        sa.Column('poll_interval_seconds', sa.Integer(), nullable=False, default=60),
        sa.Column('timeout_seconds', sa.Integer(), nullable=False, default=30),
        sa.Column('max_retries', sa.Integer(), nullable=False, default=3),
        sa.Column('last_fetch_attempt', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_successful_fetch', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.Column('consecutive_errors', sa.Integer(), nullable=False, default=0),
        sa.Column('total_requests', sa.Integer(), nullable=False, default=0),
        sa.Column('successful_requests', sa.Integer(), nullable=False, default=0),
        sa.Column('failed_requests', sa.Integer(), nullable=False, default=0),
        sa.Column('average_response_time_ms', sa.Float(), nullable=True),
        sa.Column('total_props_fetched', sa.Integer(), nullable=False, default=0),
        sa.Column('unique_props_seen', sa.Integer(), nullable=False, default=0),
        sa.Column('last_prop_count', sa.Integer(), nullable=True),
        sa.Column('capabilities', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for provider_states
    op.create_index('ix_provider_states_provider_name', 'provider_states', ['provider_name'])
    op.create_index('ix_provider_states_sport', 'provider_states', ['sport'])
    op.create_index('ix_provider_states_sport_provider', 'provider_states', ['sport', 'provider_name'])
    op.create_index('ix_provider_states_sport_status', 'provider_states', ['sport', 'status'])
    
    # Create portfolio_rationales table
    op.create_table('portfolio_rationales',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('request_id', sa.String(100), nullable=False),
        sa.Column('rationale_type', sa.Enum('PORTFOLIO_SUMMARY', 'BET_SELECTION', 'RISK_ANALYSIS', 'MARKET_INSIGHTS', 'PERFORMANCE_REVIEW', name='rationaletype'), nullable=False),
        sa.Column('portfolio_data_hash', sa.String(64), nullable=False),
        sa.Column('portfolio_data', sa.JSON(), nullable=False),
        sa.Column('context_data', sa.JSON(), nullable=True),
        sa.Column('user_preferences', sa.JSON(), nullable=True),
        sa.Column('narrative', sa.Text(), nullable=False),
        sa.Column('key_points', sa.JSON(), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('generation_time_ms', sa.Integer(), nullable=False),
        sa.Column('model_info', sa.JSON(), nullable=False),
        sa.Column('prompt_tokens', sa.Integer(), nullable=True),
        sa.Column('completion_tokens', sa.Integer(), nullable=True),
        sa.Column('total_cost', sa.Float(), nullable=True),
        sa.Column('user_rating', sa.Integer(), nullable=True),
        sa.Column('user_feedback', sa.Text(), nullable=True),
        sa.Column('is_flagged', sa.Boolean(), nullable=False, default=False),
        sa.Column('cache_hits', sa.Integer(), nullable=False, default=1),
        sa.Column('last_accessed', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('request_id')
    )
    
    # Create indexes for portfolio_rationales
    op.create_index('ix_portfolio_rationales_request_id', 'portfolio_rationales', ['request_id'])
    op.create_index('ix_portfolio_rationales_rationale_type', 'portfolio_rationales', ['rationale_type'])
    op.create_index('ix_portfolio_rationales_portfolio_data_hash', 'portfolio_rationales', ['portfolio_data_hash'])
    op.create_index('ix_rationale_type_hash', 'portfolio_rationales', ['rationale_type', 'portfolio_data_hash'])
    op.create_index('ix_rationale_expires_at', 'portfolio_rationales', ['expires_at'])
    op.create_index('ix_rationale_created_at', 'portfolio_rationales', ['created_at'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop portfolio_rationales table and indexes
    op.drop_index('ix_rationale_created_at', table_name='portfolio_rationales')
    op.drop_index('ix_rationale_expires_at', table_name='portfolio_rationales') 
    op.drop_index('ix_rationale_type_hash', table_name='portfolio_rationales')
    op.drop_index('ix_portfolio_rationales_portfolio_data_hash', table_name='portfolio_rationales')
    op.drop_index('ix_portfolio_rationales_rationale_type', table_name='portfolio_rationales')
    op.drop_index('ix_portfolio_rationales_request_id', table_name='portfolio_rationales')
    op.drop_table('portfolio_rationales')
    
    # Drop provider_states table and indexes
    op.drop_index('ix_provider_states_sport_status', table_name='provider_states')
    op.drop_index('ix_provider_states_sport_provider', table_name='provider_states')
    op.drop_index('ix_provider_states_sport', table_name='provider_states')
    op.drop_index('ix_provider_states_provider_name', table_name='provider_states')
    op.drop_table('provider_states')
    
    # Drop custom enums
    op.execute("DROP TYPE IF EXISTS providerstatus")
    op.execute("DROP TYPE IF EXISTS rationaletype")