"""
User Authentication and Management Service
Implements user registration, login, session management, and preferences.
"""

import asyncio
import hashlib
import hmac
import secrets
import sqlite3
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import aiosqlite
import bcrypt
import jwt
from fastapi import HTTPException, status
from pydantic import BaseModel, EmailStr

from backend.utils.enhanced_logging import get_logger

logger = get_logger("user_auth_service")


class UserCreateRequest(BaseModel):
    """User registration request model"""

    email: EmailStr
    password: str
    first_name: str
    last_name: str
    preferences: Optional[Dict[str, Any]] = {}


class UserLoginRequest(BaseModel):
    """User login request model"""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User response model"""

    id: str
    email: str
    first_name: str
    last_name: str
    created_at: str
    is_active: bool
    preferences: Dict[str, Any]


class UserSession(BaseModel):
    """User session model"""

    session_id: str
    user_id: str
    access_token: str
    refresh_token: str
    expires_at: str


class UserPreferences(BaseModel):
    """User preferences model"""

    favorite_sports: List[str] = ["NFL", "NBA", "MLB"]
    notification_settings: Dict[str, bool] = {
        "arbitrage_alerts": True,
        "high_confidence_predictions": True,
        "daily_summary": True,
        "breaking_news": False,
    }
    betting_settings: Dict[str, Any] = {
        "default_stake": 25,
        "max_stake": 500,
        "bankroll": 1000,
        "risk_tolerance": "medium",
    }
    ui_preferences: Dict[str, Any] = {
        "theme": "dark",
        "currency": "USD",
        "timezone": "America/New_York",
        "compact_view": False,
    }


class UserAuthService:
    """Service for user authentication and management"""

    def __init__(self):
        self.db_path = "user_auth.db"
        self.secret_key = self._generate_secret_key()
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 30
        self.refresh_token_expire_days = 30
        self.active_sessions: Dict[str, UserSession] = {}

    async def initialize(self):
        """Initialize the user authentication service"""
        try:
            await self._create_database_schema()
            logger.info("User authentication service initialized")
        except Exception as e:
            logger.error(f"Failed to initialize user auth service: {e}")
            raise

    def _generate_secret_key(self) -> str:
        """Generate a secure secret key for JWT tokens"""
        return secrets.token_urlsafe(32)

    async def _create_database_schema(self):
        """Create database schema for user management"""
        async with aiosqlite.connect(self.db_path) as db:
            # Users table
            await db.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    salt TEXT NOT NULL,
                    first_name TEXT NOT NULL,
                    last_name TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    email_verified BOOLEAN DEFAULT 0,
                    failed_login_attempts INTEGER DEFAULT 0,
                    locked_until TEXT,
                    preferences TEXT
                )
            """
            )

            # Sessions table
            await db.execute(
                """
                CREATE TABLE IF NOT EXISTS user_sessions (
                    session_id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    access_token TEXT NOT NULL,
                    refresh_token TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    ip_address TEXT,
                    user_agent TEXT,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """
            )

            # Betting history table
            await db.execute(
                """
                CREATE TABLE IF NOT EXISTS betting_history (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    bet_type TEXT NOT NULL,
                    sport TEXT NOT NULL,
                    description TEXT NOT NULL,
                    stake REAL NOT NULL,
                    odds REAL NOT NULL,
                    potential_payout REAL NOT NULL,
                    outcome TEXT,
                    actual_payout REAL DEFAULT 0,
                    placed_at TEXT NOT NULL,
                    settled_at TEXT,
                    confidence_score REAL,
                    model_prediction TEXT,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """
            )

            # User analytics table
            await db.execute(
                """
                CREATE TABLE IF NOT EXISTS user_analytics (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    total_bets INTEGER DEFAULT 0,
                    total_stake REAL DEFAULT 0,
                    total_winnings REAL DEFAULT 0,
                    win_rate REAL DEFAULT 0,
                    roi REAL DEFAULT 0,
                    favorite_sport TEXT,
                    avg_confidence REAL DEFAULT 0,
                    last_updated TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """
            )

            await db.commit()
            logger.info("Database schema created successfully")

    async def register_user(self, user_data: UserCreateRequest) -> UserResponse:
        """Register a new user"""
        try:
            # Check if user already exists
            if await self._user_exists(user_data.email):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User with this email already exists",
                )

            # Generate user ID and password hash
            user_id = str(uuid.uuid4())
            salt = secrets.token_hex(16)
            password_hash = self._hash_password(user_data.password, salt)

            # Create user
            now = datetime.now().isoformat()
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute(
                    """
                    INSERT INTO users 
                    (id, email, password_hash, salt, first_name, last_name, 
                     created_at, updated_at, preferences)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                    (
                        user_id,
                        user_data.email,
                        password_hash,
                        salt,
                        user_data.first_name,
                        user_data.last_name,
                        now,
                        now,
                        self._serialize_preferences(user_data.preferences),
                    ),
                )

                # Initialize user analytics
                await db.execute(
                    """
                    INSERT INTO user_analytics 
                    (id, user_id, last_updated)
                    VALUES (?, ?, ?)
                """,
                    (str(uuid.uuid4()), user_id, now),
                )

                await db.commit()

            logger.info(f"User registered successfully: {user_data.email}")

            return UserResponse(
                id=user_id,
                email=user_data.email,
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                created_at=now,
                is_active=True,
                preferences=user_data.preferences or {},
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error registering user: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to register user",
            )

    async def login_user(
        self,
        login_data: UserLoginRequest,
        ip_address: str = None,
        user_agent: str = None,
    ) -> UserSession:
        """Authenticate user and create session"""
        try:
            # Get user from database
            user = await self._get_user_by_email(login_data.email)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password",
                )

            # Check if account is locked
            if await self._is_account_locked(user["id"]):
                raise HTTPException(
                    status_code=status.HTTP_423_LOCKED,
                    detail="Account is temporarily locked due to failed login attempts",
                )

            # Verify password
            if not self._verify_password(
                login_data.password, user["password_hash"], user["salt"]
            ):
                await self._record_failed_login(user["id"])
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password",
                )

            # Reset failed login attempts
            await self._reset_failed_login_attempts(user["id"])

            # Create session
            session = await self._create_user_session(
                user["id"], ip_address, user_agent
            )

            logger.info(f"User logged in successfully: {login_data.email}")
            return session

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error during login: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Login failed"
            )

    async def refresh_token(self, refresh_token: str) -> UserSession:
        """Refresh access token using refresh token"""
        try:
            # Verify refresh token
            payload = jwt.decode(
                refresh_token, self.secret_key, algorithms=[self.algorithm]
            )
            user_id = payload.get("sub")
            session_id = payload.get("session_id")

            if not user_id or not session_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid refresh token",
                )

            # Check if session exists and is active
            session = await self._get_session_by_id(session_id)
            if not session or not session["is_active"]:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Session expired or invalid",
                )

            # Create new tokens
            new_session = await self._create_user_session(
                user_id, session_id=session_id
            )

            logger.info(f"Token refreshed for user: {user_id}")
            return new_session

        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired"
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
            )
        except Exception as e:
            logger.error(f"Error refreshing token: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Token refresh failed",
            )

    async def logout_user(self, session_id: str):
        """Logout user and invalidate session"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute(
                    """
                    UPDATE user_sessions 
                    SET is_active = 0 
                    WHERE session_id = ?
                """,
                    (session_id,),
                )
                await db.commit()

            # Remove from active sessions
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]

            logger.info(f"User logged out: session {session_id}")

        except Exception as e:
            logger.error(f"Error during logout: {e}")

    async def verify_session(self, access_token: str) -> Optional[Dict[str, Any]]:
        """Verify user session and return user data"""
        try:
            # Decode JWT token
            payload = jwt.decode(
                access_token, self.secret_key, algorithms=[self.algorithm]
            )
            user_id = payload.get("sub")
            session_id = payload.get("session_id")

            if not user_id or not session_id:
                return None

            # Check if session is active
            session = await self._get_session_by_id(session_id)
            if not session or not session["is_active"]:
                return None

            # Get user data
            user = await self._get_user_by_id(user_id)
            if not user or not user["is_active"]:
                return None

            return {
                "user_id": user_id,
                "session_id": session_id,
                "email": user["email"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "preferences": self._deserialize_preferences(user["preferences"]),
            }

        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
        except Exception as e:
            logger.error(f"Error verifying session: {e}")
            return None

    async def update_user_preferences(
        self, user_id: str, preferences: Dict[str, Any]
    ) -> bool:
        """Update user preferences"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute(
                    """
                    UPDATE users 
                    SET preferences = ?, updated_at = ?
                    WHERE id = ?
                """,
                    (
                        self._serialize_preferences(preferences),
                        datetime.now().isoformat(),
                        user_id,
                    ),
                )
                await db.commit()

            logger.info(f"Updated preferences for user: {user_id}")
            return True

        except Exception as e:
            logger.error(f"Error updating user preferences: {e}")
            return False

    async def record_bet(self, user_id: str, bet_data: Dict[str, Any]) -> str:
        """Record a user bet"""
        try:
            bet_id = str(uuid.uuid4())
            now = datetime.now().isoformat()

            async with aiosqlite.connect(self.db_path) as db:
                await db.execute(
                    """
                    INSERT INTO betting_history 
                    (id, user_id, bet_type, sport, description, stake, odds, 
                     potential_payout, placed_at, confidence_score, model_prediction)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                    (
                        bet_id,
                        user_id,
                        bet_data.get("bet_type", ""),
                        bet_data.get("sport", ""),
                        bet_data.get("description", ""),
                        bet_data.get("stake", 0),
                        bet_data.get("odds", 0),
                        bet_data.get("potential_payout", 0),
                        now,
                        bet_data.get("confidence_score", 0),
                        str(bet_data.get("model_prediction", {})),
                    ),
                )
                await db.commit()

            # Update user analytics
            await self._update_user_analytics(user_id)

            logger.info(f"Recorded bet for user {user_id}: {bet_id}")
            return bet_id

        except Exception as e:
            logger.error(f"Error recording bet: {e}")
            return ""

    async def get_user_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get user betting analytics"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                cursor = await db.execute(
                    """
                    SELECT * FROM user_analytics 
                    WHERE user_id = ?
                """,
                    (user_id,),
                )
                analytics = await cursor.fetchone()

                if analytics:
                    return {
                        "total_bets": analytics[2],
                        "total_stake": analytics[3],
                        "total_winnings": analytics[4],
                        "win_rate": analytics[5],
                        "roi": analytics[6],
                        "favorite_sport": analytics[7],
                        "avg_confidence": analytics[8],
                        "last_updated": analytics[9],
                    }
                else:
                    return {}

        except Exception as e:
            logger.error(f"Error getting user analytics: {e}")
            return {}

    # Helper methods

    async def _user_exists(self, email: str) -> bool:
        """Check if user exists"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("SELECT id FROM users WHERE email = ?", (email,))
            return await cursor.fetchone() is not None

    async def _get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                """
                SELECT id, email, password_hash, salt, first_name, last_name,
                       created_at, is_active, preferences
                FROM users WHERE email = ?
            """,
                (email,),
            )
            row = await cursor.fetchone()

            if row:
                return {
                    "id": row[0],
                    "email": row[1],
                    "password_hash": row[2],
                    "salt": row[3],
                    "first_name": row[4],
                    "last_name": row[5],
                    "created_at": row[6],
                    "is_active": row[7],
                    "preferences": row[8],
                }
            return None

    async def _get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                """
                SELECT id, email, first_name, last_name, created_at, is_active, preferences
                FROM users WHERE id = ?
            """,
                (user_id,),
            )
            row = await cursor.fetchone()

            if row:
                return {
                    "id": row[0],
                    "email": row[1],
                    "first_name": row[2],
                    "last_name": row[3],
                    "created_at": row[4],
                    "is_active": row[5],
                    "preferences": row[6],
                }
            return None

    def _hash_password(self, password: str, salt: str) -> str:
        """Hash password with salt"""
        return hashlib.pbkdf2_hex(password.encode(), salt.encode(), 100000)

    def _verify_password(self, password: str, password_hash: str, salt: str) -> bool:
        """Verify password against hash"""
        return hmac.compare_digest(self._hash_password(password, salt), password_hash)

    async def _create_user_session(
        self,
        user_id: str,
        ip_address: str = None,
        user_agent: str = None,
        session_id: str = None,
    ) -> UserSession:
        """Create new user session"""
        if not session_id:
            session_id = str(uuid.uuid4())

        now = datetime.now()
        access_token_expires = now + timedelta(minutes=self.access_token_expire_minutes)
        refresh_token_expires = now + timedelta(days=self.refresh_token_expire_days)

        # Create access token
        access_token_data = {
            "sub": user_id,
            "session_id": session_id,
            "exp": access_token_expires,
            "iat": now,
            "type": "access",
        }
        access_token = jwt.encode(
            access_token_data, self.secret_key, algorithm=self.algorithm
        )

        # Create refresh token
        refresh_token_data = {
            "sub": user_id,
            "session_id": session_id,
            "exp": refresh_token_expires,
            "iat": now,
            "type": "refresh",
        }
        refresh_token = jwt.encode(
            refresh_token_data, self.secret_key, algorithm=self.algorithm
        )

        # Store session in database
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                INSERT OR REPLACE INTO user_sessions 
                (session_id, user_id, access_token, refresh_token, created_at, 
                 expires_at, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
                (
                    session_id,
                    user_id,
                    access_token,
                    refresh_token,
                    now.isoformat(),
                    refresh_token_expires.isoformat(),
                    ip_address,
                    user_agent,
                ),
            )
            await db.commit()

        session = UserSession(
            session_id=session_id,
            user_id=user_id,
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=refresh_token_expires.isoformat(),
        )

        self.active_sessions[session_id] = session
        return session

    async def _get_session_by_id(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session by ID"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                """
                SELECT session_id, user_id, expires_at, is_active
                FROM user_sessions WHERE session_id = ?
            """,
                (session_id,),
            )
            row = await cursor.fetchone()

            if row:
                return {
                    "session_id": row[0],
                    "user_id": row[1],
                    "expires_at": row[2],
                    "is_active": row[3],
                }
            return None

    async def _is_account_locked(self, user_id: str) -> bool:
        """Check if account is locked"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                """
                SELECT locked_until FROM users WHERE id = ?
            """,
                (user_id,),
            )
            row = await cursor.fetchone()

            if row and row[0]:
                locked_until = datetime.fromisoformat(row[0])
                return datetime.now() < locked_until

        return False

    async def _record_failed_login(self, user_id: str):
        """Record failed login attempt"""
        async with aiosqlite.connect(self.db_path) as db:
            # Increment failed attempts
            await db.execute(
                """
                UPDATE users 
                SET failed_login_attempts = failed_login_attempts + 1
                WHERE id = ?
            """,
                (user_id,),
            )

            # Check if we need to lock account
            cursor = await db.execute(
                """
                SELECT failed_login_attempts FROM users WHERE id = ?
            """,
                (user_id,),
            )
            row = await cursor.fetchone()

            if row and row[0] >= 5:  # Lock after 5 failed attempts
                locked_until = datetime.now() + timedelta(minutes=30)
                await db.execute(
                    """
                    UPDATE users 
                    SET locked_until = ?
                    WHERE id = ?
                """,
                    (locked_until.isoformat(), user_id),
                )

            await db.commit()

    async def _reset_failed_login_attempts(self, user_id: str):
        """Reset failed login attempts"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                UPDATE users 
                SET failed_login_attempts = 0, locked_until = NULL
                WHERE id = ?
            """,
                (user_id,),
            )
            await db.commit()

    async def _update_user_analytics(self, user_id: str):
        """Update user analytics after a bet"""
        async with aiosqlite.connect(self.db_path) as db:
            # Calculate analytics from betting history
            cursor = await db.execute(
                """
                SELECT COUNT(*), SUM(stake), SUM(actual_payout), AVG(confidence_score)
                FROM betting_history 
                WHERE user_id = ?
            """,
                (user_id,),
            )
            row = await cursor.fetchone()

            if row:
                total_bets = row[0] or 0
                total_stake = row[1] or 0
                total_winnings = row[2] or 0
                avg_confidence = row[3] or 0

                win_rate = (total_winnings / total_stake) if total_stake > 0 else 0
                roi = (
                    ((total_winnings - total_stake) / total_stake * 100)
                    if total_stake > 0
                    else 0
                )

                await db.execute(
                    """
                    UPDATE user_analytics 
                    SET total_bets = ?, total_stake = ?, total_winnings = ?,
                        win_rate = ?, roi = ?, avg_confidence = ?, last_updated = ?
                    WHERE user_id = ?
                """,
                    (
                        total_bets,
                        total_stake,
                        total_winnings,
                        win_rate,
                        roi,
                        avg_confidence,
                        datetime.now().isoformat(),
                        user_id,
                    ),
                )
                await db.commit()

    def _serialize_preferences(self, preferences: Dict[str, Any]) -> str:
        """Serialize preferences to JSON string"""
        import json

        return json.dumps(preferences)

    def _deserialize_preferences(self, preferences_str: str) -> Dict[str, Any]:
        """Deserialize preferences from JSON string"""
        import json

        try:
            return json.loads(preferences_str) if preferences_str else {}
        except:
            return {}


# Global user auth service instance
user_auth_service = UserAuthService()
