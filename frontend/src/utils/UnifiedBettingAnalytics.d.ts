import EventEmitter from 'eventemitter3';
type ModelParameters = Record<string, unknown>;
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
  parameters: ModelParameters;
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
  private activeStrategies;
  private constructor();
  static getInstance(): UnifiedBettingAnalytics;
  private initializeEventListeners;
  private calculateKellyCriterion;
  analyzeBettingOpportunity(stake: number): Promise<BettingAnalysis>;
  private generatePrediction;
  /**
   * Analyze current strategies, odds, and prediction confidence to identify risk factors.
   * Returns an array of human-readable risk factor strings for UI display.
   *
   * This implementation checks for high odds, low prediction confidence, and missing strategies.
   * Extend as needed for more advanced analytics.
   */
  private assessRiskFactors;
  private calculateRiskLevel;
  private findHedgingOpportunities;
  addStrategy(strategy: BettingStrategy): void;
  removeStrategy(strategyId: string): void;
}
