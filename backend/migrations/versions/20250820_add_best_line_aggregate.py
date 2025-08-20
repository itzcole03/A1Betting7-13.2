"""Add BestLineAggregate table

Revision ID: 20250820_add_best_line_aggregate
Revises: None
Create Date: 2025-08-20
"""
from alembic import op
import sqlalchemy as sa

revision = '20250820_add_best_line_aggregate'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'best_line_aggregates',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('prop_id', sa.String(200), nullable=False, unique=True),
        sa.Column('sport', sa.String(20), nullable=False),
        sa.Column('best_over_odds', sa.Integer, nullable=True),
        sa.Column('best_over_bookmaker_id', sa.Integer, sa.ForeignKey('bookmakers.id'), nullable=True),
        sa.Column('best_under_odds', sa.Integer, nullable=True),
        sa.Column('best_under_bookmaker_id', sa.Integer, sa.ForeignKey('bookmakers.id'), nullable=True),
        sa.Column('consensus_line', sa.Float, nullable=True),
        sa.Column('consensus_over_prob', sa.Float, nullable=True),
        sa.Column('consensus_under_prob', sa.Float, nullable=True),
        sa.Column('num_bookmakers', sa.Integer, nullable=False, server_default='0'),
        sa.Column('line_spread', sa.Float, nullable=True),
        sa.Column('odds_spread_over', sa.Integer, nullable=True),
        sa.Column('odds_spread_under', sa.Integer, nullable=True),
        sa.Column('arbitrage_opportunity', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('arbitrage_profit_pct', sa.Float, nullable=True),
        sa.Column('last_updated', sa.DateTime, nullable=True),
        sa.Column('data_age_minutes', sa.Integer, nullable=True),
    )


def downgrade():
    op.drop_table('best_line_aggregates')
