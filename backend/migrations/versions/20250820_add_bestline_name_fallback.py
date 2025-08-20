"""
Add fallback bookmaker name columns to BestLineAggregate

Revision ID: 20250820_add_bestline_name_fallback
Revises: <set_later>
Create Date: 2025-08-20 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250820_add_bestline_name_fallback'
down_revision = '20250820_add_best_line_aggregate'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('best_line_aggregates', sa.Column('best_over_bookmaker_name', sa.String(length=255), nullable=True))
    op.add_column('best_line_aggregates', sa.Column('best_under_bookmaker_name', sa.String(length=255), nullable=True))


def downgrade():
    op.drop_column('best_line_aggregates', 'best_under_bookmaker_name')
    op.drop_column('best_line_aggregates', 'best_over_bookmaker_name')
