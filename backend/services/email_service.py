import logging
from datetime import datetime, timedelta, timezone

import jwt

from backend.config import config


def send_verification_email(email: str, token: str):
    # Simulate sending an email (replace with real email logic)
    logging.info(f"Sending verification email to {email} with token: {token}")
    # In production, send an actual email with a verification link


def generate_verification_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "type": "email_verification",
    }
    token = jwt.encode(payload, config.secret_key, algorithm="HS256")
    return token
