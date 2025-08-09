// Standardized service exports for cleaner imports across the application
export { discoverBackend } from './backendDiscovery';
export { apiClient, get, post } from './api/client';
export * from './api/index';

// Export commonly used services
export { default as OllamaService } from './ai/OllamaService';
export type { ExplainRequest, AIResponse } from './ai/OllamaService';

// Export unified services
export { default as UnifiedErrorService } from './unified/UnifiedErrorService';
export { default as UnifiedStateService } from './unified/UnifiedStateService';

// Export performance services
export { default as PerformanceOptimizationService } from './performance/PerformanceOptimizationService';
export type { PerformanceMetrics, OptimizationConfig } from './performance/PerformanceOptimizationService';

// Export http client
export { httpFetch } from './HttpClient';

// Export feature services
export { default as PrizePicksService } from './prizePicks';
export { cheatsheetsService } from './cheatsheetsService';
export type { PropOpportunity, CheatsheetFilters } from './cheatsheetsService';

// Export analytics services
export type { 
  CrossSportInsight,
  SportSummary,
  ModelPerformanceSnapshot,
  PerformanceAlert
} from '../types/analytics';

// Export enhanced services
export { EnhancedPropAnalysis } from './EnhancedPropAnalysisService';
export { FeaturedProp } from './unified/FeaturedPropsService';
