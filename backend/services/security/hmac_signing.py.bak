"""
HMAC Signing Service

Placeholder infrastructure for future external provider webhooks with
proper key management and request validation.
"""

import hashlib
import hmac
import time
import secrets
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, Optional, Tuple, Any, List
from dataclasses import dataclass, field
import json

from backend.services.unified_logging import get_logger
from backend.services.unified_config import unified_config

logger = get_logger("hmac_signing")


class SignatureAlgorithm(Enum):
    """Supported HMAC signature algorithms"""
    SHA256 = "sha256"
    SHA512 = "sha512"


@dataclass
class WebhookKey:
    """Webhook signing key configuration"""
    key_id: str
    secret_key: str
    algorithm: SignatureAlgorithm
    created_at: datetime
    expires_at: Optional[datetime] = None
    is_active: bool = True
    allowed_endpoints: List[str] = field(default_factory=list)  # Empty = all endpoints
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def is_expired(self) -> bool:
        """Check if key is expired"""
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at
    
    def is_valid_for_endpoint(self, endpoint: str) -> bool:
        """Check if key is valid for given endpoint"""
        if not self.is_active or self.is_expired():
            return False
        if not self.allowed_endpoints:  # Empty list means all endpoints
            return True
        return endpoint in self.allowed_endpoints


@dataclass
class SignatureValidationResult:
    """Result of signature validation"""
    is_valid: bool
    key_id: Optional[str] = None
    algorithm: Optional[str] = None
    error_message: Optional[str] = None
    timestamp_valid: bool = True
    replay_attack_detected: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)


class HMACWebhookSigner:
    """HMAC webhook signature service for external provider integration"""
    
    def __init__(self):
        self.logger = logger
        self._keys: Dict[str, WebhookKey] = {}
        self._nonce_cache: Dict[str, datetime] = {}  # For replay attack prevention
        self._max_timestamp_drift = timedelta(minutes=5)  # Allow 5 minutes drift
        self._nonce_cache_ttl = timedelta(hours=1)  # Keep nonces for 1 hour
        
        # Configuration
        self.default_algorithm = SignatureAlgorithm.SHA256
        self.require_timestamp = unified_config.get_config_value("WEBHOOK_REQUIRE_TIMESTAMP", True)
        self.require_nonce = unified_config.get_config_value("WEBHOOK_REQUIRE_NONCE", True)
        
        # Initialize with placeholder keys for development
        self._initialize_placeholder_keys()
    
    def _initialize_placeholder_keys(self):
        """Initialize placeholder keys for future external provider integration"""
        
        # Example keys for different provider types
        placeholder_keys = [
            {
                "key_id": "prizepicks_webhook_v1",
                "secret": "placeholder_key_prizepicks_integration_future",
                "algorithm": SignatureAlgorithm.SHA256,
                "endpoints": ["/webhooks/prizepicks", "/webhooks/provider/prizepicks"],
                "metadata": {"provider": "prizepicks", "version": "v1", "status": "placeholder"}
            },
            {
                "key_id": "draftkings_webhook_v1", 
                "secret": "placeholder_key_draftkings_integration_future",
                "algorithm": SignatureAlgorithm.SHA256,
                "endpoints": ["/webhooks/draftkings", "/webhooks/provider/draftkings"],
                "metadata": {"provider": "draftkings", "version": "v1", "status": "placeholder"}
            },
            {
                "key_id": "fanduel_webhook_v1",
                "secret": "placeholder_key_fanduel_integration_future", 
                "algorithm": SignatureAlgorithm.SHA512,
                "endpoints": ["/webhooks/fanduel", "/webhooks/provider/fanduel"],
                "metadata": {"provider": "fanduel", "version": "v1", "status": "placeholder"}
            },
            {
                "key_id": "general_webhook_v1",
                "secret": "placeholder_key_general_webhook_future",
                "algorithm": SignatureAlgorithm.SHA256,
                "endpoints": [],  # All endpoints
                "metadata": {"provider": "general", "version": "v1", "status": "placeholder"}
            }
        ]
        
        for key_config in placeholder_keys:
            webhook_key = WebhookKey(
                key_id=key_config["key_id"],
                secret_key=key_config["secret"],
                algorithm=key_config["algorithm"],
                created_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(days=365),  # 1 year expiry
                is_active=False,  # Inactive until real integration
                allowed_endpoints=key_config["endpoints"],
                metadata=key_config["metadata"]
            )
            self._keys[webhook_key.key_id] = webhook_key
        
        self.logger.info(f"Initialized {len(placeholder_keys)} placeholder webhook keys")
    
    def generate_webhook_key(
        self,
        key_id: str,
        algorithm: Optional[SignatureAlgorithm] = None,
        expires_in_days: Optional[int] = None,
        allowed_endpoints: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> WebhookKey:
        """Generate a new webhook signing key"""
        
        if algorithm is None:
            algorithm = self.default_algorithm
        
        # Generate cryptographically secure secret
        secret_key = secrets.token_urlsafe(32)  # 32 bytes = 256 bits
        
        # Calculate expiry
        expires_at = None
        if expires_in_days:
            expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
        
        webhook_key = WebhookKey(
            key_id=key_id,
            secret_key=secret_key,
            algorithm=algorithm,
            created_at=datetime.utcnow(),
            expires_at=expires_at,
            is_active=True,
            allowed_endpoints=allowed_endpoints or [],
            metadata=metadata or {}
        )
        
        # Store the key
        self._keys[key_id] = webhook_key
        
        self.logger.info(f"Generated new webhook key: {key_id} with algorithm {algorithm.value}")
        
        return webhook_key
    
    def activate_placeholder_key(self, key_id: str) -> bool:
        """Activate a placeholder key for actual use"""
        if key_id not in self._keys:
            self.logger.error(f"Webhook key {key_id} not found")
            return False
        
        key = self._keys[key_id]
        if key.metadata.get("status") != "placeholder":
            self.logger.warning(f"Key {key_id} is not a placeholder key")
            return False
        
        # Generate new secret for activation
        key.secret_key = secrets.token_urlsafe(32)
        key.is_active = True
        key.metadata["status"] = "active"
        key.metadata["activated_at"] = datetime.utcnow().isoformat()
        
        self.logger.info(f"Activated placeholder webhook key: {key_id}")
        return True
    
    def sign_request(
        self,
        key_id: str,
        payload: str,
        timestamp: Optional[int] = None,
        nonce: Optional[str] = None,
        additional_headers: Optional[Dict[str, str]] = None
    ) -> Tuple[str, Dict[str, str]]:
        """
        Sign a webhook request
        
        Returns:
            Tuple of (signature, headers_to_add)
        """
        if key_id not in self._keys:
            raise ValueError(f"Webhook key {key_id} not found")
        
        key = self._keys[key_id]
        if not key.is_active or key.is_expired():
            raise ValueError(f"Webhook key {key_id} is inactive or expired")
        
        # Generate timestamp and nonce if not provided
        if timestamp is None:
            timestamp = int(time.time())
        if nonce is None:
            nonce = secrets.token_urlsafe(16)
        
        # Create signing string
        signing_components = [
            str(timestamp),
            nonce,
            payload
        ]
        
        # Add additional headers to signing string if provided
        if additional_headers:
            sorted_headers = sorted(additional_headers.items())
            header_string = "&".join(f"{k}={v}" for k, v in sorted_headers)
            signing_components.append(header_string)
        
        signing_string = "\n".join(signing_components)
        
        # Generate HMAC signature
        if key.algorithm == SignatureAlgorithm.SHA256:
            hash_func = hashlib.sha256
        elif key.algorithm == SignatureAlgorithm.SHA512:
            hash_func = hashlib.sha512
        else:
            raise ValueError(f"Unsupported algorithm: {key.algorithm}")
        
        signature = hmac.new(
            key.secret_key.encode('utf-8'),
            signing_string.encode('utf-8'),
            hash_func
        ).hexdigest()
        
        # Prepare headers
        headers = {
            "X-Webhook-Signature": f"{key.algorithm.value}={signature}",
            "X-Webhook-Key-Id": key_id,
            "X-Webhook-Timestamp": str(timestamp),
            "X-Webhook-Nonce": nonce,
            "X-Webhook-Version": "1.0"
        }
        
        self.logger.debug(f"Generated webhook signature for key {key_id}")
        
        return signature, headers
    
    def validate_signature(
        self,
        signature_header: str,
        key_id: str,
        payload: str,
        timestamp: Optional[str] = None,
        nonce: Optional[str] = None,
        additional_headers: Optional[Dict[str, str]] = None,
        endpoint: Optional[str] = None
    ) -> SignatureValidationResult:
        """Validate webhook signature"""
        
        result = SignatureValidationResult(is_valid=False)
        
        try:
            # Parse signature header
            if not signature_header.startswith(("sha256=", "sha512=")):
                result.error_message = "Invalid signature format"
                return result
            
            algorithm_str, signature = signature_header.split("=", 1)
            algorithm = SignatureAlgorithm(algorithm_str)
            result.algorithm = algorithm.value
            
            # Check if key exists and is valid
            if key_id not in self._keys:
                result.error_message = f"Unknown key ID: {key_id}"
                return result
            
            key = self._keys[key_id]
            result.key_id = key_id
            
            if not key.is_valid_for_endpoint(endpoint or ""):
                result.error_message = "Key not valid for this endpoint"
                return result
            
            # Check timestamp if required
            if self.require_timestamp and timestamp:
                try:
                    request_time = datetime.fromtimestamp(int(timestamp))
                    now = datetime.utcnow()
                    time_diff = abs((now - request_time).total_seconds())
                    
                    if time_diff > self._max_timestamp_drift.total_seconds():
                        result.timestamp_valid = False
                        result.error_message = f"Timestamp too old or in future: {time_diff}s drift"
                        return result
                except (ValueError, TypeError) as e:
                    result.timestamp_valid = False
                    result.error_message = f"Invalid timestamp: {e}"
                    return result
            
            # Check for replay attacks with nonce
            if self.require_nonce and nonce:
                self._cleanup_nonce_cache()
                nonce_key = f"{key_id}:{nonce}"
                
                if nonce_key in self._nonce_cache:
                    result.replay_attack_detected = True
                    result.error_message = "Replay attack detected: nonce already used"
                    return result
                
                # Store nonce
                self._nonce_cache[nonce_key] = datetime.utcnow()
            
            # Reconstruct signing string
            signing_components = [
                timestamp or "",
                nonce or "",
                payload
            ]
            
            if additional_headers:
                sorted_headers = sorted(additional_headers.items())
                header_string = "&".join(f"{k}={v}" for k, v in sorted_headers)
                signing_components.append(header_string)
            
            signing_string = "\n".join(signing_components)
            
            # Calculate expected signature
            if algorithm == SignatureAlgorithm.SHA256:
                hash_func = hashlib.sha256
            elif algorithm == SignatureAlgorithm.SHA512:
                hash_func = hashlib.sha512
            else:
                result.error_message = f"Unsupported algorithm: {algorithm}"
                return result
            
            expected_signature = hmac.new(
                key.secret_key.encode('utf-8'),
                signing_string.encode('utf-8'),
                hash_func
            ).hexdigest()
            
            # Secure comparison
            is_valid = hmac.compare_digest(signature, expected_signature)
            result.is_valid = is_valid
            
            if not is_valid:
                result.error_message = "Signature mismatch"
            
            result.metadata = {
                "key_metadata": key.metadata,
                "signing_components_count": len(signing_components),
                "algorithm": algorithm.value
            }
            
            return result
            
        except Exception as e:
            result.error_message = f"Signature validation error: {str(e)}"
            self.logger.error(f"HMAC validation error: {e}")
            return result
    
    def _cleanup_nonce_cache(self):
        """Clean up expired nonces from cache"""
        cutoff = datetime.utcnow() - self._nonce_cache_ttl
        expired_nonces = [
            nonce_key for nonce_key, timestamp in self._nonce_cache.items()
            if timestamp < cutoff
        ]
        
        for nonce_key in expired_nonces:
            del self._nonce_cache[nonce_key]
        
        if expired_nonces:
            self.logger.debug(f"Cleaned up {len(expired_nonces)} expired nonces")
    
    def rotate_key(self, key_id: str) -> str:
        """Rotate a webhook key (generate new secret)"""
        if key_id not in self._keys:
            raise ValueError(f"Webhook key {key_id} not found")
        
        key = self._keys[key_id]
        old_secret = key.secret_key[:8] + "..."  # Log partial for audit
        
        # Generate new secret
        key.secret_key = secrets.token_urlsafe(32)
        key.metadata["rotated_at"] = datetime.utcnow().isoformat()
        key.metadata["rotation_count"] = key.metadata.get("rotation_count", 0) + 1
        
        self.logger.info(f"Rotated webhook key {key_id} (old secret: {old_secret})")
        
        return key.secret_key
    
    def revoke_key(self, key_id: str) -> bool:
        """Revoke a webhook key"""
        if key_id not in self._keys:
            return False
        
        key = self._keys[key_id]
        key.is_active = False
        key.metadata["revoked_at"] = datetime.utcnow().isoformat()
        
        self.logger.info(f"Revoked webhook key {key_id}")
        return True
    
    def list_keys(self, include_inactive: bool = False) -> List[Dict[str, Any]]:
        """List webhook keys (excluding secret)"""
        keys_info = []
        
        for key in self._keys.values():
            if not include_inactive and not key.is_active:
                continue
            
            key_info = {
                "key_id": key.key_id,
                "algorithm": key.algorithm.value,
                "created_at": key.created_at.isoformat(),
                "expires_at": key.expires_at.isoformat() if key.expires_at else None,
                "is_active": key.is_active,
                "is_expired": key.is_expired(),
                "allowed_endpoints": key.allowed_endpoints,
                "metadata": key.metadata
            }
            keys_info.append(key_info)
        
        return keys_info
    
    def get_stats(self) -> Dict[str, Any]:
        """Get HMAC service statistics"""
        total_keys = len(self._keys)
        active_keys = sum(1 for key in self._keys.values() if key.is_active)
        expired_keys = sum(1 for key in self._keys.values() if key.is_expired())
        placeholder_keys = sum(1 for key in self._keys.values() 
                             if key.metadata.get("status") == "placeholder")
        
        return {
            "total_keys": total_keys,
            "active_keys": active_keys,
            "expired_keys": expired_keys,
            "placeholder_keys": placeholder_keys,
            "nonce_cache_size": len(self._nonce_cache),
            "algorithms_in_use": list(set(key.algorithm.value for key in self._keys.values())),
            "providers_configured": list(set(key.metadata.get("provider") for key in self._keys.values() 
                                           if key.metadata.get("provider"))),
            "configuration": {
                "require_timestamp": self.require_timestamp,
                "require_nonce": self.require_nonce,
                "max_timestamp_drift_seconds": int(self._max_timestamp_drift.total_seconds()),
                "nonce_cache_ttl_hours": int(self._nonce_cache_ttl.total_seconds() / 3600)
            }
        }


def webhook_signature_required(key_id_header: str = "X-Webhook-Key-Id", optional: bool = False):
    """
    Decorator for endpoints that require webhook signature validation
    
    Args:
        key_id_header: Header name containing the key ID
        optional: If True, don't fail if signature is missing (for gradual rollout)
    """
    def decorator(func):
        from functools import wraps
        
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request object
            request = None
            for arg in args:
                if hasattr(arg, 'headers'):
                    request = arg
                    break
            
            if not request:
                if not optional:
                    from fastapi import HTTPException
                    raise HTTPException(status_code=400, detail="Unable to validate webhook signature")
                return await func(*args, **kwargs)
            
            # Get signature headers
            signature = request.headers.get("X-Webhook-Signature")
            key_id = request.headers.get(key_id_header)
            timestamp = request.headers.get("X-Webhook-Timestamp")
            nonce = request.headers.get("X-Webhook-Nonce")
            
            if not signature or not key_id:
                if not optional:
                    from fastapi import HTTPException
                    raise HTTPException(
                        status_code=401,
                        detail="Missing required webhook signature headers"
                    )
                return await func(*args, **kwargs)
            
            # Get request body
            if hasattr(request, '_body'):
                body = request._body.decode('utf-8')
            else:
                # Try to read body (this is a placeholder - actual implementation depends on FastAPI version)
                body = ""
            
            # Validate signature
            signer = get_webhook_signer()
            result = signer.validate_signature(
                signature_header=signature,
                key_id=key_id,
                payload=body,
                timestamp=timestamp,
                nonce=nonce,
                endpoint=str(request.url.path)
            )
            
            if not result.is_valid:
                from fastapi import HTTPException
                raise HTTPException(
                    status_code=401,
                    detail={
                        "error": "Invalid webhook signature",
                        "reason": result.error_message,
                        "key_id": key_id,
                        "timestamp_valid": result.timestamp_valid,
                        "replay_attack_detected": result.replay_attack_detected
                    }
                )
            
            # Add validation result to request state for use in endpoint
            if hasattr(request, 'state'):
                request.state.webhook_validation = result
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


# Global HMAC signer instance
_webhook_signer: Optional[HMACWebhookSigner] = None


def get_webhook_signer() -> HMACWebhookSigner:
    """Get the global webhook signer instance"""
    global _webhook_signer
    if _webhook_signer is None:
        _webhook_signer = HMACWebhookSigner()
    return _webhook_signer