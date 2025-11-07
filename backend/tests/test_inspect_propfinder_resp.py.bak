def test_inspect_propfinder_response():
    from fastapi.testclient import TestClient

    from backend.core.app import create_app

    app = create_app()
    client = TestClient(app)
    resp = client.get("/api/propfinder/opportunities")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("success") is True
    payload = data.get("data")
    opportunities = payload.get("opportunities")
    assert isinstance(opportunities, list) and opportunities
    sample = opportunities[0]
    # Print diagnostic info to pytest stdout
    print("\nINSPECT sample type:", type(sample))
    print("INSPECT keys:", sorted(list(sample.keys())))
    print("INSPECT has_bookmakers_key:", "bookmakers" in sample)
    print("INSPECT bookmakers_get:", sample.get("bookmakers"))
    print("INSPECT sample repr:", sample)
