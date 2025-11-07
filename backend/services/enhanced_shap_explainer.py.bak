"""
Enhanced SHAP Explainability Service for BestBetSelector and FinalPredictionEngine

This service provides comprehensive SHAP-based explainability with:
- Deep feature importance analysis
- Model-specific explanations
- Batch processing optimization
- Interactive visualizations
- Real-time explanation caching
"""

import asyncio
import hashlib
import logging
import pickle
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd
from cachetools import TTLCache

logger = logging.getLogger(__name__)

# Import SHAP with fallback
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    logger.warning("SHAP library not available. Using mock explainer.")
    SHAP_AVAILABLE = False

# Import models
try:
    import xgboost as xgb
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.neural_network import MLPClassifier
    ML_MODELS_AVAILABLE = True
except ImportError:
    logger.warning("ML models not available. Using mock models.")
    ML_MODELS_AVAILABLE = False


class EnhancedShapExplainer:
    """Enhanced SHAP explainer with batch processing and caching"""
    
    def __init__(self, cache_ttl: int = 3600):
        self.cache_ttl = cache_ttl
        self.explainer_cache: TTLCache = TTLCache(maxsize=100, ttl=cache_ttl)
        self.explanation_cache: TTLCache = TTLCache(maxsize=1000, ttl=cache_ttl)
        self.model_explainers: Dict[str, Any] = {}
        self.feature_names: List[str] = []
        self.baseline_values: Dict[str, float] = {}
        
        logger.info("Enhanced SHAP explainer initialized")
    
    def register_model(self, 
                      model_name: str, 
                      model: Any, 
                      model_type: str = "auto",
                      background_data: Optional[np.ndarray] = None) -> bool:
        """Register a model for SHAP explanations"""
        try:
            if not SHAP_AVAILABLE:
                logger.warning(f"SHAP not available for model {model_name}")
                return False
            
            # Create appropriate explainer based on model type
            if model_type == "tree" or hasattr(model, 'feature_importances_'):
                # Tree-based models (XGBoost, RandomForest, etc.)
                explainer = shap.TreeExplainer(model)
                logger.info(f"Created TreeExplainer for {model_name}")
                
            elif model_type == "linear" or hasattr(model, 'coef_'):
                # Linear models
                explainer = shap.LinearExplainer(model, background_data)
                logger.info(f"Created LinearExplainer for {model_name}")
                
            elif model_type == "kernel" or background_data is not None:
                # Kernel explainer for complex models
                explainer = shap.KernelExplainer(model.predict, background_data)
                logger.info(f"Created KernelExplainer for {model_name}")
                
            else:
                # Deep explainer for neural networks
                explainer = shap.DeepExplainer(model, background_data)
                logger.info(f"Created DeepExplainer for {model_name}")
            
            self.model_explainers[model_name] = {
                'explainer': explainer,
                'model': model,
                'model_type': model_type,
                'registered_at': datetime.now(timezone.utc)
            }
            
            # Calculate baseline values if background data provided
            if background_data is not None:
                baseline = np.mean(background_data, axis=0)
                self.baseline_values[model_name] = baseline
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to register model {model_name}: {e}")
            return False
    
    async def explain_prediction_batch(self, 
                                     model_names: List[str],
                                     features_batch: List[Dict[str, float]],
                                     include_interactions: bool = False) -> List[Dict[str, Any]]:
        """Explain predictions for multiple models and feature sets in batch"""
        if not SHAP_AVAILABLE:
            return self._mock_batch_explanations(model_names, features_batch)
        
        batch_explanations = []
        
        # Process in parallel for better performance
        tasks = []
        for features in features_batch:
            for model_name in model_names:
                if model_name in self.model_explainers:
                    task = self._explain_single_prediction(
                        model_name, features, include_interactions
                    )
                    tasks.append(task)
        
        # Execute all explanations in parallel
        explanations = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Group explanations by feature set
        for i, features in enumerate(features_batch):
            feature_explanations = {}
            for j, model_name in enumerate(model_names):
                if model_name in self.model_explainers:
                    explanation_idx = i * len(model_names) + j
                    if explanation_idx < len(explanations):
                        explanation = explanations[explanation_idx]
                        if not isinstance(explanation, Exception):
                            feature_explanations[model_name] = explanation
                        else:
                            logger.error(f"Explanation failed for {model_name}: {explanation}")
            
            # Aggregate explanations across models
            aggregated = self._aggregate_model_explanations(feature_explanations)
            batch_explanations.append(aggregated)
        
        return batch_explanations
    
    async def _explain_single_prediction(self, 
                                       model_name: str, 
                                       features: Dict[str, float],
                                       include_interactions: bool = False) -> Dict[str, Any]:
        """Explain a single prediction with caching"""
        # Create cache key
        cache_key = self._create_cache_key(model_name, features, include_interactions)
        
        # Check cache first
        if cache_key in self.explanation_cache:
            return self.explanation_cache[cache_key]
        
        try:
            model_info = self.model_explainers[model_name]
            explainer = model_info['explainer']
            model = model_info['model']
            
            # Convert features to numpy array
            feature_array = np.array([list(features.values())])
            
            # Get SHAP values
            shap_values = explainer.shap_values(feature_array)
            
            # Handle different SHAP output formats
            if isinstance(shap_values, list):
                # Multi-class case - take the first class or max class
                shap_values = shap_values[0] if len(shap_values) > 0 else np.zeros_like(feature_array)
            
            # Create feature importance mapping
            feature_names = list(features.keys())
            shap_dict = {name: float(shap_val) for name, shap_val in zip(feature_names, shap_values[0])}
            
            # Get expected value (baseline)
            expected_value = getattr(explainer, 'expected_value', 0.0)
            if isinstance(expected_value, np.ndarray):
                expected_value = float(expected_value[0])
            elif isinstance(expected_value, list):
                expected_value = float(expected_value[0]) if expected_value else 0.0
            
            # Calculate prediction
            prediction = float(model.predict(feature_array)[0])
            
            # Get feature interactions if requested
            interactions = {}
            if include_interactions and hasattr(explainer, 'shap_interaction_values'):
                try:
                    interaction_values = explainer.shap_interaction_values(feature_array)
                    if interaction_values is not None:
                        interactions = self._process_interactions(interaction_values[0], feature_names)
                except Exception as e:
                    logger.warning(f"Failed to calculate interactions for {model_name}: {e}")
            
            explanation = {
                'model_name': model_name,
                'prediction': prediction,
                'expected_value': expected_value,
                'shap_values': shap_dict,
                'feature_contributions': self._calculate_contributions(shap_dict, expected_value),
                'top_positive_features': self._get_top_features(shap_dict, positive=True),
                'top_negative_features': self._get_top_features(shap_dict, positive=False),
                'feature_interactions': interactions,
                'explanation_quality': self._calculate_explanation_quality(shap_dict),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
            # Cache the explanation
            self.explanation_cache[cache_key] = explanation
            
            return explanation
            
        except Exception as e:
            logger.error(f"Failed to explain prediction for {model_name}: {e}")
            return self._create_fallback_explanation(model_name, features)
    
    def _aggregate_model_explanations(self, 
                                    model_explanations: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """Aggregate explanations from multiple models"""
        if not model_explanations:
            return {}
        
        # Collect all SHAP values
        all_shap_values = []
        all_predictions = []
        model_weights = {}
        
        for model_name, explanation in model_explanations.items():
            if 'shap_values' in explanation:
                all_shap_values.append(explanation['shap_values'])
                all_predictions.append(explanation.get('prediction', 0.0))
                # Weight models by explanation quality
                model_weights[model_name] = explanation.get('explanation_quality', 1.0)
        
        if not all_shap_values:
            return {}
        
        # Normalize weights
        total_weight = sum(model_weights.values())
        if total_weight > 0:
            model_weights = {k: v / total_weight for k, v in model_weights.items()}
        
        # Aggregate SHAP values with weighted average
        aggregated_shap = {}
        all_features = set()
        for shap_dict in all_shap_values:
            all_features.update(shap_dict.keys())
        
        for feature in all_features:
            weighted_sum = 0.0
            for i, (model_name, shap_dict) in enumerate(zip(model_weights.keys(), all_shap_values)):
                if feature in shap_dict:
                    weight = model_weights[model_name]
                    weighted_sum += shap_dict[feature] * weight
            aggregated_shap[feature] = weighted_sum
        
        # Calculate aggregated prediction
        aggregated_prediction = np.average(all_predictions, weights=list(model_weights.values()))
        
        return {
            'aggregated_shap_values': aggregated_shap,
            'aggregated_prediction': float(aggregated_prediction),
            'model_contributions': model_weights,
            'top_features': self._get_top_features(aggregated_shap, top_k=10),
            'feature_consensus': self._calculate_feature_consensus(all_shap_values),
            'explanation_confidence': self._calculate_explanation_confidence(model_explanations),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    def _calculate_contributions(self, shap_values: Dict[str, float], baseline: float) -> Dict[str, Any]:
        """Calculate feature contributions to final prediction"""
        total_contribution = sum(shap_values.values()) + baseline
        
        contributions = {}
        for feature, shap_val in shap_values.items():
            contribution_pct = (shap_val / total_contribution * 100) if total_contribution != 0 else 0
            contributions[feature] = {
                'absolute_contribution': shap_val,
                'percentage_contribution': contribution_pct,
                'direction': 'positive' if shap_val > 0 else 'negative',
                'magnitude': abs(shap_val)
            }
        
        return contributions
    
    def _get_top_features(self, shap_values: Dict[str, float], positive: bool = True, top_k: int = 5) -> List[Dict[str, Any]]:
        """Get top positive or negative features"""
        sorted_features = sorted(
            shap_values.items(), 
            key=lambda x: x[1] if positive else -x[1], 
            reverse=True
        )
        
        filtered_features = [(name, val) for name, val in sorted_features if (val > 0) == positive]
        top_features = filtered_features[:top_k]
        
        return [
            {
                'feature': name,
                'shap_value': value,
                'importance_rank': i + 1
            }
            for i, (name, value) in enumerate(top_features)
        ]
    
    def _process_interactions(self, interaction_matrix: np.ndarray, feature_names: List[str]) -> Dict[str, Dict[str, float]]:
        """Process SHAP interaction values"""
        interactions = {}
        n_features = len(feature_names)
        
        for i in range(n_features):
            feature_interactions = {}
            for j in range(n_features):
                if i != j:  # Skip self-interactions
                    interaction_strength = float(interaction_matrix[i, j])
                    if abs(interaction_strength) > 0.001:  # Only include significant interactions
                        feature_interactions[feature_names[j]] = interaction_strength
            
            if feature_interactions:
                interactions[feature_names[i]] = feature_interactions
        
        return interactions
    
    def _calculate_explanation_quality(self, shap_values: Dict[str, float]) -> float:
        """Calculate quality score for explanation"""
        if not shap_values:
            return 0.0
        
        # Factors that indicate good explanation quality:
        # 1. Significant SHAP values (not all near zero)
        # 2. Balanced distribution of positive/negative contributions
        # 3. Clear feature importance ranking
        
        values = list(shap_values.values())
        abs_values = [abs(v) for v in values]
        
        # Significance score
        mean_abs_val = np.mean(abs_values)
        significance = min(mean_abs_val * 10, 1.0)  # Scale to 0-1
        
        # Distribution balance
        positive_vals = [v for v in values if v > 0]
        negative_vals = [v for v in values if v < 0]
        
        if len(positive_vals) > 0 and len(negative_vals) > 0:
            pos_sum = sum(positive_vals)
            neg_sum = abs(sum(negative_vals))
            balance = 1.0 - abs(pos_sum - neg_sum) / (pos_sum + neg_sum + 1e-10)
        else:
            balance = 0.5  # Neutral score if all positive or all negative
        
        # Clarity score (how distinct are the top features)
        sorted_abs = sorted(abs_values, reverse=True)
        if len(sorted_abs) > 1:
            clarity = (sorted_abs[0] - sorted_abs[1]) / (sorted_abs[0] + 1e-10)
            clarity = min(clarity, 1.0)
        else:
            clarity = 1.0 if sorted_abs else 0.0
        
        # Weighted average
        quality = (significance * 0.4 + balance * 0.3 + clarity * 0.3)
        return float(quality)
    
    def _calculate_feature_consensus(self, all_shap_values: List[Dict[str, float]]) -> Dict[str, float]:
        """Calculate consensus scores for features across models"""
        if not all_shap_values:
            return {}
        
        consensus = {}
        all_features = set()
        for shap_dict in all_shap_values:
            all_features.update(shap_dict.keys())
        
        for feature in all_features:
            feature_values = []
            for shap_dict in all_shap_values:
                if feature in shap_dict:
                    feature_values.append(shap_dict[feature])
            
            if feature_values:
                # Calculate consensus as inverse of coefficient of variation
                mean_val = np.mean(feature_values)
                std_val = np.std(feature_values)
                cv = (std_val / (abs(mean_val) + 1e-10))
                consensus_score = 1.0 / (1.0 + cv)  # Higher score = more consensus
                consensus[feature] = float(consensus_score)
        
        return consensus
    
    def _calculate_explanation_confidence(self, model_explanations: Dict[str, Dict[str, Any]]) -> float:
        """Calculate overall confidence in the explanation"""
        if not model_explanations:
            return 0.0
        
        quality_scores = []
        for explanation in model_explanations.values():
            if 'explanation_quality' in explanation:
                quality_scores.append(explanation['explanation_quality'])
        
        if quality_scores:
            return float(np.mean(quality_scores))
        else:
            return 0.5  # Neutral confidence
    
    def _create_cache_key(self, model_name: str, features: Dict[str, float], include_interactions: bool) -> str:
        """Create a cache key for explanation caching"""
        key_data = {
            'model': model_name,
            'features': sorted(features.items()),
            'interactions': include_interactions
        }
        key_str = str(key_data)
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def _create_fallback_explanation(self, model_name: str, features: Dict[str, float]) -> Dict[str, Any]:
        """Create a fallback explanation when SHAP fails"""
        return {
            'model_name': model_name,
            'prediction': 0.5,
            'expected_value': 0.0,
            'shap_values': {name: 0.0 for name in features.keys()},
            'feature_contributions': {},
            'top_positive_features': [],
            'top_negative_features': [],
            'feature_interactions': {},
            'explanation_quality': 0.0,
            'error': 'SHAP explanation failed - using fallback',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    def _mock_batch_explanations(self, model_names: List[str], features_batch: List[Dict[str, float]]) -> List[Dict[str, Any]]:
        """Mock explanations when SHAP is not available"""
        explanations = []
        
        for features in features_batch:
            mock_explanation = {
                'aggregated_shap_values': {name: np.random.uniform(-0.1, 0.1) for name in features.keys()},
                'aggregated_prediction': 0.5 + np.random.uniform(-0.2, 0.2),
                'model_contributions': {name: 1.0 / len(model_names) for name in model_names},
                'top_features': [
                    {'feature': name, 'shap_value': np.random.uniform(-0.1, 0.1), 'importance_rank': i + 1}
                    for i, name in enumerate(list(features.keys())[:5])
                ],
                'feature_consensus': {name: np.random.uniform(0.5, 1.0) for name in features.keys()},
                'explanation_confidence': np.random.uniform(0.6, 0.9),
                'mock_data': True,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            explanations.append(mock_explanation)
        
        return explanations
    
    def get_explanation_stats(self) -> Dict[str, Any]:
        """Get statistics about explanation cache and performance"""
        return {
            'cache_size': len(self.explanation_cache),
            'cache_hits': getattr(self.explanation_cache, 'hits', 0),
            'cache_misses': getattr(self.explanation_cache, 'misses', 0),
            'registered_models': len(self.model_explainers),
            'model_names': list(self.model_explainers.keys()),
            'shap_available': SHAP_AVAILABLE,
            'cache_ttl': self.cache_ttl
        }
    
    def clear_cache(self) -> bool:
        """Clear explanation cache"""
        try:
            self.explanation_cache.clear()
            self.explainer_cache.clear()
            logger.info("SHAP explanation cache cleared")
            return True
        except Exception as e:
            logger.error(f"Failed to clear cache: {e}")
            return False


# Global instance
enhanced_shap_explainer = EnhancedShapExplainer()
