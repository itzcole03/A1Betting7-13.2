"""Enhanced Ensemble ML Engine - Phase 8B Implementation
Advanced features: Quantum-inspired optimization, multi-objective selection, real-time adaptation
Built upon existing ensemble_engine.py foundation
"""

import asyncio
import logging
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
import joblib
from concurrent.futures import ThreadPoolExecutor
from scipy.optimize import minimize
from sklearn.metrics import accuracy_score, precision_score, recall_score
import warnings
warnings.filterwarnings('ignore')

# Import from existing foundation
from ensemble_engine import (
    UltraAdvancedEnsembleEngine, ModelType, PredictionContext, 
    EnsembleConfiguration, PredictionOutput, ModelMetrics
)

logger = logging.getLogger(__name__)

class OptimizationStrategy(str, Enum):
    """Advanced optimization strategies for ensemble weighting"""
    QUANTUM_INSPIRED = "quantum_inspired"
    MULTI_OBJECTIVE = "multi_objective"
    BAYESIAN_OPTIMIZATION = "bayesian_optimization"
    EVOLUTIONARY = "evolutionary"
    GRADIENT_BASED = "gradient_based"
    ADAPTIVE_LEARNING = "adaptive_learning"

@dataclass
class QuantumEnsembleConfig:
    """Configuration for quantum-inspired ensemble optimization"""
    quantum_iterations: int = 100
    entanglement_strength: float = 0.7
    superposition_states: int = 8
    measurement_threshold: float = 0.85
    coherence_time: float = 0.5
    noise_level: float = 0.1

@dataclass
class MultiObjectiveConfig:
    """Configuration for multi-objective ensemble optimization"""
    objectives: List[str] = None  # ['accuracy', 'diversity', 'speed', 'robustness']
    pareto_frontier_size: int = 10
    weight_constraints: Dict[str, Tuple[float, float]] = None
    convergence_threshold: float = 1e-6
    max_iterations: int = 500

    def __post_init__(self):
        if self.objectives is None:
            self.objectives = ['accuracy', 'diversity', 'speed', 'robustness']
        if self.weight_constraints is None:
            self.weight_constraints = {'accuracy': (0.2, 0.8), 'diversity': (0.1, 0.5)}

class QuantumInspiredOptimizer:
    """Quantum-inspired optimization for ensemble weights"""
    
    def __init__(self, config: QuantumEnsembleConfig):
        self.config = config
        self.quantum_states = {}
        self.entanglement_matrix = None
        
    async def optimize_weights(
        self,
        model_performances: Dict[str, float],
        correlation_matrix: np.ndarray,
        historical_data: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Optimize ensemble weights using quantum-inspired algorithms"""
        try:
            models = list(model_performances.keys())
            n_models = len(models)
            
            if n_models == 0:
                return {}
            
            # Initialize quantum states
            quantum_states = self._initialize_quantum_states(n_models)
            
            # Create entanglement matrix
            entanglement_matrix = self._create_entanglement_matrix(
                correlation_matrix, self.config.entanglement_strength
            )
            
            best_weights = None
            best_score = -np.inf
            
            for iteration in range(self.config.quantum_iterations):
                # Quantum evolution
                quantum_states = self._quantum_evolution(
                    quantum_states, entanglement_matrix, iteration
                )
                
                # Measurement and weight extraction
                weights = self._measure_quantum_states(quantum_states, models)
                
                # Evaluate ensemble performance
                score = await self._evaluate_quantum_ensemble(
                    weights, model_performances, historical_data
                )
                
                if score > best_score:
                    best_score = score
                    best_weights = weights.copy()
                
                # Apply quantum noise for exploration
                if iteration % 10 == 0:
                    quantum_states = self._apply_quantum_noise(
                        quantum_states, self.config.noise_level
                    )
            
            return best_weights or {model: 1.0/n_models for model in models}
            
        except Exception as e:
            logger.error(f"Quantum optimization failed: {e}")
            # Fallback to uniform weights
            return {model: 1.0/len(model_performances) for model in model_performances.keys()}
    
    def _initialize_quantum_states(self, n_models: int) -> np.ndarray:
        """Initialize quantum states in superposition"""
        states = np.random.complex128((n_models, self.config.superposition_states))
        # Normalize to unit magnitude
        for i in range(n_models):
            norm = np.linalg.norm(states[i])
            if norm > 0:
                states[i] /= norm
        return states
    
    def _create_entanglement_matrix(
        self, correlation_matrix: np.ndarray, strength: float
    ) -> np.ndarray:
        """Create entanglement matrix based on model correlations"""
        n_models = correlation_matrix.shape[0]
        entanglement = np.zeros((n_models, n_models), dtype=complex)
        
        for i in range(n_models):
            for j in range(i+1, n_models):
                # Entanglement strength based on correlation
                entanglement[i, j] = strength * correlation_matrix[i, j] * np.exp(1j * np.pi/4)
                entanglement[j, i] = np.conj(entanglement[i, j])
        
        return entanglement
    
    def _quantum_evolution(
        self, states: np.ndarray, entanglement: np.ndarray, iteration: int
    ) -> np.ndarray:
        """Evolve quantum states using Hamiltonian dynamics"""
        dt = self.config.coherence_time / self.config.quantum_iterations
        
        # Hamiltonian evolution
        for i in range(len(states)):
            # Self-evolution
            phase = np.exp(-1j * iteration * dt)
            states[i] *= phase
            
            # Entanglement effects
            for j in range(len(states)):
                if i != j:
                    coupling = entanglement[i, j] * dt
                    states[i] += coupling * states[j]
            
            # Renormalize
            norm = np.linalg.norm(states[i])
            if norm > 0:
                states[i] /= norm
        
        return states
    
    def _measure_quantum_states(
        self, states: np.ndarray, models: List[str]
    ) -> Dict[str, float]:
        """Measure quantum states to extract classical weights"""
        weights = {}
        
        for i, model in enumerate(models):
            # Probability amplitude
            probability = np.sum(np.abs(states[i])**2)
            weights[model] = float(probability)
        
        # Normalize weights
        total_weight = sum(weights.values())
        if total_weight > 0:
            weights = {k: v/total_weight for k, v in weights.items()}
        else:
            weights = {model: 1.0/len(models) for model in models}
        
        return weights
    
    def _apply_quantum_noise(
        self, states: np.ndarray, noise_level: float
    ) -> np.ndarray:
        """Apply quantum decoherence noise"""
        noise = np.random.normal(0, noise_level, states.shape) + \
                1j * np.random.normal(0, noise_level, states.shape)
        
        noisy_states = states + noise
        
        # Renormalize
        for i in range(len(noisy_states)):
            norm = np.linalg.norm(noisy_states[i])
            if norm > 0:
                noisy_states[i] /= norm
        
        return noisy_states
    
    async def _evaluate_quantum_ensemble(
        self,
        weights: Dict[str, float],
        performances: Dict[str, float],
        historical_data: List[Dict[str, Any]]
    ) -> float:
        """Evaluate quantum ensemble performance"""
        # Weighted performance score
        weighted_performance = sum(
            weights[model] * performances[model] 
            for model in weights.keys()
        )
        
        # Diversity bonus (entropy of weights)
        entropy = -sum(w * np.log(w + 1e-10) for w in weights.values())
        diversity_bonus = entropy / np.log(len(weights)) if len(weights) > 1 else 0
        
        # Historical consistency
        consistency_score = await self._calculate_consistency(weights, historical_data)
        
        # Composite score
        return 0.6 * weighted_performance + 0.2 * diversity_bonus + 0.2 * consistency_score
    
    async def _calculate_consistency(
        self, weights: Dict[str, float], historical_data: List[Dict[str, Any]]
    ) -> float:
        """Calculate consistency of weights with historical performance"""
        if not historical_data:
            return 0.5
        
        # Simplified consistency calculation
        recent_data = historical_data[-10:]  # Last 10 predictions
        consistency_scores = []
        
        for data in recent_data:
            if 'model_weights' in data:
                historical_weights = data['model_weights']
                # Calculate weight similarity (cosine similarity)
                common_models = set(weights.keys()) & set(historical_weights.keys())
                if common_models:
                    w1 = np.array([weights.get(m, 0) for m in common_models])
                    w2 = np.array([historical_weights.get(m, 0) for m in common_models])
                    
                    if np.linalg.norm(w1) > 0 and np.linalg.norm(w2) > 0:
                        similarity = np.dot(w1, w2) / (np.linalg.norm(w1) * np.linalg.norm(w2))
                        consistency_scores.append(similarity)
        
        return np.mean(consistency_scores) if consistency_scores else 0.5

class MultiObjectiveOptimizer:
    """Multi-objective optimization for ensemble selection"""
    
    def __init__(self, config: MultiObjectiveConfig):
        self.config = config
        
    async def optimize_ensemble(
        self,
        candidate_models: List[str],
        model_metrics: Dict[str, ModelMetrics],
        context: PredictionContext
    ) -> Tuple[List[str], Dict[str, float]]:
        """Optimize ensemble using multi-objective criteria"""
        try:
            # Calculate objective scores for each model
            objective_scores = await self._calculate_objective_scores(
                candidate_models, model_metrics, context
            )
            
            # Find Pareto optimal solutions
            pareto_solutions = self._find_pareto_frontier(
                candidate_models, objective_scores
            )
            
            # Select best solution from Pareto frontier
            best_solution = await self._select_from_pareto_frontier(
                pareto_solutions, objective_scores
            )
            
            # Calculate optimal weights for selected models
            weights = await self._calculate_optimal_weights(
                best_solution, model_metrics
            )
            
            return best_solution, weights
            
        except Exception as e:
            logger.error(f"Multi-objective optimization failed: {e}")
            # Fallback selection
            top_models = sorted(
                candidate_models,
                key=lambda m: model_metrics[m].accuracy,
                reverse=True
            )[:5]
            uniform_weights = {model: 1.0/len(top_models) for model in top_models}
            return top_models, uniform_weights
    
    async def _calculate_objective_scores(
        self,
        models: List[str],
        metrics: Dict[str, ModelMetrics],
        context: PredictionContext
    ) -> Dict[str, Dict[str, float]]:
        """Calculate scores for each objective"""
        scores = {}
        
        for model in models:
            model_metrics = metrics[model]
            model_scores = {}
            
            # Accuracy objective
            model_scores['accuracy'] = model_metrics.accuracy
            
            # Speed objective (inverse of processing time)
            model_scores['speed'] = 1.0 / (1.0 + model_metrics.avg_return)  # Placeholder
            
            # Robustness objective
            model_scores['robustness'] = model_metrics.robustness_score
            
            # Diversity objective (calculated later)
            model_scores['diversity'] = 0.5  # Placeholder
            
            scores[model] = model_scores
        
        # Calculate diversity scores
        await self._calculate_diversity_scores(scores, models)
        
        return scores
    
    async def _calculate_diversity_scores(
        self, scores: Dict[str, Dict[str, float]], models: List[str]
    ):
        """Calculate diversity scores between models"""
        n_models = len(models)
        
        for i, model1 in enumerate(models):
            diversity_sum = 0.0
            
            for j, model2 in enumerate(models):
                if i != j:
                    # Calculate diversity based on prediction differences
                    # This is a simplified calculation
                    diversity = abs(
                        scores[model1]['accuracy'] - scores[model2]['accuracy']
                    )
                    diversity_sum += diversity
            
            # Average diversity
            scores[model1]['diversity'] = diversity_sum / (n_models - 1) if n_models > 1 else 0.0
    
    def _find_pareto_frontier(
        self,
        models: List[str],
        objective_scores: Dict[str, Dict[str, float]]
    ) -> List[List[str]]:
        """Find Pareto optimal solutions"""
        pareto_solutions = []
        
        # Generate all possible combinations up to max size
        from itertools import combinations
        
        max_ensemble_size = min(len(models), 8)  # Reasonable limit
        
        for size in range(2, max_ensemble_size + 1):
            for combination in combinations(models, size):
                if self._is_pareto_optimal(
                    list(combination), pareto_solutions, objective_scores
                ):
                    pareto_solutions.append(list(combination))
        
        return pareto_solutions[:self.config.pareto_frontier_size]
    
    def _is_pareto_optimal(
        self,
        candidate: List[str],
        existing_solutions: List[List[str]],
        objective_scores: Dict[str, Dict[str, float]]
    ) -> bool:
        """Check if candidate solution is Pareto optimal"""
        candidate_scores = self._aggregate_ensemble_scores(candidate, objective_scores)
        
        for existing in existing_solutions:
            existing_scores = self._aggregate_ensemble_scores(existing, objective_scores)
            
            # Check if existing dominates candidate
            dominates = True
            for objective in self.config.objectives:
                if existing_scores[objective] <= candidate_scores[objective]:
                    dominates = False
                    break
            
            if dominates:
                return False
        
        return True
    
    def _aggregate_ensemble_scores(
        self, ensemble: List[str], objective_scores: Dict[str, Dict[str, float]]
    ) -> Dict[str, float]:
        """Aggregate objective scores for an ensemble"""
        aggregated = {}
        
        for objective in self.config.objectives:
            if objective == 'diversity':
                # For diversity, take the average
                scores = [objective_scores[model][objective] for model in ensemble]
                aggregated[objective] = np.mean(scores)
            else:
                # For other objectives, take weighted average
                scores = [objective_scores[model][objective] for model in ensemble]
                aggregated[objective] = np.mean(scores)
        
        return aggregated
    
    async def _select_from_pareto_frontier(
        self,
        pareto_solutions: List[List[str]],
        objective_scores: Dict[str, Dict[str, float]]
    ) -> List[str]:
        """Select best solution from Pareto frontier"""
        if not pareto_solutions:
            return []
        
        # Score each solution using weighted objectives
        solution_scores = {}
        
        # Default weights for objectives
        objective_weights = {
            'accuracy': 0.4,
            'diversity': 0.2,
            'speed': 0.2,
            'robustness': 0.2
        }
        
        for solution in pareto_solutions:
            aggregated_scores = self._aggregate_ensemble_scores(solution, objective_scores)
            
            # Calculate weighted score
            weighted_score = sum(
                objective_weights.get(obj, 0.25) * score
                for obj, score in aggregated_scores.items()
            )
            
            solution_scores[tuple(solution)] = weighted_score
        
        # Return solution with highest weighted score
        best_solution = max(solution_scores.items(), key=lambda x: x[1])
        return list(best_solution[0])
    
    async def _calculate_optimal_weights(
        self, selected_models: List[str], model_metrics: Dict[str, ModelMetrics]
    ) -> Dict[str, float]:
        """Calculate optimal weights for selected models"""
        if not selected_models:
            return {}
        
        # Use inverse variance weighting based on model uncertainty
        weights = {}
        total_inverse_variance = 0.0
        
        for model in selected_models:
            # Use model confidence as proxy for inverse variance
            confidence = model_metrics[model].model_confidence
            inverse_variance = confidence / (1.0 - confidence + 1e-6)
            weights[model] = inverse_variance
            total_inverse_variance += inverse_variance
        
        # Normalize weights
        if total_inverse_variance > 0:
            weights = {k: v/total_inverse_variance for k, v in weights.items()}
        else:
            # Uniform weights as fallback
            weights = {model: 1.0/len(selected_models) for model in selected_models}
        
        return weights

class EnhancedEnsembleEngine(UltraAdvancedEnsembleEngine):
    """Enhanced ensemble engine with advanced optimization strategies"""
    
    def __init__(self):
        super().__init__()
        self.quantum_optimizer = QuantumInspiredOptimizer(QuantumEnsembleConfig())
        self.multi_objective_optimizer = MultiObjectiveOptimizer(MultiObjectiveConfig())
        self.optimization_strategy = OptimizationStrategy.MULTI_OBJECTIVE
        self.performance_history = []
        
    async def predict_enhanced(
        self,
        features: Dict[str, float],
        context: PredictionContext = PredictionContext.PRE_GAME,
        optimization_strategy: OptimizationStrategy = OptimizationStrategy.MULTI_OBJECTIVE
    ) -> PredictionOutput:
        """Enhanced prediction with advanced optimization"""
        try:
            self.optimization_strategy = optimization_strategy
            
            # Get candidate models
            candidate_models = self.model_selector.get_active_models()
            
            if not candidate_models:
                raise ValueError("No active models available")
            
            # Select optimal ensemble using chosen strategy
            if optimization_strategy == OptimizationStrategy.QUANTUM_INSPIRED:
                selected_models, weights = await self._quantum_ensemble_selection(
                    candidate_models, features, context
                )
            elif optimization_strategy == OptimizationStrategy.MULTI_OBJECTIVE:
                selected_models, weights = await self._multi_objective_selection(
                    candidate_models, context
                )
            else:
                # Fallback to parent class method
                return await super().predict(features, context)
            
            # Generate predictions from selected models
            model_predictions = await self._generate_model_predictions(
                selected_models, features, context
            )
            
            # Calculate enhanced ensemble prediction
            ensemble_result = await self._calculate_enhanced_ensemble_prediction(
                model_predictions, weights, features, context
            )
            
            # Store performance data for learning
            self._store_prediction_performance(
                ensemble_result, selected_models, weights, context
            )
            
            return ensemble_result
            
        except Exception as e:
            logger.error(f"Enhanced prediction failed: {e}")
            # Fallback to parent class
            return await super().predict(features, context)
    
    async def _quantum_ensemble_selection(
        self,
        candidate_models: List[str],
        features: Dict[str, float],
        context: PredictionContext
    ) -> Tuple[List[str], Dict[str, float]]:
        """Select ensemble using quantum-inspired optimization"""
        # Get model performances
        model_performances = {}
        for model in candidate_models:
            metrics = self.model_registry.model_metrics.get(model)
            if metrics:
                model_performances[model] = metrics.accuracy
            else:
                model_performances[model] = 0.5
        
        # Create correlation matrix (simplified)
        n_models = len(candidate_models)
        correlation_matrix = np.random.rand(n_models, n_models)
        correlation_matrix = (correlation_matrix + correlation_matrix.T) / 2
        np.fill_diagonal(correlation_matrix, 1.0)
        
        # Optimize weights
        weights = await self.quantum_optimizer.optimize_weights(
            model_performances, correlation_matrix, self.performance_history
        )
        
        # Select models with significant weights
        threshold = 1.0 / (len(candidate_models) * 2)  # Dynamic threshold
        selected_models = [
            model for model, weight in weights.items() 
            if weight > threshold
        ]
        
        return selected_models, weights
    
    async def _multi_objective_selection(
        self, candidate_models: List[str], context: PredictionContext
    ) -> Tuple[List[str], Dict[str, float]]:
        """Select ensemble using multi-objective optimization"""
        return await self.multi_objective_optimizer.optimize_ensemble(
            candidate_models, self.model_registry.model_metrics, context
        )
    
    async def _calculate_enhanced_ensemble_prediction(
        self,
        model_predictions: List[PredictionOutput],
        weights: Dict[str, float],
        features: Dict[str, float],
        context: PredictionContext
    ) -> PredictionOutput:
        """Calculate enhanced ensemble prediction with uncertainty quantification"""
        if not model_predictions:
            raise ValueError("No model predictions available")
        
        # Weighted prediction
        weighted_prediction = sum(
            pred.predicted_value * weights.get(pred.model_name, 0.0)
            for pred in model_predictions
        )
        
        # Enhanced confidence calculation
        confidence_scores = [pred.prediction_probability for pred in model_predictions]
        weighted_confidence = sum(
            conf * weights.get(model_predictions[i].model_name, 0.0)
            for i, conf in enumerate(confidence_scores)
        )
        
        # Uncertainty quantification
        prediction_variance = np.var([pred.predicted_value for pred in model_predictions])
        weight_entropy = -sum(w * np.log(w + 1e-10) for w in weights.values())
        
        uncertainty_metrics = {
            'prediction_variance': float(prediction_variance),
            'weight_entropy': float(weight_entropy),
            'model_agreement': float(1.0 - prediction_variance),
            'ensemble_diversity': float(weight_entropy / np.log(len(weights)))
        }
        
        # Aggregate feature importance
        feature_importance = {}
        for pred in model_predictions:
            weight = weights.get(pred.model_name, 0.0)
            for feature, importance in pred.feature_importance.items():
                feature_importance[feature] = feature_importance.get(feature, 0.0) + weight * importance
        
        # Create enhanced prediction output
        enhanced_prediction = PredictionOutput(
            model_name="enhanced_ensemble",
            model_type=ModelType.NEURAL_NETWORK,  # Ensemble type
            predicted_value=weighted_prediction,
            confidence_interval=(
                weighted_prediction - 2 * np.sqrt(prediction_variance),
                weighted_prediction + 2 * np.sqrt(prediction_variance)
            ),
            prediction_probability=weighted_confidence,
            feature_importance=feature_importance,
            shap_values={},  # Aggregate SHAP values if needed
            uncertainty_metrics=uncertainty_metrics,
            model_agreement=1.0 - prediction_variance,
            prediction_context=context,
            metadata={
                'optimization_strategy': self.optimization_strategy.value,
                'selected_models': [pred.model_name for pred in model_predictions],
                'model_weights': weights,
                'ensemble_size': len(model_predictions)
            },
            processing_time=sum(pred.processing_time for pred in model_predictions),
            timestamp=datetime.now(timezone.utc)
        )
        
        return enhanced_prediction
    
    def _store_prediction_performance(
        self,
        prediction: PredictionOutput,
        selected_models: List[str],
        weights: Dict[str, float],
        context: PredictionContext
    ):
        """Store prediction performance for future learning"""
        performance_data = {
            'timestamp': prediction.timestamp,
            'context': context,
            'selected_models': selected_models,
            'model_weights': weights,
            'predicted_value': prediction.predicted_value,
            'confidence': prediction.prediction_probability,
            'uncertainty_metrics': prediction.uncertainty_metrics,
            'optimization_strategy': self.optimization_strategy.value
        }
        
        self.performance_history.append(performance_data)
        
        # Keep only recent history
        if len(self.performance_history) > 1000:
            self.performance_history = self.performance_history[-1000:]
    
    async def get_enhanced_health_metrics(self) -> Dict[str, Any]:
        """Get enhanced health metrics including optimization performance"""
        base_health = await super().get_ensemble_health()
        
        enhanced_metrics = {
            'optimization_strategy': self.optimization_strategy.value,
            'quantum_optimizer_status': 'active' if self.quantum_optimizer else 'inactive',
            'multi_objective_optimizer_status': 'active' if self.multi_objective_optimizer else 'inactive',
            'performance_history_size': len(self.performance_history),
            'recent_optimization_performance': await self._calculate_recent_optimization_performance()
        }
        
        base_health.update(enhanced_metrics)
        return base_health
    
    async def _calculate_recent_optimization_performance(self) -> Dict[str, float]:
        """Calculate recent optimization performance metrics"""
        if len(self.performance_history) < 10:
            return {'insufficient_data': True}
        
        recent_predictions = self.performance_history[-50:]  # Last 50 predictions
        
        # Calculate average confidence
        avg_confidence = np.mean([p['confidence'] for p in recent_predictions])
        
        # Calculate prediction stability
        predicted_values = [p['predicted_value'] for p in recent_predictions]
        prediction_stability = 1.0 / (1.0 + np.std(predicted_values))
        
        # Calculate ensemble diversity
        ensemble_sizes = [len(p['selected_models']) for p in recent_predictions]
        avg_ensemble_size = np.mean(ensemble_sizes)
        
        return {
            'average_confidence': float(avg_confidence),
            'prediction_stability': float(prediction_stability),
            'average_ensemble_size': float(avg_ensemble_size),
            'optimization_consistency': 1.0  # Placeholder
        }

# Factory function for easy instantiation
async def create_enhanced_ensemble_engine() -> EnhancedEnsembleEngine:
    """Create and initialize enhanced ensemble engine"""
    engine = EnhancedEnsembleEngine()
    await engine.initialize()
    return engine 