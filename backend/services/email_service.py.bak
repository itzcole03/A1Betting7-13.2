from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any

import jwt

from backend.config import config


def send_verification_email(email: str, token: str) -> None:
    """Send verification email to user
    
    Args:
        email: Email address to send verification to
        token: JWT verification token
        
    Note:
        This is currently a simulation. Replace with real email logic in production.
    """
    # Simulate sending an email (replace with real email logic)
    logging.info(f"Sending verification email to {email} with token: {token}")
    # In production, send an actual email with a verification link


def generate_verification_token(user_id: str) -> str:
    """Generate JWT verification token for email verification
    
    Args:
        user_id: Unique user identifier
        
    Returns:
        JWT token string valid for 24 hours
    """
    payload: Dict[str, Any] = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "type": "email_verification",
    }
    token: str = jwt.encode(payload, config.secret_key, algorithm="HS256")
    return token
