// Standardized service exports for cleaner imports across the application
export { apiClient, get, post } from './api/client';
export * from './api/index';
export { discoverBackend } from './backendDiscovery';

// Export commonly used services
export { default as OllamaService } from './ai/OllamaService';
export type { AIResponse, ExplainRequest } from './ai/OllamaService';

// Export unified services
export { default as UnifiedErrorService } from './unified/UnifiedErrorService';
export { default as UnifiedStateService } from './unified/UnifiedStateService';
export { UnifiedLogger } from './UnifiedLogger';

// Export performance services
export { default as PerformanceOptimizationService } from './performance/PerformanceOptimizationService';
export type { PerformanceMetrics } from './performance/PerformanceOptimizationService';

// Export http client
export { httpFetch } from './HttpClient';

// Export feature services
export { cheatsheetsService } from './cheatsheetsService';
export type { CheatsheetFilters, PropOpportunity } from './cheatsheetsService';
export { default as PrizePicksService } from './prizePicks';

// Export analytics services
export type {
  CrossSportInsight,
  ModelPerformanceSnapshot,
  PerformanceAlert,
  SportSummary,
} from '../types/analytics';

// Export enhanced services
export { EnhancedPropAnalysis } from './EnhancedPropAnalysisService';

// Export injury service and types (strict typing)
export * from './injuryService';
export { _injuryService, default as injuryService } from './injuryService';
export type { HealthAlert, InjuryReport, InjuryTrend, PlayerInjury } from './injuryService';

// Export enhanced data manager and debug manager (strict typing)
export { debugEnhancedDataManager } from './DebugEnhancedDataManager';

/**
 * @deprecated Use WebSocketManager hooks + normalized services.
 * EnhancedDataManager realtime portion is disabled; only caching/fetch pathways remain.
 * 
 * MIGRATION PATH:
 * - For WebSocket connections: Use frontend/src/websocket/WebSocketManager.ts
 * - For data fetching: Use frontend/src/services/unified/FeaturedPropsService.ts
 * - This export maintained for backward compatibility only
 */
export { enhancedDataManager } from './DeprecatedEnhancedDataManager';
// export type { FeaturedProp as EnhancedFeaturedProp } from './EnhancedDataManager';
export {
  clearPropsCache,
  fetchBatchPredictions,
  fetchEnhancedPropAnalysis,
  fetchFeaturedProps,
  getDataManagerMetrics,
  prefetchPropsData,
  subscribeToPropsUpdates,
} from './unified/FeaturedPropsService';
