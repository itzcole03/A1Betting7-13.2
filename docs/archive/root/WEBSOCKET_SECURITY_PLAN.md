# WebSocket Security Plan: Signed Query Tokens

## Executive Summary

This document outlines a comprehensive security plan for implementing signed query tokens in WebSocket URLs, providing secure authentication and authorization for real-time connections in the A1Betting platform. The plan includes JWT-based authentication, token rotation mechanisms, rate limiting integration, and comprehensive security monitoring.

## Current State Analysis

### Existing WebSocket Authentication
- **Current Implementation**: Optional JWT token in query parameters (`?token=...`)
- **Security Gaps**: 
  - Tokens appear in server logs and URL history
  - No token rotation mechanism
  - No signature verification for WebSocket-specific access
  - Limited rate limiting for WebSocket connections
  - Token reuse across different connection types

### Risk Assessment
- **High Risk**: Token exposure in logs and browser history
- **Medium Risk**: Replay attacks with valid tokens
- **Medium Risk**: Connection hijacking without proper validation
- **Low Risk**: Token brute force (mitigated by JWT complexity)

## Proposed Security Architecture

### 1. Signed Query Token System

#### Token Structure
```
wss://api.a1betting.com/ws/v2/connect?ws_token=<SIGNED_TOKEN>&signature=<HMAC_SIGNATURE>&nonce=<UNIQUE_NONCE>&expires=<UNIX_TIMESTAMP>
```

#### Components
- **ws_token**: JWT token with WebSocket-specific claims
- **signature**: HMAC-SHA256 signature of token + connection metadata
- **nonce**: Unique identifier preventing replay attacks
- **expires**: Short-lived expiration (5-15 minutes)

### 2. Token Generation Flow

#### Frontend Request Flow
```typescript
// 1. Request WebSocket authentication token
const wsAuthRequest = await fetch('/api/auth/websocket/token', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userJWT}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    connection_type: 'realtime_updates',
    requested_subscriptions: ['odds_updates', 'mlb'],
    client_metadata: {
      user_agent: navigator.userAgent,
      connection_id: generateConnectionId()
    }
  })
});

// 2. Receive signed WebSocket token
const wsAuthResponse = await wsAuthRequest.json();
/*
{
  "ws_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "signature": "a1b2c3d4e5f6...",
  "nonce": "uuid-v4-string",
  "expires_at": 1640995200,
  "connection_url": "wss://api.a1betting.com/ws/v2/connect?ws_token=...&signature=...&nonce=...&expires=..."
}
*/

// 3. Connect using signed URL
const websocket = new WebSocket(wsAuthResponse.connection_url);
```

#### Backend Token Generation
```python
from datetime import datetime, timedelta
import hmac
import hashlib
import jwt
import secrets

class WebSocketTokenService:
    def __init__(self, signing_key: str, ws_signing_secret: str):
        self.signing_key = signing_key  # JWT signing key
        self.ws_signing_secret = ws_signing_secret  # WebSocket-specific HMAC secret
        self.token_lifetime = timedelta(minutes=10)  # Short-lived tokens
    
    async def generate_websocket_token(
        self, 
        user_id: str, 
        connection_type: str,
        requested_subscriptions: List[str],
        client_metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate signed WebSocket authentication token"""
        
        # Create WebSocket-specific JWT claims
        now = datetime.utcnow()
        expires = now + self.token_lifetime
        nonce = secrets.token_urlsafe(32)
        
        ws_claims = {
            'iss': 'a1betting-websocket',
            'aud': 'websocket-client',
            'sub': user_id,
            'iat': int(now.timestamp()),
            'exp': int(expires.timestamp()),
            'nonce': nonce,
            'connection_type': connection_type,
            'subscriptions': requested_subscriptions,
            'client_metadata': client_metadata,
            'permissions': await self._get_user_websocket_permissions(user_id)
        }
        
        # Generate JWT token
        ws_token = jwt.encode(ws_claims, self.signing_key, algorithm='HS256')
        
        # Create signature payload
        signature_payload = f"{ws_token}:{nonce}:{int(expires.timestamp())}:{user_id}"
        signature = hmac.new(
            self.ws_signing_secret.encode('utf-8'),
            signature_payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return {
            'ws_token': ws_token,
            'signature': signature,
            'nonce': nonce,
            'expires_at': int(expires.timestamp()),
            'connection_url': self._build_connection_url(ws_token, signature, nonce, expires)
        }
```

### 3. Token Validation Flow

#### WebSocket Connection Validation
```python
async def validate_websocket_connection(
    websocket: WebSocket,
    ws_token: str,
    signature: str,
    nonce: str,
    expires: int
) -> Optional[Dict[str, Any]]:
    """Validate WebSocket connection with signed token"""
    
    try:
        # 1. Check expiration
        if datetime.utcnow().timestamp() > expires:
            await websocket.close(code=4003, reason="Token expired")
            return None
        
        # 2. Verify JWT token
        try:
            token_data = jwt.decode(ws_token, signing_key, algorithms=['HS256'])
        except jwt.InvalidTokenError as e:
            await websocket.close(code=4001, reason="Invalid token")
            return None
        
        # 3. Verify nonce matches
        if token_data.get('nonce') != nonce:
            await websocket.close(code=4002, reason="Invalid nonce")
            return None
        
        # 4. Verify signature
        expected_payload = f"{ws_token}:{nonce}:{expires}:{token_data['sub']}"
        expected_signature = hmac.new(
            ws_signing_secret.encode('utf-8'),
            expected_payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_signature):
            await websocket.close(code=4004, reason="Invalid signature")
            return None
        
        # 5. Check nonce replay (store used nonces in Redis)
        if await redis_client.exists(f"ws_nonce:{nonce}"):
            await websocket.close(code=4005, reason="Token reuse detected")
            return None
        
        # 6. Store nonce to prevent replay (TTL = token lifetime)
        await redis_client.setex(f"ws_nonce:{nonce}", 900, "used")  # 15 minutes
        
        # 7. Validate permissions
        user_permissions = await get_user_websocket_permissions(token_data['sub'])
        if not validate_subscription_permissions(token_data['subscriptions'], user_permissions):
            await websocket.close(code=4006, reason="Insufficient permissions")
            return None
        
        return token_data
        
    except Exception as e:
        logger.error(f"WebSocket token validation error: {e}")
        await websocket.close(code=4000, reason="Authentication failed")
        return None
```

### 4. Token Rotation Mechanism

#### Automatic Token Refresh
```typescript
class SecureWebSocketConnection {
    private refreshTimer: NodeJS.Timeout | null = null;
    private connection: WebSocket | null = null;
    private tokenRefreshThreshold = 5 * 60 * 1000; // 5 minutes before expiry
    
    async connect(initialAuthToken: string): Promise<void> {
        // Get initial WebSocket token
        const wsAuth = await this.requestWebSocketToken(initialAuthToken);
        
        // Connect with signed token
        this.connection = new WebSocket(wsAuth.connection_url);
        
        // Schedule token refresh
        this.scheduleTokenRefresh(wsAuth.expires_at, initialAuthToken);
    }
    
    private scheduleTokenRefresh(expiresAt: number, authToken: string): void {
        const refreshTime = (expiresAt * 1000) - this.tokenRefreshThreshold - Date.now();
        
        if (refreshTime > 0) {
            this.refreshTimer = setTimeout(async () => {
                await this.refreshConnection(authToken);
            }, refreshTime);
        }
    }
    
    private async refreshConnection(authToken: string): Promise<void> {
        try {
            // Get new WebSocket token
            const newWsAuth = await this.requestWebSocketToken(authToken);
            
            // Close existing connection gracefully
            if (this.connection) {
                this.connection.close(1000, "Token refresh");
            }
            
            // Reconnect with new token
            this.connection = new WebSocket(newWsAuth.connection_url);
            
            // Schedule next refresh
            this.scheduleTokenRefresh(newWsAuth.expires_at, authToken);
            
        } catch (error) {
            console.error('WebSocket token refresh failed:', error);
            // Implement exponential backoff retry
            this.scheduleRetryRefresh(authToken);
        }
    }
}
```

### 5. Rate Limiting Integration

#### Connection Rate Limiting
```python
class WebSocketRateLimiter:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.connection_limits = {
            'per_ip_per_minute': 10,
            'per_user_per_minute': 5,
            'per_ip_per_hour': 100,
            'total_connections_per_ip': 3
        }
    
    async def check_connection_limits(
        self, 
        client_ip: str, 
        user_id: Optional[str]
    ) -> Tuple[bool, Optional[str]]:
        """Check if connection is within rate limits"""
        
        # Check IP-based limits
        ip_minute_key = f"ws_rate:ip_min:{client_ip}"
        ip_hour_key = f"ws_rate:ip_hour:{client_ip}"
        ip_concurrent_key = f"ws_concurrent:ip:{client_ip}"
        
        # Check per-IP per-minute limit
        ip_min_count = await self.redis.incr(ip_minute_key)
        if ip_min_count == 1:
            await self.redis.expire(ip_minute_key, 60)
        if ip_min_count > self.connection_limits['per_ip_per_minute']:
            return False, f"Rate limit exceeded: {self.connection_limits['per_ip_per_minute']} connections per minute per IP"
        
        # Check concurrent connections per IP
        concurrent_count = await self.redis.scard(ip_concurrent_key)
        if concurrent_count >= self.connection_limits['total_connections_per_ip']:
            return False, f"Concurrent connection limit exceeded: {self.connection_limits['total_connections_per_ip']} per IP"
        
        # Check user-based limits if authenticated
        if user_id:
            user_minute_key = f"ws_rate:user_min:{user_id}"
            user_min_count = await self.redis.incr(user_minute_key)
            if user_min_count == 1:
                await self.redis.expire(user_minute_key, 60)
            if user_min_count > self.connection_limits['per_user_per_minute']:
                return False, f"Rate limit exceeded: {self.connection_limits['per_user_per_minute']} connections per minute per user"
        
        return True, None
    
    async def register_connection(self, client_ip: str, connection_id: str, user_id: Optional[str]):
        """Register new connection for tracking"""
        await self.redis.sadd(f"ws_concurrent:ip:{client_ip}", connection_id)
        if user_id:
            await self.redis.sadd(f"ws_concurrent:user:{user_id}", connection_id)
    
    async def unregister_connection(self, client_ip: str, connection_id: str, user_id: Optional[str]):
        """Unregister connection"""
        await self.redis.srem(f"ws_concurrent:ip:{client_ip}", connection_id)
        if user_id:
            await self.redis.srem(f"ws_concurrent:user:{user_id}", connection_id)
```

### 6. Security Monitoring & Alerting

#### Security Event Detection
```python
class WebSocketSecurityMonitor:
    def __init__(self, event_bus, unified_logger):
        self.event_bus = event_bus
        self.logger = unified_logger
        
        # Security thresholds
        self.alert_thresholds = {
            'failed_auth_per_ip_per_minute': 20,
            'token_reuse_attempts': 5,
            'invalid_signature_attempts': 10,
            'expired_token_attempts': 15
        }
    
    async def monitor_authentication_failure(
        self, 
        failure_type: str, 
        client_ip: str, 
        user_agent: str,
        additional_data: Dict[str, Any]
    ):
        """Monitor and alert on authentication failures"""
        
        # Log security event
        security_context = LogContext(
            component=LogComponent.SECURITY,
            operation=f"websocket_auth_failure_{failure_type}",
            additional_data={
                'client_ip': client_ip,
                'user_agent': user_agent,
                'failure_type': failure_type,
                **additional_data
            }
        )
        
        self.logger.warning(
            f"WebSocket authentication failure: {failure_type} from {client_ip}",
            security_context
        )
        
        # Check for attack patterns
        await self._check_attack_patterns(failure_type, client_ip, user_agent)
        
        # Publish security event
        self.event_bus.publish('security.websocket.auth_failure', {
            'failure_type': failure_type,
            'client_ip': client_ip,
            'user_agent': user_agent,
            'timestamp': datetime.utcnow().isoformat(),
            **additional_data
        })
    
    async def _check_attack_patterns(self, failure_type: str, client_ip: str, user_agent: str):
        """Detect potential attack patterns"""
        
        # Count recent failures from this IP
        failure_key = f"ws_security_failures:{failure_type}:{client_ip}"
        failure_count = await redis_client.incr(failure_key)
        if failure_count == 1:
            await redis_client.expire(failure_key, 60)  # 1 minute window
        
        threshold = self.alert_thresholds.get(f'{failure_type}_per_ip_per_minute', 10)
        
        if failure_count >= threshold:
            # Trigger security alert
            await self._trigger_security_alert(
                alert_type='potential_attack',
                severity='HIGH',
                details={
                    'attack_type': f'websocket_{failure_type}_flood',
                    'client_ip': client_ip,
                    'failure_count': failure_count,
                    'time_window': '1 minute',
                    'user_agent': user_agent,
                    'recommended_action': 'Consider IP blocking or additional monitoring'
                }
            )
    
    async def _trigger_security_alert(self, alert_type: str, severity: str, details: Dict[str, Any]):
        """Trigger high-priority security alert"""
        
        # Log critical security event
        self.logger.critical(
            f"Security alert: {alert_type} ({severity})",
            LogContext(
                component=LogComponent.SECURITY,
                operation="security_alert",
                additional_data=details
            )
        )
        
        # Publish to security monitoring systems
        self.event_bus.publish('security.alert.websocket', {
            'alert_type': alert_type,
            'severity': severity,
            'timestamp': datetime.utcnow().isoformat(),
            'details': details,
            'requires_immediate_attention': severity in ['HIGH', 'CRITICAL']
        })
```

## Implementation Roadmap

### Phase 1: Core Security Infrastructure (Week 1-2)
1. **Token Service Implementation**
   - Create WebSocket token generation service
   - Implement HMAC signing and verification
   - Add nonce management with Redis

2. **Validation Middleware**
   - Update WebSocket connection handlers
   - Add signature verification
   - Implement replay protection

### Phase 2: Rate Limiting & Monitoring (Week 2-3)
1. **Rate Limiting Integration**
   - Implement IP and user-based rate limiting
   - Add concurrent connection limits
   - Create rate limit bypass for admin users

2. **Security Monitoring**
   - Add authentication failure tracking
   - Implement attack pattern detection
   - Create security alerting system

### Phase 3: Frontend Integration (Week 3-4)
1. **Token Management Client**
   - Create secure WebSocket connection class
   - Implement automatic token refresh
   - Add connection retry with exponential backoff

2. **Testing & Validation**
   - Security penetration testing
   - Performance impact assessment
   - Load testing with signed tokens

### Phase 4: Production Deployment (Week 4-5)
1. **Gradual Rollout**
   - Feature flag implementation
   - A/B testing with existing connections
   - Monitoring and performance validation

2. **Documentation & Training**
   - API documentation updates
   - Security team training
   - Incident response procedures

## Security Configuration

### Environment Variables
```bash
# WebSocket Security Configuration
WS_SIGNING_SECRET=<256-bit-random-key>
WS_TOKEN_LIFETIME_MINUTES=10
WS_NONCE_CACHE_TTL_MINUTES=15
WS_RATE_LIMIT_PER_IP_MINUTE=10
WS_RATE_LIMIT_PER_USER_MINUTE=5
WS_MAX_CONCURRENT_PER_IP=3
WS_SECURITY_MONITORING_ENABLED=true
WS_AUTO_BLOCK_SUSPICIOUS_IPS=false
```

### Redis Configuration
```yaml
# WebSocket Security Keys
ws_nonce:{nonce} -> "used" (TTL: 15 minutes)
ws_rate:ip_min:{ip} -> count (TTL: 60 seconds)
ws_rate:user_min:{user_id} -> count (TTL: 60 seconds)
ws_concurrent:ip:{ip} -> set of connection_ids
ws_concurrent:user:{user_id} -> set of connection_ids
ws_security_failures:{type}:{ip} -> count (TTL: 60 seconds)
```

## Monitoring & Metrics

### Key Performance Indicators (KPIs)
- **Security Metrics**
  - Authentication success rate (target: >99.5%)
  - Token validation response time (target: <5ms)
  - Replay attack detection rate
  - False positive rate for legitimate connections

- **Performance Metrics**
  - WebSocket connection establishment time
  - Token generation response time
  - Rate limiting overhead
  - Memory usage for nonce tracking

### Alerting Thresholds
- **Critical**: >50 authentication failures/minute from single IP
- **High**: Token reuse attempts detected
- **Medium**: Rate limit violations exceeding 100/hour
- **Low**: Unusual connection patterns or user agents

## Risk Mitigation

### Identified Risks & Mitigations
1. **Token Exposure Risk**
   - **Mitigation**: Short token lifetime (10 minutes), no sensitive data in logs
   
2. **Replay Attack Risk**
   - **Mitigation**: Nonce-based replay protection with Redis tracking
   
3. **DoS Attack Risk**
   - **Mitigation**: Aggressive rate limiting and IP-based connection limits
   
4. **Performance Impact Risk**
   - **Mitigation**: Optimized validation pipeline, Redis caching, async processing

### Incident Response Procedures
1. **Immediate Response** (0-15 minutes)
   - Automated IP blocking for critical security events
   - Security team notification via PagerDuty/Slack
   - Emergency WebSocket authentication bypass if needed

2. **Investigation Phase** (15-60 minutes)
   - Log analysis and attack pattern identification
   - User impact assessment
   - Temporary security measure implementation

3. **Resolution Phase** (1-4 hours)
   - Root cause identification
   - Security patch deployment
   - Post-incident security posture review

## Compliance & Audit

### Security Standards Compliance
- **OWASP WebSocket Security**: Implementation follows OWASP guidelines
- **JWT Best Practices**: Short-lived tokens, proper key management
- **PCI DSS**: If handling payment data, ensure WebSocket connections meet requirements

### Audit Trail Requirements
- All authentication attempts (success/failure) with timestamp and IP
- Token generation and validation events
- Rate limiting enforcement actions
- Security alert triggers and responses
- Connection lifecycle events (connect/disconnect/duration)

## Conclusion

This comprehensive security plan provides a robust framework for implementing signed query tokens in WebSocket URLs while maintaining high performance and user experience. The phased implementation approach allows for gradual rollout with continuous monitoring and adjustment.

The plan addresses the key security concerns around WebSocket authentication while providing comprehensive monitoring and alerting capabilities. Regular security reviews and penetration testing should be conducted to ensure the continued effectiveness of these security measures.

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Next Review Date**: March 2025  
**Owner**: Security & Backend Engineering Teams