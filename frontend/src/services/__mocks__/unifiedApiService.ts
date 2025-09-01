// Allow test code to set this flag to force error state in getEnhancedBets
declare global {
   
  interface Global {
    __MOCK_GET_ENHANCED_BETS_ERROR__?: boolean;
  }
}
const mockEnhancedBets = [
  {
    id: '1',
    player_name: 'LeBron James',
    team: 'LAL',
    sport: 'NBA',
    stat_type: 'Points',
    line_score: 25.5,
    recommendation: 'OVER',
    confidence: 92,
    kelly_fraction: 0.1,
    expected_value: 0.18,
    quantum_confidence: 92,
    neural_score: 90,
    correlation_score: 0.2,
    synergy_rating: 0.8,
    stack_potential: 0.5,
    diversification_value: 0.7,
    shap_explanation: { baseline: 0, features: {}, prediction: 0, top_factors: [] },
    risk_assessment: {
      overall_risk: 0.1,
      confidence_risk: 0.1,
      line_risk: 0.1,
      market_risk: 0.1,
      risk_level: 'low',
    },
    weather_impact: 0,
    injury_risk: 0,
    optimal_stake: 10,
    portfolio_impact: 0.1,
    variance_contribution: 0.01,
    source: 'mock',
    arbitrage_opportunities: [],
  },
];
// DEBUG: Top-level log to confirm mock is loaded
console.log('[MOCK] unifiedApiService mock file loaded');

// DEBUG: Top-level log to confirm mock is loaded
// eslint-disable-next-line no-console
console.log('[MOCK] unifiedApiService mock file loaded');

// Ensure mockEnhancedBets is defined before class usage

class UnifiedApiServiceMock {
  constructor() {
    // eslint-disable-next-line no-console
    console.log('[MOCK] UnifiedApiServiceMock constructor called');
  }
  async getEnhancedBets() {
    console.log('[MOCK] getEnhancedBets error flags:', {
      mockFlag: (globalThis as any).__MOCK_GET_ENHANCED_BETS_ERROR__,
      e2eFlag: (globalThis as any).__JEST_E2E_ERROR__,
    });
    if (
      (globalThis as any).__MOCK_GET_ENHANCED_BETS_ERROR__ ||
      (globalThis as any).__JEST_E2E_ERROR__
    ) {
      console.log('[MOCK] getEnhancedBets throwing error for test');
      throw new Error('Cannot connect to backend');
    }
    try {
      console.log('[MOCK] getEnhancedBets called');
      const response = {
        enhanced_bets: mockEnhancedBets,
        count: mockEnhancedBets.length,
        ai_insights: [],
        filters: {
          sport: 'NBA',
          min_confidence: 0,
          max_results: 10,
        },
        status: 'mock',
      };
      console.log('[MOCK] getEnhancedBets returning:', JSON.stringify(response));
      return response;
    } catch (err) {
      console.error('[MOCK] getEnhancedBets ERROR:', err);
      throw err;
    }
  }
  async getAIInsights() {
    // eslint-disable-next-line no-console
    console.log('[MOCK] getAIInsights called [TOP-LEVEL]');
    return {
      ai_insights: [
        {
          bet_id: '1',
          player_name: 'LeBron James',
          sport: 'NBA',
          confidence: 92,
          quantum_analysis: 'LeBron is projected to exceed 25.5 points.',
          neural_patterns: ['High scoring trend', 'Strong matchup'],
          shap_explanation: {},
          risk_factors: ['Low injury risk'],
          opportunity_score: 0.95,
          market_edge: 0.12,
          confidence_reasoning: 'Consistent performance and favorable matchup.',
          key_factors: [
            ['Recent games', 0.7],
            ['Opponent defense', 0.3],
          ],
        },
      ],
      summary: {
        total_opportunities: 1,
        average_opportunity_score: 0.95,
        total_market_edge: 0.12,
        quantum_analysis_available: true,
        neural_patterns_detected: 1,
        high_confidence_bets: 1,
      },
      market_intelligence: {
        inefficiencies_detected: 1,
        pattern_strength: 'Strong',
        recommendation: 'Bet OVER on LeBron',
      },
    };
  }
  // Add other mocked methods as needed
}

export default function createUnifiedApiServiceMock() {
  return new UnifiedApiServiceMock();
}
