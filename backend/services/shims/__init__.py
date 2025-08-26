"""External service shims used for tests and CI.

These provide tiny, deterministic interfaces that mimic the real clients
enough for unit tests to import and run without requiring external services.
"""

from .redis_shim import RedisClientShim
from .sportradar_shim import SportRadarShim
from .ollama_shim import OllamaShim

__all__ = ["RedisClientShim", "SportRadarShim", "OllamaShim"]
