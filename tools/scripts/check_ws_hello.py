from fastapi.testclient import TestClient
from backend.core.app import create_app


def main():
    app = create_app()
    client = TestClient(app)
    url = "/ws/client?client_id=test-123&version=1&role=frontend"
    with client.websocket_connect(url) as ws:
        msg = ws.receive_json()
        print("Received hello:")
        print(msg)


if __name__ == "__main__":
    main()
