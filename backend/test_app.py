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

app.include_router(router, prefix="/api")
