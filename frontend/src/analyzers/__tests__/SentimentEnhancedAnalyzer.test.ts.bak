import { SentimentEnhancedAnalyzer } from '../SentimentEnhancedAnalyzer';

describe('SentimentEnhancedAnalyzer', () => {
  it('enhances projections with sentiment and injuries', async () => {
    const analyzer = new SentimentEnhancedAnalyzer(0.2, 0.0, 0.2); // ignore odds weight for test

    (analyzer as any).performanceMonitor = { startTrace: () => 't', endTrace: () => {} };
    const publish = jest.fn();
    (analyzer as any).eventBus = { publish };

    const input = {
      projectionAnalysis: [
        {
          player: 'Player A',
          predictions: {
            points: { predicted: 20, confidence: 0.8, range: { min: 18, max: 22 } },
            rebounds: { predicted: 5, confidence: 0.8, range: { min: 4, max: 6 } },
            assists: { predicted: 6, confidence: 0.8, range: { min: 5, max: 7 } },
            steals: { predicted: 1, confidence: 0.8, range: { min: 0, max: 2 } },
            blocks: { predicted: 0, confidence: 0.8, range: { min: 0, max: 1 } },
            threes: { predicted: 2, confidence: 0.8, range: { min: 1, max: 3 } },
            minutes: { predicted: 30, confidence: 0.8, range: { min: 28, max: 32 } },
          },
          confidence: 0.8,
          metadata: { team: 'T1', position: 'G', opponent: 'T2', isHome: true },
        },
      ],
      sentimentData: [
        {
          player: 'Player A',
          sentiment: { score: 0.1, volume: 10 },
          trending: true,
          keywords: ['good'],
        },
      ],
      sportsRadarData: {
        games: [
          {
            id: 'g1',
            date: '',
            teams: [],
            players: [
              {
                id: 'p1',
                name: 'Player A',
                team: 'T1',
                injuries: [{ status: 'out', type: 'leg' }],
              },
            ],
          },
        ],
      },
      oddsData: { events: [] },
    } as any;

    const out = await analyzer.analyze(input);
    expect(Array.isArray(out)).toBe(true);
    expect(out[0].sentiment.score).toBeCloseTo(0.1);
    // because injury 'out' has impact 1 and injuryWeight=0.2, confidence should be reduced
    expect(out[0].confidence).toBeLessThan(0.8 + 0.2 * 0.1);
    expect(publish).toHaveBeenCalledWith('enhanced-analysis-completed', expect.any(Object));
  });
});
