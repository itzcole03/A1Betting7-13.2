// Shared E2E Jest setup for global mocks

jest.mock("./frontend/src/hooks/usePortfolioOptimization", () => ({
  usePortfolioOptimization: () => ({
    data: {
      portfolio_metrics: {
        total_expected_value: 0.33,
        total_risk_score: 0.1,
        diversification_score: 0.5,
        kelly_optimization: 0.1,
        sharpe_ratio: 1.2,
        max_drawdown: -0.05,
        confidence_weighted_return: 0.2,
      },
      optimization_recommendations: [],
      risk_assessment: {},
      status: "mock",
    },
    isLoading: false,
    isError: false,
  }),
}));
jest.mock("./frontend/src/hooks/useAIInsights", () => ({
  useAIInsights: () => ({
    data: {
      ai_insights: [
        {
          bet_id: "1",
          player_name: "LeBron James",
          sport: "NBA",
          confidence: 92,
          quantum_analysis:
            "Quantum algorithms detected optimal betting patterns.",
          neural_patterns: ["Strong momentum indicators"],
          shap_explanation: {},
          risk_factors: ["Injury risk"],
          opportunity_score: 8.7,
          market_edge: 4.2,
          confidence_reasoning: "Multiple AI models show consensus.",
          key_factors: [["Recent performance", 0.35]],
        },
      ],
      summary: {
        total_opportunities: 1,
        average_opportunity_score: 8.7,
        total_market_edge: 4.2,
        quantum_analysis_available: true,
        neural_patterns_detected: 1,
        high_confidence_bets: 1,
      },
      market_intelligence: {
        inefficiencies_detected: 1,
        pattern_strength: "strong",
        recommendation: "Bet on LeBron James",
      },
    },
    isLoading: false,
    isError: false,
  }),
}));
jest.mock("./frontend/src/onboarding/OnboardingFlow", () => ({
  OnboardingFlow: () => null,
}));
jest.mock("./frontend/src/update/UpdateModal", () => ({
  UpdateModal: () => null,
}));
jest.mock("./frontend/src/contexts/AuthContext", () => {
  const actual = jest.requireActual("./frontend/src/contexts/AuthContext");
  return {
    __esModule: true,
    _AuthProvider: actual._AuthProvider,
    useAuth: () => ({
      user: { id: "1", email: "user@example.com", role: "user" },
      isAdmin: false,
      isAuthenticated: true,
      requiresPasswordChange: false,
      changePassword: jest.fn(),
      loading: false,
      error: undefined,
    }),
  };
});
jest.mock("./frontend/src/services/backendDiscovery", () => ({
  discoverBackend: async () => "http://localhost:8000",
  backendDiscovery: {
    getBackendUrl: async () => "http://localhost:8000",
  },
}));
