"""Domain bootstrap helpers for the consolidated API architecture."""

from __future__ import annotations

import inspect
import logging
import os
from typing import Any, Callable, Dict, List, Optional

from fastapi import FastAPI

logger = logging.getLogger(__name__)


def _parse_flag(value: Optional[str]) -> Optional[bool]:
    if value is None:
        return None
    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off", ""}:
        return False
    return None


def _should_enable_domain_api(settings: Any) -> bool:
    explicit = _parse_flag(os.getenv("APP_ENABLE_DOMAIN_API"))
    if explicit is not None:
        return explicit

    disable_flag = _parse_flag(os.getenv("APP_DISABLE_DOMAIN_API"))
    if disable_flag is True:
        return False

    try:
        return not getattr(settings.app, "dev_lean_mode", False)
    except Exception:
        return True


def setup_domain_architecture(
    app: FastAPI,
    settings: Any,
    startup_funcs: List[Callable[[], Any]],
    shutdown_funcs: List[Callable[[], Any]],
) -> None:
    """Attach consolidated domain routers and lifecycle hooks to the canonical app."""

    if not _should_enable_domain_api(settings):
        logger.info("Domain architecture disabled by configuration")
        return

    try:
        from domains import DOMAIN_ROUTERS, DOMAIN_SERVICES
        from domains.database import SchemaManager, cache_service
    except ImportError as exc:  # pragma: no cover - defensive import guard
        logger.warning("Domain architecture modules unavailable: %s", exc)
        return

    if getattr(app.state, "domain_architecture_registered", False):
        logger.debug("Domain architecture already registered; skipping setup")
        return

    for domain_name, router in DOMAIN_ROUTERS.items():
        try:
            app.include_router(router)
            logger.info("Registered consolidated router for domain '%s'", domain_name)
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.error(
                "Failed to register router for domain '%s': %s", domain_name, exc
            )

    async def _startup() -> None:
        logger.info("Initializing consolidated domain services")
        services: Dict[str, Any] = {}
        schema_manager = None
        cache = cache_service

        raw_database_url = (
            getattr(getattr(settings, "database", None), "database_url", None)
            or os.getenv("DATABASE_URL")
            or "sqlite:///./a1betting.db"
        )
        # SchemaManager expects sync drivers; strip async prefixes if present.
        if "+" in raw_database_url:
            driver, remainder = raw_database_url.split("+", 1)
            if "://" in remainder:
                raw_database_url = f"{driver}://{remainder.split('://', 1)[1]}"

        try:
            schema_manager = SchemaManager(raw_database_url)
            schema_manager.initialize()
            logger.info("Domain schema manager initialized")
        except Exception as exc:
            logger.error("Schema manager initialization failed: %s", exc)
            schema_manager = None

        try:
            initializer = getattr(cache, "initialize", None)
            if callable(initializer):
                init_result = initializer()
                if inspect.isawaitable(init_result):
                    await init_result
            logger.info("Domain cache service initialized")
        except Exception as exc:
            logger.error("Cache initialization failed: %s", exc)

        for domain_name, service_cls in DOMAIN_SERVICES.items():
            instance = None
            try:
                kwargs: Dict[str, Any] = {}
                init_signature = inspect.signature(service_cls.__init__)
                if (
                    "schema_manager" in init_signature.parameters
                    and schema_manager is not None
                ):
                    kwargs["schema_manager"] = schema_manager
                if "cache_service" in init_signature.parameters:
                    kwargs["cache_service"] = cache
                instance = service_cls(**kwargs)
            except Exception as exc:
                logger.exception(
                    "Failed to construct service '%s': %s", domain_name, exc
                )
                instance = None

            if instance is None:
                services[domain_name] = None
                continue

            initializer = getattr(instance, "initialize", None)
            if callable(initializer):
                try:
                    init_result = initializer()
                    if inspect.isawaitable(init_result):
                        await init_result
                except Exception as exc:
                    logger.error(
                        "Initialization failed for domain service '%s': %s",
                        domain_name,
                        exc,
                    )
            services[domain_name] = instance

        app.state.domain_services = services
        app.state.domain_schema_manager = schema_manager
        app.state.domain_cache_service = cache
        app.state.domain_architecture_registered = True
        logger.info("Domain services initialized (%d registered)", len(services))

    async def _shutdown() -> None:
        logger.info("Shutting down consolidated domain services")
        services: Dict[str, Any] = getattr(app.state, "domain_services", {}) or {}
        for domain_name, service in services.items():
            if service is None:
                continue
            cleanup = getattr(service, "cleanup", None)
            if not callable(cleanup):
                continue
            try:
                cleanup_result = cleanup()
                if inspect.isawaitable(cleanup_result):
                    await cleanup_result
            except Exception as exc:
                logger.warning(
                    "Cleanup failed for domain service '%s': %s", domain_name, exc
                )

        cache = getattr(app.state, "domain_cache_service", None)
        if cache and hasattr(cache, "shutdown"):
            try:
                shutdown_result = cache.shutdown()
                if inspect.isawaitable(shutdown_result):
                    await shutdown_result
            except Exception as exc:
                logger.warning("Cache service shutdown failed: %s", exc)

        schema_manager = getattr(app.state, "domain_schema_manager", None)
        engine = getattr(schema_manager, "engine", None)
        if engine is not None:
            try:
                engine.dispose()
            except Exception as exc:
                logger.warning("Schema manager engine disposal failed: %s", exc)

        app.state.domain_architecture_registered = False

    startup_funcs.append(_startup)
    shutdown_funcs.append(_shutdown)
