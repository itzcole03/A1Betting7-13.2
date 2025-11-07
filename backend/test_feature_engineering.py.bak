import unittest

import numpy as np

from backend.feature_engineering import FeatureEngineering


class TestFeatureEngineering(unittest.TestCase):
    def setUp(self):
        self.fe = FeatureEngineering()

    def test_extract_features_granular(self):
        data = {
            "points": [10, 12, 15, 20, 18, 22, 25, 30, 28, 26],
            "opponent_stats": {"teamA": [12, 14], "teamB": [18, 20]},
            "home_stats": [15, 18, 20],
            "away_stats": [10, 12, 14],
            "PER": 22.5,
            "TS%": 0.58,
            "USG%": 0.22,
            "efficiency": 1.12,
            "rest_days": 2,
            "travel_distance": 500,
            "injury_status": 0,
            "pace": 98.5,
            "coaching_change": True,
        }
        features = self.fe._extract_features(data)
        self.assertEqual(features.shape[1] > 10, True)

    def test_monte_carlo_simulation(self):
        result = self.fe.monte_carlo_prop_simulation(
            mean=20, std=5, line=18, n_sim=10000
        )
        self.assertTrue(0 <= result["over_prob"] <= 1)
        self.assertTrue(0 <= result["under_prob"] <= 1)
        self.assertAlmostEqual(result["over_prob"] + result["under_prob"], 1, places=2)


if __name__ == "__main__":
    unittest.main()
