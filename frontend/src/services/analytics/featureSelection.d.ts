import { FeatureConfig, EngineeredFeatures, FeatureSelectionResult } from '@/types.ts';
export declare class FeatureSelector {
  private readonly config;
  private readonly logger;
  constructor(config: FeatureConfig);
  selectFeatures(features: EngineeredFeatures): Promise<FeatureSelectionResult>;
  private selectNumericalFeatures;
  private selectCategoricalFeatures;
  private selectTemporalFeatures;
  private selectDerivedFeatures;
  private calculateFeatureImportance;
  private createFeatureMatrix;
  private calculateCorrelationMatrix;
  private removeCorrelatedFeatures;
  private calculateVarianceScores;
  private calculateInformationValue;
  private calculateAutocorrelationScores;
  private calculateTrendScores;
  private calculateMutualInformationScores;
  private calculateMutualInformation;
  private discretize;
  private calculateLinearRegressionSlope;
  private calculateVarianceImportance;
  private calculateCorrelationImportance;
  private calculateMutualInfoImportance;
  private combineImportanceScores;
  private normalizeScores;
  private filterFeaturesByImportance;
}
