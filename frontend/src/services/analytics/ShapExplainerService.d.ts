import { BaseModel } from '@/ml/models/BaseModel.ts';
export declare class ShapExplainerService {
  static explainPrediction(model: BaseModel, input: any): Promise<any>;
}
export default ShapExplainerService;
