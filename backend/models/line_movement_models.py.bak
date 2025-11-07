"""Line Movement Data Models"""

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class LineSnapshot(BaseModel):
    """Individual line snapshot"""
    line: float
    odds: int
    timestamp: str

class LineMovementData(BaseModel):
    """Line movement response data"""
    timeline: List[str]
    lines: List[float]
    movementMagnitude: float
    direction: str
    snapshotCount: int

class LineAlertConfig(BaseModel):
    """User alert configuration"""
    user_id: str
    sport: str
    player: str
    market: str
    book: str
    delta: float = 0.0
    ev: float = 0.0

class AlertResponse(BaseModel):
    """Alert configuration response"""
    success: bool
    message: str
    config: Optional[LineAlertConfig] = None