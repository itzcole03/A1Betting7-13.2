"""
Integration Service for Enhanced ML Capabilities

This service integrates the enhanced SHAP explainability, batch optimization,
and performance logging into existing prediction engines like BestBetSelector
and FinalPredictionEngine.
"""

import asyncio
import logging
import time
from typing import Any, Dict, List, Optional, Tuple, Union

from .batch_prediction_optimizer import (
    BatchPredictionOptimizer, 
    BatchPredictionRequest, 
    BatchPredictionResponse,
    batch_prediction_optimizer
)
from .enhanced_shap_explainer import (
    EnhancedShapExplainer,
    ShapExplanation,
    ModelRegistrationRequest,
    enhanced_shap_explainer
)
from .performance_logger import (
    PerformanceLogger,
    PredictionResult,
    PredictionOutcome,
    performance_logger
)

logger = logging.getLogger(__name__)


class EnhancedPredictionIntegration:
    """Integration service for enhanced ML capabilities"""
    
    def __init__(self):
        self.shap_explainer = enhanced_shap_explainer
        self.batch_optimizer = batch_prediction_optimizer  
        self.performance_logger = performance_logger
        
        # Integration state
        self.initialized = False
        self.registered_models = set()
        
        logger.info("Enhanced prediction integration initialized")
    
    async def initialize_services(self):
        """Initialize all enhanced services"""
        if self.initialized:
            return
        
        try:
            # Start batch processor
            await self.batch_optimizer.start_batch_processor()
            
            # Start performance monitoring
            await self.performance_logger.start_monitoring()
            
            # Add alert callback for performance issues
            self.performance_logger.add_alert_callback(self._handle_performance_alert)
            
            self.initialized = True
            logger.info("Enhanced ML services initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize enhanced services: {e}")
            raise
    
    async def shutdown_services(self):
        """Shutdown all enhanced services"""
        try:
            await self.batch_optimizer.stop_batch_processor()
            await self.performance_logger.stop_monitoring()
            self.initialized = False
            logger.info("Enhanced ML services shut down")
        except Exception as e:
            logger.error(f"Error shutting down services: {e}")
    
    def register_prediction_model(self, 
                                model_name: str, 
                                model: Any,
                                sport: str,
                                model_type: str = "xgboost",
                                batch_predict_fn: Optional[callable] = None) -> bool:
        """Register a model with all enhanced services"""
        
        if model_name in self.registered_models:
            logger.warning(f"Model {model_name} already registered")
            return True
        
        try:
            # Register with batch optimizer
            self.batch_optimizer.register_model(
                model_name=model_name,
                model=model,
                batch_predict_fn=batch_predict_fn
            )
            
            # Register with SHAP explainer
            registration_request = ModelRegistrationRequest(
                model_name=model_name,
                model=model,
                model_type=model_type,
                sport=sport,
                feature_names=getattr(model, 'feature_names_', []),
                model_version="1.0"
            )
            
            success = self.shap_explainer.register_model(registration_request)
            
            if success:
                self.registered_models.add(model_name)
                logger.info(f"Successfully registered model: {model_name}")
                return True
            else:
                logger.error(f"Failed to register model with SHAP explainer: {model_name}")
                return False
                
        except Exception as e:
            logger.error(f"Error registering model {model_name}: {e}")
            return False
    
    async def enhanced_predict(self,
                             prediction_requests: List[Dict[str, Any]],
                             include_explanations: bool = True,
                             explanation_options: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Enhanced prediction with SHAP explanations and performance logging
        
        Args:
            prediction_requests: List of prediction request dictionaries with keys:
                - request_id: Unique identifier
                - event_id: Event/game identifier  
                - sport: Sport type
                - bet_type: Type of bet
                - features: Feature dictionary
                - models: Optional list of models to use
                - priority: Request priority (1-3)
                
            include_explanations: Whether to include SHAP explanations
            explanation_options: Options for SHAP explanations
                
        Returns:
            List of prediction results with explanations and performance data
        """
        
        if not self.initialized:
            await self.initialize_services()
        
        start_time = time.time()
        
        # Convert to batch prediction requests
        batch_requests = []
        for req_data in prediction_requests:
            batch_request = BatchPredictionRequest(
                request_id=req_data['request_id'],
                event_id=req_data['event_id'],
                sport=req_data['sport'],
                features=req_data['features'],
                models=req_data.get('models'),
                priority=req_data.get('priority', 1),
                timeout=req_data.get('timeout', 10.0),
                metadata=req_data.get('metadata', {})
            )
            batch_requests.append(batch_request)
        
        try:
            # Execute batch predictions
            batch_responses = await self.batch_optimizer.predict_batch(batch_requests)
            
            # Process responses and add explanations
            enhanced_results = []
            
            for i, (request, response) in enumerate(zip(prediction_requests, batch_responses)):
                result = {
                    'request_id': response.request_id,
                    'prediction': response.prediction,
                    'confidence': response.confidence,
                    'processing_time': response.processing_time,
                    'cache_hit': response.cache_hit,
                    'model_breakdown': response.model_breakdown,
                    'error': response.error
                }
                
                # Add SHAP explanations if requested and no error
                if include_explanations and not response.error:
                    try:
                        explanation_result = await self._get_shap_explanations(
                            request=request,
                            prediction=response.prediction,
                            options=explanation_options or {}
                        )
                        
                        result.update({
                            'shap_explanations': explanation_result.get('explanations', {}),
                            'feature_importance': explanation_result.get('feature_importance', {}),
                            'explanation_quality': explanation_result.get('quality_score', 0.0),
                            'explanation_metadata': explanation_result.get('metadata', {})
                        })
                        
                    except Exception as e:
                        logger.warning(f"Failed to generate SHAP explanations for {response.request_id}: {e}")
                        result['explanation_error'] = str(e)
                
                # Log prediction for performance tracking
                self._log_prediction_result(request, response)
                
                enhanced_results.append(result)
            
            total_time = time.time() - start_time
            logger.debug(f"Enhanced prediction completed for {len(prediction_requests)} requests in {total_time:.3f}s")
            
            return enhanced_results
            
        except Exception as e:
            logger.error(f"Error in enhanced prediction: {e}")
            
            # Return error results
            error_results = []
            for req_data in prediction_requests:
                error_results.append({
                    'request_id': req_data['request_id'],
                    'prediction': 0.0,
                    'confidence': 0.0,
                    'processing_time': 0.0,
                    'cache_hit': False,
                    'model_breakdown': {},
                    'error': str(e)
                })
            
            return error_results
    
    async def enhanced_predict_single(self,
                                    request_id: str,
                                    event_id: str,
                                    sport: str,
                                    bet_type: str,
                                    features: Dict[str, float],
                                    models: Optional[List[str]] = None,
                                    include_explanations: bool = True,
                                    priority: int = 1) -> Dict[str, Any]:
        """Enhanced single prediction with full capabilities"""
        
        request_data = {
            'request_id': request_id,
            'event_id': event_id,
            'sport': sport,
            'bet_type': bet_type,
            'features': features,
            'models': models,
            'priority': priority
        }
        
        results = await self.enhanced_predict([request_data], include_explanations)
        return results[0] if results else {}
    
    async def _get_shap_explanations(self, 
                                   request: Dict[str, Any],
                                   prediction: float,
                                   options: Dict[str, Any]) -> Dict[str, Any]:
        """Get SHAP explanations for a prediction"""
        
        try:
            models_to_explain = request.get('models', list(self.registered_models))
            
            if not models_to_explain:
                return {'explanations': {}, 'feature_importance': {}, 'quality_score': 0.0}
            
            # Get explanations from all models
            all_explanations = {}
            all_importance = {}
            
            for model_name in models_to_explain:
                if model_name in self.registered_models:
                    explanation = await self.shap_explainer.explain_prediction(
                        model_name=model_name,
                        features=request['features'],
                        prediction_value=prediction,
                        explanation_type=options.get('explanation_type', 'local'),
                        include_interactions=options.get('include_interactions', False)
                    )
                    
                    if explanation:
                        all_explanations[model_name] = {
                            'shap_values': explanation.shap_values,
                            'base_value': explanation.base_value,
                            'expected_value': explanation.expected_value,
                            'feature_contributions': explanation.feature_contributions,
                            'confidence_intervals': explanation.confidence_intervals
                        }
                        
                        # Extract feature importance
                        importance = {}
                        for feature, value in explanation.shap_values.items():
                            importance[feature] = abs(value)
                        all_importance[model_name] = importance
            
            # Aggregate explanations if multiple models
            if len(all_explanations) > 1:
                aggregated_explanation = self.shap_explainer.aggregate_explanations(
                    list(all_explanations.values())
                )
                
                return {
                    'explanations': {
                        'individual_models': all_explanations,
                        'aggregated': {
                            'consensus_features': aggregated_explanation.get('consensus_features', {}),
                            'feature_agreement': aggregated_explanation.get('feature_agreement', {}),
                            'explanation_variance': aggregated_explanation.get('explanation_variance', {})
                        }
                    },
                    'feature_importance': all_importance,
                    'quality_score': aggregated_explanation.get('quality_score', 0.0),
                    'metadata': {
                        'models_explained': len(all_explanations),
                        'explanation_method': 'enhanced_shap'
                    }
                }
            elif all_explanations:
                # Single model explanation
                model_name = list(all_explanations.keys())[0]
                explanation = all_explanations[model_name]
                
                return {
                    'explanations': {model_name: explanation},
                    'feature_importance': all_importance,
                    'quality_score': 1.0,  # Single model has perfect quality
                    'metadata': {
                        'models_explained': 1,
                        'explanation_method': 'enhanced_shap',
                        'primary_model': model_name
                    }
                }
            else:
                return {'explanations': {}, 'feature_importance': {}, 'quality_score': 0.0}
                
        except Exception as e:
            logger.error(f"Error generating SHAP explanations: {e}")
            return {'explanations': {}, 'feature_importance': {}, 'quality_score': 0.0, 'error': str(e)}
    
    def _log_prediction_result(self, 
                              request: Dict[str, Any], 
                              response: BatchPredictionResponse):
        """Log prediction result for performance tracking"""
        
        try:
            self.performance_logger.log_prediction(
                prediction_id=response.request_id,
                model_name=','.join(request.get('models', ['ensemble'])),
                sport=request['sport'],
                bet_type=request['bet_type'],
                prediction=response.prediction,
                confidence=response.confidence,
                processing_time=response.processing_time,
                features_used=list(request['features'].keys()),
                shap_importance=response.shap_values,
                metadata={
                    'cache_hit': response.cache_hit,
                    'model_breakdown': response.model_breakdown,
                    'event_id': request['event_id']
                }
            )
            
        except Exception as e:
            logger.error(f"Error logging prediction result: {e}")
    
    def log_prediction_outcome(self, 
                             prediction_id: str, 
                             actual_outcome: float,
                             outcome_status: str = "correct") -> bool:
        """Log the actual outcome of a prediction for performance tracking"""
        
        try:
            # Convert string status to enum
            status_mapping = {
                'correct': PredictionOutcome.CORRECT,
                'incorrect': PredictionOutcome.INCORRECT,
                'push': PredictionOutcome.PUSH,
                'pending': PredictionOutcome.PENDING,
                'void': PredictionOutcome.VOID
            }
            
            status = status_mapping.get(outcome_status.lower(), PredictionOutcome.CORRECT)
            
            self.performance_logger.log_outcome(
                prediction_id=prediction_id,
                actual_outcome=actual_outcome,
                outcome_status=status
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error logging prediction outcome: {e}")
            return False
    
    def get_performance_summary(self, 
                              model_name: Optional[str] = None,
                              sport: Optional[str] = None,
                              bet_type: Optional[str] = None) -> Dict[str, Any]:
        """Get performance summary for models"""
        
        if model_name and sport and bet_type:
            summary = self.performance_logger.get_performance_summary(model_name, sport, bet_type)
            return summary.__dict__ if summary else {}
        elif sport:
            return self.performance_logger.get_sport_performance(sport)
        else:
            return self.performance_logger.get_all_performance_summaries()
    
    def get_model_comparison(self, 
                           sport: str, 
                           bet_type: str, 
                           metrics: Optional[List[str]] = None) -> Dict[str, Any]:
        """Compare model performance for specific sport and bet type"""
        
        return self.performance_logger.get_model_comparison(sport, bet_type, metrics)
    
    def get_batch_performance_stats(self) -> Dict[str, Any]:
        """Get batch processing performance statistics"""
        
        return self.batch_optimizer.get_performance_stats()
    
    def get_shap_cache_stats(self) -> Dict[str, Any]:
        """Get SHAP explanation cache statistics"""
        
        return self.shap_explainer.get_cache_stats()
    
    def get_registered_models(self) -> List[str]:
        """Get list of registered models"""
        
        return list(self.registered_models)
    
    def get_recent_alerts(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent performance alerts"""
        
        alerts = self.performance_logger.get_recent_alerts(limit)
        return [alert.__dict__ for alert in alerts]
    
    async def _handle_performance_alert(self, alert):
        """Handle performance alerts"""
        
        try:
            # Log alert
            logger.warning(f"Performance Alert: {alert.message} ({alert.level.value})")
            
            # Could integrate with external alerting systems here
            # e.g., send to Slack, email, monitoring dashboard
            
            # For critical alerts, could trigger model retraining
            if alert.level.value == "critical":
                logger.critical(f"CRITICAL ALERT: {alert.message}")
                # TODO: Implement automatic model retraining or fallback
            
        except Exception as e:
            logger.error(f"Error handling performance alert: {e}")
    
    async def health_check(self) -> Dict[str, Any]:
        """Comprehensive health check for all services"""
        
        health_status = {
            'overall_status': 'healthy',
            'services': {},
            'timestamp': time.time()
        }
        
        try:
            # Check batch optimizer
            batch_stats = self.batch_optimizer.get_performance_stats()
            health_status['services']['batch_optimizer'] = {
                'status': 'healthy' if self.batch_optimizer.batch_processor_task and not self.batch_optimizer.batch_processor_task.done() else 'degraded',
                'queue_size': sum([
                    batch_stats['queue_stats']['high_priority_queue'],
                    batch_stats['queue_stats']['medium_priority_queue'],
                    batch_stats['queue_stats']['low_priority_queue']
                ]),
                'cache_hit_rate': batch_stats['batch_stats']['cache_hit_rate']
            }
            
            # Check SHAP explainer
            shap_stats = self.shap_explainer.get_cache_stats()
            health_status['services']['shap_explainer'] = {
                'status': 'healthy',
                'registered_models': len(self.shap_explainer.registered_models),
                'cache_size': shap_stats.get('cache_size', 0),
                'cache_hit_rate': shap_stats.get('hit_rate', 0.0)
            }
            
            # Check performance logger
            active_alerts = self.performance_logger.get_active_alerts()
            critical_alerts = [a for a in active_alerts if a.level.value == 'critical']
            
            health_status['services']['performance_logger'] = {
                'status': 'critical' if critical_alerts else 'healthy',
                'active_alerts': len(active_alerts),
                'critical_alerts': len(critical_alerts),
                'registered_models': len(self.registered_models)
            }
            
            # Overall status
            service_statuses = [s['status'] for s in health_status['services'].values()]
            if 'critical' in service_statuses:
                health_status['overall_status'] = 'critical'
            elif 'degraded' in service_statuses:
                health_status['overall_status'] = 'degraded'
            
        except Exception as e:
            logger.error(f"Error in health check: {e}")
            health_status['overall_status'] = 'error'
            health_status['error'] = str(e)
        
        return health_status


# Global integration instance
enhanced_prediction_integration = EnhancedPredictionIntegration()
