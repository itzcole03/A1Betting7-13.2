from fastapi.testclient import TestClient

from backend.test_app import app


def test_register_endpoint_exists():
    client = TestClient(app)
    print("Registered routes:")
    for route in app.routes:
        print(route.path)
    response = client.options("/auth/register")
    assert (
        response.status_code != 404
    ), f"Endpoint /auth/register not found, got {response.status_code}"
    print("/auth/register endpoint exists!")
