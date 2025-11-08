    """
    Canonical app factory - THE ONLY way to create the A1Betting application.
    All production integrations are consolidated here.
    """
    # Ensure logger is accessible in function scope
    global logger

    logger.info("Creating A1Betting canonical app...")
    # Check lean mode early
    from backend.config.settings import get_settings

    settings = get_settings()
    is_lean_mode = settings.app.dev_lean_mode

    if is_lean_mode:
        logger.info("[LeanMode] Reduced middleware profile active")

    # Create the FastAPI app
    _app = FastAPI(
        title="A1Betting API",
        version="1.0.0",
        description="A1Betting Sports Analysis Platform - Canonical Entry Point",
    )

    # Capture on_event-decorated startup/shutdown functions and run them
    # via a lifespan context manager to avoid FastAPI's on_event deprecation
    # warnings while preserving the existing inline decorators used below.
    startup_funcs = []
    shutdown_funcs = []

    def _capture_on_event(event_type: str):
        def _decorator(fn):
            try:
                if event_type == "startup":
                    startup_funcs.append(fn)
                elif event_type == "shutdown":
                    shutdown_funcs.append(fn)
            except Exception:
                # Best-effort: don't break app creation if capture fails
                logger.debug(
                    "Failed to capture on_event function: %s",
                    getattr(fn, "__name__", str(fn)),
                )
            return fn

        return _decorator

    # Monkeypatch _app.on_event to the capture decorator so subsequent
    # @_app.on_event("startup") / @_app.on_event("shutdown") usages
    # append to our lists instead of registering directly. We'll execute
    # the captured functions inside a lifespan context created later.
    _app.on_event = lambda et: _capture_on_event(et)

    # Register consolidated domain routers and lifecycle hooks when enabled.
    try:
        setup_domain_architecture(_app, settings, startup_funcs, shutdown_funcs)
    except Exception as exc:
        logger.warning("Domain architecture bootstrap skipped: %s", exc)
    # Lightweight dev flag to disable heavy startup hooks that can hang locally
    try:
        _disable_startup_hooks = str(
            os.getenv("DISABLE_STARTUP_HOOKS", "false")
        ).lower() in {"1", "true", "yes", "on"}
    except Exception:
        _disable_startup_hooks = False
    # ENV FLAG DOCS (non-invasive):
    # POSITIVE_EV_FEED_DISABLED=1 → disables all /api/ev/feed* (+EV feed, search, stats, forecast)
    #   Health endpoint /api/ev/health remains available for monitoring.
    #   Used in tests / CI to short-circuit heavy generation logic.
    # Ingestion admin routes (run-once / backfill)
    try:
        from backend.routes.ingestion_routes import router as ingestion_router

        _app.include_router(ingestion_router)
        logger.info("Ingestion admin routes included (/api/ingestion)")
    except ImportError as e:
        logger.info(f"Ingestion routes not available: {e}")
    except Exception as e:
        logger.error(f"Failed to register ingestion routes: {e}")

    # Include ingestion admin routes (separate module)
    try:
        from backend.routes.ingestion_admin_routes import (
            router as ingestion_admin_router,
        )