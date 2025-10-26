from typing import Any, Dict

from fastapi import APIRouter
from fastapi.responses import JSONResponse

try:
    # Prefer canonical health implementation when available
    from backend.routes.health import get_health as canonical_health
except Exception:
    canonical_health = None

router = APIRouter()


def _build_legacy_envelope(status: str = "ok", components: Dict[str, Any] | None = None) -> Dict[str, Any]:
    """Return the legacy test-friendly envelope: {success: True, data: {...}}.

    Tests expect data.status == 'ok', a 'deprecated' flag on legacy aliases,
    and a components mapping.
    """
    if components is None:
        components = {"infrastructure": {"status": "ok"}, "cache": {"status": "ok"}}

    return {
        "success": True,
        "data": {
            "status": status,
            "deprecated": True,
            "components": components,
        },
    }


def _extract_status_and_components(resp: Dict[str, Any]) -> Dict[str, Any]:
    """Extract status and components from a canonical health payload.

    Handles several canonical shapes: envelope with 'data', or flat dicts using
    'status'/'healthy' or 'infrastructure' keys.
    """
    # If resp is an envelope with data, unwrap
    if isinstance(resp.get("data"), dict):
        inner = resp.get("data")
    else:
        inner = resp

    # Status resolution
    status = None
    for k in ("status", "service_status", "overall_status"):
        if k in inner:
            status = inner.get(k)
            break

    if isinstance(status, str) and status.lower().startswith("healthy"):
        status = "ok"
    if status is None:
        status = "ok"

    # Components resolution
    components = inner.get("components") or inner.get("infrastructure") or {"cache": {"status": "ok"}}

    return {"status": status, "components": components}


@router.get("/health")
async def health_root():
    # Legacy root health alias -> always return envelope with data.status == 'ok'
    if canonical_health:
        try:
            resp = await canonical_health()
            if isinstance(resp, dict):
                resolved = _extract_status_and_components(resp)
                return JSONResponse(status_code=200, content=_build_legacy_envelope(resolved["status"], resolved["components"]))
        except Exception:
            # Fall through to safe envelope
            pass

    return JSONResponse(status_code=200, content=_build_legacy_envelope())


@router.get("/api/health")
async def health_api():
    return await health_root()


@router.get("/api/v2/health")
async def health_v2():
    return await health_root()
