"""
CLV Computation Utilities

Utility functions for calculating and managing CLV (Closing Line Value) metrics
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import uuid


def generate_bet_id() -> str:
    """Generate a unique bet ID"""
    return f"bet_{uuid.uuid4().hex[:12]}"


def american_to_probability(odds: int) -> float:
    """Convert American odds to implied probability"""
    if odds > 0:
        return 100 / (odds + 100)
    else:
        return abs(odds) / (abs(odds) + 100)


def calculate_clv_percent(placed_odds: int, closing_odds: int) -> Optional[float]:
    """Calculate CLV percentage based on placed and closing odds."""
    if placed_odds in (None,) or closing_odds in (None,):
        return None
    if placed_odds == 0 or closing_odds == 0:
        # Gracefully handle bad data by returning flat CLV rather than None
        return 0.0
        
    try:
        placed_prob = american_to_probability(placed_odds)
        closing_prob = american_to_probability(closing_odds)
        
        # CLV = (closing_prob - placed_prob) / placed_prob * 100
        clv_percent = (closing_prob - placed_prob) / placed_prob * 100
        
        return round(clv_percent, 2)
        
    except (ZeroDivisionError, ValueError):
        return None


def is_profitable_clv(clv_percent: Optional[float], threshold: float = 0.0) -> Optional[bool]:
    """Check if bet has profitable CLV above threshold"""
    if clv_percent is None:
        return None
    return clv_percent > threshold


def get_clv_tier(clv_percent: Optional[float]) -> str:
    """Get CLV performance tier."""
    if clv_percent is None:
        return "unknown"
    if clv_percent >= 12:
        return "elite"
    if clv_percent >= 6:
        return "excellent"
    if clv_percent >= 3:
        return "good"
    if clv_percent >= 1:
        return "positive"
    if clv_percent >= -3:
        return "slight_negative"
    return "poor"


def calculate_roi_percent(total_profit_loss: float, total_stake: float) -> Optional[float]:
    """Calculate return on investment percentage.
    Tests expect 0.0 when stake is 0 or less rather than None.
    """
    if total_stake <= 0:
        return 0.0
    return round((total_profit_loss / total_stake) * 100, 2)


def calculate_win_rate(wins: int, total_bets: int) -> Optional[float]:
    """Calculate win rate percentage.
    Tests expect 0.0 when total_bets is 0 rather than None.
    """
    if total_bets <= 0:
        return 0.0
    return round((wins / total_bets) * 100, 2)


def get_clv_performance_score(
    avg_clv: float,
    consistency_factor: float,
    volume_factor: float,
    weights: Optional[Dict[str, float]] = None
) -> float:
    """
    Calculate comprehensive CLV performance score
    
    Args:
        avg_clv: Average CLV percentage
        consistency_factor: Measure of CLV consistency (0-1, higher is better)
        volume_factor: Betting volume factor (0-1, higher is better)
        weights: Custom weights for scoring components
    
    Returns:
        Performance score (0-100)
    """
    if weights is None:
        weights = {
            'clv': 0.6,      # 60% weight on CLV performance
            'consistency': 0.25,  # 25% weight on consistency
            'volume': 0.15   # 15% weight on volume
        }
    
    # Normalize CLV to 0-100 scale (assuming reasonable CLV range of -20% to +20%)
    clv_normalized = max(0.0, min(100.0, (avg_clv + 20) * 2.5))
    if avg_clv < 0:
        clv_normalized *= 0.7

    def _normalize_ratio(value: float) -> float:
        if value is None:
            return 0.0
        if value <= 1:
            return max(0.0, min(100.0, value * 100.0))
        return max(0.0, min(100.0, float(value)))

    consistency_normalized = _normalize_ratio(consistency_factor)
    volume_normalized = _normalize_ratio(volume_factor)
    
    # Calculate weighted score
    score = (
        clv_normalized * weights['clv'] +
        consistency_normalized * weights['consistency'] +
        volume_normalized * weights['volume']
    )
    
    return round(score, 1)


def categorize_bet_performance(clv_percent: Optional[float], profit_loss: Optional[float]) -> str:
    """Categorize overall bet performance"""
    if clv_percent is None:
        return "unknown"
    
    if profit_loss is None:
        # Performance based only on CLV
        if clv_percent >= 5:
            return "excellent_process"
        elif clv_percent >= 0:
            return "good_process"
        else:
            return "poor_process"
    else:
        # Performance based on both CLV and outcome
        if clv_percent >= 0 and profit_loss > 0:
            return "perfect"  # Good process, good outcome
        elif clv_percent >= 0 and profit_loss <= 0:
            return "unlucky"  # Good process, bad outcome
        elif clv_percent < 0 and profit_loss > 0:
            return "lucky"    # Bad process, good outcome
        else:
            return "poor"     # Bad process, bad outcome


def calculate_streak_metrics(results: List[str]) -> Dict[str, Any]:
    """Calculate winning/losing streak metrics"""
    if not results:
        return {"current_streak": 0, "max_win_streak": 0, "max_lose_streak": 0}
    
    current_streak = 0
    max_win_streak = 0
    max_lose_streak = 0
    current_win_streak = 0
    current_lose_streak = 0
    
    for result in results:
        if result == "win":
            current_win_streak += 1
            current_lose_streak = 0
            max_win_streak = max(max_win_streak, current_win_streak)
        elif result == "loss":
            current_lose_streak += 1
            current_win_streak = 0
            max_lose_streak = max(max_lose_streak, current_lose_streak)
        # Skip "push" results
    
    # Determine current streak type and length
    if results[-1] == "win":
        current_streak = current_win_streak
    elif results[-1] == "loss":
        current_streak = -current_lose_streak
    else:
        current_streak = 0
    
    return {
        "current_streak": current_streak,
        "max_win_streak": max_win_streak,
        "max_lose_streak": max_lose_streak
    }


def calculate_sharpe_ratio(returns: List[float], risk_free_rate: float = 0.0) -> Optional[float]:
    """Calculate Sharpe ratio for betting performance"""
    if len(returns) < 2:
        return None
    
    import statistics
    
    try:
        avg_return = statistics.mean(returns)
        std_return = statistics.stdev(returns)
        
        if std_return == 0:
            return None
        
        sharpe = (avg_return - risk_free_rate) / std_return
        return round(sharpe, 3)
    except statistics.StatisticsError:
        return None


def get_achievement_badges(user_stats: Dict[str, Any]) -> List[str]:
    """Determine achievement badges based on user statistics."""
    badges: List[str] = []

    avg_clv = user_stats.get('avg_clv_percent', 0) or 0
    total_bets = user_stats.get('total_bets', 0) or 0
    positive_clv_rate = user_stats.get('positive_clv_rate', 0) or 0
    win_rate = user_stats.get('win_rate', 0) or 0

    # CLV-based badges
    if avg_clv >= 12:
        badges.append("clv_master")
    elif avg_clv >= 8:
        badges.append("clv_elite")
    elif avg_clv >= 5:
        badges.append("clv_expert")
    elif avg_clv >= 0:
        badges.append("clv_positive")

    # Volume badges
    if total_bets >= 500:
        badges.extend(["volume_champion", "high_volume"])
    elif total_bets >= 200:
        badges.append("volume_champion")
    elif total_bets >= 50:
        badges.append("regular_bettor")
    elif total_bets > 0:
        badges.append("first_steps")

    # Consistency badges
    if positive_clv_rate >= 80:
        badges.append("consistent_performer")
    elif positive_clv_rate >= 60:
        badges.append("solid_performer")

    # Win rate badges (if available)
    if win_rate >= 60:
        badges.append("winner")
    elif win_rate >= 55:
        badges.append("profitable")

    return badges