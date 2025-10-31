"""Minimal prediction utilities shim copied into tests/_compat.

Contains harmless placeholder functions used by archived import-time code
paths. Centralized under tests/_compat so we can remove them easily later.
"""


def score_prediction(*args, **kwargs):
    return 0.0


def normalize_features(features):
    return features


def calculate_confidence(preds):
    """Return a small confidence score for a sequence of predictions.

    This is a heuristic placeholder used by archived import-time codepaths.
    """
    try:
        # simple confidence: proportion of non-zero predictions
        total = len(preds)
        if total == 0:
            return 0.0
        nonzero = sum(1 for p in preds if p)
        return nonzero / total
    except Exception:
        return 0.0


# Backwards-compatible misspelling found in some archived code
calculate_confidencee = calculate_confidence


# Some archived modules expect a calculate_uncertainty function name.
# Provide it as an alias to the confidence heuristic for import-time safety.
def calculate_uncertainty(preds):
    return calculate_confidence(preds)


# And some very old/typo'd imports use calculate_uncertaintt (double t).
calculate_uncertaintt = calculate_uncertainty
