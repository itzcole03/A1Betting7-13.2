import { EngineeredFeatures, RawPlayerData } from '@/types.ts';
export declare class FeatureEngineeringService {
  private readonly config;
  private featureCache;
  private scalingParams;
  private encodingMaps;
  private featureSelector;
  private featureTransformer;
  private featureValidator;
  private featureStore;
  private featureRegistry;
  private featureCache;
  private featureMonitor;
  private featureLogger;
  constructor();
  private initializeService;
  private loadFeatureMetadata;
  private initializeFeatureMonitoring;
  generateFeatures(
    playerId: string,
    propType: string,
    rawData: RawPlayerData
  ): Promise<EngineeredFeatures>;
  private generateBaseFeatures;
  private generateTemporalFeatures;
  private generateInteractionFeatures;
  private generateContextualFeatures;
  private selectFeatures;
  private transformFeatures;
  private validateFeatures;
  private filterFeatures;
  private calculateAverage;
  private calculateRollingAverage;
  private calculateRollingStd;
  private calculateRollingTrend;
  private calculateLinearRegressionSlope;
  private calculateUsageRate;
  private calculateTrueShooting;
  private calculateEffectiveFgPct;
  private calculateTeamPace;
  private calculateOffensiveRating;
  private calculateDefensiveRating;
  private extractHomeAway;
  private extractDayOfWeek;
  private extractOpponents;
  private calculateInjuryImpact;
  private calculateRestDays;
  private calculateTravelDistance;
  private calculateDistance;
  private calculateLineupCoherence;
  private calculateMarketSentiment;
}
export declare const featureEngineeringService: FeatureEngineeringService;
