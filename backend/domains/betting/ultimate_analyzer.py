"""Ultimate betting analyzer."""

from typing import Dict, Any, List

class UltimateBettingAnalyzer:
    """
    Ultimate betting analysis system that analyzes EVERY category and resource
    Integrates real-time PrizePicks data with comprehensive ML predictions
    """

    def __init__(self, ml_engine, betting_analyzer, risk_manager, prediction_engine):
        self.ml_engine = ml_engine
        self.betting_analyzer = betting_analyzer
        self.risk_manager = risk_manager
        self.prediction_engine = prediction_engine

        # Comprehensive category mappings for ALL sports
        self.category_configs = {
            "MLB": {
                "hitting": [
                    ("hits", [1.5, 2.5], "Batter hits"),
                    ("home_runs", [0.5, 1.5], "Home runs"),
                    ("rbi", [1.5, 2.5], "Runs batted in"),
                    ("runs", [1.5, 2.5], "Runs scored"),
                    ("total_bases", [2.5, 3.5], "Total bases"),
                    ("doubles", [0.5, 1.5], "Doubles hit"),
                    ("stolen_bases", [0.5, 1.5], "Stolen bases"),
                    ("walks", [1.5, 2.5], "Walks taken"),
                    ("strikeouts", [1.5, 2.5], "Strikeouts"),
                ],
                "pitching": [
                    ("strikeouts", [6.5, 8.5], "Pitcher strikeouts"),
                    ("walks_allowed", [2.5, 3.5], "Walks allowed"),
                    ("hits_allowed", [5.5, 7.5], "Hits allowed"),
                    ("earned_runs", [2.5, 3.5], "Earned runs"),
                    ("innings_pitched", [5.5, 6.5], "Innings pitched"),
                    ("pitch_count", [85.5, 95.5], "Total pitches"),
                ],
                "team": [
                    ("total_runs", [8.5, 10.5], "Team total runs"),
                    ("total_hits", [11.5, 13.5], "Team total hits"),
                    ("team_home_runs", [1.5, 2.5], "Team home runs"),
                ],
            },
            "NBA": {
                "scoring": [
                    ("points", [18.5, 25.5, 30.5], "Player points"),
                    ("three_pointers", [2.5, 3.5], "Three-pointers made"),
                    ("field_goals", [7.5, 9.5], "Field goals made"),
                    ("free_throws", [3.5, 5.5], "Free throws made"),
                    ("field_goal_percentage", [0.485, 0.525], "FG percentage"),
                ],
                "rebounding": [
                    ("rebounds", [6.5, 9.5, 12.5], "Total rebounds"),
                    ("offensive_rebounds", [2.5, 3.5], "Offensive rebounds"),
                    ("defensive_rebounds", [5.5, 7.5], "Defensive rebounds"),
                ],
                "playmaking": [
                    ("assists", [4.5, 6.5, 8.5], "Assists"),
                    ("turnovers", [2.5, 3.5], "Turnovers"),
                    ("steals", [1.5, 2.5], "Steals"),
                    ("blocks", [1.5, 2.5], "Blocks"),
                ],
                "team": [
                    ("team_points", [108.5, 115.5], "Team total points"),
                    ("team_three_pointers", [12.5, 15.5], "Team 3-pointers"),
                ],
            },
            "WNBA": {
                "scoring": [
                    ("points", [14.5, 18.5, 22.5], "Player points"),
                    ("three_pointers", [1.5, 2.5], "Three-pointers made"),
                    ("field_goals", [5.5, 7.5], "Field goals made"),
                    ("free_throws", [2.5, 4.5], "Free throws made"),
                ],
                "rebounding": [
                    ("rebounds", [5.5, 7.5, 9.5], "Total rebounds"),
                    ("offensive_rebounds", [1.5, 2.5], "Offensive rebounds"),
                    ("defensive_rebounds", [4.5, 6.5], "Defensive rebounds"),
                ],
                "playmaking": [
                    ("assists", [3.5, 5.5], "Assists"),
                    ("turnovers", [2.5, 3.5], "Turnovers"),
                    ("steals", [1.5, 2.5], "Steals"),
                    ("blocks", [0.5, 1.5], "Blocks"),
                ],
                "team": [
                    ("team_points", [78.5, 85.5], "Team total points"),
                ],
            },
            "MLS": {
                "attacking": [
                    ("goals", [0.5, 1.5], "Goals scored"),
                    ("shots", [2.5, 4.5], "Total shots"),
                    ("shots_on_goal", [1.5, 3.5], "Shots on goal"),
                    ("assists", [0.5, 1.5], "Assists"),
                    ("key_passes", [1.5, 2.5], "Key passes"),
                ],
                "defending": [
                    ("tackles", [2.5, 4.5], "Tackles made"),
                    ("interceptions", [1.5, 2.5], "Interceptions"),
                    ("clearances", [2.5, 4.5], "Clearances"),
                    ("blocks", [0.5, 1.5], "Blocks"),
                ],
                "goalkeeping": [
                    ("saves", [2.5, 4.5], "Saves made"),
                    ("goals_allowed", [0.5, 1.5], "Goals allowed"),
                    ("clean_sheet", [0.5], "Clean sheet"),
                ],
                "team": [
                    ("team_goals", [1.5, 2.5], "Team total goals"),
                    ("team_corners", [8.5, 11.5], "Corner kicks"),
                ],
            },
            "NFL": {
                "passing": [
                    ("passing_yards", [245.5, 285.5], "Passing yards"),
                    ("passing_touchdowns", [1.5, 2.5], "Passing TDs"),
                    ("completions", [22.5, 26.5], "Completions"),
                    ("interceptions", [0.5, 1.5], "Interceptions"),
                ],
                "rushing": [
                    ("rushing_yards", [65.5, 85.5], "Rushing yards"),
                    ("rushing_touchdowns", [0.5, 1.5], "Rushing TDs"),
                    ("rushing_attempts", [15.5, 19.5], "Rush attempts"),
                ],
                "receiving": [
                    ("receiving_yards", [55.5, 75.5], "Receiving yards"),
                    ("receptions", [4.5, 6.5], "Receptions"),
                    ("receiving_touchdowns", [0.5, 1.5], "Receiving TDs"),
                ],
            },
            "NHL": {
                "scoring": [
                    ("goals", [0.5, 1.5], "Goals scored"),
                    ("assists", [0.5, 1.5], "Assists"),
                    ("points", [0.5, 1.5], "Total points"),
                    ("shots", [2.5, 4.5], "Shots on goal"),
                ],
                "goaltending": [
                    ("saves", [25.5, 30.5], "Saves made"),
                    ("goals_allowed", [2.5, 3.5], "Goals allowed"),
                    ("save_percentage", [0.905, 0.925], "Save percentage"),
                ],
            },
        }

    async def analyze_all_categories(
        self, bankroll: float = 1000.0, min_confidence: float = 0.75
    ):
        """
        Comprehensive analysis across ALL categories and sports
        Returns the absolute best betting opportunities
        """
        all_opportunities = []

        # Process every sport and category
        for sport, categories in self.category_configs.items():
            try:
                players = prizepicks_service.get_players_by_sport(sport)
                logger.info(
                    f"🔍 Analyzing {len(players)} {sport} players across all categories"
                )

                for category_name, stat_configs in categories.items():
                    for stat_type, lines, description in stat_configs:
                        for line in lines:
                            opportunities = await self._analyze_stat_category(
                                sport,
                                players,
                                stat_type,
                                line,
                                category_name,
                                bankroll,
                                min_confidence,
                            )
                            all_opportunities.extend(opportunities)

            except Exception as e:
                logger.error(f"Error analyzing {sport}: {e}")
                continue

        # Sort by expected value and confidence
        all_opportunities.sort(
            key=lambda x: (x["expected_value"], x["confidence"]), reverse=True
        )

        # Apply portfolio optimization
        optimized_portfolio = self._optimize_betting_portfolio(
            all_opportunities, bankroll
        )

        return optimized_portfolio

    async def _analyze_stat_category(
        self, sport, players, stat_type, line, category, bankroll, min_confidence
    ):
        """Analyze specific stat category for all players"""
        opportunities = []

        for player in players[:50]:  # Top 50 players per category
            if player.get("injury_status") != "healthy":
                continue

            try:
                # Generate advanced ML prediction
                if self.ml_engine and self.ml_engine.is_advanced_ready:
                    prediction = self.ml_engine.generate_advanced_prediction(
                        player, stat_type, line, sport
                    )
                else:
                    prediction = self.prediction_engine.generate_prediction(
                        player, stat_type, line
                    )

                # Skip low confidence predictions
                if prediction["confidence"] < min_confidence:
                    continue

                # Calculate betting opportunity
                betting_op = self.betting_analyzer.analyze_betting_opportunity(
                    prediction, line, odds=-110, bankroll=bankroll
                )

                # Risk assessment
                risk_check = self.risk_manager.assess_bet_risk(betting_op, bankroll)

                if (
                    risk_check["approved"]
                    and betting_op["recommendation"] == "BET"
                    and betting_op["expected_value"] > 0.05
                ):

                    opportunity = {
                        "player_name": player["name"],
                        "team": player["team"],
                        "sport": sport,
                        "category": category,
                        "stat_type": stat_type,
                        "line": line,
                        "prediction": prediction["prediction"],
                        "confidence": prediction["confidence"],
                        "expected_value": betting_op["expected_value"],
                        "bet_amount": betting_op["bet_amount"],
                        "expected_profit": betting_op["expected_profit"],
                        "roi_percentage": betting_op["roi_percentage"],
                        "risk_level": betting_op["risk_level"],
                        "odds": betting_op["odds"],
                        "models_used": prediction.get("models_used", []),
                        "edge": betting_op.get("edge", 0),
                        "kelly_criterion": betting_op["bet_amount"] / bankroll,
                        "risk_score": risk_check["risk_score"],
                        "analysis_timestamp": datetime.now().isoformat(),
                    }
                    opportunities.append(opportunity)

            except Exception as e:
                logger.warning(f"Error analyzing {player['name']} {stat_type}: {e}")
                continue

        return opportunities

    def _optimize_betting_portfolio(self, opportunities, bankroll):
        """Optimize betting portfolio using advanced algorithms"""
        if not opportunities:
            return {
                "status": "no_opportunities",
                "total_opportunities": 0,
                "recommended_bets": [],
                "portfolio_metrics": {},
            }

        # Portfolio optimization constraints
        max_total_bet = bankroll * 0.25  # Max 25% of bankroll
        max_single_bet = bankroll * 0.05  # Max 5% per bet
        max_sport_exposure = bankroll * 0.15  # Max 15% per sport

        selected_bets = []
        total_bet_amount = 0
        sport_exposure = {}

        # Greedy selection with constraints
        for opp in opportunities:
            sport = opp["sport"]
            bet_amount = min(opp["bet_amount"], max_single_bet)

            # Check constraints
            if (
                total_bet_amount + bet_amount <= max_total_bet
                and sport_exposure.get(sport, 0) + bet_amount <= max_sport_exposure
                and len(selected_bets) < 10
            ):  # Max 10 bets

                opp["optimized_bet_amount"] = bet_amount
                opp["optimized_profit"] = bet_amount * opp["expected_value"]

                selected_bets.append(opp)
                total_bet_amount += bet_amount
                sport_exposure[sport] = sport_exposure.get(sport, 0) + bet_amount

        # Calculate portfolio metrics
        portfolio_metrics = {
            "total_bets": len(selected_bets),
            "total_bet_amount": round(total_bet_amount, 2),
            "total_expected_profit": round(
                sum(bet["optimized_profit"] for bet in selected_bets), 2
            ),
            "portfolio_roi": (
                round(
                    (
                        sum(bet["optimized_profit"] for bet in selected_bets)
                        / total_bet_amount
                        * 100
                    ),
                    2,
                )
                if total_bet_amount > 0
                else 0
            ),
            "bankroll_utilization": round((total_bet_amount / bankroll * 100), 2),
            "average_confidence": (
                round(
                    sum(bet["confidence"] for bet in selected_bets)
                    / len(selected_bets),
                    2,
                )
                if selected_bets
                else 0
            ),
            "sports_diversification": len(sport_exposure),
            "risk_distribution": {
                "low": len([b for b in selected_bets if b["risk_level"] == "LOW"]),
                "medium": len(
                    [b for b in selected_bets if b["risk_level"] == "MEDIUM"]
                ),
                "high": len([b for b in selected_bets if b["risk_level"] == "HIGH"]),
            },
        }

        return {
            "status": "success",
            "total_opportunities_analyzed": len(opportunities),
            "recommended_bets": selected_bets,
            "portfolio_metrics": portfolio_metrics,
            "bankroll": bankroll,
            "available_bankroll": round(bankroll - total_bet_amount, 2),
            "optimization_method": "constraint_based_greedy",
            "timestamp": datetime.now().isoformat(),
        }


# Initialize Ultimate Betting Analyzer
try:
    ultimate_analyzer = UltimateBettingAnalyzer(
        core_ml_engine, betting_analyzer, risk_manager, prediction_engine
    )
    logger.info("🚀 Ultimate Betting Analyzer initialized successfully")
except Exception as e:
    logger.error(f"Ultimate Analyzer initialization error: {e}")
    ultimate_analyzer = None


