"""
Retrain and save the win probability model for A1Betting (scikit-learn 1.6.1)
- Loads training data from CSV or DataFrame (customize path/columns as needed)
- Trains DecisionTreeClassifier (customizable)
- Saves model as backend/models/win_probability_model.pkl
- Includes logging, error handling, and synthetic fallback data
"""

import argparse
import logging
import os
import pickle
from typing import Optional

import numpy as np
import pandas as pd
from pandas import DataFrame
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier

# --- Logging setup ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("retrain_win_probability_model")

# --- Config (defaults, can be overridden by CLI) ---
DEFAULT_DATA_PATH = "backend/data/win_probability_training.csv"
DEFAULT_MODEL_PATH = "backend/models/win_probability_model.pkl"
RANDOM_STATE = 42


# --- Load training data ---
def load_training_data(data_path: str) -> DataFrame:
    if os.path.exists(data_path):
        logger.info(f"Loading training data from {data_path}")
        df = pd.read_csv(data_path)
    else:
        logger.warning(f"Training data not found at {data_path}, using synthetic data.")
        np.random.seed(RANDOM_STATE)
        df = pd.DataFrame(
            {
                "feature1": np.random.rand(1000),
                "feature2": np.random.rand(1000),
                "feature3": np.random.randint(0, 2, 1000),
                "win": np.random.randint(0, 2, 1000),
            }
        )
    # --- Data validation ---
    logger.info(
        f"Validating training data: shape={df.shape}, columns={list(df.columns)}"
    )
    required_cols = {"feature1", "feature2", "feature3", "win"}
    if not required_cols.issubset(df.columns):
        logger.error(f"Missing required columns: {required_cols - set(df.columns)}")
        raise ValueError(f"Missing required columns: {required_cols - set(df.columns)}")
    if df.isnull().any().any():
        logger.warning("Training data contains NaN values. Filling with zeros.")
        df = df.fillna(0)
    if len(df) < 100:
        logger.warning(
            f"Training data is very small (n={len(df)}). Model may not generalize well."
        )
    if df["win"].nunique() < 2:
        logger.error("Training data does not contain both classes for 'win'.")
        raise ValueError("Training data does not contain both classes for 'win'.")
    return df


# --- Train model ---
def train_model(df: DataFrame) -> DecisionTreeClassifier:
    logger.info("Starting model training...")
    features = [col for col in df.columns if col != "win"]
    X = df[features]
    y = df["win"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE
    )
    model = DecisionTreeClassifier(random_state=RANDOM_STATE, max_depth=5)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    logger.info(f"Model trained. Test accuracy: {acc:.3f}")
    if acc < 0.6:
        logger.warning(
            f"Model test accuracy is low: {acc:.3f}. Consider improving features or data."
        )
    return model


# --- Save model ---


def save_model(model: DecisionTreeClassifier, model_path: str) -> None:
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    try:
        with open(model_path, "wb") as f:
            pickle.dump(model, f)
        logger.info(f"Model saved to {model_path}")
    except Exception as e:
        logger.error(f"Error saving model: {e}")
        raise

    # --- Post-save validation: reload and test predict ---
    try:
        with open(model_path, "rb") as f:
            loaded_model = pickle.load(f)
        test_X = np.array([[0.5, 0.5, 1]])  # feature1, feature2, feature3
        pred = loaded_model.predict(test_X)
        logger.info(
            f"Post-save validation: loaded model predicts {pred} for test input {test_X}"
        )
    except Exception as e:
        logger.error(f"Post-save validation failed: {e}")
        raise


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Retrain and save the win probability model."
    )
    parser.add_argument(
        "--data", type=str, default=DEFAULT_DATA_PATH, help="Path to training data CSV."
    )
    parser.add_argument(
        "--model",
        type=str,
        default=DEFAULT_MODEL_PATH,
        help="Path to save trained model.",
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Run all steps except saving the model."
    )
    args = parser.parse_args()

    try:
        logger.info("Starting win probability model retraining...")
        df = load_training_data(args.data)
        logger.info(f"Training data shape: {df.shape}, columns: {list(df.columns)}")
        model = train_model(df)
        if args.dry_run:
            logger.info("Dry run: model not saved.")
        else:
            save_model(model, args.model)
        logger.info("Retraining complete. You can now restart the backend.")
        exit(0)
    except Exception as e:
        logger.error(f"Retraining failed: {e}")
        exit(1)
