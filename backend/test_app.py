from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

router = APIRouter()


# Simple version endpoint for frontend health/version checks
@router.get("/version")
async def version():
    return {"version": "1.0.0", "status": "ok"}


from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

router = APIRouter()


@router.get("/test")
async def test_endpoint():
    return {"message": "Test endpoint is working"}


@router.get("/health/status")
async def health_status():
    return {"status": "ok"}


# Alias for frontend health check compatibility
@router.get("/health")
async def health_alias():
    return await health_status()


app = FastAPI()

# Add CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*"
    ],  # You can restrict this to ["http://localhost:8174"] for more security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from backend.routes.auth import router as auth_router
from backend.routes.betting import router as betting_router
from backend.routes.health import router as health_router
from backend.routes.prizepicks import router as prizepicks_router
from backend.routes.propollama import router as propollama_router
from backend.routes.unified_api import router as unified_api_router

app.include_router(router, prefix="/api")
app.include_router(auth_router)
app.include_router(unified_api_router, prefix="/api")
app.include_router(betting_router)
app.include_router(health_router, prefix="/api")
app.include_router(prizepicks_router)
app.include_router(propollama_router, prefix="/api/propollama")
