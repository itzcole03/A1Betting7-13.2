/**
 * Main prediction service that integrates all prediction models and services.
 */
import type { PredictionRequest, PredictionResult } from './types.js';
import type { FinalPredictionEngineConfig } from '@/core/FinalPredictionEngine/types.js';
import { UnifiedLogger } from '@/core/logging/types.js';
import { UnifiedMetrics } from '@/core/metrics/types.js';
import { UnifiedConfigManager } from '@/core/config/types.js';
export declare class PredictionIntegrationService {
  private dailyFantasy;
  private weather;
  private socialSentiment;
  private riskManager;
  private marketAnalysis;
  private performanceTracking;
  private analytics;
  private unifiedData;
  private finalPredictionEngine;
  constructor(
    logger?: UnifiedLogger,
    metrics?: UnifiedMetrics,
    config?: UnifiedConfigManager,
    engineConfig?: FinalPredictionEngineConfig
  );
  generateIntegratedPrediction(request: PredictionRequest): Promise<PredictionResult>;
  private updateModels;
}
