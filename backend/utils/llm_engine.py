"""LLMEngine abstraction for local Ollama and LM Studio providers.
Automatically discovers available models and selects the best one for embedding or generation tasks.
"""

import asyncio
import json
import logging
import time
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable, Dict, List, Optional, TypedDict, TypeVar

import httpx
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from backend.utils.circuit_breaker import CircuitBreaker

logger = logging.getLogger(__name__)

T = TypeVar("T")  # Generic type for request results

# Constants for timeouts and health checks
MODEL_INIT_TIMEOUT = 60  # seconds
HEALTH_CHECK_INTERVAL = 30  # seconds
REQUEST_TIMEOUT = 30  # seconds
MAX_QUEUE_SIZE = 100
MAX_RETRY_ATTEMPTS = 3


@dataclass
class ModelHealth:
    """Model health status information"""

    name: str
    status: str  # "ready", "loading", "error"
    last_check: float
    response_time: float
    error_count: int
    success_count: int
    last_error: Optional[str]


@dataclass
class QueuedRequest:
    """Type for queued requests"""

    func: Callable[..., Awaitable[Any]]
    args: tuple[Any, ...]
    kwargs: dict[str, Any]
    future: asyncio.Future[Any]
    timestamp: float = field(default_factory=time.time)
    priority: int = 1
    timeout: float = REQUEST_TIMEOUT


class ModelStateType(TypedDict):
    initialized: bool
    models_loaded: bool
    last_error: Optional[str]
    request_count: int
    successful_requests: int
    propollama_requests: int
    propollama_successes: int
    ready_for_requests: bool
    initialization_time: Optional[float]
    request_queue_size: int
    model_health: Dict[str, Dict[str, Any]]


# Enhanced logging for model states
MODEL_STATE: ModelStateType = {
    "initialized": False,
    "models_loaded": False,
    "last_error": None,
    "request_count": 0,
    "successful_requests": 0,
    "propollama_requests": 0,
    "propollama_successes": 0,
    "ready_for_requests": False,
    "initialization_time": None,
    "request_queue_size": 0,
    "model_health": {},
}

# Request queue for handling requests before models are ready
request_queue: asyncio.Queue[QueuedRequest] = asyncio.Queue(maxsize=MAX_QUEUE_SIZE)
is_queue_processing = False
health_check_task: Optional[asyncio.Task] = None


def log_model_state(state_update: Dict[str, Any]) -> None:
    """Log model state changes with detailed diagnostics"""
    global MODEL_STATE
    # Create a new dictionary to ensure TypedDict compatibility on update
    temp_state = MODEL_STATE.copy()
    temp_state.update(state_update)
    MODEL_STATE = ModelStateType(**temp_state)  # Reconstruct with explicit type
    logger.info(f"LLM State Update: {json.dumps(MODEL_STATE, default=str)}")


async def process_request_queue() -> None:
    """Process queued requests once models are ready"""
    global is_queue_processing
    if is_queue_processing:
        return

    is_queue_processing = True
    try:
        while not request_queue.empty():
            request = await request_queue.get()
            try:
                # Check request timeout
                if time.time() - request.timestamp > request.timeout:
                    raise TimeoutError("Request timeout exceeded")

                result = await request.func(*request.args, **request.kwargs)
                request.future.set_result(result)
            except Exception as e:
                request.future.set_exception(e)
            finally:
                request_queue.task_done()
    finally:
        is_queue_processing = False


async def queue_request(
    func: Callable[..., Awaitable[T]], *args: Any, **kwargs: Any
) -> T:
    """Queue a request if models aren't ready, otherwise execute immediately"""
    if not MODEL_STATE["ready_for_requests"]:
        if request_queue.full():
            raise RuntimeError("Request queue is full")

        future: asyncio.Future[T] = asyncio.Future()
        request = QueuedRequest(
            func=func,
            args=args,
            kwargs=kwargs,
            future=future,
            timestamp=time.time(),
            priority=kwargs.pop("priority", 1),
            timeout=kwargs.pop("timeout", REQUEST_TIMEOUT),
        )
        await request_queue.put(request)
        MODEL_STATE["request_queue_size"] = request_queue.qsize()
        log_model_state({"request_queue_size": request_queue.qsize()})
        return await future
    return await func(*args, **kwargs)


# Modern config using Pydantic BaseSettings
class EnhancedConfig(BaseSettings):
    llm_provider: str = "ollama"
    llm_endpoint: str = "http://127.0.0.1:11434"
    llm_timeout: int = 60
    llm_batch_size: int = 5
    llm_models_cache_ttl: int = 300
    llm_default_model: str = "llama3:8b"
    available_models: List[str] = Field(default_factory=list)
    embedding_models: List[str] = Field(default_factory=list)
    generation_models: List[str] = Field(default_factory=list)
    model_preferences: Dict[str, List[str]] = Field(
        default_factory=lambda: {
            "generation": [
                "llama3:8b",
                "closex/neuraldaredevil-8b-abliterated:latest",
            ],
            "embedding": ["nomic-embed-text:v1.5"],
            "sports_analysis": [
                "llama3:8b",
                "closex/neuraldaredevil-8b-abliterated:latest",
            ],
            "conversation": ["llama3:8b"],
        }
    )
    odds_api_key: Optional[str] = None
    sportradar_api_key: Optional[str] = None
    database_url: Optional[str] = None  # Added to support .env DATABASE_URL

    model_config = SettingsConfigDict(env_file=".env", extra="allow")


# Singleton config instance
config = EnhancedConfig()


class EnhancedConfigManager:
    """Enhanced config manager with model discovery"""

    def __init__(self):
        self.config = config
        self._last_model_check = 0
        self._model_cache: Dict[str, List[str]] = {}

    async def refresh_available_models(self) -> Dict[str, List[str]]:
        """Refresh the list of available models from Ollama"""
        try:
            current_time = time.time()
            if current_time - self._last_model_check < self.config.llm_models_cache_ttl:
                return self._model_cache

            async with httpx.AsyncClient(timeout=self.config.llm_timeout) as client:
                response = await client.get(f"{self.config.llm_endpoint}/api/tags")
                if response.status_code == 200:
                    data = response.json()
                    models: List[str] = [
                        model["name"] for model in data.get("models", [])
                    ]

                    # Categorize models
                    generation_models: List[str] = []
                    embedding_models: List[str] = []

                    for model in models:
                        if "embed" in model.lower():
                            embedding_models.append(model)
                        else:
                            generation_models.append(model)

                    self.config.available_models = models
                    self.config.generation_models = generation_models
                    self.config.embedding_models = embedding_models

                    self._model_cache = {
                        "available": models,
                        "generation": generation_models,
                        "embedding": embedding_models,
                    }
                    self._last_model_check = current_time

                    logger.info(f"Refreshed Ollama models: {models}")
                    return self._model_cache
                else:
                    logger.error(
                        f"Failed to get models from Ollama: {response.status_code}"
                    )
                    return self._model_cache
        except Exception as e:
            logger.error(f"Error refreshing models: {e}")
            return self._model_cache

    def get_best_model(self, task: str = "generation") -> str:
        """Get the best available model for a specific task"""
        preferences = self.config.model_preferences.get(
            task, self.config.model_preferences["generation"]
        )
        available = self.config.available_models or self._model_cache.get(
            "available", []
        )

        # Find the first available model from preferences
        for preferred in preferences:
            if preferred in available:
                return preferred

        # Fallback to first available model or default
        if available:
            return available[0]
        return self.config.llm_default_model or "llama3:8b"


config_manager = EnhancedConfigManager()


class BaseLLMClient:
    """Abstract base for LLM clients"""

    async def list_models(self) -> List[str]:
        raise NotImplementedError

    async def embed(self, texts: List[str]) -> List[List[float]]:
        raise NotImplementedError

    async def generate(
        self, prompt: str, max_tokens: int = 100, temperature: float = 0.7
    ) -> str:
        raise NotImplementedError


class OllamaClient(BaseLLMClient):
    async def ensure_model_pulled(self, model_name: str) -> bool:
        """Ensure the model is pulled (downloaded) locally. Pulls in background if missing."""
        # Check if model is present
        try:
            tags_resp = await self.client.get(f"{self.base}/api/tags")
            tags_resp.raise_for_status()
            tags = tags_resp.json().get("models", [])
            if any(m.get("name") == model_name for m in tags):
                logger.info(f"Model {model_name} already present locally.")
                return True
        except Exception as e:
            logger.warning(f"Failed to check tags for model {model_name}: {e}")
        # Pull model
        try:
            logger.info(f"Pulling model {model_name} from Ollama registry...")
            pull_resp = await self.client.post(
                f"{self.base}/api/pull", json={"model": model_name}
            )
            pull_resp.raise_for_status()
            logger.info(f"Pull response for {model_name}: {pull_resp.text}")
            # Optionally, check for 'success' in response
            return True
        except Exception as e:
            logger.error(f"Failed to pull model {model_name}: {e}")
            return False

    async def ensure_model_loaded(self, model_name: str) -> bool:
        """Ensure the model is loaded into memory (serving). Loads in background if not."""
        try:
            # Try a no-op generate to load the model
            resp = await self.client.post(
                f"{self.base}/api/generate",
                json={
                    "model": model_name,
                    "prompt": "",
                    "stream": False,
                    "options": {"num_predict": 1, "temperature": 0.0},
                },
                timeout=10,
            )
            resp.raise_for_status()
            logger.info(f"Model {model_name} loaded into memory (generate ping).")
            return True
        except Exception as e:
            logger.warning(f"Failed to load model {model_name} into memory: {e}")
            return False

    def __init__(self, url: str, timeout: int):
        self.base = url.rstrip("/")
        self.client = httpx.AsyncClient(timeout=timeout)
        self.available_models: List[str] = []
        self._request_start_time: float = 0
        self.model_health: Dict[str, ModelHealth] = {}
        self.circuit_breaker = CircuitBreaker(failure_threshold=3, recovery_timeout=60)
        MODEL_STATE["initialized"] = True
        MODEL_STATE["initialization_time"] = time.time()
        log_model_state(
            {
                "initialized": True,
                "base_url": url,
                "initialization_time": MODEL_STATE["initialization_time"],
            }
        )

        # Start health check task
        self.start_health_checks()

    async def initialize(self) -> None:
        """Initialize the client and start health checks"""
        # Start health check task if we're in an event loop
        try:
            loop = asyncio.get_running_loop()
            if loop.is_running():
                await self.start_health_checks()
        except RuntimeError:
            logger.info(
                "No running event loop, health checks will start on first request"
            )

    def start_health_checks(self) -> None:
        """Start periodic health checks"""
        global health_check_task
        if health_check_task is None or health_check_task.done():
            health_check_task = asyncio.create_task(self._periodic_health_checks())
            logger.info("Started model health check task")

    async def _periodic_health_checks(self) -> None:
        """Run periodic health checks on all models"""
        while True:
            try:
                for model in self.available_models:
                    await self.check_model_health(model)
                await asyncio.sleep(HEALTH_CHECK_INTERVAL)
            except Exception as e:
                logger.error(f"Health check error: {e}")
                await asyncio.sleep(5)  # Short delay on error

    async def check_model_health(self, model_name: str) -> ModelHealth:
        """Check health of a specific model asynchronously, non-blocking. Uses only /api/generate ping. Never calls analyze_prop_bet."""
        import time

        logger.info(
            f"[HEALTH] check_model_health called for {model_name}. Using only /api/generate ping. Never calling analyze_prop_bet."
        )
        start_time = time.time()
        # Always refresh model list before health check
        await self.list_models()
        # Ensure model is pulled
        pulled = await self.ensure_model_pulled(model_name)
        # Ensure model is loaded (uses /api/generate ping)
        loaded = await self.ensure_model_loaded(model_name) if pulled else False
        response_time = time.time() - start_time
        if pulled and loaded:
            health = ModelHealth(
                name=model_name,
                status="ready",
                last_check=time.time(),
                response_time=response_time,
                error_count=0,
                success_count=self.model_health.get(
                    model_name,
                    ModelHealth(
                        name=model_name,
                        status="unknown",
                        last_check=0,
                        response_time=0,
                        error_count=0,
                        success_count=0,
                        last_error=None,
                    ),
                ).success_count
                + 1,
                last_error=None,
            )
        else:
            health = ModelHealth(
                name=model_name,
                status="error",
                last_check=time.time(),
                response_time=response_time,
                error_count=self.model_health.get(
                    model_name,
                    ModelHealth(
                        name=model_name,
                        status="unknown",
                        last_check=0,
                        response_time=0,
                        error_count=0,
                        success_count=0,
                        last_error=None,
                    ),
                ).error_count
                + 1,
                success_count=self.model_health.get(
                    model_name,
                    ModelHealth(
                        name=model_name,
                        status="unknown",
                        last_check=0,
                        response_time=0,
                        error_count=0,
                        success_count=0,
                        last_error=None,
                    ),
                ).success_count,
                last_error="Model not pulled or not loaded",
            )
        self.model_health[model_name] = health
        MODEL_STATE["model_health"][model_name] = {
            "status": health.status,
            "response_time": health.response_time,
            "error_count": health.error_count,
            "success_count": health.success_count,
            "last_error": health.last_error,
        }
        log_model_state({"model_health": MODEL_STATE["model_health"]})
        return health

    async def ensure_models_ready(self) -> bool:
        """Ensure models are ready for use"""
        try:
            await self.ensure_client()
            if not self.client:
                return False

            # If client has ensure_models_ready method, delegate to it
            if hasattr(self.client, "ensure_models_ready"):
                return await self.client.ensure_models_ready()

            # Otherwise, check if we have models loaded
            if not self.models:
                await self.refresh_models()

            return bool(self.models and getattr(self, "is_initialized", False))
        except Exception as e:
            logger.error(f"Error ensuring models ready: {e}")
            return False

    async def list_models(self) -> List[str]:
        """List available models from Ollama with enhanced logging"""
        try:
            self._request_start_time = time.time()
            resp = await self.client.get(f"{self.base}/api/tags")
            resp.raise_for_status()
            models_data = resp.json()
            models = [model["name"] for model in models_data.get("models", [])]
            self.available_models = models

            request_time = time.time() - self._request_start_time
            MODEL_STATE["models_loaded"] = True
            MODEL_STATE["successful_requests"] = (
                MODEL_STATE.get("successful_requests", 0) + 1
            )
            log_model_state(
                {
                    "models_loaded": True,
                    "available_models": models,
                    "request_time": request_time,
                    "successful_requests": MODEL_STATE["successful_requests"],
                }
            )

            logger.info(f"Ollama models available: {models}")
            return models
        except Exception as e:
            error_msg = f"Error listing Ollama models: {e}"
            log_model_state({"last_error": error_msg, "models_loaded": False})
            logger.error(error_msg)
            return []

    async def embed(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using Ollama embedding model"""
        model = self.select_model("embed")
        embeddings: List[List[float]] = []

        for text in texts:
            try:
                resp = await self.client.post(
                    f"{self.base}/api/embeddings",
                    json={"model": model, "prompt": text},
                )
                resp.raise_for_status()
                embedding = resp.json()["embedding"]
                embeddings.append(embedding)
            except Exception as e:
                logger.error(f"Error getting embedding: {e}")
                # Return zero embedding as fallback
                embeddings.append([0.0] * 384)  # Default embedding size

        return embeddings

    async def generate(
        self,
        prompt: str,
        max_tokens: int = 100,
        temperature: float = 0.7,
        priority: int = 1,
        timeout: float = REQUEST_TIMEOUT,
    ) -> str:
        """Generate text using Ollama model with readiness check and priority"""
        return await queue_request(
            self._generate,
            prompt,
            max_tokens,
            temperature,
            priority=priority,
            timeout=timeout,
        )

    async def _generate(
        self, prompt: str, max_tokens: int = 100, temperature: float = 0.7
    ) -> str:
        """Internal generate function with enhanced logging"""
        if not MODEL_STATE["ready_for_requests"]:
            await self.ensure_models_ready()

        model = self.select_model("generation")
        MODEL_STATE["request_count"] = MODEL_STATE.get("request_count", 0) + 1

        try:
            self._request_start_time = time.time()
            resp = await self.client.post(
                f"{self.base}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "num_predict": max_tokens,
                        "temperature": temperature,
                    },
                },
            )
            resp.raise_for_status()
            response_data = resp.json()

            request_time = time.time() - self._request_start_time
            MODEL_STATE["successful_requests"] = (
                MODEL_STATE.get("successful_requests", 0) + 1
            )

            # Update model health on successful request
            if model in self.model_health:
                self.model_health[model].success_count += 1
                self.model_health[model].response_time = request_time
                self.model_health[model].last_check = time.time()
                self.model_health[model].status = "ready"
                self.model_health[model].last_error = None

            log_model_state(
                {
                    "last_request_time": request_time,
                    "successful_requests": MODEL_STATE["successful_requests"],
                    "last_model_used": model,
                    "model_health": {
                        model: {
                            "status": "ready",
                            "response_time": request_time,
                            "success_count": self.model_health[model].success_count,
                        }
                    },
                }
            )

            return response_data.get("response", "")
        except Exception as e:
            error_msg = f"Error generating text with Ollama: {e}"

            # Update model health on error
            if model in self.model_health:
                self.model_health[model].error_count += 1
                self.model_health[model].last_error = str(e)
                self.model_health[model].status = "error"

            log_model_state(
                {
                    "last_error": error_msg,
                    "failed_model": model,
                    "model_health": {
                        model: {
                            "status": "error",
                            "error_count": self.model_health[model].error_count,
                            "last_error": str(e),
                        }
                    },
                }
            )
            logger.error(error_msg)
            return f"Error generating response: {str(e)}"

    # PropOllama-specific methods
    async def analyze_prop_bet(
        self,
        player_name: str,
        stat_type: str,
        line: float,
        odds: str,
        context_data: Optional[Dict[str, Any]] = None,
        timeout: int = 15,
    ) -> str:
        """Analyze a prop bet with enhanced logging, diagnostics, and strict timeout"""
        import asyncio

        MODEL_STATE["propollama_requests"] = (
            MODEL_STATE.get("propollama_requests", 0) + 1
        )
        start_time = time.time()
        logger.info(
            f"[OllamaClient.analyze_prop_bet] Starting analysis for {player_name} {stat_type} (timeout={timeout}s)"
        )
        try:
            context = context_data or {}
            model = self.select_model("sports_analysis")
            prompt = f"""
            As PropOllama, an expert sports betting AI assistant, analyze this prop bet:
            
            Player: {player_name}
            Stat: {stat_type}
            Line: {line}
            Odds: {odds}
            
            Additional Context: {json.dumps(context)}
            
            Provide a concise analysis including:
            1. Key factors supporting Over/Under
            2. Historical performance trends
            3. Confidence level (1-10)
            4. Risk assessment
            
            Keep response focused and actionable.
            """
            response = await asyncio.wait_for(
                self.generate(prompt, max_tokens=200, temperature=0.3), timeout=timeout
            )
            request_time = time.time() - start_time
            MODEL_STATE["propollama_successes"] = (
                MODEL_STATE.get("propollama_successes", 0) + 1
            )
            log_model_state(
                {
                    "last_propollama_time": request_time,
                    "propollama_successes": MODEL_STATE["propollama_successes"],
                    "last_analysis": {
                        "player": player_name,
                        "stat": stat_type,
                        "processing_time": request_time,
                    },
                }
            )
            logger.info(
                f"[OllamaClient.analyze_prop_bet] Analysis complete for {player_name} {stat_type} in {request_time:.2f}s"
            )
            return response
        except asyncio.TimeoutError:
            error_msg = f"[OllamaClient.analyze_prop_bet] Timeout after {timeout}s for {player_name} {stat_type}"
            logger.error(error_msg)
            return f"Error: LLM analysis timed out after {timeout} seconds."
        except Exception as e:
            error_msg = f"PropOllama analysis failed: {e}"
            log_model_state(
                {
                    "last_error": error_msg,
                    "propollama_error": {
                        "player": player_name,
                        "stat": stat_type,
                        "error_type": str(type(e).__name__),
                    },
                }
            )
            logger.error(error_msg)
            return f"Error analyzing prop bet: {str(e)}"

    def select_model(self, task: str) -> str:
        """ALWAYS return 'llama3:8b' for any task, with explicit logging."""
        logger.info(
            f"[OllamaClient.select_model] Forcing model to: llama3:8b for task: {task}"
        )
        return "llama3:8b"


class LMStudioClient(BaseLLMClient):
    def __init__(self, url: str, timeout: int):
        self.base = url.rstrip("/")
        # HTTP client with configured timeout
        self.client = httpx.AsyncClient(timeout=timeout)
        self.select_model = self._default_select_model

    async def list_models(self) -> List[str]:
        resp = await self.client.get(f"{self.base}/v1/models")
        resp.raise_for_status()
        return [m["id"] for m in resp.json().get("data", [])]

    async def embed(self, texts: List[str]) -> List[List[float]]:
        embeddings = []
        for text in texts:
            resp = await self.client.post(
                f"{self.base}/v1/embeddings",
                json={"model": self.select_model("embed"), "input": text},
            )
            resp.raise_for_status()
            embeddings.append(resp.json()["data"][0]["embedding"])
        return embeddings

    async def generate(
        self, prompt: str, max_tokens: int = 100, temperature: float = 0.7
    ) -> str:
        resp = await self.client.post(
            f"{self.base}/v1/completions",
            json={
                "model": self.select_model("generation"),
                "prompt": prompt,
                "max_tokens": max_tokens,
                "temperature": temperature,
            },
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["text"]

    def _default_select_model(self, task: str) -> str:
        """Default model selection - will be overridden by LLMEngine"""
        return getattr(config, "llm_default_model", None) or ""


class LLMEngine:
    async def generate_text(
        self, prompt: str, max_tokens: int = 100, temperature: float = 0.7
    ) -> str:
        """Generate text using the configured LLM client."""
        await self.ensure_client()
        if not self.client:
            raise RuntimeError("LLM client is not initialized")
        # Use the client's generate method
        return await self.client.generate(
            prompt, max_tokens=max_tokens, temperature=temperature
        )

    """Unified engine to select and call the best local LLM."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LLMEngine, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        # Load LLM settings
        cfg = config_manager.config
        self.provider = cfg.llm_provider
        self.url = cfg.llm_endpoint
        self.timeout = cfg.llm_timeout
        self.batch_size = cfg.llm_batch_size
        self.models_cache_ttl = cfg.llm_models_cache_ttl
        self.last_model_refresh = 0
        self.default_override: Optional[str] = cfg.llm_default_model

        # Prepare for lazy initialization
        self.client = None
        self.models: List[str] = []
        self.task_model_map: Dict[str, str] = {}
        self._initialized = True

    async def ensure_client(self) -> None:
        """Ensure client is initialized"""
        if self.client is None:
            # Initialize appropriate client with timeout
            if self.provider == "lmstudio":
                self.client = LMStudioClient(self.url, self.timeout)
            else:
                self.client = OllamaClient(self.url, self.timeout)

            # Override select_model to use engine mapping or default override
            self.client.select_model = self._get_task_model

            # Initialize the client
            await self.client.initialize()

    async def initialize(self) -> None:
        """Initialize the engine and start health checks"""
        try:
            # Initialize the client first
            await self.ensure_client()

            # Initialize models
            await self.refresh_models()
            self.is_initialized = True
            logger.info("✅ LLM engine initialized successfully")
        except Exception as e:
            logger.error(f"❌ LLM engine initialization failed: {e}")
            self.is_initialized = False

    async def ensure_initialized(self) -> bool:
        """Ensure the engine is initialized"""
        if not getattr(self, "is_initialized", False):
            await self.initialize()
        return getattr(self, "is_initialized", False)

    async def ensure_models_ready(self) -> bool:
        """Ensure models are ready for use"""
        try:
            await self.ensure_client()
            if not self.client:
                return False

            # If client has ensure_models_ready method, delegate to it
            if hasattr(self.client, "ensure_models_ready"):
                return await self.client.ensure_models_ready()

            # Otherwise, check if we have models loaded
            if not self.models:
                await self.refresh_models()

            return bool(self.models and getattr(self, "is_initialized", False))
        except Exception as e:
            logger.error(f"Error ensuring models ready: {e}")
            return False

    async def refresh_models(self):
        """Fetch available models and update task mappings."""
        try:
            # Refresh config manager first
            await config_manager.refresh_available_models()

            # Get models from client
            self.models = await self.client.list_models()

            # Always ensure llama3:latest is present if healthy
            if hasattr(self.client, "model_health"):
                health = getattr(self.client, "model_health", {})
                if (
                    health.get("llama3:latest", None)
                    and getattr(health["llama3:latest"], "status", None) == "ready"
                ):
                    if "llama3:latest" not in self.models:
                        self.models.append("llama3:latest")
            self.task_model_map["embed"] = self._choose_embedding_model()
            self.task_model_map["generation"] = self._choose_generation_model()
            self.task_model_map["sports_analysis"] = self._choose_sports_model()
            self.task_model_map["conversation"] = (
                "llama3:latest"  # Always prefer llama3:latest for conversation
            )

            self.last_model_refresh = time.time()
            self.is_initialized = True

            logger.info(f"LLM models discovered: {self.models}")
            logger.info(f"Task mappings: {self.task_model_map}")

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error(f"LLM discovery failed: {e}")
            # Set fallback models
            self.models = ["llama3:latest"]
            self.task_model_map = {
                "embed": "nomic-embed-text:v1.5",
                "generation": "llama3:latest",
                "sports_analysis": "llama3:latest",
                "conversation": "llama3:latest",
            }

    def _choose_embedding_model(self) -> str:
        """Choose the best embedding model from available models."""
        # Prefer named embedding models
        for m in self.models:
            if "embed" in m.lower() or "embedding" in m.lower():
                return m
        return self.models[0] if self.models else "nomic-embed-text:v1.5"

    def _choose_generation_model(self) -> str:
        """Choose the best generation model from available models."""
        # Prefer instruct/chat models, then general models
        for m in self.models:
            name = m.lower()
            if any(k in name for k in ["instruct", "chat", "gpt"]):
                return m

        # Look for general models excluding embedding
        for m in self.models:
            if "embed" not in m.lower():
                return m

        return self.models[0] if self.models else "llama3:latest"

    def _choose_sports_model(self) -> str:
        """Choose the best model for sports analysis."""
        # For sports analysis, prefer models that are good at reasoning
        sports_preferred = [
            "llama3:latest",
            "closex/neuraldaredevil-8b-abliterated:latest",
        ]

        for preferred in sports_preferred:
            if preferred in self.models:
                return preferred

        return self._choose_generation_model()

    def _choose_conversation_model(self) -> str:
        """Choose the best model for conversation."""
        # For conversation, prefer chat/instruct models
        for m in self.models:
            name = m.lower()
            if any(k in name for k in ["chat", "instruct", "conversation"]):
                return m

        return self._choose_generation_model()

    def _get_task_model(self, task: str) -> str:
        """ALWAYS return 'llama3:latest' for all tasks, ignoring override and mapping."""
        return "llama3:latest"

    def set_default_model(self, model_name: Optional[str]) -> None:
        """Set or clear the runtime default model override."""
        # Allow llama3:latest even if not in models list
        if (
            model_name
            and model_name != "llama3:latest"
            and model_name not in self.models
        ):
            raise ValueError(f"Model '{model_name}' not available: {self.models}")
        self.default_override = model_name

    # PropOllama-specific methods for sports betting analysis
    async def analyze_prop_bet(
        self,
        player_name: str,
        stat_type: str,
        line: float,
        odds: str,
        context_data: Optional[Dict[str, Any]] = None,
        timeout: int = 15,
    ) -> str:
        """Analyze a prop bet and provide intelligent insights, with strict timeout and logging."""
        import asyncio

        context = context_data or {}
        logger.info(
            f"[LLMEngine.analyze_prop_bet] Starting analysis for {player_name} {stat_type} (timeout={timeout}s)"
        )
        prompt = f"""
        As PropOllama, an expert sports betting AI assistant, analyze this prop bet:

        Player: {player_name}
        Stat: {stat_type}
        Line: {line}
        Odds: {odds}

        Additional Context: {context}

        Provide a concise analysis including:
        1. Key factors supporting Over/Under
        2. Historical performance trends
        3. Confidence level (1-10)
        4. Risk assessment

        Keep response focused and actionable.
        """
        try:
            response = await asyncio.wait_for(
                self.generate_text(prompt, max_tokens=200, temperature=0.3),
                timeout=timeout,
            )
            logger.info(
                f"[LLMEngine.analyze_prop_bet] Analysis complete for {player_name} {stat_type}"
            )
            return response
        except asyncio.TimeoutError:
            error_msg = f"[LLMEngine.analyze_prop_bet] Timeout after {timeout}s for {player_name} {stat_type}"
            logger.error(error_msg)
            return f"Error: LLM analysis timed out after {timeout} seconds."
        except Exception as e:
            error_msg = f"[LLMEngine.analyze_prop_bet] Exception: {e}"
            logger.error(error_msg)
            return f"Error analyzing prop bet: {str(e)}"

    async def explain_prediction_confidence(
        self,
        prediction_data: Dict[str, Any],
        shap_values: Optional[Dict[str, float]] = None,
    ) -> str:
        """Explain why a prediction has certain confidence level using SHAP data."""
        shap_info = ""
        if shap_values:
            top_features = sorted(
                shap_values.items(), key=lambda x: abs(x[1]), reverse=True
            )[:5]
            shap_info = (
                f"Key factors: {', '.join([f'{k}({v:.2f})' for k, v in top_features])}"
            )

        prompt = f"""
        As PropOllama, explain this prediction in simple terms:

        Prediction: {prediction_data.get('prediction', 'N/A')}
        Confidence: {prediction_data.get('confidence', 'N/A')}%
        Expected Value: {prediction_data.get('expected_value', 'N/A')}
        {shap_info}

        Explain in 2-3 sentences why this prediction has this confidence level.
        Use simple language that any bettor would understand.
        """

        return await self.generate_text(prompt, max_tokens=150, temperature=0.2)

    async def chat_response(
        self, user_message: str, context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Handle conversational betting advice like PropGPT."""
        import logging

        logger = logging.getLogger("ollama_client")
        context_info = ""
        if context:
            context_info = f"Current context: {context}"

        prompt = f"""
        You are PropOllama, an expert AI sports betting assistant. Respond to this user query:

        User: {user_message}
        {context_info}

        Provide helpful, accurate betting advice. Be conversational but professional.
        Focus on actionable insights. Keep responses concise and valuable.
        """

        logger.info(f"[chat_response] Sending prompt to Ollama: {prompt}")
        try:
            response = await self.generate(
                prompt,
                max_tokens=100,  # Lowered to avoid hanging issues
                temperature=0.4,
                priority=1,
                timeout=30,
            )
            logger.info(f"[chat_response] Received response from Ollama: {response}")
            return response
        except Exception as e:
            logger.error(f"[chat_response] Error during Ollama request: {e}")
            raise

    async def generate_tooltip_explanation(
        self, term: str, betting_context: str = ""
    ) -> str:
        """Generate tooltip-style explanations for betting terms and concepts."""
        prompt = f"""
        Provide a brief, clear explanation of "{term}" in sports betting context.
        {f"Context: {betting_context}" if betting_context else ""}

        Keep it under 50 words, suitable for a tooltip.
        """

        return await self.generate_text(prompt, max_tokens=60, temperature=0.1)


# Singleton
llm_engine = LLMEngine()
