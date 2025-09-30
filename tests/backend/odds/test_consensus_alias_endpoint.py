from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

SPORT = "MLB"
MARKET = "player_props"


def _refresh():
    r = client.post(f"/api/odds/refresh?sport={SPORT}&market={MARKET}")
    assert r.status_code == 200, r.text
    legacy = client.post(f"/v1/odds/api/odds-mvp/refresh?sport={SPORT}&market={MARKET}")
    assert legacy.status_code == 200, legacy.text


def test_consensus_alias_parity():
    _refresh()
    r_alias = client.get(f"/api/odds/consensus?sport={SPORT}&market={MARKET}")
    r_legacy = client.get(f"/v1/odds/api/odds-mvp/consensus?sport={SPORT}&market={MARKET}")
    assert r_alias.status_code == 200, r_alias.text
    assert r_legacy.status_code == 200, r_legacy.text
    a_body = r_alias.json()
    l_body = r_legacy.json()
    assert a_body["count"] == l_body["count"], (a_body, l_body)

    def to_map(body):
        return {e["selection_key"]: e for e in body.get("data", [])}

    amap = to_map(a_body)
    lmap = to_map(l_body)
    assert set(amap.keys()) == set(lmap.keys())
    for k in amap:
        af = amap[k]; lf = lmap[k]
        for field in ("selection_key", "line", "consensus_implied_prob", "consensus_american", "books"):
            assert af[field] == lf[field]


def test_snapshots_alias_parity():
    _refresh()
    a = client.get(f"/api/odds/snapshots?sport={SPORT}&market={MARKET}&limit=25")
    l = client.get(f"/v1/odds/api/odds-mvp/snapshots?sport={SPORT}&market={MARKET}&limit=25")
    assert a.status_code == 200 and l.status_code == 200, (a.text, l.text)
    ab = a.json(); lb = l.json()
    assert ab["count"] == lb["count"], (ab, lb)
