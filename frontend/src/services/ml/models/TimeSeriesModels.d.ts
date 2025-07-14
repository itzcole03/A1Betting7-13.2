import { BaseModel, ModelConfig, ModelPrediction } from './BaseModel.js';
declare class ARIMAModel extends BaseModel {
  constructor(config: ModelConfig);
  predict(input: unknown): Promise<ModelPrediction>;
  train(): Promise<void>;
  evaluate(): Promise<unknown>;
  save(): Promise<void>;
  load(): Promise<void>;
}
declare class ProphetModel extends BaseModel {
  constructor(config: ModelConfig);
  predict(input: unknown): Promise<ModelPrediction>;
  train(): Promise<void>;
  evaluate(): Promise<unknown>;
  save(): Promise<void>;
  load(): Promise<void>;
}
export { ARIMAModel, ProphetModel };
