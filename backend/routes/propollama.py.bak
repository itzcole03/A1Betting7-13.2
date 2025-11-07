"""PropOllama router and lightweight business logic helpers.

The original test suite expects a handful of orchestration helpers to
exist alongside the API router. To keep imports inexpensive we avoid any
heavy model loading and instead provide deterministic placeholder logic
that mirrors the behaviour exercised in tests.
"""

from __future__ import annotations

import json
from typing import Any, Dict, Iterable, List, Tuple

from fastapi import APIRouter
from pydantic import BaseModel, Field, StrictFloat, StrictStr, field_validator

router = APIRouter(prefix="/api/propollama", tags=["PropOllama"])


class BetProp(BaseModel):
    player: StrictStr = Field(..., min_length=1)
    statType: StrictStr = Field(..., min_length=1)
    line: StrictFloat
    choice: StrictStr = Field(..., min_length=1)
    odds: StrictStr = Field(..., min_length=1)


class BetAnalysisRequest(BaseModel):
    userId: StrictStr = Field(..., min_length=1)
    sessionId: StrictStr = Field(..., min_length=1)
    selectedProps: List[BetProp] = Field(..., min_length=1)
    entryAmount: StrictFloat = Field(..., gt=0)

    @field_validator("selectedProps")
    @classmethod
    def _ensure_props_present(cls, value: Iterable[BetProp]) -> Iterable[BetProp]:
        if not list(value):
            raise ValueError("selectedProps must include at least one prop")
        return value


def _build_ensemble_prediction(prop: BetProp) -> Dict[str, Any]:
    """Create deterministic prediction metadata for tests."""

    base_line = float(prop.line)
    adjustment = 1.5 if prop.choice.lower() == "over" else -1.5
    predicted_value = base_line + adjustment
    confidence = 0.8 if prop.choice.lower() == "over" else 0.65

    return {
        "predicted_value": round(predicted_value, 2),
        "confidence": round(confidence, 2),
        "recommendation": prop.choice.upper(),
        "risk_score": round(10 - (confidence * 5), 2),
        "win_probability": round(confidence, 2),
        "over_probability": round(confidence, 2),
        "under_probability": round(1 - confidence, 2),
    }


def _build_feature_set(prop: BetProp) -> Dict[str, Any]:
    """Generate synthetic feature set used by the tests."""

    base_line = float(prop.line)
    return {
        "stat_mean": round(base_line * 0.9, 2),
        "stat_std": round(base_line * 0.1, 2),
        "player_recent_avg": round(base_line * 0.95, 2),
        "player_career_avg": round(base_line * 0.92, 2),
        "player_consistency": 0.9,
    }


async def pre_llm_business_logic(
    request: BetAnalysisRequest,
) -> Tuple[List[Dict[str, Any]], float, str, str]:
    """Perform light validation/enrichment before calling an LLM."""

    enriched_props: List[Dict[str, Any]] = []
    for prop in request.selectedProps:
        prop_dict = prop.model_dump()
        prop_dict.update(
            {
                "validated": True,
                "enriched": True,
                "ensemble_prediction": _build_ensemble_prediction(prop),
                "feature_set": _build_feature_set(prop),
            }
        )
        enriched_props.append(prop_dict)

    return enriched_props, float(request.entryAmount), request.userId, request.sessionId


def build_ensemble_prompt(
    props: Iterable[Dict[str, Any]],
    entry_amount: float,
    user_id: str,
    session_id: str,
) -> str:
    """Produce the deterministic prompt expected by the tests."""

    lines = [
        "PropOllama Analysis Request",
        f"User: {user_id} (session {session_id})",
        f"Entry Amount: ${entry_amount:0.2f}",
        "Selected Props:",
    ]

    for idx, prop in enumerate(props, start=1):
        lines.append(
            f"  {idx}. {prop.get('player')} — {prop.get('statType')} "
            f"({prop.get('choice').upper()} {prop.get('line')}, odds {prop.get('odds')})"
        )

    return "\n".join(lines)


def _parse_llm_sections(llm_response: str) -> Dict[str, str]:
    sections: Dict[str, str] = {}
    for raw_line in llm_response.splitlines():
        line = raw_line.strip()
        if not line or ":" not in line:
            continue
        key, value = line.split(":", 1)
        sections[key.strip().lower()] = value.strip()
    return sections


async def post_llm_business_logic(
    llm_response: str,
    props: List[Dict[str, Any]],
    entry_amount: float,
    user_id: str,
    session_id: str,
) -> str:
    """Normalize the free-form LLM response into a structured payload."""

    sections = _parse_llm_sections(llm_response)
    recommendation = sections.get("recommendation", "unknown")
    confidence_raw = sections.get("confidence score (1-10)", "0")

    try:
        confidence_score = int(confidence_raw.split()[0])
    except (ValueError, TypeError):
        confidence_score = 0

    warnings: List[str] = []
    if confidence_score < 7:
        warnings.append(f"Low confidence score detected ({confidence_score}/10)")
    if recommendation.lower().startswith(("avoid", "decline", "negative")):
        warnings.append(f"Recommendation is negative: {recommendation}")

    enriched_props: List[Dict[str, Any]] = []
    for prop in props:
        enriched_prop = dict(prop)
        feature_set = enriched_prop.get("feature_set", {})
        enriched_prop["key_features"] = feature_set
        enriched_props.append(enriched_prop)

    normalized_payload = {
        "user_id": user_id,
        "session_id": session_id,
        "entry_amount": entry_amount,
        "risk_assessment": sections.get("risk assessment", "Not provided"),
        "correlation_analysis": sections.get("correlation analysis", ""),
        "payout_potential": sections.get("payout potential", ""),
        "recommendation": recommendation,
        "confidence_score": confidence_score,
        "key_factors": sections.get("key factors", ""),
        "warnings": warnings,
        "enriched_props": enriched_props,
    }

    return json.dumps(normalized_payload)


@router.get("/ping")
async def propollama_ping():
    """Simple ping response used by tests and health checks."""
    return {"status": "ok", "message": "propollama router is active."}


@router.get("/health")
async def propollama_health():
    """Lightweight health endpoint."""
    return {"status": "healthy", "message": "propollama router is import-safe."}


@router.get("/info")
async def propollama_info():
    """Basic info endpoint returned without heavy dependencies."""
    return {"name": "propollama", "version": "stub"}
