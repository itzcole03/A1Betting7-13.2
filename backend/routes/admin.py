import json
import os

from fastapi import Query


@router.get("/admin/rules-audit-log", tags=["Admin"])
def get_rules_audit_log(
    _: bool = Depends(is_admin),
    user_id: str = Query(None, description="Filter by user_id"),
    action: str = Query(None, description="Filter by action (add, update, delete)"),
    rule_id: str = Query(None, description="Filter by rule_id"),
    since: str = Query(None, description="ISO8601: Only entries after this timestamp"),
    until: str = Query(None, description="ISO8601: Only entries before this timestamp"),
):
    """Return the rules audit log (admin only), optionally filtered by user, action, rule_id, or date."""
    audit_path = os.path.join(os.path.dirname(__file__), "../rules_audit_log.jsonl")
    entries = []
    if not os.path.exists(audit_path):
        return []
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
    return entries


from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.services.real_time_analysis_engine import real_time_engine

router = APIRouter()
security = HTTPBearer()


# Dummy admin check (replace with real auth in production)
def is_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # TODO: Implement real admin check
    if credentials.credentials != "admin-token":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )
    return True


import logging
from datetime import datetime, timezone


@router.post("/admin/reload-business-rules", tags=["Admin"])
def reload_business_rules(_: bool = Depends(is_admin)):
    """Reload business rules from YAML (admin only), log attempt, and return version info"""
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
        return {
            "status": "ok",
            "message": "Business rules reloaded",
            "ruleset_version": version,
            "rules_last_updated": last_updated,
            "timestamp": timestamp,
        }
    except Exception as e:
        logger.error(f"Failed to reload business rules: {e}")
        return {
            "status": "error",
            "message": f"Failed to reload business rules: {e}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
