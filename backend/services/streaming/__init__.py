"""Streaming services package initializer for tests."""

from .market_streamer import MarketStreamer

__all__ = ["MarketStreamer"]
"""Streaming services package shim for tests."""

__all__ = ["MarketStreamer"]


class MarketStreamer:
    def __init__(self):
        self.running = False

    async def start(self):
        self.running = True

    async def stop(self):
        self.running = False
"""
Streaming package - Real-time market data streaming system
"""

from .market_streamer import (
    MarketStreamer,
    MarketEvent,
    MarketEventType,
    market_streamer
)

__all__ = [
    "MarketStreamer",
    "MarketEvent", 
    "MarketEventType",
    "market_streamer"
]