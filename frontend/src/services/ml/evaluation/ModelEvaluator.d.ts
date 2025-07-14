import { ModelMetrics } from '@/types/ModelMetrics.ts';
import { ModelMetadata } from '@/models/ModelMetadata.ts';
import * as tf from '@tensorflow/tfjs.ts';
export declare class ModelEvaluator {
  private static instance;
  private logger;
  private monitor;
  private kellyCriterion;
  private bestBetSelector;
  private constructor();
  static getInstance(): ModelEvaluator;
  evaluateModel(
    model: tf.LayersModel,
    testData: tf.Tensor,
    testLabels: tf.Tensor,
    metadata: ModelMetadata
  ): Promise<ModelMetrics>;
  private calculateBasicMetrics;
  private performShapAnalysis;
  private calculateFeatureImportance;
  private analyzePredictionConfidence;
  private measurePerformance;
  private detectDrift;
  private calculateConfusionMatrix;
  private calculateAccuracy;
  private calculatePrecision;
  private calculateRecall;
  private calculateF1Score;
  private calculateAUC;
  private processShapValues;
  private perturbFeature;
  private calculateMean;
  private calculateStd;
  private calculateDistribution;
  private calculateFeatureDrift;
  private calculatePredictionDrift;
  private assessDataQuality;
}
