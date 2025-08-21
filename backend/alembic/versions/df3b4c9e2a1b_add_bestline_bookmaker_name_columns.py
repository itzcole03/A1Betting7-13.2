"""add bestline bookmaker name columns

Revision ID: df3b4c9e2a1b
Revises: 9beb31b07eb3
Create Date: 2025-08-20 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'df3b4c9e2a1b'
down_revision = '9beb31b07eb3'
branch_labels = None
depends_on = None


def _has_column(table_name: str, column_name: str, conn) -> bool:
    insp = sa.inspect(conn)
    cols = [c['name'] for c in insp.get_columns(table_name)]
    return column_name in cols


def upgrade():
    conn = op.get_bind()
    # Add columns if they do not exist. SQLite supports adding nullable columns.
    if not _has_column('best_line_aggregates', 'best_over_bookmaker_name', conn):
        op.add_column('best_line_aggregates', sa.Column('best_over_bookmaker_name', sa.String(length=255), nullable=True))

    if not _has_column('best_line_aggregates', 'best_under_bookmaker_name', conn):
        op.add_column('best_line_aggregates', sa.Column('best_under_bookmaker_name', sa.String(length=255), nullable=True))


def downgrade():
    conn = op.get_bind()
    # Drop columns if they exist
    if _has_column('best_line_aggregates', 'best_over_bookmaker_name', conn):
        op.drop_column('best_line_aggregates', 'best_over_bookmaker_name')

    if _has_column('best_line_aggregates', 'best_under_bookmaker_name', conn):
        op.drop_column('best_line_aggregates', 'best_under_bookmaker_name')
