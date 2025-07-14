import { BaseModel, ModelConfig, ModelPrediction } from './BaseModel.js';
declare class CNNModel extends BaseModel {
  private filters;
  private kernelSize;
  private poolingSize;
  constructor(config: ModelConfig);
  predict(input: unknown): Promise<ModelPrediction>;
  private simulateConvolution;
  private simulatePooling;
  private calculatePrediction;
  train(): Promise<void>;
  evaluate(): Promise<unknown>;
  save(): Promise<void>;
  load(): Promise<void>;
}
declare class LSTMModel extends BaseModel {
  private hiddenUnits;
  private sequenceLength;
  constructor(config: ModelConfig);
  predict(input: unknown): Promise<ModelPrediction>;
  private simulateLSTMCells;
  private calculateTemporalPrediction;
  train(): Promise<void>;
  evaluate(): Promise<unknown>;
  save(): Promise<void>;
  load(): Promise<void>;
}
declare global {
  interface Math {
    sigmoid(x: number): number;
  }
}
export { CNNModel, LSTMModel };
