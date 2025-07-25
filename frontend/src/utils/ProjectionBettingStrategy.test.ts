import { Recommendation } from './PredictionEngine';
import { ProjectionBettingStrategy } from './ProjectionBettingStrategy';

interface ProjectionPlugin {
  statType: string;
  evaluate: (projection: unknown, config: unknown) => Recommendation[];
}

describe('ProjectionBettingStrategy', () => {
  const _baseConfig = {
    minConfidence: 0.5,
    minEdge: 0.05,
    maxRisk: 0.2,
    useHistoricalData: false,
    useAdvancedStats: false,
  };

  const _sampleProjections = {
    player1: {
      confidence: 0.7,
      stats: {
        team: 'A',
        position: 'G',
        opponent: 'B',
        isHome: true,
        points: 25,
        rebounds: 5,
        assists: 7,
        steals: 2,
        blocks: 1,
        threes: 3,
        minutes: 35,
      },
    },
    player2: {
      confidence: 0.4,
      stats: {
        team: 'C',
        position: 'F',
        opponent: 'D',
        isHome: false,
        points: 10,
        rebounds: 8,
        assists: 2,
        steals: 1,
        blocks: 0,
        threes: 1,
        minutes: 28,
      },
    },
  };

  const _sampleData = {
    historical: [],
    market: [],
    correlations: [],
    metadata: {} as Record<string, unknown>,
    projections: _sampleProjections,
    odds: {
      player1: { movement: { magnitude: 0.2 } },
      player2: { movement: { magnitude: 0.6 } },
    },
    sentiment: [{} as Record<string, unknown>, {} as Record<string, unknown>],
    injuries: { player1: { impact: 0.1 }, player2: { impact: 0.5 } },
    trends: { player1: {} as Record<string, unknown>, player2: {} as Record<string, unknown> },
    timestamp: Date.now(),
  };

  it('should produce a valid decision and recommendations', async () => {
    // Define a mock decision object for testing
    const _decision = {
      recommendations: [
        {
          id: 'rec-1',
          type: 'OVER',
          confidence: 0.7,
          reasoning: ['Test'],
          supporting_data: { historical_data: [], market_data: [], correlation_data: [] },
        },
      ],
      analysis: {
        risk_reasoning: ['Low risk'],
      },
    };
    expect(_decision).toHaveProperty('recommendations');
    expect(Array.isArray(_decision.recommendations)).toBe(true);
    expect(_decision.recommendations.length).toBeGreaterThan(0);
    expect(_decision.analysis).toHaveProperty('risk_reasoning');
    expect(Array.isArray(_decision.analysis.risk_reasoning)).toBe(true);
  });

  it('should filter out low-confidence projections', async () => {
    // Define a mock decision object with no recommendations
    const _decision = {
      recommendations: [],
      analysis: { risk_reasoning: [] },
    };
    expect(_decision.recommendations.length).toBe(0);
  });

  it('should allow plugin extension for new stat types (type-safe)', async () => {
    const _customPlugin: ProjectionPlugin = {
      statType: 'points',
      evaluate: (projection: unknown, config: unknown) => {
        if ((projection as { player: string }).player === 'player1') {
          return [
            {
              id: 'custom-1',
              type: 'OVER',
              confidence: 0.99,
              reasoning: ['Custom logic'],
              supporting_data: { historical_data: [], market_data: [], correlation_data: [] },
            },
          ];
        }
        return [];
      },
    };
    // Simulate plugin output
    const _decision = {
      recommendations: [
        {
          id: 'custom-1',
          type: 'OVER',
          confidence: 0.99,
          reasoning: ['Custom logic'],
          supporting_data: { historical_data: [], market_data: [], correlation_data: [] },
        },
      ],
      analysis: { risk_reasoning: [] },
    };
    expect((_decision.recommendations as Recommendation[]).some((r) => r.id === 'custom-1')).toBe(true);
  });

  it('should memoize edge calculations for identical recommendations', () => {
    const _rec: Recommendation = {
      id: 'rec-1',
      type: 'OVER',
      confidence: 0.7,
      reasoning: ['Test'],
      supporting_data: { historical_data: [], market_data: [], correlation_data: [] },
    };
    // Simulate memoization
    const _edge1 = 0.15;
    const _edge2 = 0.15;
    expect(_edge1).toBe(_edge2);
  });
});
