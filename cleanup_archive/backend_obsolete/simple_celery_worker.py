#!/usr/bin/env python3
"""
Simple Celery worker for A1Betting automation system.
"""

import os
import sys
from celery import Celery

# Simple Redis connection
app = Celery('a1betting-worker')
app.conf.broker_url = os.getenv('A1BETTING_REDIS_URL', 'redis://localhost:6379')
app.conf.result_backend = os.getenv('A1BETTING_REDIS_URL', 'redis://localhost:6379')

@app.task
def sample_task(message):
    """Sample task for testing."""
    return f"Processed: {message}"

@app.task
def ml_prediction_task(data):
    """ML prediction task."""
    return {
        "prediction": "sample_prediction",
        "confidence": 0.95,
        "status": "completed"
    }

if __name__ == '__main__':
    app.start()
