import asyncio

import anyio
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker
from sqlmodel import Session

from backend.database import sync_engine
from backend.main import app
from backend.models.user import User


@pytest.fixture(autouse=True)
def clear_users_table():
    from sqlmodel import delete

    with Session(sync_engine) as db:
        db.exec(delete(User))
        db.commit()


def test_register_and_login():
    client = TestClient(app)
    # Register user
    reg_payload = {
        "username": "asyncuser",
        "email": "asyncuser@example.com",
        "first_name": "Async",
        "last_name": "User",
        "password": "AsyncPassword123!",
    }
    reg_resp = client.post("/auth/register", json=reg_payload)
    assert reg_resp.status_code == 200
    reg_data = reg_resp.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["username"] == "asyncuser"

    # Login user
    login_payload = {"username": "asyncuser", "password": "AsyncPassword123!"}
    login_resp = client.post("/auth/login", json=login_payload)
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert "access_token" in login_data
    assert login_data["user"]["username"] == "asyncuser"

    # Get profile
    headers = {"Authorization": f"Bearer {login_data['access_token']}"}
    profile_resp = client.get("/auth/me", headers=headers)
    assert profile_resp.status_code == 200
    profile_data = profile_resp.json()
    assert profile_data["username"] == "asyncuser"


def test_register_duplicate():
    client = TestClient(app)
    reg_payload = {
        "username": "asyncuser",
        "email": "asyncuser@example.com",
        "first_name": "Async",
        "last_name": "User",
        "password": "AsyncPassword123!",
    }
    # First registration
    client.post("/auth/register", json=reg_payload)
    # Duplicate registration
    dup_resp = client.post("/auth/register", json=reg_payload)
    assert dup_resp.status_code == 400
    assert (
        "Username already registered" in dup_resp.text
        or "Email already registered" in dup_resp.text
    )
