"""Minimal import-safe enhanced_ml_routes shim.

Provides a small, well-formed API surface so tests can import
`backend.routes.enhanced_ml_routes` without pulling in heavy ML deps.
"""

from typing import Any, Dict

from fastapi import APIRouter

router = APIRouter(prefix="/api/modern-ml", tags=["Enhanced ML"])


@router.get("/health")
async def ml_health() -> Dict[str, Any]:
    return {"success": True, "data": {"status": "ok"}, "error": None}


def include_enhanced_ml_routes(app_router):
    app_router.include_router(router)


# Placeholder integration object used by tests; tests will patch its methods
class EnhancedPredictionIntegrationPlaceholder:
    async def predict_single(self, payload: dict):
        return {"prediction": None}


enhanced_prediction_integration = EnhancedPredictionIntegrationPlaceholder()
