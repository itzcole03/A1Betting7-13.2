/**
 * Model for analyzing alternative data sources and generating predictions.
 */
import { BaseModel } from './BaseModel.ts';
import { ModelConfig, ModelMetrics, ModelPrediction } from '@/types.ts';
export declare class AlternativeDataModel extends BaseModel {
  protected config: ModelConfig;
  private sentimentThreshold;
  private socialMediaThreshold;
  private newsThreshold;
  private marketSentimentThreshold;
  constructor(config: ModelConfig);
  predict(data: unknown): Promise<ModelPrediction>;
  update(data: unknown): Promise<void>;
  train(data: any[0]): Promise<void>;
  evaluate(data: any): Promise<ModelMetrics>;
  save(path: string): Promise<void>;
  load(path: string): Promise<void>;
  private analyzeSentiment;
  private analyzeSocialMedia;
  private analyzeNews;
  private analyzeMarketSentiment;
  private calculateEngagementScore;
  private calculateViralityScore;
  private calculateCoverageScore;
  private calculateRelevanceScore;
}
