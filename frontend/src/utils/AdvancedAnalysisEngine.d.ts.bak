export interface AnalysisResult {
  playerId: string;
  predictions: {
    [metric: string]: {
      value: number;
      confidence: number;
      factors: Array<{
        type: string;
        impact: number;
        description: string;
      }>;
    };
  };
  trends: {
    [metric: string]: {
      direction: 'up' | 'down' | 'stable';
      strength: number;
      supporting_data: string[];
    };
  };
  risks: {
    [type: string]: {
      level: 'LOW' | 'MEDIUM' | 'HIGH';
      factors: string[];
      mitigation?: string;
    };
  };
  opportunities: Array<{
    type: string;
    confidence: number;
    expected_value: number;
    rationale: string[];
  }>;
  meta_analysis: {
    data_quality: number;
    prediction_stability: number;
    market_efficiency: number;
    sentiment_alignment: number;
  };
}

interface AnalysisConfig {
  confidenceThreshold: number;
  riskTolerance: number;
  timeHorizon: number;
  weightings: {
    historical: number;
    current: number;
    sentiment: number;
    market: number;
  };
}

export declare class AdvancedAnalysisEngine {
  private static instance;
  private readonly eventBus;
  private readonly performanceMonitor;
  private readonly dataHub;
  private readonly featureManager;
  private config;
  private constructor();
  static getInstance(): AdvancedAnalysisEngine;
  private getDefaultConfig;
  setConfig(config: Partial<AnalysisConfig>): void;
  analyzePlayer(playerId: string): Promise<AnalysisResult>;
  private performAnalysis;
  private generatePredictions;
  private analyzeTrends;
  private getTrendDirection;
  private generateTrendSupportingData;
  private assessRisks;
  private identifyOpportunities;
  private performMetaAnalysis;
  private calculateSentimentImpact;
  private calculateRiskLevel;
  private assessDataQuality;
  private calculateProjectionQuality;
  private calculateSentimentQuality;
  private calculateMarketDataQuality;
  private calculateInjuryDataQuality;
  private findPlayerMarketData;
  private assessPredictionStability;
  private calculateFactorVariance;
  private assessMarketEfficiency;
  private assessSentimentAlignment;
}
