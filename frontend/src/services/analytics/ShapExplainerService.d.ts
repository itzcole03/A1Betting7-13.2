import { BaseModel } from '@/ml/models/BaseModel.ts';
export declare class ShapExplainerService {
  static explainPrediction(model: BaseModel, input: unknown): Promise<unknown>;
}
export default ShapExplainerService;
