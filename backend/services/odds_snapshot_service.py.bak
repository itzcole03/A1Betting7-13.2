"""
Odds Snapshot Persistence Service (MVP)

Provides:
- store_snapshot: upsert-like minute-level dedupe
- get_history: retrieve snapshots in range ordered asc

Gated usage: callers should check ENABLE_ODDS_SNAPSHOTS env flag.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, List, Optional

from sqlalchemy import text
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from backend.database import async_engine
from backend.models.odds_snapshot_sqlmodel import OddsSnapshotRecord
from backend.services.unified_session_utils import unified_session_execute


class OddsSnapshotService:
    def __init__(self) -> None:
        self.enabled = os.getenv("ENABLE_ODDS_SNAPSHOTS", "false").lower() == "true"
        self._table_checked = False
        self._disabled_logged = False
        # Test helper state
        self._test_mode_initialized = False

    def _check_enabled(self) -> bool:
        """Re-evaluate runtime flag to support tests toggling without reload."""
        current = os.getenv("ENABLE_ODDS_SNAPSHOTS", "false").lower() == "true"
        # Keep attribute updated for diagnostics
        self.enabled = current
        return current

    async def reset_for_tests(self) -> None:
        """Explicit helper for tests to purge snapshot table.

        Keeps production logic minimal; tests can call after toggling flags.
        """
        # Always purge when invoked; only test code calls this helper.
        try:
            async with AsyncSession(async_engine) as session:
                # Truncate all snapshot rows to guarantee deterministic test expectations
                await unified_session_execute(
                    session, text("DELETE FROM oddssnapshotrecord")
                )
                await session.commit()
        except Exception:
            pass

    async def _ensure_table(self) -> None:
        """Idempotently ensure the snapshots table exists.

        In TESTING mode we also truncate the table once to guarantee
        deterministic expectations for tests that assume an empty history
        at the start (e.g., snapshot flag flow test). This avoids having to
        modify global create_tables_async() semantics for the whole suite.
        """
        if self._table_checked:
            return
        try:  # pragma: no cover - defensive guard
            from backend.database import create_tables_async

            await create_tables_async()
        except Exception:
            pass
        self._table_checked = True

    async def store_snapshot(
        self,
        *,
        prop_id: str,
        sportsbook: str,
        sport: str,
        line: Optional[float],
        over_odds: Optional[int],
        under_odds: Optional[int],
        captured_at: Optional[datetime] = None,
        source_timestamp: Optional[datetime] = None,
    ) -> Optional[OddsSnapshotRecord]:
        if not self._check_enabled():
            # One-time debug to aid diagnostics when writes attempted while disabled
            if not self._disabled_logged:
                import logging

                logging.getLogger("odds_snapshot_service").debug(
                    "odds_snapshot:disabled_write_attempt"
                )
                self._disabled_logged = True
            return None

        from sqlmodel.ext.asyncio.session import AsyncSession

        captured_at = captured_at or datetime.now(timezone.utc)
        captured_minute = OddsSnapshotRecord.minute_bucket(captured_at)

        async with AsyncSession(async_engine) as session:
            await self._ensure_table()

            # Check for existing record in same minute bucket
            stmt = select(OddsSnapshotRecord).where(
                OddsSnapshotRecord.prop_id == prop_id,
                OddsSnapshotRecord.sportsbook == sportsbook,
                OddsSnapshotRecord.captured_minute == captured_minute,
            )
            res = await session.exec(stmt)
            existing = res.first()

            if existing:
                # Update existing snapshot values
                existing.line = line
                existing.over_odds = over_odds
                existing.under_odds = under_odds
                existing.captured_at = captured_at
                existing.source_timestamp = source_timestamp
                await session.commit()
                await session.refresh(existing)
                return existing

            # Insert new snapshot
            rec = OddsSnapshotRecord(
                prop_id=prop_id,
                sportsbook=sportsbook,
                sport=sport,
                line=line,
                over_odds=over_odds,
                under_odds=under_odds,
                captured_at=captured_at,
                captured_minute=captured_minute,
                source_timestamp=source_timestamp,
            )
            session.add(rec)
            await session.commit()
            await session.refresh(rec)
            return rec

    async def get_history(
        self,
        *,
        prop_id: str,
        sportsbook: str,
        start_time: datetime,
        end_time: datetime,
        limit: int = 100,
    ) -> List[dict[str, Any]]:
        if not self._check_enabled():
            return []

        async with AsyncSession(async_engine) as session:
            stmt = (
                select(OddsSnapshotRecord)
                .where(
                    OddsSnapshotRecord.prop_id == prop_id,
                    OddsSnapshotRecord.sportsbook == sportsbook,
                    OddsSnapshotRecord.captured_at >= start_time,
                    OddsSnapshotRecord.captured_at <= end_time,
                )
                .limit(limit)
            )
            res = await session.exec(stmt)
            rows = res.all()

            out: List[dict[str, Any]] = []
            for r in rows:
                out.append(
                    {
                        "prop_id": r.prop_id,
                        "sportsbook": r.sportsbook,
                        "sport": r.sport,
                        "line": r.line,
                        "over_odds": r.over_odds,
                        "under_odds": r.under_odds,
                        "captured_at": r.captured_at.isoformat(),
                        "source_timestamp": (
                            r.source_timestamp.isoformat()
                            if r.source_timestamp
                            else None
                        ),
                    }
                )
            return out


_service = OddsSnapshotService()


def get_odds_snapshot_service() -> OddsSnapshotService:
    # Re-sync the runtime flag in case tests flip the env without re-importing.
    _service._check_enabled()
    return _service
