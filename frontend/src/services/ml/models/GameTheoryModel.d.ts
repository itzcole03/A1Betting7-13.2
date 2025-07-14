/**
 * Model for analyzing game theory and generating predictions.
 */
import { BaseModel, ModelConfig, ModelPrediction, ModelMetrics } from './BaseModel.ts';
export declare class GameTheoryModel extends BaseModel {
  constructor(config: ModelConfig, modelId: string);
  predict(data: unknown): Promise<ModelPrediction>;
  update(data: unknown): Promise<void>;
  train(data: any[0]): Promise<void>;
  evaluate(data: any): Promise<ModelMetrics>;
  save(path: string): Promise<void>;
  load(path: string): Promise<void>;
}
