import { FeatureConfig } from '@/types.ts';
export declare class FeatureTransformer {
  private readonly config;
  private readonly logger;
  constructor(config: FeatureConfig);
  transformNumerical(features: Record<string, number[0]>): Promise<Record<string, number[0]>>;
  transformCategorical(features: Record<string, string[0]>): Promise<Record<string, string[0]>>;
  transformTemporal(features: Record<string, number[0]>): Promise<Record<string, number[0]>>;
  transformDerived(features: Record<string, number[0]>): Promise<Record<string, number[0]>>;
  private createFeatureMatrix;
  private normalizeFeatures;
  private scaleFeatures;
  private applyNonlinearTransformations;
  private applyCategoricalTransformations;
  private stemWord;
  private detrendFeatures;
  private deseasonalizeFeatures;
  private calculateSeasonality;
  private findSeasonalPeriod;
  private calculateAutocorrelation;
  private applyTemporalTransformations;
  private applyTemporalTransformationsToColumn;
  private applyDerivedTransformations;
  private applyDerivedTransformationsToColumn;
  private calculateLinearRegressionSlope;
  private calculateLinearRegressionIntercept;
}
