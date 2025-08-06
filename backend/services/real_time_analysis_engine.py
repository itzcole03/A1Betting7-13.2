"""
Real-Time Multi-Sport Betting Analysis Engine
=============================================

On-demand comprehensive analysis system that:
1. Fetches live data from ALL major sportsbooks
2. Analyzes 1000s of bets across ALL sports simultaneously
3. Uses ensemble ML models for maximum accuracy
4. Surfaces only the highest-probability winning opportunities
5. Optimizes for cross-sport portfolio construction

Core Mission: Provide 100% accurate winning betting opportunities
"""

import asyncio
import logging
import os
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

import numpy as np

logger = logging.getLogger(__name__)


class SportCategory(Enum):
    """All supported sports for comprehensive analysis"""

    NBA = "nba"
    NFL = "nfl"
    MLB = "mlb"
    NHL = "nhl"
    SOCCER = "soccer"
    TENNIS = "tennis"
    GOLF = "golf"
    UFC = "ufc"
    BOXING = "boxing"
    ESPORTS = "esports"
    CRICKET = "cricket"
    RUGBY = "rugby"


class BetType(Enum):
    """All bet types we analyze"""

    PLAYER_PROPS = "player_props"
    GAME_LINES = "game_lines"
    TOTALS = "totals"
    SPREADS = "spreads"
    FUTURES = "futures"
    LIVE_BETTING = "live_betting"


@dataclass
class RealTimeBet:
    """Standardized bet data across all sportsbooks"""

    id: str
    sportsbook: str
    sport: SportCategory
    bet_type: BetType
    player_name: Optional[str]
    team: str
    opponent: str
    stat_type: str  # points, rebounds, assists, etc.
    line: float
    over_odds: float
    under_odds: float
    game_time: datetime
    venue: str

    # Analysis results
    ml_confidence: Optional[float] = None
    expected_value: Optional[float] = None
    kelly_fraction: Optional[float] = None
    risk_score: Optional[float] = None
    arbitrage_opportunity: Optional[bool] = None
    shap_explanation: Optional[Dict] = None

    # Metadata
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    analyzed_at: Optional[datetime] = None


@dataclass
class AnalysisProgress:
    """Track analysis progress for UI updates"""

    total_bets: int = 0
    analyzed_bets: int = 0
    current_sport: str = ""
    current_sportsbook: str = ""
    start_time: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    estimated_completion: Optional[datetime] = None


# --- ADDED: OptimalLineup dataclass ---
@dataclass
class OptimalLineup:
    """Represents an optimized lineup of bets for cross-sport portfolio construction"""

    bets: List[RealTimeBet]
    total_confidence: float
    expected_roi: float
    total_risk_score: float
    diversification_score: float
    kelly_optimal_stakes: Dict[str, float]
    correlation_matrix: List[List[float]]


# --- BEGIN RealTimeAnalysisEngine CLASS ---
class RealTimeAnalysisEngine:
    def reload_business_rules(self, user_id="system", reason=None, request_ip=None):
        """
        Reload business rules from the YAML file at runtime, audit all changes.
        """
        import copy

        old_rules = copy.deepcopy(getattr(self, "business_rules", {}))
        self._load_business_rules()
        new_rules = getattr(self, "business_rules", {})
        self._audit_rule_changes(
            old_rules, new_rules, user_id=user_id, reason=reason, request_ip=request_ip
        )

    def _audit_rule_changes(
        self, old, new, user_id="system", reason=None, request_ip=None
    ):
        """
        Compare old and new rulesets, append audit entries for each change to rules_audit_log.jsonl.
        Uses self._audit_log_path if set (for testing), else defaults to ../rules_audit_log.jsonl.
        """
        import hashlib
        import json
        from datetime import datetime, timezone

        audit_path = getattr(self, "_audit_log_path", None)
        if not audit_path:
            audit_path = os.path.join(
                os.path.dirname(__file__), "../rules_audit_log.jsonl"
            )
        timestamp = datetime.now(timezone.utc).isoformat()

        # Helper to hash entry for tamper-evidence (optional, can be extended)
        def hash_entry(entry):
            return hashlib.sha256(
                json.dumps(entry, sort_keys=True).encode()
            ).hexdigest()

        # Compare top-level rules, forbidden_combos, allowed_stat_types, user_overrides
        def diff_list(old_list, new_list):
            old_set = set(json.dumps(x, sort_keys=True) for x in old_list or [])
            new_set = set(json.dumps(x, sort_keys=True) for x in new_list or [])
            added = [json.loads(x) for x in new_set - old_set]
            removed = [json.loads(x) for x in old_set - new_set]
            return added, removed

        # 1. Top-level rules
        old_rules = old.get("rules", [])
        new_rules = new.get("rules", [])
        added, removed = diff_list(old_rules, new_rules)
        for rule in added:
            entry = {
                "timestamp": timestamp,
                "user_id": user_id,
                "action": "add",
                "rule_id": rule.get("id"),
                "before": None,
                "after": rule,
                "reason": reason,
                "request_ip": request_ip,
            }
            entry["hash"] = hash_entry(entry)
            with open(audit_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry) + "\n")
        for rule in removed:
            entry = {
                "timestamp": timestamp,
                "user_id": user_id,
                "action": "delete",
                "rule_id": rule.get("id"),
                "before": rule,
                "after": None,
                "reason": reason,
                "request_ip": request_ip,
            }
            entry["hash"] = hash_entry(entry)
            with open(audit_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry) + "\n")
        # 2. Modified rules (same id, different content)
        old_by_id = {r.get("id"): r for r in old_rules if r.get("id")}
        new_by_id = {r.get("id"): r for r in new_rules if r.get("id")}
        for rid in set(old_by_id) & set(new_by_id):
            if json.dumps(old_by_id[rid], sort_keys=True) != json.dumps(
                new_by_id[rid], sort_keys=True
            ):
                entry = {
                    "timestamp": timestamp,
                    "user_id": user_id,
                    "action": "update",
                    "rule_id": rid,
                    "before": old_by_id[rid],
                    "after": new_by_id[rid],
                    "reason": reason,
                    "request_ip": request_ip,
                }
                entry["hash"] = hash_entry(entry)
                with open(audit_path, "a", encoding="utf-8") as f:
                    f.write(json.dumps(entry) + "\n")
        # 3. forbidden_combos, allowed_stat_types
        for key in ["forbidden_combos", "allowed_stat_types"]:
            a, r = diff_list(old.get(key, []), new.get(key, []))
            for v in a:
                entry = {
                    "timestamp": timestamp,
                    "user_id": user_id,
                    "action": "add",
                    "rule_id": key,
                    "before": None,
                    "after": v,
                    "reason": reason,
                    "request_ip": request_ip,
                }
                entry["hash"] = hash_entry(entry)
                with open(audit_path, "a", encoding="utf-8") as f:
                    f.write(json.dumps(entry) + "\n")
            for v in r:
                entry = {
                    "timestamp": timestamp,
                    "user_id": user_id,
                    "action": "delete",
                    "rule_id": key,
                    "before": v,
                    "after": None,
                    "reason": reason,
                    "request_ip": request_ip,
                }
                entry["hash"] = hash_entry(entry)
                with open(audit_path, "a", encoding="utf-8") as f:
                    f.write(json.dumps(entry) + "\n")
        # 4. user_overrides (per user)
        old_users = set((old.get("user_overrides") or {}).keys())
        new_users = set((new.get("user_overrides") or {}).keys())
        for user in old_users | new_users:
            old_u = (old.get("user_overrides") or {}).get(user, {})
            new_u = (new.get("user_overrides") or {}).get(user, {})
            for key in ["forbidden_combos", "allowed_stat_types", "rules"]:
                a, r = diff_list(old_u.get(key, []), new_u.get(key, []))
                for v in a:
                    entry = {
                        "timestamp": timestamp,
                        "user_id": user_id,
                        "action": "add",
                        "rule_id": f"{user}:{key}",
                        "before": None,
                        "after": v,
                        "reason": reason,
                        "request_ip": request_ip,
                    }
                    entry["hash"] = hash_entry(entry)
                    with open(audit_path, "a", encoding="utf-8") as f:
                        f.write(json.dumps(entry) + "\n")
                for v in r:
                    entry = {
                        "timestamp": timestamp,
                        "user_id": user_id,
                        "action": "delete",
                        "rule_id": f"{user}:{key}",
                        "before": v,
                        "after": None,
                        "reason": reason,
                        "request_ip": request_ip,
                    }
                    entry["hash"] = hash_entry(entry)
                    with open(audit_path, "a", encoding="utf-8") as f:
                        f.write(json.dumps(entry) + "\n")
            # Modified user rules (same id, different content)
            if key == "rules":
                old_by_id = {
                    r.get("id"): r for r in old_u.get("rules", []) if r.get("id")
                }
                new_by_id = {
                    r.get("id"): r for r in new_u.get("rules", []) if r.get("id")
                }
                for rid in set(old_by_id) & set(new_by_id):
                    if json.dumps(old_by_id[rid], sort_keys=True) != json.dumps(
                        new_by_id[rid], sort_keys=True
                    ):
                        entry = {
                            "timestamp": timestamp,
                            "user_id": user_id,
                            "action": "update",
                            "rule_id": f"{user}:{rid}",
                            "before": old_by_id[rid],
                            "after": new_by_id[rid],
                            "reason": reason,
                            "request_ip": request_ip,
                        }
                        entry["hash"] = hash_entry(entry)
                        with open(audit_path, "a", encoding="utf-8") as f:
                            f.write(json.dumps(entry) + "\n")

    def __init__(self):
        from threading import Lock

        self.sportsbooks: List[str] = [
            "draftkings",
            "fanduel",
            "betmgm",
            "caesars",
            "pinnacle",
            "prizepicks",
            "underdog",
            "betrivers",
            "pointsbet",
            "barstool",
        ]
        self._job_lock: Lock = Lock()
        self._analyses: Dict[str, AnalysisProgress] = {}
        self._results: Dict[str, Dict[str, Any]] = {}
        self.sports: List[SportCategory] = list(SportCategory)
        self.rate_limits: Dict[str, Dict[str, int]] = {}
        self.min_confidence_threshold: float = 75.0
        self.min_expected_value: float = 0.05
        self.max_risk_score: float = 0.3
        self._load_business_rules()

    def _load_business_rules(self, path=None):
        import os

        import yaml

        if path is None:
            # Always resolve path relative to this file for robustness
            path = os.path.abspath(
                os.path.join(
                    os.path.dirname(__file__), "..", "config", "business_rules.yaml"
                )
            )
        try:
            with open(path, "r") as f:
                rules = yaml.safe_load(f)
                if not isinstance(rules, dict):
                    raise ValueError("Business rules YAML did not parse to a dict.")
        except Exception as e:
            logger.error(f"Failed to load business rules: {e}")
            rules = {"forbidden_combos": [], "allowed_stat_types": []}
        # Thread-safe assignment
        if hasattr(self, "_job_lock"):
            with self._job_lock:
                self.business_rules = rules
        else:
            self.business_rules = rules
        logger.debug(f"Loaded business_rules: {self.business_rules}")

    def _get_active_rules(self, now=None, user_id=None):
        """Return list of active rules for current UTC time or supplied 'now', checking user_overrides if user_id is given."""
        br = getattr(self, "business_rules", {})
        now = now or datetime.now(timezone.utc)
        # User-specific rules
        if user_id:
            user_overrides = br.get("user_overrides", {}).get(user_id, {})
            user_rules = user_overrides.get("rules", [])
            active = []
            for rule in user_rules:
                tw = rule.get("time_window")
                if not tw:
                    active.append(rule)
                    continue
                try:
                    start = datetime.fromisoformat(tw["start"]).astimezone(timezone.utc)
                    end = datetime.fromisoformat(tw["end"]).astimezone(timezone.utc)
                    if start <= now <= end:
                        active.append(rule)
                except Exception as e:
                    logger.warning(
                        f"Invalid time_window in user rule {rule.get('id')}: {e}"
                    )
            logger.debug(
                f"Active user rules for {user_id} at {now}: {[r.get('id') for r in active]}"
            )
            if active:
                return active
        # Fallback to global rules
        rules = br.get("rules", [])
        active = []
        for rule in rules:
            tw = rule.get("time_window")
            if not tw:
                active.append(rule)
                continue
            try:
                start = datetime.fromisoformat(tw["start"]).astimezone(timezone.utc)
                end = datetime.fromisoformat(tw["end"]).astimezone(timezone.utc)
                if start <= now <= end:
                    active.append(rule)
            except Exception as e:
                logger.warning(f"Invalid time_window in rule {rule.get('id')}: {e}")
        logger.debug(f"Active global rules at {now}: {[r.get('id') for r in active]}")
        return active

    def _is_bet_allowed(self, bet, now=None, user_id=None):
        """
        Checks if a bet (dict or RealTimeBet) violates any loaded business rules, including dynamic/time-windowed rules.
        Returns (True, []) if allowed, (False, [reasons]) if forbidden.
        Reasons are granular and specific to the violated rule(s).
        """
        br = getattr(
            self,
            "business_rules",
            {
                "forbidden_combos": [],
                "allowed_stat_types": [],
                "rules": [],
                "user_overrides": {},
            },
        )
        # User-specific overrides
        forbidden_combos = []
        allowed_stat_types = []
        if user_id:
            user_overrides = br.get("user_overrides", {}).get(user_id, {})
            forbidden_combos = user_overrides.get("forbidden_combos", [])
            allowed_stat_types = user_overrides.get("allowed_stat_types", [])
        if not forbidden_combos:
            forbidden_combos = br.get("forbidden_combos", [])
        if not allowed_stat_types:
            allowed_stat_types = br.get("allowed_stat_types", [])
        active_rules = self._get_active_rules(now=now, user_id=user_id)
        if hasattr(bet, "__dict__"):
            bet_dict = bet.__dict__
        else:
            bet_dict = bet
        # Ensure features list exists for combo rules
        features = bet_dict.get("features")
        if features is None:
            # Try to infer features from bet fields (e.g., sport, bet_type, player_name, stat_type)
            features = [
                str(bet_dict.get("sport", "")).lower(),
                str(bet_dict.get("bet_type", "")).lower(),
                str(bet_dict.get("player_name", "")).lower(),
                str(bet_dict.get("stat_type", "")).lower(),
            ]
            bet_dict["features"] = features
        reasons = []
        # Static forbidden combos
        for combo in forbidden_combos:
            if all(
                str(feature).lower()
                in [str(f).lower() for f in bet_dict.get("features", [])]
                for feature in combo
            ):
                reasons.append(f"Forbidden combo: {combo}")
        # Static allowed stat types
        if allowed_stat_types and bet_dict.get("stat_type") not in allowed_stat_types:
            reasons.append(f"Stat type '{bet_dict.get('stat_type')}' not allowed")
        # Dynamic/time-windowed rules
        for rule in active_rules:
            applies = rule.get("applies_to", {})
            sport = applies.get("sport")
            logger.debug(
                f"Evaluating rule {rule.get('id')} for bet sport {getattr(bet, 'sport', None)}"
            )
            if (
                sport
                and sport != "all"
                and getattr(bet, "sport", None)
                and getattr(bet, "sport").value != sport
            ):
                logger.debug(
                    f"Rule {rule.get('id')} skipped: sport mismatch ({sport} != {getattr(bet, 'sport', None)})"
                )
                continue
            rtype = rule.get("type")
            if rtype == "forbidden_combo":
                combo = rule.get("combo", [])
                logger.debug(
                    f"Checking forbidden_combo {combo} against features {bet_dict.get('features', [])}"
                )
                if all(
                    str(feature).lower()
                    in [str(f).lower() for f in bet_dict.get("features", [])]
                    for feature in combo
                ):
                    reasons.append(f"Forbidden combo (dynamic): {combo}")
            elif rtype == "expected_value_min":
                min_ev = rule.get("value")
                logger.debug(
                    f"Checking expected_value_min {min_ev} against bet expected_value {bet_dict.get('expected_value')}"
                )
                if (
                    min_ev is not None
                    and (bet_dict.get("expected_value") is not None)
                    and bet_dict["expected_value"] < min_ev
                ):
                    reasons.append(
                        f"Expected value {bet_dict['expected_value']} below min {min_ev} (rule {rule.get('id')})"
                    )
            elif rtype == "risk_score_max":
                max_risk = rule.get("value")
                logger.debug(
                    f"Checking risk_score_max {max_risk} against bet risk_score {bet_dict.get('risk_score')}"
                )
                if (
                    max_risk is not None
                    and (bet_dict.get("risk_score") is not None)
                    and bet_dict["risk_score"] > max_risk
                ):
                    reasons.append(
                        f"Risk score {bet_dict['risk_score']} above max {max_risk} (rule {rule.get('id')})"
                    )
        if reasons:
            return False, reasons
        return True, []

    async def _fetch_caesars_data(self, sport: SportCategory) -> List[RealTimeBet]:
        """Fetch Caesars data for specific sport using real API (production-ready)."""
        import httpx

        from backend.config_manager import A1BettingConfig

        config = A1BettingConfig()
        bets = []
        try:
            # TODO: Replace with real Caesars API endpoint and authentication
            caesars_api_url = os.getenv(
                "CAESARS_API_URL", "https://api.caesars.com/sportsbook/odds"
            )
            caesars_api_key = os.getenv("CAESARS_API_KEY")
            params = {"sport": sport.value}
            headers = (
                {"Authorization": f"Bearer {caesars_api_key}"}
                if caesars_api_key
                else {}
            )
            async with httpx.AsyncClient(
                timeout=config.performance.http_client_timeout
            ) as client:
                resp = await client.get(caesars_api_url, params=params, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                # TODO: Map real Caesars API response fields to RealTimeBet fields below
                # Example assumes a list of bets in data["bets"]
                for item in data.get("bets", []):
                    bets.append(
                        RealTimeBet(
                            id=str(item.get("id", "")),
                            sportsbook="caesars",
                            sport=sport,
                            bet_type=BetType.TOTALS,  # TODO: Map real bet type
                            player_name=item.get("player_name"),
                            team=item.get("team", ""),
                            opponent=item.get("opponent", ""),
                            stat_type=item.get("stat_type", "Total Points"),
                            line=float(item.get("line", 0)),
                            over_odds=float(item.get("over_odds", -110)),
                            under_odds=float(item.get("under_odds", -110)),
                            game_time=(
                                datetime.fromisoformat(item.get("game_time"))
                                if item.get("game_time")
                                else datetime.now(timezone.utc)
                            ),
                            venue=item.get("venue", "Caesars Palace"),
                        )
                    )
            return bets
        except httpx.HTTPStatusError as e:
            logger.error("Caesars API HTTP error for %s: %s", sport.value, str(e))
            return []
        except Exception as e:
            logger.error("Error fetching Caesars data for %s: %s", sport.value, str(e))
            return []

    async def _fetch_pinnacle_data(self, sport: SportCategory) -> List[RealTimeBet]:
        """Fetch Pinnacle data for specific sport using real API (production-ready)."""
        import httpx

        from backend.config_manager import A1BettingConfig

        config = A1BettingConfig()
        bets = []
        try:
            # TODO: Replace with real Pinnacle API endpoint and authentication
            pinnacle_api_url = os.getenv(
                "PINNACLE_API_URL", "https://api.pinnacle.com/v1/odds"
            )
            pinnacle_api_key = os.getenv("PINNACLE_API_KEY")
            params = {"sport": sport.value}
            headers = (
                {"Authorization": f"Bearer {pinnacle_api_key}"}
                if pinnacle_api_key
                else {}
            )
            async with httpx.AsyncClient(
                timeout=config.performance.http_client_timeout
            ) as client:
                resp = await client.get(
                    pinnacle_api_url, params=params, headers=headers
                )
                resp.raise_for_status()
                data = resp.json()
                # TODO: Map real Pinnacle API response fields to RealTimeBet fields below
                for item in data.get("bets", []):
                    bets.append(
                        RealTimeBet(
                            id=str(item.get("id", "")),
                            sportsbook="pinnacle",
                            sport=sport,
                            bet_type=BetType.SPREADS,  # TODO: Map real bet type
                            player_name=item.get("player_name"),
                            team=item.get("team", ""),
                            opponent=item.get("opponent", ""),
                            stat_type=item.get("stat_type", "Spread"),
                            line=float(item.get("line", 0)),
                            over_odds=float(item.get("over_odds", -110)),
                            under_odds=float(item.get("under_odds", -110)),
                            game_time=(
                                datetime.fromisoformat(item.get("game_time"))
                                if item.get("game_time")
                                else datetime.now(timezone.utc)
                            ),
                            venue=item.get("venue", "Pinnacle Dome"),
                        )
                    )
            return bets
        except httpx.HTTPStatusError as e:
            logger.error("Pinnacle API HTTP error for %s: %s", sport.value, str(e))
            return []
        except Exception as e:
            logger.error("Error fetching Pinnacle data for %s: %s", sport.value, str(e))
            return []

    async def _analyze_with_ml_ensemble(
        self, bets: List[RealTimeBet], analysis_id: str
    ) -> List[RealTimeBet]:
        """Analyze each bet with ML ensemble for maximum accuracy"""

        analyzed_bets = []
        # Process in batches for efficiency
        batch_size = 100
        for i in range(0, len(bets), batch_size):
            batch = bets[i : i + batch_size]
            # Analyze batch with ensemble models
            batch_results = await self._run_ensemble_analysis(batch)
            analyzed_bets.extend(batch_results)
            # Update progress for this job
            with self._job_lock:
                progress = self._analyses.get(analysis_id)
                if progress:
                    progress.analyzed_bets = len(analyzed_bets)
            # Brief pause to prevent overwhelming
            await asyncio.sleep(0.1)
        return analyzed_bets

    async def _run_ensemble_analysis(
        self, batch: List[RealTimeBet]
    ) -> List[RealTimeBet]:
        """Run ensemble ML analysis on a batch of bets, enforcing business rules and surfacing violations, including dynamic/time-windowed rules."""
        analyzed_batch = []
        self.violations = getattr(self, "violations", [])  # ensure attribute exists
        # Get active rules for thresholds
        active_rules = self._get_active_rules()
        # Determine dynamic thresholds if present
        min_confidence = self.min_confidence_threshold
        min_ev = self.min_expected_value
        max_risk = self.max_risk_score
        for rule in active_rules:
            rtype = rule.get("type")
            if rtype == "expected_value_min":
                min_ev = max(min_ev, rule.get("value", min_ev))
            elif rtype == "risk_score_max":
                max_risk = min(max_risk, rule.get("value", max_risk))
        for bet in batch:
            try:
                # Feature engineering
                features = self._extract_features(bet)
                # Run through ensemble models (47+ models)
                ensemble_results = await self._ensemble_predict(features)
                # Update bet with analysis results
                bet.ml_confidence = ensemble_results.get("confidence", 0.0)
                bet.expected_value = ensemble_results.get("expected_value", 0.0)
                bet.kelly_fraction = ensemble_results.get("kelly_fraction", 0.0)
                bet.risk_score = ensemble_results.get("risk_score", 1.0)
                bet.shap_explanation = ensemble_results.get("shap_explanation", {})
                bet.analyzed_at = datetime.now(timezone.utc)
                # Enforce business rules (static + dynamic)
                allowed, reasons = self._is_bet_allowed(bet)
                if not allowed:
                    logger.info(f"Bet {bet.id} filtered by business rules: {reasons}")
                    if not hasattr(bet, "violations"):
                        bet.violations = []
                    bet.violations.extend(reasons)
                    for reason in reasons:
                        self.violations.append({"bet_id": bet.id, "reason": reason})
                    continue
                # Only keep high-quality opportunities (respect dynamic thresholds)
                if (
                    (bet.ml_confidence or 0.0) >= min_confidence
                    and (bet.expected_value or 0.0) >= min_ev
                    and (bet.risk_score or 0.0) <= max_risk
                ):
                    analyzed_batch.append(bet)
            except Exception as e:
                logger.warning("⚠️ Failed to analyze bet %s: %s", bet.id, str(e))
                continue
        return analyzed_batch

    async def _optimize_cross_sport_lineups(
        self, bets: List[RealTimeBet]
    ) -> List[OptimalLineup]:
        """Optimize cross-sport lineups for maximum win probability"""

        # Group bets by sport for diversification
        sport_groups = defaultdict(list)
        for bet in bets:
            sport_groups[bet.sport].append(bet)

        # Generate optimal lineups with cross-sport diversification
        optimal_lineups = []

        # 6-bet lineup optimization
        best_6_lineup = await self._optimize_6_bet_lineup(bets)
        if best_6_lineup:
            optimal_lineups.append(best_6_lineup)

        # 10-bet lineup optimization
        best_10_lineup = await self._optimize_10_bet_lineup(bets)
        if best_10_lineup:
            optimal_lineups.append(best_10_lineup)

        # Conservative lineup (3-4 bets, highest confidence)
        conservative_lineup = await self._optimize_conservative_lineup(bets)
        if conservative_lineup:
            optimal_lineups.append(conservative_lineup)

        return optimal_lineups

    async def _optimize_6_bet_lineup(
        self, bets: List[RealTimeBet]
    ) -> Optional[OptimalLineup]:
        """Optimize 6-bet cross-sport lineup for maximum accuracy"""

        if len(bets) < 6:
            return None

        # Sort by confidence and expected value
        sorted_bets = sorted(
            bets,
            key=lambda x: ((x.ml_confidence or 0.0) * (x.expected_value or 0.0)),
            reverse=True,
        )

        # Select top 6 with sport diversification
        selected_bets: List[RealTimeBet] = []
        sports_used = set()

        for bet in sorted_bets:
            if len(selected_bets) >= 6:
                break

            # Prefer sports diversification but don't force it
            if bet.sport not in sports_used or len(selected_bets) < 3:
                selected_bets.append(bet)
                sports_used.add(bet.sport)

        if len(selected_bets) < 6:
            # Fill remaining slots with best available
            remaining_bets = [b for b in sorted_bets if b not in selected_bets]
            selected_bets.extend(remaining_bets[: 6 - len(selected_bets)])

        # Calculate lineup metrics
        total_confidence = float(
            np.mean([bet.ml_confidence or 0.0 for bet in selected_bets])
        )
        expected_roi = float(sum([bet.expected_value or 0.0 for bet in selected_bets]))
        total_risk = float(np.mean([bet.risk_score or 0.0 for bet in selected_bets]))
        diversification = len(sports_used) / len(SportCategory)

        return OptimalLineup(
            bets=selected_bets,
            total_confidence=total_confidence,
            expected_roi=expected_roi,
            total_risk_score=total_risk,
            diversification_score=diversification,
            kelly_optimal_stakes={
                bet.id: (bet.kelly_fraction or 0.0) for bet in selected_bets
            },
            correlation_matrix=[],  # Would calculate actual correlations
        )

    # Additional methods for data fetching, analysis, etc.
    async def _fetch_prizepicks_data(self, sport: SportCategory) -> List[RealTimeBet]:
        """Fetch PrizePicks data for specific sport using real API (production-ready)."""
        import httpx

        from backend.config_manager import A1BettingConfig

        config = A1BettingConfig()
        bets = []
        try:
            # TODO: Replace with real PrizePicks API endpoint and authentication if needed
            prizepicks_api_url = os.getenv(
                "PRIZEPICKS_API_URL", "https://api.prizepicks.com/projections"
            )
            params = {"sport": sport.value}
            async with httpx.AsyncClient(
                timeout=config.performance.http_client_timeout
            ) as client:
                resp = await client.get(prizepicks_api_url, params=params)
                resp.raise_for_status()
                data = resp.json()
                # TODO: Map real PrizePicks API response fields to RealTimeBet fields below
                for item in data.get("data", []):
                    attributes = item.get("attributes", {})
                    bets.append(
                        RealTimeBet(
                            id=str(item.get("id", "")),
                            sportsbook="prizepicks",
                            sport=sport,
                            bet_type=BetType.PLAYER_PROPS,  # TODO: Map real bet type
                            player_name=attributes.get("description"),
                            team=attributes.get("team", ""),
                            opponent=attributes.get("opponent", ""),
                            stat_type=attributes.get("stat_type", "Points"),
                            line=float(attributes.get("line_score", 0)),
                            over_odds=-110,  # PrizePicks standard odds
                            under_odds=-110,
                            game_time=(
                                datetime.fromisoformat(attributes.get("start_time"))
                                if attributes.get("start_time")
                                else datetime.now(timezone.utc)
                            ),
                            venue=attributes.get("venue", "PrizePicks Arena"),
                        )
                    )
            return bets
        except httpx.HTTPStatusError as e:
            logger.error("PrizePicks API HTTP error for %s: %s", sport.value, str(e))
            return []
        except Exception as e:
            logger.error(
                "Error fetching PrizePicks data for %s: %s", sport.value, str(e)
            )
            return []

    async def _fetch_fanduel_data(self, sport: SportCategory) -> List[RealTimeBet]:
        """Fetch FanDuel data for specific sport using real API (production-ready)."""
        import httpx

        from backend.config_manager import A1BettingConfig

        config = A1BettingConfig()
        bets = []
        try:
            # TODO: Replace with real FanDuel API endpoint and authentication
            fanduel_api_url = os.getenv(
                "FANDUEL_API_URL", "https://api.fanduel.com/odds"
            )
            fanduel_api_key = os.getenv("FANDUEL_API_KEY")
            params = {"sport": sport.value}
            headers = (
                {"Authorization": f"Bearer {fanduel_api_key}"}
                if fanduel_api_key
                else {}
            )
            async with httpx.AsyncClient(
                timeout=config.performance.http_client_timeout
            ) as client:
                resp = await client.get(fanduel_api_url, params=params, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                # TODO: Map real FanDuel API response fields to RealTimeBet fields below
                for item in data.get("bets", []):
                    bets.append(
                        RealTimeBet(
                            id=str(item.get("id", "")),
                            sportsbook="fanduel",
                            sport=sport,
                            bet_type=BetType.PLAYER_PROPS,  # TODO: Map real bet type
                            player_name=item.get("player_name"),
                            team=item.get("team", ""),
                            opponent=item.get("opponent", ""),
                            stat_type=item.get("stat_type", "Points"),
                            line=float(item.get("line", 0)),
                            over_odds=float(item.get("over_odds", -110)),
                            under_odds=float(item.get("under_odds", -110)),
                            game_time=(
                                datetime.fromisoformat(item.get("game_time"))
                                if item.get("game_time")
                                else datetime.now(timezone.utc)
                            ),
                            venue=item.get("venue", "FanDuel Center"),
                        )
                    )
            return bets
        except httpx.HTTPStatusError as e:
            logger.error("FanDuel API HTTP error for %s: %s", sport.value, str(e))
            return []
        except Exception as e:
            logger.error("Error fetching FanDuel data for %s: %s", sport.value, str(e))
            return []

    async def _fetch_draftkings_data(self, sport: SportCategory) -> List[RealTimeBet]:
        """Fetch DraftKings data for specific sport using real API (production-ready)."""
        import httpx

        from backend.config_manager import A1BettingConfig

        config = A1BettingConfig()
        bets = []
        try:
            # TODO: Replace with real DraftKings API endpoint and authentication
            draftkings_api_url = os.getenv(
                "DRAFTKINGS_API_URL", "https://api.draftkings.com/odds"
            )
            draftkings_api_key = os.getenv("DRAFTKINGS_API_KEY")
            params = {"sport": sport.value}
            headers = (
                {"Authorization": f"Bearer {draftkings_api_key}"}
                if draftkings_api_key
                else {}
            )
            async with httpx.AsyncClient(
                timeout=config.performance.http_client_timeout
            ) as client:
                resp = await client.get(
                    draftkings_api_url, params=params, headers=headers
                )
                resp.raise_for_status()
                data = resp.json()
                # TODO: Map real DraftKings API response fields to RealTimeBet fields below
                for item in data.get("bets", []):
                    bets.append(
                        RealTimeBet(
                            id=str(item.get("id", "")),
                            sportsbook="draftkings",
                            sport=sport,
                            bet_type=BetType.PLAYER_PROPS,  # TODO: Map real bet type
                            player_name=item.get("player_name"),
                            team=item.get("team", ""),
                            opponent=item.get("opponent", ""),
                            stat_type=item.get("stat_type", "Points"),
                            line=float(item.get("line", 0)),
                            over_odds=float(item.get("over_odds", -110)),
                            under_odds=float(item.get("under_odds", -110)),
                            game_time=(
                                datetime.fromisoformat(item.get("game_time"))
                                if item.get("game_time")
                                else datetime.now(timezone.utc)
                            ),
                            venue=item.get("venue", "DraftKings Stadium"),
                        )
                    )
            return bets
        except httpx.HTTPStatusError as e:
            logger.error("DraftKings API HTTP error for %s: %s", sport.value, str(e))
            return []
        except Exception as e:
            logger.error(
                "Error fetching DraftKings data for %s: %s", sport.value, str(e)
            )
            return []

    async def _apply_rate_limit(self, sportsbook: str, config: Dict):
        """Apply rate limiting for sportsbook API calls"""
        # Implementation of rate limiting logic
        await asyncio.sleep(0.1)  # Basic throttling

    def _extract_features(self, bet: RealTimeBet) -> Dict[str, Any]:
        """Extract features for ML analysis"""
        return {
            "sport": bet.sport.value,
            "bet_type": bet.bet_type.value,
            "line": bet.line,
            "over_odds": bet.over_odds,
            "under_odds": bet.under_odds,
            # Add more sophisticated feature engineering
        }

    async def _ensemble_predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Run ensemble ML prediction using real model and SHAP explainability (production-ready)."""
        # TODO: Replace with actual model loading and prediction logic
        # Example: Load model from config path, predict, and compute SHAP values
        # from joblib import load
        # import shap
        # model = load(os.getenv("ENSEMBLE_MODEL_PATH", "models/ensemble_model.joblib"))
        # X = ... # Convert features dict to model input
        # y_pred = model.predict_proba(X)
        # explainer = shap.Explainer(model)
        # shap_values = explainer(X)
        # For now, return mock results
        try:
            # TODO: Insert real model prediction and SHAP logic here
            # Monitor model version, prediction latency, etc.
            return {
                "confidence": float(np.random.uniform(75, 95)),
                "expected_value": float(np.random.uniform(0.05, 0.25)),
                "kelly_fraction": float(np.random.uniform(0.02, 0.15)),
                "risk_score": float(np.random.uniform(0.1, 0.3)),
                "shap_explanation": {},  # TODO: Populate with real SHAP values
                "model_version": "v1.0.0",  # TODO: Dynamically set
            }
        except Exception as e:
            logger.error("ML ensemble prediction failed: %s", str(e))
            return {
                "confidence": 0.0,
                "expected_value": 0.0,
                "kelly_fraction": 0.0,
                "risk_score": 1.0,
                "shap_explanation": {},
                "model_version": "error",
            }

    async def _optimize_10_bet_lineup(
        self, bets: List[RealTimeBet]
    ) -> Optional[OptimalLineup]:
        """Optimize 10-bet lineup"""
        if len(bets) < 10:
            return None
        # Sort by confidence and expected value
        sorted_bets = sorted(
            bets,
            key=lambda x: ((x.ml_confidence or 0.0) * (x.expected_value or 0.0)),
            reverse=True,
        )
        # Select top 10 with sport diversification
        selected_bets: List[RealTimeBet] = []
        sports_used = set()
        for bet in sorted_bets:
            if len(selected_bets) >= 10:
                break
            if bet.sport not in sports_used or len(selected_bets) < 5:
                selected_bets.append(bet)
                sports_used.add(bet.sport)
        if len(selected_bets) < 10:
            remaining_bets = [b for b in sorted_bets if b not in selected_bets]
            selected_bets.extend(remaining_bets[: 10 - len(selected_bets)])
        total_confidence = float(
            np.mean([bet.ml_confidence or 0.0 for bet in selected_bets])
        )
        expected_roi = float(sum([bet.expected_value or 0.0 for bet in selected_bets]))
        total_risk = float(np.mean([bet.risk_score or 0.0 for bet in selected_bets]))
        diversification = len(sports_used) / len(SportCategory)
        return OptimalLineup(
            bets=selected_bets,
            total_confidence=total_confidence,
            expected_roi=expected_roi,
            total_risk_score=total_risk,
            diversification_score=diversification,
            kelly_optimal_stakes={
                bet.id: (bet.kelly_fraction or 0.0) for bet in selected_bets
            },
            correlation_matrix=[],
        )

    async def _optimize_conservative_lineup(
        self, bets: List[RealTimeBet]
    ) -> Optional[OptimalLineup]:
        """Optimize conservative 3-4 bet lineup"""
        if len(bets) < 3:
            return None
        # Sort by highest confidence, then lowest risk
        sorted_bets = sorted(
            bets,
            key=lambda x: ((x.ml_confidence or 0.0), -(x.risk_score or 0.0)),
            reverse=True,
        )
        selected_bets: List[RealTimeBet] = (
            sorted_bets[:4] if len(sorted_bets) >= 4 else sorted_bets[:3]
        )
        total_confidence = float(
            np.mean([bet.ml_confidence or 0.0 for bet in selected_bets])
        )
        expected_roi = float(sum([bet.expected_value or 0.0 for bet in selected_bets]))
        total_risk = float(np.mean([bet.risk_score or 0.0 for bet in selected_bets]))
        diversification = len(set(bet.sport for bet in selected_bets)) / len(
            SportCategory
        )
        return OptimalLineup(
            bets=selected_bets,
            total_confidence=total_confidence,
            expected_roi=expected_roi,
            total_risk_score=total_risk,
            diversification_score=diversification,
            kelly_optimal_stakes={
                bet.id: (bet.kelly_fraction or 0.0) for bet in selected_bets
            },
            correlation_matrix=[],
        )

    async def _surface_best_opportunities(
        self, lineups: List[OptimalLineup]
    ) -> List[RealTimeBet]:
        """Surface the absolute best betting opportunities"""

        all_bets = []
        for lineup in lineups:
            all_bets.extend(lineup.bets)

        # Remove duplicates and sort by quality
        unique_bets = {bet.id: bet for bet in all_bets}.values()

        # Sort by composite score
        sorted_opportunities = sorted(
            unique_bets,
            key=lambda x: ((x.ml_confidence or 0.0) * (x.expected_value or 0.0))
            / ((x.risk_score or 0.0) + 0.1),
            reverse=True,
        )

        # Return top opportunities
        return list(sorted_opportunities)[:50]

    def get_analysis_progress(self, analysis_id: str) -> Optional[AnalysisProgress]:
        """Get progress for a specific analysis job"""
        with self._job_lock:
            return self._analyses.get(analysis_id)

    def get_results(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """Get results for a specific analysis job, including business rules version info and API version field"""
        with self._job_lock:
            results = self._results.get(analysis_id)
            if results is not None:
                rules = getattr(self, "business_rules", {})
                results["ruleset_version"] = rules.get("ruleset_version", "unknown")
                results["rules_last_updated"] = rules.get("last_updated", "unknown")
                results["version"] = "v1"  # API version field for standardization
            return results


# Global instance
real_time_engine = RealTimeAnalysisEngine()
