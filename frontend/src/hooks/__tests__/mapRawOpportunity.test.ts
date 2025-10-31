import { mapRawOpportunity, mapSummaryToStats } from '../usePropFinderData';

describe('mapRawOpportunity and summary mapping', () => {
  it('parses numeric strings into numbers and handles missing player', () => {
    const raw = {
      id: 'test-1',
      line: '12.5',
      odds: '-110',
      player: undefined,
      market: 'Points',
    } as any;

    const opp = mapRawOpportunity(raw);
    expect(opp.id).toBe('test-1');
    expect(opp.player).toBeUndefined();
    expect(typeof opp.line).toBe('number');
    expect(opp.line).toBeCloseTo(12.5);
    expect(typeof opp.odds).toBe('number');
    expect(opp.odds).toBe(-110);
    expect(opp.market).toBe('Points');
  });

  it('sanitizes bookmakers array and numeric fields', () => {
    const raw = {
      id: 'b-1',
      bookmakers: [
        {
          display_name: 'Book A',
          price: '150',
          total: '9.5',
          implied_probability: '0.4',
          last_updated: '2025-10-30',
        },
        { bookmaker: 'Book B', odds: 200, line: '10' },
        { name: null, odds: 'NaN' },
      ],
    } as any;

    const opp = mapRawOpportunity(raw);
    expect(opp.bookmakers).toBeDefined();
    expect(opp.bookmakers?.length).toBe(2);
    const first = opp.bookmakers![0];
    expect(first.name).toBe('Book A');
    expect(typeof first.odds).toBe('number');
    expect(first.odds).toBe(150);
    expect(typeof first.line).toBe('number');
    expect(first.line).toBeCloseTo(9.5);
  });

  it('applies clv overrides when provided', () => {
    const raw = { id: 'clv-1', player: 'P' } as any;
    const overrides = new Map<string, any>();
    overrides.set('clv-1', { clvPercent: 12.3, closingLine: 8 });

    const opp = mapRawOpportunity(raw, overrides);
    expect(opp.clvPercent).toBe(12.3);
    expect(opp.closingLine).toBe(8);
  });

  it('maps summary shapes with mixed keys', () => {
    const summary = {
      total: '42',
      avgConfidence: '7.5',
      maxEdge: 3,
      lastUpdated: '2025-10-30T12:00:00Z',
    } as any;

    const stats = mapSummaryToStats(summary);
    expect(stats.total_opportunities).toBe(42);
    expect(stats.avg_confidence).toBeCloseTo(7.5);
    expect(stats.max_edge).toBe(3);
    expect(typeof stats.last_updated).toBe('string');
  });

  it('normalizes trend direction values', () => {
    const raw = { id: 't-1', trend: 'increasing' } as any;
    const opp = mapRawOpportunity(raw);
    expect(opp.trend).toBe('up');
  });
});
