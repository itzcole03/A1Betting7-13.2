"""Idempotent seeding utilities for bookmaker registry."""

import logging
from typing import List

try:
    from sqlalchemy import select
    from sqlalchemy.exc import IntegrityError
    from sqlalchemy.orm import Session

    from backend.models.odds import INITIAL_BOOKMAKERS, Bookmaker

    SQLALCHEMY_AVAILABLE = True
except Exception:
    SQLALCHEMY_AVAILABLE = False

logger = logging.getLogger(__name__)


def seed_bookmakers_sync(session: Session) -> List[Bookmaker]:
    """Idempotently seed bookmakers using a synchronous SQLAlchemy Session.

    Returns the list of Bookmaker objects present after seeding.
    """
    if not SQLALCHEMY_AVAILABLE:
        logger.warning("SQLAlchemy or models not available - skipping sync seeding")
        return []

    names = [b["name"] for b in INITIAL_BOOKMAKERS]
    existing = (
        session.exec(select(Bookmaker).where(Bookmaker.name.in_(names))).scalars().all()
    )
    existing_names = {b.name for b in existing}

    to_add = []
    for b in INITIAL_BOOKMAKERS:
        if b["name"] not in existing_names:
            to_add.append(Bookmaker(**b))
        else:
            # Update metadata fields non-destructively
            for ex in existing:
                if ex.name == b["name"]:
                    changed = False
                    for k, v in b.items():
                        if hasattr(ex, k) and getattr(ex, k) != v:
                            setattr(ex, k, v)
                            changed = True
                    if changed:
                        session.add(ex)

    if to_add:
        session.add_all(to_add)
        try:
            session.commit()
        except IntegrityError:
            session.rollback()
            # Race: fetch again
    # Return current set
    return (
        session.exec(select(Bookmaker).where(Bookmaker.name.in_(names))).scalars().all()
    )


async def seed_bookmakers_async(async_session) -> List[Bookmaker]:
    """Async wrapper to seed bookmakers using an AsyncSession."""
    if not SQLALCHEMY_AVAILABLE:
        logger.warning("SQLAlchemy or models not available - skipping async seeding")
        return []
    existing: List[Bookmaker] = []

    async with async_session as session:
        result = await session.exec(select(Bookmaker))
        existing = result.all()
        existing_names = {b.name for b in existing}

        to_add = []
        for b in INITIAL_BOOKMAKERS:
            if b["name"] not in existing_names:
                to_add.append(Bookmaker(**b))
            else:
                for ex in existing:
                    if ex.name == b["name"]:
                        changed = False
                        for k, v in b.items():
                            if hasattr(ex, k) and getattr(ex, k) != v:
                                setattr(ex, k, v)
                                changed = True
                        if changed:
                            session.add(ex)

        if to_add:
            session.add_all(to_add)
            try:
                await session.commit()
            except IntegrityError:
                await session.rollback()

    # Return fresh list (from the session scope above)
    return existing
