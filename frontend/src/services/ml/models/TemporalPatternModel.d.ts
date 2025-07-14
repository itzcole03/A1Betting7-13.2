/**
 * Model for analyzing temporal patterns and generating predictions.
 */
import { BaseModel } from './BaseModel.ts';
import { ModelConfig, ModelMetrics, ModelPrediction } from '@/types.ts';
export declare class TemporalPatternModel extends BaseModel {
  protected config: ModelConfig;
  private microTrendWindow;
  private macroTrendWindow;
  private circadianThreshold;
  private cyclicalThreshold;
  constructor(config: ModelConfig);
  predict(data: unknown): Promise<ModelPrediction>;
  update(data: unknown): Promise<void>;
  train(data: any[0]): Promise<void>;
  evaluate(data: any): Promise<ModelMetrics>;
  save(path: string): Promise<void>;
  load(path: string): Promise<void>;
  private analyzeMicroTrends;
  private analyzeMacroTrends;
  private analyzeCyclicalPatterns;
  private analyzeCircadianFactors;
  private calculateTrend;
  private calculateVolatility;
  private calculateMomentum;
  private detectSeasonality;
  private detectPeriodicity;
  private calculatePhase;
  private calculateTimeZoneImpact;
  private calculateTravelImpact;
  private calculateRestImpact;
  private calculateCorrelation;
  private calculateFrequencies;
}
