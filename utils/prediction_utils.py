"""Thin re-export wrapper for consolidated test compat prediction utils.

This module forwards to `tests._compat.prediction_utils`. Keeping this
wrapper small ensures import-time stability while centralizing shim logic
in a single location under `tests/_compat`.
"""

try:
    from tests._compat.prediction_utils import (  # type: ignore
        calculate_confidence,
        calculate_confidencee,
        calculate_uncertaintt,
        calculate_uncertainty,
        normalize_features,
        score_prediction,
    )
except (
    Exception
) as _exc:  # pragma: no cover - fallback for non-test environments  # pylint: disable=broad-except
    # Best-effort fallback to preserve import-time safety for archived code
    def score_prediction(*args, **kwargs):
        return 0.0

    def normalize_features(features):
        return features

    def calculate_confidence(preds):
        try:
            total = len(preds)
            if total == 0:
                return 0.0
            nonzero = sum(1 for p in preds if p)
            return nonzero / total
        except Exception:
            return 0.0

    # Backwards-compatible aliases
    calculate_confidencee = calculate_confidence

    def calculate_uncertainty(preds):
        return calculate_confidence(preds)

    calculate_uncertaintt = calculate_uncertainty
