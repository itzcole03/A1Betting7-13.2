import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query, status

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.exceptions.api_exceptions import (
    AuthorizationException,
    BusinessLogicException,
)
from backend.services.real_time_analysis_engine import real_time_engine
from backend.utils.response_envelope import fail, ok

router = APIRouter()
security = HTTPBearer()


def is_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> bool:
    """
    Dummy admin check (replace with real auth in production).
    Raises AuthorizationException if not authorized.
    """
    if credentials.credentials != "admin-token":
        raise AuthorizationException(
            detail="Not authorized", error_code="not_authorized"
        )
    return True


@router.get("/admin/rules-audit-log", response_model=Dict[str, Any], tags=["Admin"])
def get_rules_audit_log(
    _: bool = Depends(is_admin),
    user_id: Optional[str] = Query(None, description="Filter by user_id"),
    action: Optional[str] = Query(
        None, description="Filter by action (add, update, delete)"
    ),
    rule_id: Optional[str] = Query(None, description="Filter by rule_id"),
    since: Optional[str] = Query(
        None, description="ISO8601: Only entries after this timestamp"
    ),
    until: Optional[str] = Query(
        None, description="ISO8601: Only entries before this timestamp"
    ),
) -> Dict[str, Any]:
    """
    Return the rules audit log (admin only), optionally filtered by user, action, rule_id, or date.
    Returns standardized response contract.
    Example success:
        {"success": True, "data": [...], "error": None}
    Example error:
        {"success": False, "data": None, "error": {"code": "not_authorized", "message": "Not authorized"}}
    """
    audit_path = os.path.join(os.path.dirname(__file__), "../rules_audit_log.jsonl")
    entries: List[Dict[str, Any]] = []
    if not os.path.exists(audit_path):
        return ResponseBuilder.success(ok([]))
    try:
        with open(audit_path, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    entry = json.loads(line)
                    if user_id and entry.get("user_id") != user_id:
                        continue
                    if action and entry.get("action") != action:
                        continue
                    if rule_id and entry.get("rule_id") != rule_id:
                        continue
                    if since and entry.get("timestamp") < since:
                        continue
                    if until and entry.get("timestamp") > until:
                        continue
                    entries.append(entry)
                except Exception:
                    continue
        return ResponseBuilder.success(ok(entries))
    except Exception as e:
        raise BusinessLogicException(
            detail=f"Failed to read audit log: {str(e)}", error_code="audit_log_error"
        )


@router.post(
    "/admin/reload-business-rules", response_model=Dict[str, Any], tags=["Admin"]
)
def reload_business_rules(_: bool = Depends(is_admin)) -> Dict[str, Any]:
    """
    Reload business rules from YAML (admin only), log attempt, and return ResponseBuilder.success(version) info.
    Returns standardized response contract.
    Example success:
        {"success": True, "data": {...}, "error": None}
    Example error:
        {"success": False, "data": None, "error": {"code": "reload_failed", "message": "Failed to reload business rules: ..."}}
    """
    logger = logging.getLogger("admin.reload_business_rules")
    try:
        real_time_engine.reload_business_rules()
        rules = getattr(real_time_engine, "business_rules", {})
        version = rules.get("ruleset_version", "unknown")
        last_updated = rules.get("last_updated", "unknown")
        timestamp = datetime.now(timezone.utc).isoformat()
        logger.info(
            f"Business rules reloaded by admin at {timestamp}. Version: {version}, Last updated: {last_updated}"
        )
        return ResponseBuilder.success(ok(
            {
                "message": "Business rules reloaded",
                "ruleset_version": version,
                "rules_last_updated": last_updated,
                "timestamp": timestamp,
            }
        ))
    except Exception as e:
        logger.error(f"Failed to reload business rules: {e}")
        raise BusinessLogicException(
            detail=f"Failed to reload business rules: {str(e)}",
            error_code="reload_failed",
        )
