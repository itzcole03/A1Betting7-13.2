import EventEmitter from 'eventemitter3';
export interface BettingStrategy {
  id: string;
  name: string;
  riskLevel: 'low' | 'medium' | 'high';
  stakePercentage: number;
  minOdds: number;
  maxOdds: number;
}
export interface PredictionModel {
  id: string;
  name: string;
  accuracy: number;
  lastUpdated: Date;
  parameters: Record<string, unknown>;
}
export interface BettingAnalysis {
  predictionConfidence: number;
  recommendedStake: number;
  expectedValue: number;
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  hedgingOpportunities: Array<{
    market: string;
    odds: number;
    recommendedStake: number;
  }>;
}
export declare class UnifiedBettingAnalytics extends EventEmitter {
  private static instance: UnifiedBettingAnalytics;
  private dataService;
  private activeStrategies;
  private predictionModels;
  private constructor();
  static getInstance(): UnifiedBettingAnalytics;
  private initializeEventListeners;
  private calculateKellyCriterion;
  analyzeBettingOpportunity(market: string, odds: number, stake: number): Promise<BettingAnalysis>;
  private generatePrediction;
  private assessRiskFactors;
  private calculateRiskLevel;
  private findHedgingOpportunities;
  private calculateHedgeStake;
  private analyzeOddsMovement;
  private updatePredictions;
  addStrategy(strategy: BettingStrategy): void;
  removeStrategy(strategyId: string): void;
  addPredictionModel(model: PredictionModel): void;
  removePredictionModel(modelId: string): void;
}
