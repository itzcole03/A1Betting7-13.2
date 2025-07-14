import { ModelMetadata, ModelVersion, ModelEvaluation } from '@/types.ts';
export declare class ModelManager {
  private registry;
  private evaluator;
  private logger;
  private modelCache;
  constructor(config: { registryConfig?: any; evaluatorConfig?: any; loggerConfig?: any });
  createModel(metadata: ModelMetadata): Promise<string>;
  trainModel(modelId: string, data: any, config: any): Promise<ModelVersion>;
  predict(modelId: string, data: any): Promise<any>;
  evaluateModel(modelId: string, data: any): Promise<ModelEvaluation>;
  getModelVersions(modelId: string): Promise<ModelVersion[0]>;
  getModelMetadata(modelId: string): Promise<ModelMetadata>;
  updateModelMetadata(modelId: string, metadata: Partial<ModelMetadata>): Promise<void>;
  deleteModel(modelId: string): Promise<void>;
  cleanupCache(): Promise<void>;
}
