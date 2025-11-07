import { ProjectionAnalyzer } from '../ProjectionAnalyzer';

describe('ProjectionAnalyzer', () => {
  it('analyzes projections and filters by confidence threshold', async () => {
    const analyzer = new ProjectionAnalyzer(0.1); // low threshold so items pass

    // Inject mocks for performanceMonitor and eventBus to avoid side effects
    (analyzer as any).performanceMonitor = {
      startTrace: () => 'trace',
      startSpan: () => 'span',
      endSpan: () => {},
      endTrace: () => {},
    };
    const publish = jest.fn();
    (analyzer as any).eventBus = { publish };

    const data = {
      projections: [
        {
          name: 'P1',
          team: 'T1',
          position: 'G',
          opp_team: 'T2',
          is_home: true,
          pts: 25,
          reb: 5,
          ast: 6,
          stl: 1,
          blk: 0,
          three_pt: 3,
          min: 32,
        },
      ],
    } as any;

    const result = await analyzer.analyze(data);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(publish).toHaveBeenCalled();

    const conf = await analyzer.confidence(data);
    expect(conf).toBeGreaterThanOrEqual(0);
  });

  it('confidence returns 0 for empty projections', async () => {
    const analyzer = new ProjectionAnalyzer();
    (analyzer as any).performanceMonitor = { startTrace: () => 't', endTrace: () => {} };
    const conf = await analyzer.confidence({ projections: [] } as any);
    expect(conf).toBe(0);
  });
});
