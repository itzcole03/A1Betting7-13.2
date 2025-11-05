"""REST routes for LLM explanation workflows."""

from __future__ import annotations

import inspect
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from backend.core.response_models import ResponseBuilder
from backend.services.llm.explanation_service import ExplanationDTO, explanation_service

router = APIRouter(tags=["LLM Explanations"])


def _utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


class ExplanationRequest(BaseModel):
    model_version_id: int = Field(..., ge=1)
    force_refresh: Optional[bool] = False


class PrefetchEdge(BaseModel):
    edge_id: int = Field(..., ge=0)
    model_version_id: int = Field(..., ge=1)


class PrefetchRequest(BaseModel):
    edges: List[PrefetchEdge]


def _normalize_explanation(result: Any) -> Dict[str, Any]:
    base: Dict[str, Any] = {
        "content": None,
        "provider": None,
        "tokens_used": None,
        "from_cache": False,
    }

    if result is None:
        return base

    if isinstance(result, ExplanationDTO):
        base.update(
            {
                "content": result.content,
                "provider": result.provider,
                "tokens_used": result.tokens_used,
                "from_cache": result.cache_hit,
            }
        )
        return base

    if isinstance(result, dict):
        base["content"] = result.get("explanation") or result.get("content")
        base["provider"] = result.get("provider")
        base["tokens_used"] = result.get("tokens_used")
        base["from_cache"] = bool(result.get("from_cache", False))
        for field in ("confidence", "reasoning_steps"):
            if field in result:
                base[field] = result[field]
        return base

    base["content"] = str(result)
    return base


def _success_with_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    response = ResponseBuilder.success(payload)
    response.update(payload)
    return response


async def _maybe_await(value: Any) -> Any:
    """Resolve values that might be awaitable (sync tests patch with MagicMock)."""

    if inspect.isawaitable(value):
        return await value
    return value


def _error_with_payload(
    message: str,
    *,
    code: str,
    status_code: int,
    details: Optional[Dict[str, Any]] = None,
) -> JSONResponse:
    base = ResponseBuilder.error(
        message=message, code=code, details=details, status_code=status_code
    )
    if isinstance(base, JSONResponse):
        try:
            content = json.loads(base.body)
        except Exception:  # pragma: no cover - defensive fallback
            content = {
                "success": False,
                "status": "error",
                "meta": {"timestamp": _utc_timestamp()},
            }
        content["error"] = message
        if details:
            content["details"] = details
        return JSONResponse(status_code=status_code, content=content)
    return base


@router.post("/api/edges/{edge_id}/explanation")
async def generate_edge_explanation(edge_id: int, request: ExplanationRequest):
    try:
        call_result = explanation_service.generate_or_get_edge_explanation(
            edge_id,
            request.model_version_id,
            force_refresh=bool(request.force_refresh),
        )
        result = await _maybe_await(call_result)
    except HTTPException as exc:
        detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        return _error_with_payload(
            message=detail,
            code="EXPLANATION_ERROR",
            status_code=exc.status_code,
            details={"edge_id": edge_id},
        )
    except Exception as exc:  # pragma: no cover - safety net
        return _error_with_payload(
            message="Failed to generate explanation",
            code="EXPLANATION_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details={"edge_id": edge_id, "error": str(exc)},
        )

    if result is None:
        return _error_with_payload(
            message="Explanation not found",
            code="EXPLANATION_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"edge_id": edge_id},
        )

    payload = {
        "edge_id": edge_id,
        "model_version_id": request.model_version_id,
        "explanation": _normalize_explanation(result),
        "timestamp": _utc_timestamp(),
    }
    return _success_with_payload(payload)


@router.get("/api/edges/{edge_id}/explanation")
async def get_edge_explanation(edge_id: int, model_version_id: int = Query(..., ge=1)):
    try:
        call_result = explanation_service.generate_or_get_edge_explanation(
            edge_id, model_version_id
        )
        result = await _maybe_await(call_result)
    except HTTPException as exc:
        detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        return _error_with_payload(
            message=detail,
            code="EXPLANATION_ERROR",
            status_code=exc.status_code,
            details={"edge_id": edge_id},
        )
    except Exception as exc:  # pragma: no cover - safety net
        return _error_with_payload(
            message="Failed to load explanation",
            code="EXPLANATION_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details={"edge_id": edge_id, "error": str(exc)},
        )

    if result is None:
        return _error_with_payload(
            message="Explanation not found",
            code="EXPLANATION_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"edge_id": edge_id},
        )

    payload = {
        "edge_id": edge_id,
        "model_version_id": model_version_id,
        "explanation": _normalize_explanation(result),
        "timestamp": _utc_timestamp(),
    }
    return _success_with_payload(payload)


@router.post("/api/edges/explanation/prefetch")
async def prefetch_explanations(request: PrefetchRequest):
    edges = request.edges or []
    if not edges:
        return _error_with_payload(
            message="Edge list cannot be empty",
            code="EMPTY_REQUEST",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    if len(edges) > 100:
        return _error_with_payload(
            message="Prefetch request exceeds limit of 100 edges",
            code="REQUEST_LIMIT_EXCEEDED",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"requested": len(edges)},
        )

    edge_payload = [edge.model_dump() for edge in edges]
    try:
        call_result = explanation_service.prefetch_explanations(edge_payload)
        results = await _maybe_await(call_result)
    except Exception as exc:  # pragma: no cover - safety net
        return _error_with_payload(
            message="Failed to prefetch explanations",
            code="EXPLANATION_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details={"error": str(exc)},
        )

    generated = sum(1 for item in results if not item.get("from_cache", False))
    from_cache = sum(1 for item in results if item.get("from_cache", False))

    payload = {
        "results": results,
        "summary": {
            "total_requested": len(edges),
            "generated": generated,
            "from_cache": from_cache,
        },
        "timestamp": _utc_timestamp(),
    }
    return _success_with_payload(payload)


@router.get("/api/edges/explanation/status")
async def get_explanation_status():
    try:
        status_payload = explanation_service.get_health_status()
    except Exception as exc:  # pragma: no cover - safety net
        return _error_with_payload(
            message="Failed to fetch explanation service status",
            code="SERVICE_UNAVAILABLE",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details={"error": str(exc)},
        )

    payload = dict(status_payload)
    payload["timestamp"] = _utc_timestamp()
    return _success_with_payload(payload)


@router.get("/api/llm-explanations/_ping")
async def ping():
    payload = {"service": "llm_explanations", "status": "healthy"}
    return _success_with_payload(payload)


def register(router_registry):
    """Expose router for the canonical feature registration pipeline."""

    router_registry.include_router(router)
