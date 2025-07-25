"""Unified Base for Match and historical models

Revision ID: a488fec67a2b
Revises: 079780825cba
Create Date: 2025-07-15 17:29:48.064448

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a488fec67a2b'
down_revision: Union[str, Sequence[str], None] = '079780825cba'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('casinos',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('key', sa.String(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('key')
    )
    op.create_table('matches',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('home_team', sa.String(), nullable=False),
    sa.Column('away_team', sa.String(), nullable=False),
    sa.Column('sport', sa.String(), nullable=False),
    sa.Column('league', sa.String(), nullable=False),
    sa.Column('season', sa.String(), nullable=True),
    sa.Column('week', sa.Integer(), nullable=True),
    sa.Column('start_time', sa.DateTime(), nullable=False),
    sa.Column('end_time', sa.DateTime(), nullable=True),
    sa.Column('status', sa.String(), nullable=True),
    sa.Column('home_score', sa.Integer(), nullable=True),
    sa.Column('away_score', sa.Integer(), nullable=True),
    sa.Column('venue', sa.String(), nullable=True),
    sa.Column('weather_conditions', sa.String(), nullable=True),
    sa.Column('temperature', sa.Float(), nullable=True),
    sa.Column('external_id', sa.String(), nullable=True),
    sa.Column('sportsradar_id', sa.String(), nullable=True),
    sa.Column('the_odds_api_id', sa.String(), nullable=True),
    sa.Column('is_featured', sa.Boolean(), nullable=True),
    sa.Column('has_live_odds', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_matches_id'), 'matches', ['id'], unique=False)
    op.create_table('game_spreads',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('match_id', sa.Integer(), nullable=True),
    sa.Column('casino_id', sa.Integer(), nullable=True),
    sa.Column('spread', sa.Numeric(precision=4, scale=1), nullable=True),
    sa.Column('home_team_line', sa.Numeric(precision=5, scale=2), nullable=True),
    sa.Column('away_team_line', sa.Numeric(precision=5, scale=2), nullable=True),
    sa.Column('update_time', sa.TIMESTAMP(), nullable=True),
    sa.ForeignKeyConstraint(['casino_id'], ['casinos.id'], ),
    sa.ForeignKeyConstraint(['match_id'], ['matches.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('scores',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('match_id', sa.Integer(), nullable=True),
    sa.Column('home_score', sa.Integer(), nullable=True),
    sa.Column('away_score', sa.Integer(), nullable=True),
    sa.Column('update_time', sa.TIMESTAMP(), nullable=True),
    sa.ForeignKeyConstraint(['match_id'], ['matches.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('scores')
    op.drop_table('game_spreads')
    op.drop_index(op.f('ix_matches_id'), table_name='matches')
    op.drop_table('matches')
    op.drop_table('casinos')
    # ### end Alembic commands ###
