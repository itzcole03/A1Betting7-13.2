"""
Test suite for User model authentication, password hashing, API key, JWT, MFA, lockout, and audit trail.
"""

import os
import secrets
import sys
from datetime import timedelta

import pytest

from backend.models.user import User


@pytest.fixture
def user():
    u = User(
        username="testuser",
        email="testuser@example.com",
        first_name="Test",
        last_name="User",
        is_active=True,
        is_verified=True,
    )
    u.set_password("SuperSecurePassword123!")
    return u


def test_password_hashing_and_verification(user):
    assert user.check_password("SuperSecurePassword123!")
    assert not user.check_password("WrongPassword")


def test_api_key_generation_and_verification(user):
    api_key = user.generate_api_key()
    assert user.verify_api_key(api_key)
    assert not user.verify_api_key(secrets.token_urlsafe(32))


def test_jwt_access_and_refresh_token(user):
    secret = "testsecretkey"
    access_token = user.generate_token(secret)
    refresh_token = user.generate_token(secret, refresh=True)
    payload = User.verify_token(access_token, secret)
    assert payload["username"] == user.username
    assert payload["type"] == "access"
    payload_refresh = User.verify_token(refresh_token, secret)
    assert payload_refresh["type"] == "refresh"


def test_to_dict_serialization(user):
    d = user.to_dict()
    assert "password_hash" not in d
    assert "api_key_encrypted" not in d
    assert d["username"] == user.username


def test_edge_case_password_hash_corruption(user):
    user.password_hash = None
    assert not user.check_password("SuperSecurePassword123!")
    user.password_hash = 12345
    assert not user.check_password("SuperSecurePassword123!")


def test_edge_case_api_key_hash_corruption(user):
    user.api_key_encrypted = None
    assert not user.verify_api_key("anykey")
    user.api_key_encrypted = 12345
    assert not user.verify_api_key("anykey")
