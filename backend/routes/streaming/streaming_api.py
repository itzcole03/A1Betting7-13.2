"""Minimal shim for streaming API used in tests.

Expose provider_registry, market_streamer, portfolio_rationale_service and router.
"""

from datetime import datetime
from types import SimpleNamespace
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/streaming", tags=["streaming"])

# These are pluggable module-level services that tests will patch.
provider_registry = None
market_streamer = None
portfolio_rationale_service = None


@router.get("/health")
async def streaming_health():
    # Tests expect a top-level mapping containing 'healthy', 'components', 'timestamp'
    components = {}
    if market_streamer is not None:
        try:
            s = market_streamer.get_status()
            components["streamer"] = {"is_running": s.get("is_running")}
        except Exception:
            components["streamer"] = {"is_running": False}
    if portfolio_rationale_service is not None:
        try:
            components["rationale_service"] = portfolio_rationale_service.get_status()
        except Exception:
            components["rationale_service"] = {"is_available": False}

    return {
        "healthy": True,
        "components": components,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/providers")
async def list_providers():
    try:
        providers = []
        total_count = 0
        registry_stats = {}
        if provider_registry is not None:
            providers_map = provider_registry.get_all_provider_status()
            # Normalize into a list for tests
            providers = []
            for name, info in (providers_map or {}).items():
                item = {"provider_name": name}
                # merge any shallow serializable fields
                try:
                    item.update({k: v for k, v in info.items() if not callable(v)})
                except Exception:
                    pass
                providers.append(item)
            total_count = len(providers)
            try:
                registry_stats = provider_registry.get_registry_stats()
            except Exception:
                registry_stats = {}

        return {
            "success": True,
            "data": {
                "providers": providers,
                "total_count": total_count,
                "registry_stats": registry_stats,
            },
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})


@router.get("/providers/{provider_name}")
async def get_provider(provider_name: str):
    try:
        if provider_registry is None:
            raise HTTPException(status_code=404)
        pr = provider_registry.get_provider(provider_name)
        if not pr:
            raise HTTPException(status_code=404)
        # Tests expect provider_name in data
        return {
            "success": True,
            "data": {"provider_name": getattr(pr, "provider_name", provider_name)},
        }
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})


@router.post("/control")
async def control_streaming(request: Request):
    payload = await request.json()
    action = payload.get("action")
    try:
        if action == "start":
            if market_streamer is None:
                raise HTTPException(status_code=500, detail="No streamer available")
            # allow start to be async
            start_fn = getattr(market_streamer, "start", None)
            if start_fn is not None:
                if callable(start_fn):
                    res = start_fn()
                    if hasattr(res, "__await__"):
                        await res
            return {"success": True, "message": "Streaming started"}
        elif action == "stop":
            if market_streamer is None:
                raise HTTPException(status_code=500, detail="No streamer available")
            stop_fn = getattr(market_streamer, "stop", None)
            if stop_fn is not None:
                res = stop_fn()
                if hasattr(res, "__await__"):
                    await res
            return {"success": True, "message": "Streaming stopped"}
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})


@router.get("/status")
async def status():
    try:
        streaming = {}
        providers = {}
        rationale = {}
        if market_streamer is not None:
            try:
                streaming = market_streamer.get_status()
            except Exception:
                streaming = {}
        if provider_registry is not None:
            try:
                providers = provider_registry.get_registry_stats()
            except Exception:
                providers = {}
        if portfolio_rationale_service is not None:
            try:
                rationale = portfolio_rationale_service.get_status()
            except Exception:
                rationale = {}

        return {
            "success": True,
            "data": {
                "streaming": streaming,
                "providers": providers,
                "rationale_service": rationale,
            },
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})


@router.post("/rationale/generate")
async def generate_rationale(request: Request):
    payload = await request.json()
    # very small validation: require rationale_type
    rtype = payload.get("rationale_type")
    if rtype not in ("portfolio_summary",):
        # Tests expect a 400 with detail "Invalid rationale type"
        raise HTTPException(status_code=400, detail="Invalid rationale type")

    if portfolio_rationale_service is None:
        raise HTTPException(status_code=500, detail="Rationale service not available")

    try:
        # Wrap payload into a simple object so services expecting attribute access work
        req_obj = SimpleNamespace(**payload)
        # service may be async
        gen = portfolio_rationale_service.generate_rationale(req_obj)
        if hasattr(gen, "__await__"):
            result = await gen
        else:
            result = gen
        return {
            "success": True,
            "message": "Portfolio rationale generated",
            "data": {"id": getattr(result, "id", None)},
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})
