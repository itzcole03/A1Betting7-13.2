import asyncio
import os
import sys

import numpy as np
import pandas as pd

# Ensure backend is in sys.path for import
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from backend.services.advanced_ensemble_service import advanced_ensemble_service


# Mock MLB data with engineered features (30 features as per MLB pipeline)
def generate_mock_mlb_data(num_samples=200):
    X = np.random.rand(num_samples, 30)
    # Simulate target: e.g., hits or strikeouts, Poisson-like
    y = np.random.poisson(lam=2.5, size=num_samples)
    return X, y


async def train_and_evaluate_mlb():
    X, y = generate_mock_mlb_data()
    df = pd.DataFrame(X, columns=[f"feature_{i}" for i in range(X.shape[1])])
    df["target"] = y

    # For demonstration, just call retrain_models (would be more complex in prod)
    await advanced_ensemble_service.retrain_models(df)
    print("MLB model training and evaluation complete. (See logs for details)")


if __name__ == "__main__":
    asyncio.run(train_and_evaluate_mlb())
