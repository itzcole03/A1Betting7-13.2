from fastapi import APIRouter, Request
from fastapi.responses import Response

from backend.core.response_models import ResponseBuilder

router = APIRouter()


@router.get("/dev/mode")
async def dev_mode_get(request: Request):
    """Compatibility endpoint for /dev/mode used in stabilization tests."""
    # Import settings at request time so tests can monkeypatch backend.config.settings.get_settings
    try:
        import backend.config.settings as settings_mod

        settings = settings_mod.get_settings()
        lean = bool(getattr(settings.app, "dev_lean_mode", False))
    except Exception:
        lean = False

    data = {
        "lean": lean,
        "mode": "lean" if lean else "full",
        "features_disabled": (
            []
            if not lean
            else [
                "heavy_logging",
                "metrics_middleware",
                "rate_limiting",
                "high_frequency_background_tasks",
            ]
        ),
    }

    # Return a minimal envelope (success/data/error) to match stabilization test schema expectations.
    return {"success": True, "data": data, "error": None}


@router.head("/dev/mode")
async def dev_mode_head(request: Request):
    # Tests expect a 200 with empty body for HEAD
    return Response(status_code=200)
