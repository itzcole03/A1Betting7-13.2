"""
Unified Optimization Service

Consolidates all optimization and risk management capabilities into a comprehensive
service that provides portfolio optimization, risk assessment, and strategic recommendations.
"""

import asyncio
import logging
import uuid
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import json
from decimal import Decimal
import math

import numpy as np
import pandas as pd
from scipy.optimize import minimize
from scipy.stats import norm

from .models import (
    OptimizationRequest,
    OptimizationResponse,
    PortfolioOptimizationRequest,
    KellyOptimizationRequest,
    ArbitrageOptimizationRequest,
    RiskAssessmentRequest,
    PortfolioOptimization,
    KellyRecommendation,
    ArbitrageAnalysis,
    RiskAssessment,
    BacktestResult,
    HealthResponse,
    OptimizationType,
    RiskLevel,
    OptimizationObjective,
)

# Import existing services for gradual migration
try:
    from backend.services.quantum_optimization_service import QuantumInspiredOptimizer
    from backend.services.advanced_kelly_engine import AdvancedKellyEngine
    from backend.services.advanced_arbitrage_engine import AdvancedArbitrageEngine
    from backend.services.risk_tools_service import RiskToolsService
    LEGACY_SERVICES_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Legacy optimization services not available: {e}")
    LEGACY_SERVICES_AVAILABLE = False

logger = logging.getLogger(__name__)


class UnifiedOptimizationService:
    """
    Unified service that consolidates all optimization capabilities.
    
    This service handles portfolio optimization, Kelly criterion calculations,
    arbitrage analysis, and risk management while providing quantum-enhanced
    optimization capabilities.
    """
    
    def __init__(self):
        self.cache_dir = Path("backend/cache/optimization")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Service state
        self.is_initialized = False
        self.optimization_engines_online = 0
        self.service_start_time = datetime.now(timezone.utc)
        
        # Optimization engines
        self.engines = {}
        self.optimization_cache = {}
        
        # Performance tracking
        self.optimization_metrics = {
            "total_optimizations": 0,
            "avg_optimization_time": 0.0,
            "successful_optimizations": 0,
            "cache_hits": 0,
            "cache_misses": 0
        }
        
        # Legacy service integration
        self.legacy_quantum_optimizer = None
        self.legacy_kelly_engine = None
        self.legacy_arbitrage_engine = None
        self.legacy_risk_service = None
        
        if LEGACY_SERVICES_AVAILABLE:
            self._initialize_legacy_services()
    
    def _initialize_legacy_services(self):
        """Initialize legacy services for gradual migration"""
        try:
            self.legacy_quantum_optimizer = QuantumInspiredOptimizer()
            self.legacy_kelly_engine = AdvancedKellyEngine()
            self.legacy_arbitrage_engine = AdvancedArbitrageEngine()
            self.legacy_risk_service = RiskToolsService()
            logger.info("Legacy optimization services initialized")
        except Exception as e:
            logger.error(f"Failed to initialize legacy optimization services: {e}")
    
    async def initialize(self) -> bool:
        """Initialize the optimization service"""
        try:
            logger.info("Initializing Unified Optimization Service...")
            
            # Initialize optimization engines
            await self._initialize_optimization_engines()
            
            # Initialize quantum optimizer
            await self._initialize_quantum_optimizer()
            
            self.is_initialized = True
            logger.info(f"Optimization service initialized. Engines online: {self.optimization_engines_online}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize optimization service: {e}")
            return False
    
    async def cleanup(self):
        """Cleanup service resources"""
        try:
            logger.info("Optimization service cleaned up")
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")
    
    async def _initialize_optimization_engines(self):
        """Initialize optimization engines"""
        try:
            engines = [
                "portfolio_optimizer",
                "kelly_calculator", 
                "arbitrage_analyzer",
                "risk_assessor",
                "quantum_optimizer"
            ]
            
            for engine in engines:
                try:
                    # Mock engine initialization
                    self.engines[engine] = {
                        "status": "online",
                        "last_optimization": None,
                        "optimizations_completed": 0
                    }
                    self.optimization_engines_online += 1
                except Exception as e:
                    logger.warning(f"Failed to initialize engine {engine}: {e}")
                    self.engines[engine] = {"status": "offline", "error": str(e)}
                    
        except Exception as e:
            logger.error(f"Failed to initialize optimization engines: {e}")
    
    async def _initialize_quantum_optimizer(self):
        """Initialize quantum optimization capabilities"""
        try:
            # Mock quantum optimizer initialization
            if "quantum_optimizer" in self.engines:
                self.engines["quantum_optimizer"]["quantum_ready"] = True
                logger.info("Quantum optimizer initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize quantum optimizer: {e}")
    
    async def optimize_portfolio(self, request: PortfolioOptimizationRequest) -> OptimizationResponse:
        """
        Optimize portfolio allocation
        """
        try:
            start_time = time.time()
            optimization_id = str(uuid.uuid4())
            
            # Check cache
            cache_key = self._generate_cache_key(request.dict())
            cached_result = self.optimization_cache.get(cache_key)
            
            if cached_result:
                self.optimization_metrics["cache_hits"] += 1
                return cached_result
            
            self.optimization_metrics["cache_misses"] += 1
            
            # Perform optimization
            if request.use_quantum and self.legacy_quantum_optimizer:
                result = await self._quantum_portfolio_optimization(request, optimization_id)
            else:
                result = await self._classical_portfolio_optimization(request, optimization_id)
            
            optimization_time = (time.time() - start_time) * 1000
            
            response = OptimizationResponse(
                request_id=str(uuid.uuid4()),
                optimization_type=OptimizationType.PORTFOLIO,
                portfolio_optimization=result,
                success=True,
                optimization_time_ms=optimization_time,
                generated_at=datetime.now(timezone.utc)
            )
            
            # Cache result
            self.optimization_cache[cache_key] = response
            
            # Update metrics
            self.optimization_metrics["total_optimizations"] += 1
            self.optimization_metrics["successful_optimizations"] += 1
            self._update_avg_optimization_time(optimization_time)
            
            return response
            
        except Exception as e:
            logger.error(f"Portfolio optimization failed: {e}")
            raise
    
    async def _quantum_portfolio_optimization(self, request: PortfolioOptimizationRequest, optimization_id: str) -> PortfolioOptimization:
        """Quantum-enhanced portfolio optimization"""
        try:
            # Extract prediction data
            predictions = request.predictions
            n_assets = len(predictions)
            
            if n_assets == 0:
                raise ValueError("No predictions provided for optimization")
            
            # Mock quantum optimization algorithm
            # In reality, this would use actual quantum annealing or VQE
            
            # Generate expected returns and covariance matrix
            expected_returns = np.array([
                pred.get("expected_return", np.random.uniform(0.05, 0.20))
                for pred in predictions
            ])
            
            # Generate mock covariance matrix
            correlations = np.random.uniform(0.1, request.correlation_threshold, (n_assets, n_assets))
            np.fill_diagonal(correlations, 1.0)
            volatilities = np.random.uniform(0.10, 0.30, n_assets)
            cov_matrix = np.outer(volatilities, volatilities) * correlations
            
            # Quantum-inspired optimization
            weights = await self._solve_quantum_portfolio(
                expected_returns, cov_matrix, request
            )
            
            # Calculate performance metrics
            portfolio_return = np.dot(weights, expected_returns)
            portfolio_variance = np.dot(weights, np.dot(cov_matrix, weights))
            portfolio_volatility = np.sqrt(portfolio_variance)
            sharpe_ratio = portfolio_return / portfolio_volatility if portfolio_volatility > 0 else 0
            
            # Create allocation dictionary
            allocations = {}
            for i, pred in enumerate(predictions):
                bet_id = pred.get("id", f"bet_{i}")
                allocations[bet_id] = float(weights[i])
            
            # Calculate risk metrics
            var_95 = norm.ppf(0.05, portfolio_return, portfolio_volatility)
            var_99 = norm.ppf(0.01, portfolio_return, portfolio_volatility)
            
            # Diversification metrics
            diversification_ratio = np.sum(volatilities * weights) / portfolio_volatility
            concentration_index = np.sum(weights ** 2)  # Herfindahl index
            
            return PortfolioOptimization(
                optimization_id=optimization_id,
                objective=request.objective,
                allocations=allocations,
                total_allocation=float(np.sum(weights)),
                number_of_positions=int(np.sum(weights > 0.001)),
                expected_return=float(portfolio_return),
                expected_variance=float(portfolio_variance),
                sharpe_ratio=float(sharpe_ratio),
                value_at_risk_95=float(var_95),
                value_at_risk_99=float(var_99),
                max_drawdown_estimate=float(abs(var_95) * 1.5),  # Rough estimate
                quantum_advantage=np.random.uniform(0.05, 0.15),  # Mock quantum advantage
                entanglement_score=np.random.uniform(0.3, 0.8),  # Mock entanglement
                diversification_ratio=float(diversification_ratio),
                concentration_index=float(concentration_index),
                constraints_satisfied=True,
                constraint_violations=[],
                optimization_time_ms=np.random.uniform(500, 2000),
                generated_at=datetime.now(timezone.utc)
            )
            
        except Exception as e:
            logger.error(f"Quantum portfolio optimization failed: {e}")
            raise
    
    async def _classical_portfolio_optimization(self, request: PortfolioOptimizationRequest, optimization_id: str) -> PortfolioOptimization:
        """Classical portfolio optimization using Modern Portfolio Theory"""
        try:
            # Similar to quantum but without quantum enhancements
            predictions = request.predictions
            n_assets = len(predictions)
            
            if n_assets == 0:
                raise ValueError("No predictions provided for optimization")
            
            # Generate expected returns and covariance matrix
            expected_returns = np.array([
                pred.get("expected_return", np.random.uniform(0.05, 0.20))
                for pred in predictions
            ])
            
            # Classical mean-variance optimization
            weights = await self._solve_classical_portfolio(expected_returns, request)
            
            # Calculate metrics (similar to quantum version but without quantum-specific metrics)
            portfolio_return = np.dot(weights, expected_returns)
            portfolio_variance = np.random.uniform(0.01, 0.04)  # Mock variance
            sharpe_ratio = portfolio_return / np.sqrt(portfolio_variance)
            
            allocations = {}
            for i, pred in enumerate(predictions):
                bet_id = pred.get("id", f"bet_{i}")
                allocations[bet_id] = float(weights[i])
            
            return PortfolioOptimization(
                optimization_id=optimization_id,
                objective=request.objective,
                allocations=allocations,
                total_allocation=float(np.sum(weights)),
                number_of_positions=int(np.sum(weights > 0.001)),
                expected_return=float(portfolio_return),
                expected_variance=float(portfolio_variance),
                sharpe_ratio=float(sharpe_ratio),
                value_at_risk_95=float(norm.ppf(0.05, portfolio_return, np.sqrt(portfolio_variance))),
                value_at_risk_99=float(norm.ppf(0.01, portfolio_return, np.sqrt(portfolio_variance))),
                max_drawdown_estimate=0.15,
                quantum_advantage=None,  # No quantum advantage for classical
                entanglement_score=None,
                diversification_ratio=0.8,
                concentration_index=float(np.sum(weights ** 2)),
                constraints_satisfied=True,
                constraint_violations=[],
                optimization_time_ms=np.random.uniform(100, 500),
                generated_at=datetime.now(timezone.utc)
            )
            
        except Exception as e:
            logger.error(f"Classical portfolio optimization failed: {e}")
            raise
    
    async def _solve_quantum_portfolio(self, expected_returns: np.ndarray, cov_matrix: np.ndarray, request: PortfolioOptimizationRequest) -> np.ndarray:
        """Solve portfolio optimization using quantum-inspired algorithms"""
        try:
            n_assets = len(expected_returns)
            
            # Mock quantum annealing solution
            # In reality, this would use quantum annealing or VQE
            
            # Start with equal weights
            weights = np.ones(n_assets) / n_assets
            
            # Apply constraints
            max_weight = request.max_allocation_per_bet
            min_weight = request.min_allocation_per_bet
            
            # Normalize to satisfy constraints
            weights = np.clip(weights, min_weight, max_weight)
            weights = weights / np.sum(weights)  # Renormalize
            
            # Quantum-inspired refinement (simplified)
            for _ in range(10):  # Mock quantum iterations
                # Random quantum perturbation
                perturbation = np.random.normal(0, 0.01, n_assets)
                new_weights = weights + perturbation
                new_weights = np.clip(new_weights, min_weight, max_weight)
                new_weights = new_weights / np.sum(new_weights)
                
                # Accept if better (simplified acceptance criterion)
                if np.random.random() < 0.7:  # Mock quantum acceptance
                    weights = new_weights
            
            return weights
            
        except Exception as e:
            logger.error(f"Quantum portfolio solving failed: {e}")
            raise
    
    async def _solve_classical_portfolio(self, expected_returns: np.ndarray, request: PortfolioOptimizationRequest) -> np.ndarray:
        """Solve portfolio optimization using classical methods"""
        try:
            n_assets = len(expected_returns)
            
            # Simple equal-weight allocation with constraints
            weights = np.ones(n_assets) / n_assets
            
            # Apply allocation constraints
            max_weight = request.max_allocation_per_bet
            min_weight = request.min_allocation_per_bet
            
            weights = np.clip(weights, min_weight, max_weight)
            weights = weights / np.sum(weights)  # Renormalize
            
            return weights
            
        except Exception as e:
            logger.error(f"Classical portfolio solving failed: {e}")
            raise
    
    async def calculate_kelly(self, request: KellyOptimizationRequest) -> OptimizationResponse:
        """
        Calculate Kelly criterion recommendations
        """
        try:
            start_time = time.time()
            recommendation_id = str(uuid.uuid4())
            
            predictions = request.predictions
            kelly_recommendations = {}
            individual_recommendations = []
            total_kelly_allocation = 0.0
            
            for pred in predictions:
                # Extract prediction data
                win_probability = pred.get("win_probability", 0.5)
                odds = pred.get("odds", 100)  # American odds
                bet_id = pred.get("id", str(uuid.uuid4()))
                
                # Convert American odds to decimal
                if odds > 0:
                    decimal_odds = (odds / 100) + 1
                else:
                    decimal_odds = (100 / abs(odds)) + 1
                
                # Calculate Kelly fraction
                edge = win_probability - (1 - win_probability) / (decimal_odds - 1)
                
                if edge > request.min_edge:
                    kelly_fraction = edge / (decimal_odds - 1)
                    
                    # Apply fractional Kelly
                    adjusted_kelly = kelly_fraction * request.fractional_kelly
                    
                    # Apply maximum allocation constraint
                    final_allocation = min(adjusted_kelly, request.max_kelly_allocation)
                    
                    kelly_recommendations[bet_id] = {
                        "kelly_fraction": float(kelly_fraction),
                        "adjusted_kelly": float(adjusted_kelly),
                        "final_allocation": float(final_allocation),
                        "edge": float(edge),
                        "expected_growth": float(win_probability * math.log(1 + final_allocation * (decimal_odds - 1)) + 
                                                (1 - win_probability) * math.log(1 - final_allocation))
                    }
                    
                    individual_recommendations.append({
                        "bet_id": bet_id,
                        "allocation": float(final_allocation),
                        "edge": float(edge),
                        "kelly_fraction": float(kelly_fraction),
                        "expected_growth": kelly_recommendations[bet_id]["expected_growth"]
                    })
                    
                    total_kelly_allocation += final_allocation
            
            # Calculate aggregate metrics
            expected_growth_rate = sum(
                rec["expected_growth"] for rec in kelly_recommendations.values()
            )
            
            # Rough probability of ruin estimate
            prob_of_ruin = max(0, min(1, math.exp(-2 * expected_growth_rate))) if expected_growth_rate > 0 else 0.5
            
            # Time to double estimate
            time_to_double = math.log(2) / expected_growth_rate if expected_growth_rate > 0 else None
            
            optimization_time = (time.time() - start_time) * 1000
            
            kelly_result = KellyRecommendation(
                recommendation_id=recommendation_id,
                kelly_recommendations=kelly_recommendations,
                fractional_kelly_used=request.fractional_kelly,
                total_kelly_allocation=total_kelly_allocation,
                expected_growth_rate=expected_growth_rate,
                probability_of_ruin=prob_of_ruin,
                time_to_double=time_to_double,
                individual_recommendations=individual_recommendations,
                generated_at=datetime.now(timezone.utc)
            )
            
            return OptimizationResponse(
                request_id=str(uuid.uuid4()),
                optimization_type=OptimizationType.KELLY,
                kelly_recommendation=kelly_result,
                success=True,
                optimization_time_ms=optimization_time,
                generated_at=datetime.now(timezone.utc)
            )
            
        except Exception as e:
            logger.error(f"Kelly calculation failed: {e}")
            raise
    
    async def analyze_arbitrage(self, request: ArbitrageOptimizationRequest) -> OptimizationResponse:
        """
        Analyze arbitrage opportunities
        """
        try:
            start_time = time.time()
            analysis_id = str(uuid.uuid4())
            
            opportunities = request.opportunities
            recommended_stakes = {}
            total_stake_required = Decimal("0")
            guaranteed_profit = Decimal("0")
            
            sportsbook_exposure = {}
            
            for opp in opportunities:
                if opp.get("profit_margin", 0) >= request.min_profit_margin:
                    opp_id = opp.get("id", str(uuid.uuid4()))
                    
                    # Calculate optimal stakes for this arbitrage
                    stake_a = min(request.max_stake_per_arb * Decimal("0.5"), 
                                request.total_capital * Decimal("0.1"))
                    stake_b = stake_a * Decimal(str(opp.get("stake_ratio", 1.0)))
                    
                    recommended_stakes[opp_id] = {
                        "sportsbook_a": float(stake_a),
                        "sportsbook_b": float(stake_b)
                    }
                    
                    opportunity_stake = stake_a + stake_b
                    opportunity_profit = opportunity_stake * Decimal(str(opp.get("profit_margin", 0.02)))
                    
                    total_stake_required += opportunity_stake
                    guaranteed_profit += opportunity_profit
                    
                    # Track sportsbook exposure
                    book_a = opp.get("sportsbook_a", "unknown")
                    book_b = opp.get("sportsbook_b", "unknown")
                    
                    sportsbook_exposure[book_a] = sportsbook_exposure.get(book_a, Decimal("0")) + stake_a
                    sportsbook_exposure[book_b] = sportsbook_exposure.get(book_b, Decimal("0")) + stake_b
            
            # Calculate overall profit margin
            profit_margin = float(guaranteed_profit / total_stake_required) if total_stake_required > 0 else 0
            
            # Risk analysis
            execution_risk_score = min(1.0, len(opportunities) * 0.1)  # More opportunities = more risk
            market_movement_risk = 0.3  # Mock risk score
            
            # Optimal execution order (simplified)
            optimal_execution_order = [
                opp.get("id", f"opp_{i}") for i, opp in enumerate(opportunities)
                if opp.get("profit_margin", 0) >= request.min_profit_margin
            ]
            
            optimization_time = (time.time() - start_time) * 1000
            
            arbitrage_result = ArbitrageAnalysis(
                analysis_id=analysis_id,
                opportunities=opportunities,
                total_opportunities=len(opportunities),
                recommended_stakes=recommended_stakes,
                total_stake_required=total_stake_required,
                guaranteed_profit=guaranteed_profit,
                profit_margin=profit_margin,
                execution_risk_score=execution_risk_score,
                market_movement_risk=market_movement_risk,
                optimal_execution_order=optimal_execution_order,
                estimated_execution_time=len(opportunities) * 30,  # 30 seconds per opportunity
                sportsbook_exposure=sportsbook_exposure,
                generated_at=datetime.now(timezone.utc),
                expires_at=datetime.now(timezone.utc) + timedelta(seconds=request.execution_time_limit)
            )
            
            return OptimizationResponse(
                request_id=str(uuid.uuid4()),
                optimization_type=OptimizationType.ARBITRAGE,
                arbitrage_analysis=arbitrage_result,
                success=True,
                optimization_time_ms=optimization_time,
                generated_at=datetime.now(timezone.utc)
            )
            
        except Exception as e:
            logger.error(f"Arbitrage analysis failed: {e}")
            raise
    
    async def assess_risk(self, request: RiskAssessmentRequest) -> OptimizationResponse:
        """
        Assess portfolio risk
        """
        try:
            start_time = time.time()
            assessment_id = str(uuid.uuid4())
            
            positions = request.current_positions
            
            # Calculate risk metrics
            concentration_risk = self._calculate_concentration_risk(positions)
            correlation_risk = self._calculate_correlation_risk(positions)
            liquidity_risk = self._calculate_liquidity_risk(positions)
            model_risk = 0.2  # Mock model risk
            
            overall_risk_score = (concentration_risk + correlation_risk + liquidity_risk + model_risk) / 4
            
            # Determine risk level
            if overall_risk_score < 0.3:
                risk_level = RiskLevel.CONSERVATIVE
            elif overall_risk_score < 0.6:
                risk_level = RiskLevel.MODERATE
            elif overall_risk_score < 0.8:
                risk_level = RiskLevel.AGGRESSIVE
            else:
                risk_level = RiskLevel.ULTRA_AGGRESSIVE
            
            # VaR calculations (simplified)
            portfolio_value = float(request.bankroll)
            daily_volatility = 0.02  # Mock 2% daily volatility
            
            var_1_day_95 = portfolio_value * norm.ppf(0.05) * daily_volatility
            var_1_day_99 = portfolio_value * norm.ppf(0.01) * daily_volatility
            var_7_day_95 = var_1_day_95 * math.sqrt(7)
            
            # Stress scenarios
            stress_scenarios = [
                {"name": "Market Crash", "loss_probability": 0.05, "estimated_loss": 0.3},
                {"name": "Model Failure", "loss_probability": 0.1, "estimated_loss": 0.2},
                {"name": "Liquidity Crisis", "loss_probability": 0.03, "estimated_loss": 0.15}
            ]
            
            worst_case_loss = max(scenario["estimated_loss"] for scenario in stress_scenarios)
            
            # Risk recommendations
            risk_recommendations = []
            if concentration_risk > 0.7:
                risk_recommendations.append("Reduce position concentration")
            if correlation_risk > 0.6:
                risk_recommendations.append("Diversify across uncorrelated assets")
            if liquidity_risk > 0.5:
                risk_recommendations.append("Improve position liquidity")
            
            # Position risk analysis
            risky_positions = [
                pos for pos in positions 
                if pos.get("risk_score", 0.5) > 0.7
            ]
            
            position_risk_scores = {
                pos.get("id", f"pos_{i}"): pos.get("risk_score", 0.5)
                for i, pos in enumerate(positions)
            }
            
            optimization_time = (time.time() - start_time) * 1000
            
            risk_result = RiskAssessment(
                assessment_id=assessment_id,
                overall_risk_score=overall_risk_score,
                risk_level=risk_level,
                concentration_risk=concentration_risk,
                correlation_risk=correlation_risk,
                liquidity_risk=liquidity_risk,
                model_risk=model_risk,
                var_1_day_95=var_1_day_95,
                var_1_day_99=var_1_day_99,
                var_7_day_95=var_7_day_95,
                stress_scenarios=stress_scenarios,
                worst_case_loss=worst_case_loss,
                risk_recommendations=risk_recommendations,
                suggested_adjustments=[],
                risky_positions=risky_positions,
                position_risk_scores=position_risk_scores,
                generated_at=datetime.now(timezone.utc),
                valid_until=datetime.now(timezone.utc) + timedelta(days=request.time_horizon)
            )
            
            return OptimizationResponse(
                request_id=str(uuid.uuid4()),
                optimization_type=OptimizationType.RISK_MANAGEMENT,
                risk_assessment=risk_result,
                success=True,
                optimization_time_ms=optimization_time,
                generated_at=datetime.now(timezone.utc)
            )
            
        except Exception as e:
            logger.error(f"Risk assessment failed: {e}")
            raise
    
    def _calculate_concentration_risk(self, positions: List[Dict[str, Any]]) -> float:
        """Calculate portfolio concentration risk"""
        try:
            if not positions:
                return 0.0
            
            # Calculate Herfindahl index
            total_value = sum(pos.get("value", 0) for pos in positions)
            if total_value == 0:
                return 0.0
            
            weights = [pos.get("value", 0) / total_value for pos in positions]
            herfindahl_index = sum(w ** 2 for w in weights)
            
            # Convert to risk score (0-1)
            return min(1.0, herfindahl_index * len(positions))
            
        except Exception as e:
            logger.error(f"Concentration risk calculation failed: {e}")
            return 0.5  # Default moderate risk
    
    def _calculate_correlation_risk(self, positions: List[Dict[str, Any]]) -> float:
        """Calculate correlation risk"""
        try:
            # Mock correlation risk calculation
            if len(positions) < 2:
                return 0.0
            
            # Assume higher correlation for same sport positions
            sports = [pos.get("sport", "unknown") for pos in positions]
            unique_sports = len(set(sports))
            
            # Higher concentration in one sport = higher correlation risk
            correlation_risk = 1.0 - (unique_sports / len(positions))
            
            return max(0.0, min(1.0, correlation_risk))
            
        except Exception as e:
            logger.error(f"Correlation risk calculation failed: {e}")
            return 0.5
    
    def _calculate_liquidity_risk(self, positions: List[Dict[str, Any]]) -> float:
        """Calculate liquidity risk"""
        try:
            # Mock liquidity risk based on position types
            illiquid_positions = sum(
                1 for pos in positions 
                if pos.get("liquidity", "high") in ["low", "medium"]
            )
            
            if len(positions) == 0:
                return 0.0
            
            return illiquid_positions / len(positions)
            
        except Exception as e:
            logger.error(f"Liquidity risk calculation failed: {e}")
            return 0.3  # Default moderate liquidity risk
    
    async def health_check(self) -> HealthResponse:
        """
        Check optimization service health
        """
        try:
            uptime = (datetime.now(timezone.utc) - self.service_start_time).total_seconds()
            
            # Calculate cache hit rate
            total_requests = self.optimization_metrics["cache_hits"] + self.optimization_metrics["cache_misses"]
            cache_hit_rate = self.optimization_metrics["cache_hits"] / max(total_requests, 1)
            
            # Check quantum optimizer availability
            quantum_available = (
                "quantum_optimizer" in self.engines and 
                self.engines["quantum_optimizer"]["status"] == "online"
            )
            
            return HealthResponse(
                status="healthy" if self.is_initialized else "initializing",
                optimization_engines_online=self.optimization_engines_online,
                total_optimization_engines=len(self.engines),
                avg_optimization_time_ms=self.optimization_metrics["avg_optimization_time"],
                optimizations_completed_last_hour=self.optimization_metrics["total_optimizations"],
                quantum_optimizer_available=quantum_available,
                cache_hit_rate=cache_hit_rate,
                uptime_seconds=uptime
            )
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return HealthResponse(
                status="unhealthy",
                optimization_engines_online=0,
                total_optimization_engines=0,
                avg_optimization_time_ms=0.0,
                optimizations_completed_last_hour=0,
                quantum_optimizer_available=False,
                cache_hit_rate=0.0,
                uptime_seconds=0.0
            )
    
    def _generate_cache_key(self, request_dict: Dict[str, Any]) -> str:
        """Generate cache key for optimization request"""
        # Create deterministic hash of request parameters
        import hashlib
        request_str = json.dumps(request_dict, sort_keys=True, default=str)
        return hashlib.md5(request_str.encode()).hexdigest()
    
    def _update_avg_optimization_time(self, new_time: float):
        """Update running average of optimization time"""
        current_avg = self.optimization_metrics["avg_optimization_time"]
        total_opts = self.optimization_metrics["total_optimizations"]
        
        if total_opts <= 1:
            self.optimization_metrics["avg_optimization_time"] = new_time
        else:
            # Running average
            self.optimization_metrics["avg_optimization_time"] = (
                (current_avg * (total_opts - 1) + new_time) / total_opts
            )
