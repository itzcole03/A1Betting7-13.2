from fastapi import FastAPI, Body
from fastapi.responses import JSONResponse

app = FastAPI(title="A1Betting Dev App")


def ok(data=None):
    return {"success": True, "data": data, "error": None}


def fail(message: str):
    return {"success": False, "data": None, "error": {"message": message}}


@app.on_event("startup")
async def _mount_auth_router():
    try:
        from backend.routes.auth import router as auth_router
        app.include_router(auth_router, prefix="/api")
        app.include_router(auth_router)
    except Exception:
        # If auth router cannot be imported, continue; dev endpoints below will
        # still try to access the auth service directly.
        pass


@app.get("/dev/auth/users")
async def dev_list_auth_users():
    try:
        from backend.services.auth_service import get_auth_service

        svc = get_auth_service()
        if not svc:
            return JSONResponse(content=fail("Auth service not available"), status_code=500)

        users = list(getattr(svc, "_users", {}).keys())
        return JSONResponse(content=ok({"users": users}), status_code=200)
    except Exception as e:
        return JSONResponse(content=fail(str(e)), status_code=500)


@app.post("/dev/auth/set-password")
async def dev_set_password(payload: dict = Body(...)):
    try:
        email = payload.get("email")
        new_password = payload.get("new_password")
        if not email or not new_password:
            return JSONResponse(content=fail("email and new_password required"), status_code=400)

        from backend.services.auth_service import get_auth_service

        svc = get_auth_service()
        if not svc:
            return JSONResponse(content=fail("Auth service not available"), status_code=500)

        import hashlib as _hashlib

        users = getattr(svc, "_users", {})
        users[email] = {
            "email": email,
            "password": _hashlib.sha256(new_password.encode()).hexdigest(),
            "first_name": users.get(email, {}).get("first_name", ""),
            "last_name": users.get(email, {}).get("last_name", ""),
            "id": users.get(email, {}).get("id", email),
            "is_verified": True,
        }

        try:
            setattr(svc, "_users", users)
        except Exception:
            pass

        return JSONResponse(content=ok({"message": "password set"}), status_code=200)
    except Exception as e:
        return JSONResponse(content=fail(str(e)), status_code=500)
