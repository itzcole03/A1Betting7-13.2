/**
 * Enhanced Backend API Integration Service;
 * Complete integration with enhanced mathematical backend services;
 */
export interface EnhancedPredictionRequest {
  event_id: string;
  sport: string;
  features: Record<string, number>;
  enable_neuromorphic: boolean;
  neuromorphic_timesteps: number;
  enable_mamba: boolean;
  mamba_sequence_length: number;
  enable_causal_inference: boolean;
  causal_significance_level: number;
  enable_topological: boolean;
  topological_max_dimension: number;
  enable_riemannian: boolean;
  riemannian_manifold_dim: number;
  use_gpu: boolean;
  numerical_precision: string;
  convergence_tolerance: number;
  context: Record<string, any>;
}

export interface EnhancedPredictionResponse {
  event_id: string;
  strategy_used: string;
  base_prediction: number;
  neuromorphic_enhancement: number;
  mamba_temporal_refinement: number;
  causal_adjustment: number;
  topological_smoothing: number;
  riemannian_projection: number;
  final_prediction: number;
  neuromorphic_metrics: Record<string, any>;
  mamba_metrics: Record<string, any>;
  causal_metrics: Record<string, any>;
  topological_metrics: Record<string, any>;
  riemannian_metrics: Record<string, any>;
  riemannian_curvature: number;
  persistent_betti_numbers: Record<string, number>;
  causal_graph_structure: Record<string, string>;
  mamba_eigenvalue_spectrum: number;
  neuromorphic_spike_statistics: Record<string, number>;
  topological_persistence_barcode: number;
  convergence_rate: number;
  stability_margin: number;
  lyapunov_exponent: number;
  mathematical_guarantees: Record<string, boolean>;
  actual_complexity: Record<string, any>;
  runtime_analysis: Record<string, number>;
  memory_usage: Record<string, number>;
  prediction_confidence: number;
  uncertainty_bounds: number;
  confidence_intervals: Record<string, number>;
  total_processing_time: number;
  component_processing_times: Record<string, number>;
  timestamp: string;
  numerical_stability: Record<string, boolean>;
  convergence_diagnostics: Record<string, any>;
  theoretical_bounds_satisfied: boolean;
}

export interface FeatureEngineeringRequest {
  data: Record<string, number>;
  feature_types: string;
  enable_wavelet_transforms: boolean;
  enable_manifold_learning: boolean;
  enable_information_theory: boolean;
  enable_graph_features: boolean;
  target_dimensionality?: number;
}

export interface FeatureEngineeringResponse {
  original_features: Record<string, number>;
  engineered_features: Record<string, number>;
  feature_importance: Record<string, number>;
  dimensionality_reduction: {
    original_dim: number;
    reduced_dim: number;
    explained_variance: number;
    intrinsic_dimension: number;
  };
  manifold_properties: {
    curvature_estimates: number;
    topology_summary: Record<string, any>;
    geodesic_distances: number;
  };
  information_theory_metrics: {
    mutual_information: Record<string, number>;
    transfer_entropy: Record<string, number>;
    feature_relevance: Record<string, number>;
  };
  processing_time: number;
  mathematical_validation: Record<string, boolean>;
}

export interface RiskAssessmentRequest {
  portfolio: Record<string, number>;
  market_data: Record<string, number>;
  risk_metrics: string;
  confidence_level: number;
  time_horizon: number;
}

export interface RiskAssessmentResponse {
  portfolio_risk: {
    value_at_risk: number;
    expected_shortfall: number;
    maximum_drawdown: number;
    sharpe_ratio: number;
    sortino_ratio: number;
  };
  extreme_value_analysis: {
    gev_parameters: Record<string, number>;
    return_levels: Record<string, number>;
    tail_index: number;
    hill_estimator: number;
  };
  copula_analysis: {
    dependence_structure: string;
    tail_dependence: Record<string, number>;
    model_selection: Record<string, number>;
  };
  stress_testing: {
    scenarios: Record<string, number>;
    portfolio_impact: Record<string, number>;
    worst_case_loss: number;
  };
  risk_decomposition: Record<string, number>;
  processing_time: number;
  model_validation: Record<string, boolean>;
}

export interface MathematicalAnalysisRequest {
  prediction_data: Array<Record<string, any>>;
  analysis_depth: string;
  include_stability_analysis: boolean;
  include_convergence_analysis: boolean;
  include_sensitivity_analysis: boolean;
  include_robustness_analysis: boolean;
  verify_theoretical_guarantees: boolean;
  check_mathematical_consistency: boolean;
}

export interface MathematicalAnalysisResponse {
  mathematical_analysis: Record<string, any>;
  analysis_depth: string;
  data_dimensions: {
    num_samples: number;
    num_features: number;
    has_outcomes: boolean;
  };
  computational_performance: {
    analysis_time: number;
    samples_per_second: number;
  };
  mathematical_rigor_score: number;
  timestamp: string;
}

export interface ModelStatusResponse {
  models: Array<{
    id: string;
    name: string;
    status: 'active' | 'training' | 'error' | 'updating';
    accuracy: number;
    last_update: string;
    mathematical_properties: {
      convergence_verified: boolean;
      stability_guaranteed: boolean;
      theoretical_bounds: boolean;
    };
    performance_metrics: {
      prediction_speed: number;
      memory_usage: number;
      computational_complexity: string;
    };
  }>;
  system_health: {
    overall_status: string;
    component_status: Record<string, string>;
    error_rate: number;
    average_response_time: number;
  };
  mathematical_foundations: Record<string, any>;
}

declare class EnhancedBackendApiService {
  private static instance;
  private client;
  private logger;
  private cache;
  private errorService;
  private baseURL;
  private constructor();
  static getInstance(): EnhancedBackendApiService;
  private setupInterceptors;
  getEnhancedRevolutionaryPrediction(
    request: EnhancedPredictionRequest
  ): Promise<EnhancedPredictionResponse>;
  getEnhancedFeatureEngineering(
    request: FeatureEngineeringRequest
  ): Promise<FeatureEngineeringResponse>;
  getEnhancedRiskAssessment(request: RiskAssessmentRequest): Promise<RiskAssessmentResponse>;
  getMathematicalAnalysis(
    request: MathematicalAnalysisRequest
  ): Promise<MathematicalAnalysisResponse>;
  getMathematicalFoundations(): Promise<Record<string, any>>;
  getEnhancedModelStatus(): Promise<ModelStatusResponse>;
  getUnifiedPrediction(request: {
    event_id: string;
    sport: string;
    features: Record<string, number>;
    include_all_enhancements: boolean;
    processing_level: 'basic' | 'advanced' | 'research_grade' | 'revolutionary';
  }): Promise<{
    predictions: Record<string, number>;
    enhanced_revolutionary: EnhancedPredictionResponse;
    feature_engineering: FeatureEngineeringResponse;
    risk_assessment: RiskAssessmentResponse;
    mathematical_analysis: MathematicalAnalysisResponse;
    unified_confidence: number;
    processing_summary: Record<string, any>;
  }>;
  healthCheck(): Promise<{
    status: string;
    services: Record<string, boolean>;
    mathematical_engines: Record<string, boolean>;
    response_time: number;
  }>;
}

export default EnhancedBackendApiService;
