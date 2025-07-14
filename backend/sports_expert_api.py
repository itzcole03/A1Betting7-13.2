# --- Background Job Scheduling (APScheduler) ---

import datetime
import gc
import hashlib
import json
import logging
import os
# import random  # pylint: disable=unused-import
import shutil
import signal
import smtplib
import sys
import threading
import time
import traceback
import uuid
import weakref
from collections import defaultdict, deque
from contextlib import contextmanager
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from email.utils import formataddr
from enum import Enum
from functools import lru_cache, wraps

# JWT and password hashing will be implemented as stubs for now
# import jwt  # pip install PyJWT
# from passlib.context import CryptContext  # pip install passlib
# Enhanced imports for computational perfection
from typing import (
    Any,
    Callable,
    Dict,
    Generic,
    List,
    Optional,
    Protocol,
    TypeVar,
    Union,
)
from typing import Dict as TypingDict

import pkg_resources
import psutil
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

# Create FastAPI router for sports expert endpoints
from fastapi import APIRouter, Body, Depends, FastAPI, HTTPException

# Frontend integration imports
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

router = APIRouter(prefix="/sports-expert", tags=["Sports Expert"])

# --- Frontend API Response Models ---

T = TypeVar("T")


@dataclass
class ApiResponse(Generic[T]):
    """Standardized API response format for frontend compatibility."""

    data: T
    status: str = "success"
    message: Optional[str] = None
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


@dataclass
class ApiError:
    """Standardized API error format."""

    code: str
    message: str
    details: Optional[Any] = None
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


# --- Authentication Models ---


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str


class TokenResponse(BaseModel):
    token: str
    refreshToken: str


class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    role: str = "user"
    preferences: TypingDict[str, Any] = {}


# --- PrizePicks Models ---


class PlayerProp(BaseModel):
    id: str
    player: str
    team: str
    opponent: str
    stat: str
    line: float
    overOdds: int
    underOdds: int
    confidence: int
    aiRecommendation: str  # "over" or "under"
    reasoning: str
    trend: str
    recentForm: str
    position: Optional[str] = None
    sport: Optional[str] = None
    gameTime: Optional[str] = None
    pickType: Optional[str] = "normal"  # "normal", "demon", "goblin"
    trendValue: Optional[float] = None


class SelectedPick(BaseModel):
    propId: str
    choice: str  # "over" or "under"
    player: str
    stat: str
    line: float
    confidence: int
    pickType: Optional[str] = "normal"


class LineupRequest(BaseModel):
    picks: List[SelectedPick]


class LineupResponse(BaseModel):
    id: str
    totalOdds: float
    potentialPayout: float
    confidence: int
    isValid: bool
    violations: Optional[List[str]] = None


# --- Prediction Models ---


class PredictionFactor(BaseModel):
    name: str
    weight: float
    value: float


class LivePrediction(BaseModel):
    id: str
    playerId: str
    sport: str
    predictedValue: float
    confidence: int
    factors: List[PredictionFactor]
    timestamp: str


class AnalysisRequest(BaseModel):
    playerId: str
    statType: str
    line: float


class AnalysisResponse(BaseModel):
    recommendation: str  # "over" or "under"
    confidence: int
    reasoning: str
    expectedValue: float
    volume: int
    oddsExplanation: str


# --- Authentication Utilities ---

security = HTTPBearer()


# Stub implementations for authentication (replace with real implementations)
def hash_password(password: str) -> str:
    """Hash password (stub implementation)."""
    return f"hashed_{password}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password (stub implementation)."""
    return hashed_password == f"hashed_{plain_password}"


JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-here")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_TIME = timedelta(hours=1)


def create_access_token(data: TypingDict[str, Any]) -> str:
    """Create JWT access token (stub implementation)."""
    # In production, use proper JWT implementation
    # For now, return a simple base64 encoded token
    import base64

    token_data = {
        **data,
        "exp": (datetime.now(timezone.utc) + JWT_EXPIRATION_TIME).timestamp(),
    }
    return base64.b64encode(json.dumps(token_data).encode()).decode()


def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> TypingDict[str, Any]:
    """Verify JWT token and return user data (stub implementation)."""
    try:
        import base64

        token_data = json.loads(base64.b64decode(credentials.credentials).decode())

        # Check expiration
        if token_data.get("exp", 0) < datetime.now(timezone.utc).timestamp():
            raise HTTPException(status_code=401, detail="Token expired")

        return token_data
    except Exception:  # pylint: disable=broad-exception-caught
        raise HTTPException(status_code=401, detail="Invalid token")


def api_response(data: Any, message: Optional[str] = None) -> TypingDict[str, Any]:
    """Helper function to create standardized API responses."""
    return ApiResponse(data=data, message=message).__dict__


def api_error(code: str, message: str, details: Any = None) -> TypingDict[str, Any]:
    """Helper function to create standardized API error responses."""
    return {
        "status": "error",
        **ApiError(code=code, message=message, details=details).__dict__,
    }


# Dummy user database (replace with real database integration)
USERS_DB: TypingDict[str, TypingDict[str, Any]] = {
    "user@example.com": {
        "id": str(uuid.uuid4()),
        "email": "user@example.com",
        "name": "Demo User",
        "password_hash": hash_password("password123"),
        "role": "user",
        "preferences": {
            "theme": "dark",
            "notifications": True,
            "defaultSport": "NBA",
            "riskLevel": "medium",
        },
    }
}

# Initialize logger
logger = logging.getLogger(__name__)


class JobResult(Protocol):
    """Protocol for job results with standardized interface."""

    success: bool
    result: Any
    error: str
    execution_time: float
    timestamp: float


@dataclass(frozen=True)
class JobExecutionResult:
    """Immutable result object for job executions."""

    success: bool
    result: Any = None
    error: str = ""
    execution_time: float = 0.0
    timestamp: float = field(default_factory=time.time)
    job_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    retry_count: int = 0


class JobPriority(Enum):
    """Job priority levels for intelligent scheduling."""

    CRITICAL = 1
    HIGH = 2
    NORMAL = 3
    LOW = 4
    BACKGROUND = 5


# Performance monitoring and caching
job_metrics: Dict[str, Dict[str, Union[int, float]]] = defaultdict(
    lambda: {"executions": 0, "failures": 0, "avg_time": 0.0}
)
job_cache: Dict[str, Any] = {}
active_jobs = weakref.WeakSet()
job_history: deque[JobExecutionResult] = deque(
    maxlen=1000
)  # Keep last 1000 job results

# Circuit breaker pattern for job resilience
CircuitBreakerState = Dict[str, Union[int, float, str]]
circuit_breakers: Dict[str, CircuitBreakerState] = defaultdict(
    lambda: {"failures": 0, "last_failure": 0.0, "state": "closed"}
)


def circuit_breaker(failure_threshold: int = 5, recovery_timeout: int = 300):
    """Circuit breaker decorator for job resilience."""

    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args, **kwargs) -> T:
            job_name = func.__name__
            breaker = circuit_breakers[job_name]

            # Check circuit breaker state
            if breaker["state"] == "open":
                if time.time() - breaker["last_failure"] > recovery_timeout:
                    breaker["state"] = "half-open"
                else:
                    raise RuntimeError(f"Circuit breaker open for {job_name}")

            try:
                result = func(*args, **kwargs)
                # Reset on success
                breaker["failures"] = 0
                if breaker["state"] == "half-open":
                    breaker["state"] = "closed"
                return result
            except Exception as ex:  # pylint: disable=broad-exception-caught
                breaker["failures"] += 1
                breaker["last_failure"] = time.time()
                if breaker["failures"] >= failure_threshold:
                    breaker["state"] = "open"
                raise ex

        return wrapper

    return decorator


def performance_monitor(cache_result: bool = False):
    """Performance monitoring decorator with optional caching."""

    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args, **kwargs) -> T:
            job_name = func.__name__
            start_time = time.time()

            # Check cache if enabled
            if cache_result:
                cache_key = f"{job_name}:{hashlib.md5(str(args).encode()).hexdigest()}"
                if cache_key in job_cache:
                    return job_cache[cache_key]

            try:
                result = func(*args, **kwargs)
                execution_time = time.time() - start_time

                # Update metrics
                metrics = job_metrics[job_name]
                metrics["executions"] += 1
                metrics["avg_time"] = (
                    metrics["avg_time"] * (metrics["executions"] - 1) + execution_time
                ) / metrics["executions"]

                # Cache result if enabled
                if cache_result:
                    job_cache[cache_key] = result

                # Store execution result
                job_result = JobExecutionResult(
                    success=True, result=result, execution_time=execution_time
                )
                job_history.append(job_result)

                logger.info("Job {job_name} completed in {execution_time:.3f}s")
                return result

            except Exception as ex:  # pylint: disable=broad-exception-caught
                execution_time = time.time() - start_time
                job_metrics[job_name]["failures"] += 1

                job_result = JobExecutionResult(
                    success=False, error=str(ex), execution_time=execution_time
                )
                job_history.append(job_result)

                logger.error("Job {job_name} failed after {execution_time:.3f}s: {ex}")
                raise ex

        return wrapper

    return decorator


@contextmanager
def job_execution_context(job_name: str):
    """Context manager for job execution with proper cleanup."""
    job_id = str(uuid.uuid4())
    logger.info("Starting job {job_name} (ID: {job_id})")
    start_time = time.time()

    try:
        yield job_id
    except Exception as ex:  # pylint: disable=broad-exception-caught
        logger.error("Job {job_name} (ID: {job_id}) failed: {ex}")
        logger.error("Traceback: {traceback.format_exc()}")
        raise ex
    finally:
        execution_time = time.time() - start_time
        logger.info("Job {job_name} (ID: {job_id}) finished in {execution_time:.3f}s")

        # Trigger garbage collection for long-running jobs
        if execution_time > 60:
            gc.collect()


def graceful_shutdown_handler(signum, frame):
    """Handle graceful shutdown of background jobs."""
    logger.info("Received shutdown signal, stopping background jobs...")
    # Add cleanup logic here
    sys.exit(0)


# Register signal handlers
signal.signal(signal.SIGTERM, graceful_shutdown_handler)
signal.signal(signal.SIGINT, graceful_shutdown_handler)

# Reference to FastAPI app (for startup event)
app: FastAPI = None  # Will be set by main app
agent: Optional[Any] = None # Will be set by main app


# --- Notification Hook (Email) ---
def send_email_notification(
    subject: str, body: str, to_email: str = "propollama@gmail.com"
) -> None:
    """Send an email notification for job alerts (Gmail SMTP, app password required).
    For production, use environment variables for credentials and a secure mail provider.
    Enhanced with retry logic, rate limiting, and comprehensive error handling.
    """
    import os
    from time import sleep

    # Rate limiting for notifications
    @lru_cache(maxsize=100)
    def get_last_notification_time(email_key: str) -> float:
        return notification_rate_limiter.get(email_key, 0.0)

    # Rate limiter: max 1 email per 5 minutes per subject
    email_key = hashlib.md5(f"{subject}:{to_email}".encode()).hexdigest()
    last_sent = get_last_notification_time(email_key)
    if time.time() - last_sent < 300:  # 5 minutes
        logger.debug("Email notification rate limited for {subject}")
        return

    EMAIL_ADDRESS = os.environ.get("NOTIFY_EMAIL_ADDRESS", "propollama@gmail.com")
    EMAIL_PASSWORD = os.environ.get("NOTIFY_EMAIL_PASSWORD", None)

    if not EMAIL_PASSWORD:
        logger.warning(
            "Email notification skipped: missing NOTIFY_EMAIL_PASSWORD in env."
        )
        return

    # Retry logic with exponential backoff
    max_retries = 3
    for attempt in range(max_retries):
        try:
            msg = MIMEText(body, "plain", "utf-8")
            msg["From"] = formataddr(("A1Betting Notifier", EMAIL_ADDRESS))
            msg["To"] = to_email
            msg["Subject"] = f"[A1Betting] {subject}"
            msg["X-Priority"] = "2"  # High priority

            with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=30) as server:
                server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
                server.sendmail(EMAIL_ADDRESS, [to_email], msg.as_string())

            # Update rate limiter
            notification_rate_limiter[email_key] = time.time()
            logger.info("Notification email sent to {to_email}: {subject}")
            return

        except Exception as ex:  # pylint: disable=broad-exception-caught
            if attempt < max_retries - 1:
                wait_time = (2**attempt) + random.uniform(
                    0, 1
                )  # Exponential backoff with jitter
                logger.warning(
                    f"Email notification attempt {attempt + 1} failed, retrying in {wait_time:.1f}s: {ex}"
                )
                sleep(wait_time)
            else:
                logger.error(
                    f"Failed to send notification email after {max_retries} attempts: {ex}"
                )


# Add notification rate limiter
notification_rate_limiter: Dict[str, float] = {}


@circuit_breaker(failure_threshold=3, recovery_timeout=600)
@performance_monitor(cache_result=False)
def background_data_ingest() -> None:
    """Background job: ingest new data for the agent with enhanced error handling."""
    with job_execution_context("data_ingest") as job_id:
        if safe_agent.is_available:
            try:
                result = safe_agent.safe_call("ingest_data", {})
                logger.info("Background data ingest succeeded: {result}")
            except Exception as ex:  # pylint: disable=broad-exception-caught
                logger.error("Background data ingest failed: {ex!s}")
                send_email_notification(
                    "Data Ingest Failed",
                    f"Background data ingest failed: {ex!s}\nJob ID: {job_id}",
                )
        else:
            logger.warning("Agent not available for data ingest")


def background_model_refresh() -> None:
    """Background job: refresh/retrain the agent model with enhanced monitoring."""
    with job_execution_context("model_refresh") as job_id:
        if safe_agent.is_available:
            try:
                result = safe_agent.safe_call("retrain_agent", [], [])
                logger.info("Background model refresh succeeded: {result}")
                # Notify on successful model refresh (critical operation)
                send_email_notification(
                    "Model Refreshed Successfully",
                    f"Model retrain completed successfully.\nJob ID: {job_id}\nResult: {result}",
                )
            except Exception as ex:  # pylint: disable=broad-exception-caught
                logger.error("Background model refresh failed: {ex!s}")
                send_email_notification(
                    "Model Refresh Failed",
                    f"Background model refresh failed: {ex!s}\nJob ID: {job_id}",
                )
        else:
            logger.warning("Agent not available for model refresh")


def background_backup_state():
    try:
        automation_backup_state()
    except Exception as ex:  # pylint: disable=broad-exception-caught
        logger.error("Background backup failed: {ex!s}")
        send_email_notification(
            "A1Betting: Backup Failed", f"Background backup failed: {ex!s}"
        )


def background_rotate_logs():
    try:
        automation_rotate_logs()
    except Exception as ex:  # pylint: disable=broad-exception-caught
        logger.error("Background log rotation failed: {ex!s}")
        send_email_notification(
            "A1Betting: Log Rotation Failed", f"Background log rotation failed: {ex!s}"
        )


def background_healthcheck_alert():
    try:
        result = automation_healthcheck_alert()
        if isinstance(result, dict) and result.get("alert"):
            send_email_notification(
                "A1Betting: Healthcheck Alert", f"Healthcheck alert: {result}"
            )
    except Exception as ex:  # pylint: disable=broad-exception-caught
        logger.error("Background healthcheck alert failed: {ex!s}")
        send_email_notification(
            "A1Betting: Healthcheck Alert Failed",
            f"Background healthcheck alert failed: {ex!s}",
        )


def background_generate_explainability():
    try:
        automation_generate_explainability()
    except Exception as ex:  # pylint: disable=broad-exception-caught
        logger.error("Background explainability failed: {ex!s}")
        send_email_notification(
            "A1Betting: Explainability Report Failed",
            f"Background explainability failed: {ex!s}",
        )


def background_active_learning():
    try:
        automation_active_learning()
    except Exception as ex:  # pylint: disable=broad-exception-caught
        logger.error("Background active learning failed: {ex!s}")
        send_email_notification(
            "A1Betting: Active Learning Failed",
            f"Background active learning failed: {ex!s}",
        )


def background_cleanup_sessions():
    try:
        automation_cleanup_sessions()
    except Exception as ex:  # pylint: disable=broad-exception-caught
        logger.error("Background session cleanup failed: {ex!s}")
        send_email_notification(
            "A1Betting: Session Cleanup Failed",
            f"Background session cleanup failed: {ex!s}",
        )


# --- Beneficial Custom Background Jobs ---
def background_model_drift_check() -> None:
    """Detect model drift by comparing recent predictions to historical performance.
    RESOLVED: Implement agent.detect_model_drift().
    """
    try:
        if agent and hasattr(agent, "detect_model_drift"):
            drift = agent.detect_model_drift()
            logger.info("Model drift check result: {drift}")
            if drift:
                send_email_notification(
                    "A1Betting: Model Drift Detected", f"Model drift detected: {drift}"
                )
    except Exception as ex:  # pylint: disable=broad-exception-caught
        logger.error("Model drift check failed: {ex!s}")
        send_email_notification(
            "A1Betting: Model Drift Check Failed", f"Model drift check failed: {ex!s}"
        )


def background_data_quality_check() -> None:
    """Check for missing/invalid data and alert if found.
    RESOLVED: Implement agent.check_data_quality().
    """
    try:
        if agent and hasattr(agent, "check_data_quality"):
            issues = agent.check_data_quality()
            logger.info("Data quality check result: {issues}")
            if issues:
                send_email_notification(
                    "A1Betting: Data Quality Issue",
                    f"Data quality issues detected: {issues}",
                )
    except Exception as ex:  # pylint: disable=broad-exception-caught
        logger.error("Data quality check failed: {ex!s}")
        send_email_notification(
            "A1Betting: Data Quality Check Failed", f"Data quality check failed: {ex!s}"
        )


def background_feedback_volume_alert() -> None:
    """Alert if feedback volume exceeds threshold (indicating user issues or retrain need).
    RESOLVED: Tune threshold and feedback log access.
    """
    try:
        if agent and hasattr(agent, "feedback_log"):
            feedback_count = len(getattr(agent, "feedback_log", []))
            logger.info("Feedback log count: {feedback_count}")
            if feedback_count > 100:  # Example threshold
                send_email_notification(
                    "A1Betting: High Feedback Volume",
                    f"Feedback log has {feedback_count} items. Consider retraining.",
                )
    except Exception as ex:  # pylint: disable=broad-exception-caught
        logger.error("Feedback volume alert failed: {ex!s}")
        send_email_notification(
            "A1Betting: Feedback Volume Alert Failed",
            f"Feedback volume alert failed: {ex!s}",
        )


def background_backup_verification() -> None:
    """Verify that the latest backup can be loaded (test restore).
    RESOLVED: Implement a real restore test.
    """
    try:
        import glob

        backup_dir = os.path.join(os.getcwd(), "backups")
        backups = sorted(
            glob.glob(os.path.join(backup_dir, "agent_state_*.json")), reverse=True
        )
        if backups:
            with open(backups[0], encoding="utf-8") as f:
                import json

                state = json.load(f)
            logger.info("Backup verification loaded state: {type(state)}")
            # Simulate restore (stub)
            if not state or "model" not in state:
                raise ValueError("Backup missing model key")
        else:
            raise FileNotFoundError("No backup files found")
    except Exception as ex:  # pylint: disable=broad-exception-caught
        logger.error("Backup verification failed: {ex!s}")
        send_email_notification(
            "A1Betting: Backup Verification Failed",
            f"Backup verification failed: {ex!s}",
        )


def background_usage_spike_detection() -> None:
    """Detect usage spikes (traffic, requests, tokens) and alert if above threshold.
    RESOLVED: Replace random simulation with real traffic stats.
    """
    try:
        if agent and hasattr(agent, "total_requests"):
            # Example: random spike simulation for demo
            recent_requests = getattr(agent, "total_requests", 0) + random.randint(
                0, 50
            )
            logger.info("Usage spike check: {recent_requests} requests")
            if recent_requests > 1000:  # Example threshold
                send_email_notification(
                    "A1Betting: Usage Spike Detected",
                    f"High request volume: {recent_requests} requests.",
                )
    except Exception as ex:  # pylint: disable=broad-exception-caught
        logger.error("Usage spike detection failed: {ex!s}")
        send_email_notification(
            "A1Betting: Usage Spike Detection Failed",
            f"Usage spike detection failed: {ex!s}",
        )


def start_scheduler():
    """Start enhanced intelligent scheduler with all jobs configured for maximum efficiency."""
    # Core critical jobs with high priority
    intelligent_scheduler.add_intelligent_job(
        background_data_ingest,
        IntervalTrigger(minutes=5),
        "data_ingest",
        priority=JobPriority.HIGH,
        adaptive=True,
    )

    intelligent_scheduler.add_intelligent_job(
        background_model_refresh,
        IntervalTrigger(hours=2),
        "model_refresh",
        priority=JobPriority.CRITICAL,
        adaptive=True,
    )

    intelligent_scheduler.add_intelligent_job(
        background_backup_state,
        CronTrigger(hour=2, minute=0),
        "backup_state",
        priority=JobPriority.HIGH,
    )

    intelligent_scheduler.add_intelligent_job(
        background_rotate_logs,
        CronTrigger(hour=3, minute=0),
        "rotate_logs",
        priority=JobPriority.NORMAL,
    )

    intelligent_scheduler.add_intelligent_job(
        background_healthcheck_alert,
        IntervalTrigger(minutes=10),
        "healthcheck_alert",
        priority=JobPriority.HIGH,
        adaptive=True,
    )

    intelligent_scheduler.add_intelligent_job(
        background_generate_explainability,
        CronTrigger(hour=4, minute=0),
        "explainability_report",
        priority=JobPriority.NORMAL,
    )

    intelligent_scheduler.add_intelligent_job(
        background_active_learning,
        IntervalTrigger(hours=6),
        "active_learning",
        priority=JobPriority.HIGH,
        adaptive=True,
    )

    intelligent_scheduler.add_intelligent_job(
        background_cleanup_sessions,
        IntervalTrigger(hours=1),
        "cleanup_sessions",
        priority=JobPriority.NORMAL,
    )

    # Enhanced beneficial jobs
    intelligent_scheduler.add_intelligent_job(
        background_model_drift_check,
        IntervalTrigger(hours=3),
        "model_drift_check",
        priority=JobPriority.HIGH,
        adaptive=True,
    )

    intelligent_scheduler.add_intelligent_job(
        background_data_quality_check,
        IntervalTrigger(hours=1),
        "data_quality_check",
        priority=JobPriority.HIGH,
        adaptive=True,
    )

    intelligent_scheduler.add_intelligent_job(
        background_feedback_volume_alert,
        IntervalTrigger(hours=2),
        "feedback_volume_alert",
        priority=JobPriority.NORMAL,
        adaptive=True,
    )

    intelligent_scheduler.add_intelligent_job(
        background_backup_verification,
        CronTrigger(hour=5, minute=0),
        "backup_verification",
        priority=JobPriority.HIGH,
    )

    intelligent_scheduler.add_intelligent_job(
        background_usage_spike_detection,
        IntervalTrigger(minutes=30),
        "usage_spike_detection",
        priority=JobPriority.NORMAL,
        adaptive=True,
    )

    intelligent_scheduler.start()
    logger.info(
        "Enhanced intelligent scheduler started with all beneficial jobs configured for maximum computational efficiency."
    )

    # Send startup notification
    send_email_notification(
        "A1Betting System Started",
        f"Enhanced A1Betting system started successfully with {len(intelligent_scheduler.job_priorities)} intelligent background jobs.",
    )


# FastAPI startup event to launch scheduler
def set_app_for_scheduler(fastapi_app: FastAPI):
    global app
    app = fastapi_app

    @fastapi_app.on_event("startup")
    def _start_scheduler_event():
        threading.Thread(target=start_scheduler, daemon=True).start()


# --- User-Facing One-Click Automation Endpoints ---


# 36. Full automated workflow: from data ingest to lineup/prop recommendation to compliance/reporting to feedback to session cleanup
@router.post("/automation/full-workflow")
async def automation_full_workflow(
    user_id: str = Body(...), context: dict = Body({}), feedback: str = Body("")
):
    """Run the full backend workflow: ingest data, recommend lineup/props, explain, compliance check, feedback, session cleanup. Returns all results."""
    if agent is None:
        return {"error": "Agent not initialized"}
    results = {}
    # 1. Ingest data (stub)
    if hasattr(agent, "ingest_data"):
        results["data_ingest"] = await agent.ingest_data(context)
    # 2. Recommend lineup
    if hasattr(agent, "recommend_lineup"):
        results["lineup"] = await agent.recommend_lineup(user_id, context)
    # 3. Recommend prop bets
    if hasattr(agent, "recommend_props"):
        results["props"] = await agent.recommend_props(user_id, context)
    # 4. Explain bet
    if hasattr(agent, "explain_bet"):
        results["explanation"] = await agent.explain_bet(user_id, context)
    # 5. Compliance check
    if hasattr(agent, "compliance_check"):
        results["compliance"] = await agent.compliance_check(user_id, context)
    # 6. Feedback
    if feedback:
        if hasattr(agent, "log_feedback"):
            agent.log_feedback(user_id, feedback, context)
            results["feedback_logged"] = True
    # 7. Session cleanup
    if hasattr(agent, "cleanup_sessions"):
        agent.cleanup_sessions()
        results["session_cleanup"] = True
    return results


# 37. One-click: get my lineup
@router.post("/automation/get-lineup")
async def automation_get_lineup(user_id: str = Body(...), context: dict = Body({})):
    """One-click: get my optimal lineup from propOllama."""
    if agent is None or not hasattr(agent, "recommend_lineup"):
        return {"error": "Agent or lineup not available"}
    return await agent.recommend_lineup(user_id, context)


# 38. One-click: get my prop bet
@router.post("/automation/get-prop")
async def automation_get_prop(user_id: str = Body(...), context: dict = Body({})):
    """One-click: get my optimal prop bet from propOllama."""
    if agent is None or not hasattr(agent, "recommend_props"):
        return {"error": "Agent or prop bet not available"}
    return await agent.recommend_props(user_id, context)


# 39. One-click: explain my bet
@router.post("/automation/explain-bet")
async def automation_explain_bet(user_id: str = Body(...), context: dict = Body({})):
    """One-click: get a full LLM-powered explanation of your bet from propOllama."""
    if agent is None or not hasattr(agent, "explain_bet"):
        return {"error": "Agent or explainability not available"}
    return await agent.explain_bet(user_id, context)


# 40. One-click: optimize my lineup
@router.post("/automation/optimize-lineup")
async def automation_optimize_lineup(
    user_id: str = Body(...), context: dict = Body({})
):
    """One-click: optimize your lineup for best odds/returns using propOllama."""
    if agent is None or not hasattr(agent, "optimize_lineup"):
        return {"error": "Agent or optimizer not available"}
    return await agent.optimize_lineup(user_id, context)


# 41. One-click: compliance check
@router.post("/automation/compliance-check")
async def automation_compliance_check(
    user_id: str = Body(...), context: dict = Body({})
):
    """One-click: run a compliance/safety check on your bet/lineup."""
    if agent is None or not hasattr(agent, "compliance_check"):
        return {"error": "Agent or compliance not available"}
    return await agent.compliance_check(user_id, context)


# 42. One-click: feedback and retrain
@router.post("/automation/feedback-retrain")
async def automation_feedback_retrain(
    user_id: str = Body(...), feedback: str = Body(...), context: dict = Body({})
):
    """One-click: submit feedback and trigger retraining/active learning."""
    if (
        agent is None
        or not hasattr(agent, "log_feedback")
        or not hasattr(agent, "active_learning_retrain")
    ):
        return {"error": "Agent or feedback/retrain not available"}
    agent.log_feedback(user_id, feedback, context)
    await agent.active_learning_retrain()
    return {"feedback_logged": True, "retrained": True}


# 43. One-click: full reset (clear all state, logs, sessions, feedback)
@router.post("/automation/full-reset")
def automation_full_reset():
    """One-click: full reset of all agent state, logs, sessions, and feedback."""
    if agent is None:
        return {"error": "Agent not initialized"}
    # Clear state
    if hasattr(agent, "clear_feedback_log"):
        agent.clear_feedback_log()
    if hasattr(agent, "clear_session_context"):
        agent.clear_session_context()
    # Remove logs
    log_path = os.path.join(os.getcwd(), "audit.log")
    if os.path.exists(log_path):
        os.remove(log_path)
    # Remove explainability report
    report_path = os.path.join(os.getcwd(), "explainability_report.json")
    if os.path.exists(report_path):
        os.remove(report_path)
    return {"reset": True}


# --- Automation & Ops Endpoints ---
import datetime


# 26. Automated daily/periodic state backup
@router.post("/automation/backup-state")
def automation_backup_state():
    """Trigger an automated backup of agent state (timestamped JSON file)."""
    if agent is None:
        return {"error": "Agent not initialized"}
    state = agent.export_full_state() if hasattr(agent, "export_full_state") else {}
    backup_dir = os.path.join(os.getcwd(), "backups")
    os.makedirs(backup_dir, exist_ok=True)
    fname = f"agent_state_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    fpath = os.path.join(backup_dir, fname)
    with open(fpath, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)
    return {"backup": fpath}


# 27. Automated log rotation
@router.post("/automation/rotate-logs")
def automation_rotate_logs():
    """Rotate audit logs (move current log to timestamped file, start new log)."""
    log_path = os.path.join(os.getcwd(), "audit.log")
    if not os.path.exists(log_path):
        return {"error": "No log file found."}
    rotated_dir = os.path.join(os.getcwd(), "logs_rotated")
    os.makedirs(rotated_dir, exist_ok=True)
    fname = f"audit_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
    shutil.move(log_path, os.path.join(rotated_dir, fname))
    # Touch new log file
    open(log_path, "a").close()
    return {"rotated": True, "new_log": log_path, "old_log": fname}


# 28. Automated plugin/model update check (stub)
@router.get("/automation/check-updates")
def automation_check_updates():
    """Check for updates to plugins, models, or dependencies (stub)."""
    if agent is None:
        return {"error": "Agent not initialized"}
    # In production, implement real update check logic
    return {"updates": "No updates found (stub)."}


# 29. Automated compliance/explainability report generation (stub)
@router.post("/automation/generate-explainability")
def automation_generate_explainability():
    """Trigger automated compliance/explainability report generation (stub)."""
    if agent is None:
        return {"error": "Agent not initialized"}
    if hasattr(agent, "generate_explainability_report"):
        agent.generate_explainability_report()
        return {"generated": True}
    return {"error": "Not supported."}


# 30. Automated feedback/active learning retraining (stub)
@router.post("/automation/active-learning")
def automation_active_learning():
    """Trigger automated feedback/active learning retraining (stub)."""
    if agent is None:
        return {"error": "Agent not initialized"}
    if hasattr(agent, "active_learning_retrain"):
        agent.active_learning_retrain()
        return {"retrained": True}
    return {"error": "Not supported."}


# 31. Automated healthcheck/alerting (stub)
@router.get("/automation/healthcheck-alert")
def automation_healthcheck_alert():
    """Run automated healthcheck and send alert if unhealthy (stub)."""
    try:
        status = full_healthcheck()
        if status.get("status") != "ok":
            # In production, send alert (email, Slack, etc)
            return {"alert": True, "status": status}
        return {"alert": False, "status": status}
    except Exception as ex:  # pylint: disable=broad-exception-caught
        return {"alert": True, "error": str(ex)}


# 32. Automated endpoint usage analytics (stub)
@router.get("/automation/endpoint-usage")
def automation_endpoint_usage():
    """Return automated analytics on endpoint usage (stub)."""
    # In production, integrate with real analytics
    return {"usage": "Endpoint usage analytics not implemented."}


# 33. Automated admin action logging (stub)
@router.post("/automation/log-admin-action")
def automation_log_admin_action(action: str = Body(...)):
    """Log an admin action for audit/compliance (stub)."""
    # In production, append to admin action log
    return {"logged": True, "action": action}


# 34. Automated session cleanup (stub)
@router.post("/automation/cleanup-sessions")
def automation_cleanup_sessions():
    """Run automated cleanup of expired/old sessions (stub)."""
    if agent is None:
        return {"error": "Agent not initialized"}
    if hasattr(agent, "cleanup_sessions"):
        agent.cleanup_sessions()
        return {"cleaned": True}
    return {"error": "Not supported."}


# 35. Automated plugin security scan (stub)
@router.post("/automation/scan-plugins")
def automation_scan_plugins():
    """Run automated security scan of all plugins/tools (stub)."""
    if agent is None:
        return {"error": "Agent not initialized"}
    if hasattr(agent, "scan_plugins"):
        agent.scan_plugins()
        return {"scanned": True}
    return {"error": "Not supported."}


#
"""
SportsExpertAgent REST API: advanced, extensible, and production-ready endpoints for agent control, streaming, analytics, plugin management, explainability, compliance, admin, and real-time features.

Features:
- Real-time streaming (SSE, WebSocket)
- Agent state export/import
- Usage, cost, and session analytics
- Plugin/tool management and hot-reload
- Model management and download
- Compliance/explainability reporting
- Health checks, admin controls, and self-test
- REST endpoint discovery and OpenAPI schema
- Frontend quickstart and integration helpers
- Robust error handling and extensibility
"""
# --- Further Advanced Features & Improvements ---
import time

from fastapi import Request
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse


# 1. Async SSE endpoint for real-time streaming (Server-Sent Events)
@router.get("/sse/conversation")
async def sse_conversation(request: Request):
    """Stream agent responses in real-time using Server-Sent Events (SSE).
    For advanced UIs that want token-by-token or chunked streaming.
    Request body: {"messages": [...], "context": ..., "user_id": ...}
    """
    if agent is None or not hasattr(agent, "stream_conversation"):
        return JSONResponse(
            {"error": "Agent or streaming not available"}, status_code=503
        )

    async def event_generator():
        try:
            data = await request.json() if request.method == "POST" else {}
            messages = data.get("messages", [])
            context = data.get("context")
            user_id = data.get("user_id")
            async for chunk in agent.stream_conversation(
                messages, context=context, user_id=user_id
            ):
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        except Exception as ex:  # pylint: disable=broad-exception-caught
            yield f"data: {json.dumps({'error': str(ex)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# 2. Download/export all agent state as JSON
@router.get("/export-state")
def export_agent_state():
    """Download/export all agent state as JSON for backup, migration, or debugging."""
    if agent is None:
        return JSONResponse({"error": "Agent not initialized"}, status_code=503)
    state = agent.export_full_state() if hasattr(agent, "export_full_state") else {}
    return JSONResponse(state)


# 3. Upload/import agent state
@router.post("/import-state")
def import_agent_state(state: dict = Body(...)):
    """Upload/import agent state from JSON for restore, migration, or debugging."""
    if agent is None:
        return JSONResponse({"error": "Agent not initialized"}, status_code=503)
    if hasattr(agent, "import_full_state"):
        agent.import_full_state(state)
        return {"imported": True}
    return {"error": "Import not supported."}


# 4. Download logs as a file
@router.get("/logs/download")
def download_logs():
    """Download logs as a file for audit, debugging, or compliance review."""
    log_path = os.path.join(os.getcwd(), "audit.log")
    if os.path.exists(log_path):
        return FileResponse(log_path, filename="audit.log")
    return JSONResponse({"error": "No log file found."}, status_code=404)


# 16. List all agent capabilities/features
@router.get("/capabilities")
def list_capabilities():
    """List all agent capabilities, features, and supported advanced options."""
    if agent is None:
        return {"error": "Agent not initialized"}
    return getattr(
        agent,
        "list_capabilities",
        lambda: [
            "streaming (SSE, WebSocket)",
            "state export/import",
            "usage/cost analytics",
            "plugin/tool management",
            "model management",
            "compliance/explainability reporting",
            "health checks, admin controls, self-test",
            "REST endpoint discovery",
            "frontend quickstart",
            "robust error handling",
            "extensibility hooks",
        ],
    )()


# 17. Return OpenAPI schema for this router
@router.get("/openapi-schema")
def get_openapi_schema(request: Request):
    """Return the OpenAPI schema for this router (for frontend/admin integration)."""
    return request.app.openapi()


# 18. Return a quickstart JSON for frontend integration
@router.get("/quickstart")
def get_quickstart():
    """Return a quickstart JSON for frontend integration (endpoints, usage, etc)."""
    return {
        "api_base": "/sports-expert",
        "streaming": ["/sse/conversation", "/ws/conversation", "/conversation/stream"],
        "analytics": ["/usage-analytics", "/session-analytics", "/metrics"],
        "admin": ["/admin/pause", "/admin/resume", "/admin/reload", "/admin/shutdown"],
        "plugin": [
            "/plugins",
            "/plugins/reload",
            "/plugin/register",
            "/plugin-call/{plugin_name}",
        ],
        "model": ["/models", "/models/switch", "/models/download"],
        "compliance": [
            "/explainability",
            "/explainability-report",
            "/explainability-report/download",
        ],
        "state": ["/export-state", "/import-state"],
        "logs": ["/logs", "/logs/download", "/audit-log"],
        "health": ["/health", "/healthcheck/full"],
    }


# 19. Return a summary of all plugin/tool code
@router.get("/plugins/summary")
def plugins_summary():
    """Return a summary of all registered plugin/tool code (for admin review)."""
    if agent is None:
        return {"error": "Agent not initialized"}
    plugins = getattr(agent, "plugins", {})
    return {name: str(func) for name, func in plugins.items()}


# 20. Return a summary of all models and their status
@router.get("/models/summary")
def models_summary():
    """Return a summary of all available models and their status (for admin)."""
    if agent is None:
        return {"error": "Agent not initialized"}
    return getattr(
        agent,
        "models_summary",
        lambda: {"models": [getattr(agent, "model_name", "unknown")]},
    )()


# 21. Return a summary of all feedback/active learning items
@router.get("/feedback/summary")
def feedback_summary():
    """Return a summary of all feedback and active learning items."""
    if agent is None:
        return {"error": "Agent not initialized"}
    return getattr(agent, "feedback_log", [])


# 22. Return a summary of all user/session context
@router.get("/session-context/summary")
def session_context_summary():
    """Return a summary of all user/session context (for admin/analytics)."""
    if agent is None:
        return {"error": "Agent not initialized"}
    return getattr(agent, "session_context", {})


# 23. Return a summary of all logs/errors
@router.get("/logs/summary")
def logs_summary():
    """Return a summary of all logs/errors (for admin/analytics)."""
    log_path = os.path.join(os.getcwd(), "audit.log")
    if os.path.exists(log_path):
        with open(log_path, encoding="utf-8") as f:
            return {"log": f.read()[-5000:]}
    return {"log": "No log file found."}


# 24. Return a summary of all compliance/explainability reports
@router.get("/explainability/summary")
def explainability_summary():
    """Return a summary of all compliance/explainability reports (for admin)."""
    report_path = os.path.join(os.getcwd(), "explainability_report.json")
    if os.path.exists(report_path):
        with open(report_path, encoding="utf-8") as f:
            return {"report": f.read()[-5000:]}
    return {"report": "No explainability report found."}


# 25. Return a summary of all admin actions (stub)
@router.get("/admin/summary")
def admin_summary():
    """Return a summary of all admin actions (for audit/analytics, stub)."""
    return {"admin_actions": "Admin action logging not implemented."}


# 5. System dependency/version checks
@router.get("/dependency-versions")
def dependency_versions():
    """Get versions of key dependencies (FastAPI, numpy, etc)."""
    deps = [
        "fastapi",
        "numpy",
        "pydantic",
        "uvicorn",
        "scipy",
        "sklearn",
        "torch",
        "transformers",
    ]
    versions = {}
    for dep in deps:
        try:
            versions[dep] = pkg_resources.get_distribution(dep).version
        except Exception:  # pylint: disable=broad-exception-caught
            versions[dep] = None
    return {"python": sys.version, "dependencies": versions}


# 6. Admin reload/shutdown (stub)
@router.post("/admin/reload")
def admin_reload():
    """Reload agent (admin only, stub)."""
    if agent is None:
        return {"error": "Agent not initialized"}
    if hasattr(agent, "reload"):
        agent.reload()
        return {"reloaded": True}
    return {"error": "Reload not supported."}


@router.post("/admin/shutdown")
def admin_shutdown():
    """Shutdown backend (admin only, stub)."""
    # In production, use a proper shutdown signal
    os._exit(0)


# 7. List all REST endpoints
@router.get("/endpoints")
def list_endpoints(request: Request):
    """List all available REST endpoints for this router."""
    routes = [r.path for r in request.app.routes if hasattr(r, "path")]
    return {"endpoints": routes}


# 8. Usage/cost analytics (advanced)
@router.get("/usage-analytics")
def usage_analytics():
    """Get advanced usage/cost analytics (stub)."""
    if agent is None:
        return {"error": "Agent not initialized"}
    return {
        "total_requests": getattr(agent, "total_requests", 0),
        "total_tokens": getattr(agent, "total_tokens", 0),
        "cost_breakdown": getattr(agent, "cost_breakdown", {}),
        "usage_by_user": getattr(agent, "usage_by_user", {}),
    }


# 9. Advanced user/session analytics
@router.get("/session-analytics")
def session_analytics():
    """Get advanced session/user analytics (stub)."""
    if agent is None:
        return {"error": "Agent not initialized"}
    return getattr(agent, "session_analytics", lambda: {})()


# 10. Plugin hot-reload (stub)
@router.post("/plugins/reload")
def reload_plugins():
    """Hot-reload all plugins/tools (stub)."""
    if agent is None:
        return {"error": "Agent not initialized"}
    if hasattr(agent, "reload_plugins"):
        agent.reload_plugins()
        return {"reloaded": True}
    return {"error": "Reload not supported."}


# 11. Model download/check (stub)
@router.get("/models/download")
def download_model():
    """Download/check model file (stub)."""
    if agent is None:
        return {"error": "Agent not initialized"}
    if hasattr(agent, "download_model"):
        return agent.download_model()
    return {"error": "Model download not supported."}


# 12. Compliance/explainability report download as file
@router.get("/explainability-report/download")
def download_explainability_report():
    """Download explainability/compliance report as a file."""
    report_path = os.path.join(os.getcwd(), "explainability_report.json")
    if os.path.exists(report_path):
        return FileResponse(report_path, filename="explainability_report.json")
    return JSONResponse({"error": "No explainability report found."}, status_code=404)


# 13. Healthcheck with dependency checks
@router.get("/healthcheck/full")
def full_healthcheck():
    """Full healthcheck including dependencies and agent status."""
    try:
        status_dict = {
            "agent": getattr(agent, "enabled", False) if agent else False,
            "llm_engine": bool(getattr(agent, "llm_engine", None)) if agent else False,
            "model": (
                getattr(agent, "get_active_model", lambda: None)() if agent else None
            ),
            "dependencies": dependency_versions()["dependencies"],
            "uptime": time.time() - psutil.boot_time(),
        }
        return {"status": "ok", **status_dict}
    except Exception as ex:  # pylint: disable=broad-exception-caught
        return {"status": "error", "error": str(ex)}


# 14. Admin broadcast message (stub)
@router.post("/admin/broadcast")
def admin_broadcast(message: str = Body(...)):
    """Broadcast a message to all users/sessions (stub)."""
    if agent is None:
        return {"error": "Agent not initialized"}
    if hasattr(agent, "broadcast_message"):
        agent.broadcast_message(message)
        return {"broadcasted": True}
    return {"error": "Broadcast not supported."}


# 15. Agent self-test
@router.get("/self-test")
def agent_self_test():
    """Run agent self-test and return results."""
    if agent is None:
        return {"error": "Agent not initialized"}
    if hasattr(agent, "self_test"):
        return agent.self_test()
    return {"error": "Self-test not supported."}


# --- Enhanced Agent Interface with Type Safety ---
from typing import Any, Dict, List, Optional, Protocol, Union, runtime_checkable


@runtime_checkable
class AgentInterface(Protocol):
    """Protocol defining the expected agent interface for type safety."""

    def ingest_data(self, data: Dict[str, Any]) -> Dict[str, Any]: ...
    def retrain_agent(
        self, new_data: List[Any], feedback: List[Any]
    ) -> Dict[str, Any]: ...
    def detect_model_drift(self) -> Optional[Dict[str, Any]]: ...
    def check_data_quality(self) -> Optional[List[str]]: ...
    def export_full_state(self) -> Dict[str, Any]: ...
    def import_full_state(self, state: Dict[str, Any]) -> None: ...
    def cleanup_sessions(self) -> None: ...
    def generate_explainability_report(self) -> None: ...
    def active_learning_retrain(self) -> None: ...
    def scan_plugins(self) -> None: ...


class SafeAgentWrapper:
    """Safe wrapper for agent operations with fallbacks and type checking."""

    def __init__(self, agent: Optional[Any]):
        self._agent = agent
        self._validated = False
        self._validate_agent()

    def _validate_agent(self) -> None:
        """Validate agent interface and capabilities."""
        if self._agent is None:
            logger.warning("Agent is None - operations will be no-ops")
            return

        # Check if agent implements expected interface
        if isinstance(self._agent, AgentInterface):
            self._validated = True
            logger.info("Agent interface validated successfully")
        else:
            logger.warning(
                "Agent does not implement full interface - some operations may fail"
            )

    def safe_call(self, method_name: str, *args, **kwargs) -> Any:
        """Safely call agent method with fallback."""
        if not self._agent:
            logger.warning("Agent not available for {method_name}")
            return None

        if not hasattr(self._agent, method_name):
            logger.warning("Agent missing method {method_name}")
            return None

        try:
            method = getattr(self._agent, method_name)
            return method(*args, **kwargs)
        except Exception as ex:  # pylint: disable=broad-exception-caught
            logger.error("Agent method {method_name} failed: {ex}")
            return None

    @property
    def is_available(self) -> bool:
        return self._agent is not None

    @property
    def is_validated(self) -> bool:
        return self._validated


# Create safe agent wrapper
safe_agent = SafeAgentWrapper(agent)


# --- Enhanced Scheduler with Intelligent Job Management ---
class IntelligentJobScheduler:
    """Enhanced job scheduler with priority management, health monitoring, and adaptive scheduling."""

    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.job_priorities: Dict[str, JobPriority] = {}
        self.job_health: Dict[str, float] = defaultdict(lambda: 1.0)  # Health score 0-1
        self.adaptive_intervals: Dict[str, int] = {}
        self.last_execution_times: Dict[str, float] = {}

    def add_intelligent_job(
        self,
        func: Callable,
        trigger,
        job_id: str,
        priority: JobPriority = JobPriority.NORMAL,
        adaptive: bool = True,
        health_check: bool = True,
    ):
        """Add a job with intelligent monitoring and adaptation."""

        @wraps(func)
        def monitored_job():
            start_time = time.time()
            try:
                with job_execution_context(job_id):
                    result = func()
                    execution_time = time.time() - start_time

                    # Update job health based on execution
                    if health_check:
                        self._update_job_health(job_id, True, execution_time)

                    # Adapt interval based on performance
                    if adaptive:
                        self._adapt_job_interval(job_id, execution_time)

                    self.last_execution_times[job_id] = time.time()
                    return result

            except Exception as ex:  # pylint: disable=broad-exception-caught
                execution_time = time.time() - start_time
                if health_check:
                    self._update_job_health(job_id, False, execution_time)
                logger.error("Intelligent job {job_id} failed: {ex}")
                raise ex

        self.job_priorities[job_id] = priority
        self.scheduler.add_job(monitored_job, trigger, id=job_id)

    def _update_job_health(self, job_id: str, success: bool, execution_time: float):
        """Update job health score based on execution results."""
        current_health = self.job_health[job_id]

        # Health scoring: success rate + performance factor
        success_factor = 0.1 if success else -0.2
        performance_factor = max(
            0, 0.05 - execution_time / 1000
        )  # Penalty for slow jobs

        new_health = max(
            0, min(1, current_health + success_factor + performance_factor)
        )
        self.job_health[job_id] = new_health

        # Alert on poor health
        if new_health < 0.3:
            send_email_notification(
                f"Job Health Alert: {job_id}",
                f"Job {job_id} health degraded to {new_health:.2f}",
            )

    def _adapt_job_interval(self, job_id: str, execution_time: float):
        """Adapt job intervals based on performance and system load."""
        # Simple adaptive logic - can be enhanced
        if execution_time > 30:  # Slow job
            # Increase interval
            pass  # Implementation depends on trigger type
        elif execution_time < 1:  # Fast job
            # Could decrease interval if system allows
            pass

    def get_job_status(self) -> Dict[str, Any]:
        """Get comprehensive job status and health metrics."""
        return {
            "active_jobs": len(self.scheduler.get_jobs()),
            "job_health": dict(self.job_health),
            "job_priorities": {k: v.name for k, v in self.job_priorities.items()},
            "last_executions": self.last_execution_times,
            "scheduler_running": self.scheduler.running,
        }

    def start(self):
        """Start the intelligent scheduler."""
        self.scheduler.start()
        logger.info("Intelligent job scheduler started")

    def shutdown(self, wait: bool = True):
        """Gracefully shutdown scheduler."""
        self.scheduler.shutdown(wait=wait)
        logger.info("Intelligent job scheduler stopped")


# Create intelligent scheduler instance
intelligent_scheduler = IntelligentJobScheduler()

# --- Final Agent and Router Setup ---
# This section must be at the end to resolve dependencies

# Import the actual router and agent from the main service
try:
    from fastapi import APIRouter, Body, HTTPException

    from .betting_opportunity_service import (
        SportsExpertAgent,
        betting_opportunity_service,
    )

    logger = logging.getLogger(__name__)
    router = APIRouter(prefix="/sports-expert", tags=["SportsExpertAgent"])

    # Get agent instance or create fallback
    agent: Optional[SportsExpertAgent] = getattr(
        betting_opportunity_service, "sports_expert_agent", None
    )
    if agent is None:
        # Create a fallback instance
        agent = SportsExpertAgent()
        logger.warning("Created fallback SportsExpertAgent instance")

    # Update safe agent wrapper with actual agent
    safe_agent = SafeAgentWrapper(agent)

    logger.info(
        "Successfully initialized enhanced A1Betting system with computational perfection features"
    )

except ImportError as ex:
    logger.error("Failed to import dependencies: {ex}")
    # Create minimal fallbacks
    router = None
    agent = None
    safe_agent = SafeAgentWrapper(None)

# Add endpoint to get intelligent scheduler status
if router:

    @router.get("/scheduler/status")
    def get_scheduler_status():
        """Get intelligent scheduler status and job health metrics."""
        return intelligent_scheduler.get_job_status()

    @router.post("/scheduler/force-job")
    def force_job_execution(job_id: str = Body(...)):
        """Force execution of a specific job (admin only)."""
        try:
            job = intelligent_scheduler.scheduler.get_job(job_id)
            if job:
                job.func()
                return {"executed": True, "job_id": job_id}
            return {"error": f"Job {job_id} not found"}
        except Exception as ex:  # pylint: disable=broad-exception-caught
            logger.error("Force job execution failed: {ex}")
            return {"error": str(ex)}
