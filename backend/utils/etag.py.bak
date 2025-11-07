"""ETag helpers for consistent, sanitized ETag computation used by PropFinder routes.

Utilities:
- compute_etag(obj): canonical JSON dump + SHA1
- compute_etag_for_compact_list(payload): sanitize per-item volatile fields (timestamps) before hashing
"""

from __future__ import annotations

import copy
import hashlib
import json
from typing import Any, Dict


def compute_etag(obj: Any) -> str:
    """Compute a deterministic SHA1 ETag for an arbitrary JSON-serializable object.

    Uses sort_keys=True and default=str to avoid TypeErrors. Returns the
    hex digest string.
    """
    try:
        body = json.dumps(obj, sort_keys=True, default=str)
        return hashlib.sha1(body.encode("utf-8")).hexdigest()
    except Exception:
        # As a last-resort, fall back to repr
        try:
            body = json.dumps(str(obj), ensure_ascii=False)
            return hashlib.sha1(body.encode("utf-8")).hexdigest()
        except Exception:
            return hashlib.sha1(repr(obj).encode("utf-8")).hexdigest()


def compute_etag_for_compact_list(payload: Dict[str, Any]) -> str:
    """Compute an ETag for a compact/list payload in a way that's insensitive
    to volatile per-item timestamps.

    Strategy: deep-copy the payload, remove per-item timestamp fields
    ("lastUpdated", "last_updated") from each opportunity, then hash the
    sanitized payload.
    """
    try:
        sanitized = copy.deepcopy(payload)
        items = sanitized.get("opportunities") or sanitized.get("items") or []
        if isinstance(items, list):
            for item in items:
                if isinstance(item, dict):
                    item.pop("lastUpdated", None)
                    item.pop("last_updated", None)
        # Also remove top-level volatile meta.timestamp if present
        meta = sanitized.get("meta")
        if isinstance(meta, dict):
            meta.pop("timestamp", None)
        return compute_etag(sanitized)
    except Exception:
        return compute_etag(payload)
