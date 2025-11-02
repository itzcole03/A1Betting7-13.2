"""Import-safe security routes shim using the canonical response envelope."""

from typing import Any, Dict

from fastapi import APIRouter

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/api/security", tags=["Security"])


def _success(payload: Dict[str, Any]) -> Dict[str, Any]:
    return ResponseBuilder.success(payload)


@router.get("/health")
def security_health() -> Dict[str, Any]:
    payload = {"status": "ok"}
    return _success(payload)


@router.post("/logout")
def logout() -> Dict[str, Any]:
    payload = {"message": "logged out"}
    return _success(payload)
