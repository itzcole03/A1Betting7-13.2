#!/usr/bin/env python3
"""
Debug momentum features issue
"""

import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

import numpy as np
import pandas as pd

from backend.services.advanced_feature_engine import AdvancedFeatureEngine

# Create test data similar to the failing test
np.random.seed(42)
data = pd.DataFrame(
    {
        "player_id": np.repeat(range(20), 5),
        "game_date": pd.date_range("2024-01-01", periods=100),
        "launch_speed": np.random.uniform(80, 120, 100),
        "launch_angle": np.random.uniform(-20, 60, 100),
        "barrel_rate": np.random.uniform(0, 30, 100),
        "woba": np.random.uniform(0.2, 0.6, 100),
        "home_runs": np.random.poisson(2, 100),
        "hits": np.random.poisson(5, 100),
        "walks": np.random.poisson(3, 100),
        "hits_allowed": np.random.poisson(8, 100),
    }
)

engine = AdvancedFeatureEngine()
result = engine.create_time_series_features(data)

print(f"Input shape: {data.shape}")
print(f"Output shape: {result.shape}")
print(f"Input columns: {list(data.columns)}")

# Check for momentum features
momentum_cols = [col for col in result.columns if "_momentum" in col]
print(f"Momentum columns: {momentum_cols}")

# Check for rolling features
rolling_cols = [col for col in result.columns if "_roll_" in col]
print(f"Number of rolling columns: {len(rolling_cols)}")
print(f"Sample rolling columns: {rolling_cols[:5]}")

# Check feature_cols that would be used for momentum
numeric_cols = data.select_dtypes(include=[np.number]).columns.tolist()
exclude_cols = {"player_id"}
feature_cols = [col for col in numeric_cols if col not in exclude_cols]
print(f"Feature cols for momentum: {feature_cols}")
print(f"Max features for momentum: {5}")
print(f"Feature cols used for momentum: {feature_cols[:5]}")

# Check if the required rolling columns exist
for col in feature_cols[:5]:
    short_col = f"{col}_roll_10"
    long_col = f"{col}_roll_50"
    short_exists = short_col in result.columns
    long_exists = long_col in result.columns
    print(
        f"{col}: {short_col} exists: {short_exists}, {long_col} exists: {long_exists}"
    )
