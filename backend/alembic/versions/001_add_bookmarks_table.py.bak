"""Add bookmarks table for Phase 4.2

Revision ID: 001_add_bookmarks_table
Revises: 
Create Date: 2025-08-20 04:48:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '001_add_bookmarks_table'
down_revision = None
depends_on = None


def upgrade():
    """Add bookmarks table"""
    op.create_table(
        'bookmarks',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('prop_id', sa.String(), nullable=False),
        sa.Column('sport', sa.String(length=20), nullable=False),
        sa.Column('player', sa.String(length=100), nullable=False),
        sa.Column('market', sa.String(length=50), nullable=False),
        sa.Column('team', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'prop_id', name='uq_user_prop_bookmark')
    )
    
    # Create indexes for performance
    op.create_index(op.f('ix_bookmarks_user_id'), 'bookmarks', ['user_id'])
    op.create_index(op.f('ix_bookmarks_prop_id'), 'bookmarks', ['prop_id'])
    op.create_index(op.f('ix_bookmarks_sport'), 'bookmarks', ['sport'])


def downgrade():
    """Remove bookmarks table"""
    op.drop_index(op.f('ix_bookmarks_sport'), table_name='bookmarks')
    op.drop_index(op.f('ix_bookmarks_prop_id'), table_name='bookmarks')
    op.drop_index(op.f('ix_bookmarks_user_id'), table_name='bookmarks')
    op.drop_table('bookmarks')