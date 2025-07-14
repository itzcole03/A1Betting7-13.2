import { FeatureConfig, EngineeredFeatures, FeatureValidationResult } from '@/types.ts';
export declare class FeatureValidator {
  private readonly config;
  private readonly logger;
  constructor(config: FeatureConfig);
  validate(features: EngineeredFeatures): Promise<FeatureValidationResult>;
  private validateNumericalFeatures;
  private validateCategoricalFeatures;
  private validateTemporalFeatures;
  private validateDerivedFeatures;
  private validateFeatureMetadata;
  private mergeValidationResults;
  private checkValidationThreshold;
  private detectOutliers;
  private checkDistribution;
  private calculateValueDistribution;
  private detectImbalancedCategories;
  private checkTemporalConsistency;
  private findTemporalGaps;
  private detectSuddenChanges;
  private checkSeasonality;
  private checkTrend;
  private checkFeatureCorrelation;
  private calculateAutocorrelation;
  private calculateLinearRegressionSlope;
}
