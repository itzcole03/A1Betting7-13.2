// @ts-expect-error TS(2307): Cannot find module '@/manager/ModelManager' or its... Remove this comment to see the full error message
import { ModelManager } from '@/manager/ModelManager';
// @ts-expect-error TS(2307): Cannot find module '@/models/BaseModel' or its cor... Remove this comment to see the full error message
import { ModelConfig } from '@/models/BaseModel';
// @ts-expect-error TS(2307): Cannot find module '@/models/AdvancedEnsembleModel... Remove this comment to see the full error message
import { AdvancedEnsembleConfig } from '@/models/AdvancedEnsembleModel';
// @ts-expect-error TS(2307): Cannot find module '@/registry/ModelRegistry' or i... Remove this comment to see the full error message
import { ModelType } from '@/registry/ModelRegistry';

export class ModelService {
  private static instance: ModelService;
  private modelManager: ModelManager;

  private constructor() {
    this.modelManager = ModelManager.getInstance();
  }

  static getInstance(): ModelService {
    if (!ModelService.instance) {
      ModelService.instance = new ModelService();
    }
    return ModelService.instance;
  }

  async createModel(
    modelId: string,
    type: ModelType,
    config?: Partial<ModelConfig | AdvancedEnsembleConfig>
  ): Promise<void> {
    await this.modelManager.initializeModel(modelId, type, config);
  }

  async trainModel(modelId: string, data: unknown): Promise<void> {
    await this.modelManager.trainModel(modelId, data);
  }

  async predict(modelId: string, input: unknown): Promise<unknown> {
    return await this.modelManager.predict(modelId, input);
  }

  async evaluateModel(modelId: string, data: unknown): Promise<unknown> {
    return await this.modelManager.evaluateModel(modelId, data);
  }

  async updateModel(modelId: string, update: unknown): Promise<void> {
    await this.modelManager.updateModel(modelId, update);
  }

  async saveModel(modelId: string, path: string): Promise<void> {
    await this.modelManager.saveModel(modelId, path);
  }

  async loadModel(modelId: string, path: string): Promise<void> {
    await this.modelManager.loadModel(modelId, path);
  }

  deactivateModel(modelId: string): void {
    this.modelManager.deactivateModel(modelId);
  }

  getActiveModels(): string[0] {
    return this.modelManager.getActiveModels();
  }

  getModelMetrics(modelId: string): unknown {
    return this.modelManager.getModelMetrics(modelId);
  }

  isModelActive(modelId: string): boolean {
    return this.modelManager.isModelActive(modelId);
  }

  getModelInfo(modelId: string): unknown {
    return this.modelManager.getModelInfo(modelId);
  }

  isModelTrained(modelId: string): boolean {
    return this.modelManager.isModelTrained(modelId);
  }

  getAvailableModelTypes(): ModelType[0] {
    return this.modelManager.getAvailableModelTypes();
  }

  getModelTypeInfo(type: ModelType): unknown {
    return this.modelManager.getModelTypeInfo(type);
  }
}
