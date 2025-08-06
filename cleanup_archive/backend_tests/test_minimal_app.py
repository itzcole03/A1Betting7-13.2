import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import sqlite3

import pytest
from fastapi.testclient import TestClient
from minimal_test_app import app


# Ensure tables exist before any tests run
def ensure_tables():
    with sqlite3.connect("users.db") as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT,
                first_name TEXT,
                last_name TEXT,
                hashed_password TEXT NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                is_verified BOOLEAN DEFAULT 0,
                created_at TEXT,
                updated_at TEXT,
                last_login TEXT,
                risk_tolerance TEXT,
                preferred_stake REAL,
                bookmakers TEXT,
                settings TEXT
            );
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS markets (
                id INTEGER PRIMARY KEY,
                sport TEXT,
                event TEXT,
                selections TEXT,
                odds REAL,
                status TEXT,
                updated_at TEXT
            );
            """
        )
        conn.commit()


ensure_tables()

client = TestClient(app)

# --- Registration Tests ---
import uuid


def test_register_valid():
    unique_username = f"testuser_{uuid.uuid4().hex[:8]}"
    resp = client.post(
        "/register", json={"username": unique_username, "password": "abc12345"}
    )
    assert resp.status_code == 200
    assert resp.json()["message"] == "User registered successfully"


def test_register_short_password():
    resp = client.post("/register", json={"username": "testuser2", "password": "abc12"})
    assert resp.status_code == 400
    assert "Password must be at least 8 characters" in resp.json()["detail"]


def test_register_weak_password():
    resp = client.post(
        "/register", json={"username": "testuser3", "password": "abcdefgh"}
    )
    assert resp.status_code == 400
    assert "Password must contain both letters and numbers" in resp.json()["detail"]


def test_register_duplicate():
    client.post("/register", json={"username": "testuser4", "password": "abc12345"})
    resp = client.post(
        "/register", json={"username": "testuser4", "password": "abc12345"}
    )
    assert resp.status_code == 400
    assert "Username already exists" in resp.json()["detail"]


# --- Login Tests ---
def test_login_valid():
    client.post("/register", json={"username": "testuser5", "password": "abc12345"})
    resp = client.post("/token", data={"username": "testuser5", "password": "abc12345"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_invalid_password():
    client.post("/register", json={"username": "testuser6", "password": "abc12345"})
    resp = client.post(
        "/token", data={"username": "testuser6", "password": "wrongpass"}
    )
    assert resp.status_code == 401
    assert "Invalid username or password" in resp.json()["detail"]


# --- Payment Tests ---
def test_deposit_valid():
    client.post("/register", json={"username": "testuser7", "password": "abc12345"})
    token = client.post(
        "/token", data={"username": "testuser7", "password": "abc12345"}
    ).json()["access_token"]
    resp = client.post(
        "/payments/deposit",
        json={"amount": 100},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["type"] == "deposit"


def test_deposit_negative():
    client.post("/register", json={"username": "testuser8", "password": "abc12345"})
    token = client.post(
        "/token", data={"username": "testuser8", "password": "abc12345"}
    ).json()["access_token"]
    resp = client.post(
        "/payments/deposit",
        json={"amount": -50},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 400
    assert "Deposit amount must be positive" in resp.json()["detail"]


def test_withdraw_valid():
    client.post("/register", json={"username": "testuser9", "password": "abc12345"})
    token = client.post(
        "/token", data={"username": "testuser9", "password": "abc12345"}
    ).json()["access_token"]
    resp = client.post(
        "/payments/withdraw",
        json={"amount": 50},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["type"] == "withdraw"


def test_withdraw_zero():
    client.post("/register", json={"username": "testuser10", "password": "abc12345"})
    token = client.post(
        "/token", data={"username": "testuser10", "password": "abc12345"}
    ).json()["access_token"]
    resp = client.post(
        "/payments/withdraw",
        json={"amount": 0},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 400
    assert "Withdraw amount must be positive" in resp.json()["detail"]


# --- Betting Tests ---
def test_place_bet_valid():
    client.post("/register", json={"username": "testuser11", "password": "abc12345"})
    token = client.post(
        "/token", data={"username": "testuser11", "password": "abc12345"}
    ).json()["access_token"]
    resp = client.post(
        "/social/group_bet",
        json={"group_id": 1, "market_id": 1, "selection": "TeamA", "stake": 10},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"


def test_place_bet_invalid_stake():
    client.post("/register", json={"username": "testuser12", "password": "abc12345"})
    token = client.post(
        "/token", data={"username": "testuser12", "password": "abc12345"}
    ).json()["access_token"]
    resp = client.post(
        "/social/group_bet",
        json={"group_id": 1, "market_id": 1, "selection": "TeamA", "stake": 0},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 422  # Pydantic validation error for stake <= 0


def test_markets():
    resp = client.get("/markets")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1
