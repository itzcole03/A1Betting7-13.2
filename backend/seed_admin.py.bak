"""Utilities to seed the default admin account into the database."""

import asyncio

from backend.services.auth_service import get_auth_service

ADMIN_EMAIL = "ncr@a1betting.com"
ADMIN_PASSWORD = "A1Betting1337!"
ADMIN_FIRST_NAME = "A1"
ADMIN_LAST_NAME = "Admin"


async def seed_admin_async() -> None:
    service = get_auth_service()
    try:
        await service.register(
            email=ADMIN_EMAIL,
            password=ADMIN_PASSWORD,
            first_name=ADMIN_FIRST_NAME,
            last_name=ADMIN_LAST_NAME,
        )
    except ValueError:
        print("Admin user already exists.")
        return

    print("Admin user created.")


def seed_admin() -> None:
    asyncio.run(seed_admin_async())


if __name__ == "__main__":
    seed_admin()
