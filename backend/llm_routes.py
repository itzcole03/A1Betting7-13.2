import asyncio
import json
import time
from collections.abc import Awaitable
from functools import wraps
from typing import Any, Callable, Dict, List, Optional

from cachetools import TTLCache
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    Counter,
    Gauge,
    Histogram,
    generate_latest,
)
from pydantic import BaseModel, Field
from utils.llm_engine import llm_engine

router = APIRouter()

# LLM endpoint decorator with caching, timeout, and retry logic
llm_cache: TTLCache[str, Any] = TTLCache(maxsize=128, ttl=300)


def llm_endpoint(endpoint_name: str, timeout: float = 30.0, retries: int = 1):
    def decorator(func: Callable[..., Awaitable[Any]]) -> Callable[..., Awaitable[Any]]:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            start = time.time()
            key = f"{endpoint_name}:{json.dumps(kwargs, sort_keys=True, default=str)}"
            if key in llm_cache:
                llm_request_count.labels(endpoint=endpoint_name, status="success").inc()
                return llm_cache[key]
            for attempt in range(1, retries + 1):
                try:
                    result = await asyncio.wait_for(func(*args, **kwargs), timeout)
                    llm_request_count.labels(
                        endpoint=endpoint_name, status="success"
                    ).inc()
                    llm_cache[key] = result
                    return result
                except Exception:  # pylint: disable=broad-exception-caught
                    llm_request_count.labels(
                        endpoint=endpoint_name, status="error"
                    ).inc()
                    if attempt == retries:
                        raise
                finally:
                    llm_request_latency.labels(endpoint=endpoint_name).observe(
                        time.time() - start
                    )

        return wrapper

    return decorator


# Prometheus metrics
llm_request_count = Counter(
    "llm_requests_total", "Total LLM API requests", ["endpoint", "status"]
)
llm_request_latency = Histogram(
    "llm_request_latency_seconds", "LLM API request latency", ["endpoint"]
)
llm_last_model_refresh = Gauge(
    "llm_last_model_refresh_timestamp", "Last LLM model refresh time (epoch seconds)"
)


class EmbedRequest(BaseModel):
    """Request model for embedding multiple texts"""

    texts: List[str] = Field(..., description="List of texts to embed")


class EmbedResponse(BaseModel):
    """Response model containing embeddings"""

    embeddings: List[List[float]] = Field(
        ..., description="List of embeddings for each text"
    )


@router.post("/embed", response_model=EmbedResponse)
@llm_endpoint("embed")
async def embed_text(request: EmbedRequest) -> EmbedResponse:
    embeddings = await llm_engine.embed_text(request.texts)
    return EmbedResponse(embeddings=embeddings)


class GenerateRequest(BaseModel):
    """Request model for text generation"""

    prompt: str = Field(..., description="Text prompt to generate from")
    max_tokens: int = Field(100, description="Maximum tokens to generate")
    temperature: float = Field(0.7, description="Sampling temperature")


class GenerateResponse(BaseModel):
    """Response model containing generated text"""

    text: str = Field(..., description="Generated text response")


@router.post("/generate", response_model=GenerateResponse)
@llm_endpoint("generate")
async def generate_text(request: GenerateRequest) -> GenerateResponse:
    text = await llm_engine.generate_text(
        request.prompt,
        max_tokens=request.max_tokens,
        temperature=request.temperature,
    )
    return GenerateResponse(text=text)


# Streaming text generation endpoint
@router.post("/stream_generate")
@llm_endpoint("stream_generate", timeout=60.0, retries=2)
async def stream_generate(request: GenerateRequest):
    """Stream generated text chunks to client"""

    async def event_generator():
        async for chunk in llm_engine.stream_text(
            request.prompt,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
        ):
            yield chunk

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# Advanced LLM use-cases
class ExplainBetRequest(BaseModel):
    """Request model for natural-language bet explanations"""

    features: Dict[str, float] = Field(
        ..., description="Input features for prediction to explain"
    )


class ExplainBetResponse(BaseModel):
    """Response model with natural language explanation"""

    explanation: str = Field(
        ..., description="Natural language rationale for prediction"
    )


@llm_endpoint("explain_bet")
@router.post("/explain_bet", response_model=ExplainBetResponse)
async def explain_bet(request: ExplainBetRequest):
    try:
        # Perform internal prediction
        from prediction_engine import (
            PredictionRequest,
            UnifiedPredictionResponse,
            predict,
        )

        pred_req = PredictionRequest(features=request.features)
        result: UnifiedPredictionResponse = await predict(pred_req)
        # Build prompt for LLM
        prompt = (
            f"Provide a clear, concise betting prediction rationale. "
            f"Predicted value: {result.final_value:.2f}, confidence: {result.ensemble_confidence:.2%}. "
            f"Feature contributions: {result.shap_values}."
        )
        explanation = await llm_engine.generate_text(prompt)
        return ExplainBetResponse(explanation=explanation)
    except Exception as e:  # pylint: disable=broad-exception-caught
        raise HTTPException(status_code=500, detail=str(e))


class ScenarioRequest(BaseModel):
    """Request model for generating synthetic betting scenarios"""

    sport: str = Field(..., description="Sport type for scenarios")
    count: int = Field(3, description="Number of scenarios to generate")
    context: Optional[str] = Field(None, description="Optional context or constraints")


class ScenarioResponse(BaseModel):
    """Response model containing generated scenarios"""

    scenarios: List[str] = Field(..., description="List of generated betting scenarios")


@router.post("/generate_scenarios", response_model=ScenarioResponse)
@llm_endpoint("generate_scenarios")
async def generate_scenarios(request: ScenarioRequest):
    try:
        # Construct prompt
        prompt = (
            f"Generate {request.count} realistic betting scenarios for {request.sport}."
            + (f" Context: {request.context}." if request.context else "")
        )
        text = await llm_engine.generate_text(prompt)
        # Split into lines or bullets
        items = [
            line.strip("- • ").strip() for line in text.splitlines() if line.strip()
        ]
        return ScenarioResponse(scenarios=items)
    except Exception as e:  # pylint: disable=broad-exception-caught
        raise HTTPException(status_code=500, detail=str(e))


# Model management endpoints
class DefaultModelResponse(BaseModel):
    default_model: Optional[str] = Field(
        None, description="Current default LLM model override"
    )


@router.get("/models", response_model=List[str])
@llm_endpoint("models")
async def list_models():
    """List available LLM models"""
    return llm_engine.models


@router.get("/models/default", response_model=DefaultModelResponse)
@llm_endpoint("models_default")
async def get_default_model():
    """Get runtime default model override"""
    return DefaultModelResponse(default_model=llm_engine.default_override)


class SetDefaultModelRequest(BaseModel):
    model_name: Optional[str] = Field(
        None, description="Model name to override or clear override"
    )


@router.put("/models/default", response_model=DefaultModelResponse)
@llm_endpoint("models_default")
async def set_default_model(request: SetDefaultModelRequest):
    """Set or clear the default model override"""
    try:
        llm_engine.set_default_model(request.model_name)
        return DefaultModelResponse(default_model=llm_engine.default_override)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Sentiment analysis endpoint
class SentimentRequest(BaseModel):
    text: str = Field(..., description="Text to analyze sentiment for")


class SentimentResponse(BaseModel):
    sentiment: str = Field(..., description="Sentiment classification result")


@router.post("/sentiment", response_model=SentimentResponse)
@llm_endpoint("sentiment")
async def analyze_sentiment(request: SentimentRequest):
    """Analyze sentiment using LLM"""
    prompt = f"Classify the sentiment of the following text as Positive, Negative, or Neutral: {request.text}"
    sentiment = await llm_engine.generate_text(prompt, max_tokens=1, temperature=0.0)
    return SentimentResponse(sentiment=sentiment.strip())


# Health endpoint
class LLMHealthResponse(BaseModel):
    status: str
    provider: str
    endpoint: str
    models: List[str]
    last_refresh: float
    models_age_seconds: float


@router.get("/health", response_model=LLMHealthResponse)
@llm_endpoint("health")
async def llm_health():
    now = time.time()
    last_refresh = getattr(llm_engine, "last_model_refresh", 0)
    llm_last_model_refresh.set(last_refresh)
    age = now - last_refresh if last_refresh else None
    client = getattr(llm_engine, "client", None)
    endpoint = client.base if client and hasattr(client, "base") else "unknown"
    return LLMHealthResponse(
        status="ok" if llm_engine.models else "unavailable",
        provider=getattr(llm_engine, "provider", "unknown"),
        endpoint=endpoint,
        models=llm_engine.models,
        last_refresh=last_refresh,
        models_age_seconds=age if age is not None else -1,
    )


# Prometheus metrics endpoint
@router.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
