/**
 * Model for analyzing market intelligence and generating predictions.
 */
import { BaseModel } from './BaseModel.ts';
import { ModelConfig, ModelMetrics, ModelPrediction } from '@/types.ts';
import { UnifiedLogger } from '@/core/UnifiedLogger.ts';
import { UnifiedErrorHandler } from '@/core/UnifiedErrorHandler.ts';
export declare class MarketIntelligenceModel extends BaseModel {
  protected readonly logger: UnifiedLogger;
  protected readonly errorHandler: UnifiedErrorHandler;
  private marketMetrics;
  private historicalMetrics;
  private readonly MAX_HISTORY;
  constructor(config: ModelConfig);
  predict(data: any): Promise<ModelPrediction>;
  update(data: unknown): Promise<void>;
  train(data: any): Promise<void>;
  evaluate(data: any): Promise<ModelMetrics>;
  save(path: string): Promise<void>;
  load(path: string): Promise<void>;
  private extractMarketMetrics;
  private analyzeMarketMetrics;
  private calculateConfidence;
}
