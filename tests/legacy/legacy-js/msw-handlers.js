// MSW handlers for E2E and unit tests
import { http, HttpResponse } from "msw";

export const enhancedBetsEmptyResponse = {
  enhanced_bets: [],
  predictions: [],
  count: 0,
  total_predictions: 0,
  ai_insights: [],
  filters: { min_confidence: 0, max_results: 0 },
  status: "success",
  portfolio_metrics: undefined,
  generated_at: new Date().toISOString(),
};

const enhancedBetsMockResponse = {
  enhanced_bets: [
    {
      id: "1",
      player_name: "LeBron James",
      team: "LAL",
      sport: "NBA",
      stat_type: "Points",
      line_score: 25.5,
      recommendation: "OVER",
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
      source: "mock",
    },
    {
      id: "2",
      player_name: "Stephen Curry",
      team: "GSW",
      sport: "NBA",
      stat_type: "3PTM",
      line_score: 4.5,
      recommendation: "OVER",
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
      source: "mock",
    },
  ],
  predictions: [],
  count: 2,
  total_predictions: 2,
  ai_insights: [
    {
      player_name: "LeBron James",
      confidence: 92.0,
      quantum_analysis: "",
      neural_patterns: [],
      shap_factors: [],
      risk_factors: [],
      opportunity_score: 8.5,
      market_edge: 4.0,
      confidence_reasoning: "",
    },
    {
      player_name: "Stephen Curry",
      confidence: 88.0,
      quantum_analysis: "",
      neural_patterns: [],
      shap_factors: [],
      risk_factors: [],
      opportunity_score: 7.9,
      market_edge: 3.7,
      confidence_reasoning: "",
    },
  ],
  filters: { min_confidence: 0, max_results: 0 },
  status: "success",
  portfolio_metrics: undefined,
  generated_at: new Date().toISOString(),
};

export const handlers = [
  http.get(/\/enhanced-bets/, () => {
    if (globalThis.__JEST_E2E_ERROR__) {
      throw new Error("Simulated network error for E2E test");
    }
    if (globalThis.__JEST_E2E_EMPTY__) {
      return HttpResponse.json(enhancedBetsEmptyResponse);
    }
    return HttpResponse.json(enhancedBetsMockResponse);
  }),
  http.get(/\/portfolio-optimization/, () => {
    if (globalThis.__JEST_E2E_ERROR__) {
      throw new Error("Simulated error for /portfolio-optimization");
    }
    return HttpResponse.json({});
  }),
  http.get(/\/ai-insights/, () => {
    if (globalThis.__JEST_E2E_ERROR__) {
      throw new Error("Simulated error for /ai-insights");
    }
    return HttpResponse.json({});
  }),
  http.get(/\/api\/health\/status$/, ({ request }) => {
    return HttpResponse.json({ status: "ok" });
  }),
  http.get(/\/api\/version/, () => {
    return HttpResponse.json({ version: "test" });
  }),
];
