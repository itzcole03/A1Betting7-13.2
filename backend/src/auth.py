import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

# Optional JWT import
try:
    import jwt  # type: ignore

    HAS_JWT = True
except ImportError:
    jwt = None  # type: ignore
    HAS_JWT = False  # type: ignore

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

SECRET_KEY = os.getenv("JWT_SECRET", "fallback-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

auth_router = APIRouter()

# Real database integration
try:
    from database import SessionLocal  # type: ignore
    from models.user import User as UserModel  # type: ignore

    has_real_db = True
except ImportError:
    SessionLocal = None
    UserModel = None
    has_real_db = False


class User(BaseModel):
    id: str
    username: str
    email: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: User


def verify_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    """Verify user credentials using real database."""
    if has_real_db and SessionLocal is not None and UserModel is not None:
        db = SessionLocal()
        try:
            user = db.query(UserModel).filter(UserModel.username == username).first()
            if user and user.verify_password(password):
                return {
                    "id": str(user.id),
                    "username": user.username,
                    "email": user.email,
                }
        except (AttributeError, ImportError) as e:
            print(f"Database error: {e}")
        finally:
            db.close()
    return None


@auth_router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends()) -> Dict[str, Any]:
    if not HAS_JWT or jwt is None:
        raise HTTPException(status_code=500, detail="JWT not available")

    user = verify_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": user["username"], "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)  # type: ignore
    return {
        "access_token": encoded_jwt,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
        },
    }
