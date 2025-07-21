from datetime import datetime, timedelta

import jwt
from fastapi import HTTPException
from models.user_model import User  # Import if needed

from backend.config import config  # Use config.secret_key


def verify_token(token: str):
    try:
        payload = jwt.decode(token, config.secret_key, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id:
            user = get_user_by_id(
                user_id
            )  # Assuming a function to get user by ID exists
            if (
                user and not user.is_verified
            ):  # Check if user exists and needs verification
                return user  # Return the user object
            raise HTTPException(
                status_code=400, detail="User already verified or not found"
            )
        raise HTTPException(status_code=400, detail="Invalid token payload")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid token")
