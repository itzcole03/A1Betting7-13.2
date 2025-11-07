"""Minimal shim for simple enhanced API setup used in tests.

This module provides `setup_simple_enhanced_api(app)` which registers a
small set of lightweight routes and returns True on success. Keep the
implementation intentionally simple to avoid heavy optional deps and to
prevent import-time side effects during test collection.
"""
from typing import Any
import logging

from fastapi import FastAPI, APIRouter

logger = logging.getLogger("backend.simple_enhanced_setup")


def create_simple_enhanced_routes() -> APIRouter:
    router = APIRouter()

    @router.get("/v1/simple-test")
    async def simple_test():
        return {"status": "simple-test-ok"}

    @router.get("/v1/system/health")
    async def v1_health():
        return {"status": "healthy", "source": "simple_enhanced_setup"}

    return router


def setup_simple_enhanced_api(app: FastAPI) -> bool:
    """Register minimal enhanced routes on the provided FastAPI `app`.

    Returns True on success. Do not perform expensive initialization here.
    """
    try:
        router = create_simple_enhanced_routes()
        app.include_router(router)
        logger.info("simple_enhanced_setup: routes included")
        return True
    except Exception as e:
        logger.exception("simple_enhanced_setup: failed to register routes: %s", e)
        return False


__all__ = ["create_simple_enhanced_routes", "setup_simple_enhanced_api"]
