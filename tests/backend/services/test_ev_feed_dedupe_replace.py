import asyncio
import pytest
from backend.services.ev_feed_service import EVFeedService
from backend.models.ev_models import EVOpportunity, SportType, MarketType


@pytest.mark.asyncio
async def test_dedupe_and_replace_logic():
    """Validate skip vs replacement semantics and edge_tier propagation."""
    svc = EVFeedService()
    def make_opp(oid: str, evp: float) -> EVOpportunity:
        return EVOpportunity(
            id=oid,
            player="Player A",
            market="Points Over 10.5",
            sport=SportType.NBA,
            market_type=MarketType.PLAYER_PROPS,
            our_fair_odds=-110.0,
            market_odds=-105,
            ev_percent=evp,
            source_book="BookA",
            game_info="X @ Y",
            confidence_score=None,
            volume_indicator=None,
            line_movement=None,
            predicted_ev_next_5m=None,
            edge_tier=None,
        )

    # First add (2.00% EV -> solid tier per classifier (1.5<=x<3))
    opp1 = make_opp("t1", 2.00)
    r1 = await svc.add_feed_entry(opp1)
    assert svc.total_added == 1
    assert r1.get("deduped") is False and r1.get("replaced") is False
    assert svc._ring[0]["edge_tier"] == svc.classify_edge(2.00)

    # Dedup skip (delta < 0.15: 2.05 - 2.00 = 0.05)
    opp2 = make_opp("t2", 2.05)
    r2 = await svc.add_feed_entry(opp2)
    assert svc.total_deduped == 1
    assert r2.get("deduped") is True
    assert len(svc._ring) == 1
    # Ensure original value preserved (not replaced)
    assert abs(svc._ring[0]["ev_percent"] - 2.00) < 1e-6

    # Replacement (increase 2.00 -> 2.40 > 0.15 delta)
    opp3 = make_opp("t3", 2.40)
    r3 = await svc.add_feed_entry(opp3)
    assert svc.total_replaced == 1
    assert r3.get("replaced") is True
    assert len(svc._ring) == 1
    assert abs(svc._ring[0]["ev_percent"] - 2.40) < 1e-6
    assert svc._ring[0]["edge_tier"] == svc.classify_edge(2.40)


@pytest.mark.asyncio
async def test_edge_tier_classification_all_buckets():
    """Ensure classify_edge maps into expected micro/solid/strong/elite buckets."""
    svc = EVFeedService()
    cases = [
        (0.5, "micro"),
        (1.50, "solid"),  # boundary -> solid (>=1.5)
        (3.0, "strong"),  # strong threshold
        (5.01, "elite"),  # elite >5
    ]
    for idx, (evp, expected) in enumerate(cases):
        opp = EVOpportunity(
            id=f"edge{idx}",
            player="Tester",
            market="Points Over 10.5",
            sport=SportType.NBA,
            market_type=MarketType.PLAYER_PROPS,
            our_fair_odds=-110.0,
            market_odds=-105,
            ev_percent=evp,
            source_book="BookA",
            game_info="G",
            confidence_score=None,
            volume_indicator=None,
            line_movement=None,
            predicted_ev_next_5m=None,
            edge_tier=None,
        )
        await svc.add_feed_entry(opp)
        assert svc._ring[-1]["edge_tier"] == expected


@pytest.mark.asyncio
async def test_meta_counters_basic():
    svc = EVFeedService()
    opp = EVOpportunity(
        id="m1",
        player="Player",
        market="Points Over 10.5",
        sport=SportType.NBA,
        market_type=MarketType.PLAYER_PROPS,
        our_fair_odds=-110.0,
        market_odds=-105,
        ev_percent=2.2,
        source_book="BookA",
        game_info="X @ Y",
        confidence_score=None,
        volume_indicator=None,
        line_movement=None,
        predicted_ev_next_5m=None,
        edge_tier=None,
    )
    await svc.add_feed_entry(opp)
    meta = svc.get_meta()
    assert meta["total_added"] == 1
    assert meta["current_size"] == 1
    assert meta["max_capacity"] == svc.MAX_RING_CAPACITY
    assert meta["max_edge"] >= 2.2


@pytest.mark.asyncio
async def test_concurrency_add_storm():
    """High concurrency adds should produce one base record with dedup/replacements counted."""
    svc = EVFeedService()
    async def add(ev):
        opp = EVOpportunity(
            id=f"c{ev}",
            player="Storm Player",
            market="Points Over 10.5",
            sport=SportType.NBA,
            market_type=MarketType.PLAYER_PROPS,
            our_fair_odds=-110.0,
            market_odds=-105,
            ev_percent=ev,
            source_book="BookA",
            game_info="X @ Y",
            confidence_score=None,
            volume_indicator=None,
            line_movement=None,
            predicted_ev_next_5m=None,
            edge_tier=None,
        )
        await svc.add_feed_entry(opp)

    # Mix of small bumps (dedupe) and large bumps (replacement)
    ev_values = [2.0] + [2.02, 2.04, 2.30, 2.35, 2.36, 2.60, 2.61, 2.90, 3.5]
    await asyncio.gather(*(add(e) for e in ev_values))

    meta = svc.get_meta()
    assert meta["current_size"] == 1
    assert meta["total_added"] == 1  # first insert only
    # remaining events either deduped or replaced
    assert meta["total_deduped"] + meta["total_replaced"] == len(ev_values) - 1
    # final ev_percent should be max provided
    assert abs(svc._ring[0]["ev_percent"] - max(ev_values)) < 1e-6
    assert svc._ring[0]["edge_tier"] == svc.classify_edge(max(ev_values))
