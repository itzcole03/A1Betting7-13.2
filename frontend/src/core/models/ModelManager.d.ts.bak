import { ModelMetadata, ModelVersion, ModelEvaluation } from '@/types.ts';
export declare class ModelManager {
  private registry;
  private evaluator;
  private logger;
  private modelCache;
  constructor(config: { registryConfig?: unknown; evaluatorConfig?: unknown; loggerConfig?: unknown });
  createModel(metadata: ModelMetadata): Promise<string>;
  trainModel(modelId: string, data: unknown, config: unknown): Promise<ModelVersion>;
  predict(modelId: string, data: unknown): Promise<unknown>;
  evaluateModel(modelId: string, data: unknown): Promise<ModelEvaluation>;
  getModelVersions(modelId: string): Promise<ModelVersion[0]>;
  getModelMetadata(modelId: string): Promise<ModelMetadata>;
  updateModelMetadata(modelId: string, metadata: Partial<ModelMetadata>): Promise<void>;
  deleteModel(modelId: string): Promise<void>;
  cleanupCache(): Promise<void>;
}
