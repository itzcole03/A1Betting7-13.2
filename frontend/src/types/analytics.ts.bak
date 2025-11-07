// Analytics API Response Types
// Based on backend/routes/analytics_routes.py endpoints

export interface FeatureImportance {
  feature: string;
  value: number;
}

export interface ShapAnalysisResult {
  featureImportances: FeatureImportance[];
  raw?: Record<string, unknown>;
}

// Model Performance Types
export interface ModelPerformanceMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  roc_auc?: number;
  [key: string]: number | undefined;
}

export interface ModelPerformanceSnapshot {
  model_name: string;
  sport: string;
  status: 'healthy' | 'degraded' | 'offline';
  metrics: ModelPerformanceMetrics;
  predictions_count: number;
  wins: number;
  losses: number;
  win_rate: number;
  total_roi: number;
  avg_confidence: number;
  error_rate: number;
  last_prediction: string | null;
  timestamp: string;
}

export interface ModelPerformanceResponse {
  total_models: number;
  sport_filter: string | null;
  models: ModelPerformanceSnapshot[];
  timestamp: string;
}

export interface ModelDetailedPerformance extends ModelPerformanceSnapshot {
  analysis_period_days: number;
  performance_metrics: ModelPerformanceMetrics;
  summary: {
    total_predictions: number;
    wins: number;
    losses: number;
    win_rate: number;
    total_roi: number;
    avg_confidence: number;
    error_rate: number;
  };
  trends: PerformanceTrend[];
}

export interface PerformanceTrend {
  date: string;
  win_rate: number;
  roi: number;
  predictions: number;
  confidence: number;
}

// Performance Alerts Types
export interface PerformanceAlert {
  model_name: string;
  sport: string;
  severity: 'high' | 'medium' | 'low';
  alert_type: string;
  description: string;
  threshold_exceeded: number;
  current_value: number;
  recommendation: string;
  timestamp: string;
}

export interface PerformanceAlertsResponse {
  total_alerts: number;
  threshold_used: number;
  summary: {
    high_severity: number;
    medium_severity: number;
  };
  alerts: PerformanceAlert[];
  timestamp: string;
}

// Ensemble Prediction Types
export type VotingStrategy =
  | 'weighted_average'
  | 'majority_vote'
  | 'confidence_weighted'
  | 'performance_weighted'
  | 'stacked_ensemble'
  | 'adaptive_consensus'
  | 'bayesian_model_averaging'
  | 'temporal_weighted';

export interface EnsemblePredictionRequest {
  sport: string;
  event_id: string;
  player_name: string;
  prop_type: string;
  features: Record<string, number>;
  voting_strategy?: VotingStrategy;
  force_models?: string[];
}

export interface EnsemblePredictionResponse {
  request_id: string;
  sport: string;
  event_id: string;
  player_name: string;
  prop_type: string;
  ensemble_result: {
    prediction: number;
    confidence: number;
    probability: number;
    voting_strategy: VotingStrategy;
  };
  model_analysis: {
    individual_predictions: Record<string, number>;
    individual_confidences: Record<string, number>;
    model_weights: Record<string, number>;
    models_used: string[];
    total_models: number;
  };
  consensus_analysis: {
    prediction_variance: number;
    model_agreement: number;
    outlier_models: string[];
    consensus_strength: number;
  };
  performance_insights: {
    expected_accuracy: number;
    historical_performance: Record<string, number>;
    risk_assessment: string;
  };
  betting_recommendations: {
    recommended_action: string;
    kelly_fraction: number;
    expected_value: number;
    confidence_interval: [number, number];
  };
  processing_time: number;
  timestamp: string;
}

// Cross-Sport Insights Types
export interface CrossSportInsight {
  type: 'cross_sport_correlation' | 'seasonal_pattern';
  sports: string[];
  correlation: number;
  significance: number;
  description: string;
  recommendation: string;
  confidence: number;
}

export interface CrossSportInsightsResponse {
  analysis_period_days: number;
  total_insights: number;
  summary: {
    correlations_found: number;
    seasonal_patterns: number;
  };
  insights: CrossSportInsight[];
  timestamp: string;
}

// Dashboard Summary Types
export interface SportSummary {
  models_count: number;
  total_predictions: number;
  avg_roi: number;
  avg_win_rate: number;
  healthy_models: number;
}

export interface DashboardSummaryResponse {
  sports_summary: Record<string, SportSummary>;
  overall_metrics: {
    total_models: number;
    total_sports: number;
    total_predictions: number;
    overall_avg_roi: number;
    healthy_models: number;
  };
  alerts_summary: {
    total_alerts: number;
    high_severity: number;
    medium_severity: number;
  };
  insights_summary: {
    total_insights: number;
    correlations: number;
    patterns: number;
  };
  timestamp: string;
}

// Ensemble Performance Report Types
export interface EnsemblePerformanceReport {
  // This would be defined based on the actual response structure
  // from the ensemble_manager.get_ensemble_performance_report method
  [key: string]: any;
}

// Analytics Health Check Types
export interface AnalyticsHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    performance_tracker: 'ready' | 'not_ready';
    ensemble_manager: 'ready' | 'not_ready';
  };
  timestamp: string;
}

// API Response Wrapper Types
export interface ApiResponse<T> {
  data: T;
  status: number;
  headers?: Record<string, string>;
}

export interface ApiError {
  message: string;
  status: number;
  details?: any;
}

// Component State Types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export interface DashboardFilters {
  sport?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  modelStatus?: 'healthy' | 'degraded' | 'offline';
  minWinRate?: number;
  minROI?: number;
}

export interface DashboardState extends LoadingState {
  summary: DashboardSummaryResponse | null;
  models: ModelPerformanceSnapshot[];
  alerts: PerformanceAlert[];
  insights: CrossSportInsight[];
  filters: DashboardFilters;
}

// Hook Return Types
export interface UseAnalyticsDashboardReturn extends LoadingState {
  dashboardData: DashboardState;
  refreshData: () => Promise<void>;
  updateFilters: (filters: Partial<DashboardFilters>) => void;
  exportData: (format: 'csv' | 'json' | 'pdf') => Promise<void>;
}

export interface UseModelPerformanceReturn extends LoadingState {
  modelData: ModelDetailedPerformance | null;
  refreshModel: () => Promise<void>;
}

export interface UsePerformanceAlertsReturn extends LoadingState {
  alerts: PerformanceAlert[];
  refreshAlerts: () => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
}
