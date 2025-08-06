#!/usr/bin/env python3
"""
Player ID Mapping Service

This service resolves player identification issues between different data sources:
- Statcast data (Baseball Savant) uses 'batter' and 'pitcher' fields with MLB IDs
- Our ML pipeline expects 'player_id' field
- Betting sites use various player name formats

This creates a unified mapping system for player identification across all data sources.
"""

import logging
import re
from typing import Dict, List, Optional, Tuple, Union

import pandas as pd
import pybaseball as pyb

logger = logging.getLogger("player_id_mapping")


class PlayerIDMappingService:
    """
    Service to handle player ID mapping and normalization across different data sources
    """

    def __init__(self):
        # Cache for player lookups to avoid repeated API calls
        self.player_cache: Dict[str, Dict] = {}
        self.name_cache: Dict[str, int] = {}

        # Common name variations and normalizations
        self.name_normalizations = {
            "Jr.": "Jr",
            "Sr.": "Sr",
            "III": "3rd",
            "II": "2nd",
        }

        logger.info("🆔 PlayerIDMappingService initialized")

    def normalize_statcast_data(self, statcast_data: pd.DataFrame) -> pd.DataFrame:
        """
        Normalize Statcast data to include player_id column expected by ML pipeline

        Args:
            statcast_data: Raw Statcast DataFrame with 'batter' and 'pitcher' columns

        Returns:
            DataFrame with normalized player_id column
        """
        logger.info(f"📊 Normalizing Statcast data: {len(statcast_data)} records")

        try:
            # Create a copy to avoid modifying original data
            normalized_data = statcast_data.copy()

            # Check if we have the expected Statcast columns
            if (
                "batter" not in normalized_data.columns
                and "pitcher" not in normalized_data.columns
            ):
                logger.warning(
                    "⚠️ No 'batter' or 'pitcher' columns found in Statcast data"
                )
                return normalized_data

            # For batting events, use batter ID as player_id
            if "batter" in normalized_data.columns:
                # Create batting records with player_id from batter column
                batting_data = normalized_data[normalized_data["batter"].notna()].copy()
                batting_data["player_id"] = batting_data["batter"].astype(int)
                batting_data["player_type"] = "batter"

                logger.info(
                    f"✅ Created {len(batting_data)} batting records with player_id"
                )
            else:
                batting_data = pd.DataFrame()

            # For pitching events, use pitcher ID as player_id
            if "pitcher" in normalized_data.columns:
                # Create pitching records with player_id from pitcher column
                pitching_data = normalized_data[
                    normalized_data["pitcher"].notna()
                ].copy()
                pitching_data["player_id"] = pitching_data["pitcher"].astype(int)
                pitching_data["player_type"] = "pitcher"

                logger.info(
                    f"✅ Created {len(pitching_data)} pitching records with player_id"
                )
            else:
                pitching_data = pd.DataFrame()

            # Combine batting and pitching data
            if len(batting_data) > 0 and len(pitching_data) > 0:
                # For events that have both batter and pitcher, we'll create two records
                # This allows us to analyze both batting and pitching performance
                combined_data = pd.concat(
                    [batting_data, pitching_data], ignore_index=True
                )
            elif len(batting_data) > 0:
                combined_data = batting_data
            elif len(pitching_data) > 0:
                combined_data = pitching_data
            else:
                logger.warning("⚠️ No valid batter or pitcher data found")
                return normalized_data

            logger.info(
                f"✅ Normalized Statcast data: {len(combined_data)} total records"
            )
            return combined_data

        except Exception as e:
            logger.error(f"❌ Failed to normalize Statcast data: {e}")
            return statcast_data

    def get_player_id_from_name(self, player_name: str) -> Optional[int]:
        """
        Get MLB player ID from player name using pybaseball lookup

        Args:
            player_name: Player name in "First Last" format

        Returns:
            MLB player ID or None if not found
        """
        if not player_name or pd.isna(player_name):
            return None

        # Check cache first
        if player_name in self.name_cache:
            return self.name_cache[player_name]

        try:
            # Parse name into first and last
            name_parts = player_name.strip().split()
            if len(name_parts) < 2:
                logger.warning(f"⚠️ Invalid name format: {player_name}")
                return None

            first_name = name_parts[0]
            last_name = " ".join(name_parts[1:])  # Handle names like "Van Der Berg"

            # Use pybaseball to lookup player
            players = pyb.playerid_lookup(last_name, first_name)

            if len(players) > 0:
                # Get the most recent player (highest key_mlbam)
                player_id = int(players.iloc[0]["key_mlbam"])
                self.name_cache[player_name] = player_id

                logger.info(f"✅ Found player ID for {player_name}: {player_id}")
                return player_id
            else:
                logger.warning(f"⚠️ No player found for: {player_name}")
                self.name_cache[player_name] = None
                return None

        except Exception as e:
            logger.error(f"❌ Error looking up player {player_name}: {e}")
            self.name_cache[player_name] = None
            return None

    def create_unified_player_mapping(
        self, data_sources: List[pd.DataFrame]
    ) -> pd.DataFrame:
        """
        Create a unified player mapping table from multiple data sources

        Args:
            data_sources: List of DataFrames from different sources

        Returns:
            Unified player mapping DataFrame
        """
        logger.info("🔗 Creating unified player mapping from multiple sources")

        all_players = []

        for i, source_data in enumerate(data_sources):
            logger.info(f"📊 Processing data source {i+1}: {len(source_data)} records")

            # Extract unique players from this source
            unique_players = set()

            # Check for different player identifier columns
            for col in [
                "player_name",
                "batter_name",
                "pitcher_name",
                "player_id",
                "batter",
                "pitcher",
            ]:
                if col in source_data.columns:
                    unique_values = source_data[col].dropna().unique()
                    for value in unique_values:
                        if isinstance(value, str):
                            unique_players.add(value)
                        elif isinstance(value, (int, float)) and not pd.isna(value):
                            unique_players.add(int(value))

            logger.info(
                f"✅ Found {len(unique_players)} unique players in source {i+1}"
            )
            all_players.extend(unique_players)

        # Create mapping DataFrame
        unique_all_players = list(set(all_players))
        mapping_data = []

        for player in unique_all_players:
            if isinstance(player, str):
                # Player name - lookup ID
                player_id = self.get_player_id_from_name(player)
                mapping_data.append(
                    {
                        "player_name": player,
                        "player_id": player_id,
                        "source_type": "name",
                    }
                )
            elif isinstance(player, int):
                # Player ID - reverse lookup name if needed
                mapping_data.append(
                    {
                        "player_name": None,  # Could add reverse lookup later
                        "player_id": player,
                        "source_type": "id",
                    }
                )

        mapping_df = pd.DataFrame(mapping_data)
        logger.info(f"✅ Created unified player mapping: {len(mapping_df)} entries")

        return mapping_df

    def validate_player_data_quality(self, data: pd.DataFrame) -> Dict[str, any]:
        """
        Validate the quality of player data for ML training

        Args:
            data: DataFrame with player data

        Returns:
            Quality metrics dictionary
        """
        logger.info("🔍 Validating player data quality")

        metrics = {
            "total_records": len(data),
            "unique_players": 0,
            "missing_player_ids": 0,
            "missing_player_names": 0,
            "data_quality_score": 0.0,
            "recommendations": [],
        }

        if "player_id" in data.columns:
            valid_player_ids = data["player_id"].dropna()
            metrics["unique_players"] = len(valid_player_ids.unique())
            metrics["missing_player_ids"] = len(data) - len(valid_player_ids)

        if "player_name" in data.columns:
            valid_player_names = data["player_name"].dropna()
            metrics["missing_player_names"] = len(data) - len(valid_player_names)

        # Calculate quality score
        if metrics["total_records"] > 0:
            id_quality = 1 - (metrics["missing_player_ids"] / metrics["total_records"])
            name_quality = (
                1 - (metrics["missing_player_names"] / metrics["total_records"])
                if "player_name" in data.columns
                else 1.0
            )
            metrics["data_quality_score"] = (id_quality + name_quality) / 2

        # Generate recommendations
        if metrics["missing_player_ids"] > 0:
            metrics["recommendations"].append(
                f"Fix {metrics['missing_player_ids']} missing player IDs"
            )

        if metrics["data_quality_score"] < 0.8:
            metrics["recommendations"].append(
                "Data quality is below 80% - consider data cleaning"
            )

        logger.info(
            f"✅ Data quality analysis complete: {metrics['data_quality_score']:.2%} quality score"
        )

        return metrics


def main():
    """Test the player ID mapping service"""
    print("🚀 Testing Player ID Mapping Service")
    print("=" * 50)

    # Initialize service
    mapping_service = PlayerIDMappingService()

    # Test with sample Statcast-like data
    sample_data = pd.DataFrame(
        {
            "batter": [
                545361,
                592450,
                458015,
            ],  # Mike Trout, Rafael Devers, Albert Pujols
            "pitcher": [
                434378,
                608379,
                592789,
            ],  # Clayton Kershaw, Carlos Rodon, Luis Castillo
            "events": ["home_run", "single", "strikeout"],
            "launch_speed": [105.2, 98.1, None],
            "launch_angle": [28.0, 15.0, None],
        }
    )

    print("📊 Sample Statcast data:")
    print(sample_data.head())

    # Test normalization
    normalized_data = mapping_service.normalize_statcast_data(sample_data)
    print(f"\n✅ Normalized data: {len(normalized_data)} records")
    print(normalized_data[["player_id", "player_type", "events"]].head())

    # Test player name lookup
    test_names = ["Mike Trout", "Rafael Devers", "Albert Pujols"]
    print(f"\n🔍 Testing player name lookups:")
    for name in test_names:
        player_id = mapping_service.get_player_id_from_name(name)
        print(f"  {name}: {player_id}")

    # Test data quality validation
    quality_metrics = mapping_service.validate_player_data_quality(normalized_data)
    print(f"\n📈 Data Quality Metrics:")
    print(f"  Total records: {quality_metrics['total_records']}")
    print(f"  Unique players: {quality_metrics['unique_players']}")
    print(f"  Quality score: {quality_metrics['data_quality_score']:.2%}")

    if quality_metrics["recommendations"]:
        print("  Recommendations:")
        for rec in quality_metrics["recommendations"]:
            print(f"    • {rec}")

    print("\n🎉 Player ID Mapping Service test complete!")


if __name__ == "__main__":
    main()
