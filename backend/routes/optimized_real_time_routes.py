from fastapi import APIRouter

router = APIRouter(
    prefix="/api/optimized_real_time_routes", tags=["optimized_real_time_routes"]
)


@router.get("/health")
def health():
    return {
        "success": True,
        "data": {"status": "ok", "service": "optimized_real_time_routes"},
        "error": None,
    }


@router.get("/_ping")
def ping():
    return {"ok": True}


__all__ = ["router"]
