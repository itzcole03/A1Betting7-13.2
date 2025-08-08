"""
Pydantic schemas for user management (modular monolith)
"""

from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    name: str
    is_active: bool = True
    is_verified: bool = False
    role: str = "user"
    preferences: Optional[Dict[str, Any]] = None


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserUpdate(BaseModel):
    name: Optional[str]
    email: Optional[EmailStr]
    preferences: Optional[Dict[str, Any]]


class UserResponse(UserBase):
    id: str
    created_at: datetime
