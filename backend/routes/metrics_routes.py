from fastapi import APIRouter, Response

from backend.metrics.prometheus_adapter import get_adapter

router = APIRouter()


@router.get("/metrics")
async def metrics():
    adapter = get_adapter()
    data = adapter.generate_metrics()
    return Response(content=data, media_type="text/plain; version=0.0.4")
