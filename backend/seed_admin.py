"""
Seed the database with the default admin user for A1Betting.
"""

import asyncio

from backend.auth.user_service import SessionLocal, User, UserService
from backend.models.api_models import UserRegistration


def seed_admin():
    session = SessionLocal()
    user_service = UserService(session)
    admin_email = "ncr@a1betting.com"
    admin_username = "admin"
    admin_password = "A1Betting1337!"
    admin_first_name = "A1"
    admin_last_name = "Admin"

    # Check if admin already exists
    existing = (
        session.query(User)
        .filter((User.username == admin_username) | (User.email == admin_email))
        .first()
    )
    if existing:
        print("Admin user already exists.")
        return

    user_data = UserRegistration(
        username=admin_username,
        email=admin_email,
        password=admin_password,
        first_name=admin_first_name,
        last_name=admin_last_name,
    )
    user_service.create_user(user_data)
    print("Admin user created.")


if __name__ == "__main__":
    seed_admin()
