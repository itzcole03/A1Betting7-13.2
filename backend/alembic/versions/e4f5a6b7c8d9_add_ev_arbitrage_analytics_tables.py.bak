"""add_ev_arbitrage_analytics_tables

Revision ID: e4f5a6b7c8d9
Revises: c1234567890
Create Date: 2025-09-06 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e4f5a6b7c8d9'
down_revision: Union[str, Sequence[str], None] = 'c1234567890'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - add EV and arbitrage analytics tables."""
    
    # Create ev_opportunity_history table
    op.create_table(
        'ev_opportunity_history',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('opp_hash', sa.String(length=64), nullable=False),
        sa.Column('sport', sa.String(length=10), nullable=False),
        sa.Column('player', sa.String(length=100), nullable=False),
        sa.Column('market', sa.String(length=50), nullable=False),
        sa.Column('ev_percent', sa.Float(), nullable=False),
        sa.Column('ev_tier', sa.String(length=20), nullable=False),
        sa.Column('detected_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('line', sa.Float(), nullable=True),
        sa.Column('odds', sa.Integer(), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('bookmaker', sa.String(length=50), nullable=True),
        sa.Column('team', sa.String(length=50), nullable=True),
        sa.Column('opponent', sa.String(length=50), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for ev_opportunity_history
    op.create_index('idx_ev_hist_sport_date', 'ev_opportunity_history', ['sport', 'detected_at'])
    op.create_index('idx_ev_hist_tier_date', 'ev_opportunity_history', ['ev_tier', 'detected_at'])
    op.create_index('idx_ev_hist_player_date', 'ev_opportunity_history', ['player', 'detected_at'])
    op.create_index('idx_ev_hist_ev_pct', 'ev_opportunity_history', ['ev_percent'])
    op.create_index(op.f('ix_ev_opportunity_history_opp_hash'), 'ev_opportunity_history', ['opp_hash'])
    op.create_index(op.f('ix_ev_opportunity_history_sport'), 'ev_opportunity_history', ['sport'])
    op.create_index(op.f('ix_ev_opportunity_history_player'), 'ev_opportunity_history', ['player'])
    op.create_index(op.f('ix_ev_opportunity_history_market'), 'ev_opportunity_history', ['market'])
    op.create_index(op.f('ix_ev_opportunity_history_ev_percent'), 'ev_opportunity_history', ['ev_percent'])
    op.create_index(op.f('ix_ev_opportunity_history_ev_tier'), 'ev_opportunity_history', ['ev_tier'])
    op.create_index(op.f('ix_ev_opportunity_history_detected_at'), 'ev_opportunity_history', ['detected_at'])
    
    # Create arbitrage_history table
    op.create_table(
        'arbitrage_history',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('arb_hash', sa.String(length=64), nullable=False),
        sa.Column('sport', sa.String(length=10), nullable=False),
        sa.Column('market', sa.String(length=50), nullable=False),
        sa.Column('profit_pct', sa.Float(), nullable=False),
        sa.Column('books_json', sa.Text(), nullable=False),
        sa.Column('detected_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('player', sa.String(length=100), nullable=True),
        sa.Column('line', sa.Float(), nullable=True),
        sa.Column('total_stake_required', sa.Float(), nullable=True),
        sa.Column('num_bookmakers', sa.Integer(), nullable=False, default=2),
        sa.Column('team', sa.String(length=50), nullable=True),
        sa.Column('opponent', sa.String(length=50), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for arbitrage_history
    op.create_index('idx_arb_hist_sport_date', 'arbitrage_history', ['sport', 'detected_at'])
    op.create_index('idx_arb_hist_profit_date', 'arbitrage_history', ['profit_pct', 'detected_at'])
    op.create_index('idx_arb_hist_player_date', 'arbitrage_history', ['player', 'detected_at'])
    op.create_index('idx_arb_hist_profit_pct', 'arbitrage_history', ['profit_pct'])
    op.create_index(op.f('ix_arbitrage_history_arb_hash'), 'arbitrage_history', ['arb_hash'])
    op.create_index(op.f('ix_arbitrage_history_sport'), 'arbitrage_history', ['sport'])
    op.create_index(op.f('ix_arbitrage_history_market'), 'arbitrage_history', ['market'])
    op.create_index(op.f('ix_arbitrage_history_profit_pct'), 'arbitrage_history', ['profit_pct'])
    op.create_index(op.f('ix_arbitrage_history_detected_at'), 'arbitrage_history', ['detected_at'])
    op.create_index(op.f('ix_arbitrage_history_player'), 'arbitrage_history', ['player'])


def downgrade() -> None:
    """Downgrade schema - remove EV and arbitrage analytics tables."""
    
    # Drop arbitrage_history table and indexes
    op.drop_index(op.f('ix_arbitrage_history_player'), table_name='arbitrage_history')
    op.drop_index(op.f('ix_arbitrage_history_detected_at'), table_name='arbitrage_history')
    op.drop_index(op.f('ix_arbitrage_history_profit_pct'), table_name='arbitrage_history')
    op.drop_index(op.f('ix_arbitrage_history_market'), table_name='arbitrage_history')
    op.drop_index(op.f('ix_arbitrage_history_sport'), table_name='arbitrage_history')
    op.drop_index(op.f('ix_arbitrage_history_arb_hash'), table_name='arbitrage_history')
    op.drop_index('idx_arb_hist_profit_pct', table_name='arbitrage_history')
    op.drop_index('idx_arb_hist_player_date', table_name='arbitrage_history')
    op.drop_index('idx_arb_hist_profit_date', table_name='arbitrage_history')
    op.drop_index('idx_arb_hist_sport_date', table_name='arbitrage_history')
    op.drop_table('arbitrage_history')
    
    # Drop ev_opportunity_history table and indexes  
    op.drop_index(op.f('ix_ev_opportunity_history_detected_at'), table_name='ev_opportunity_history')
    op.drop_index(op.f('ix_ev_opportunity_history_ev_tier'), table_name='ev_opportunity_history')
    op.drop_index(op.f('ix_ev_opportunity_history_ev_percent'), table_name='ev_opportunity_history')
    op.drop_index(op.f('ix_ev_opportunity_history_market'), table_name='ev_opportunity_history')
    op.drop_index(op.f('ix_ev_opportunity_history_player'), table_name='ev_opportunity_history')
    op.drop_index(op.f('ix_ev_opportunity_history_sport'), table_name='ev_opportunity_history')
    op.drop_index(op.f('ix_ev_opportunity_history_opp_hash'), table_name='ev_opportunity_history')
    op.drop_index('idx_ev_hist_ev_pct', table_name='ev_opportunity_history')
    op.drop_index('idx_ev_hist_player_date', table_name='ev_opportunity_history')
    op.drop_index('idx_ev_hist_tier_date', table_name='ev_opportunity_history')
    op.drop_index('idx_ev_hist_sport_date', table_name='ev_opportunity_history')
    op.drop_table('ev_opportunity_history')