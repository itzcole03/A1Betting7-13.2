import { ModelVersion, ModelEvaluation, ModelEvaluatorConfig } from '@/types.ts';
export declare class ModelEvaluator {
  private config;
  private logger;
  constructor(config: ModelEvaluatorConfig);
  evaluate(model: ModelVersion, data: any): Promise<ModelEvaluation>;
  private splitData;
  private getPredictions;
  private calculateMetrics;
  private calculateAccuracy;
  private calculatePrecision;
  private calculateRecall;
  private calculateF1Score;
  private calculateConfusionMatrix;
  private calculateROCCurve;
  private generateThresholds;
  private calculateRates;
  private calculatePerformanceMetrics;
  private calculateFeatureImportance;
  private calculateCustomMetrics;
}
