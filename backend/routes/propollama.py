"""Import-safe PropOllama router stub.

This module intentionally contains only lightweight endpoints so pytest
collection and test discovery can proceed without loading heavy I/O,
third-party clients, or complex parsing logic. Replace with full
implementation later when imports are stable.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/propollama", tags=["PropOllama"])


@router.get("/ping")
async def propollama_ping():
    """Simple ping response used by tests and health checks."""
    return {"status": "ok", "message": "propollama router is active."}


@router.get("/health")
async def propollama_health():
    """Lightweight health endpoint."""
    return {"status": "healthy", "message": "propollama router is import-safe."}


@router.get("/info")
async def propollama_info():
    """Basic info endpoint returned without heavy dependencies."""
    return {"name": "propollama", "version": "stub"}
