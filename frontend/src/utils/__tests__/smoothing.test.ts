import { movingAverage, exponentialMovingAverage } from '../smoothing';
import { PerformancePoint } from '../../components/charts/PlayerPerformanceChart';

describe('smoothing utils', () => {
  const pts: PerformancePoint[] = [
    { date: 'd1', actual: 10, line: 9, opponent: 'A' },
    { date: 'd2', actual: 12, line: 11, opponent: 'B' },
    { date: 'd3', actual: 14, line: 13, opponent: 'A' },
    { date: 'd4', actual: 16, line: 15, opponent: 'B' },
  ];

  test('movingAverage with window=2 computes averages', () => {
    const res = movingAverage(pts, 2);
    expect(res).toHaveLength(4);
    // first is same
    expect(res[0].actual).toBe(10);
    // second is avg of 10 and 12 = 11
    expect(res[1].actual).toBe(11);
    // third is avg of 12 and 14 = 13
    expect(res[2].actual).toBe(13);
    // fourth is avg of 14 and 16 = 15
    expect(res[3].actual).toBe(15);
  });

  test('exponentialMovingAverage with window=2 smooths progressively', () => {
    const res = exponentialMovingAverage(pts, 2);
    expect(res).toHaveLength(4);
    // alpha = 2/(2+1) = 0.666..., first value equals original
    expect(res[0].actual).toBe(10);
    // second: round(0.666*12 + 0.333*10) = round(8 + 3.333) = 11
    expect(res[1].actual).toBe(11);
    // third: round(0.666*14 + 0.333*11) = round(9.333 + 3.666) = 13
    expect(res[2].actual).toBe(13);
  });

  test('movingAverage handles window=1 and empty input', () => {
    expect(movingAverage([], 3)).toEqual([]);
    const single: PerformancePoint[] = [{ date: 'x', actual: 5, line: 4, opponent: 'Z' }];
    expect(movingAverage(single, 1)).toEqual(single);
  });

  test('exponentialMovingAverage handles window=1 and empty input', () => {
    expect(exponentialMovingAverage([], 3)).toEqual([]);
    const single: PerformancePoint[] = [{ date: 'x', actual: 5, line: 4, opponent: 'Z' }];
    expect(exponentialMovingAverage(single, 1)).toEqual(single);
  });
});
