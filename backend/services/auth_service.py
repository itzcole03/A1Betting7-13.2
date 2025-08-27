from __future__ import annotations

import asyncio
import hashlib
import hmac
import time
from typing import Dict, Optional


class AuthService:
    def __init__(self):
        # In-memory user store: email -> user dict
        self._users: Dict[str, Dict] = {}

    async def register(self, email: str, password: str, first_name: str = "", last_name: str = "") -> Dict:
        await asyncio.sleep(0)
        if email in self._users:
            raise ValueError("User already exists")
        # store simple hashed password
        pw_hash = hashlib.sha256(password.encode()).hexdigest()
        user = {
            "email": email,
            "password": pw_hash,
            "first_name": first_name,
            "last_name": last_name,
            "id": email,
            "is_verified": False,
        }
        self._users[email] = user
        return {"user": {"email": email, "first_name": first_name, "last_name": last_name, "id": email}}

    async def authenticate(self, email: str, password: str) -> Dict:
        await asyncio.sleep(0)
        user = self._users.get(email)
        if not user:
            raise ValueError("Invalid credentials")
        pw_hash = hashlib.sha256(password.encode()).hexdigest()
        if not hmac.compare_digest(pw_hash, user["password"]):
            raise ValueError("Invalid credentials")
        # Generate deterministic tokens
        ts = int(time.time())
        access = f"access-{email}-{ts}"
        refresh = f"refresh-{email}-{ts}"
        return {
            "access_token": access,
            "refresh_token": refresh,
            "token_type": "bearer",
            "user": {"email": email, "id": email, "first_name": user.get("first_name"), "last_name": user.get("last_name")},
        }

    async def refresh(self, token: str) -> Dict:
        await asyncio.sleep(0)
        # Accept refresh tokens that start with 'refresh-'
        if not token or not token.startswith("refresh-"):
            raise ValueError("Invalid refresh token")
        # extract email if possible
        parts = token.split("-")
        if len(parts) < 2:
            raise ValueError("Invalid refresh token")
        email = parts[1]
        if email not in self._users:
            raise ValueError("Unknown user")
        ts = int(time.time())
        new_access = f"access-{email}-{ts}"
        new_refresh = f"refresh-{email}-{ts}"
        return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}

    async def me(self, token: str) -> Dict:
        await asyncio.sleep(0)
        if not token:
            raise ValueError("Missing token")
        # token expected format: access-<email>-<ts>
        parts = token.split("-")
        if len(parts) < 2:
            raise ValueError("Invalid token")
        email = parts[1]
        user = self._users.get(email)
        if not user:
            raise ValueError("User not found")
        # return public user info
        return {"email": user["email"], "first_name": user.get("first_name"), "last_name": user.get("last_name"), "id": user["id"]}

    async def change_password(self, token: str, current_password: Optional[str], new_password: str) -> None:
        """Change a user's password (development in-memory store).

        Args:
            token: access token issued by `authenticate` (format: access-<email>-<ts>)
            current_password: current plaintext password (optional if admin reset)
            new_password: new plaintext password to set

        Raises:
            ValueError: if token invalid, user not found, or current password mismatch
        """
        await asyncio.sleep(0)
        if not token:
            raise ValueError("Missing token")
        parts = token.split("-")
        if len(parts) < 2:
            raise ValueError("Invalid token")
        email = parts[1]
        user = self._users.get(email)
        if not user:
            raise ValueError("User not found")

        # If current_password provided, verify it matches
        if current_password:
            curr_hash = hashlib.sha256(current_password.encode()).hexdigest()
            if not hmac.compare_digest(curr_hash, user["password"]):
                raise ValueError("Invalid current password")

        # Set new password
        new_hash = hashlib.sha256(new_password.encode()).hexdigest()
        user["password"] = new_hash
        # persist back into store
        self._users[email] = user

    async def change_password_by_credentials(self, email: str, current_password: str, new_password: str) -> None:
        """Change password by verifying current credentials. Dev-only helper."""
        await asyncio.sleep(0)
        user = self._users.get(email)
        if not user:
            raise ValueError("User not found")
        curr_hash = hashlib.sha256(current_password.encode()).hexdigest()
        if not hmac.compare_digest(curr_hash, user["password"]):
            raise ValueError("Invalid current password")
        new_hash = hashlib.sha256(new_password.encode()).hexdigest()
        user["password"] = new_hash
        self._users[email] = user


# Singleton instance used by other modules
_auth_service = AuthService()


def get_auth_service() -> AuthService:
    return _auth_service

# Dev-only: pre-seed a known user for local testing if not present
try:
    import hashlib as _hashlib

    _seed_email = "ncr@a1betting.com"
    _seed_password = "A1Betting1337!"
    if _seed_email not in _auth_service._users:
        _auth_service._users[_seed_email] = {
            "email": _seed_email,
            "password": _hashlib.sha256(_seed_password.encode()).hexdigest(),
            "first_name": "NCR",
            "last_name": "User",
            "id": _seed_email,
            "is_verified": True,
        }
except Exception:
    pass
