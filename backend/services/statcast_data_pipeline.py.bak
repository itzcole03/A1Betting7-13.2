"""
Statcast Data Pipeline for MLB Player Projections

This module handles fetching, processing, and caching of Baseball Savant Statcast data
for training advanced ML models that predict traditional baseball statistics.
"""

import asyncio
import json
import logging
import pickle
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd
import pybaseball as pyb

# Import the player ID mapping service
from .player_id_mapping_service import PlayerIDMappingService

# Configure logging
logger = logging.getLogger("statcast_pipeline")


@dataclass
class StatcastConfig:
    """Configuration for Statcast data pipeline"""

    min_plate_appearances: int = 50  # Minimum PAs for inclusion
    min_innings_pitched: float = 20.0  # Minimum IP for pitchers
    rolling_window_days: int = 30  # Rolling average window
    training_years: int = 3  # Years of historical data
    cache_ttl_hours: int = 24  # Cache time-to-live
    feature_cache_dir: str = "data/statcast_features"


class StatcastDataPipeline:
    """
    Advanced pipeline for processing Baseball Savant Statcast data into
    features suitable for ML-based player projection models.
    """

    def __init__(self, config: Optional[StatcastConfig] = None):
        self.config = config or StatcastConfig()
        self.cache_dir = Path(self.config.feature_cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        # Initialize player ID mapping service
        self.player_mapping = PlayerIDMappingService()

        # Stat types we'll be predicting
        self.batting_stats = [
            "total_bases",
            "home_runs",
            "hits_runs_rbis",
            "stolen_bases",
            "singles",
            "walks",
            "hits",
            "rbi",
            "runs",
            "hitter_strikeouts",
        ]

        self.pitching_stats = [
            "pitcher_strikeouts",
            "hits_allowed",
            "walks_allowed",
            "pitching_outs",
            "earned_runs_allowed",
        ]

        logger.info(
            "🚀 StatcastDataPipeline initialized with advanced feature engineering"
        )

    async def fetch_historical_statcast_data(
        self, start_date: str, end_date: str, min_results: int = 100
    ) -> pd.DataFrame:
        """
        Fetch historical Statcast data for training models

        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            min_results: Minimum number of results required

        Returns:
            DataFrame with pitch-by-pitch Statcast data
        """
        cache_key = f"statcast_{start_date}_{end_date}.pkl"
        cache_path = self.cache_dir / cache_key

        # Check cache first
        if cache_path.exists():
            cache_age = datetime.now() - datetime.fromtimestamp(
                cache_path.stat().st_mtime
            )
            if cache_age.total_seconds() < self.config.cache_ttl_hours * 3600:
                logger.info(f"📁 Loading cached Statcast data: {cache_key}")
                return pd.read_pickle(cache_path)

        logger.info(f"🔄 Fetching fresh Statcast data: {start_date} to {end_date}")

        try:
            # Fetch data using pybaseball
            data = pyb.statcast(start_dt=start_date, end_dt=end_date)

            if len(data) < min_results:
                logger.warning(
                    f"⚠️ Only {len(data)} results found, expected at least {min_results}"
                )

            # Normalize player IDs for ML pipeline compatibility
            logger.info("🔄 Normalizing player IDs for ML pipeline")
            data = self.player_mapping.normalize_statcast_data(data)

            # Cache the results
            data.to_pickle(cache_path)
            logger.info(
                f"✅ Cached {len(data)} Statcast records with normalized player IDs"
            )

            return data

        except Exception as e:
            logger.error(f"❌ Error fetching Statcast data: {e}")
            raise

    def create_batting_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Engineer batting features from raw Statcast data

        Features include:
        - Exit velocity metrics (EV50, max EV, adjusted EV)
        - Launch angle distributions
        - Contact quality metrics
        - Plate discipline metrics
        - Expected statistics
        """
        logger.info("🔧 Engineering batting features from Statcast data")

        # Filter to batting events only
        batting_data = data[data["events"].notna()].copy()

        # Group by batter
        batter_features = []

        for batter_id, batter_data in batting_data.groupby("batter"):
            if len(batter_data) < self.config.min_plate_appearances:
                continue

            features = {
                "player_id": batter_id,
                "player_name": batter_data["player_name"].iloc[0],
                "plate_appearances": len(batter_data),
            }

            # Exit velocity features
            exit_velo = batter_data["launch_speed"].dropna()
            if len(exit_velo) > 0:
                features.update(
                    {
                        "avg_exit_velocity": exit_velo.mean(),
                        "max_exit_velocity": exit_velo.max(),
                        "ev_50": exit_velo.quantile(0.5),
                        "ev_90": exit_velo.quantile(0.9),
                        "hard_hit_rate": (exit_velo >= 95).mean(),
                    }
                )

            # Launch angle features
            launch_angles = batter_data["launch_angle"].dropna()
            if len(launch_angles) > 0:
                features.update(
                    {
                        "avg_launch_angle": launch_angles.mean(),
                        "sweet_spot_rate": (
                            (launch_angles >= 8) & (launch_angles <= 32)
                        ).mean(),
                        "ground_ball_rate": (launch_angles < 10).mean(),
                        "fly_ball_rate": (launch_angles > 25).mean(),
                    }
                )

            # Contact quality
            batted_balls = batter_data[batter_data["type"] == "X"]
            if len(batted_balls) > 0:
                features.update(
                    {
                        "barrel_rate": (batted_balls["launch_speed_angle"] == 6).mean(),
                        "solid_contact_rate": (
                            batted_balls["launch_speed_angle"] == 5
                        ).mean(),
                    }
                )

            # Expected statistics
            if "estimated_ba_using_speedangle" in batter_data.columns:
                features["expected_ba"] = batter_data[
                    "estimated_ba_using_speedangle"
                ].mean()
            if "estimated_woba_using_speedangle" in batter_data.columns:
                features["expected_woba"] = batter_data[
                    "estimated_woba_using_speedangle"
                ].mean()

            # Plate discipline
            all_pitches = data[data["batter"] == batter_id]
            if len(all_pitches) > 0:
                features.update(
                    {
                        "swing_rate": (
                            all_pitches["description"].str.contains(
                                "swing|foul", case=False, na=False
                            )
                        ).mean(),
                        "contact_rate": (all_pitches["type"] == "X").mean(),
                        "chase_rate": self._calculate_chase_rate(all_pitches),
                    }
                )

            batter_features.append(features)

        features_df = pd.DataFrame(batter_features)
        logger.info(f"✅ Created {len(features_df)} batter feature records")

        return features_df

    def create_pitching_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Engineer pitching features from raw Statcast data

        Features include:
        - Velocity and movement metrics
        - Spin rate and axis data
        - Command and control metrics
        - Contact management metrics
        """
        logger.info("🔧 Engineering pitching features from Statcast data")

        # Group by pitcher
        pitcher_features = []

        for pitcher_id, pitcher_data in data.groupby("pitcher"):
            innings_pitched = len(pitcher_data[pitcher_data["events"].notna()]) / 3
            if innings_pitched < self.config.min_innings_pitched:
                continue

            features = {
                "player_id": pitcher_id,
                "player_name": (
                    pitcher_data["player_name"].iloc[0]
                    if "player_name" in pitcher_data.columns
                    else "Unknown"
                ),
                "pitches_thrown": len(pitcher_data),
                "estimated_innings": innings_pitched,
            }

            # Velocity features
            velocity = pitcher_data["release_speed"].dropna()
            if len(velocity) > 0:
                features.update(
                    {
                        "avg_velocity": velocity.mean(),
                        "max_velocity": velocity.max(),
                        "velocity_std": velocity.std(),
                    }
                )

            # Spin rate features
            spin_rate = pitcher_data["release_spin"].dropna()
            if len(spin_rate) > 0:
                features.update(
                    {
                        "avg_spin_rate": spin_rate.mean(),
                        "spin_rate_std": spin_rate.std(),
                    }
                )

            # Movement features
            if "pfx_x" in pitcher_data.columns and "pfx_z" in pitcher_data.columns:
                features.update(
                    {
                        "avg_horizontal_movement": pitcher_data["pfx_x"].mean(),
                        "avg_vertical_movement": pitcher_data["pfx_z"].mean(),
                    }
                )

            # Command metrics
            features.update(
                {
                    "strike_rate": (pitcher_data["type"].isin(["S", "X"])).mean(),
                    "first_pitch_strike_rate": self._calculate_first_pitch_strikes(
                        pitcher_data
                    ),
                    "zone_rate": self._calculate_zone_rate(pitcher_data),
                }
            )

            # Contact management
            contact_pitches = pitcher_data[pitcher_data["type"] == "X"]
            if len(contact_pitches) > 0:
                exit_velo = contact_pitches["launch_speed"].dropna()
                if len(exit_velo) > 0:
                    features.update(
                        {
                            "avg_exit_velo_allowed": exit_velo.mean(),
                            "hard_contact_rate_allowed": (exit_velo >= 95).mean(),
                        }
                    )

            # Whiff rate
            swings = pitcher_data[
                pitcher_data["description"].str.contains("swing", case=False, na=False)
            ]
            if len(swings) > 0:
                whiffs = swings[
                    swings["description"].str.contains("miss", case=False, na=False)
                ]
                features["whiff_rate"] = len(whiffs) / len(swings)

            pitcher_features.append(features)

        features_df = pd.DataFrame(pitcher_features)
        logger.info(f"✅ Created {len(features_df)} pitcher feature records")

        return features_df

    def _calculate_chase_rate(self, pitcher_data: pd.DataFrame) -> float:
        """Calculate chase rate (swings at pitches outside the zone)"""
        try:
            # Approximate zone based on typical strike zone bounds
            outside_zone = pitcher_data[
                (pitcher_data["plate_x"].abs() > 0.83)
                | (pitcher_data["plate_z"] < 1.5)
                | (pitcher_data["plate_z"] > 3.5)
            ]

            swings_outside = outside_zone[
                outside_zone["description"].str.contains("swing", case=False, na=False)
            ]

            if len(outside_zone) > 0:
                return len(swings_outside) / len(outside_zone)
            return 0.0
        except:
            return 0.0

    def _calculate_first_pitch_strikes(self, pitcher_data: pd.DataFrame) -> float:
        """Calculate first pitch strike rate"""
        try:
            first_pitches = pitcher_data[pitcher_data["pitch_number"] == 1]
            if len(first_pitches) > 0:
                strikes = first_pitches[first_pitches["type"].isin(["S", "X"])]
                return len(strikes) / len(first_pitches)
            return 0.0
        except:
            return 0.0

    def _calculate_zone_rate(self, pitcher_data: pd.DataFrame) -> float:
        """Calculate zone rate (pitches in the strike zone)"""
        try:
            in_zone = pitcher_data[
                (pitcher_data["plate_x"].abs() <= 0.83)
                & (pitcher_data["plate_z"] >= 1.5)
                & (pitcher_data["plate_z"] <= 3.5)
            ]

            if len(pitcher_data) > 0:
                return len(in_zone) / len(pitcher_data)
            return 0.0
        except:
            return 0.0

    async def create_target_variables(
        self, start_date: str, end_date: str
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Create target variables for model training from traditional baseball stats

        Returns:
            Tuple of (batting_targets, pitching_targets) DataFrames
        """
        logger.info("🎯 Creating target variables for model training")

        try:
            # Fetch traditional stats for the same period
            year = int(start_date.split("-")[0])

            # Batting stats
            batting_stats = pyb.batting_stats(year)
            batting_targets = batting_stats[
                [
                    "IDfg",
                    "Name",
                    "Team",
                    "G",
                    "PA",
                    "AB",
                    "H",
                    "HR",
                    "RBI",
                    "R",
                    "SB",
                    "BB",
                    "SO",
                ]
            ].copy()
            batting_targets["singles"] = (
                batting_targets["H"] - batting_targets["HR"]
            )  # Simplified
            batting_targets["total_bases"] = (
                batting_targets["H"] + batting_targets["HR"] * 3
            )  # Simplified
            batting_targets["hits_runs_rbis"] = (
                batting_targets["H"] + batting_targets["R"] + batting_targets["RBI"]
            )

            # Pitching stats
            pitching_stats = pyb.pitching_stats(year)
            pitching_targets = pitching_stats[
                ["IDfg", "Name", "Team", "G", "IP", "H", "HR", "BB", "SO", "ER"]
            ].copy()
            pitching_targets["hits_allowed"] = pitching_targets["H"]
            pitching_targets["walks_allowed"] = pitching_targets["BB"]
            pitching_targets["pitcher_strikeouts"] = pitching_targets["SO"]
            pitching_targets["earned_runs_allowed"] = pitching_targets["ER"]
            pitching_targets["pitching_outs"] = pitching_targets["IP"] * 3

            logger.info(
                f"✅ Created targets for {len(batting_targets)} batters, {len(pitching_targets)} pitchers"
            )

            return batting_targets, pitching_targets

        except Exception as e:
            logger.error(f"❌ Error creating target variables: {e}")
            raise

    async def prepare_training_data(
        self, years: Optional[List[int]] = None
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Prepare complete training dataset with features and targets

        Returns:
            Tuple of (batting_features, batting_targets, pitching_features, pitching_targets)
        """
        if years is None:
            current_year = datetime.now().year
            years = list(range(current_year - self.config.training_years, current_year))

        logger.info(f"📊 Preparing training data for years: {years}")

        all_batting_features = []
        all_pitching_features = []
        all_batting_targets = []
        all_pitching_targets = []

        for year in years:
            start_date = f"{year}-03-01"
            end_date = f"{year}-10-31"

            # Fetch Statcast data
            statcast_data = await self.fetch_historical_statcast_data(
                start_date, end_date
            )

            # Create features
            batting_features = self.create_batting_features(statcast_data)
            pitching_features = self.create_pitching_features(statcast_data)

            # Create targets
            batting_targets, pitching_targets = await self.create_target_variables(
                start_date, end_date
            )

            # Add year column
            batting_features["year"] = year
            pitching_features["year"] = year
            batting_targets["year"] = year
            pitching_targets["year"] = year

            all_batting_features.append(batting_features)
            all_pitching_features.append(pitching_features)
            all_batting_targets.append(batting_targets)
            all_pitching_targets.append(pitching_targets)

        # Combine all years
        combined_batting_features = pd.concat(all_batting_features, ignore_index=True)
        combined_pitching_features = pd.concat(all_pitching_features, ignore_index=True)
        combined_batting_targets = pd.concat(all_batting_targets, ignore_index=True)
        combined_pitching_targets = pd.concat(all_pitching_targets, ignore_index=True)

        logger.info(
            f"🎉 Training data prepared: {len(combined_batting_features)} batting records, {len(combined_pitching_features)} pitching records"
        )

        return (
            combined_batting_features,
            combined_batting_targets,
            combined_pitching_features,
            combined_pitching_targets,
        )


# Example usage
if __name__ == "__main__":

    async def main():
        pipeline = StatcastDataPipeline()

        # Prepare training data for the last 3 years
        batting_features, batting_targets, pitching_features, pitching_targets = (
            await pipeline.prepare_training_data()
        )

        print(f"Batting features shape: {batting_features.shape}")
        print(f"Pitching features shape: {pitching_features.shape}")
        print(f"Batting targets shape: {batting_targets.shape}")
        print(f"Pitching targets shape: {pitching_targets.shape}")

    asyncio.run(main())
