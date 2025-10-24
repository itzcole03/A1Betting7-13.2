"""
Odds Aggregation Service - Multi-sportsbook odds comparison and arbitrage detection
Provides best-line identification and real-time arbitrage opportunities
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import os

from fastapi import HTTPException

# Import line movement tracking for integration
from .line_movement_service import trigger_snapshot
from backend.odds.odds_snapshot_store import odds_snapshot_store
from backend.odds.odds_ingestion_service import refresh_market as refresh_odds_market
from backend.odds.odds_models import OddsSnapshot

logger = logging.getLogger(__name__)


def _snapshot_sport_label(sport: str | None) -> str:
    if not sport:
        return "MLB"
    low = sport.lower()
    if low in {"mlb", "baseball_mlb"}:
        return "MLB"
    return sport.upper()

@dataclass
class BookLine:
    """Individual sportsbook line"""
    book_id: str
    book_name: str
    market: str
    player_name: str
    stat_type: str
    line: float
    over_price: int
    under_price: int
    timestamp: datetime
    
@dataclass
class CanonicalLine:
    """Canonical representation of best available lines"""
    market: str
    player_name: str
    stat_type: str
    best_over_book: str
    best_over_price: int
    best_over_line: float
    best_under_book: str
    best_under_price: int
    best_under_line: float
    books: List[BookLine]
    no_vig_fair_price: float
    arbitrage_opportunity: bool
    arbitrage_profit: float

@dataclass
class ArbitrageOpportunity:
    """Arbitrage betting opportunity"""
    market: str
    player_name: str
    stat_type: str
    over_book: str
    over_price: int
    over_line: float
    under_book: str
    under_price: int
    under_line: float
    profit_percentage: float
    stake_distribution: Dict[str, float]
    timestamp: datetime

class OddsAggregationService:
    """Service for aggregating odds from multiple sportsbooks"""
    
    def __init__(self):
        self.api_key = (
            os.getenv("THE_ODDS_API_KEY")
            or os.getenv("THEODDS_API_KEY")
            or os.getenv("ODDS_API_KEY")
        )
        self.cache_ttl = 30  # 30 seconds for odds data
        self.odds_cache: Dict[str, Dict] = {}
        self.snapshot_stale_seconds = 120
        
        # Mock sportsbook data for demo/offline mode
        book_names = ["DraftKings", "FanDuel", "BetMGM", "Caesars", "PointsBet"]
        self.mock_books = [
            {"id": self._normalize_book_id(name), "name": name}
            for name in book_names
        ]
    
    async def get_available_books(self) -> List[Dict[str, str]]:
        """Get list of available sportsbooks using recent snapshots when possible."""
        sport_label = _snapshot_sport_label("MLB")
        try:
            await self._ensure_snapshot_freshness(sport_label)
            snaps = await odds_snapshot_store.get_latest(sport=sport_label, market="player_props", limit=200)
            books = sorted({snap.book for snap in snaps if getattr(snap, "book", None)})
            if books:
                return [{"id": self._normalize_book_id(name), "name": name} for name in books]
        except Exception as exc:
            logger.warning("Failed to derive sportsbook list from snapshots: %s", exc)
        return self.mock_books
    
    async def fetch_player_props(self, sport: str = "baseball_mlb") -> List[BookLine]:
        """Fetch player props derived from in-memory snapshots"""
        sport_label = _snapshot_sport_label(sport)
        cache_key = f"props:{sport_label}"
        cached = self.odds_cache.get(cache_key)
        if cached and datetime.now() - cached["timestamp"] < timedelta(seconds=self.cache_ttl):
            return cached["data"]

        try:
            await self._ensure_snapshot_freshness(sport_label)
            snaps = await odds_snapshot_store.get_latest(sport=sport_label, market="player_props", limit=2000)
        except Exception as exc:
            logger.error("Failed to load snapshot odds: %s", exc)
            snaps = []

        lines = self._snapshots_to_booklines(snaps) if snaps else []
        if not lines:
            lines = self._generate_mock_props()

        self.odds_cache[cache_key] = {
            "data": lines,
            "timestamp": datetime.now()
        }

        return lines
    
    def _generate_mock_props(self) -> List[BookLine]:
        """Generate mock prop data for demo/offline mode"""
        import random
        
        mock_players = [
            "Aaron Judge", "Mookie Betts", "Ronald Acuna Jr.", "Vladimir Guerrero Jr.",
            "Mike Trout", "Fernando Tatis Jr.", "Juan Soto", "Shohei Ohtani"
        ]
        
        stat_types = ["hits", "total_bases", "home_runs", "rbis", "runs_scored"]
        
        lines = []
        
        for player in mock_players[:4]:  # Limit for demo
            for stat in stat_types[:2]:  # Limit stat types
                base_line = random.uniform(0.5, 3.5)
                
                for book in self.mock_books:
                    # Add some variance in lines between books
                    line_variance = random.uniform(-0.1, 0.1)
                    book_line = max(0.5, base_line + line_variance)
                    
                    # Generate realistic odds with variance
                    base_over_odds = random.randint(-130, -90)
                    base_under_odds = random.randint(-130, -90)
                    
                    line_obj = BookLine(
                        book_id=book["id"],
                        book_name=book["name"],
                        market="Mock Game",
                        player_name=player,
                        stat_type=stat,
                        line=round(book_line, 1),
                        over_price=base_over_odds + random.randint(-10, 10),
                        under_price=base_under_odds + random.randint(-10, 10),
                        timestamp=datetime.now()
                    )
                    lines.append(line_obj)
        
        return lines

    async def _ensure_snapshot_freshness(self, sport_label: str, market: str = "player_props") -> None:
        try:
            snaps = await odds_snapshot_store.get_latest(sport=sport_label, market=market, limit=10)
        except Exception as exc:
            logger.warning("Snapshot retrieval failed: %s", exc)
            snaps = []

        if not snaps:
            await refresh_odds_market(sport_label, market)
            return

        latest_capture = max(s.captured_at for s in snaps)
        now = datetime.now(timezone.utc)
        if (now - latest_capture).total_seconds() > self.snapshot_stale_seconds:
            await refresh_odds_market(sport_label, market)

    @staticmethod
    def _normalize_book_id(name: str) -> str:
        return name.strip().lower().replace(" ", "_")

    def _snapshots_to_booklines(self, snaps: List[OddsSnapshot]) -> List[BookLine]:
        grouped: Dict[tuple[str, str], Dict[str, Any]] = {}
        for snap in snaps:
            if not snap.book or not snap.selection_key:
                continue
            key = (snap.book, snap.selection_key)
            entry = grouped.setdefault(
                key,
                {
                    "book_id": self._normalize_book_id(snap.book),
                    "book_name": snap.book,
                    "market": snap.team or snap.market or "MLB",
                    "player_name": snap.player or snap.selection_key,
                    "stat_type": snap.selection_key.split(":")[-1] if snap.selection_key else snap.market,
                    "line": snap.line,
                    "over_price": None,
                    "under_price": None,
                    "timestamp": snap.captured_at,
                },
            )
            if snap.line is not None:
                entry["line"] = snap.line
            entry["timestamp"] = max(entry["timestamp"], snap.captured_at)
            if snap.side == "over":
                entry["over_price"] = snap.american_odds
            elif snap.side == "under":
                entry["under_price"] = snap.american_odds

        book_lines: List[BookLine] = []
        for entry in grouped.values():
            over_price = entry.get("over_price")
            under_price = entry.get("under_price")
            line_value = entry.get("line")
            if over_price is None or under_price is None or line_value is None:
                continue
            try:
                line_float = float(line_value)
            except (TypeError, ValueError):
                continue
            timestamp = entry.get("timestamp")
            if not isinstance(timestamp, datetime):
                timestamp = datetime.now()
            book_lines.append(
                BookLine(
                    book_id=entry["book_id"],
                    book_name=entry["book_name"],
                    market=entry["market"],
                    player_name=entry["player_name"],
                    stat_type=entry["stat_type"],
                    line=line_float,
                    over_price=int(over_price),
                    under_price=int(under_price),
                    timestamp=timestamp,
                )
            )
        return book_lines
    
    async def find_best_lines(self, sport: str = "baseball_mlb") -> List[CanonicalLine]:
        """Find best available lines across all sportsbooks"""
        all_lines = await self.fetch_player_props(sport)
        
        # Group by player and stat type
        grouped_lines: Dict[str, List[BookLine]] = {}
        
        for line in all_lines:
            key = f"{line.player_name}:{line.stat_type}"
            if key not in grouped_lines:
                grouped_lines[key] = []
            grouped_lines[key].append(line)
        
        canonical_lines = []
        
        for key, lines in grouped_lines.items():
            if len(lines) < 2:  # Need at least 2 books for comparison
                continue
                
            # Find best over and under prices
            best_over = max(lines, key=lambda x: x.over_price)
            best_under = max(lines, key=lambda x: x.under_price)
            
            # Calculate no-vig fair price
            over_implied = self._american_to_probability(best_over.over_price)
            under_implied = self._american_to_probability(best_under.under_price)
            no_vig_fair = over_implied / (over_implied + under_implied)
            
            # Check for arbitrage opportunity
            total_implied = over_implied + under_implied
            arbitrage_opportunity = total_implied < 1.0
            arbitrage_profit = (1.0 - total_implied) * 100 if arbitrage_opportunity else 0.0
            
            canonical_line = CanonicalLine(
                market=lines[0].market,
                player_name=lines[0].player_name,
                stat_type=lines[0].stat_type,
                best_over_book=best_over.book_name,
                best_over_price=best_over.over_price,
                best_over_line=best_over.line,
                best_under_book=best_under.book_name,
                best_under_price=best_under.under_price,
                best_under_line=best_under.line,
                books=lines,
                no_vig_fair_price=no_vig_fair,
                arbitrage_opportunity=arbitrage_opportunity,
                arbitrage_profit=arbitrage_profit
            )
            
            canonical_lines.append(canonical_line)
            
            # 🚀 TRIGGER LINE MOVEMENT SNAPSHOT
            try:
                # Use best line for movement tracking
                best_line = best_over.line  # or choose based on strategy
                best_odds = best_over.over_price
                
                await trigger_snapshot(
                    sport=sport.upper().replace("BASEBALL_", "").replace("_", ""),  # MLB
                    player=lines[0].player_name,
                    market=lines[0].stat_type,
                    line=best_line,
                    best_odds=best_odds,
                    source="odds_aggregation"
                )
                
                logger.debug(f"Line movement snapshot triggered for {lines[0].player_name} {lines[0].stat_type}")
                
            except Exception as e:
                logger.warning(f"Failed to trigger line movement snapshot: {e}")
        
        # Sort by arbitrage profit (highest first)
        canonical_lines.sort(key=lambda x: x.arbitrage_profit, reverse=True)
        
        return canonical_lines
    
    async def find_arbitrage_opportunities(self, sport: str = "baseball_mlb", min_profit: float = 1.0) -> List[ArbitrageOpportunity]:
        """Find arbitrage opportunities with minimum profit threshold"""
        best_lines = await self.find_best_lines(sport)
        
        opportunities = []
        
        for line in best_lines:
            if line.arbitrage_opportunity and line.arbitrage_profit >= min_profit:
                # Calculate optimal stake distribution
                over_implied = self._american_to_probability(line.best_over_price)
                under_implied = self._american_to_probability(line.best_under_price)
                
                total_stake = 100  # $100 total bet
                over_stake = total_stake * (under_implied / (over_implied + under_implied))
                under_stake = total_stake * (over_implied / (over_implied + under_implied))
                
                opportunity = ArbitrageOpportunity(
                    market=line.market,
                    player_name=line.player_name,
                    stat_type=line.stat_type,
                    over_book=line.best_over_book,
                    over_price=line.best_over_price,
                    over_line=line.best_over_line,
                    under_book=line.best_under_book,
                    under_price=line.best_under_price,
                    under_line=line.best_under_line,
                    profit_percentage=line.arbitrage_profit,
                    stake_distribution={
                        "over": round(over_stake, 2),
                        "under": round(under_stake, 2)
                    },
                    timestamp=datetime.now()
                )
                
                opportunities.append(opportunity)
        
        return opportunities
    
    def _american_to_probability(self, american_odds: int) -> float:
        """Convert American odds to implied probability"""
        if american_odds > 0:
            return 100 / (american_odds + 100)
        else:
            return abs(american_odds) / (abs(american_odds) + 100)

# Singleton instance
_odds_service = None

def get_odds_service() -> OddsAggregationService:
    """Get singleton odds aggregation service instance"""
    global _odds_service
    if _odds_service is None:
        _odds_service = OddsAggregationService()
    return _odds_service
