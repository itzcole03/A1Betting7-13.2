// MSW handlers for E2E and unit tests
import { http, HttpResponse } from 'msw';

export const enhancedBetsEmptyResponse = {
  enhanced_bets: [],
  predictions: [],
  count: 0,
  total_predictions: 0,
  ai_insights: [],
  filters: { min_confidence: 0, max_results: 0 },
  status: 'success',
  portfolio_metrics: undefined,
  generated_at: new Date().toISOString(),
};

const enhancedBetsMockResponse = {
  enhanced_bets: [
    {
      id: '1',
      player_name: 'LeBron James',
      team: 'LAL',
      sport: 'NBA',
      stat_type: 'Points',
      line_score: 25.5,
      recommendation: 'OVER',
      confidence: 92.0,
      kelly_fraction: 0.1,
      expected_value: 0.2,
      quantum_confidence: 90.0,
      neural_score: 91.0,
      correlation_score: 0.5,
      synergy_rating: 0.7,
      stack_potential: 0.6,
      diversification_value: 0.8,
      shap_explanation: {},
      risk_assessment: {},
      injury_risk: 0.05,
      optimal_stake: 0.05,
      portfolio_impact: 0.7,
      variance_contribution: 0.2,
      source: 'mock',
    },
    {
      id: '2',
      player_name: 'Stephen Curry',
      team: 'GSW',
      sport: 'NBA',
      stat_type: '3PTM',
      line_score: 4.5,
      recommendation: 'OVER',
      confidence: 88.0,
      kelly_fraction: 0.09,
      expected_value: 0.18,
      quantum_confidence: 87.0,
      neural_score: 89.0,
      correlation_score: 0.4,
      synergy_rating: 0.6,
      stack_potential: 0.5,
      diversification_value: 0.7,
      shap_explanation: {},
      risk_assessment: {},
      injury_risk: 0.04,
      optimal_stake: 0.04,
      portfolio_impact: 0.6,
      variance_contribution: 0.18,
      source: 'mock',
    },
    // MLB prop for E2E tests (LeBron James, to match test expectation)
    {
      id: '3',
      player_name: 'LeBron James',
      team: 'NYY',
      sport: 'MLB',
      stat_type: 'Home Runs',
      line_score: 1.5,
      recommendation: 'OVER',
      confidence: 92.0,
      kelly_fraction: 0.1,
      expected_value: 0.2,
      quantum_confidence: 90.0,
      neural_score: 91.0,
      correlation_score: 0.5,
      synergy_rating: 0.7,
      stack_potential: 0.6,
      diversification_value: 0.8,
      shap_explanation: {},
      risk_assessment: {},
      injury_risk: 0.05,
      optimal_stake: 0.05,
      portfolio_impact: 0.7,
      variance_contribution: 0.2,
      source: 'mock',
      // Required for PropCard
      position: 'RF',
      score: 92,
      summary: 'LeBron is on a hot streak with 7 HR in last 8 games.',
      analysis: "AI's Take: LeBron's matchup and recent form favor the OVER.",
      stats: [
        { label: '7/7', value: 1 },
        { label: '7/8', value: 0.6 },
      ],
      insights: [
        { icon: '🔥', text: 'Hot streak: 7 HR in 8 games' },
        { icon: '⚾', text: 'Favorable pitcher matchup' },
      ],
    },
  ],
  predictions: [],
  count: 2,
  total_predictions: 2,
  ai_insights: [
    {
      player_name: 'LeBron James',
      confidence: 92.0,
      quantum_analysis: '',
      neural_patterns: [],
      shap_factors: [],
      risk_factors: [],
      opportunity_score: 8.5,
      market_edge: 4.0,
      confidence_reasoning: '',
    },
    {
      player_name: 'Stephen Curry',
      confidence: 88.0,
      quantum_analysis: '',
      neural_patterns: [],
      shap_factors: [],
      risk_factors: [],
      opportunity_score: 7.9,
      market_edge: 3.7,
      confidence_reasoning: '',
    },
  ],
  filters: { min_confidence: 0, max_results: 0 },
  status: 'success',
  portfolio_metrics: undefined,
  generated_at: new Date().toISOString(),
};

export const handlers = [
  // Health check endpoint - must be first to ensure it matches
  http.get('*/api/health/status', ({ request }) => {
    console.log('[MSW][HANDLER] Health check called');
    return HttpResponse.json({ status: 'ok' });
  }),
  // Health check for App.tsx
  http.get('*/health', ({ request }) => {
    console.log('[MSW][HANDLER] /health called');
    if (globalThis.__JEST_E2E_ERROR__) {
      return HttpResponse.json({ error: 'Backend down' }, { status: 500 });
    }
    return HttpResponse.json({ status: 'ok' });
  }),
  // Sport activation endpoints - using wildcard patterns
  http.post('*/api/sports/activate/MLB', ({ request }) => {
    const sport = 'MLB';
    console.log(
      `[MSW][HANDLER] /api/sports/activate/${sport} called - URL:`,
      request.url.toString()
    );
    if (globalThis.__JEST_E2E_ERROR__) {
      return HttpResponse.json({ error: 'Sport activation failed' }, { status: 500 });
    }
    return HttpResponse.json({ status: 'activated', sport });
  }),
  http.post('*/api/sports/activate/NBA', ({ request }) => {
    const sport = 'NBA';
    console.log(
      `[MSW][HANDLER] /api/sports/activate/${sport} called - URL:`,
      request.url.toString()
    );
    if (globalThis.__JEST_E2E_ERROR__) {
      return HttpResponse.json({ error: 'Sport activation failed' }, { status: 500 });
    }
    return HttpResponse.json({ status: 'activated', sport });
  }),
  http.post('*/api/sports/activate/NFL', ({ request }) => {
    const sport = 'NFL';
    console.log(
      `[MSW][HANDLER] /api/sports/activate/${sport} called - URL:`,
      request.url.toString()
    );
    if (globalThis.__JEST_E2E_ERROR__) {
      return HttpResponse.json({ error: 'Sport activation failed' }, { status: 500 });
    }
    return HttpResponse.json({ status: 'activated', sport });
  }),
  http.post('*/api/sports/activate/NHL', ({ request }) => {
    const sport = 'NHL';
    console.log(
      `[MSW][HANDLER] /api/sports/activate/${sport} called - URL:`,
      request.url.toString()
    );
    if (globalThis.__JEST_E2E_ERROR__) {
      return HttpResponse.json({ error: 'Sport activation failed' }, { status: 500 });
    }
    return HttpResponse.json({ status: 'activated', sport });
  }),

  // MLB odds comparison endpoint - using wildcard pattern
  http.get('*/mlb/odds-comparison', ({ request }) => {
    console.log('[MSW][HANDLER] /mlb/odds-comparison called with URL:', request.url.toString());
    const url = new URL(request.url);
    const marketType = url.searchParams.get('market_type');

    if (globalThis.__JEST_E2E_ERROR__) {
      return HttpResponse.json({ error: 'Simulated network error for E2E test' }, { status: 500 });
    }

    // For upcoming games request (market_type=playerprops)
    if (marketType === 'playerprops') {
      console.log('[MSW][HANDLER] Returning upcoming games data');
      return HttpResponse.json([
        {
          event_name: 'New York Yankees @ Boston Red Sox',
          start_time: '2025-07-29T20:00:00Z',
          player: 'Aaron Judge',
          stat_type: 'Home Runs',
        },
      ]);
    }

    // For regular props request
    if (globalThis.__JEST_E2E_EMPTY__) {
      return HttpResponse.json([]);
    }

    // Return a mapped MLB prop with the correct structure for E2E/component tests
    const mlbMapped = [
      {
        id: 'mlb-1',
        player: 'Aaron Judge',
        matchup: 'Yankees vs Red Sox',
        stat: 'Home Runs',
        statType: 'Home Runs',
        line: 1.5,
        overOdds: 2.1,
        underOdds: 1.7,
        confidence: 92,
        sport: 'MLB',
        gameTime: '2025-07-29T20:00:00Z',
        pickType: 'Home Runs',
        value: 1.23,
        overReasoning: 'Over Analysis',
        underReasoning: 'Under Analysis',
        expected_value: 0.5,
        team: 'Lakers',
        position: 'RF',
        score: 92,
        summary: 'Aaron Judge is on a hot streak with 7 HR in last 8 games.',
        analysis: "AI's Take: Aaron's matchup and recent form favor the OVER.",
        stats: [
          { label: '7/7', value: 1 },
          { label: '7/8', value: 0.6 },
        ],
        insights: [
          { icon: '🔥', text: 'Hot streak: 7 HR in 8 games' },
          { icon: '⚾', text: 'Favorable pitcher matchup' },
        ],
      },
    ];
    console.log(
      '[MSW][HANDLER] /mlb/odds-comparison/ returning props:',
      JSON.stringify(mlbMapped, null, 2)
    );
    return HttpResponse.json(mlbMapped);
  }),
  http.get(/\/portfolio-optimization/, ({ request }) => {
    if (globalThis.__JEST_E2E_ERROR__) {
      return HttpResponse.json(
        { error: 'Simulated error for /portfolio-optimization' },
        { status: 500 }
      );
    }
    return HttpResponse.json({});
  }),
  http.get(/\/ai-insights/, ({ request }) => {
    if (globalThis.__JEST_E2E_ERROR__) {
      return HttpResponse.json({ error: 'Simulated error for /ai-insights' }, { status: 500 });
    }
    return HttpResponse.json({});
  }),
  http.post('/api/unified/batch-predictions', async ({ request }) => {
    // Echo back the input props as the batch result for tests
    let input = [];
    try {
      input = await request.json();
    } catch (e) {
      input = [];
    }
    // Optionally, add a confidence field if missing
    const batch = (Array.isArray(input) ? input : []).map((p, i) => ({
      ...p,
      id: p.id || `mock-${i}`,
      confidence: typeof p.confidence === 'number' ? p.confidence : 92,
    }));
    // eslint-disable-next-line no-console
    console.log(
      '[MSW][HANDLER] /api/unified/batch-predictions called, returning:',
      JSON.stringify(batch, null, 2)
    );
    return HttpResponse.json(batch);
  }),
  http.get('*/api/version', ({ request }) => {
    return HttpResponse.json({ version: 'test' });
  }),
];
