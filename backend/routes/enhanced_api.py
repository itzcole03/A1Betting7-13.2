from fastapi import APIRouter

router = APIRouter()


@router.get("/_ping")
async def ping():
    return {
        "success": True,
        "data": {"service": "enhanced_api", "status": "healthy"},
        "error": None,
    }
