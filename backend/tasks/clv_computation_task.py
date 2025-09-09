"""
CLV Computation Scheduled Task

Background task for automatically computing CLV when closing odds become available
"""

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from backend.models.clv_bet_tracking import CLVBetTracking, CLVComputationStatus, BetStatus
from backend.utils.clv_utils import calculate_clv_percent, get_clv_tier
from backend.database import get_db
from backend.services.simple_propfinder_service import SimplePropfinderService

logger = logging.getLogger(__name__)


class CLVComputationTask:
    """Scheduled task for computing CLV on pending bets"""
    
    def __init__(self):
        self.logger = logging.getLogger("clv_computation")
        self.propfinder_service = SimplePropfinderService()
        self.is_running = False
        
    async def run_clv_computation_cycle(self, db: Session) -> Dict[str, Any]:
        """
        Run a single CLV computation cycle
        
        Returns:
            Dict with computation statistics and results
        """
        if self.is_running:
            self.logger.warning("CLV computation cycle already running, skipping")
            return {"status": "skipped", "reason": "already_running"}
        
        self.is_running = True
        cycle_start = datetime.now(timezone.utc)
        
        try:
            stats = {
                "cycle_start": cycle_start,
                "pending_bets_found": 0,
                "clv_computed": 0,
                "clv_errors": 0,
                "closing_odds_found": 0,
                "closing_odds_not_found": 0,
                "games_processed": 0
            }
            
            # Find all pending CLV bets from the last 7 days
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=7)
            
            pending_bets = db.query(CLVBetTracking).filter(
                and_(
                    CLVBetTracking.clv_status == CLVComputationStatus.PENDING,
                    CLVBetTracking.placed_at >= cutoff_date
                )
            ).all()
            
            stats["pending_bets_found"] = len(pending_bets)
            self.logger.info(f"Found {len(pending_bets)} pending bets for CLV computation")
            
            if not pending_bets:
                return stats
            
            # Group bets by game/sport for efficient odds fetching
            games_to_process = self._group_bets_by_game(pending_bets)
            stats["games_processed"] = len(games_to_process)
            
            # Process each game group
            for game_key, bets_group in games_to_process.items():
                try:
                    await self._process_game_bets(db, game_key, bets_group, stats)
                except Exception as e:
                    self.logger.error(f"Error processing game {game_key}: {e}")
                    continue
            
            # Commit all changes
            db.commit()
            
            cycle_end = datetime.now(timezone.utc)
            stats["cycle_end"] = cycle_end
            stats["duration_seconds"] = (cycle_end - cycle_start).total_seconds()
            
            self.logger.info(
                f"CLV computation cycle completed: "
                f"{stats['clv_computed']} computed, "
                f"{stats['clv_errors']} errors, "
                f"duration: {stats['duration_seconds']:.1f}s"
            )
            
            return stats
            
        except Exception as e:
            db.rollback()
            self.logger.error(f"CLV computation cycle failed: {e}", exc_info=True)
            raise
        finally:
            self.is_running = False
    
    def _group_bets_by_game(self, bets: List[CLVBetTracking]) -> Dict[str, List[CLVBetTracking]]:
        """Group bets by game/sport for efficient processing"""
        games = {}
        
        for bet in bets:
            # Create a game key based on sport, teams, and game date
            game_date = getattr(bet, 'game_start_time')
            if game_date:
                game_date_str = game_date.strftime('%Y-%m-%d')
            else:
                # Use placed date if game_start_time not available
                game_date_str = getattr(bet, 'placed_at').strftime('%Y-%m-%d')
            
            game_key = f"{getattr(bet, 'sport')}:{getattr(bet, 'team')}:{getattr(bet, 'opponent')}:{game_date_str}"
            
            if game_key not in games:
                games[game_key] = []
            games[game_key].append(bet)
        
        return games
    
    async def _process_game_bets(
        self, 
        db: Session, 
        game_key: str, 
        bets: List[CLVBetTracking], 
        stats: Dict[str, Any]
    ):
        """Process all bets for a specific game"""
        sport, team, opponent, game_date = game_key.split(':', 3)
        
        # For each bet in this game, try to find closing odds
        for bet in bets:
            try:
                closing_odds = await self._fetch_closing_odds(bet)
                
                if closing_odds:
                    stats["closing_odds_found"] += 1
                    
                    # Calculate CLV
                    placed_odds = getattr(bet, 'placed_odds')
                    clv_percent = calculate_clv_percent(placed_odds, closing_odds['odds'])
                    
                    if clv_percent is not None:
                        # Update bet record
                        setattr(bet, 'closing_odds', closing_odds['odds'])
                        if 'line' in closing_odds:
                            setattr(bet, 'closing_line', closing_odds['line'])
                        setattr(bet, 'closing_captured_at', datetime.now(timezone.utc))
                        setattr(bet, 'clv_percent', clv_percent)
                        setattr(bet, 'clv_status', CLVComputationStatus.COMPUTED)
                        setattr(bet, 'clv_computed_at', datetime.now(timezone.utc))
                        
                        # Calculate movements if applicable
                        placed_line = getattr(bet, 'placed_line')
                        if placed_line is not None and 'line' in closing_odds:
                            setattr(bet, 'line_movement', closing_odds['line'] - placed_line)
                        
                        setattr(bet, 'odds_movement', closing_odds['odds'] - placed_odds)
                        
                        stats["clv_computed"] += 1
                        
                        self.logger.debug(
                            f"CLV computed for bet {getattr(bet, 'bet_id')}: {clv_percent:.2f}%"
                        )
                    else:
                        # Mark as error
                        setattr(bet, 'clv_status', CLVComputationStatus.ERROR)
                        stats["clv_errors"] += 1
                else:
                    stats["closing_odds_not_found"] += 1
                    # Don't update status - keep as pending for future attempts
                    
            except Exception as e:
                self.logger.error(f"Error processing bet {getattr(bet, 'bet_id')}: {e}")
                setattr(bet, 'clv_status', CLVComputationStatus.ERROR)
                stats["clv_errors"] += 1
    
    async def _fetch_closing_odds(self, bet: CLVBetTracking) -> Optional[Dict[str, Any]]:
        """
        Fetch closing odds for a specific bet
        
        This is a simplified implementation - in production, you would integrate
        with your actual odds providers to get historical closing odds.
        """
        try:
            # For demo purposes, simulate fetching closing odds
            # In production, this would integrate with:
            # - TheOdds API historical endpoints
            # - SportRadar historical odds
            # - Your internal odds database
            
            sport = getattr(bet, 'sport')
            market = getattr(bet, 'market')
            player = getattr(bet, 'player')
            bet_type = getattr(bet, 'bet_type')
            
            # Simulate different scenarios
            import random
            
            # 70% chance of finding closing odds
            if random.random() < 0.7:
                placed_odds = getattr(bet, 'placed_odds')
                
                # Simulate realistic line movement
                if bet_type.lower() in ['over', 'under']:
                    # Simulate line movement of -0.5 to +0.5
                    line_movement = random.uniform(-0.5, 0.5)
                    placed_line = getattr(bet, 'placed_line') or 0
                    closing_line = placed_line + line_movement
                    
                    # Simulate odds movement of -20 to +20
                    odds_movement = random.randint(-20, 20)
                    closing_odds = placed_odds + odds_movement
                    
                    return {
                        'odds': closing_odds,
                        'line': closing_line,
                        'source': 'simulated',
                        'timestamp': datetime.now(timezone.utc)
                    }
                else:
                    # For spread/moneyline, just odds movement
                    odds_movement = random.randint(-15, 15)
                    closing_odds = placed_odds + odds_movement
                    
                    return {
                        'odds': closing_odds,
                        'source': 'simulated',
                        'timestamp': datetime.now(timezone.utc)
                    }
            else:
                # No closing odds found
                return None
                
        except Exception as e:
            self.logger.error(f"Error fetching closing odds: {e}")
            return None
    
    async def run_continuous_monitoring(self, interval_minutes: int = 60):
        """
        Run continuous CLV computation monitoring
        
        Args:
            interval_minutes: How often to run computation cycles
        """
        self.logger.info(f"Starting continuous CLV monitoring (interval: {interval_minutes} minutes)")
        
        while True:
            try:
                # Get database session
                db = next(get_db())
                
                # Run computation cycle
                stats = await self.run_clv_computation_cycle(db)
                
                # Log summary
                if stats.get("clv_computed", 0) > 0:
                    self.logger.info(
                        f"CLV cycle completed: {stats['clv_computed']} computed, "
                        f"{stats['clv_errors']} errors"
                    )
                
                # Close database session
                db.close()
                
                # Wait for next cycle
                await asyncio.sleep(interval_minutes * 60)
                
            except Exception as e:
                self.logger.error(f"Error in continuous monitoring: {e}", exc_info=True)
                # Wait a bit before retrying
                await asyncio.sleep(300)  # 5 minutes
    
    async def manual_computation_trigger(self, db: Session, bet_ids: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Manually trigger CLV computation for specific bets or all pending bets
        
        Args:
            db: Database session
            bet_ids: Optional list of specific bet IDs to process
        
        Returns:
            Computation results
        """
        if bet_ids:
            # Process specific bets
            bets = db.query(CLVBetTracking).filter(
                CLVBetTracking.bet_id.in_(bet_ids)
            ).all()
            
            self.logger.info(f"Manual CLV computation triggered for {len(bet_ids)} specific bets")
        else:
            # Process all pending bets
            bets = db.query(CLVBetTracking).filter(
                CLVBetTracking.clv_status == CLVComputationStatus.PENDING
            ).all()
            
            self.logger.info(f"Manual CLV computation triggered for all {len(bets)} pending bets")
        
        if not bets:
            return {"status": "no_bets_to_process", "count": 0}
        
        # Group and process bets
        games_to_process = self._group_bets_by_game(bets)
        
        stats = {
            "manual_trigger": True,
            "pending_bets_found": len(bets),
            "clv_computed": 0,
            "clv_errors": 0,
            "closing_odds_found": 0,
            "closing_odds_not_found": 0,
            "games_processed": len(games_to_process)
        }
        
        # Process each game group
        for game_key, bets_group in games_to_process.items():
            try:
                await self._process_game_bets(db, game_key, bets_group, stats)
            except Exception as e:
                self.logger.error(f"Error processing game {game_key}: {e}")
                continue
        
        # Commit changes
        db.commit()
        
        return stats


# Global instance for use in API endpoints
clv_computation_task = CLVComputationTask()


async def start_clv_background_task():
    """Start the background CLV computation task"""
    try:
        await clv_computation_task.run_continuous_monitoring(interval_minutes=60)
    except Exception as e:
        logger.error(f"CLV background task failed: {e}", exc_info=True)


if __name__ == "__main__":
    # For testing purposes
    import asyncio
    logging.basicConfig(level=logging.INFO)
    asyncio.run(start_clv_background_task())