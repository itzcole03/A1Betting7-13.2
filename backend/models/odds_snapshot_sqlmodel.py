"""
SQLModel Odds Snapshot (MVP)

Purpose: lightweight persistence for odds snapshots with minute-level dedupe.

Fields kept intentionally minimal to avoid coupling. This model coexists with
SQLAlchemy models under backend/models/odds.py and uses SQLModel metadata
so it integrates with the existing database helpers in backend/database.py.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class OddsSnapshotRecord(SQLModel, table=True):
    """Odds snapshot record with minute-level dedupe key.

    Uniqueness is enforced on (prop_id, sportsbook, captured_minute).
    """

    id: Optional[int] = Field(default=None, primary_key=True)

    # Identity
    prop_id: str = Field(index=True, nullable=False, max_length=255)
    sportsbook: str = Field(index=True, nullable=False, max_length=100)
    sport: str = Field(index=True, nullable=False, max_length=20)

    # Odds data (American)
    line: Optional[float] = Field(default=None)
    over_odds: Optional[int] = Field(default=None)
    under_odds: Optional[int] = Field(default=None)

    # Timestamps
    captured_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), index=True
    )
    # Minute bucket used for dedupe (captured_at truncated to minute)
    captured_minute: datetime = Field(index=True)

    # Source timestamp (from provider) if known
    source_timestamp: Optional[datetime] = Field(default=None)

    # Simple composite uniqueness (enforced via CHECK in service to remain DB-agnostic)
    # Some SQLite versions do not handle functional unique indexes easily with SQLModel,
    # so we enforce the minute-level dedupe in service logic.

    @staticmethod
    def minute_bucket(dt: Optional[datetime] = None) -> datetime:
        base = dt or datetime.now(timezone.utc)
        if base.tzinfo is None:
            base = base.replace(tzinfo=timezone.utc)
        return base.replace(second=0, microsecond=0)
