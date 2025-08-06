import logging
import sqlite3
import threading
import time
import traceback
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, Field


class GroupBetRequest(BaseModel):
    group_id: int
    market_id: int
    selection: str
    stake: float = Field(..., gt=0, description="Stake must be greater than zero")


class GroupBetResponse(BaseModel):
    group_id: int
    bet_id: int
    status: str


class PlaceBetRequest(BaseModel):
    market_id: int
    selection: str
    odds: float
    stake: float


class DepositRequest(BaseModel):
    amount: float


class WithdrawRequest(BaseModel):
    amount: float


class PaymentResponse(BaseModel):
    id: int
    type: str
    amount: float
    status: str
    timestamp: str


class PaymentHistoryResponse(BaseModel):
    id: int
    type: str
    amount: float
    status: str
    timestamp: str


app = FastAPI(
    title="A1Betting Minimal Backend",
    description="Minimal backend for A1Betting with betting, payments, admin, AI, and social features.",
    version="1.0.0",
    openapi_tags=[
        {
            "name": "Betting",
            "description": "Endpoints for placing bets and viewing odds.",
        },
        {"name": "Payments", "description": "Endpoints for payment processing."},
        {"name": "Admin", "description": "Admin dashboard and management endpoints."},
        {"name": "AI", "description": "AI-powered bet suggestions."},
        {"name": "Social", "description": "Notifications, group betting, referrals."},
        {"name": "Security", "description": "Fraud detection and security endpoints."},
    ],
)


# --- Debug Endpoint: List DB Tables ---
@app.get("/debug/db_tables", tags=["Admin"])
def debug_db_tables():
    group_id: int
    group_id: int
    market_id: int
    selection: str
    stake: float = Field(..., gt=0, description="Stake must be greater than zero")


class ReferralResponse(BaseModel):
    code: str
    referred_users: int

    group_id: int
    bet_id: int
    status: str


# Ensure 'markets' and 'users' tables exist on startup
@app.on_event("startup")
def create_tables():
    logger.info("Startup event: creating/checking markets and users tables")
    try:
        with sqlite3.connect("users.db") as conn:
            cursor = conn.cursor()
            # Create markets table
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS markets (
                    id INTEGER PRIMARY KEY,
                    sport TEXT,
                    event TEXT,
                    selections TEXT,
                    odds REAL,
                    status TEXT,
                    updated_at TEXT
                );
                """
            )
            # Create users table
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT,
                    first_name TEXT,
                    last_name TEXT,
                    hashed_password TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    is_verified BOOLEAN DEFAULT 0,
                    created_at TEXT,
                    updated_at TEXT,
                    last_login TEXT,
                    risk_tolerance TEXT,
                    preferred_stake REAL,
                    bookmakers TEXT,
                    settings TEXT
                );
                """
            )
            # Insert test data into markets if table is empty
            cursor.execute("SELECT COUNT(*) FROM markets")
            count = cursor.fetchone()[0]
            logger.info(f"Markets table row count: {count}")
            if count == 0:
                logger.info("Inserting test data into markets table")
                cursor.executemany(
                    "INSERT INTO markets (sport, event, selections, odds, status, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                    [
                        (
                            "Soccer",
                            "TeamA vs TeamB",
                            "TeamA,TeamB,Draw",
                            2.5,
                            "open",
                            datetime.now(timezone.utc).isoformat(),
                        ),
                        (
                            "Basketball",
                            "TeamX vs TeamY",
                            "TeamX,TeamY",
                            1.8,
                            "open",
                            datetime.now(timezone.utc).isoformat(),
                        ),
                        (
                            "Tennis",
                            "Player1 vs Player2",
                            "Player1,Player2",
                            2.0,
                            "open",
                            datetime.now(timezone.utc).isoformat(),
                        ),
                    ],
                )
            conn.commit()
        logger.info("Startup event complete")
    except Exception as e:
        logger.error(f"Error in startup event: {e}")


social_router = APIRouter()
admin_router = APIRouter()
payments_router = APIRouter()
betting_router = APIRouter()
# Register routers so endpoints are available
app.include_router(admin_router)
app.include_router(social_router)
app.include_router(payments_router)
app.include_router(betting_router)

SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# --- Token Endpoint for Testing ---
from fastapi.security import OAuth2PasswordRequestForm


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


@app.post("/token", response_model=TokenResponse, tags=["Security"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        conn = sqlite3.connect("users.db", timeout=10)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT hashed_password FROM users WHERE username = ?",
            (form_data.username,),
        )
        row = cursor.fetchone()
        conn.close()
        if not row or not pwd_context.verify(form_data.password, row[0]):
            logger.error(f"Login failed for user: {form_data.username}")
            raise HTTPException(status_code=401, detail="Invalid username or password")
        # Create JWT token
        to_encode = {"sub": form_data.username}
        access_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in /token endpoint: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


# --- Logging Setup ---
log_formatter = logging.Formatter(
    "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("A1Betting-Minimal")
logger.setLevel(logging.INFO)
console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)
logger.addHandler(console_handler)

# --- Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware)

# --- Security ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

# --- Rate Limiter ---
_rate_limit_lock = threading.Lock()
_rate_limit_cache: Dict[str, list] = {}


def rate_limit(max_calls: int = 10, window_seconds: int = 60):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            request: Request = kwargs.get("request") or (
                args[0] if args and isinstance(args[0], Request) else None
            )
            if request:
                client_ip = request.client.host
                now = time.time()
                with _rate_limit_lock:
                    calls = _rate_limit_cache.get(client_ip, [])
                    calls = [t for t in calls if now - t < window_seconds]
                    if len(calls) >= max_calls:
                        raise HTTPException(
                            status_code=429,
                            detail=f"Rate limit exceeded: {max_calls} calls per {window_seconds} seconds.",
                        )
                    calls.append(now)
                    _rate_limit_cache[client_ip] = calls
            return await func(*args, **kwargs)


# Group bet (mock)


# Group bet (mock)
@app.post("/social/group_bet", response_model=GroupBetResponse, tags=["Social"])
async def group_bet(request: GroupBetRequest, token: str = Depends(oauth2_scheme)):
    """Mock group bet endpoint."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"group_id": request.group_id, "bet_id": 123, "status": "success"}


# Referral (mock)
@social_router.get("/social/referral", response_model=ReferralResponse, tags=["Social"])
async def get_referral(token: str = Depends(oauth2_scheme)):
    """Mock referral endpoint."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"code": "A1BET123", "referred_users": 5}


# --- Endpoints ---
# User registration endpoint
class RegisterRequest(BaseModel):
    username: str
    password: str

    @classmethod
    def validate_password(cls, password):
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if password.isdigit() or password.isalpha():
            raise ValueError("Password must contain both letters and numbers.")
        return password

    @classmethod
    def validate_username(cls, username):
        if len(username) < 3:
            raise ValueError("Username must be at least 3 characters long.")
        return username


@app.post("/register", tags=["Admin", "Security"])
@app.post("/register", tags=["Admin", "Security"])
async def register_user(request: RegisterRequest):
    try:
        conn = sqlite3.connect("users.db", timeout=10)
        cursor = conn.cursor()
        # Validate input
        try:
            RegisterRequest.validate_username(request.username)
            RegisterRequest.validate_password(request.password)
        except ValueError as ve:
            logger.error(f"Registration validation error: {ve}")
            raise HTTPException(status_code=400, detail=str(ve))
        # Check for duplicate username
        cursor.execute("SELECT id FROM users WHERE username = ?", (request.username,))
        if cursor.fetchone():
            conn.close()
            logger.error(
                f"Registration failed: username already exists: {request.username}"
            )
            raise HTTPException(status_code=400, detail="Username already exists")
        import uuid

        user_id = str(uuid.uuid4())
        hashed_password = pwd_context.hash(request.password)
        cursor.execute(
            "INSERT INTO users (id, username, email, first_name, last_name, hashed_password, is_active, is_verified, created_at, updated_at, last_login, risk_tolerance, preferred_stake, bookmakers, settings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                user_id,
                request.username,
                f"{request.username}@example.com",  # default email
                request.username,  # default first_name
                request.username,  # default last_name
                hashed_password,
                True,
                False,
                datetime.now(timezone.utc).isoformat(),
                datetime.now(timezone.utc).isoformat(),
                None,  # last_login
                None,  # risk_tolerance
                None,  # preferred_stake
                None,  # bookmakers
                None,  # settings
            ),
        )
        conn.commit()
        conn.close()
        logger.info(f"User registered successfully: {request.username}")
        return {"message": "User registered successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in /register endpoint: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


# --- Betting Endpoints ---
from typing import List


async def get_notifications(token: str = Depends(oauth2_scheme)):
    """Mock notifications endpoint."""
    logger.info("Entering get_notifications endpoint")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        logger.error("JWTError in get_notifications")
        raise HTTPException(status_code=401, detail="Invalid token")
    id: int
    type: str
    amount: float
    status: str
    timestamp: str


# --- Social Models ---


# --- Admin Models ---


@app.post("/register", tags=["Admin", "Security"])
class MarketResponse(BaseModel):
    id: int
    sport: str
    event: str
    selections: str
    odds: float
    status: str
    updated_at: str


async def place_bet(request: PlaceBetRequest, token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    placed_at = datetime.now(timezone.utc).isoformat()
    conn = sqlite3.connect("users.db", timeout=10)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO bets (username, market_id, selection, odds, stake, status, placed_at, payout) VALUES (?, ?, ?, ?, ?, 'pending', ?, 0.0)",
        (
            username,
            request.market_id,
            request.selection,
            request.odds,
            request.stake,
            placed_at,
        ),
    )
    conn.commit()
    bet_id = cursor.lastrowid
    conn.close()
    return {
        "id": bet_id,
        "market_id": request.market_id,
        "selection": request.selection,
        "odds": request.odds,
        "stake": request.stake,
        "status": "pending",
        "placed_at": placed_at,
        "payout": 0.0,
    }


# --- Payment Endpoints ---
# Deposit funds
@app.post("/payments/deposit", response_model=PaymentResponse, tags=["Payments"])
async def deposit_funds(request: DepositRequest, token: str = Depends(oauth2_scheme)):
    """Mock deposit endpoint. Returns a successful deposit response."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Deposit amount must be positive.")
    timestamp = datetime.now(timezone.utc).isoformat()
    return {
        "id": 1,
        "type": "deposit",
        "amount": request.amount,
        "status": "success",
        "timestamp": timestamp,
    }


# Withdraw funds
@app.post("/payments/withdraw", response_model=PaymentResponse, tags=["Payments"])
async def withdraw_funds(request: WithdrawRequest, token: str = Depends(oauth2_scheme)):
    """Mock withdraw endpoint. Returns a successful withdraw response."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Withdraw amount must be positive.")
    timestamp = datetime.now(timezone.utc).isoformat()
    return {
        "id": 2,
        "type": "withdraw",
        "amount": request.amount,
        "status": "success",
        "timestamp": timestamp,
    }


# Payment history
@payments_router.get(
    "/payments/history", response_model=List[PaymentHistoryResponse], tags=["Payments"]
)
async def payment_history(token: str = Depends(oauth2_scheme)):
    """Mock payment history endpoint. Returns a list of mock transactions."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    now = datetime.now(timezone.utc).isoformat()
    return [
        {
            "id": 1,
            "type": "deposit",
            "amount": 100.0,
            "status": "success",
            "timestamp": now,
        },
        {
            "id": 2,
            "type": "withdraw",
            "amount": 50.0,
            "status": "success",
            "timestamp": now,
        },
    ]


@app.get("/markets", tags=["Betting"])
async def get_markets():
    # Return mock market data for testing
    return [
        {
            "id": 1,
            "sport": "Soccer",
            "event": "TeamA vs TeamB",
            "selections": "TeamA, TeamB",
            "odds": 2.0,
            "status": "open",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    ]
    conn = sqlite3.connect("users.db", timeout=10)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, sport, event, selections, odds, status, updated_at FROM markets"
    )
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r[0],
            "sport": r[1],
            "event": r[2],
            "selections": r[3],
            "odds": r[4],
            "status": r[5],
            "updated_at": r[6],
        }
        for r in rows
    ]
