# --- Typing Imports ---
from typing import Any, Dict, List, Optional

from fastapi import APIRouter

router = APIRouter()


# --- Readiness Check Endpoint ---
@router.get(
    "/readiness",
    response_model=dict,
    summary="Readiness check for PropOllama API",
    description="Checks readiness of LLM engine and subprocess availability. Returns 200 if all dependencies are ready, 503 otherwise.",
    tags=["Health"],
)
async def propollama_readiness() -> Dict[str, str]:
    """
    Readiness check for PropOllama API and dependencies.
    - Checks LLM engine initialization and subprocess availability.
    - Returns status and message if ready, 503 if not.
    """
    import shutil

    try:
        # Check LLM engine
        llm_ready = await llm_engine.ensure_initialized()
        # Check if 'ollama' subprocess is available
        ollama_path = shutil.which("ollama")
        if not llm_ready:
            return {"status": "not_ready", "message": "LLM engine not initialized."}
        if not ollama_path:
            return {
                "status": "not_ready",
                "message": "'ollama' subprocess not found in PATH.",
            }
        return {"status": "ready", "message": "All dependencies are ready."}
    except Exception as e:
        import traceback

        return {
            "status": "not_ready",
            "message": str(e),
            "trace": traceback.format_exc(),
        }


import asyncio
import json
import logging
import os
import re
import time
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
if not logger.hasHandlers():
    logger.setLevel(logging.INFO)
    formatter = logging.Formatter("[%(asctime)s] %(levelname)s %(name)s: %(message)s")
    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)
    logger.addHandler(stream_handler)
    # Optional: persistent file logging
    log_dir = os.path.join(os.path.dirname(__file__), "..", "logs")
    os.makedirs(log_dir, exist_ok=True)
    file_handler = logging.FileHandler(os.path.join(log_dir, "propollama.log"))
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
        # Always use 'llama3:latest' for chat requests, regardless of engine state or request payload
        await llm_engine.refresh_models()
        valid_models = [m for m in llm_engine.models if "embed" not in m.lower()]
        forced_model = "llama3:latest"
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
            # Refresh model health before checking readiness
            if client and hasattr(client, "check_model_health"):
                await client.check_model_health(selected_model)
            # Log model health and model list for debugging
            # Convert ModelHealth objects to dicts for JSON serialization
            model_health_raw = getattr(client, "model_health", {})
            model_health_serializable = {
                k: v.__dict__ if hasattr(v, "__dict__") else str(v)
                for k, v in model_health_raw.items()
            }
            logger.info(
                json.dumps(
                    {
                        "event": "chat_model_health_debug",
                        "selected_model": selected_model,
                        "model_health": model_health_serializable,
                        "models": getattr(llm_engine, "models", []),
                    }
                )
            )
            model_health = getattr(client, "model_health", {}) if client else {}
            if (
                selected_model not in model_health
                or getattr(model_health[selected_model], "status", None) != "ready"
            ):
                logger.error(
                    json.dumps(
                        {
                            "event": "chat_model_not_ready",
                            "model": selected_model,
                            "model_health": model_health_serializable,
                        }
                    )
                )
                raise HTTPException(
                    status_code=503,
                    detail={
                        "error": "Model not ready",
                        "message": f"Model '{selected_model}' is not healthy or ready. Please select a different model or try again later.",
                        "model_health": model_health_serializable,
                        "models": getattr(llm_engine, "models", []),
                    },
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


class BetAnalysisRequest(BaseModel):
    """Request model for bet analysis"""

    player_name: str = Field(..., min_length=2, max_length=100)
    stat_type: str = Field(..., min_length=2, max_length=50)
    line: float = Field(..., gt=0)
    odds: str = Field(..., pattern=r"^[+-]?[0-9]+$")
    context: Optional[Dict[str, Any]] = Field(default=None)

    @field_validator("player_name")
    @classmethod
    def validate_player_name(cls, v: str) -> str:
        """Validate player name"""
        if not v.replace(" ", "").isalnum():
            raise ValueError(
                "Player name must contain only letters, numbers, and spaces"
            )
        return v.strip()

    @field_validator("stat_type")
    @classmethod
    def validate_stat_type(cls, v: str) -> str:
        """Validate stat type"""
        valid_stats = {
            "points",
            "rebounds",
            "assists",
            "threes",
            "blocks",
            "steals",
            "runs",
            "hits",
            "strikeouts",
            "bases",
            "rbis",
            "goals",
            "saves",
            "shots",
            "passes",
            "tackles",
        }
        if v.lower() not in valid_stats:
            raise ValueError(
                f"Invalid stat type. Must be one of: {', '.join(valid_stats)}"
            )
        return v.lower()

    @field_validator("odds")
    @classmethod
    def validate_odds(cls, v: str) -> str:
        """Validate odds format"""
        try:
            odds = int(v)
            if abs(odds) < 100:
                raise ValueError("Odds must be at least ±100")
            return v
        except ValueError:
            raise ValueError("Odds must be a valid integer (e.g., +150, -110)")


class BetAnalysisResponse(BaseModel):
    """Response model for bet analysis"""

    analysis: str
    confidence: float = Field(..., ge=0, le=1)
    recommendation: str
    key_factors: List[str]
    processing_time: float
    cached: bool = False


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


def get_cache_key(request: BetAnalysisRequest) -> str:
    """
    Generate a unique cache key for a bet analysis request.
    """
    return f"{request.player_name}:{request.stat_type}:{request.line}:{request.odds}"


def is_cache_valid(cache_key: str) -> bool:
    """
    Check if a cached response is still valid (not expired).
    """
    return (
        cache_key in cache_timestamps
        and time.time() - cache_timestamps[cache_key] < CACHE_TTL
    )


@router.post("/best-bets-unified", response_model=BetAnalysisResponse)
async def analyze_bet_unified(
    request: BetAnalysisRequest,
    req: Request,
    rate_limit: None = Depends(check_rate_limit),
) -> BetAnalysisResponse:
    """
    Analyze a bet with enhanced validation, caching, and fallback.
    - Checks cache before LLM call
    - Handles circuit breaker and LLM errors with fallback
    - Logs cache hits/misses, errors, and fallback reasons
    """
    start_time = time.time()
    cache_key = get_cache_key(request)
    try:
        # Check cache first
        if is_cache_valid(cache_key):
            logger.info(f"Cache hit for key: {cache_key}")
            cached_response = response_cache[cache_key]
            cached_response["processing_time"] = time.time() - start_time
            cached_response["cached"] = True
            return BetAnalysisResponse(**cached_response)
        else:
            logger.info(f"Cache miss for key: {cache_key}")

        # Ensure LLM engine is ready
        if not await llm_engine.ensure_initialized():
            logger.error("LLM engine not ready")
            raise HTTPException(status_code=503, detail="LLM engine not ready")

        # Try LLM analysis with circuit breaker
        try:
            analysis = await llm_engine.analyze_prop_bet(
                player_name=request.player_name,
                stat_type=request.stat_type,
                line=request.line,
                odds=request.odds,
                context_data=request.context,
            )
        except RuntimeError as cb_exc:
            logger.error(f"Circuit breaker open: {cb_exc}")
            # Circuit breaker open: fallback to cache or default
            if is_cache_valid(cache_key):
                cached_response = response_cache[cache_key]
                cached_response["processing_time"] = time.time() - start_time
                cached_response["cached"] = True
                cached_response["fallback_reason"] = "circuit_breaker_open"
                return BetAnalysisResponse(**cached_response)
            else:
                return BetAnalysisResponse(
                    analysis="Service temporarily unavailable (circuit breaker open)",
                    confidence=0.0,
                    recommendation="No recommendation",
                    key_factors=["No analysis available"],
                    processing_time=time.time() - start_time,
                    cached=False,
                )
        except Exception as e:
            logger.error(f"LLM engine error: {e}")
            # LLM call failed: fallback to cache or default
            if is_cache_valid(cache_key):
                cached_response = response_cache[cache_key]
                cached_response["processing_time"] = time.time() - start_time
                cached_response["cached"] = True
                cached_response["fallback_reason"] = "llm_error"
                return BetAnalysisResponse(**cached_response)
            else:
                return BetAnalysisResponse(
                    analysis=f"Analysis failed: {str(e)}",
                    confidence=0.0,
                    recommendation="No recommendation",
                    key_factors=["No analysis available"],
                    processing_time=time.time() - start_time,
                    cached=False,
                )

        # Extract confidence and key factors
        confidence: float = 0.0
        key_factors: List[str] = []
        recommendation: str = ""

        # Parse the analysis
        lines = analysis.split("\n")
        for line in lines:
            line = line.strip()
            if "Confidence level:" in line:
                try:
                    conf_level = int(line.split(":")[1].strip().split("/")[0])
                    confidence = conf_level / 10.0
                except (ValueError, IndexError):
                    confidence = 0.5
            elif line.startswith("- "):
                key_factors.append(line[2:])
            elif "Recommendation:" in line:
                recommendation = line.split(":")[1].strip()

        if not recommendation:
            recommendation = "No clear recommendation available"

        if not key_factors:
            key_factors = ["Analysis available but no key factors extracted"]

        # Prepare response
        response = BetAnalysisResponse(
            analysis=analysis,
            confidence=confidence,
            recommendation=recommendation,
            key_factors=key_factors,
            processing_time=time.time() - start_time,
            cached=False,
        )

        # Cache the response
        response_cache[cache_key] = response.model_dump()
        cache_timestamps[cache_key] = time.time()

        return response

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Analysis failed",
                "message": str(e),
                "request_id": str(int(time.time())),
                "player": request.player_name,
                "stat": request.stat_type,
            },
        )


# Cleanup task for expired cache entries
async def cleanup_expired_cache():
    """
    Periodically clean up expired cache entries.
    Runs every minute to remove expired cache keys.
    """
    while True:
        current_time = time.time()
        expired_keys = [
            key
            for key, timestamp in cache_timestamps.items()
            if current_time - timestamp >= CACHE_TTL
        ]
        for key in expired_keys:
            del response_cache[key]
            del cache_timestamps[key]
        await asyncio.sleep(60)  # Run every minute


# Cleanup task will be started when the router is included
