export {};

export interface FeatureImportance {
  feature: string;
  value: number;
}

export interface ShapAnalysisResult {
  featureImportances: FeatureImportance[];
  raw?: Record<string, unknown>; // Made optional as it was causing issues
}
