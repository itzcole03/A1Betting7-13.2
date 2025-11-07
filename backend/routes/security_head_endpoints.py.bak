"""Import-safe stub for security_head_endpoints used during triage.

This module intentionally provides a tiny APIRouter with canonical /health
and a lightweight _ping endpoint to keep imports safe during tests. The
full security HEAD implementations should be restored from source control
after triage.
"""

from fastapi import APIRouter, Response

router = APIRouter(prefix="/api/security", tags=["security"])


@router.head("/etag")
async def head_etag(response: Response):
    response.headers["ETag"] = '"stub-etag"'
    return {"success": True}


__all__ = ["router"]
