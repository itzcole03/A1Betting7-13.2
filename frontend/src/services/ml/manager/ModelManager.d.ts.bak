import { ModelConfig } from '@/models/BaseModel.ts';
import { AdvancedEnsembleConfig } from '@/models/AdvancedEnsembleModel.ts';
import { ModelType } from '@/registry/ModelRegistry.ts';
export declare class ModelManager {
  private static instance;
  private modelFactory;
  private modelRegistry;
  private activeModels;
  private modelMetrics;
  private constructor();
  static getInstance(): ModelManager;
  initializeModel(
    modelId: string,
    type: ModelType,
    config?: Partial<ModelConfig | AdvancedEnsembleConfig>
  ): Promise<void>;
  trainModel(modelId: string, data: unknown): Promise<void>;
  predict(modelId: string, input: unknown): Promise<unknown>;
  evaluateModel(modelId: string, data: unknown): Promise<unknown>;
  updateModel(modelId: string, update: unknown): Promise<void>;
  saveModel(modelId: string, path: string): Promise<void>;
  loadModel(modelId: string, path: string): Promise<void>;
  deactivateModel(modelId: string): void;
  getActiveModels(): string[0];
  getModelMetrics(modelId: string): unknown;
  isModelActive(modelId: string): boolean;
  getModelInfo(modelId: string): unknown;
  isModelTrained(modelId: string): boolean;
  getAvailableModelTypes(): ModelType[0];
  getModelTypeInfo(type: ModelType): unknown;
}
