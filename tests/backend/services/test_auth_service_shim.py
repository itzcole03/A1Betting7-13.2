import pytest

from backend.services.auth_service import get_auth_service


@pytest.mark.asyncio
async def test_auth_service_session_exec_shim_present_or_skipped():
    """Verify that AuthService._session yields a session with an `exec` method
    when the DB is enabled. If DB is not configured for the environment, skip
    this test (CI/developer environments vary). This guards the compatibility
    shim added to AuthService._session.
    """
    svc = get_auth_service()
    if not svc._db_enabled:
        pytest.skip("DB not enabled in this environment; shim not exercised")

    # Exercise the session context manager and assert `exec` exists and is awaitable/callable
    async with svc._session() as session:
        assert session is not None, "_session yielded None despite DB enabled"
        assert hasattr(session, "exec"), "Session missing exec shim"
        exec_attr = getattr(session, "exec")
        # Ensure it's awaitable/callable (coroutine function or callable wrapper)
        assert callable(exec_attr), "session.exec is not callable"
