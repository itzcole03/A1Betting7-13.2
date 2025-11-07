import asyncio
import json
from pathlib import Path

from backend.core.app import create_app
from backend.routes.propfinder_routes import (
    _dependency_resolve_service,
    _fetch_opportunities,
)


async def run():
    svc = _dependency_resolve_service()
    opps, summary, meta = await _fetch_opportunities(
        svc,
        sport_filter=None,
        confidence_range=None,
        edge_range=None,
        limit=10,
        force_flat_baseline=False,
        include_diagnostics=False,
        search=None,
    )
    repo_root = Path(__file__).resolve().parents[1]
    out = repo_root / "tmp_propfinder_fetch_inspect.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(
            {"opps": opps, "summary": summary, "meta": meta},
            f,
            ensure_ascii=False,
            indent=2,
        )
    print("wrote", out)


asyncio.run(run())
