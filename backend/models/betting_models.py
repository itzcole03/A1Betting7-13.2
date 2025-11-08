"""Betting models."""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class BankrollInfo(BaseModel):
    balance: float = 0.0
    totalDeposits: float = 0.0
    totalWithdrawals: float = 0.0
    totalWins: float = 0.0
    totalLosses: float = 0.0
    roi: float = 0.0


class TransactionRequest(BaseModel):
    amount: float
    type: str  # "deposit", "withdraw", "bet", "win", "loss"
    description: Optional[str] = None


class Transaction(BaseModel):
    id: str
    amount: float
    type: str
    description: Optional[str] = None
    timestamp: str


# Analytics Models
class EnhancedBet(BaseModel):
    id: int
    event: str
    confidence: float
    ai_insights: Optional[str] = None
    portfolio_optimization: Optional[dict] = None


class EnhancedBetsResponse(BaseModel):
    bets: List[EnhancedBet]
    message: str


@unified_router.get("/enhanced-bets", response_model=EnhancedBetsResponse)
async def get_enhanced_bets(
    min_confidence: int = 70,
    include_ai_insights: bool = True,
    include_portfolio_optimization: bool = True,
    max_results: int = 50,
):
    # Simulate some enhanced bets
    sample_bets = [
        EnhancedBet(
            id=1,
            event="Team A vs Team B",
            confidence=92.5,
            ai_insights="AI suggests Team A has a strong home advantage.",
        ),
        EnhancedBet(
            id=2,
            event="Team C vs Team D",
            confidence=88.0,
            ai_insights="Injury report favors Team D.",
            portfolio_optimization=(
                {"expected_value": 1.08, "risk": 0.03}
                if include_portfolio_optimization
                else None
            ),
        ),
    ]
    # Filter by min_confidence and limit results
    filtered_bets = [b for b in sample_bets if b.confidence >= min_confidence][
        :max_results
    ]
    return EnhancedBetsResponse(
        bets=filtered_bets, message="Sample enhanced bets returned."
    )


# In-memory analysis state (thread-safe)
_analysis_state = {
    "status": "idle",
    "last_run": None,
    "started_at": None,
    "message": "Analysis has not been started yet.",
}
_analysis_lock = threading.Lock()


