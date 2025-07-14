import {
  FinalPredictionEngine,
  FinalPredictionEngineDependencies,
  FinalPredictionEngineConfig,
  ModelOutput,
  ModelWeight,
  RiskProfile,
  FinalPrediction,
  RiskLevel,
  //   PredictionWithExplanation
} from '@/types.ts';
export declare class FinalPredictionEngineImpl implements FinalPredictionEngine {
  private dependencies;
  private config;
  private modelWeights;
  private riskProfiles;
  private featureStats;
  private confidenceWeights;
  private currentPrediction;
  constructor(
    dependencies: FinalPredictionEngineDependencies,
    initialConfig: FinalPredictionEngineConfig
  );
  generatePrediction(
    modelOutputs: ModelOutput[0],
    riskProfile: RiskProfile,
    context?: Record<string, any>
  ): Promise<FinalPrediction>;
  private validateModelOutputs;
  private validateRiskProfile;
  private calculateWeightedScores;
  private determineRiskLevel;
  private calculateFinalScore;
  private checkSureOdds;
  private calculatePayoutRange;
  private aggregateFeatures;
  private calculateDataFreshness;
  private calculateSignalQuality;
  private logPrediction;
  private trackMetrics;
  updateModelWeights(weights: ModelWeight[0]): Promise<void>;
  updateRiskProfiles(profiles: Record<string, RiskProfile>): Promise<void>;
  getEngineMetrics(): Promise<Record<string, number>>;
  validatePrediction(prediction: FinalPrediction): Promise<boolean>;
  private calculateShapValues;
  private calculateFeatureConfidence;
  private calculateConfidence;
  private calculateShapConsistency;
  private calculateModelAgreement;
  private getFeatureImportance;
  private generatePredictions;
  private combinePredictions;
  private calculateOverallConfidence;
  generatePredictionWithExplanation(
    features: Record<string, number>,
    riskLevel?: RiskLevel
  ): Promise<PredictionWithExplanation>;
}
