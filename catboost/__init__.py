"""Very small shim for `catboost` package so import-time references don't fail.
Real CatBoost provides gradient boosting models; this shim only exports a
minimal `CatBoost` placeholder for tests that don't exercise CatBoost.
"""


class CatBoost:
    def __init__(self, *args, **kwargs):
        pass

    def fit(self, X, y, *args, **kwargs):
        return self

    def predict(self, X):
        return [0 for _ in range(len(X))]


__all__ = ["CatBoost"]


# Provide compat aliases expected by older imports
class CatBoostRegressor(CatBoost):
    pass


class CatBoostClassifier(CatBoost):
    pass


__all__.extend(["CatBoostRegressor", "CatBoostClassifier"])
