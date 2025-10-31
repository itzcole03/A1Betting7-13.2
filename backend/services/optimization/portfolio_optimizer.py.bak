"""
Portfolio Optimizer - Advanced portfolio optimization engine for edge selection.

Implements:
- Candidate edge generation and filtering
- Beam search optimization with correlation constraints
- Multiple objective functions (EV, EV/Var ratio, target probability)
- Ticket construction with risk management
- Asynchronous optimization execution
- Result persistence and artifact storage
"""

import asyncio
import json
import math
import time
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple, Any, Set
from enum import Enum

from sqlalchemy.orm import Session

from backend.models.portfolio_optimization import (
    OptimizationRun,
    OptimizationArtifact,
    OptimizationObjective,
    OptimizationStatus,
    ArtifactType
)
from backend.models.modeling import Edge
from backend.services.ticketing.monte_carlo_parlay import (
    MonteCarloParlay,
    ParlayLeg,
    MonteCarloResult
)
from backend.services.correlation.advanced_correlation_engine import (
    AdvancedCorrelationEngine
)
from backend.services.unified_logging import get_logger

logger = get_logger("portfolio_optimizer")


@dataclass
class EdgeCandidate:
    """Edge candidate for portfolio optimization"""
    edge_id: int
    prop_id: int
    prop_type: str
    player_id: int
    ev: float
    prob_over: float
    prob_under: float
    offered_line: float
    fair_line: float
    volatility_score: float
    correlation_cluster_id: Optional[int]


@dataclass
class OptimizationConstraints:
    """Portfolio optimization constraints"""
    max_legs: int = 6
    min_legs: int = 2
    min_ev_per_leg: float = 0.02
    max_avg_correlation: float = 0.6
    max_pairwise_corr: float = 0.7
    target_probability: float = 0.25
    max_exposure_per_player: float = 0.15
    max_exposure_per_prop_type: float = 0.25
    correlation_penalty_weight: float = 0.4


@dataclass
class TicketSolution:
    """Optimized ticket solution"""
    edge_ids: List[int]
    score: float
    expected_ev: float
    prob_joint: float
    avg_correlation: float
    max_pairwise_corr: float
    legs_count: int
    risk_metrics: Dict[str, float]
    monte_carlo_result: Optional[Dict[str, Any]]


@dataclass 
class BeamState:
    """Beam search state"""
    current_edges: Set[int]
    current_score: float
    current_ev: float
    last_correlation: float


class ObjectiveFunction(Enum):
    """Optimization objective functions"""
    MAXIMIZE_EV = "maximize_ev"
    MAXIMIZE_EV_VAR_RATIO = "maximize_ev_var_ratio"
    MAXIMIZE_TARGET_PROB = "maximize_target_prob"


class PortfolioOptimizer:
    """
    Advanced portfolio optimization engine for systematic edge selection
    and ticket construction under correlation and risk constraints.
    """

    def __init__(self, db_session: Session):
        self.db = db_session
        self.logger = logger
        self.correlation_engine = AdvancedCorrelationEngine(db_session)
        self.monte_carlo = MonteCarloParlay(db_session)

        # Configuration defaults (should be from unified config)
        self.max_beam_width = 40
        self.solutions_limit = 10
        self.min_sample_correlation = 0.05  # Threshold for correlation computation
        
    async def optimize_portfolio(
        self,
        objective: OptimizationObjective,
        edge_ids: List[int],
        constraints: OptimizationConstraints,
        run_async: bool = True
    ) -> str:
        """
        Execute portfolio optimization and return run ID.
        
        Args:
            objective: Optimization objective function
            edge_ids: Pool of edge IDs to select from
            constraints: Optimization constraints
            run_async: Whether to run asynchronously
            
        Returns:
            Optimization run ID for result retrieval
        """
        # Create optimization run record
        opt_run = OptimizationRun(
            objective=objective,
            input_edge_ids=edge_ids,
            constraints_json=asdict(constraints),
            status=OptimizationStatus.RUNNING
        )
        self.db.add(opt_run)
        self.db.commit()
        
        run_id = str(opt_run.id)
        
        if run_async:
            # Schedule for background execution
            asyncio.create_task(
                self._execute_optimization_async(run_id, objective, edge_ids, constraints)
            )
        else:
            # Execute synchronously
            await self._execute_optimization_async(run_id, objective, edge_ids, constraints)
        
        return run_id

    async def _execute_optimization_async(
        self,
        run_id: str,
        objective: OptimizationObjective,
        edge_ids: List[int],
        constraints: OptimizationConstraints
    ):
        """Execute the optimization process asynchronously"""
        start_time = time.time()
        
        try:
            self.logger.info(
                f"Starting portfolio optimization - "
                f"run_id: {run_id}, objective: {objective.value}, "
                f"edges: {len(edge_ids)}, max_legs: {constraints.max_legs}"
            )

            # Load edge candidates
            candidates = await self._load_edge_candidates(edge_ids)
            if len(candidates) < constraints.min_legs:
                raise ValueError(f"Insufficient edge candidates: {len(candidates)} < {constraints.min_legs}")

            # Filter candidates by minimum EV
            filtered_candidates = [
                c for c in candidates 
                if c.ev >= constraints.min_ev_per_leg
            ]
            
            if len(filtered_candidates) < constraints.min_legs:
                raise ValueError(f"Insufficient candidates after EV filter: {len(filtered_candidates)}")

            self._store_artifact(run_id, ArtifactType.TRACE, {
                "stage": "candidate_loading",
                "total_candidates": len(candidates),
                "filtered_candidates": len(filtered_candidates),
                "min_ev_filter": constraints.min_ev_per_leg
            })

            # Compute correlation matrix for candidates
            correlation_matrix, diagnostics = await self._compute_candidate_correlations(filtered_candidates)
            
            self._store_artifact(run_id, ArtifactType.TRACE, {
                "stage": "correlation_computation",
                "matrix_size": len(correlation_matrix),
                "is_psd": diagnostics.is_positive_semidefinite,
                "mean_correlation": diagnostics.mean_correlation
            })

            # Run optimization based on objective
            if objective == OptimizationObjective.EV:
                solutions = await self._optimize_ev(
                    filtered_candidates, correlation_matrix, constraints, run_id
                )
            elif objective == OptimizationObjective.EV_VAR_RATIO:
                solutions = await self._optimize_ev_var_ratio(
                    filtered_candidates, correlation_matrix, constraints, run_id
                )
            else:  # TARGET_PROB
                solutions = await self._optimize_target_prob(
                    filtered_candidates, correlation_matrix, constraints, run_id
                )

            # Store results
            duration_ms = int((time.time() - start_time) * 1000)
            best_score = max((s.score for s in solutions), default=0.0)
            
            opt_run = self.db.query(OptimizationRun).filter_by(id=int(run_id)).first()
            if opt_run:
                opt_run.solution_ticket_sets = [asdict(sol) for sol in solutions]
                opt_run.best_score = best_score
                opt_run.status = OptimizationStatus.SUCCESS
                opt_run.duration_ms = duration_ms
                self.db.commit()

            self.logger.info(
                f"Portfolio optimization completed - "
                f"run_id: {run_id}, solutions: {len(solutions)}, "
                f"best_score: {best_score:.4f}, duration: {duration_ms}ms"
            )

        except Exception as e:
            # Update run with error status
            opt_run = self.db.query(OptimizationRun).filter_by(id=int(run_id)).first()
            if opt_run:
                opt_run.status = OptimizationStatus.FAILED
                opt_run.error_message = str(e)
                opt_run.duration_ms = int((time.time() - start_time) * 1000)
                self.db.commit()

            self.logger.error(f"Portfolio optimization failed for run {run_id}: {e}")

    async def _load_edge_candidates(self, edge_ids: List[int]) -> List[EdgeCandidate]:
        """Load edge candidates from database"""
        try:
            edges = (
                self.db.query(Edge)
                .filter(Edge.id.in_(edge_ids))
                .filter(Edge.status == "ACTIVE")
                .all()
            )

            candidates = []
            for edge in edges:
                candidate = EdgeCandidate(
                    edge_id=edge.id,
                    prop_id=edge.prop_id,
                    prop_type="UNKNOWN",  # Would be loaded from external prop data
                    player_id=0,  # Would be loaded from external prop data
                    ev=edge.ev,
                    prob_over=edge.prob_over,
                    prob_under=1.0 - edge.prob_over,
                    offered_line=edge.offered_line,
                    fair_line=edge.fair_line,
                    volatility_score=0.5,  # Default volatility
                    correlation_cluster_id=edge.correlation_cluster_id
                )
                candidates.append(candidate)

            self.logger.info(f"Loaded {len(candidates)} edge candidates")
            return candidates

        except Exception as e:
            self.logger.error(f"Failed to load edge candidates: {e}")
            return []

    async def _compute_candidate_correlations(
        self,
        candidates: List[EdgeCandidate]
    ) -> Tuple[List[List[float]], Any]:
        """Compute correlation matrix for candidate edges"""
        try:
            prop_ids = [c.prop_id for c in candidates]
            
            correlation_matrix, diagnostics = self.correlation_engine.compute_pairwise_matrix(
                prop_ids=prop_ids,
                method="pearson",
                shrinkage=True,
                shrinkage_alpha=0.1
            )
            
            return correlation_matrix, diagnostics

        except Exception as e:
            self.logger.error(f"Failed to compute candidate correlations: {e}")
            # Return identity matrix as fallback
            n = len(candidates)
            identity_matrix = [[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]
            return identity_matrix, None

    async def _optimize_ev(
        self,
        candidates: List[EdgeCandidate],
        correlation_matrix: List[List[float]],
        constraints: OptimizationConstraints,
        run_id: str
    ) -> List[TicketSolution]:
        """Optimize for maximum expected value with correlation penalty"""
        
        def score_function(edge_set: Set[int]) -> float:
            indices = [i for i, c in enumerate(candidates) if c.edge_id in edge_set]
            if not indices:
                return 0.0
                
            # Calculate base EV
            total_ev = sum(candidates[i].ev for i in indices)
            
            # Calculate correlation penalty
            if len(indices) > 1:
                total_corr = 0.0
                count = 0
                for i in range(len(indices)):
                    for j in range(i + 1, len(indices)):
                        total_corr += abs(correlation_matrix[indices[i]][indices[j]])
                        count += 1
                avg_corr = total_corr / count if count > 0 else 0.0
            else:
                avg_corr = 0.0
            
            # Apply correlation penalty
            penalty = avg_corr * constraints.correlation_penalty_weight
            return total_ev * (1 - penalty)

        return await self._beam_search_optimization(
            candidates, correlation_matrix, constraints, score_function, run_id
        )

    async def _optimize_ev_var_ratio(
        self,
        candidates: List[EdgeCandidate],
        correlation_matrix: List[List[float]],
        constraints: OptimizationConstraints,
        run_id: str
    ) -> List[TicketSolution]:
        """Optimize for maximum EV/variance ratio (Sharpe-like ratio)"""
        
        def score_function(edge_set: Set[int]) -> float:
            indices = [i for i, c in enumerate(candidates) if c.edge_id in edge_set]
            if not indices:
                return 0.0
            
            # Calculate portfolio EV
            portfolio_ev = sum(candidates[i].ev for i in indices)
            
            # Estimate portfolio variance using correlation structure
            portfolio_var = 0.0
            for i in range(len(indices)):
                for j in range(len(indices)):
                    idx_i, idx_j = indices[i], indices[j]
                    vol_i = candidates[idx_i].volatility_score
                    vol_j = candidates[idx_j].volatility_score
                    corr = correlation_matrix[idx_i][idx_j] if idx_i != idx_j else 1.0
                    portfolio_var += vol_i * vol_j * corr
            
            # Avoid division by zero
            if portfolio_var <= 1e-8:
                portfolio_var = 1e-8
            
            return portfolio_ev / math.sqrt(portfolio_var)

        return await self._beam_search_optimization(
            candidates, correlation_matrix, constraints, score_function, run_id
        )

    async def _optimize_target_prob(
        self,
        candidates: List[EdgeCandidate],
        correlation_matrix: List[List[float]],
        constraints: OptimizationConstraints,
        run_id: str
    ) -> List[TicketSolution]:
        """Optimize for combinations meeting target probability threshold"""
        
        async def score_function_async(edge_set: Set[int]) -> float:
            # Run Monte Carlo simulation to get accurate joint probability
            legs = []
            indices = []
            for i, c in enumerate(candidates):
                if c.edge_id in edge_set:
                    leg = ParlayLeg(
                        edge_id=c.edge_id,
                        prop_id=c.prop_id,
                        prob_over=c.prob_over,
                        prob_under=c.prob_under,
                        offered_line=c.offered_line,
                        fair_line=c.fair_line,
                        volatility_score=c.volatility_score
                    )
                    legs.append(leg)
                    indices.append(i)
            
            if not legs:
                return 0.0
            
            # Extract relevant correlation submatrix
            sub_matrix = [
                [correlation_matrix[indices[i]][indices[j]] for j in range(len(indices))]
                for i in range(len(indices))
            ]
            
            # Run Monte Carlo simulation
            mc_result = self.monte_carlo.simulate_parlay(
                legs=legs,
                correlation_matrix=sub_matrix,
                draws=10000,  # Smaller sample for optimization speed
                adaptive=True
            )
            
            # Score based on whether we meet target probability and EV
            if mc_result.prob_joint >= constraints.target_probability:
                portfolio_ev = sum(candidates[i].ev for i in indices)
                return portfolio_ev  # Maximize EV among feasible solutions
            else:
                return 0.0  # Infeasible solutions get zero score

        # Use simpler heuristic for beam search, then validate with Monte Carlo
        def heuristic_score(edge_set: Set[int]) -> float:
            indices = [i for i, c in enumerate(candidates) if c.edge_id in edge_set]
            if not indices:
                return 0.0
            
            # Rough probability estimate assuming some correlation
            prob_product = 1.0
            avg_corr = 0.0
            count = 0
            
            for i in range(len(indices)):
                prob_product *= candidates[indices[i]].prob_over
                for j in range(i + 1, len(indices)):
                    avg_corr += correlation_matrix[indices[i]][indices[j]]
                    count += 1
            
            if count > 0:
                avg_corr /= count
            
            # Adjust for correlation (rough approximation)
            adjusted_prob = prob_product * (1 - avg_corr * 0.3)  # Simple adjustment
            
            if adjusted_prob >= constraints.target_probability:
                return sum(candidates[i].ev for i in indices)
            else:
                return 0.0

        # First run beam search with heuristic
        initial_solutions = await self._beam_search_optimization(
            candidates, correlation_matrix, constraints, heuristic_score, run_id
        )
        
        # Then validate and re-score top solutions with Monte Carlo
        validated_solutions = []
        for solution in initial_solutions[:20]:  # Only validate top 20
            edge_set = set(solution.edge_ids)
            accurate_score = await score_function_async(edge_set)
            
            if accurate_score > 0:  # Only keep feasible solutions
                solution.score = accurate_score
                validated_solutions.append(solution)
        
        # Sort by accurate score and return top solutions
        validated_solutions.sort(key=lambda x: x.score, reverse=True)
        return validated_solutions[:self.solutions_limit]

    async def _beam_search_optimization(
        self,
        candidates: List[EdgeCandidate],
        correlation_matrix: List[List[float]],
        constraints: OptimizationConstraints,
        score_function,
        run_id: str
    ) -> List[TicketSolution]:
        """Generic beam search optimization"""
        
        solutions = []
        
        # Initialize beam with single candidates
        beam = []
        for i, candidate in enumerate(candidates):
            if candidate.ev >= constraints.min_ev_per_leg:
                edge_set = {candidate.edge_id}
                score = score_function(edge_set)
                
                beam_state = BeamState(
                    current_edges=edge_set,
                    current_score=score,
                    current_ev=candidate.ev,
                    last_correlation=0.0
                )
                beam.append(beam_state)
        
        # Sort initial beam
        beam.sort(key=lambda x: x.current_score, reverse=True)
        beam = beam[:self.max_beam_width]
        
        # Iteratively expand beam
        for depth in range(1, constraints.max_legs):
            new_beam = []
            
            for state in beam:
                # Try adding each candidate not already in the set
                for i, candidate in enumerate(candidates):
                    if candidate.edge_id in state.current_edges:
                        continue
                    
                    # Check constraints before adding
                    if not self._check_expansion_constraints(
                        state.current_edges, candidate, candidates, correlation_matrix, constraints
                    ):
                        continue
                    
                    # Create new state
                    new_edge_set = state.current_edges | {candidate.edge_id}
                    new_score = score_function(new_edge_set)
                    new_ev = state.current_ev + candidate.ev
                    
                    new_state = BeamState(
                        current_edges=new_edge_set,
                        current_score=new_score,
                        current_ev=new_ev,
                        last_correlation=self._calculate_avg_correlation(
                            new_edge_set, candidates, correlation_matrix
                        )
                    )
                    new_beam.append(new_state)
            
            # Keep top beam_width states
            new_beam.sort(key=lambda x: x.current_score, reverse=True)
            beam = new_beam[:self.max_beam_width]
            
            # Extract complete solutions at valid depths
            if depth >= constraints.min_legs - 1:
                for state in beam[:self.solutions_limit]:
                    if len(state.current_edges) >= constraints.min_legs:
                        solution = await self._create_ticket_solution(
                            state, candidates, correlation_matrix
                        )
                        solutions.append(solution)
            
            # Log progress
            if beam:
                self._store_artifact(run_id, ArtifactType.HEURISTIC_STEP, {
                    "depth": depth + 1,
                    "beam_size": len(beam),
                    "best_score": beam[0].current_score,
                    "best_edges": list(beam[0].current_edges)
                })
        
        # Remove duplicates and sort solutions
        unique_solutions = []
        seen_edge_sets = set()
        for solution in solutions:
            edge_set_key = tuple(sorted(solution.edge_ids))
            if edge_set_key not in seen_edge_sets:
                seen_edge_sets.add(edge_set_key)
                unique_solutions.append(solution)
        
        unique_solutions.sort(key=lambda x: x.score, reverse=True)
        return unique_solutions[:self.solutions_limit]

    def _check_expansion_constraints(
        self,
        current_edges: Set[int],
        new_candidate: EdgeCandidate,
        all_candidates: List[EdgeCandidate],
        correlation_matrix: List[List[float]],
        constraints: OptimizationConstraints
    ) -> bool:
        """Check if adding new candidate violates constraints"""
        
        # Check maximum legs
        if len(current_edges) >= constraints.max_legs:
            return False
        
        # Find indices of current edges and new candidate
        current_indices = []
        new_candidate_idx = None
        
        for i, c in enumerate(all_candidates):
            if c.edge_id in current_edges:
                current_indices.append(i)
            elif c.edge_id == new_candidate.edge_id:
                new_candidate_idx = i
        
        if new_candidate_idx is None:
            return False
        
        # Check pairwise correlation constraints
        for idx in current_indices:
            corr = abs(correlation_matrix[idx][new_candidate_idx])
            if corr > constraints.max_pairwise_corr:
                return False
        
        # Check average correlation constraint
        all_indices = current_indices + [new_candidate_idx]
        if len(all_indices) > 1:
            total_corr = 0.0
            count = 0
            for i in range(len(all_indices)):
                for j in range(i + 1, len(all_indices)):
                    total_corr += abs(correlation_matrix[all_indices[i]][all_indices[j]])
                    count += 1
            avg_corr = total_corr / count if count > 0 else 0.0
            
            if avg_corr > constraints.max_avg_correlation:
                return False
        
        # Additional constraints (player exposure, prop type exposure) would go here
        # For now, simplified implementation
        
        return True

    def _calculate_avg_correlation(
        self,
        edge_set: Set[int],
        candidates: List[EdgeCandidate],
        correlation_matrix: List[List[float]]
    ) -> float:
        """Calculate average pairwise correlation for edge set"""
        
        indices = []
        for i, c in enumerate(candidates):
            if c.edge_id in edge_set:
                indices.append(i)
        
        if len(indices) < 2:
            return 0.0
        
        total_corr = 0.0
        count = 0
        for i in range(len(indices)):
            for j in range(i + 1, len(indices)):
                total_corr += abs(correlation_matrix[indices[i]][indices[j]])
                count += 1
        
        return total_corr / count if count > 0 else 0.0

    async def _create_ticket_solution(
        self,
        state: BeamState,
        candidates: List[EdgeCandidate],
        correlation_matrix: List[List[float]]
    ) -> TicketSolution:
        """Create ticket solution from beam state"""
        
        edge_ids = list(state.current_edges)
        
        # Calculate risk metrics
        risk_metrics = {
            "avg_correlation": state.last_correlation,
            "max_pairwise_corr": self._calculate_max_pairwise_correlation(
                state.current_edges, candidates, correlation_matrix
            ),
            "portfolio_volatility": self._estimate_portfolio_volatility(
                state.current_edges, candidates, correlation_matrix
            )
        }
        
        # Run Monte Carlo for accurate probability estimation (optional for speed)
        monte_carlo_result = None
        try:
            legs = []
            indices = []
            for i, c in enumerate(candidates):
                if c.edge_id in state.current_edges:
                    leg = ParlayLeg(
                        edge_id=c.edge_id,
                        prop_id=c.prop_id,
                        prob_over=c.prob_over,
                        prob_under=c.prob_under,
                        offered_line=c.offered_line,
                        fair_line=c.fair_line,
                        volatility_score=c.volatility_score
                    )
                    legs.append(leg)
                    indices.append(i)
            
            if legs:
                sub_matrix = [
                    [correlation_matrix[indices[i]][indices[j]] for j in range(len(indices))]
                    for i in range(len(indices))
                ]
                
                mc_result = self.monte_carlo.simulate_parlay(
                    legs=legs,
                    correlation_matrix=sub_matrix,
                    draws=5000,  # Smaller sample for optimization
                    adaptive=False
                )
                
                monte_carlo_result = {
                    "prob_joint": mc_result.prob_joint,
                    "ci_low": mc_result.ci_low,
                    "ci_high": mc_result.ci_high,
                    "ev_adjusted": mc_result.ev_adjusted
                }
        except Exception:
            pass  # Continue without Monte Carlo result
        
        return TicketSolution(
            edge_ids=edge_ids,
            score=state.current_score,
            expected_ev=state.current_ev,
            prob_joint=monte_carlo_result["prob_joint"] if monte_carlo_result else 0.0,
            avg_correlation=state.last_correlation,
            max_pairwise_corr=risk_metrics["max_pairwise_corr"],
            legs_count=len(edge_ids),
            risk_metrics=risk_metrics,
            monte_carlo_result=monte_carlo_result
        )

    def _calculate_max_pairwise_correlation(
        self,
        edge_set: Set[int],
        candidates: List[EdgeCandidate],
        correlation_matrix: List[List[float]]
    ) -> float:
        """Calculate maximum pairwise correlation in edge set"""
        
        indices = [i for i, c in enumerate(candidates) if c.edge_id in edge_set]
        
        max_corr = 0.0
        for i in range(len(indices)):
            for j in range(i + 1, len(indices)):
                corr = abs(correlation_matrix[indices[i]][indices[j]])
                max_corr = max(max_corr, corr)
        
        return max_corr

    def _estimate_portfolio_volatility(
        self,
        edge_set: Set[int],
        candidates: List[EdgeCandidate],
        correlation_matrix: List[List[float]]
    ) -> float:
        """Estimate portfolio volatility from correlation structure"""
        
        indices = [i for i, c in enumerate(candidates) if c.edge_id in edge_set]
        
        portfolio_var = 0.0
        for i in range(len(indices)):
            for j in range(len(indices)):
                idx_i, idx_j = indices[i], indices[j]
                vol_i = candidates[idx_i].volatility_score
                vol_j = candidates[idx_j].volatility_score
                corr = correlation_matrix[idx_i][idx_j]
                portfolio_var += vol_i * vol_j * corr
        
        return math.sqrt(portfolio_var) if portfolio_var > 0 else 0.0

    def _store_artifact(self, run_id: str, artifact_type: ArtifactType, content: Dict[str, Any]):
        """Store optimization artifact"""
        try:
            artifact = OptimizationArtifact(
                optimization_run_id=int(run_id),
                artifact_type=artifact_type,
                content=content
            )
            self.db.add(artifact)
            self.db.commit()
        except Exception as e:
            self.logger.warning(f"Failed to store artifact: {e}")
            self.db.rollback()

    def get_optimization_run(self, run_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve optimization run results"""
        try:
            run = self.db.query(OptimizationRun).filter_by(id=int(run_id)).first()
            if not run:
                return None
            
            return {
                "id": run.id,
                "objective": run.objective.value,
                "input_edge_ids": run.input_edge_ids,
                "constraints": run.constraints_json,
                "solution_ticket_sets": run.solution_ticket_sets,
                "best_score": run.best_score,
                "status": run.status.value,
                "error_message": run.error_message,
                "duration_ms": run.duration_ms,
                "created_at": run.created_at.isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Failed to retrieve optimization run {run_id}: {e}")
            return None

    def get_optimization_artifacts(self, run_id: str) -> List[Dict[str, Any]]:
        """Retrieve optimization artifacts"""
        try:
            artifacts = (
                self.db.query(OptimizationArtifact)
                .filter_by(optimization_run_id=int(run_id))
                .order_by(OptimizationArtifact.created_at)
                .all()
            )
            
            return [
                {
                    "id": artifact.id,
                    "artifact_type": artifact.artifact_type.value,
                    "content": artifact.content,
                    "created_at": artifact.created_at.isoformat()
                }
                for artifact in artifacts
            ]
            
        except Exception as e:
            self.logger.error(f"Failed to retrieve artifacts for run {run_id}: {e}")
            return []