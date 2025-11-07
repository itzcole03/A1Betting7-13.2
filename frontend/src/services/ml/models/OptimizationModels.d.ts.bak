import { BaseModel, ModelConfig, ModelPrediction } from './BaseModel.js';
declare class BayesianOptimizationModel extends BaseModel {
  constructor(config: ModelConfig);
  predict(input: unknown): Promise<ModelPrediction>;
  train(): Promise<void>;
  evaluate(): Promise<unknown>;
  save(): Promise<void>;
  load(): Promise<void>;
}
declare class GeneticAlgorithmModel extends BaseModel {
  constructor(config: ModelConfig);
  predict(input: unknown): Promise<ModelPrediction>;
  train(): Promise<void>;
  evaluate(): Promise<unknown>;
  save(): Promise<void>;
  load(): Promise<void>;
}
export { BayesianOptimizationModel, GeneticAlgorithmModel };
