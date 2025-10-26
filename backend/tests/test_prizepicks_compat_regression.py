from fastapi.testclient import TestClient

from backend.core.app import create_app


def test_prizepicks_v1_and_legacy_compat():
    app = create_app()
    client = TestClient(app)

    # Health endpoints
    r1 = client.get("/api/v1/prizepicks/health")
    r2 = client.get("/api/prizepicks/health")
    assert r1.status_code == 200
    assert r2.status_code == 200
    j1 = r1.json()
    j2 = r2.json()
    # Both should use the canonical envelope when available
    assert isinstance(j1, dict) and "success" in j1
    assert isinstance(j2, dict) and "success" in j2

    # Props endpoints should exist
    p1 = client.get("/api/v1/prizepicks/props")
    p2 = client.get("/api/prizepicks/props")
    assert p1.status_code == 200
    assert p2.status_code == 200
    jp1 = p1.json()
    jp2 = p2.json()

    # v1 should be canonical envelope with data.props or data['props']
    if isinstance(jp1, dict) and jp1.get("success") is True:
        data1 = jp1.get("data") or {}
    else:
        data1 = jp1

    # legacy may return raw shape or envelope; normalize
    if isinstance(jp2, dict) and jp2.get("success") is True:
        data2 = jp2.get("data") or {}
    else:
        data2 = jp2

    # Both should expose props list (maybe empty)
    props1 = data1.get("props") if isinstance(data1, dict) else None
    props2 = data2.get("props") if isinstance(data2, dict) else None

    assert props1 is not None or isinstance(data1, list)
    assert props2 is not None or isinstance(data2, list)

    # Recommendations endpoints
    r1 = client.get("/api/v1/prizepicks/recommendations")
    r2 = client.get("/api/prizepicks/recommendations")
    assert r1.status_code == 200
    assert r2.status_code == 200
    jr1 = r1.json()
    jr2 = r2.json()

    # Ensure types are lists or canonical envelopes wrapping lists
    def unwrap(resp):
        if isinstance(resp, dict) and resp.get("success") is True:
            return resp.get("data")
        return resp

    ur1 = unwrap(jr1)
    ur2 = unwrap(jr2)
    assert isinstance(ur1, (list, dict))
    assert isinstance(ur2, (list, dict))
