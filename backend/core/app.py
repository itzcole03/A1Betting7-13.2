
"""
A1Betting Core App Instance
Contains FastAPI app creation, config loading, and DB setup for modular monolith architecture.
"""


import logging
from pathlib import Path
from fastapi import FastAPI

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent.parent / ".env"
    load_dotenv(dotenv_path=env_path, override=True)
except ImportError:
    pass


# Structured logging setup
try:
    from backend.utils.structured_logging import app_logger

    logger = app_logger  # type: ignore
except ImportError:
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)


# App factory (can be extended for test/dev/prod)
def create_app() -> FastAPI:

    _app = FastAPI(title="A1Betting API", version="1.0.0")
    logger.info("✅ Core FastAPI app instance created")

    # Import and mount versioned routers
    from backend.auth.routes import router as auth_router
    from backend.users.routes import router as users_router

    _app.include_router(auth_router)
    _app.include_router(users_router)

    # DB and config setup can be added here as modules are refactored in
    return _app


core_app = create_app()
