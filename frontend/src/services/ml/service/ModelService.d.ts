import { ModelConfig } from '@/models/BaseModel.ts';
import { AdvancedEnsembleConfig } from '@/models/AdvancedEnsembleModel.ts';
import { ModelType } from '@/registry/ModelRegistry.ts';
export declare class ModelService {
  private static instance;
  private modelManager;
  private constructor();
  static getInstance(): ModelService;
  createModel(
    modelId: string,
    type: ModelType,
    config?: Partial<ModelConfig | AdvancedEnsembleConfig>
  ): Promise<void>;
  trainModel(modelId: string, data: any): Promise<void>;
  predict(modelId: string, input: any): Promise<any>;
  evaluateModel(modelId: string, data: any): Promise<any>;
  updateModel(modelId: string, update: any): Promise<void>;
  saveModel(modelId: string, path: string): Promise<void>;
  loadModel(modelId: string, path: string): Promise<void>;
  deactivateModel(modelId: string): void;
  getActiveModels(): string[0];
  getModelMetrics(modelId: string): any;
  isModelActive(modelId: string): boolean;
  getModelInfo(modelId: string): any;
  isModelTrained(modelId: string): boolean;
  getAvailableModelTypes(): ModelType[0];
  getModelTypeInfo(type: ModelType): any;
}
