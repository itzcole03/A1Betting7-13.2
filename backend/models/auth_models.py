"""Authentication models."""

from pydantic import BaseModel, EmailStr
from typing import Optional

class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str


# Added missing RefreshTokenRequest model for /auth/refresh endpoint


class RefreshTokenRequest(BaseModel):
    refreshToken: str


# --- Additional missing models for test compatibility ---
class AuthResponse(BaseModel):
    user: UserProfile
    token: str
    refreshToken: str


# PrizePicks Models
