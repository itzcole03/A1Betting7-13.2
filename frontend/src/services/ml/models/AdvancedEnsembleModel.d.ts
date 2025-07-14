/**
 * Advanced ensemble model that combines multiple specialized models for improved predictions.
 */
import { BaseModel } from './BaseModel.ts';
import { AdvancedEnsembleConfig, ModelMetrics } from '@/types.ts';
import { UnifiedLogger } from '@/core/UnifiedLogger.ts';
import { UnifiedErrorHandler } from '@/core/UnifiedErrorHandler.ts';
export declare class AdvancedEnsembleModel extends BaseModel {
  private models;
  private weights;
  protected readonly logger: UnifiedLogger;
  protected readonly errorHandler: UnifiedErrorHandler;
  constructor(config: AdvancedEnsembleConfig);
  private initializeModels;
  private createModel;
  predict(data: any): Promise<any>;
  private combinePredictions;
  private calculateConfidence;
  train(data: any): Promise<void>;
  evaluate(data: any): Promise<ModelMetrics>;
  save(path: string): Promise<void>;
  load(path: string): Promise<void>;
}
