"""
Enhanced Quantum Optimization Service - Production-optimized quantum algorithms
Phase 2: AI/ML Infrastructure Enhancement

Enhanced from existing quantum_optimization_service.py with:
- Compiled energy functions for faster computation
- Parallel annealing processes
- Intelligent convergence detection
- Performance optimization for real-time portfolio optimization
- Advanced portfolio construction with dynamic rebalancing
"""

import asyncio
import numpy as np
import logging
import time
from typing import Dict, List, Optional, Any, Tuple, Union, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import multiprocessing as mp
from functools import lru_cache
import json
import pickle

from .unified_cache_service import UnifiedCacheService, CacheLevel, get_cache

logger = logging.getLogger(__name__)

class OptimizationType(Enum):
    """Types of quantum optimization"""
    PORTFOLIO = "portfolio"
    BETTING_ALLOCATION = "betting_allocation"
    RISK_MINIMIZATION = "risk_minimization"
    RETURN_MAXIMIZATION = "return_maximization"
    PARETO_OPTIMIZATION = "pareto_optimization"

class QuantumState(Enum):
    """Quantum state representations"""
    SUPERPOSITION = "superposition"
    ENTANGLED = "entangled"
    COLLAPSED = "collapsed"

@dataclass
class BettingOpportunity:
    """Betting opportunity data structure"""
    id: str
    player: str
    prop_type: str
    line: float
    over_odds: float
    under_odds: float
    confidence: float
    expected_value: float
    kelly_fraction: float
    risk_score: float
    sport: str
    game_time: datetime
    correlation_group: Optional[str] = None
    max_allocation: float = 0.1  # Max 10% allocation
    
    @property
    def over_probability(self) -> float:
        """Calculate implied probability for over bet"""
        return 1.0 / self.over_odds if self.over_odds > 0 else 0.0
        
    @property
    def under_probability(self) -> float:
        """Calculate implied probability for under bet"""
        return 1.0 / self.under_odds if self.under_odds > 0 else 0.0

@dataclass
class PortfolioConstraints:
    """Portfolio optimization constraints"""
    max_total_allocation: float = 1.0  # 100% of bankroll
    max_single_allocation: float = 0.15  # 15% per bet
    min_expected_return: float = 0.02  # 2% minimum expected return
    max_risk_score: float = 0.8  # Maximum risk tolerance
    max_correlation_exposure: float = 0.3  # Max exposure to correlated bets
    diversification_requirement: int = 3  # Minimum number of different props
    time_horizon_hours: int = 24  # Optimization time horizon
    min_confidence: float = 0.6  # Minimum confidence threshold

@dataclass
class QuantumOptimizationResult:
    """Result of quantum optimization"""
    optimal_allocations: Dict[str, float]
    expected_return: float
    risk_score: float
    convergence_iterations: int
    convergence_time: float
    quantum_advantage: float  # Performance vs classical methods
    energy_landscape: List[float]
    final_energy: float
    entanglement_scores: Dict[str, float]
    diversification_score: float
    kelly_efficiency: float
    confidence_weighted_return: float

@dataclass
class QuantumConfig:
    """Configuration for quantum optimization"""
    annealing_schedule: str = "exponential"  # linear, exponential, adaptive
    initial_temperature: float = 100.0
    final_temperature: float = 0.01
    cooling_rate: float = 0.95
    max_iterations: int = 1000
    convergence_threshold: float = 1e-6
    parallel_chains: int = 4
    energy_function: str = "advanced"  # basic, advanced, custom
    compilation_enabled: bool = True
    early_stopping: bool = True
    early_stopping_patience: int = 50

class CompiledEnergyFunction:
    """Compiled energy function for faster computation"""
    
    def __init__(self, config: QuantumConfig):
        self.config = config
        self._compiled_functions = {}
        self._function_cache = {}
        
    @lru_cache(maxsize=1024)
    def compute_energy(self, allocations_tuple: Tuple[float, ...], 
                      opportunities_hash: str,
                      constraints_hash: str) -> float:
        """Compute energy with caching for repeated calculations"""
        
        # Convert back to array for computation
        allocations = np.array(allocations_tuple)
        
        # Retrieve cached opportunity and constraint data
        opportunities = self._function_cache.get(f"opp_{opportunities_hash}")
        constraints = self._function_cache.get(f"const_{constraints_hash}")
        
        if opportunities is None or constraints is None:
            raise ValueError("Opportunities or constraints not found in cache")
            
        return self._compute_energy_core(allocations, opportunities, constraints)
        
    def _compute_energy_core(self, allocations: np.ndarray, 
                           opportunities: List[BettingOpportunity],
                           constraints: PortfolioConstraints) -> float:
        """Core energy computation with advanced risk-return modeling"""
        
        n_opportunities = len(opportunities)
        if len(allocations) != n_opportunities:
            return float('inf')
            
        # Constraint violations (penalty terms)
        penalty = 0.0
        
        # Total allocation constraint
        total_allocation = np.sum(allocations)
        if total_allocation > constraints.max_total_allocation:
            penalty += 1000 * (total_allocation - constraints.max_total_allocation) ** 2
            
        # Individual allocation constraints
        for i, (allocation, opp) in enumerate(zip(allocations, opportunities)):
            if allocation > opp.max_allocation:
                penalty += 500 * (allocation - opp.max_allocation) ** 2
            if allocation > constraints.max_single_allocation:
                penalty += 500 * (allocation - constraints.max_single_allocation) ** 2
                
        # Calculate expected return
        expected_return = sum(
            allocation * opp.expected_value 
            for allocation, opp in zip(allocations, opportunities)
        )
        
        # Return constraint
        if expected_return < constraints.min_expected_return:
            penalty += 800 * (constraints.min_expected_return - expected_return) ** 2
            
        # Calculate risk score (variance-based)
        risk_score = self._calculate_portfolio_risk(allocations, opportunities)
        if risk_score > constraints.max_risk_score:
            penalty += 600 * (risk_score - constraints.max_risk_score) ** 2
            
        # Correlation penalty
        correlation_penalty = self._calculate_correlation_penalty(
            allocations, opportunities, constraints
        )
        penalty += correlation_penalty
        
        # Diversification reward
        active_bets = np.sum(allocations > 0.001)  # Count non-trivial allocations
        if active_bets < constraints.diversification_requirement:
            penalty += 400 * (constraints.diversification_requirement - active_bets) ** 2
        else:
            # Reward diversification beyond minimum
            diversification_bonus = min(50, active_bets - constraints.diversification_requirement)
            penalty -= diversification_bonus
            
        # Confidence weighting
        confidence_weighted_return = sum(
            allocation * opp.expected_value * opp.confidence
            for allocation, opp in zip(allocations, opportunities)
        )
        
        # Kelly Criterion alignment
        kelly_alignment = self._calculate_kelly_alignment(allocations, opportunities)
        
        # Energy function (minimize negative returns plus penalties)
        energy = (
            -expected_return * 100 +  # Maximize return
            risk_score * 50 +         # Minimize risk
            penalty +                 # Penalty terms
            -confidence_weighted_return * 25 +  # Confidence bonus
            -kelly_alignment * 30     # Kelly alignment bonus
        )
        
        return energy
        
    def _calculate_portfolio_risk(self, allocations: np.ndarray, 
                                opportunities: List[BettingOpportunity]) -> float:
        """Calculate portfolio risk using modern portfolio theory"""
        
        # Create covariance matrix (simplified model)
        n = len(opportunities)
        covariance_matrix = np.eye(n)
        
        # Add correlation structure
        for i in range(n):
            for j in range(i + 1, n):
                # Correlation based on same player, same game, same prop type
                correlation = 0.0
                
                if opportunities[i].player == opportunities[j].player:
                    correlation += 0.4  # Same player correlation
                    
                if opportunities[i].correlation_group == opportunities[j].correlation_group:
                    correlation += 0.3  # Same correlation group
                    
                if opportunities[i].prop_type == opportunities[j].prop_type:
                    correlation += 0.2  # Same prop type
                    
                correlation = min(0.8, correlation)  # Cap correlation
                covariance_matrix[i, j] = correlation
                covariance_matrix[j, i] = correlation
                
        # Portfolio variance
        portfolio_variance = np.dot(allocations, np.dot(covariance_matrix, allocations))
        
        # Add individual risk scores
        individual_risk = sum(
            allocation * opp.risk_score 
            for allocation, opp in zip(allocations, opportunities)
        )
        
        return np.sqrt(portfolio_variance) + individual_risk * 0.1
        
    def _calculate_correlation_penalty(self, allocations: np.ndarray,
                                     opportunities: List[BettingOpportunity],
                                     constraints: PortfolioConstraints) -> float:
        """Calculate penalty for over-concentration in correlated bets"""
        
        # Group by correlation groups
        correlation_groups = {}
        for i, opp in enumerate(opportunities):
            if opp.correlation_group:
                if opp.correlation_group not in correlation_groups:
                    correlation_groups[opp.correlation_group] = []
                correlation_groups[opp.correlation_group].append((i, allocations[i]))
                
        penalty = 0.0
        for group, group_allocations in correlation_groups.items():
            total_group_allocation = sum(allocation for _, allocation in group_allocations)
            if total_group_allocation > constraints.max_correlation_exposure:
                penalty += 300 * (total_group_allocation - constraints.max_correlation_exposure) ** 2
                
        return penalty
        
    def _calculate_kelly_alignment(self, allocations: np.ndarray,
                                 opportunities: List[BettingOpportunity]) -> float:
        """Calculate alignment with Kelly Criterion recommendations"""
        
        alignment_score = 0.0
        for allocation, opp in zip(allocations, opportunities):
            if opp.kelly_fraction > 0 and allocation > 0:
                # Reward allocations that align with Kelly recommendations
                kelly_ratio = min(allocation / opp.kelly_fraction, opp.kelly_fraction / allocation)
                alignment_score += kelly_ratio
                
        return alignment_score / len(opportunities)
        
    def cache_problem_data(self, opportunities: List[BettingOpportunity],
                          constraints: PortfolioConstraints) -> Tuple[str, str]:
        """Cache problem data and return hashes"""
        
        # Create hashes
        opp_data = [(opp.id, opp.expected_value, opp.risk_score, opp.kelly_fraction) 
                   for opp in opportunities]
        opp_hash = str(hash(str(opp_data)))
        
        const_data = (constraints.max_total_allocation, constraints.max_single_allocation,
                     constraints.min_expected_return, constraints.max_risk_score)
        const_hash = str(hash(const_data))
        
        # Cache the data
        self._function_cache[f"opp_{opp_hash}"] = opportunities
        self._function_cache[f"const_{const_hash}"] = constraints
        
        return opp_hash, const_hash

class QuantumAnnealer:
    """Quantum-inspired annealing optimizer with parallel processing"""
    
    def __init__(self, config: QuantumConfig):
        self.config = config
        self.energy_function = CompiledEnergyFunction(config)
        self.executor = ThreadPoolExecutor(max_workers=config.parallel_chains)
        
    async def optimize(self, opportunities: List[BettingOpportunity],
                      constraints: PortfolioConstraints) -> QuantumOptimizationResult:
        """Perform quantum-inspired optimization"""
        
        start_time = time.time()
        
        # Cache problem data
        opp_hash, const_hash = self.energy_function.cache_problem_data(
            opportunities, constraints
        )
        
        # Run parallel annealing chains
        tasks = []
        for chain_id in range(self.config.parallel_chains):
            task = asyncio.create_task(
                self._run_annealing_chain(
                    opportunities, constraints, opp_hash, const_hash, chain_id
                )
            )
            tasks.append(task)
            
        # Collect results from all chains
        chain_results = await asyncio.gather(*tasks)
        
        # Select best result
        best_result = min(chain_results, key=lambda x: x['final_energy'])
        
        # Calculate additional metrics
        quantum_advantage = self._calculate_quantum_advantage(
            best_result, opportunities, constraints
        )
        
        diversification_score = self._calculate_diversification_score(
            best_result['allocations'], opportunities
        )
        
        kelly_efficiency = self._calculate_kelly_efficiency(
            best_result['allocations'], opportunities
        )
        
        confidence_weighted_return = sum(
            allocation * opp.expected_value * opp.confidence
            for allocation, opp in zip(best_result['allocations'], opportunities)
        )
        
        # Create result
        result = QuantumOptimizationResult(
            optimal_allocations={
                opp.id: allocation 
                for opp, allocation in zip(opportunities, best_result['allocations'])
                if allocation > 0.001  # Only include meaningful allocations
            },
            expected_return=sum(
                allocation * opp.expected_value
                for allocation, opp in zip(best_result['allocations'], opportunities)
            ),
            risk_score=self.energy_function._calculate_portfolio_risk(
                np.array(best_result['allocations']), opportunities
            ),
            convergence_iterations=best_result['iterations'],
            convergence_time=time.time() - start_time,
            quantum_advantage=quantum_advantage,
            energy_landscape=best_result['energy_history'],
            final_energy=best_result['final_energy'],
            entanglement_scores={
                opp.id: self._calculate_entanglement_score(
                    best_result['allocations'][i], opp, opportunities
                )
                for i, opp in enumerate(opportunities)
            },
            diversification_score=diversification_score,
            kelly_efficiency=kelly_efficiency,
            confidence_weighted_return=confidence_weighted_return
        )
        
        return result
        
    async def _run_annealing_chain(self, opportunities: List[BettingOpportunity],
                                  constraints: PortfolioConstraints,
                                  opp_hash: str, const_hash: str,
                                  chain_id: int) -> Dict[str, Any]:
        """Run a single annealing chain"""
        
        n_opportunities = len(opportunities)
        
        # Initialize random solution
        np.random.seed(chain_id)  # Different seed for each chain
        current_solution = np.random.random(n_opportunities) * 0.1  # Start with small allocations
        current_solution /= np.sum(current_solution) * 2  # Normalize to reasonable total
        
        # Annealing parameters
        temperature = self.config.initial_temperature
        best_solution = current_solution.copy()
        best_energy = self.energy_function.compute_energy(
            tuple(current_solution), opp_hash, const_hash
        )
        
        energy_history = [best_energy]
        no_improvement_count = 0
        
        for iteration in range(self.config.max_iterations):
            # Generate neighbor solution
            neighbor_solution = self._generate_neighbor(
                current_solution, temperature, constraints
            )
            
            # Calculate energy
            neighbor_energy = self.energy_function.compute_energy(
                tuple(neighbor_solution), opp_hash, const_hash
            )
            
            # Acceptance criteria (Metropolis criterion)
            energy_delta = neighbor_energy - self.energy_function.compute_energy(
                tuple(current_solution), opp_hash, const_hash
            )
            
            if energy_delta < 0 or np.random.random() < np.exp(-energy_delta / temperature):
                current_solution = neighbor_solution
                
                # Update best solution
                if neighbor_energy < best_energy:
                    best_solution = neighbor_solution.copy()
                    best_energy = neighbor_energy
                    no_improvement_count = 0
                else:
                    no_improvement_count += 1
            else:
                no_improvement_count += 1
                
            # Cool down temperature
            temperature = self._update_temperature(
                temperature, iteration, self.config.max_iterations
            )
            
            # Record energy
            if iteration % 10 == 0:  # Sample every 10 iterations
                energy_history.append(best_energy)
                
            # Early stopping
            if (self.config.early_stopping and 
                no_improvement_count > self.config.early_stopping_patience):
                break
                
            # Convergence check
            if len(energy_history) > 10:
                recent_improvement = energy_history[-10] - energy_history[-1]
                if recent_improvement < self.config.convergence_threshold:
                    break
                    
        return {
            'allocations': best_solution,
            'final_energy': best_energy,
            'iterations': iteration + 1,
            'energy_history': energy_history,
            'chain_id': chain_id
        }
        
    def _generate_neighbor(self, current_solution: np.ndarray,
                          temperature: float,
                          constraints: PortfolioConstraints) -> np.ndarray:
        """Generate neighbor solution with temperature-dependent perturbation"""
        
        neighbor = current_solution.copy()
        n_opportunities = len(neighbor)
        
        # Temperature-dependent perturbation strength
        perturbation_strength = temperature / self.config.initial_temperature * 0.1
        
        # Randomly select opportunities to modify
        n_modify = max(1, int(n_opportunities * 0.3))  # Modify 30% of allocations
        modify_indices = np.random.choice(n_opportunities, n_modify, replace=False)
        
        for idx in modify_indices:
            # Random perturbation
            perturbation = np.random.normal(0, perturbation_strength)
            neighbor[idx] = max(0, neighbor[idx] + perturbation)
            
        # Ensure constraints are roughly satisfied
        neighbor = np.clip(neighbor, 0, constraints.max_single_allocation)
        
        # Normalize if total allocation exceeds limit
        total_allocation = np.sum(neighbor)
        if total_allocation > constraints.max_total_allocation:
            neighbor *= constraints.max_total_allocation / total_allocation
            
        return neighbor
        
    def _update_temperature(self, current_temp: float, iteration: int, 
                           max_iterations: int) -> float:
        """Update temperature according to annealing schedule"""
        
        if self.config.annealing_schedule == "linear":
            progress = iteration / max_iterations
            return self.config.initial_temperature * (1 - progress) + self.config.final_temperature * progress
            
        elif self.config.annealing_schedule == "exponential":
            return current_temp * self.config.cooling_rate
            
        elif self.config.annealing_schedule == "adaptive":
            # Adaptive cooling based on acceptance rate
            base_cooling = current_temp * self.config.cooling_rate
            return max(self.config.final_temperature, base_cooling)
            
        else:
            return current_temp * self.config.cooling_rate
            
    def _calculate_quantum_advantage(self, result: Dict[str, Any],
                                   opportunities: List[BettingOpportunity],
                                   constraints: PortfolioConstraints) -> float:
        """Calculate quantum advantage vs classical optimization"""
        
        # Simple classical baseline: equal weight allocation
        n_opportunities = len(opportunities)
        equal_weight = constraints.max_total_allocation / n_opportunities
        classical_allocations = np.full(n_opportunities, equal_weight)
        
        # Ensure classical solution satisfies constraints
        for i, opp in enumerate(opportunities):
            classical_allocations[i] = min(classical_allocations[i], opp.max_allocation)
            
        classical_allocations = np.clip(classical_allocations, 0, constraints.max_single_allocation)
        
        # Calculate classical expected return
        classical_return = sum(
            allocation * opp.expected_value
            for allocation, opp in zip(classical_allocations, opportunities)
        )
        
        # Calculate quantum expected return
        quantum_return = sum(
            allocation * opp.expected_value
            for allocation, opp in zip(result['allocations'], opportunities)
        )
        
        # Quantum advantage as relative improvement
        if classical_return > 0:
            return (quantum_return - classical_return) / classical_return
        else:
            return 0.0
            
    def _calculate_diversification_score(self, allocations: np.ndarray,
                                       opportunities: List[BettingOpportunity]) -> float:
        """Calculate portfolio diversification score"""
        
        # Count different categories
        prop_types = set()
        players = set()
        sports = set()
        
        for allocation, opp in zip(allocations, opportunities):
            if allocation > 0.001:  # Only count meaningful allocations
                prop_types.add(opp.prop_type)
                players.add(opp.player)
                sports.add(opp.sport)
                
        # Calculate diversity metrics
        type_diversity = len(prop_types)
        player_diversity = len(players)
        sport_diversity = len(sports)
        
        # Herfindahl index for concentration
        allocation_shares = allocations[allocations > 0.001]
        if len(allocation_shares) > 0:
            herfindahl = np.sum(allocation_shares ** 2)
            diversity_index = 1 - herfindahl
        else:
            diversity_index = 0
            
        # Combined diversification score
        diversification_score = (
            type_diversity * 0.3 +
            player_diversity * 0.3 +
            sport_diversity * 0.2 +
            diversity_index * 0.2
        )
        
        return diversification_score
        
    def _calculate_kelly_efficiency(self, allocations: np.ndarray,
                                  opportunities: List[BettingOpportunity]) -> float:
        """Calculate efficiency relative to Kelly Criterion"""
        
        total_kelly_score = 0.0
        total_weight = 0.0
        
        for allocation, opp in zip(allocations, opportunities):
            if opp.kelly_fraction > 0 and allocation > 0:
                # Kelly efficiency for this bet
                kelly_efficiency = min(allocation / opp.kelly_fraction, 
                                     opp.kelly_fraction / allocation)
                
                # Weight by expected value
                weight = opp.expected_value * opp.confidence
                total_kelly_score += kelly_efficiency * weight
                total_weight += weight
                
        return total_kelly_score / total_weight if total_weight > 0 else 0.0
        
    def _calculate_entanglement_score(self, allocation: float,
                                    opportunity: BettingOpportunity,
                                    all_opportunities: List[BettingOpportunity]) -> float:
        """Calculate quantum entanglement score for this opportunity"""
        
        if allocation < 0.001:
            return 0.0
            
        # Entanglement based on correlation with other selected opportunities
        entanglement = 0.0
        
        for other_opp in all_opportunities:
            if other_opp.id != opportunity.id:
                # Calculate correlation factors
                correlation = 0.0
                
                if opportunity.player == other_opp.player:
                    correlation += 0.5
                    
                if opportunity.correlation_group == other_opp.correlation_group:
                    correlation += 0.3
                    
                if opportunity.prop_type == other_opp.prop_type:
                    correlation += 0.2
                    
                entanglement += correlation * allocation
                
        return min(1.0, entanglement)

class EnhancedQuantumService:
    """
    Enhanced quantum optimization service for production betting portfolio optimization.
    Provides real-time portfolio optimization with advanced quantum-inspired algorithms.
    """
    
    def __init__(self, cache_service: Optional[UnifiedCacheService] = None):
        self.cache_service = cache_service
        self.default_config = QuantumConfig()
        self.optimizers: Dict[str, QuantumAnnealer] = {}
        self.optimization_history: List[QuantumOptimizationResult] = []
        self.performance_metrics = {
            "total_optimizations": 0,
            "avg_convergence_time": 0.0,
            "avg_quantum_advantage": 0.0,
            "success_rate": 0.0
        }
        
    async def initialize(self):
        """Initialize the quantum service"""
        if self.cache_service is None:
            self.cache_service = await get_cache()
            
        # Initialize default optimizer
        self.optimizers["default"] = QuantumAnnealer(self.default_config)
        
        logger.info("Enhanced Quantum Service initialized")
        
    async def optimize_portfolio(self, 
                                opportunities: List[BettingOpportunity],
                                constraints: Optional[PortfolioConstraints] = None,
                                config: Optional[QuantumConfig] = None) -> QuantumOptimizationResult:
        """Optimize betting portfolio using quantum-inspired algorithms"""
        
        if not opportunities:
            raise ValueError("No betting opportunities provided")
            
        # Use default constraints if none provided
        if constraints is None:
            constraints = PortfolioConstraints()
            
        # Use default config if none provided
        if config is None:
            config = self.default_config
            
        # Check cache first
        cache_key = self._generate_cache_key(opportunities, constraints, config)
        if self.cache_service:
            cached_result = await self.cache_service.get(cache_key)
            if cached_result:
                logger.info("Using cached optimization result")
                return QuantumOptimizationResult(**cached_result)
                
        # Create optimizer for this configuration
        optimizer = QuantumAnnealer(config)
        
        try:
            # Perform optimization
            start_time = time.time()
            result = await optimizer.optimize(opportunities, constraints)
            optimization_time = time.time() - start_time
            
            # Update performance metrics
            self._update_performance_metrics(result, optimization_time, success=True)
            
            # Cache result
            if self.cache_service:
                await self.cache_service.set(
                    cache_key,
                    result.__dict__,
                    ttl=1800,  # 30 minutes
                    level=CacheLevel.REDIS
                )
                
            # Store in history
            self.optimization_history.append(result)
            if len(self.optimization_history) > 100:  # Keep last 100 results
                self.optimization_history.pop(0)
                
            logger.info(
                f"Portfolio optimization completed: "
                f"return={result.expected_return:.4f}, "
                f"risk={result.risk_score:.4f}, "
                f"time={result.convergence_time:.2f}s"
            )
            
            return result
            
        except Exception as e:
            self._update_performance_metrics(None, 0.0, success=False)
            logger.error(f"Portfolio optimization failed: {e}")
            raise
            
    async def rebalance_portfolio(self,
                                 current_positions: Dict[str, float],
                                 new_opportunities: List[BettingOpportunity],
                                 constraints: Optional[PortfolioConstraints] = None) -> QuantumOptimizationResult:
        """Rebalance existing portfolio with new opportunities"""
        
        # Create virtual opportunities for current positions
        current_opportunities = []
        for opp_id, allocation in current_positions.items():
            if allocation > 0:
                # Create placeholder opportunity for existing position
                current_opp = BettingOpportunity(
                    id=f"current_{opp_id}",
                    player="current_position",
                    prop_type="existing",
                    line=0.0,
                    over_odds=1.0,
                    under_odds=1.0,
                    confidence=0.8,
                    expected_value=0.02,  # Assume 2% return for existing positions
                    kelly_fraction=allocation,
                    risk_score=0.3,
                    sport="mixed",
                    game_time=datetime.now(),
                    max_allocation=allocation * 1.2  # Allow 20% increase
                )
                current_opportunities.append(current_opp)
                
        # Combine current and new opportunities
        all_opportunities = current_opportunities + new_opportunities
        
        # Optimize combined portfolio
        return await self.optimize_portfolio(all_opportunities, constraints)
        
    async def analyze_opportunity(self, 
                                opportunity: BettingOpportunity,
                                existing_portfolio: Optional[List[BettingOpportunity]] = None) -> Dict[str, Any]:
        """Analyze how adding an opportunity would affect the portfolio"""
        
        if existing_portfolio is None:
            existing_portfolio = []
            
        # Current portfolio optimization
        if existing_portfolio:
            current_result = await self.optimize_portfolio(existing_portfolio)
        else:
            current_result = None
            
        # Portfolio with new opportunity
        enhanced_portfolio = existing_portfolio + [opportunity]
        enhanced_result = await self.optimize_portfolio(enhanced_portfolio)
        
        # Calculate impact
        if current_result:
            return_improvement = enhanced_result.expected_return - current_result.expected_return
            risk_change = enhanced_result.risk_score - current_result.risk_score
        else:
            return_improvement = enhanced_result.expected_return
            risk_change = enhanced_result.risk_score
            
        # Calculate opportunity-specific metrics
        opportunity_allocation = enhanced_result.optimal_allocations.get(opportunity.id, 0.0)
        
        analysis = {
            "opportunity_id": opportunity.id,
            "recommended_allocation": opportunity_allocation,
            "return_improvement": return_improvement,
            "risk_change": risk_change,
            "sharpe_improvement": return_improvement / max(risk_change, 0.001),
            "portfolio_fit_score": self._calculate_portfolio_fit(
                opportunity, existing_portfolio
            ),
            "quantum_entanglement": enhanced_result.entanglement_scores.get(
                opportunity.id, 0.0
            ),
            "confidence_impact": opportunity.confidence * opportunity_allocation,
            "kelly_alignment": opportunity_allocation / max(opportunity.kelly_fraction, 0.001)
        }
        
        return analysis
        
    async def get_performance_metrics(self) -> Dict[str, Any]:
        """Get quantum service performance metrics"""
        
        metrics = self.performance_metrics.copy()
        
        # Add recent optimization statistics
        if self.optimization_history:
            recent_results = self.optimization_history[-10:]  # Last 10 optimizations
            
            metrics.update({
                "recent_avg_return": np.mean([r.expected_return for r in recent_results]),
                "recent_avg_risk": np.mean([r.risk_score for r in recent_results]),
                "recent_avg_convergence_time": np.mean([r.convergence_time for r in recent_results]),
                "recent_avg_quantum_advantage": np.mean([r.quantum_advantage for r in recent_results]),
                "recent_avg_diversification": np.mean([r.diversification_score for r in recent_results]),
                "optimizations_today": len([
                    r for r in self.optimization_history 
                    if (datetime.now() - datetime.fromtimestamp(time.time() - r.convergence_time)).days == 0
                ])
            })
            
        return metrics
        
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on quantum service"""
        
        # Test optimization with dummy data
        test_opportunities = [
            BettingOpportunity(
                id="test_1",
                player="Test Player",
                prop_type="points",
                line=20.5,
                over_odds=1.9,
                under_odds=1.9,
                confidence=0.8,
                expected_value=0.05,
                kelly_fraction=0.1,
                risk_score=0.3,
                sport="test",
                game_time=datetime.now()
            ),
            BettingOpportunity(
                id="test_2",
                player="Test Player 2",
                prop_type="rebounds",
                line=8.5,
                over_odds=2.0,
                under_odds=1.8,
                confidence=0.7,
                expected_value=0.03,
                kelly_fraction=0.08,
                risk_score=0.4,
                sport="test",
                game_time=datetime.now()
            )
        ]
        
        try:
            start_time = time.time()
            test_result = await self.optimize_portfolio(test_opportunities)
            test_time = time.time() - start_time
            
            health_status = {
                "status": "healthy",
                "test_optimization_time": test_time,
                "test_expected_return": test_result.expected_return,
                "test_convergence_iterations": test_result.convergence_iterations,
                "test_quantum_advantage": test_result.quantum_advantage,
                "cache_status": "connected" if self.cache_service else "disconnected",
                "optimizers_loaded": len(self.optimizers),
                "last_check": datetime.now().isoformat()
            }
            
        except Exception as e:
            health_status = {
                "status": "unhealthy",
                "error": str(e),
                "last_check": datetime.now().isoformat()
            }
            
        return health_status
        
    def _generate_cache_key(self, opportunities: List[BettingOpportunity],
                           constraints: PortfolioConstraints,
                           config: QuantumConfig) -> str:
        """Generate cache key for optimization request"""
        
        # Create hash from opportunities, constraints, and config
        opp_data = [
            (opp.id, opp.expected_value, opp.risk_score, opp.kelly_fraction)
            for opp in opportunities
        ]
        
        key_data = {
            'opportunities': opp_data,
            'constraints': constraints.__dict__,
            'config': {
                'annealing_schedule': config.annealing_schedule,
                'max_iterations': config.max_iterations,
                'parallel_chains': config.parallel_chains
            }
        }
        
        key_str = json.dumps(key_data, sort_keys=True)
        import hashlib
        return f"quantum_opt:{hashlib.md5(key_str.encode()).hexdigest()}"
        
    def _update_performance_metrics(self, result: Optional[QuantumOptimizationResult],
                                  optimization_time: float, success: bool):
        """Update service performance metrics"""
        
        self.performance_metrics["total_optimizations"] += 1
        
        if success and result:
            # Update averages using exponential moving average
            alpha = 0.1  # Smoothing factor
            
            if self.performance_metrics["avg_convergence_time"] == 0:
                self.performance_metrics["avg_convergence_time"] = optimization_time
            else:
                self.performance_metrics["avg_convergence_time"] = (
                    (1 - alpha) * self.performance_metrics["avg_convergence_time"] +
                    alpha * optimization_time
                )
                
            if self.performance_metrics["avg_quantum_advantage"] == 0:
                self.performance_metrics["avg_quantum_advantage"] = result.quantum_advantage
            else:
                self.performance_metrics["avg_quantum_advantage"] = (
                    (1 - alpha) * self.performance_metrics["avg_quantum_advantage"] +
                    alpha * result.quantum_advantage
                )
                
        # Update success rate
        successful_optimizations = sum(1 for r in self.optimization_history if r.expected_return > 0)
        total_optimizations = max(1, len(self.optimization_history))
        self.performance_metrics["success_rate"] = successful_optimizations / total_optimizations
        
    def _calculate_portfolio_fit(self, opportunity: BettingOpportunity,
                               existing_portfolio: List[BettingOpportunity]) -> float:
        """Calculate how well an opportunity fits with existing portfolio"""
        
        if not existing_portfolio:
            return 1.0  # Perfect fit for empty portfolio
            
        fit_score = 1.0
        
        # Check for over-concentration
        same_player_count = sum(1 for opp in existing_portfolio if opp.player == opportunity.player)
        if same_player_count > 0:
            fit_score *= 0.8  # Reduce fit for same player concentration
            
        same_prop_count = sum(1 for opp in existing_portfolio if opp.prop_type == opportunity.prop_type)
        if same_prop_count > 2:
            fit_score *= 0.7  # Reduce fit for same prop type over-concentration
            
        # Reward diversification
        different_sports = len(set(opp.sport for opp in existing_portfolio))
        if opportunity.sport not in [opp.sport for opp in existing_portfolio]:
            fit_score *= 1.2  # Bonus for sport diversification
            
        # Risk balance
        avg_risk = np.mean([opp.risk_score for opp in existing_portfolio])
        risk_balance = 1.0 - abs(opportunity.risk_score - avg_risk)
        fit_score *= risk_balance
        
        return min(1.0, fit_score)

# Global instance
_quantum_service: Optional[EnhancedQuantumService] = None

async def get_quantum_service() -> EnhancedQuantumService:
    """Get global quantum service instance"""
    global _quantum_service
    if _quantum_service is None:
        _quantum_service = EnhancedQuantumService()
        await _quantum_service.initialize()
    return _quantum_service

# Convenience functions
async def optimize_portfolio(opportunities: List[BettingOpportunity],
                           constraints: Optional[PortfolioConstraints] = None) -> QuantumOptimizationResult:
    """Optimize betting portfolio"""
    service = await get_quantum_service()
    return await service.optimize_portfolio(opportunities, constraints)

async def analyze_opportunity(opportunity: BettingOpportunity,
                            existing_portfolio: Optional[List[BettingOpportunity]] = None) -> Dict[str, Any]:
    """Analyze betting opportunity impact"""
    service = await get_quantum_service()
    return await service.analyze_opportunity(opportunity, existing_portfolio)
