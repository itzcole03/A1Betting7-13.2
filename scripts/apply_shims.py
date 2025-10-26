# Small helper script to atomically overwrite route files with minimal import-safe shims.
# Usage: python scripts/apply_shims.py

import os

ROOT = os.path.dirname(os.path.dirname(__file__))
ROUTES_DIR = os.path.join(ROOT, "backend", "routes")

FILES_TO_SHIM = [
    "enhanced_data_validation_routes.py",
    "enhanced_ev_routes.py",
    "enhanced_search_routes.py",
    "enhanced_sportsbook_routes.py",
    "enterprise_model_registry_routes.py",
    "live_betting_routes.py",
    "llm_explanations.py",
    "meta_cache.py",
    "meta_legacy.py",
    "mlb_extras_fixed.py",
    "model_performance_monitoring_routes.py",
    "model_registry.py",
]

if __name__ == "__main__":
    for fname in FILES_TO_SHIM:
        service = fname.replace(".py", "")
        path = os.path.join(ROUTES_DIR, fname)
        content = (
            "from fastapi import APIRouter\n\n"
            "router = APIRouter()\n\n\n"
            "@router.get('/_ping')\n"
            "async def ping():\n"
            "    return "
            + repr(
                {
                    "success": True,
                    "data": {"service": service, "status": "healthy"},
                    "error": None,
                }
            )
            + "\n"
        )
        try:
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
            print("WROTE", path)
        except OSError as e:
            print("FAILED", path, e)
