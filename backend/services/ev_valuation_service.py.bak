from dataclasses import asdict
from typing import Optional, Dict, Any

# EV outlier threshold (percent)
EV_OUTLIER_THRESHOLD = 4.0

def compute_implied_prob(odds: int) -> Optional[float]:
    try:
        if odds == 0:
            return None
        if odds > 0:
            return 100.0 / (odds + 100.0)
        return (-odds) / ((-odds) + 100.0)
    except Exception:
        return None

def compute_ev(model_prob: float, odds: int) -> Optional[Dict[str, float]]:
    try:
        if model_prob <= 0 or model_prob >= 1:
            return None
        if odds == 0:
            return None
        payout_win = (odds / 100.0) if odds > 0 else (100.0 / (-odds))
        ev = (model_prob * payout_win) - ((1 - model_prob) * 1.0)
        return {
            "expected_value": ev,
            "ev_percent": ev * 100.0
        }
    except Exception:
        return None

def evaluate_opportunity(opportunity) -> Any:
    """
    Mutates or returns updated opportunity with EV fields.
    Uses opportunity.confidence as proxy for model probability (supports 0-1 or 0-100 scale).
    """
    try:
        conf = getattr(opportunity, "confidence", None)
        odds = getattr(opportunity, "odds", None)

        if conf is None or odds is None:
            return opportunity

        # Normalize confidence
        if conf > 1:
            model_prob = conf / 100.0
        else:
            model_prob = conf

        if model_prob <= 0 or model_prob >= 1:
            return opportunity

        implied_prob = compute_implied_prob(odds)
        ev_result = compute_ev(model_prob, odds)

        if not ev_result:
            return opportunity

        ev_percent = ev_result["ev_percent"]
        setattr(opportunity, "evValue", round(ev_result["expected_value"], 4))
        setattr(opportunity, "evPercent", round(ev_percent, 2))
        setattr(opportunity, "isOutlier", ev_percent >= EV_OUTLIER_THRESHOLD)
        return opportunity
    except Exception:
        # Silent fail to preserve existing behavior
        return opportunity
