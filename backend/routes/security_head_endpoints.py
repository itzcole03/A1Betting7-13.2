"""
Security Hardening Module - HEAD Endpoints

Implements HEAD endpoints for efficient resource existence checks
without returning full response bodies, supporting preflight requests
and conditional operations.

Acceptance Criteria:
- HEAD endpoints mirror GET endpoints for resource existence
- Return appropriate status codes (200, 404, 403) 
- Include relevant headers (Content-Type, Last-Modified, ETag)
- No response body per HTTP spec
"""

from fastapi import APIRouter, Request, HTTPException, status
from fastapi.responses import Response
from typing import Optional
import logging
from datetime import datetime

from ..services.unified_logging import unified_logging
from ..services.unified_error_handler import unified_error_handler
from ..services.unified_cache_service import unified_cache_service

logger = unified_logging.get_logger("security_head_endpoints")
router = APIRouter(prefix="/api", tags=["security", "head-endpoints"])


class HeadEndpointHandler:
    """Handler for HEAD endpoint logic with security considerations"""
    
    def __init__(self):
        self.logger = logger
        
    def create_head_response(
        self,
        exists: bool,
        content_type: str = "application/json",
        last_modified: Optional[datetime] = None,
        etag: Optional[str] = None,
        cache_control: str = "public, max-age=300"
    ) -> Response:
        """Create HEAD response with appropriate headers"""
        
        if not exists:
            # Resource does not exist
            response = Response(status_code=status.HTTP_404_NOT_FOUND)
            response.headers["Content-Type"] = content_type
            return response
            
        # Resource exists - return 200 with headers
        response = Response(status_code=status.HTTP_200_OK)
        response.headers["Content-Type"] = content_type
        response.headers["Cache-Control"] = cache_control
        
        if last_modified:
            response.headers["Last-Modified"] = last_modified.strftime(
                "%a, %d %b %Y %H:%M:%S GMT"
            )
            
        if etag:
            response.headers["ETag"] = f'"{etag}"'
            
        return response
        
    async def check_resource_exists(self, resource_type: str, resource_id: str) -> tuple[bool, dict]:
        """Check if a resource exists and return metadata"""
        
        cache_key = f"head_check:{resource_type}:{resource_id}"
        cached_result = unified_cache_service.get(cache_key)
        
        if cached_result:
            return cached_result["exists"], cached_result["metadata"]
            
        try:
            # Check different resource types
            exists = False
            metadata = {}
            
            if resource_type == "game":
                exists, metadata = await self._check_game_exists(resource_id)
            elif resource_type == "props":
                exists, metadata = await self._check_props_exist(resource_id)
            elif resource_type == "user":
                exists, metadata = await self._check_user_exists(resource_id)
            elif resource_type == "model":
                exists, metadata = await self._check_model_exists(resource_id)
            else:
                self.logger.warning(f"Unknown resource type for HEAD check: {resource_type}")
                return False, {}
                
            # Cache the result
            unified_cache_service.set(
                cache_key,
                {"exists": exists, "metadata": metadata},
                ttl=300  # 5 minutes
            )
            
            return exists, metadata
            
        except Exception as e:
            self.logger.error(f"Error checking resource existence: {e}")
            unified_error_handler.handle_error(e, f"head_check_{resource_type}")
            return False, {}
    
    async def _check_game_exists(self, game_id: str) -> tuple[bool, dict]:
        """Check if a game exists"""
        try:
            from ..services.unified_data_fetcher import unified_data_fetcher
            
            # Check if game exists in today's games
            games = await unified_data_fetcher.fetch_mlb_games("MLB")
            
            for game in games:
                if str(game.get("game_id")) == game_id:
                    return True, {
                        "last_modified": datetime.utcnow(),
                        "etag": f"game_{game_id}_{hash(str(game))}",
                        "game_state": game.get("status", "unknown")
                    }
                    
            return False, {}
            
        except Exception as e:
            self.logger.error(f"Error checking game existence: {e}")
            return False, {}
    
    async def _check_props_exist(self, game_id: str) -> tuple[bool, dict]:
        """Check if props exist for a game"""
        try:
            from ..services.comprehensive_prop_generator import ComprehensivePropGenerator
            
            generator = ComprehensivePropGenerator()
            
            # Quick existence check without full generation
            has_props = await generator._check_props_available(game_id)
            
            if has_props:
                return True, {
                    "last_modified": datetime.utcnow(),
                    "etag": f"props_{game_id}_{datetime.utcnow().timestamp()}",
                    "prop_count_estimate": "100+"
                }
            
            return False, {}
            
        except Exception as e:
            self.logger.error(f"Error checking props existence: {e}")
            return False, {}
    
    async def _check_user_exists(self, user_id: str) -> tuple[bool, dict]:
        """Check if a user exists"""
        try:
            # This would integrate with user management system
            # For now, return basic validation
            if len(user_id) >= 3 and user_id.isalnum():
                return True, {
                    "last_modified": datetime.utcnow(),
                    "etag": f"user_{user_id}_{hash(user_id)}",
                    "user_status": "active"
                }
            
            return False, {}
            
        except Exception as e:
            self.logger.error(f"Error checking user existence: {e}")
            return False, {}
    
    async def _check_model_exists(self, model_id: str) -> tuple[bool, dict]:
        """Check if an ML model exists"""
        try:
            from ..services.modern_ml_service import modern_ml_service
            
            # Check if model is registered
            models = await modern_ml_service.list_models()
            
            for model in models:
                if model.get("id") == model_id:
                    return True, {
                        "last_modified": datetime.utcnow(),
                        "etag": f"model_{model_id}_{model.get('version', 'v1')}",
                        "model_status": model.get("status", "unknown")
                    }
            
            return False, {}
            
        except Exception as e:
            self.logger.error(f"Error checking model existence: {e}")
            return False, {}


head_handler = HeadEndpointHandler()


@router.head("/games/{game_id}")
async def head_game(game_id: str, request: Request):
    """HEAD endpoint for game existence check"""
    
    try:
        exists, metadata = await head_handler.check_resource_exists("game", game_id)
        
        response = head_handler.create_head_response(
            exists=exists,
            content_type="application/json",
            last_modified=metadata.get("last_modified"),
            etag=metadata.get("etag")
        )
        
        # Log the HEAD request
        logger.info(f"HEAD /games/{game_id}", extra={
            "client_ip": request.client.host if request.client else "unknown",
            "user_agent": request.headers.get("user-agent", "unknown"),
            "exists": exists,
            "response_status": response.status_code
        })
        
        return response
        
    except Exception as e:
        logger.error(f"HEAD /games/{game_id} error: {e}")
        return Response(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.head("/mlb/comprehensive-props/{game_id}")
async def head_comprehensive_props(game_id: str, request: Request):
    """HEAD endpoint for comprehensive props existence check"""
    
    try:
        exists, metadata = await head_handler.check_resource_exists("props", game_id)
        
        response = head_handler.create_head_response(
            exists=exists,
            content_type="application/json",
            last_modified=metadata.get("last_modified"),
            etag=metadata.get("etag"),
            cache_control="public, max-age=180"  # Shorter cache for props
        )
        
        logger.info(f"HEAD /mlb/comprehensive-props/{game_id}", extra={
            "client_ip": request.client.host if request.client else "unknown",
            "exists": exists,
            "response_status": response.status_code
        })
        
        return response
        
    except Exception as e:
        logger.error(f"HEAD /mlb/comprehensive-props/{game_id} error: {e}")
        return Response(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.head("/users/{user_id}")
async def head_user(user_id: str, request: Request):
    """HEAD endpoint for user existence check"""
    
    try:
        exists, metadata = await head_handler.check_resource_exists("user", user_id)
        
        response = head_handler.create_head_response(
            exists=exists,
            content_type="application/json",
            last_modified=metadata.get("last_modified"),
            etag=metadata.get("etag")
        )
        
        logger.info(f"HEAD /users/{user_id}", extra={
            "client_ip": request.client.host if request.client else "unknown",
            "exists": exists,
            "response_status": response.status_code
        })
        
        return response
        
    except Exception as e:
        logger.error(f"HEAD /users/{user_id} error: {e}")
        return Response(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.head("/models/{model_id}")
async def head_model(model_id: str, request: Request):
    """HEAD endpoint for ML model existence check"""
    
    try:
        exists, metadata = await head_handler.check_resource_exists("model", model_id)
        
        response = head_handler.create_head_response(
            exists=exists,
            content_type="application/json",
            last_modified=metadata.get("last_modified"),
            etag=metadata.get("etag")
        )
        
        logger.info(f"HEAD /models/{model_id}", extra={
            "client_ip": request.client.host if request.client else "unknown",
            "exists": exists,
            "response_status": response.status_code
        })
        
        return response
        
    except Exception as e:
        logger.error(f"HEAD /models/{model_id} error: {e}")
        return Response(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.head("/system/capabilities")
async def head_capabilities(request: Request):
    """HEAD endpoint for system capabilities existence check"""
    
    try:
        # System capabilities always exist
        response = head_handler.create_head_response(
            exists=True,
            content_type="application/json",
            last_modified=datetime.utcnow(),
            etag=f"capabilities_{datetime.utcnow().date()}"
        )
        
        logger.info("HEAD /system/capabilities", extra={
            "client_ip": request.client.host if request.client else "unknown",
            "response_status": response.status_code
        })
        
        return response
        
    except Exception as e:
        logger.error(f"HEAD /system/capabilities error: {e}")
        return Response(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)