import io

import pytest
from fastapi import FastAPI, Request

# Minimal local handler for BusinessLogicException
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from backend.exceptions.api_exceptions import BusinessLogicException
from backend.routes.admin import router as admin_router
from backend.routes.trending_suggestions import router as trending_router


def local_business_logic_exception_handler(
    request: Request, exc: BusinessLogicException
):
    return JSONResponse(
        status_code=200,
        content={
            "success": False,
            "data": None,
            "error": {
                "code": exc.error_code or "business_logic_error",
                "message": str(exc.detail),
            },
        },
    )


app = FastAPI()
app.include_router(admin_router)
app.include_router(trending_router)
app.add_exception_handler(
    BusinessLogicException, local_business_logic_exception_handler
)

client = TestClient(app)


def test_admin_rules_audit_log_success(monkeypatch):
    # Patch os.path.exists to True and open to return dummy log
    import os

    dummy_entry = {
        "user_id": "admin",
        "action": "add",
        "rule_id": "1",
        "timestamp": "2025-08-12T00:00:00Z",
    }
    monkeypatch.setattr(os.path, "exists", lambda path: True)
    file_content = str(dummy_entry).replace("'", '"') + "\n"

    def mock_open(path, mode, encoding=None):
        if "b" in mode:
            return io.BytesIO(file_content.encode())
        return io.StringIO(file_content)

    monkeypatch.setattr("builtins.open", mock_open)
    response = client.get(
        "/admin/rules-audit-log", headers={"Authorization": "Bearer admin-token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert data["error"] is None


def test_admin_rules_audit_log_error():
    # No auth header
    response = client.get("/admin/rules-audit-log")
    assert response.status_code == 403 or response.json()["success"] is False


def test_trending_suggestions_success(monkeypatch):
    # Patch service to return dummy list
    monkeypatch.setattr(
        "backend.services.trending_suggestions_service.get_trending_suggestions",
        lambda sport, limit: ["dummy suggestion"],
    )
    response = client.get("/trending-suggestions?sport=MLB&limit=1")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert data["error"] is None


def test_trending_suggestions_error(monkeypatch):
    # Patch service to raise error
    def raise_error(sport, limit):
        raise Exception("fail")

    monkeypatch.setattr(
        "backend.routes.trending_suggestions.get_trending_suggestions", raise_error
    )
    response = client.get("/trending-suggestions?sport=MLB&limit=1")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is False
    assert body["data"] is None
    assert body["error"] is not None
    assert "code" in body["error"]
    assert "message" in body["error"]
