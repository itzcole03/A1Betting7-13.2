from datetime import datetime, timezone


def now_utc() -> datetime:
    """Return a timezone-aware UTC datetime for default_factory usage.

    Use this instead of datetime.utcnow() which is deprecated in newer
    Python/Pydantic versions.
    """
    return datetime.now(timezone.utc)
