from __future__ import annotations

from collections import deque
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from threading import Lock
from typing import Deque, Dict, List, Optional


@dataclass
class FeatureFlag:
    name: str
    enabled: bool = False
    last_changed: Optional[str] = None  # ISO8601 string
    toggler: Optional[str] = None


@dataclass
class AuditEntry:
    timestamp: str
    flag: str
    enabled: bool
    toggler: str


class FeatureFlagsService:
    _instance: Optional["FeatureFlagsService"] = None
    _lock = Lock()

    # Supported flag names
    SUPPORTED_FLAGS = (
        "ENABLE_EV_ENRICHMENT",
        "ENABLE_SMART_SIGNALS",
        "ENABLE_LINE_MOVEMENT",
    )

    def __init__(self, ring_size: int = 200):
        self._lock_local = Lock()
        self._flags: Dict[str, FeatureFlag] = {
            name: FeatureFlag(name=name, enabled=False, last_changed=None, toggler=None)
            for name in self.SUPPORTED_FLAGS
        }
        self._audit: Deque[AuditEntry] = deque(maxlen=ring_size)
        self._db_enabled = False
        # During test runs we prefer in-memory defaults to avoid sourcing
        # persisted feature flag state from a developer DB. Pytest sets the
        # PYTEST_CURRENT_TEST env var for tests; detect it and skip DB load.
        try:
            import os

            if os.getenv("PYTEST_CURRENT_TEST"):
                self._db_enabled = False
                return
        except Exception:
            pass
        # Try to enable DB persistence if models and session are available
        try:
            from backend.database import SessionLocal, sync_engine  # type: ignore
            from backend.models.feature_flags import FeatureFlagSetting  # type: ignore

            self._SessionLocal = SessionLocal
            self._FeatureFlagSetting = FeatureFlagSetting
            self._sync_engine = sync_engine
            self._db_enabled = True
            # Ensure table exists (best effort; no-op if already present)
            try:
                from sqlalchemy import inspect

                insp = inspect(self._sync_engine)
                if not insp.has_table("feature_flags"):
                    from sqlmodel import SQLModel

                    # Use SQLAlchemy metadata from Base models where possible
                    # Fallback: issue CREATE TABLE via ORM mapper
                    with self._sync_engine.begin() as conn:
                        self._FeatureFlagSetting.metadata.create_all(bind=conn)  # type: ignore[attr-defined]
            except Exception:
                pass
            # Load existing flags from DB if present
            try:
                with self._SessionLocal(self._sync_engine) as db:
                    rows = db.query(self._FeatureFlagSetting).all()
                    for row in rows:
                        if row.name in self._flags:
                            self._flags[row.name].enabled = bool(row.enabled)
                            self._flags[row.name].toggler = row.toggler
                            self._flags[row.name].last_changed = (
                                row.last_changed.isoformat()
                                if row.last_changed
                                else None
                            )
            except Exception:
                # If any DB load error, continue with in-memory defaults
                self._db_enabled = False
        except Exception:
            self._db_enabled = False

    @classmethod
    def get_instance(cls) -> "FeatureFlagsService":
        with cls._lock:
            if cls._instance is None:
                cls._instance = FeatureFlagsService()
            return cls._instance

    # Public API
    def list_flags(self) -> List[Dict]:
        with self._lock_local:
            return [asdict(flag) for flag in self._flags.values()]

    def get_flag(self, name: str) -> Optional[FeatureFlag]:
        with self._lock_local:
            return self._flags.get(name)

    def set_flag(self, name: str, enabled: bool, toggler: str = "admin-system") -> Dict:
        ts = datetime.now(timezone.utc).isoformat()
        with self._lock_local:
            if name not in self._flags:
                raise KeyError(name)
            flag = self._flags[name]
            flag.enabled = bool(enabled)
            flag.last_changed = ts
            flag.toggler = toggler

            self._audit.appendleft(
                AuditEntry(
                    timestamp=ts, flag=name, enabled=bool(enabled), toggler=toggler
                )
            )
            # Persist to DB if enabled
            if self._db_enabled:
                try:
                    from datetime import datetime as dt

                    last_changed_dt = (
                        dt.fromisoformat(ts.replace("Z", "+00:00"))
                        if "Z" in ts
                        else dt.fromisoformat(ts)
                    )
                    with self._SessionLocal(self._sync_engine) as db:
                        existing = db.get(self._FeatureFlagSetting, name)
                        if existing is None:
                            existing = self._FeatureFlagSetting(
                                name=name,
                                enabled=bool(enabled),
                                last_changed=last_changed_dt,
                                toggler=toggler,
                            )
                            db.add(existing)
                        else:
                            existing.enabled = bool(enabled)
                            existing.last_changed = last_changed_dt
                            existing.toggler = toggler
                        db.commit()
                except Exception:
                    # Do not fail operation on DB errors
                    pass
            return asdict(flag)

    def list_audit(self) -> List[Dict]:
        with self._lock_local:
            return [asdict(entry) for entry in list(self._audit)]


def get_feature_flags_service() -> FeatureFlagsService:
    return FeatureFlagsService.get_instance()
