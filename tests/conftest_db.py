import os
import pytest

# Ensure tests use TESTING mode
os.environ.setdefault("TESTING", "true")


@pytest.fixture(scope="session", autouse=True)
def initialize_test_database():
    """Session-scoped fixture to import all models and initialize the test DB.

    This ensures SQLAlchemy Base.metadata contains all table definitions before
    running create_all(), avoiding ForeignKey missing-table errors caused by
    import-ordering.
    """
    # Import model modules in a deterministic order. Keep this list minimal
    # and explicit to ensure dependent tables are registered before callers.
    from backend.models.base import Base  # noqa: F401

    # Import core models that other models reference first
    try:
        # Import match first since other tables reference it
        from backend.models.match import Match  # noqa: F401
    except Exception:
        # Best-effort import; continue so tests can still run and reveal errors
        pass

    # Import commonly used models
    try:
        from backend.models.user import User  # noqa: F401
        from backend.models.bet import Bet  # noqa: F401
    except Exception:
        pass

    # Import any remaining models via the all_models registry which imports
    # a curated subset intended for Alembic and test harnesses.
    try:
        from backend.models import all_models  # noqa: F401
    except Exception:
        pass

    # Initialize the database service and create tables
    from backend.services.database_service import initialize_database_for_tests

    svc = initialize_database_for_tests(create_if_missing=True)

    yield svc

    # Teardown: best-effort cleanup of the test DB file (file-backed SQLite)
    try:
        # Only remove the test DB file if it exists and is the test DB
        db_path = os.path.abspath("./a1betting_test.db")
        if os.path.exists(db_path):
            try:
                os.remove(db_path)
            except Exception:
                # If we can't remove the file (locked on Windows), ignore.
                pass
    except Exception:
        pass
import os
import pytest

# Ensure tests run in TESTING mode
os.environ.setdefault("TESTING", "true")


@pytest.fixture(scope="session", autouse=True)
def initialize_test_database():
    """Import all model modules and initialize the test database schema.

    This fixture runs once per test session before any tests execute. It
    imports project model modules so SQLAlchemy `Base` metadata includes
    all tables, then calls the helper in `backend.services.database_service`
    to create the tables. Tests can override or use their own DB fixtures
    after this runs.
    """
    try:
        # Import models so their Table objects are registered on metadata
        # Adjust these imports if your project keeps models in different modules
        from backend.models import users, matches, bets, props  # type: ignore
    except Exception:
        # Best-effort import; tests that need specific models can import them
        pass

    try:
        from backend.services.database_service import initialize_database_for_tests

        initialize_database_for_tests(create_if_missing=True)
    except Exception:
        # If initialization fails, allow tests to proceed so they can
        # control initialization themselves; re-raise if you prefer strictness
        pass
import os
import asyncio
import tempfile
from typing import AsyncGenerator

import pytest

# Default to an async in-memory SQLite URL. If SQLModel/SQLAlchemy are
# available we prefer a file-backed temporary SQLite DB so both async and
# sync fixtures can access the same database during tests.
DEFAULT_ASYNC_INMEMORY = "sqlite+aiosqlite:///:memory:"
requested = os.environ.get("TEST_DATABASE_URL")

try:
    # If SQLModel and async SQLAlchemy are available, create a temp file DB
    # path and use a file-backed SQLite URL that is compatible with both
    # sync `create_engine` and async `create_async_engine`.
    from sqlmodel import SQLModel
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine, AsyncSession
    from sqlalchemy.orm import sessionmaker

    if requested:
        TEST_DATABASE_URL = requested
    else:
        # Create a temporary file to act as the database so sync/async engines
        # can both open the same file-backed DB during tests.
        tf = tempfile.NamedTemporaryFile(prefix="test_db_", suffix=".sqlite", delete=False)
        tf.close()
        db_path = tf.name
        # Async URL (aiosqlite) and set the env var for other modules
        TEST_DATABASE_URL = f"sqlite+aiosqlite:///{db_path}"

    os.environ.setdefault("DATABASE_URL", TEST_DATABASE_URL)

    engine: AsyncEngine = create_async_engine(os.environ["DATABASE_URL"], echo=False, future=True)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    @pytest.fixture(scope="session")
    def event_loop():
        loop = asyncio.get_event_loop_policy().new_event_loop()
        yield loop
        loop.close()

    @pytest.fixture(scope="session")
    async def create_test_db() -> None:
        # create all tables defined via SQLModel metadata
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
        yield
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.drop_all)
        # If we created a temporary DB file, remove it after tests
        try:
            if not requested:
                os.unlink(db_path)
        except Exception:
            pass

    @pytest.fixture()
    async def db_session(create_test_db) -> AsyncGenerator[AsyncSession, None]:
        async with AsyncSessionLocal() as session:
            yield session

except Exception:
    # SQLModel or async SQLAlchemy not available. Provide compatibility fixtures
    # that do minimal environment setup so tests don't crash at import time.

    TEST_DATABASE_URL = requested or DEFAULT_ASYNC_INMEMORY
    os.environ.setdefault("DATABASE_URL", TEST_DATABASE_URL)

    @pytest.fixture(scope="session")
    def event_loop():
        loop = asyncio.get_event_loop_policy().new_event_loop()
        yield loop
        loop.close()

    @pytest.fixture(scope="session")
    def create_test_db():
        # no-op: tables cannot be created here
        yield

    @pytest.fixture()
    def db_session():
        # Yield a simple object placeholder; tests that require real sessions
        # will need to skip or provide their own fixtures.
        yield None
