import time
import hmac
import hashlib
import secrets
from typing import Dict, Optional

class AuthServiceShim:
    """Lightweight in-memory auth shim for tests.

    Provides async-compatible methods: register, authenticate, refresh, me.
    Tokens are simple HMAC'd strings with embedded user id for deterministic testing.
    """

    def __init__(self):
        self._users: Dict[str, Dict] = {}
        self._sessions: Dict[str, Dict] = {}
        self._secret = secrets.token_hex(16)

    async def register(self, email: str, password: str, first_name: str = "", last_name: str = "") -> Dict:
        if email in self._users:
            raise ValueError("User already exists")
        pw_hash = hashlib.sha256(password.encode()).hexdigest()
        user = {"email": email, "password": pw_hash, "first_name": first_name, "last_name": last_name, "id": email}
        self._users[email] = user
        return {"user": {"email": email, "first_name": first_name, "last_name": last_name, "id": email}}

    async def authenticate(self, email: str, password: str) -> Dict:
        user = self._users.get(email)
        if not user:
            raise ValueError("Invalid credentials")
        pw_hash = hashlib.sha256(password.encode()).hexdigest()
        if not hmac.compare_digest(pw_hash, user["password"]):
            raise ValueError("Invalid credentials")

        now = int(time.time())
        access_token = self._make_token(email, "access", now)
        refresh_token = self._make_token(email, "refresh", now)

        session = {"user_id": email, "access_token": access_token, "refresh_token": refresh_token, "created_at": now}
        self._sessions[refresh_token] = session

        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer", "user": {"email": email, "id": email}}

    async def change_password(self, email: str, current_password: str, new_password: str) -> bool:
        user = self._users.get(email)
        if not user:
            raise ValueError("User not found")
        pw_hash = hashlib.sha256(current_password.encode()).hexdigest()
        if not hmac.compare_digest(pw_hash, user["password"]):
            raise ValueError("Invalid current password")
        if len(new_password) < 6:
            raise ValueError("New password too weak")
        user["password"] = hashlib.sha256(new_password.encode()).hexdigest()
        return True

    async def reset_password(self, email: str) -> bool:
        # Simulate sending reset email; always succeed (idempotent)
        if email not in self._users:
            return True
        # generate temporary token stored as a session (for tests we keep simple)
        token = self._make_token(email, "reset", int(time.time()))
        self._sessions[token] = {"user_id": email, "reset": True}
        return True

    async def verify_email(self, token: str) -> bool:
        # Our simplistic tokens embed email at start
        try:
            parts = token.split(";")
            email = parts[0]
            if email in self._users:
                self._users[email]["verified"] = True
                return True
            return False
        except Exception:
            return False

    async def update_profile(self, email: str, first_name: Optional[str], last_name: Optional[str]) -> Dict:
        user = self._users.get(email)
        if not user:
            raise ValueError("User not found")
        if first_name is not None:
            user["first_name"] = first_name
        if last_name is not None:
            user["last_name"] = last_name
        return {"email": user["email"], "first_name": user.get("first_name"), "last_name": user.get("last_name"), "id": user["id"]}

    async def refresh(self, refresh_token: str) -> Dict:
        session = self._sessions.get(refresh_token)
        if not session:
            raise ValueError("Invalid refresh token")
        email = session["user_id"]
        now = int(time.time())
        new_access = self._make_token(email, "access", now)
        # keep same refresh token for simplicity
        session["access_token"] = new_access
        return {"access_token": new_access, "refresh_token": refresh_token, "token_type": "bearer"}

    async def me(self, token: str) -> Dict:
        # Accept either access or refresh tokens
        # Extract email from token by splitting
        try:
            parts = token.split(";")
            if len(parts) < 2:
                raise ValueError("Invalid token")
            email = parts[0]
            user = self._users.get(email)
            if not user:
                raise ValueError("User not found")
            return {"email": user["email"], "first_name": user.get("first_name"), "last_name": user.get("last_name"), "id": user["id"]}
        except Exception:
            raise ValueError("Invalid token")

    def _make_token(self, email: str, ttype: str, ts: int) -> str:
        payload = f"{email};{ttype};{ts}"
        sig = hmac.new(self._secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
        return f"{payload};{sig}"


# Module-level instance for easy import
auth_service_shim = AuthServiceShim()
