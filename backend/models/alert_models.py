"""
Alert system models for user alert configuration and tracking.
Part of the basic user alert MVP implementation.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
import uuid


class AlertType(str, Enum):
    """Types of alerts that can be configured"""
    LINE_MOVEMENT = "line_movement"
    EV_THRESHOLD = "ev_threshold"
    ARBITRAGE = "arbitrage"


class AlertRule(BaseModel):
    """
    User alert rule configuration.
    Stored in-memory as user_alert_rules = {user_id: [rules...]}
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: AlertType
    sport: Optional[str] = None
    player: Optional[str] = None
    market: Optional[str] = None
    trigger_value: float = Field(description="Threshold value for triggering alert")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class CreateAlertRequest(BaseModel):
    """Request model for creating new alert rules"""
    type: AlertType
    sport: Optional[str] = None
    player: Optional[str] = None
    market: Optional[str] = None
    trigger_value: float = Field(gt=0, description="Must be positive value")


class AlertTrigger(BaseModel):
    """
    Represents a fired/triggered alert instance.
    Stored in fired_alerts list for GET /api/alerts/fired
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rule_id: str
    user_id: str
    alert_type: AlertType
    triggered_at: datetime = Field(default_factory=datetime.utcnow)
    trigger_data: Dict[str, Any] = Field(default_factory=dict)
    message: str = ""
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AlertRuleResponse(BaseModel):
    """Response model for alert rule queries"""
    id: str
    type: AlertType
    sport: Optional[str]
    player: Optional[str]
    market: Optional[str]
    trigger_value: float
    created_at: datetime
    is_active: bool
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AlertsListResponse(BaseModel):
    """Response model for listing user's alert rules"""
    rules: List[AlertRuleResponse]
    total_count: int


class FiredAlertsResponse(BaseModel):
    """Response model for fired alerts endpoint"""
    fired_alerts: List[AlertTrigger]
    total_count: int
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AlertEvaluationContext(BaseModel):
    """Context data for alert evaluation"""
    current_ev_opportunities: List[Dict[str, Any]] = Field(default_factory=list)
    arbitrage_opportunities: List[Dict[str, Any]] = Field(default_factory=list)
    line_movements: List[Dict[str, Any]] = Field(default_factory=list)
    evaluation_timestamp: datetime = Field(default_factory=datetime.utcnow)


class AlertStats(BaseModel):
    """Statistics about the alert system"""
    total_rules: int = 0
    active_rules: int = 0
    total_fired: int = 0
    fired_today: int = 0
    last_evaluation: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }