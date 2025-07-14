import { ModelMetadata, ModelVersion, ModelRegistryConfig } from '@/types.ts';
export declare class ModelRegistry {
  private config;
  private logger;
  private models;
  private versions;
  constructor(config: ModelRegistryConfig);
  private initialize;
  private loadModels;
  private loadVersions;
  registerModel(metadata: ModelMetadata): Promise<string>;
  getModel(modelId: string): Promise<ModelMetadata>;
  updateModel(modelId: string, version: ModelVersion): Promise<void>;
  getModelVersions(modelId: string): Promise<ModelVersion[0]>;
  getModelMetadata(modelId: string): Promise<ModelMetadata>;
  updateModelMetadata(modelId: string, metadata: Partial<ModelMetadata>): Promise<void>;
  updateMetrics(modelId: string, evaluation: any): Promise<void>;
  deleteModel(modelId: string): Promise<void>;
  backup(): Promise<void>;
}
