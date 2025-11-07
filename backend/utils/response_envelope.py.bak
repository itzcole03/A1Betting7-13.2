"""
Helpers for standardized API response envelopes.
"""

from typing import Any, Dict, Optional


def ok(data: Any, meta: Optional[Dict] = None) -> Dict:
    resp = {"success": True, "data": data, "error": None}
    if meta:
        resp["meta"] = meta
    return resp


def fail(code: str, message: str, meta: Optional[Dict] = None) -> Dict:
    resp = {"success": False, "data": None, "error": {"code": code, "message": message}}
    if meta:
        resp["meta"] = meta
    return resp
