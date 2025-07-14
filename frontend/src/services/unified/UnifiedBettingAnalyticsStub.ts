export type BetRecommendation = {
  id: string;
  market: string;
  odds: number;
  prediction: number;
  confidence: number;
  recommendedStake: number;
  expectedValue: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  hedgingOpportunities: any[];
};

export class UnifiedBettingAnalyticsStub {
  static getRecommendations(): BetRecommendation[] {
    return [
      {
        id: 'rec1',
        market: 'NBA',
        odds: 2.1,
        prediction: 0.8,
        confidence: 0.95,
        recommendedStake: 10,
        expectedValue: 5,
        riskLevel: 'low',
        riskFactors: [],
        hedgingOpportunities: [],
      },
    ];
  }
}
