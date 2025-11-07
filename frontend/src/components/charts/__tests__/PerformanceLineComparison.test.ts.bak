jest.mock('react-chartjs-2', () => ({
  Line: () => null,
}));

import { buildMultiBookOddsDatasets } from '../../charts/MultiBookOddsChart';
import {
  buildPerformanceLineDatasets,
  computeMovingAverage,
  computePerformanceInsights,
  mergeSeriesVisibility,
} from '../../charts/PerformanceLineComparison';

describe('PerformanceLineComparison helpers', () => {
  it('computes moving average while ignoring null values', () => {
    const input = [10, 12, null, 14, 16, 18];
    const result = computeMovingAverage(input, 3);
    expect(result).toHaveLength(input.length);
    // First few values should blend available numbers
    expect(result[0]).toBeCloseTo(10);
    expect(result[1]).toBeCloseTo(11);
    // Null entries should not break the average
    expect(result[2]).toBeCloseTo(11);
    expect(result[5]).toBeCloseTo(16);
  });

  it('builds datasets with projection and moving average', () => {
    const datasets = buildPerformanceLineDatasets(
      [
        { date: '2024-01-01', actual: 20, line: 18, projection: 19, opponent: 'NYK' },
        { date: '2024-01-02', actual: 24, line: 19, projection: 20, opponent: 'BOS' },
        { date: '2024-01-03', actual: 23, line: 20, projection: 21, opponent: 'NYK' },
      ],
      'all',
      {
        showProjection: true,
        showMovingAverage: true,
        movingAverageWindow: 2,
        highlightOpponent: 'NYK',
      }
    );

    expect(datasets.labels).toHaveLength(3);
    datasets.labels.forEach(label => expect(typeof label).toBe('string'));
    expect(datasets.datasets).toHaveLength(4);
    const actualDataset = datasets.datasets[0];
    expect(actualDataset.data).toEqual([20, 24, 23]);
    const projectionDataset = datasets.datasets.find(ds => ds.label === 'Projection');
    expect(projectionDataset?.data).toEqual([19, 20, 21]);
    expect(datasets.points).toHaveLength(3);
    expect(datasets.points[0]).toMatchObject({ opponent: 'NYK' });
  });

  it('merges series visibility with stored preferences and feature flags', () => {
    const defaults = {
      actual: true,
      line: true,
      projection: true,
      average: true,
    };

    const stored = {
      actual: false,
      line: true,
      projection: false,
      average: true,
    };

    const mergedWithProjection = mergeSeriesVisibility(defaults, stored, {
      showProjection: true,
      showMovingAverage: true,
    });

    expect(mergedWithProjection).toEqual({
      actual: false,
      line: true,
      projection: false,
      average: true,
    });

    const mergedWithoutProjection = mergeSeriesVisibility(defaults, stored, {
      showProjection: false,
      showMovingAverage: false,
    });

    expect(mergedWithoutProjection).toEqual({
      actual: false,
      line: true,
      projection: false,
      average: false,
    });
  });

  it('computes performance insights for paired samples', () => {
    const insights = computePerformanceInsights([20, 24, 19, null, 18], [18, 20, 22, 21, null]);

    expect(insights.sampleSize).toBe(3);
    expect(insights.averageActual).toBeCloseTo(21);
    expect(insights.averageLine).toBeCloseTo(20);
    expect(insights.overHitRate).toBeCloseTo(66.7);
    expect(insights.underHitRate).toBeCloseTo(33.3);
    expect(insights.lastActual).toBeCloseTo(19);
    expect(insights.lastLine).toBeCloseTo(22);
    expect(insights.lastDelta).toBeCloseTo(-3);
  });
});

describe('MultiBookOddsChart helpers', () => {
  it('groups odds by bookmaker and timestamp', () => {
    const prepared = buildMultiBookOddsDatasets([
      { timestamp: '2024-01-01T00:00:00Z', bookmaker: 'A', odds: 120 },
      { timestamp: '2024-01-01T00:00:00Z', bookmaker: 'B', odds: 110 },
      { timestamp: '2024-01-01T00:05:00Z', bookmaker: 'A', odds: 118 },
      { timestamp: '2024-01-01T00:10:00Z', bookmaker: 'B', odds: 108 },
    ]);

    expect(prepared.labels.length).toBeGreaterThanOrEqual(2);
    expect(prepared.datasets.length).toBe(2);
    const bookmakerA = prepared.datasets.find(ds => ds.label === 'A');
    expect(bookmakerA?.data[0]).toBe(120);
    expect(bookmakerA?.data.some(value => value === 118)).toBe(true);
  });
});
