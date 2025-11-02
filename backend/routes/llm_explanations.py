"""Maintenance shim for legacy LLM explanation routes."""

from fastapi import APIRouter

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/api/llm-explanations", tags=["LLM Explanations"])


@router.get("/_ping")
async def ping():
    payload = {"service": "llm_explanations", "status": "healthy"}
    return ResponseBuilder.success(payload, message="LLM explanations service ready")
