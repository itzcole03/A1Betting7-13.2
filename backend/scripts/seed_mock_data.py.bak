#!/usr/bin/env python3
"""
Mock Data Seeding CLI Tool
Generates comprehensive mock data for demo and offline mode
"""

import argparse
import json
import os
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any
import asyncio

# Mock data generators
class MockDataGenerator:
    """Comprehensive mock data generator for all A1Betting features"""
    
    def __init__(self):
        self.players = [
            {"name": "Aaron Judge", "team": "NYY", "position": "OF"},
            {"name": "Mookie Betts", "team": "LAD", "position": "OF"},
            {"name": "Ronald Acuna Jr.", "team": "ATL", "position": "OF"},
            {"name": "Vladimir Guerrero Jr.", "team": "TOR", "position": "1B"},
            {"name": "Juan Soto", "team": "SD", "position": "OF"},
            {"name": "Shohei Ohtani", "team": "LAA", "position": "DH"},
            {"name": "Fernando Tatis Jr.", "team": "SD", "position": "SS"},
            {"name": "Mike Trout", "team": "LAA", "position": "OF"},
            {"name": "Freddie Freeman", "team": "LAD", "position": "1B"},
            {"name": "Rafael Devers", "team": "BOS", "position": "3B"}
        ]
        
        self.teams = [
            "NYY", "LAD", "ATL", "TOR", "SD", "LAA", "BOS", "HOU", "TB", "SF",
            "NYM", "PHI", "STL", "MIL", "CHC", "CIN", "PIT", "WAS", "MIA", "COL",
            "ARI", "TEX", "SEA", "OAK", "MIN", "CLE", "DET", "CWS", "KC", "BAL"
        ]
        
        self.stat_types = ["hits", "home_runs", "rbis", "total_bases", "runs_scored", "strikeouts", "walks"]
        
        self.books = [
            {"id": "draftkings", "name": "DraftKings"},
            {"id": "fanduel", "name": "FanDuel"},
            {"id": "betmgm", "name": "BetMGM"},
            {"id": "caesars", "name": "Caesars"},
            {"id": "pointsbet", "name": "PointsBet"},
            {"id": "barstool", "name": "Barstool"},
            {"id": "unibet", "name": "Unibet"},
            {"id": "foxbet", "name": "FOX Bet"}
        ]
    
    def generate_players(self, count: int = 50) -> List[Dict[str, Any]]:
        """Generate detailed player data"""
        players_data = []
        
        for i, base_player in enumerate(self.players[:count]):
            # Generate season stats
            base_avg = random.uniform(0.240, 0.320)
            games_played = random.randint(140, 162)
            at_bats = games_played * random.randint(3, 5)
            
            hits = int(at_bats * base_avg)
            home_runs = random.randint(15, 45)
            rbis = random.randint(60, 120)
            runs = random.randint(70, 130)
            doubles = random.randint(25, 45)
            triples = random.randint(0, 8)
            stolen_bases = random.randint(5, 30)
            walks = random.randint(40, 100)
            strikeouts = random.randint(80, 180)
            
            # Generate recent games
            recent_games = []
            for j in range(15):
                game_date = datetime.now() - timedelta(days=j+1)
                game_hits = max(0, int(random.gauss(base_avg * 4, 1.2)))
                game_hrs = 1 if random.random() < 0.15 else 0
                game_rbis = random.randint(0, 4) if game_hits > 0 or game_hrs > 0 else 0
                
                recent_games.append({
                    "date": game_date.isoformat(),
                    "opponent": random.choice([t for t in self.teams if t != base_player["team"]]),
                    "home": random.choice([True, False]),
                    "result": random.choice(["W", "L"]),
                    "stats": {
                        "hits": game_hits,
                        "home_runs": game_hrs,
                        "rbis": game_rbis,
                        "at_bats": 4,
                        "runs": 1 if game_hits > 1 or game_hrs > 0 else 0
                    }
                })
            
            # Calculate advanced metrics
            on_base_pct = (hits + walks) / (at_bats + walks) if (at_bats + walks) > 0 else 0
            slugging_pct = (hits + doubles + 2*triples + 3*home_runs) / at_bats if at_bats > 0 else 0
            ops = on_base_pct + slugging_pct
            
            player_data = {
                "id": f"player_{i+1}",
                "name": base_player["name"],
                "team": base_player["team"],
                "position": base_player["position"],
                "sport": "MLB",
                "active": True,
                "injury_status": random.choice([None, None, None, "Day-to-day", "Questionable"]),
                
                "season_stats": {
                    "games_played": games_played,
                    "at_bats": at_bats,
                    "hits": hits,
                    "home_runs": home_runs,
                    "rbis": rbis,
                    "runs": runs,
                    "doubles": doubles,
                    "triples": triples,
                    "stolen_bases": stolen_bases,
                    "walks": walks,
                    "strikeouts": strikeouts,
                    "batting_average": round(base_avg, 3),
                    "on_base_percentage": round(on_base_pct, 3),
                    "slugging_percentage": round(slugging_pct, 3),
                    "ops": round(ops, 3),
                    "plate_appearances": at_bats + walks,
                    
                    # Advanced stats
                    "war": round(random.uniform(1.0, 8.0), 1),
                    "babip": round(random.uniform(0.280, 0.380), 3),
                    "wrc_plus": random.randint(85, 175),
                    "barrel_rate": round(random.uniform(5.0, 20.0), 1),
                    "hard_hit_rate": round(random.uniform(35.0, 55.0), 1),
                    "exit_velocity": round(random.uniform(87.0, 95.0), 1),
                    "launch_angle": round(random.uniform(8.0, 18.0), 1)
                },
                
                "recent_games": recent_games,
                "last_30_games": recent_games,  # Simplified for mock data
                
                "performance_trends": {
                    "last_7_days": {"batting_average": round(random.uniform(0.200, 0.400), 3)},
                    "last_30_days": {"batting_average": round(random.uniform(0.220, 0.350), 3)},
                    "home_vs_away": {
                        "home": {"batting_average": round(random.uniform(0.220, 0.350), 3)},
                        "away": {"batting_average": round(random.uniform(0.220, 0.350), 3)}
                    },
                    "vs_lefties": {"batting_average": round(random.uniform(0.200, 0.350), 3)},
                    "vs_righties": {"batting_average": round(random.uniform(0.220, 0.330), 3)}
                },
                
                "advanced_metrics": {
                    "consistency_score": round(random.uniform(0.6, 0.9), 2),
                    "clutch_performance": round(random.uniform(0.5, 1.2), 2),
                    "injury_risk": round(random.uniform(0.1, 0.4), 2),
                    "hot_streak": random.choice([True, False]),
                    "cold_streak": random.choice([True, False]),
                    "breakout_candidate": random.choice([True, False])
                },
                
                "projections": {
                    "next_game": {
                        "hits": round(random.uniform(0.5, 2.5), 1),
                        "home_runs": round(random.uniform(0.1, 0.4), 2),
                        "rbis": round(random.uniform(0.3, 1.8), 1)
                    },
                    "rest_of_season": {
                        "batting_average": round(random.uniform(0.240, 0.320), 3),
                        "home_runs": random.randint(5, 15),
                        "rbis": random.randint(20, 40)
                    },
                    "confidence_intervals": {
                        "low": {"batting_average": round(random.uniform(0.220, 0.280), 3)},
                        "high": {"batting_average": round(random.uniform(0.300, 0.360), 3)}
                    }
                },
                
                "next_game": {
                    "date": (datetime.now() + timedelta(days=1)).isoformat(),
                    "opponent": random.choice([t for t in self.teams if t != base_player["team"]]),
                    "matchup_difficulty": random.choice(["easy", "medium", "hard"])
                }
            }
            
            players_data.append(player_data)
        
        return players_data
    
    def generate_games(self, count: int = 20) -> List[Dict[str, Any]]:
        """Generate today's and upcoming games"""
        games = []
        
        for i in range(count):
            home_team = random.choice(self.teams)
            away_team = random.choice([t for t in self.teams if t != home_team])
            game_date = datetime.now() + timedelta(days=random.randint(0, 3))
            
            game = {
                "id": f"game_{i+1}",
                "home_team": home_team,
                "away_team": away_team,
                "date": game_date.isoformat(),
                "time": f"{random.randint(1, 10)}:{random.choice(['00', '30'])} PM",
                "venue": f"{home_team} Stadium",
                "status": random.choice(["scheduled", "live", "final"]),
                "inning": random.randint(1, 9) if random.choice([True, False]) else None,
                "home_score": random.randint(0, 12) if random.choice([True, False]) else None,
                "away_score": random.randint(0, 12) if random.choice([True, False]) else None,
                "weather": {
                    "temperature": random.randint(65, 85),
                    "condition": random.choice(["Clear", "Cloudy", "Light Rain", "Partly Cloudy"]),
                    "wind_speed": random.randint(0, 15),
                    "humidity": random.randint(40, 80)
                }
            }
            
            games.append(game)
        
        return games
    
    def generate_odds_data(self, count: int = 100) -> List[Dict[str, Any]]:
        """Generate mock odds data for multiple books"""
        odds_data = []
        
        for i in range(count):
            player = random.choice(self.players)
            stat_type = random.choice(self.stat_types)
            base_line = random.uniform(0.5, 3.5)
            
            for book in self.books:
                # Add some variance between books
                line_variance = random.uniform(-0.2, 0.2)
                book_line = max(0.5, base_line + line_variance)
                
                # Generate realistic odds
                over_odds = random.randint(-130, -100)
                under_odds = random.randint(-130, -100)
                
                odds_entry = {
                    "book_id": book["id"],
                    "book_name": book["name"],
                    "market": f"{player['team']} vs TBD",
                    "player_name": player["name"],
                    "stat_type": stat_type,
                    "line": round(book_line, 1),
                    "over_price": over_odds,
                    "under_price": under_odds,
                    "timestamp": datetime.now().isoformat(),
                    "last_updated": datetime.now().isoformat()
                }
                
                odds_data.append(odds_entry)
        
        return odds_data
    
    def generate_prop_opportunities(self, count: int = 50) -> List[Dict[str, Any]]:
        """Generate cheatsheet prop opportunities"""
        opportunities = []
        
        for i in range(count):
            player = random.choice(self.players)
            stat_type = random.choice(self.stat_types)
            
            opportunity = {
                "id": f"opp_{i+1}",
                "player_name": player["name"],
                "stat_type": stat_type,
                "line": round(random.uniform(0.5, 3.5), 1),
                "recommended_side": random.choice(["over", "under"]),
                "edge_percentage": round(random.uniform(0.5, 8.0), 2),
                "confidence": round(random.uniform(60.0, 95.0), 1),
                "best_odds": random.randint(-130, -100),
                "best_book": random.choice(self.books)["name"],
                "fair_price": round(random.uniform(0.4, 0.6), 3),
                "implied_probability": round(random.uniform(0.45, 0.55), 3),
                "recent_performance": f"{random.randint(3, 8)} of last 10 games over",
                "sample_size": random.randint(10, 30),
                "last_updated": datetime.now().isoformat(),
                "sport": "MLB",
                "team": player["team"],
                "opponent": random.choice([t for t in self.teams if t != player["team"]]),
                "venue": random.choice(["home", "away"]),
                "market_efficiency": round(random.uniform(0.3, 0.8), 3),
                "volatility_score": round(random.uniform(0.2, 0.7), 3),
                "trend_direction": random.choice(["bullish", "bearish", "neutral"])
            }
            
            opportunities.append(opportunity)
        
        return opportunities
    
    def generate_arbitrage_opportunities(self, count: int = 10) -> List[Dict[str, Any]]:
        """Generate arbitrage opportunities"""
        arbitrage_ops = []
        
        for i in range(count):
            player = random.choice(self.players)
            stat_type = random.choice(self.stat_types)
            line = round(random.uniform(1.0, 3.0), 1)
            
            # Generate profitable arbitrage scenario
            over_book = random.choice(self.books)
            under_book = random.choice([b for b in self.books if b["id"] != over_book["id"]])
            
            over_odds = random.randint(-105, -90)  # Favorable over odds
            under_odds = random.randint(-105, -90)  # Favorable under odds
            
            # Calculate implied probabilities
            over_prob = abs(over_odds) / (abs(over_odds) + 100)
            under_prob = abs(under_odds) / (abs(under_odds) + 100)
            total_prob = over_prob + under_prob
            
            if total_prob < 1.0:  # Arbitrage exists
                profit_pct = (1 - total_prob) * 100
                
                arbitrage_op = {
                    "market": f"{player['team']} vs TBD",
                    "player_name": player["name"],
                    "stat_type": stat_type,
                    "over_book": over_book["name"],
                    "over_price": over_odds,
                    "over_line": line,
                    "under_book": under_book["name"],
                    "under_price": under_odds,
                    "under_line": line,
                    "profit_percentage": round(profit_pct, 2),
                    "stake_distribution": {
                        "over": round(under_prob * 100, 2),
                        "under": round(over_prob * 100, 2)
                    },
                    "timestamp": datetime.now().isoformat()
                }
                
                arbitrage_ops.append(arbitrage_op)
        
        return arbitrage_ops
    
    def generate_ai_explanations(self, count: int = 20) -> List[Dict[str, Any]]:
        """Generate sample AI explanations for caching"""
        explanations = []
        
        explanation_templates = [
            "Based on recent performance trends, {player} has shown strong consistency in {stat_type}. Over the last 10 games, they've averaged {avg} per game, which suggests the {line} line offers value on the {side}.",
            
            "{player}'s performance against {opponent_type} pitching historically favors the {side} of {line} {stat_type}. Key factors include their {split_stat} average and recent form trending {direction}.",
            
            "Weather conditions and venue factors support taking the {side} on {player}'s {stat_type} line. The projected {weather} at {venue} typically benefits {position} players in this statistical category.",
            
            "Statistical analysis reveals {player} has exceeded {line} {stat_type} in {frequency} of their last {games} games. The {confidence}% confidence interval suggests profitable expectation on the {side}."
        ]
        
        for i in range(count):
            player = random.choice(self.players)
            stat_type = random.choice(self.stat_types)
            line = round(random.uniform(0.5, 3.5), 1)
            side = random.choice(["over", "under"])
            
            template = random.choice(explanation_templates)
            explanation_text = template.format(
                player=player["name"],
                stat_type=stat_type.replace("_", " "),
                line=line,
                side=side,
                avg=round(random.uniform(0.8, 2.2), 1),
                opponent_type=random.choice(["left-handed", "right-handed"]),
                split_stat=round(random.uniform(0.240, 0.320), 3),
                direction=random.choice(["upward", "downward", "stable"]),
                weather=random.choice(["clear conditions", "light wind", "mild temperature"]),
                venue=f"{player['team']} Stadium",
                position=player["position"],
                frequency=f"{random.randint(6, 9)}",
                games=random.randint(10, 15),
                confidence=random.randint(75, 90)
            )
            
            explanation = {
                "id": f"explanation_{i+1}",
                "player_name": player["name"],
                "context": f"Player: {player['name']} ({player['position']}, {player['team']})",
                "question": f"Analyze {stat_type.replace('_', ' ')} prop for {line} line",
                "response": explanation_text,
                "confidence": random.randint(75, 95),
                "timestamp": datetime.now().isoformat(),
                "model_used": "llama3.1",
                "response_time_ms": random.randint(800, 2500)
            }
            
            explanations.append(explanation)
        
        return explanations

def main():
    parser = argparse.ArgumentParser(description="Generate comprehensive mock data for A1Betting")
    parser.add_argument("--output-dir", default="mock_data", help="Output directory for mock data files")
    parser.add_argument("--players", type=int, default=50, help="Number of players to generate")
    parser.add_argument("--games", type=int, default=20, help="Number of games to generate")
    parser.add_argument("--odds", type=int, default=100, help="Number of odds entries to generate")
    parser.add_argument("--opportunities", type=int, default=50, help="Number of prop opportunities")
    parser.add_argument("--arbitrage", type=int, default=10, help="Number of arbitrage opportunities")
    parser.add_argument("--explanations", type=int, default=20, help="Number of AI explanations")
    parser.add_argument("--format", choices=["json", "all"], default="all", help="Output format")
    
    args = parser.parse_args()
    
    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Initialize generator
    generator = MockDataGenerator()
    
    print("🚀 Generating comprehensive mock data for A1Betting...")
    
    # Generate all data types
    data_types = {
        "players": (generator.generate_players, args.players),
        "games": (generator.generate_games, args.games),
        "odds": (generator.generate_odds_data, args.odds),
        "opportunities": (generator.generate_prop_opportunities, args.opportunities),
        "arbitrage": (generator.generate_arbitrage_opportunities, args.arbitrage),
        "ai_explanations": (generator.generate_ai_explanations, args.explanations)
    }
    
    generated_data = {}
    
    for data_type, (generator_func, count) in data_types.items():
        print(f"📊 Generating {count} {data_type}...")
        data = generator_func(count)
        generated_data[data_type] = data
        
        # Save individual files
        if args.format in ["json", "all"]:
            filename = os.path.join(args.output_dir, f"{data_type}.json")
            with open(filename, 'w') as f:
                json.dump(data, f, indent=2, default=str)
            print(f"✅ Saved {filename}")
    
    # Save comprehensive manifest
    manifest = {
        "generated_at": datetime.now().isoformat(),
        "data_types": list(data_types.keys()),
        "counts": {data_type: len(data) for data_type, data in generated_data.items()},
        "files": [f"{data_type}.json" for data_type in data_types.keys()],
        "total_records": sum(len(data) for data in generated_data.values())
    }
    
    manifest_file = os.path.join(args.output_dir, "manifest.json")
    with open(manifest_file, 'w') as f:
        json.dump(manifest, f, indent=2, default=str)
    
    print(f"\n🎉 Mock data generation complete!")
    print(f"📁 Output directory: {args.output_dir}")
    print(f"📋 Total records: {manifest['total_records']}")
    print(f"📄 Manifest: {manifest_file}")
    
    # Display summary
    print("\n📊 Generated Data Summary:")
    for data_type, count in manifest["counts"].items():
        print(f"  • {data_type}: {count} records")

if __name__ == "__main__":
    main()
