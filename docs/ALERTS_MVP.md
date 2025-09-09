# Alerts MVP - Basic User Alert Configuration

## Overview

The Alerts MVP provides a basic user alert configuration system with in-memory storage and background evaluation. This is the first step toward a comprehensive notification system.

## Features Implemented

### 1. In-Memory Alert Store
- **Storage Structure**: `user_alert_rules = {user_id: [rules...]}`
- **Alert Rule Structure**:
  ```json
  {
    "id": "uuid",
    "user_id": "user_123",
    "type": "line_movement" | "ev_threshold" | "arbitrage",
    "sport": "MLB" | "NBA" | "NFL" | null,
    "player": "Player Name" | null,
    "market": "Market Type" | null,
    "trigger_value": 10.0,
    "created_at": "2023-01-01T12:00:00Z",
    "is_active": true
  }
  ```

### 2. API Endpoints

#### Create Alert Rule
```http
POST /api/alerts
Content-Type: application/json

{
  "type": "ev_threshold",
  "sport": "MLB",
  "player": "Aaron Judge",
  "market": "Home Runs",
  "trigger_value": 15.0
}
```

#### List User Alert Rules
```http
GET /api/alerts
```

#### Delete Alert Rule
```http
DELETE /api/alerts/{rule_id}
```

#### Get Fired Alerts (Last 50)
```http
GET /api/alerts/fired?limit=50
```

#### Get Alert Statistics
```http
GET /api/alerts/stats
```

#### Manual Evaluation Controls (Debug)
```http
POST /api/alerts/evaluation/start    # Start background loop
POST /api/alerts/evaluation/stop     # Stop background loop
POST /api/alerts/evaluation/trigger  # Trigger single evaluation
```

### 3. Alert Types & Evaluation Logic

#### EV Threshold Alert
- **Trigger**: When any current EV opportunity >= `trigger_value`
- **Filters**: Optional sport, player, market filtering
- **Example**: Alert when any MLB Aaron Judge prop has EV >= 15%

#### Arbitrage Alert
- **Trigger**: When arbitrage opportunities count >= `trigger_value`
- **Filters**: Optional sport, player, market filtering
- **Example**: Alert when >= 2 NBA arbitrage opportunities exist

#### Line Movement Alert
- **Trigger**: When line movement magnitude >= `trigger_value`
- **Filters**: Optional sport, player, market filtering
- **Example**: Alert when any MLB line moves >= 2.5 points

### 4. Background Evaluation Loop
- **Frequency**: Every 60 seconds
- **Process**: 
  1. Fetch current market data (EV opportunities, arbitrage opportunities, line movements)
  2. Evaluate all active alert rules
  3. Fire alerts when trigger conditions are met
  4. Log "ALERT_TRIGGERED" messages
- **Storage**: Last 1000 fired alerts kept in memory

## Current Limitations (MVP)

1. **No External Notifications**: Alerts are only logged and stored, no emails/SMS/push notifications
2. **In-Memory Storage**: Data is lost on server restart
3. **Mock User Authentication**: Uses hardcoded user ID "user_123"
4. **Basic Evaluation Context**: Limited integration with actual market data services
5. **No Alert Prioritization**: All alerts are treated equally
6. **No Rate Limiting**: No protection against alert spam

## Testing

### Running Tests
```bash
# From project root
pytest tests/backend/services/test_alert_service.py -v
pytest tests/backend/routes/test_alert_routes.py -v
```

### Test Coverage
- ✅ Alert rule creation, retrieval, deletion
- ✅ Alert evaluation logic for all three types  
- ✅ Background evaluation loop start/stop
- ✅ Time mocking for date-dependent functionality
- ✅ HTTP API endpoint validation
- ✅ Error handling and edge cases
- ✅ Integration flow testing

## Usage Examples

### Example 1: High EV Threshold Alert
```bash
curl -X POST "http://localhost:8000/api/alerts" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "ev_threshold",
       "sport": "MLB", 
       "trigger_value": 12.0
     }'
```

### Example 2: Player-Specific Line Movement Alert
```bash
curl -X POST "http://localhost:8000/api/alerts" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "line_movement",
       "sport": "NBA",
       "player": "LeBron James",
       "market": "Points",
       "trigger_value": 3.0
     }'
```

### Example 3: General Arbitrage Alert
```bash
curl -X POST "http://localhost:8000/api/alerts" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "arbitrage",
       "trigger_value": 1.0
     }'
```

### Check Fired Alerts
```bash
curl "http://localhost:8000/api/alerts/fired"
```

## Escalation Path for Real Notifications

### Phase 2: Notification Channels
1. **Email Notifications**
   - SMTP configuration
   - HTML email templates
   - Unsubscribe functionality

2. **SMS Notifications**
   - Twilio integration
   - Rate limiting (prevent SMS spam)
   - Cost management

3. **Push Notifications**
   - WebSocket real-time alerts
   - Browser push notifications
   - Mobile app integration

### Phase 3: Advanced Features
1. **Persistent Storage**
   - Database migration from in-memory
   - Alert history and analytics
   - User preferences storage

2. **User Authentication & Authorization**
   - JWT token integration
   - User-specific alert limits
   - Premium vs free tiers

3. **Smart Alert Management**
   - Alert grouping and deduplication
   - Frequency controls (max 1 per hour)
   - Priority-based routing
   - Snooze and pause functionality

4. **Advanced Triggers**
   - Combination alerts (EV + arbitrage)
   - Time-based conditions (only during games)
   - Trend-based alerts (consecutive movements)
   - AI-powered alert suggestions

### Phase 4: Enterprise Features
1. **Multi-Channel Orchestration**
   - Webhook integrations
   - Slack/Discord bots
   - Third-party API notifications

2. **Analytics & Optimization**
   - Alert effectiveness tracking
   - User engagement metrics
   - A/B testing for alert timing

3. **Compliance & Governance**
   - Audit logs for all alert actions
   - GDPR compliance features
   - Opt-out and data deletion

## Architecture Integration Points

### Data Sources Integration
```python
# Future integration with actual data services
from backend.services.unified_data_fetcher import unified_data_fetcher
from backend.services.line_movement_service import line_movement_service

async def _get_evaluation_context(self) -> AlertEvaluationContext:
    # Replace mock data with real data sources
    ev_opportunities = await unified_data_fetcher.get_current_ev_opportunities()
    arbitrage_ops = await unified_data_fetcher.get_arbitrage_opportunities()
    line_movements = await line_movement_service.get_recent_movements()
    
    return AlertEvaluationContext(
        current_ev_opportunities=ev_opportunities,
        arbitrage_opportunities=arbitrage_ops,
        line_movements=line_movements
    )
```

### Notification Service Integration
```python
# Future notification service integration
from backend.services.notification_service import notification_service

async def fire_alert(self, rule: AlertRule, trigger_data: Dict[str, Any], message: str = ""):
    trigger = AlertTrigger(...)
    self.fired_alerts.append(trigger)
    
    # Send actual notifications
    await notification_service.send_alert_notification(
        user_id=rule.user_id,
        alert_type=rule.type,
        message=message,
        channels=["email", "push"],  # User preferences
        priority="high" if rule.trigger_value > 20 else "normal"
    )
```

## Configuration

### Environment Variables
```bash
# Future configuration options
ALERTS_EVALUATION_INTERVAL=60  # seconds
ALERTS_MAX_FIRED_STORAGE=1000  # number of alerts to keep
ALERTS_ENABLE_EMAIL=true
ALERTS_ENABLE_SMS=false
ALERTS_ENABLE_PUSH=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
```

### Service Configuration
```python
# backend/config/alert_config.py (future)
class AlertConfig:
    evaluation_interval: int = 60
    max_fired_storage: int = 1000
    max_alerts_per_user: int = 100
    max_alerts_per_hour: int = 10
    enable_email: bool = True
    enable_sms: bool = False
    enable_push: bool = True
```

## Monitoring & Observability

### Key Metrics to Track
- Total active alert rules
- Alert evaluation frequency and performance
- Alert firing rate and false positive rate
- User engagement with fired alerts
- System performance impact

### Logging Integration
```python
# Enhanced logging for production
logger.info("ALERT_TRIGGERED", extra={
    "user_id": rule.user_id,
    "alert_type": rule.type.value,
    "trigger_value": rule.trigger_value,
    "actual_value": trigger_data.get("actual_value"),
    "sports_context": trigger_data.get("sport"),
    "alert_id": trigger.id
})
```

## Security Considerations

### Current MVP Security
- No user authentication (uses mock user ID)
- No rate limiting on alert creation
- No input sanitization beyond basic validation

### Future Security Enhancements
1. **Authentication & Authorization**
   - JWT token validation
   - User-specific alert access controls
   - API rate limiting per user

2. **Input Validation & Sanitization**
   - Comprehensive input validation
   - SQL injection prevention (when using database)
   - XSS protection for alert messages

3. **Privacy & Data Protection**
   - Alert data encryption at rest
   - User consent for different notification channels
   - Data retention policies

## Performance Considerations

### Current Performance
- In-memory storage: O(1) access, limited by RAM
- Evaluation loop: O(n) where n = total active rules
- No caching or optimization

### Future Optimizations
1. **Database Optimization**
   - Indexed queries for user alerts
   - Batch evaluation strategies
   - Connection pooling

2. **Caching Strategies**
   - Redis cache for frequently accessed alerts
   - Evaluation result caching
   - Market data caching

3. **Scaling Considerations**
   - Background task workers
   - Queue-based alert processing
   - Horizontal scaling for high-volume users

---

## Quick Start Guide

1. **Start the backend server** (ensures alert service initializes)
2. **Create your first alert**:
   ```bash
   curl -X POST "http://localhost:8000/api/alerts" \
        -H "Content-Type: application/json" \
        -d '{"type": "ev_threshold", "sport": "MLB", "trigger_value": 10.0}'
   ```
3. **Check alert status**:
   ```bash
   curl "http://localhost:8000/api/alerts/stats"
   ```
4. **Monitor fired alerts**:
   ```bash
   curl "http://localhost:8000/api/alerts/fired"
   ```

The system will automatically evaluate your alerts every 60 seconds and log when triggers are met.