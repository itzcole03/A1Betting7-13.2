"""
Line Movement Analytics Service
Processes historical odds data to detect movements, steam, and volatility
"""

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import statistics
import math

@dataclass
class MovementAnalysis:
    """Line movement analysis result"""
    prop_id: str
    sportsbook: str
    
    # Movement metrics
    movement_1h: Optional[float] = None
    movement_6h: Optional[float] = None  
    movement_24h: Optional[float] = None
    movement_total: Optional[float] = None
    
    # Velocity metrics (change per hour)
    velocity_1h: Optional[float] = None
    velocity_recent: Optional[float] = None
    
    # Volatility metrics
    volatility_score: Optional[float] = None
    direction_changes: int = 0
    
    # Steam detection
    is_steam: bool = False
    steam_threshold: Optional[float] = None
    steam_book_count: Optional[int] = None
    steam_detected_at: Optional[datetime] = None
    
    # Reference data
    opening_line: Optional[float] = None
    current_line: Optional[float] = None
    opening_odds: Optional[int] = None
    current_odds: Optional[int] = None
    
    computed_at: datetime = None
    
    def __post_init__(self):
        if self.computed_at is None:
            self.computed_at = datetime.now(timezone.utc)

@dataclass 
class SteamAlert:
    """Steam detection alert"""
    prop_id: str
    detected_at: datetime
    books_moving: List[str]
    movement_size: float
    synchronized_window_minutes: int
    confidence_score: float

class LineMovementAnalytics:
    """Service for analyzing line movements and detecting patterns"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Configuration
        self.steam_threshold = 0.5  # Minimum line movement to consider steam
        self.steam_window_minutes = 30  # Time window for synchronized movement
        self.steam_min_books = 3  # Minimum books for steam detection
        self.volatility_window_hours = 12  # Hours for volatility calculation
        
        # Analysis cache
        self.movement_cache = {}  # prop_id -> MovementAnalysis
        self.steam_alerts = []  # Recent steam alerts
    
    async def analyze_prop_movement(
        self, 
        prop_id: str, 
        sportsbook: str,
        historical_data: List[Dict[str, Any]]
    ) -> MovementAnalysis:
        """Analyze line movement for a specific prop and sportsbook"""
        
        if not historical_data or len(historical_data) < 2:
            return MovementAnalysis(prop_id=prop_id, sportsbook=sportsbook)
        
        # Sort by timestamp
        sorted_data = sorted(historical_data, key=lambda x: x['captured_at'])
        
        # Calculate time-based movements
        analysis = MovementAnalysis(prop_id=prop_id, sportsbook=sportsbook)
        
        current_time = datetime.now(timezone.utc)
        opening_data = sorted_data[0]
        latest_data = sorted_data[-1]
        
        # Set reference points
        analysis.opening_line = opening_data.get('line')
        analysis.current_line = latest_data.get('line') 
        analysis.opening_odds = opening_data.get('over_odds')
        analysis.current_odds = latest_data.get('over_odds')
        
        if analysis.opening_line and analysis.current_line:
            analysis.movement_total = analysis.current_line - analysis.opening_line
            
            # Time-based movements
            analysis.movement_1h = self._calculate_movement_in_timeframe(
                sorted_data, hours_back=1
            )
            analysis.movement_6h = self._calculate_movement_in_timeframe(
                sorted_data, hours_back=6
            )
            analysis.movement_24h = self._calculate_movement_in_timeframe(
                sorted_data, hours_back=24
            )
            
            # Velocity calculations
            if analysis.movement_1h is not None:
                analysis.velocity_1h = analysis.movement_1h  # Already per hour
            
            if analysis.movement_total is not None:
                total_hours = self._get_total_hours_span(sorted_data)
                if total_hours > 0:
                    analysis.velocity_recent = analysis.movement_total / total_hours
            
            # Volatility analysis
            analysis.volatility_score = self._calculate_volatility(sorted_data)
            analysis.direction_changes = self._count_direction_changes(sorted_data)
        
        # Cache result
        cache_key = f"{prop_id}:{sportsbook}"
        self.movement_cache[cache_key] = analysis
        
        self.logger.debug(f"Analyzed movement for {prop_id} ({sportsbook})")
        return analysis
    
    def _calculate_movement_in_timeframe(
        self, 
        sorted_data: List[Dict[str, Any]], 
        hours_back: int
    ) -> Optional[float]:
        """Calculate line movement within specific timeframe"""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        
        # Find data points within timeframe
        timeframe_data = []
        for point in sorted_data:
            point_time = datetime.fromisoformat(point['captured_at'].replace('Z', '+00:00'))
            if point_time > cutoff_time:
                timeframe_data.append(point)
        
        if len(timeframe_data) < 2:
            return None
        
        first_line = timeframe_data[0].get('line')
        last_line = timeframe_data[-1].get('line')
        
        if first_line is not None and last_line is not None:
            return last_line - first_line
        
        return None
    
    def _get_total_hours_span(self, sorted_data: List[Dict[str, Any]]) -> float:
        """Get total time span of data in hours"""
        if len(sorted_data) < 2:
            return 0
        
        first_time = datetime.fromisoformat(sorted_data[0]['captured_at'].replace('Z', '+00:00'))
        last_time = datetime.fromisoformat(sorted_data[-1]['captured_at'].replace('Z', '+00:00'))
        
        return (last_time - first_time).total_seconds() / 3600
    
    def _calculate_volatility(self, sorted_data: List[Dict[str, Any]]) -> Optional[float]:
        """Calculate volatility score based on line movements"""
        if len(sorted_data) < 3:
            return None
        
        # Get line changes between consecutive points
        line_changes = []
        for i in range(1, len(sorted_data)):
            prev_line = sorted_data[i-1].get('line')
            curr_line = sorted_data[i].get('line')
            
            if prev_line is not None and curr_line is not None:
                change = curr_line - prev_line
                line_changes.append(abs(change))  # Use absolute change for volatility
        
        if not line_changes:
            return None
        
        # Standard deviation of absolute changes
        try:
            volatility = statistics.stdev(line_changes) if len(line_changes) > 1 else 0
            return round(volatility, 3)
        except statistics.StatisticsError:
            return None
    
    def _count_direction_changes(self, sorted_data: List[Dict[str, Any]]) -> int:
        """Count number of direction changes in line movement"""
        if len(sorted_data) < 3:
            return 0
        
        direction_changes = 0
        prev_direction = None
        
        for i in range(1, len(sorted_data)):
            prev_line = sorted_data[i-1].get('line')
            curr_line = sorted_data[i].get('line')
            
            if prev_line is not None and curr_line is not None:
                change = curr_line - prev_line
                
                if change != 0:
                    current_direction = 'up' if change > 0 else 'down'
                    
                    if prev_direction and prev_direction != current_direction:
                        direction_changes += 1
                    
                    prev_direction = current_direction
        
        return direction_changes
    
    async def detect_steam_across_books(
        self, 
        prop_id: str, 
        all_books_data: Dict[str, List[Dict[str, Any]]]
    ) -> Optional[SteamAlert]:
        """Detect steam by analyzing synchronized movement across multiple books"""
        
        if len(all_books_data) < self.steam_min_books:
            return None
        
        current_time = datetime.now(timezone.utc)
        cutoff_time = current_time - timedelta(minutes=self.steam_window_minutes)
        
        # Analyze recent movements for each book
        recent_movements = {}
        
        for sportsbook, data in all_books_data.items():
            if not data or len(data) < 2:
                continue
            
            # Filter to recent data
            recent_data = []
            for point in data:
                point_time = datetime.fromisoformat(point['captured_at'].replace('Z', '+00:00'))
                if point_time > cutoff_time:
                    recent_data.append(point)
            
            if len(recent_data) >= 2:
                # Calculate movement in window
                first_line = recent_data[0].get('line')
                last_line = recent_data[-1].get('line')
                
                if first_line is not None and last_line is not None:
                    movement = last_line - first_line
                    if abs(movement) >= self.steam_threshold:
                        recent_movements[sportsbook] = movement
        
        # Check for synchronized movement
        if len(recent_movements) >= self.steam_min_books:
            movements = list(recent_movements.values())
            
            # Check if movements are in same direction and significant
            if self._is_synchronized_movement(movements):
                avg_movement = statistics.mean(movements)
                confidence = self._calculate_steam_confidence(movements)
                
                steam_alert = SteamAlert(
                    prop_id=prop_id,
                    detected_at=current_time,
                    books_moving=list(recent_movements.keys()),
                    movement_size=avg_movement,
                    synchronized_window_minutes=self.steam_window_minutes,
                    confidence_score=confidence
                )
                
                # Cache alert
                self.steam_alerts.append(steam_alert)
                
                self.logger.info(
                    f"Steam detected: {prop_id} - {len(recent_movements)} books, "
                    f"avg movement: {avg_movement:.2f}, confidence: {confidence:.2f}"
                )
                
                return steam_alert
        
        return None
    
    def _is_synchronized_movement(self, movements: List[float]) -> bool:
        """Check if movements are synchronized (same direction, similar magnitude)"""
        if not movements:
            return False
        
        # Check if all movements are in same direction
        positive_count = sum(1 for m in movements if m > 0)
        negative_count = sum(1 for m in movements if m < 0)
        
        # At least 80% in same direction
        same_direction_ratio = max(positive_count, negative_count) / len(movements)
        
        return same_direction_ratio >= 0.8
    
    def _calculate_steam_confidence(self, movements: List[float]) -> float:
        """Calculate confidence score for steam detection"""
        if not movements:
            return 0.0
        
        # Factors: consistency, magnitude, book count
        magnitude_avg = statistics.mean(abs(m) for m in movements)
        magnitude_score = min(magnitude_avg / 2.0, 1.0)  # Cap at 1.0
        
        # Consistency (lower std dev = higher consistency)
        try:
            consistency = 1.0 - min(statistics.stdev(movements) / magnitude_avg, 1.0)
        except (statistics.StatisticsError, ZeroDivisionError):
            consistency = 0.5
        
        # Book count bonus
        book_count_score = min(len(movements) / 5.0, 1.0)  # Max at 5 books
        
        # Combined confidence
        confidence = (magnitude_score * 0.4 + consistency * 0.4 + book_count_score * 0.2)
        
        return round(confidence, 3)
    
    async def get_movement_summary(self, prop_id: str) -> Dict[str, Any]:
        """Get comprehensive movement summary for a prop across all books"""
        summary = {
            'prop_id': prop_id,
            'books_analyzed': [],
            'total_books': 0,
            'steam_detected': False,
            'max_movement_24h': 0,
            'most_volatile_book': None,
            'consensus_movement': None,
            'analyzed_at': datetime.now(timezone.utc).isoformat()
        }
        
        # Get cached analyses
        book_analyses = {}
        for cache_key, analysis in self.movement_cache.items():
            if analysis.prop_id == prop_id:
                book_analyses[analysis.sportsbook] = analysis
        
        if book_analyses:
            summary['books_analyzed'] = list(book_analyses.keys())
            summary['total_books'] = len(book_analyses)
            
            # Find maximum 24h movement
            movements_24h = [
                abs(a.movement_24h) for a in book_analyses.values() 
                if a.movement_24h is not None
            ]
            if movements_24h:
                summary['max_movement_24h'] = max(movements_24h)
            
            # Find most volatile book
            volatilities = [
                (book, a.volatility_score) for book, a in book_analyses.items()
                if a.volatility_score is not None
            ]
            if volatilities:
                most_volatile = max(volatilities, key=lambda x: x[1])
                summary['most_volatile_book'] = {
                    'sportsbook': most_volatile[0],
                    'volatility_score': most_volatile[1]
                }
            
            # Calculate consensus movement
            total_movements = [
                a.movement_total for a in book_analyses.values()
                if a.movement_total is not None
            ]
            if total_movements:
                summary['consensus_movement'] = statistics.median(total_movements)
        
        # Check for recent steam alerts
        recent_steam = [
            alert for alert in self.steam_alerts
            if (alert.prop_id == prop_id and 
                alert.detected_at > datetime.now(timezone.utc) - timedelta(hours=6))
        ]
        
        if recent_steam:
            summary['steam_detected'] = True
            summary['steam_alerts'] = [
                {
                    'detected_at': alert.detected_at.isoformat(),
                    'books_count': len(alert.books_moving),
                    'movement_size': alert.movement_size,
                    'confidence': alert.confidence_score
                }
                for alert in recent_steam
            ]
        
        return summary
    
    def get_service_stats(self) -> Dict[str, Any]:
        """Get analytics service statistics"""
        return {
            'cached_analyses': len(self.movement_cache),
            'steam_alerts_24h': len([
                a for a in self.steam_alerts
                if a.detected_at > datetime.now(timezone.utc) - timedelta(hours=24)
            ]),
            'steam_threshold': self.steam_threshold,
            'steam_window_minutes': self.steam_window_minutes,
            'steam_min_books': self.steam_min_books
        }

# Global service instance
line_movement_analytics = LineMovementAnalytics()

def get_movement_analytics() -> LineMovementAnalytics:
    """Get the line movement analytics service"""
    return line_movement_analytics