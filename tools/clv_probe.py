import asyncio
from unittest.mock import patch


async def main():
    from backend.routes.propfinder_routes import _run_clv_compute

    # Build minimal opps like the lean fast-path
    minimal_opps = [
        {"id": "lean-1", "player": "Test Player 1"},
        {"id": "lean-2", "player": "Test Player 2"},
    ]

    def mock_batch_clv(opportunities):
        print("mock_batch_clv called with:", opportunities)
        enriched = []
        for opp in opportunities:
            opp_copy = opp.copy()
            opp_copy["clv_metrics"] = {"clv_estimate": 0.15}
            enriched.append(opp_copy)
        return enriched

    with patch(
        "backend.services.clv_computation.compute_clv_batch", side_effect=mock_batch_clv
    ) as p:
        res = await _run_clv_compute(minimal_opps, None)
        print("_run_clv_compute returned:", res)
        print("minimal_opps after:", minimal_opps)


if __name__ == "__main__":
    asyncio.run(main())
