import { mapPerformancePoints, PerformancePoint } from '../PlayerPerformanceChart';

describe('mapPerformancePoints', () => {
  test('maps points and respects lastN', () => {
    const pts: PerformancePoint[] = [
      { date: '2025-08-20T00:00:00.000Z', actual: 20, line: 18, opponent: 'A' },
      { date: '2025-08-21T00:00:00.000Z', actual: 25, line: 22, opponent: 'B' },
      { date: '2025-08-22T00:00:00.000Z', actual: 30, line: 28, opponent: 'A' },
    ];

    const all = mapPerformancePoints(pts);
    expect(all.points.length).toBe(3);
    expect(all.actual).toEqual([20,25,30]);
    expect(all.line).toEqual([18,22,28]);

    const last2 = mapPerformancePoints(pts, 2);
    expect(last2.points.length).toBe(2);
    expect(last2.actual).toEqual([25,30]);
  });
});
