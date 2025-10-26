"""
Performance Routes

This module contains all performance-related endpoints including stats and transactions.
"""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException

from backend.models.api_models import (
    ActiveBetModel,
    ActiveBetsResponse,
    PerformanceStats,
    TransactionModel,
    TransactionsResponse,
)

# Temporarily commenting out corrupted data_fetchers
# from services.data_fetchers import fetch_performance_stats_internal
from backend.services.transaction_service import transaction_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Performance"])


@router.get("/v1/performance-stats", response_model=PerformanceStats)
async def get_performance_stats(
    current_user: Optional[Any] = None,
    db: Optional[Any] = None,
) -> PerformanceStats:
    """Get performance statistics for the current user"""
    try:
        stats = await fetch_performance_stats_internal()
        logger.info("Performance stats retrieved successfully")
        return ResponseBuilder.success(stats)

    except Exception as e:
        logger.error(f"Error fetching performance stats: {e}")
        raise BusinessLogicException("Failed to fetch performance statistics")


@router.get("/transactions", response_model=TransactionsResponse)
async def get_transactions(
    current_user: Optional[Any] = None,
    db: Optional[Any] = None,
) -> TransactionsResponse:
    """Get transaction history for the current user"""
    try:
        # Real implementation using transaction service
        user_id = getattr(current_user, "id", 1)  # Default to user 1 for now
        transactions = await transaction_service.get_user_transactions(user_id)

        logger.info(f"Returning {len(transactions)} transactions")
        return ResponseBuilder.success(TransactionsResponse(
            transactions=transactions, total_count=len(transactions))
        )

    except Exception as e:
        logger.error(f"Error fetching transactions: {e}")
        raise BusinessLogicException("Failed to fetch transactions")


@router.get("/active-bets", response_model=ActiveBetsResponse)
async def get_active_bets(
    current_user: Optional[Any] = None,
    db: Optional[Any] = None,
) -> ActiveBetsResponse:
    """Get active bets for the current user"""
    try:
        # Real implementation using transaction service
        user_id = getattr(current_user, "id", 1)  # Default to user 1 for now
        active_bets = await transaction_service.get_user_active_bets(user_id)

        logger.info(f"Returning {len(active_bets)} active bets")
        return ResponseBuilder.success(ActiveBetsResponse(active_bets=active_bets, total_count=len(active_bets)))

    except Exception as e:
        logger.error(f"Error fetching active bets: {e}")
        raise BusinessLogicException("Failed to fetch active bets")
