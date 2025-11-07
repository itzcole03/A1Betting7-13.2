#!/usr/bin/env python3
"""Import-safe cloud integration probe shim.

This module replaces a more complex startup script with a tiny shim that
exports probe_cloud_integration(). The aim is to avoid import-time side
effects and JS-template artifacts that previously caused SyntaxError during
pytest collection.
"""

from typing import Any, Dict

try:
    from backend.core.app import ok
except Exception:

    def ok(payload: Dict[str, Any]) -> Dict[str, Any]:
        return {"success": True, "data": payload, "error": None}


def probe_cloud_integration() -> Dict[str, Any]:
    """Return a conservative cloud-integration status for tests.

    Returns a canonical envelope using the project's ok() helper when
    available, otherwise a compatible dict is returned.
    """
    return ok(
        {
            "status": "not-configured",
            "message": "cloud integration disabled in test shim",
        }
    )


__all__ = ["probe_cloud_integration"]
