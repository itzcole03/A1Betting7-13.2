import asyncio
import json
import logging
import os
import re
import time

import yaml

from backend.services.comprehensive_feature_engine import enrich_prop_with_all_features

config_path = os.path.join(
    os.path.dirname(__file__), "..", "config", "business_rules.yaml"
)
with open(config_path, "r") as f:
    rules = yaml.safe_load(f)
forbidden_combos = [tuple(x) for x in rules.get("forbidden_combos", [])]
allowed_stat_types = set(rules.get("allowed_stat_types", []))
logger = logging.getLogger("propollama")


async def pre_llm_business_logic(request):
    # Validate entry amount
    entry_amt = getattr(request, "entryAmount", None)
    if not isinstance(entry_amt, (int, float)) or entry_amt < 1.0 or entry_amt > 1000.0:
        logger.error("Invalid entryAmount: %s", entry_amt)
        raise ValueError(f"Entry amount {entry_amt} outside allowed range [1, 1000]")

    # Validate user and session
    user = getattr(request, "userId", None)
    session = getattr(request, "sessionId", None)
    if not user or not isinstance(user, str):
        logger.error("Invalid userId: %s", user)
        raise ValueError("Invalid or missing userId")
    if not session or not isinstance(session, str):
        logger.error("Invalid sessionId: %s", session)
        raise ValueError("Invalid or missing sessionId")

    # Check for forbidden prop combinations
    for idx, prop in enumerate(request.selectedProps):
        combo = (prop.get("player"), prop.get("statType"), prop.get("choice"))
        if combo in forbidden_combos:
            logger.error("Forbidden prop combo at index %d: %s", idx + 1, combo)
            raise ValueError(f"Forbidden prop combination: {combo}")

    # Check for duplicate props (by player, statType, line, choice)
    seen = set()
    for idx, prop in enumerate(request.selectedProps):
        key = (
            prop.get("player"),
            prop.get("statType"),
            prop.get("line"),
            prop.get("choice"),
        )
        if key in seen:
            logger.error("Duplicate prop detected at index %d: %s", idx + 1, key)
            raise ValueError(f"Duplicate prop detected: {key}")
        seen.add(key)

    # Debug log after validation, before enrichment
    logger.info(
        "[DEBUG] pre_llm_business_logic received %d props: %s",
        len(getattr(request, "selectedProps", [])),
        getattr(request, "selectedProps", []),
    )

    # Enrich all props concurrently using modular service
    enriched_props = await asyncio.gather(
        *[
            enrich_prop_with_all_features(prop, user, session, allowed_stat_types)
            for prop in request.selectedProps
        ]
    )

    logger.info(
        "User %s, session %s, entry %s, props validated and fully enriched.",
        user,
        session,
        entry_amt,
    )
    return enriched_props, entry_amt, user, session


from fastapi import APIRouter, HTTPException, Request

from backend.advanced_feature_engineering import advanced_feature_engineer

# Import advanced enrichment modules
from backend.services.enhanced_ml_ensemble_service import get_enhanced_prediction
from backend.services.unified_prediction_service import unified_prediction_service

router = APIRouter(prefix="/api/v1/propollama")


import asyncio
import logging
import os
from typing import Optional

import httpx
import yaml

from backend.services.comprehensive_feature_engine import enrich_prop_with_all_features

config_path = os.path.join(
    os.path.dirname(__file__), "..", "config", "business_rules.yaml"
)
with open(config_path, "r") as f:
    rules = yaml.safe_load(f)
forbidden_combos = [tuple(x) for x in rules.get("forbidden_combos", [])]
allowed_stat_types = set(rules.get("allowed_stat_types", []))
logger = logging.getLogger("propollama")


async def pre_llm_business_logic(request):
    # Validate entry amount
    entry_amt = getattr(request, "entryAmount", None)
    if not isinstance(entry_amt, (int, float)) or entry_amt < 1.0 or entry_amt > 1000.0:
        logger.error("Invalid entryAmount: %s", entry_amt)
        raise ValueError(f"Entry amount {entry_amt} outside allowed range [1, 1000]")

    # Validate user and session
    user = getattr(request, "userId", None)
    session = getattr(request, "sessionId", None)
    if not user or not isinstance(user, str):
        logger.error("Invalid userId: %s", user)
        raise ValueError("Invalid or missing userId")
    if not session or not isinstance(session, str):
        logger.error("Invalid sessionId: %s", session)
        raise ValueError("Invalid or missing sessionId")

    # Check for forbidden prop combinations
    for idx, prop in enumerate(request.selectedProps):
        combo = (prop.get("player"), prop.get("statType"), prop.get("choice"))
        if combo in forbidden_combos:
            logger.error("Forbidden prop combo at index %d: %s", idx + 1, combo)
            raise ValueError(f"Forbidden prop combination: {combo}")

    # Check for duplicate props (by player, statType, line, choice)
    seen = set()
    for idx, prop in enumerate(request.selectedProps):
        key = (
            prop.get("player"),
            prop.get("statType"),
            prop.get("line"),
            prop.get("choice"),
        )
        if key in seen:
            logger.error("Duplicate prop detected at index %d: %s", idx + 1, key)
            raise ValueError(f"Duplicate prop detected: {key}")
        seen.add(key)

    # Debug log after validation, before enrichment
    logger.info(
        "[DEBUG] pre_llm_business_logic received %d props: %s",
        len(getattr(request, "selectedProps", [])),
        getattr(request, "selectedProps", []),
    )

    # Enrich all props concurrently using modular service
    enriched_props = await asyncio.gather(
        *[
            enrich_prop_with_all_features(prop, user, session, allowed_stat_types)
            for prop in request.selectedProps
        ]
    )

    logger.info(
        "User %s, session %s, entry %s, props validated and fully enriched.",
        user,
        session,
        entry_amt,
    )
    return enriched_props, entry_amt, user, session


from typing import Optional


async def fetch_injury_status(
    player: str,
    http_client: Optional[httpx.AsyncClient] = None,
    api_key: Optional[str] = None,
    sport: str = "basketball_nba",
) -> str:
    """
    Fetch the current injury status of a player from a production data source (e.g., sports API).
    Uses an injected async HTTP client for testability and production use.
    Args:
        player: Player name (must match API data)
        http_client: Injected httpx.AsyncClient
        api_key: API key for the injury API (should be set via config/env)
        sport: Sport key (default: 'basketball_nba')
    Returns:
        The injury status string for the player, or raises if not found.
    """
    # Placeholder: Replace with real API integration (e.g., SportsDataIO, Sportradar, etc.)
    if http_client is None:
        async with httpx.AsyncClient() as client:
            return await fetch_injury_status(
                player, http_client=client, api_key=api_key, sport=sport
            )
    # Example: resp = await http_client.get(f"https://api.sportsdata.io/v3/nba/injuries/json/PlayerInjuries/{player}?key={api_key}")
    # resp.raise_for_status()
    # data = resp.json()
    # return data.get("InjuryStatus", "unknown")
    raise NotImplementedError(
        "fetch_injury_status must be implemented with a real data source."
    )


import traceback


def build_ensemble_prompt(props, entry_amt, user, session):
    """
    Build the LLM prompt for ensemble analysis using a robust template and advanced prompt engineering.
    - Use clear instructions, context, and formatting for LLM reliability
    - Add explicit sections for risk, payout, correlation, and recommendation
    """
    import datetime
    import logging
    import os
    from datetime import datetime

    import yaml

    logger = logging.getLogger("propollama")
    try:
        # Determine sport and bet_type from props (default to basketball_nba, default)
        sport = props[0].get("sport", "basketball_nba") if props else "basketball_nba"
        bet_type = "default"
        version = "v1"
        # Load prompt templates
        config_path = os.path.join(
            os.path.dirname(__file__), "..", "config", "prompt_templates.yaml"
        )
        with open(config_path, "r", encoding="utf-8") as f:
            prompt_config = yaml.safe_load(f)
        template = (
            prompt_config.get("prompts", {})
            .get(version, {})
            .get(sport, {})
            .get(bet_type)
        )
        if not template:
            logger.warning(
                f"Prompt template not found for sport={sport}, bet_type={bet_type}, version={version}. Using fallback."
            )
            template = "SYSTEM: PropOllama fallback prompt.\nUSER: {user}, Session: {session}, Entry: {entry_amt}, Date: {date}\nPROPS:\n{props_section}"
        # Build props section with all enriched fields
        props_section = ""
        for idx, prop in enumerate(props, 1):
            props_section += f"  {idx}. Player: {prop.get('player')}, Stat: {prop.get('statType')}, Line: {prop.get('line')}, Choice: {prop.get('choice')}, Odds: {prop.get('odds')}\n"
            # Add advanced enrichment fields
            if "ensemble_prediction" in prop:
                ep = prop["ensemble_prediction"]
                props_section += f"     Ensemble Prediction: {ep.get('predicted_value', 'N/A')}, Confidence: {ep.get('confidence', 'N/A')}, Recommendation: {ep.get('recommendation', 'N/A')}, Risk: {ep.get('risk_score', 'N/A')}\n"
            if "feature_set" in prop:
                fs = prop["feature_set"]
                # Show a summary of key features
                top_features = ", ".join(
                    f"{k}: {v:.2f}"
                    for k, v in list(fs.items())[:5]
                    if isinstance(v, (int, float))
                )
                props_section += f"     Key Features: {top_features}\n"
            if "feature_metrics" in prop:
                # Optionally, add feature quality summary
                pass
        prompt = template.format(
            user=user,
            session=session,
            entry_amt=entry_amt,
            date=datetime.now().strftime("%Y-%m-%d %H:%M"),
            props_section=props_section,
        )
        logger.info(
            f"Prompt built for user {user}, session {session}, entry {entry_amt}, {len(props)} props, sport={sport}, bet_type={bet_type}, version={version}."
        )
        return prompt
    except Exception as e:
        logger.error(f"build_ensemble_prompt error: {e}")
        raise


async def post_llm_business_logic(llm_response, props, entry_amt, user, session):
    """
    Production post-LLM business logic: parse, validate, or enrich LLM output.
    - Parse LLM output for required fields (risk, correlation, payout, recommendation, confidence, key factors)
    - Score and validate output
    - Check against business rules (e.g., confidence threshold, forbidden recommendations)
    - Add metadata or warnings if needed
    """
    import logging
    import re

    logger = logging.getLogger("propollama")
    try:
        parsed = {
            "risk_assessment": None,
            "correlation_analysis": None,
            "payout_potential": None,
            "recommendation": None,
            "confidence_score": None,
            "key_factors": [],
            "raw": llm_response,
            "warnings": [],
        }
        # Parse sections using regex
        patterns = {
            "risk_assessment": r"Risk Assessment:\s*(.*)",
            "correlation_analysis": r"Correlation Analysis:\s*(.*)",
            "payout_potential": r"Payout Potential:\s*(.*)",
            "recommendation": r"Recommendation:\s*(.*)",
            "confidence_score": r"Confidence Score \(1-10\):\s*([0-9]+)",
            "key_factors": r"Key Factors:\s*(.*)",
        }
        for key, pat in patterns.items():
            match = re.search(pat, llm_response, re.IGNORECASE)
            if match:
                parsed[key] = match.group(1).strip()
        # Key factors: split by bullet or comma
        if parsed["key_factors"]:
            factors = re.split(r"[-•]\s*|,", parsed["key_factors"])
            parsed["key_factors"] = [f.strip() for f in factors if f.strip()]
        # Confidence score: convert to int and check threshold
        try:
            conf = int(parsed["confidence_score"])
            parsed["confidence_score"] = conf
            if conf < 5:
                parsed["warnings"].append("Low confidence score: review recommended.")
        except Exception:
            parsed["warnings"].append("Could not parse confidence score.")
        # Business rule: forbidden recommendations
        forbidden = {"avoid", "do not bet", "not recommended"}
        if parsed["recommendation"] and any(
            fb in parsed["recommendation"].lower() for fb in forbidden
        ):
            parsed["warnings"].append(
                "Recommendation is negative: check for compliance."
            )
        # Add metadata and enriched fields
        parsed["user"] = user
        parsed["session"] = session

        # Validate entry amount
        if (
            not isinstance(entry_amt, (int, float))
            or entry_amt < 1.0
            or entry_amt > 1000.0
        ):
            logger.error("Invalid entryAmount: %s", entry_amt)
            raise ValueError(
                f"Entry amount {entry_amt} outside allowed range [1, 1000]"
            )

        # Validate user and session
        if not user or not isinstance(user, str):
            logger.error("Invalid userId: %s", user)
            raise ValueError("Invalid or missing userId")
        if not session or not isinstance(session, str):
            logger.error("Invalid sessionId: %s", session)
            raise ValueError("Invalid or missing sessionId")

        # Check for forbidden prop combinations
        for idx, prop in enumerate(props):
            combo = (prop.get("player"), prop.get("statType"), prop.get("choice"))
            if combo in forbidden_combos:
                logger.error("Forbidden prop combo at index %d: %s", idx + 1, combo)
                raise ValueError(f"Forbidden prop combination: {combo}")

        # Check for duplicate props (by player, statType, line, choice)
        seen = set()
        for idx, prop in enumerate(props):
            key = (
                prop.get("player"),
                prop.get("statType"),
                prop.get("line"),
                prop.get("choice"),
            )
            if key in seen:
                logger.error("Duplicate prop detected at index %d: %s", idx + 1, key)
                raise ValueError(f"Duplicate prop detected: {key}")
            seen.add(key)

        # Debug log after validation, before enrichment
        logger.info(
            "[DEBUG] pre_llm_business_logic received %d props: %s",
            len(props),
            props,
        )

        # Enrich all props concurrently using modular service
        enriched_props = await asyncio.gather(
            *[
                enrich_prop_with_all_features(prop, user, session, allowed_stat_types)
                for prop in props
            ]
        )

        logger.info(
            "User %s, session %s, entry %s, props validated and fully enriched.",
            user,
            session,
            entry_amt,
        )
        return enriched_props, entry_amt, user, session
    except Exception as e:
        logger.error("Exception in post_llm_business_logic: %s", str(e), exc_info=True)
        raise


from typing import Any, Dict, List, Optional

from fastapi import Body, Depends, HTTPException, Request, status
from fastapi.exception_handlers import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

from backend.utils.llm_engine import llm_engine
from backend.utils.rate_limiter import RateLimiter


# --- Ollama Model Pull Endpoint ---
@router.post(
    "/pull_model",
    response_model=dict,
    summary="Pull an Ollama model by name",
    description="Pull a model from Ollama by name (e.g., 'llama2:7b'). Only alphanumerics, dashes, underscores, slashes, and colon are allowed. Returns output, error, and status.",
    responses={
        200: {"description": "Model pulled successfully."},
        400: {"description": "Invalid model name or pull failed."},
        500: {"description": "Internal error."},
    },
    tags=["Ollama"],
)
async def propollama_pull_model(
    model_name: str = Body(
        ...,
        embed=True,
        title="Model Name",
        description="Model name in the format 'name:tag' (e.g., 'llama2:7b'). Only alphanumerics, dashes, underscores, slashes, and colon are allowed.",
        min_length=3,
        max_length=64,
        example="llama2:7b",
    ),
    request: Request = None,
) -> Dict[str, Any]:
    """
    Pull a model from Ollama by name (e.g., "llama2:7b").
    - Triggers `ollama pull <model_name>` via async subprocess.
    - Returns output, error, and status.
    - Error codes:
        200: Success, returns {"output": str, "success": True}
        400: Invalid model name or pull failed
        500: Internal error
    """
    import uuid

    request_id = str(uuid.uuid4())
    # Hardened model name validation: only allow alphanumerics, dashes, underscores, slashes, and colon, with length limits
    if not isinstance(model_name, str) or not (3 <= len(model_name) <= 64):
        logger.error(
            json.dumps(
                {
                    "event": "invalid_model_name_length",
                    "model_name": model_name,
                    "request_id": request_id,
                }
            )
        )
        return {
            "success": False,
            "error": "Model name must be a string between 3 and 64 characters.",
            "request_id": request_id,
        }
    if not re.match(r"^[a-zA-Z0-9_\-/]+:[a-zA-Z0-9_\-.]+$", model_name):
        logger.error(
            json.dumps(
                {
                    "event": "invalid_model_name_format",
                    "model_name": model_name,
                    "request_id": request_id,
                }
            )
        )
        return {
            "success": False,
            "error": "Invalid model name. Use format 'name:tag' (e.g., 'llama2:7b'). Only alphanumerics, dashes, underscores, slashes, and colon are allowed.",
            "request_id": request_id,
        }
    try:
        logger.info(
            json.dumps(
                {
                    "event": "pull_model_attempt",
                    "model_name": model_name,
                    "request_id": request_id,
                }
            )
        )
        # Use asyncio subprocess for non-blocking execution
        proc = await asyncio.create_subprocess_exec(
            "ollama",
            "pull",
            model_name,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)
        except asyncio.TimeoutError:
            logger.error(
                json.dumps(
                    {
                        "event": "pull_model_timeout",
                        "model_name": model_name,
                        "request_id": request_id,
                    }
                )
            )
            proc.kill()
            await proc.wait()
            return {
                "success": False,
                "error": f"Timeout: Model pull took too long for '{model_name}'.",
                "request_id": request_id,
            }
        if proc.returncode == 0:
            logger.info(
                json.dumps(
                    {
                        "event": "pull_model_success",
                        "model_name": model_name,
                        "request_id": request_id,
                    }
                )
            )
            return {
                "success": True,
                "output": stdout.decode(),
                "request_id": request_id,
            }
        else:
            logger.error(
                json.dumps(
                    {
                        "event": "pull_model_failure",
                        "model_name": model_name,
                        "stderr": stderr.decode(),
                        "stdout": stdout.decode(),
                        "request_id": request_id,
                    }
                )
            )
            return {
                "success": False,
                "error": stderr.decode() or stdout.decode(),
                "request_id": request_id,
            }
    except Exception as e:
        logger.error(
            json.dumps(
                {
                    "event": "pull_model_exception",
                    "model_name": model_name,
                    "error": str(e),
                    "request_id": request_id,
                }
            )
        )
        return {"success": False, "error": str(e), "request_id": request_id}


# ...existing code...


# --- Logger Configuration ---
logger = logging.getLogger("propollama")
logger.setLevel(logging.INFO)
formatter = logging.Formatter("[%(asctime)s] %(levelname)s %(name)s: %(message)s")
# Always add a StreamHandler for console output
if not any(isinstance(h, logging.StreamHandler) for h in logger.handlers):
    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)
    logger.addHandler(stream_handler)
# Optional: persistent file logging
log_dir = os.path.join(os.path.dirname(__file__), "..", "logs")
os.makedirs(log_dir, exist_ok=True)
file_handler_path = os.path.join(log_dir, "propollama.log")
if not any(
    isinstance(h, logging.FileHandler)
    and getattr(h, "baseFilename", None) == file_handler_path
    for h in logger.handlers
):
    file_handler = logging.FileHandler(file_handler_path)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

# --- Global Error Handler for Consistent Error Schema ---
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError as FastAPIRequestValidationError
from starlette.requests import Request as StarletteRequest


def create_error_response(
    error: str,
    message: str = None,
    fields: dict = None,
    trace: str = None,
    status_code: int = 500,
):
    resp = {"error": error}
    if message:
        resp["message"] = message
    if fields:
        resp["fields"] = fields
    if trace:
        resp["trace"] = trace
    return JSONResponse(status_code=status_code, content=resp)


def add_global_error_handlers(app: FastAPI):
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: StarletteRequest, exc: HTTPException):
        detail = (
            exc.detail if isinstance(exc.detail, dict) else {"message": str(exc.detail)}
        )
        return create_error_response(
            error=detail.get("error", "HTTPException"),
            message=detail.get("message", str(exc.detail)),
            fields=detail.get("fields"),
            trace=detail.get("trace"),
            status_code=exc.status_code,
        )

    @app.exception_handler(FastAPIRequestValidationError)
    async def validation_exception_handler(
        request: StarletteRequest, exc: FastAPIRequestValidationError
    ):
        return create_error_response(
            error="Validation Error",
            message="Invalid request payload.",
            fields=exc.errors(),
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: StarletteRequest, exc: Exception):
        import traceback

        return create_error_response(
            error="Internal Server Error",
            message=str(exc),
            trace=traceback.format_exc(),
            status_code=500,
        )


class PropOllamaChatRequest(BaseModel):
    """Request model for PropOllama chat endpoint."""

    message: str
    # Accept any type for context, will coerce in endpoint
    context: Optional[Any] = Field(
        default=None,
        description="Optional context for the chat. Can be a dictionary (object), a JSON string, or a plain string. If a string, will be auto-converted or wrapped as a dict for maximum compatibility.",
    )
    model: Optional[str] = None  # Optional model selection


class PropOllamaChatResponse(BaseModel):
    """Response model for PropOllama chat endpoint."""

    response: str
    model_used: str = "PropOllama_Enhanced_LLM_v6.0"
    timestamp: str


@router.post(
    "/chat",
    response_model=PropOllamaChatResponse,
    summary="PropOllama chat endpoint",
    description="Send a chat message to PropOllama. Expects a JSON body with at least a 'message' field (str). Optional: 'context' (dict), 'model' (str). Returns a response, model used, and timestamp.",
    responses={
        200: {"description": "Chat response returned successfully."},
        400: {"description": "Invalid model selection or model selection error."},
        415: {"description": "Missing or invalid Content-Type."},
        422: {"description": "Validation error (invalid payload)."},
        503: {"description": "Model not ready or LLM client not available."},
        504: {"description": "LLM chat timeout."},
        500: {"description": "Internal server error or LLM chat error."},
    },
    tags=["Chat"],
)
async def propollama_chat(request: Request):
    """
    PropOllama chat endpoint (POST /chat)

    API Contract:
        - Expects: JSON body with at least a 'message' field (str). Optional: 'context' (dict), 'model' (str).
        - Returns: JSON with 'response', 'model_used', 'timestamp'.

    Error Handling:
        - 400: Invalid model selection or model selection error
        - 415: Missing or invalid Content-Type
        - 422: Validation error (invalid payload)
        - 503: Model not ready or LLM client not available
        - 504: LLM chat timeout
        - 500: Internal server error or LLM chat error
    """
    import traceback
    import uuid
    from datetime import datetime

    from pydantic import ValidationError

    request_id = str(uuid.uuid4())
    try:
        # --- Step 1: Log request headers for diagnostics ---
        logger.info(
            json.dumps(
                {
                    "event": "chat_invoked",
                    "headers": dict(request.headers),
                    "request_id": request_id,
                }
            )
        )
        # --- Step 2: Content-Type check ---
        content_type = request.headers.get("content-type", "").lower()
        if "application/json" not in content_type:
            logger.error(
                json.dumps(
                    {"event": "chat_invalid_content_type", "content_type": content_type}
                )
            )
            raw_body = await request.body()
            logger.error(
                json.dumps(
                    {
                        "event": "chat_raw_body_bytes",
                        "raw_body": raw_body.decode(errors="replace"),
                    }
                )
            )
            raise HTTPException(
                status_code=415,
                detail={
                    "error": "Unsupported Media Type",
                    "message": "Content-Type must be application/json.",
                },
            )

        # --- Step 3: Parse JSON body ---
        try:
            body = await request.json()
        except Exception as e:
            logger.error(
                json.dumps({"event": "chat_json_parse_error", "error": str(e)})
            )
            raw_body = await request.body()
            logger.error(
                json.dumps(
                    {
                        "event": "chat_raw_body_bytes",
                        "raw_body": raw_body.decode(errors="replace"),
                    }
                )
            )
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Malformed JSON",
                    "message": str(e),
                },
            )

        # --- Step 4: Structure and required field check ---
        if not isinstance(body, dict):
            logger.error(
                json.dumps({"event": "chat_invalid_json_structure", "body": body})
            )
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "Invalid JSON structure",
                    "message": "Request body must be a JSON object.",
                },
            )
        if (
            "message" not in body
            or not isinstance(body["message"], str)
            or not (1 <= len(body["message"]) <= 2000)
        ):
            logger.error(
                json.dumps(
                    {
                        "event": "chat_missing_or_invalid_message_field",
                        "body": body,
                        "request_id": request_id,
                    }
                )
            )
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "Missing or invalid required field",
                    "message": "'message' field is required in the request body and must be a non-empty string up to 2000 characters.",
                },
            )

        # --- Step 5: Mask sensitive fields in logs ---
        masked_body = {
            k: (
                "***"
                if isinstance(k, str) and k.lower() in {"password", "token", "secret"}
                else v
            )
            for k, v in body.items()
        }
        logger.info(json.dumps({"event": "chat_payload", "masked_body": masked_body}))
        logger.debug(json.dumps({"event": "chat_full_body", "body": body}))

        # --- Step 5.5: Accept context as string, dict, or null. If string, try to parse as JSON; if fails, wrap as dict. ---
        if "context" in body:
            val = body["context"]
            if isinstance(val, str):
                import json as _json

                try:
                    parsed = _json.loads(val)
                    if isinstance(parsed, dict):
                        body["context"] = parsed
                    else:
                        # If it's a string or other type, wrap as dict
                        body["context"] = {"context": parsed}
                except Exception:
                    # Not JSON, wrap as dict
                    body["context"] = {"context": val}
            elif val is None:
                body["context"] = None
            elif not isinstance(val, dict):
                # If not dict, wrap as dict
                body["context"] = {"context": val}

        # --- Step 6: Validate using Pydantic ---
        try:
            req_obj = PropOllamaChatRequest(**body)
        except ValidationError as ve:
            logger.error(
                json.dumps(
                    {
                        "event": "chat_validation_error",
                        "errors": ve.errors(),
                        "masked_body": masked_body,
                        "body": body,
                        "validation_json": ve.json(),
                        "expected_schema": PropOllamaChatRequest.model_json_schema(),
                    }
                )
            )
            # If context is the error, provide a more actionable message
            context_error = next(
                (err for err in ve.errors() if err.get("loc", [])[0] == "context"), None
            )
            if context_error:
                raise HTTPException(
                    status_code=422,
                    detail={
                        "error": "Invalid context field",
                        "message": "The 'context' field must be a dictionary (object). If you are passing a string, it should be a JSON object string (e.g., '{\"foo\": 1}').",
                        "fields": ve.errors(),
                    },
                )
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "Validation Error",
                    "fields": ve.errors(),
                    "message": "Invalid request payload. Please check your input and try again.",
                },
            )

        # --- Step 7: Defensive context/model extraction ---
        context = req_obj.context if req_obj.context is not None else {}
        model = req_obj.model

        # --- Step 8: Ensure LLM engine is initialized ---
        await llm_engine.ensure_initialized()

        # --- Step 9: Model selection and validation ---
        # Always refresh models before validating
        await llm_engine.refresh_models()
        valid_models = [m for m in llm_engine.models if "embed" not in m.lower()]
        logger.info(
            json.dumps(
                {
                    "event": "chat_model_selection_debug",
                    "request_model": model,
                    "valid_models": valid_models,
                    "llm_engine_default_override": getattr(
                        llm_engine, "default_override", None
                    ),
                    "llm_engine_task_model_map": getattr(
                        llm_engine, "task_model_map", {}
                    ),
                    "llm_engine_models": getattr(llm_engine, "models", []),
                }
            )
        )
        # --- Step 9: Model selection and validation ---
        # Always use 'llama3:8b' for chat requests, regardless of engine state or request payload
        await llm_engine.refresh_models()
        valid_models = [m for m in llm_engine.models if "embed" not in m.lower()]
        forced_model = "llama3:8b"
        if forced_model not in valid_models:
            logger.error(
                json.dumps(
                    {
                        "event": "chat_forced_model_not_available",
                        "forced_model": forced_model,
                        "valid_models": valid_models,
                    }
                )
            )
            raise HTTPException(
                status_code=503,
                detail={
                    "error": "Model not available",
                    "message": f"Forced model '{forced_model}' is not available. Valid options: {valid_models}",
                },
            )
        try:
            llm_engine.set_default_model(forced_model)
            logger.info(
                json.dumps(
                    {"event": "chat_model_set_default_override", "model": forced_model}
                )
            )
        except Exception as e:
            logger.error(
                json.dumps({"event": "chat_model_selection_error", "error": str(e)})
            )
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Model selection error",
                    "message": str(e),
                },
            )

        # --- Step 10: Generate response using LLM with timeout and robust error handling ---
        try:
            selected_model = forced_model
            logger.info(
                f"[propollama.py] Selected model for chat (forced): {selected_model}"
            )
            client = getattr(llm_engine, "client", None)
            # [HEALTH] Only use /api/generate ping for model readiness; skip check_model_health
            logger.info(
                "[HEALTH] Skipping legacy check_model_health; using /api/generate ping only."
            )
            # Await the async chat response method
            if client is not None:
                try:
                    if hasattr(client, "chat_response") and asyncio.iscoroutinefunction(
                        client.chat_response
                    ):
                        response_text = await asyncio.wait_for(
                            client.chat_response(req_obj.message, context), timeout=30
                        )
                    elif hasattr(client, "generate") and asyncio.iscoroutinefunction(
                        client.generate
                    ):
                        prompt = f"""
                        You are PropOllama, an expert AI sports betting assistant. Respond to this user query:

                        User: {req_obj.message}
                        {f'Current context: {context}' if context else ''}

                        Provide helpful, accurate betting advice. Be conversational but professional.
                        Focus on actionable insights. Keep responses concise and valuable.
                        """
                        response_text = await asyncio.wait_for(
                            client.generate(prompt, max_tokens=250, temperature=0.4),
                            timeout=30,
                        )
                    else:
                        raise HTTPException(
                            status_code=503,
                            detail={
                                "error": "LLM client not available",
                                "message": "Ollama client is not initialized or does not support text generation.",
                            },
                        )
                except asyncio.TimeoutError:
                    logger.error(
                        json.dumps(
                            {
                                "event": "chat_timeout",
                                "model": selected_model,
                                "request_id": request_id,
                            }
                        )
                    )
                    raise HTTPException(
                        status_code=504,
                        detail={
                            "error": "LLM chat timeout",
                            "message": "Ollama did not respond within 30 seconds. Please try again or check model health.",
                        },
                    )
                except Exception as e:
                    logger.error(
                        json.dumps(
                            {
                                "event": "chat_exception",
                                "error": str(e),
                                "request_id": request_id,
                            }
                        )
                    )
                    raise HTTPException(
                        status_code=500,
                        detail={
                            "error": "LLM chat error",
                            "message": str(e),
                        },
                    )
            else:
                raise HTTPException(
                    status_code=503,
                    detail={
                        "error": "LLM client not available",
                        "message": "Ollama client is not initialized or does not support text generation.",
                    },
                )
            used_model = selected_model
        except HTTPException:
            raise
        except Exception as e:
            logger.error(
                json.dumps(
                    {
                        "event": "chat_llm_error",
                        "error": str(e),
                        "trace": traceback.format_exc(),
                    }
                )
            )
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "LLM chat error",
                    "message": str(e),
                    "trace": traceback.format_exc(),
                },
            )

        # --- Step 11: Return response ---
        return PropOllamaChatResponse(
            response=response_text,
            model_used=used_model,
            timestamp=datetime.now().isoformat(),
        ).model_dump() | {"request_id": request_id}

    except HTTPException as http_exc:
        logger.error(
            json.dumps({"event": "chat_httpexception", "detail": http_exc.detail})
        )
        raise
    except Exception as e:
        logger.error(
            json.dumps(
                {
                    "event": "chat_unexpected_error",
                    "error": str(e),
                    "trace": traceback.format_exc(),
                }
            )
        )
        print("[PropOllama] Exception in /chat:")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Internal Server Error",
                "message": str(e),
                "trace": traceback.format_exc(),
            },
        )


# --- Health Check Endpoint ---
@router.get("/health", response_model=dict)
async def propollama_health() -> Dict[str, str]:
    """
    Health check for PropOllama API.
    - Returns status and message if API is up.
    - Error codes: None (always 200 if reachable)
    """
    return {"status": "ok", "message": "PropOllama API is healthy."}


# --- Ollama Model Listing Endpoint ---
@router.get("/models", response_model=dict)
async def propollama_models() -> Dict[str, Any]:
    """
    List available Ollama models.
    - Only returns models that are valid for generation and healthy/ready.
    - Error codes:
        200: Success, returns {"models": [list of healthy models]}
        500: Internal error (returns {"error": str, "trace": str})
    """
    try:
        await llm_engine.ensure_initialized()
        models = llm_engine.models or []
        # If models not loaded, refresh
        if not models:
            await llm_engine.refresh_models()
            models = llm_engine.models or []
        # Only return valid generation models for chat that are healthy/ready
        client = getattr(llm_engine, "client", None)
        model_health = getattr(client, "model_health", {}) if client else {}
        valid_models = [
            m
            for m in models
            if "embed" not in m.lower()
            and model_health.get(m, None)
            and getattr(model_health[m], "status", None) == "ready"
        ]
        return {"models": valid_models}
    except Exception as e:
        import traceback

        return {"error": str(e), "trace": traceback.format_exc()}


# --- Ollama Model Health Endpoint ---
@router.get("/model_health", response_model=dict)
async def propollama_model_health() -> Dict[str, Any]:
    """
    Get health status for all Ollama models.
    - Returns health info for each model (status, last_error, last_check, etc.)
    - Error codes:
        200: Success, returns {"model_health": {...}}
        500: Internal error (returns {"error": str, "trace": str})
    """
    try:
        await llm_engine.ensure_initialized()
        models = llm_engine.models or []
        if not models:
            await llm_engine.refresh_models()
            models = llm_engine.models or []
        health_info = {}
        client = getattr(llm_engine, "client", None)
        for model in models:
            status = "unknown"
            last_error = None
            last_check = None
            response_time = None
            error_count = None
            success_count = None
            # Try to get health info if available
            if (
                client
                and hasattr(client, "model_health")
                and getattr(client, "model_health", None)
            ):
                health = client.model_health.get(model, None)
                if health:
                    status = getattr(health, "status", "unknown")
                    last_error = getattr(health, "last_error", None)
                    last_check = getattr(health, "last_check", None)
                    response_time = getattr(health, "response_time", None)
                    error_count = getattr(health, "error_count", None)
                    success_count = getattr(health, "success_count", None)
            health_info[model] = {
                "status": status,
                "last_error": last_error,
                "last_check": last_check,
                "response_time": response_time,
                "error_count": error_count,
                "success_count": success_count,
            }
        return {"model_health": health_info}
    except Exception as e:
        import traceback

        return {"error": str(e), "trace": traceback.format_exc()}


# Rate limiting configuration
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 30
rate_limiter = RateLimiter(RATE_LIMIT_WINDOW, RATE_LIMIT_MAX_REQUESTS)

# Response cache configuration
CACHE_TTL = 300  # 5 minutes
response_cache: Dict[str, Dict[str, Any]] = {}
cache_timestamps: Dict[str, float] = {}


async def check_rate_limit(request: Request) -> None:
    """
    Check rate limit for the request.
    Logs and blocks requests exceeding the configured rate limit window.
    """
    client_ip = request.client.host if request.client else "unknown"
    allowed = await rate_limiter.check_rate_limit(client_ip)
    if not allowed:
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "reset_in": await rate_limiter.time_until_reset(client_ip),
                "limit": RATE_LIMIT_MAX_REQUESTS,
                "window": RATE_LIMIT_WINDOW,
            },
        )


def get_cache_key(request) -> str:
    """
    Generate a unique cache key for a multi-prop bet analysis request.
    """
    import hashlib

    props_hash = (
        hashlib.md5(str(request.selectedProps).encode()).hexdigest()
        if hasattr(request, "selectedProps")
        else "noprops"
    )
    return f"{getattr(request, 'userId', 'nouser')}:{getattr(request, 'sessionId', 'nosession')}:{getattr(request, 'entryAmount', 'noamt')}:{props_hash}"


def is_cache_valid(cache_key: str) -> bool:
    """
    Check if a cached response is still valid (not expired).
    """
    return (
        cache_key in cache_timestamps
        and time.time() - cache_timestamps[cache_key] < CACHE_TTL
    )


# --- Multi-prop BetAnalysisRequest for contest-style entries ---
class BetAnalysisRequest(BaseModel):
    """Request model for multi-prop bet analysis (contest style)"""

    userId: str
    sessionId: str
    selectedProps: List[Dict[str, Any]]
    entryAmount: float


class BetAnalysisResponse(BaseModel):
    """Response model for bet analysis (multi-prop)"""

    analysis: str
    confidence: float
    recommendation: str
    key_factors: List[str]
    processing_time: float
    cached: bool = False
    enriched_props: List[Dict[str, Any]] = (
        []
    )  # Full enrichment/prediction data for each prop


# --- Unified Bet Analysis Implementation ---
async def _analyze_bet_unified_impl(
    request: BetAnalysisRequest,
    req: Request,
    rate_limit: None = None,
) -> BetAnalysisResponse:

    logger = logging.getLogger("propollama.endpoint")
    start_time = time.time()
    logger.info(
        "[DEBUG] Entered /final_analysis endpoint (BetAnalysisRequest) at %s",
        start_time,
    )

    try:
        logger.info("[TRACE] Step 1: Starting enrichment/validation...")
        # Step 1: Validate and enrich props
        try:
            logger.info("[TRACE] Awaiting pre_llm_business_logic...")
            enriched_props, entry_amt, user, session = await asyncio.wait_for(
                pre_llm_business_logic(request), timeout=5.0
            )
            logger.info("[TRACE] Enrichment completed: %s", enriched_props)
        except asyncio.TimeoutError:
            logger.error("[Timeout] pre_llm_business_logic enrichment timed out.")
            raise HTTPException(status_code=504, detail="Enrichment step timed out.")
        except ValueError as e:
            logger.error("[Validation Error] %s", e)
            raise HTTPException(
                status_code=422, detail={"error": "Validation Error", "message": str(e)}
            )
        except Exception as e:
            logger.error("[Error] pre_llm_business_logic failed: %s", e)
            raise HTTPException(status_code=500, detail=f"Enrichment error: {e}")

        # Step 2: Build prompt
        try:
            logger.info("[TRACE] Building prompt...")
            prompt = build_ensemble_prompt(enriched_props, entry_amt, user, session)
            logger.info("[TRACE] Prompt built: %s", prompt)
        except Exception as e:
            logger.error(f"[Error] build_ensemble_prompt failed: {e}")
            raise HTTPException(status_code=500, detail=f"Prompt build error: {e}")

        # Step 3: Generate cache key
        cache_key = get_cache_key(request)
        if is_cache_valid(cache_key):
            logger.info("[Cache] Hit for key: %s", cache_key)
            cached_response = response_cache[cache_key]
            cached_response["processing_time"] = time.time() - start_time
            cached_response["cached"] = True
            logger.info("[TRACE] Returning cached response.")
            return BetAnalysisResponse(**cached_response)
        else:
            logger.info("[Cache] Miss for key: %s", cache_key)

        # Step 4: Use official ollama.AsyncClient for LLM call
        logger.info("[TRACE] Using ollama.AsyncClient for LLM call...")
        try:
            from ollama import AsyncClient

            ollama_client = AsyncClient()
            messages = [{"role": "user", "content": prompt}]
            # Robust check: ensure ollama_client.chat is awaitable
            chat_method = getattr(ollama_client, "chat", None)
            if chat_method is None or not callable(chat_method):
                logger.error(
                    "[LLM] Ollama AsyncClient.chat is not callable or missing."
                )
                raise HTTPException(
                    status_code=503, detail="Ollama AsyncClient.chat is not available."
                )
            llm_response = await chat_method(model="llama3", messages=messages)
            if (
                not llm_response
                or "message" not in llm_response
                or "content" not in llm_response["message"]
            ):
                logger.error(
                    f"[LLM] Ollama LLM response missing content: {llm_response}"
                )
                raise HTTPException(
                    status_code=503, detail="Ollama LLM response missing content."
                )
            llm_content = llm_response["message"]["content"]
        except Exception as e:
            logger.error(f"[Error] ollama.AsyncClient LLM call failed: {e}")
            raise HTTPException(status_code=503, detail=f"Ollama LLM call failed: {e}")

        # Step 5: Post-LLM business logic
        try:
            analysis = await post_llm_business_logic(
                llm_content, enriched_props, entry_amt, user, session
            )
        except Exception as e:
            logger.error(f"[Error] post_llm_business_logic failed: {e}")
            raise HTTPException(
                status_code=500, detail=f"Post-LLM business logic error: {e}"
            )

        processing_time = time.time() - start_time
        response = {
            "analysis": analysis,
            "confidence": None,  # Fill as needed from analysis
            "recommendation": None,  # Fill as needed from analysis
            "key_factors": [],  # Fill as needed from analysis
            "processing_time": processing_time,
            "cached": False,
            "enriched_props": enriched_props,  # <-- Add full enrichment data for frontend
        }
        # Optionally parse confidence, recommendation, key_factors from analysis JSON
        try:
            import json

            parsed = json.loads(analysis)
            response["confidence"] = parsed.get("confidence_score")
            response["recommendation"] = parsed.get("recommendation")
            response["key_factors"] = parsed.get("key_factors", [])
        except Exception as e:
            logger.warning(f"[Warning] Could not parse analysis JSON: {e}")
        return BetAnalysisResponse(**response)
    except ValueError as e:
        logger.error(f"[Validation Error] {e}")
        raise HTTPException(
            status_code=422, detail={"error": "Validation Error", "message": str(e)}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"[Fatal Error] _analyze_bet_unified_impl error: {e}", exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Analysis failed",
                "message": str(e),
                "request_id": str(int(time.time())),
            },
        )


# --- Endpoints for Unified Bet Analysis ---
@router.post("/final_analysis", response_model=BetAnalysisResponse)
async def analyze_bet_final_analysis(
    request: BetAnalysisRequest,
    req: Request,
    rate_limit: None = Depends(check_rate_limit),
) -> BetAnalysisResponse:
    import time

    start_time = time.time()
    try:
        # Use unified implementation for multi-prop analysis
        response = await _analyze_bet_unified_impl(request, req, rate_limit)
        return response
    except Exception as e:
        import logging

        logger = logging.getLogger("propollama.final_analysis")
        logger.error(f"/final_analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
