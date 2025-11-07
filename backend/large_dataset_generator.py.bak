#!/usr/bin/env python
"""
Large Dataset Generator for Migration Testing

Generates realistic large datasets to test database migration performance
and optimization features. Simulates production-scale data volumes.
"""

import asyncio
import logging
import random
import sqlite3
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List

import pandas as pd
from faker import Faker

# Setup logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("dataset_generator")

fake = Faker()


class LargeDatasetGenerator:
    """Generates large datasets for testing migration performance"""

    def __init__(self, db_path: str = "large_test_dataset.db"):
        self.db_path = db_path
        self.sports = ["MLB", "NFL", "NBA", "NHL"]
        self.teams = {
            "MLB": ["NYY", "BOS", "LAD", "SF", "CHC", "STL", "ATL", "MIA"],
            "NFL": ["NE", "GB", "KC", "TB", "LAR", "BUF", "SF", "DAL"],
            "NBA": ["LAL", "BOS", "GSW", "MIA", "CHI", "NYK", "LAC", "PHX"],
            "NHL": ["TBL", "COL", "VGK", "CAR", "NYR", "TOR", "EDM", "FLA"],
        }

    def create_large_dataset_schema(self):
        """Create database schema for large dataset testing"""
        logger.info("🏗️ Creating large dataset schema...")

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Drop existing tables
        tables = [
            "large_matches",
            "large_bets",
            "large_odds",
            "large_statcast",
            "large_players",
        ]
        for table in tables:
            cursor.execute(f"DROP TABLE IF EXISTS {table}")

        # Create tables optimized for large datasets
        schema_commands = [
            """
            CREATE TABLE large_players (
                id INTEGER PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                sport VARCHAR(10) NOT NULL,
                team VARCHAR(10) NOT NULL,
                position VARCHAR(20),
                birth_date DATE,
                salary INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE large_matches (
                id INTEGER PRIMARY KEY,
                home_team VARCHAR(10) NOT NULL,
                away_team VARCHAR(10) NOT NULL,
                sport VARCHAR(10) NOT NULL,
                league VARCHAR(20) NOT NULL,
                season VARCHAR(10) NOT NULL,
                week INTEGER,
                start_time TIMESTAMP NOT NULL,
                home_score INTEGER,
                away_score INTEGER,
                status VARCHAR(20) DEFAULT 'completed',
                attendance INTEGER,
                weather_temp FLOAT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE large_bets (
                id INTEGER PRIMARY KEY,
                user_id VARCHAR(50) NOT NULL,
                match_id INTEGER NOT NULL,
                amount FLOAT NOT NULL,
                odds FLOAT NOT NULL,
                bet_type VARCHAR(50) NOT NULL,
                selection VARCHAR(100) NOT NULL,
                potential_winnings FLOAT NOT NULL,
                status VARCHAR(20) NOT NULL,
                placed_at TIMESTAMP NOT NULL,
                settled_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE large_odds (
                id INTEGER PRIMARY KEY,
                match_id INTEGER NOT NULL,
                bookmaker VARCHAR(50) NOT NULL,
                market_type VARCHAR(50) NOT NULL,
                selection VARCHAR(100) NOT NULL,
                odds FLOAT NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                is_active BOOLEAN DEFAULT 1
            )
            """,
            """
            CREATE TABLE large_statcast (
                id INTEGER PRIMARY KEY,
                game_id INTEGER NOT NULL,
                player_id INTEGER NOT NULL,
                pitch_number INTEGER NOT NULL,
                inning INTEGER NOT NULL,
                balls INTEGER NOT NULL,
                strikes INTEGER NOT NULL,
                outs INTEGER NOT NULL,
                pitch_type VARCHAR(10),
                release_speed FLOAT,
                spin_rate FLOAT,
                launch_speed FLOAT,
                launch_angle FLOAT,
                hit_distance FLOAT,
                events VARCHAR(50),
                description TEXT,
                game_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
        ]

        for command in schema_commands:
            cursor.execute(command)

        # Create indexes separately for better performance
        index_commands = [
            "CREATE INDEX idx_players_sport_team ON large_players(sport, team)",
            "CREATE INDEX idx_matches_sport_season ON large_matches(sport, season)",
            "CREATE INDEX idx_matches_start_time ON large_matches(start_time)",
            "CREATE INDEX idx_bets_user_id ON large_bets(user_id)",
            "CREATE INDEX idx_bets_match_id ON large_bets(match_id)",
            "CREATE INDEX idx_bets_placed_at ON large_bets(placed_at)",
            "CREATE INDEX idx_odds_match_market ON large_odds(match_id, market_type)",
            "CREATE INDEX idx_odds_bookmaker ON large_odds(bookmaker)",
            "CREATE INDEX idx_odds_updated_at ON large_odds(updated_at)",
            "CREATE INDEX idx_statcast_game_player ON large_statcast(game_id, player_id)",
            "CREATE INDEX idx_statcast_game_date ON large_statcast(game_date)",
            "CREATE INDEX idx_statcast_events ON large_statcast(events)",
        ]

        for index_cmd in index_commands:
            cursor.execute(index_cmd)

        conn.commit()
        conn.close()
        logger.info("✅ Large dataset schema created successfully")

    def generate_players(self, count: int = 10000) -> List[Dict[str, Any]]:
        """Generate player data"""
        logger.info(f"👥 Generating {count:,} players...")

        players = []
        positions = {
            "MLB": ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"],
            "NFL": ["QB", "RB", "WR", "TE", "OL", "DL", "LB", "CB", "S", "K"],
            "NBA": ["PG", "SG", "SF", "PF", "C"],
            "NHL": ["G", "D", "LW", "C", "RW"],
        }

        for i in range(count):
            sport = random.choice(self.sports)
            team = random.choice(self.teams[sport])

            player = {
                "name": fake.name(),
                "sport": sport,
                "team": team,
                "position": random.choice(positions[sport]),
                "birth_date": fake.date_between(start_date="-45y", end_date="-18y"),
                "salary": random.randint(500000, 50000000),
                "created_at": fake.date_time_between(start_date="-2y", end_date="now"),
            }
            players.append(player)

            if (i + 1) % 1000 == 0:
                logger.info(f"   Generated {i+1:,} players...")

        return players

    def generate_matches(self, count: int = 50000) -> List[Dict[str, Any]]:
        """Generate match data"""
        logger.info(f"⚽ Generating {count:,} matches...")

        matches = []
        seasons = ["2022", "2023", "2024", "2025"]
        statuses = ["completed", "in_progress", "scheduled", "postponed"]

        for i in range(count):
            sport = random.choice(self.sports)
            sport_teams = self.teams[sport]
            home_team = random.choice(sport_teams)
            away_team = random.choice([t for t in sport_teams if t != home_team])

            start_time = fake.date_time_between(start_date="-2y", end_date="+1y")
            status = random.choice(statuses)

            match = {
                "home_team": home_team,
                "away_team": away_team,
                "sport": sport,
                "league": sport,
                "season": random.choice(seasons),
                "week": random.randint(1, 20) if sport in ["NFL"] else None,
                "start_time": start_time,
                "home_score": random.randint(0, 150) if status == "completed" else None,
                "away_score": random.randint(0, 150) if status == "completed" else None,
                "status": status,
                "attendance": (
                    random.randint(10000, 80000) if status == "completed" else None
                ),
                "weather_temp": (
                    random.uniform(32, 95) if sport in ["MLB", "NFL"] else None
                ),
                "created_at": fake.date_time_between(start_date="-2y", end_date="now"),
            }
            matches.append(match)

            if (i + 1) % 5000 == 0:
                logger.info(f"   Generated {i+1:,} matches...")

        return matches

    def generate_bets(
        self, count: int = 500000, max_match_id: int = 50000
    ) -> List[Dict[str, Any]]:
        """Generate betting data"""
        logger.info(f"💰 Generating {count:,} bets...")

        bets = []
        bet_types = ["moneyline", "spread", "total", "player_props", "team_props"]
        bet_statuses = ["pending", "won", "lost", "void", "cashout"]

        # Generate some user IDs
        user_ids = [fake.uuid4() for _ in range(10000)]

        for i in range(count):
            amount = random.uniform(10, 1000)
            odds = random.uniform(1.5, 10.0)
            placed_at = fake.date_time_between(start_date="-1y", end_date="now")
            status = random.choice(bet_statuses)

            bet = {
                "user_id": random.choice(user_ids),
                "match_id": random.randint(1, max_match_id),
                "amount": round(amount, 2),
                "odds": round(odds, 2),
                "bet_type": random.choice(bet_types),
                "selection": fake.sentence(nb_words=3),
                "potential_winnings": round(amount * odds, 2),
                "status": status,
                "placed_at": placed_at,
                "settled_at": (
                    placed_at + timedelta(hours=random.randint(1, 72))
                    if status in ["won", "lost"]
                    else None
                ),
                "created_at": placed_at,
            }
            bets.append(bet)

            if (i + 1) % 25000 == 0:
                logger.info(f"   Generated {i+1:,} bets...")

        return bets

    def generate_statcast_data(
        self, count: int = 2000000, max_game_id: int = 50000, max_player_id: int = 10000
    ) -> List[Dict[str, Any]]:
        """Generate Statcast-style data (largest dataset)"""
        logger.info(f"⚾ Generating {count:,} Statcast records...")

        statcast_data = []
        pitch_types = ["FF", "SL", "CH", "CU", "SI", "FC", "FS", "KN"]
        events = [
            "single",
            "double",
            "triple",
            "home_run",
            "strikeout",
            "walk",
            "hit_by_pitch",
            "field_out",
            "force_out",
            "grounded_into_double_play",
        ]

        for i in range(count):
            game_date = fake.date_between(start_date="-2y", end_date="now")

            record = {
                "game_id": random.randint(1, max_game_id),
                "player_id": random.randint(1, max_player_id),
                "pitch_number": random.randint(1, 150),
                "inning": random.randint(1, 12),
                "balls": random.randint(0, 3),
                "strikes": random.randint(0, 2),
                "outs": random.randint(0, 2),
                "pitch_type": random.choice(pitch_types),
                "release_speed": random.uniform(70, 105),
                "spin_rate": random.uniform(1500, 3000),
                "launch_speed": (
                    random.uniform(60, 120) if random.random() > 0.3 else None
                ),
                "launch_angle": (
                    random.uniform(-50, 50) if random.random() > 0.3 else None
                ),
                "hit_distance": (
                    random.uniform(50, 500) if random.random() > 0.7 else None
                ),
                "events": random.choice(events) if random.random() > 0.5 else None,
                "description": fake.sentence(nb_words=8),
                "game_date": game_date,
                "created_at": fake.date_time_between(
                    start_date=game_date, end_date="now"
                ),
            }
            statcast_data.append(record)

            if (i + 1) % 100000 == 0:
                logger.info(f"   Generated {i+1:,} Statcast records...")

        return statcast_data

    def insert_data_batch(
        self, table_name: str, data: List[Dict[str, Any]], batch_size: int = 10000
    ):
        """Insert data in batches for better performance"""
        logger.info(
            f"📝 Inserting {len(data):,} records into {table_name} (batch size: {batch_size:,})..."
        )

        conn = sqlite3.connect(self.db_path)

        # Get column names from first record
        if not data:
            return

        columns = list(data[0].keys())
        placeholders = ", ".join(["?" for _ in columns])
        query = (
            f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"
        )

        total_batches = (len(data) + batch_size - 1) // batch_size

        for batch_num in range(total_batches):
            start_idx = batch_num * batch_size
            end_idx = min(start_idx + batch_size, len(data))
            batch_data = data[start_idx:end_idx]

            # Convert to tuples for executemany
            batch_tuples = [
                tuple(record[col] for col in columns) for record in batch_data
            ]

            conn.executemany(query, batch_tuples)
            conn.commit()

            logger.info(
                f"   Batch {batch_num + 1}/{total_batches} inserted ({end_idx:,}/{len(data):,} records)"
            )

        conn.close()
        logger.info(f"✅ Successfully inserted {len(data):,} records into {table_name}")

    async def generate_complete_large_dataset(self, scale: str = "medium"):
        """Generate a complete large dataset for testing"""
        scales = {
            "small": {
                "players": 1000,
                "matches": 5000,
                "bets": 50000,
                "statcast": 200000,
            },
            "medium": {
                "players": 10000,
                "matches": 50000,
                "bets": 500000,
                "statcast": 2000000,
            },
            "large": {
                "players": 50000,
                "matches": 200000,
                "bets": 2000000,
                "statcast": 10000000,
            },
            "xlarge": {
                "players": 100000,
                "matches": 500000,
                "bets": 5000000,
                "statcast": 50000000,
            },
        }

        if scale not in scales:
            raise ValueError(f"Scale must be one of: {list(scales.keys())}")

        config = scales[scale]

        logger.info(f"🚀 Generating {scale} dataset...")
        logger.info(f"   Players: {config['players']:,}")
        logger.info(f"   Matches: {config['matches']:,}")
        logger.info(f"   Bets: {config['bets']:,}")
        logger.info(f"   Statcast: {config['statcast']:,}")
        logger.info(f"   Total Records: {sum(config.values()):,}")

        start_time = time.time()

        # Create schema
        self.create_large_dataset_schema()

        # Generate and insert data
        players = self.generate_players(config["players"])
        self.insert_data_batch("large_players", players)

        matches = self.generate_matches(config["matches"])
        self.insert_data_batch("large_matches", matches)

        bets = self.generate_bets(config["bets"], config["matches"])
        self.insert_data_batch("large_bets", bets)

        # Generate odds data
        logger.info("📊 Generating odds data...")
        odds_data = []
        bookmakers = ["DraftKings", "FanDuel", "BetMGM", "Caesars", "PointsBet"]
        markets = ["moneyline", "spread", "total", "player_props"]

        for match_id in range(
            1, min(config["matches"] // 10, 5000)
        ):  # Odds for subset of matches
            for bookmaker in bookmakers:
                for market in markets:
                    for selection in ["home", "away", "over", "under"]:
                        odds_data.append(
                            {
                                "match_id": match_id,
                                "bookmaker": bookmaker,
                                "market_type": market,
                                "selection": selection,
                                "odds": random.uniform(1.5, 5.0),
                                "updated_at": fake.date_time_between(
                                    start_date="-1d", end_date="now"
                                ),
                                "is_active": random.choice([True, False]),
                            }
                        )

        self.insert_data_batch("large_odds", odds_data)

        # Generate Statcast data (largest dataset)
        statcast_data = self.generate_statcast_data(
            config["statcast"], config["matches"], config["players"]
        )
        self.insert_data_batch(
            "large_statcast", statcast_data, batch_size=50000
        )  # Larger batches for performance

        end_time = time.time()
        duration = end_time - start_time

        # Get final statistics
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        total_records = 0
        logger.info("\n📊 Dataset Generation Complete!")
        logger.info("=" * 50)

        for table in [
            "large_players",
            "large_matches",
            "large_bets",
            "large_odds",
            "large_statcast",
        ]:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            total_records += count
            logger.info(f"{table}: {count:,} records")

        conn.close()

        logger.info(f"Total Records: {total_records:,}")
        logger.info(f"Generation Time: {duration:.1f} seconds")
        logger.info(f"Records/Second: {total_records/duration:,.0f}")
        logger.info(f"Database Size: {self.get_database_size():.1f} MB")

        return {
            "total_records": total_records,
            "generation_time": duration,
            "records_per_second": total_records / duration,
            "database_size_mb": self.get_database_size(),
        }

    def get_database_size(self) -> float:
        """Get database file size in MB"""
        import os

        if os.path.exists(self.db_path):
            return os.path.getsize(self.db_path) / (1024 * 1024)
        return 0.0


async def main():
    """Generate large test datasets"""
    generator = LargeDatasetGenerator()

    # Generate medium dataset by default
    await generator.generate_complete_large_dataset("medium")


if __name__ == "__main__":
    asyncio.run(main())
