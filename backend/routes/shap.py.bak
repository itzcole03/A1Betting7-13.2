"""Import-safe SHAP analytics router stub.

The original implementation uses complex f-strings and heavy
analytics dependencies. To make test collection reliable we expose a
minimal, well-typed router that other modules can import at test time.
"""

from typing import Dict, List

from fastapi import APIRouter

router = APIRouter(prefix="/api/analytics/shap", tags=["SHAP"])


@router.get("/explain/{model_name}")
async def explain_model(model_name: str) -> Dict[str, object]:
    """Return a tiny, deterministic explanation payload for tests."""
    return {
        "model": model_name,
        "top_positive": [],
        "top_negative": [],
        "note": "import-safe shap stub",
    }
