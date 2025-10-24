import {
  CategoryScale,
  ChartDataset,
  Chart as ChartJS,
  ChartOptions,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';

if (
  typeof (ChartJS as unknown as { register?: (...args: unknown[]) => void }).register === 'function'
) {
  ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);
}

export type BookmakerOddsPoint = {
  timestamp: string;
  bookmaker: string;
  odds: number;
};

export type MultiBookOddsChartProps = {
  data: BookmakerOddsPoint[];
  title?: string;
  height?: number;
  maxSeries?: number;
};

const bookmakerPalette = [
  '#0EA5E9',
  '#6366F1',
  '#22C55E',
  '#F97316',
  '#EC4899',
  '#8B5CF6',
  '#14B8A6',
  '#F59E0B',
  '#EF4444',
];

export type PreparedOddsSeries = {
  labels: string[];
  datasets: ChartDataset<'line', (number | null)[]>[];
};

export function buildMultiBookOddsDatasets(
  rawData: BookmakerOddsPoint[],
  maxSeries = 6
): PreparedOddsSeries {
  if (!Array.isArray(rawData) || rawData.length === 0) {
    return { labels: [], datasets: [] };
  }

  const sorted = rawData
    .slice()
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const labelMap = new Map<string, number>();
  const labels: string[] = [];

  sorted.forEach(point => {
    const label = formatLabelTimestamp(point.timestamp);
    if (!labelMap.has(label)) {
      labelMap.set(label, labels.length);
      labels.push(label);
    }
  });

  const bookmakerMap = new Map<string, (number | null)[]>();

  sorted.forEach(point => {
    const label = formatLabelTimestamp(point.timestamp);
    const labelIndex = labelMap.get(label) ?? labels.length - 1;
    const bookmakerKey = point.bookmaker || 'Unknown';
    if (!bookmakerMap.has(bookmakerKey)) {
      bookmakerMap.set(bookmakerKey, Array(labels.length).fill(null));
    }
    const targetSeries = bookmakerMap.get(bookmakerKey)!;
    targetSeries[labelIndex] = Number.isFinite(point.odds) ? Number(point.odds.toFixed(2)) : null;
  });

  bookmakerMap.forEach(series => {
    while (series.length < labels.length) {
      series.push(null);
    }
  });

  const datasets: ChartDataset<'line', (number | null)[]>[] = [];

  Array.from(bookmakerMap.entries())
    .slice(0, Math.max(1, maxSeries))
    .forEach(([bookmaker, oddsValues], index) => {
      datasets.push({
        label: bookmaker,
        data: oddsValues,
        borderColor: bookmakerPalette[index % bookmakerPalette.length],
        backgroundColor: `${bookmakerPalette[index % bookmakerPalette.length]}33`,
        tension: 0.25,
        pointRadius: 3,
        pointHoverRadius: 5,
        spanGaps: true,
        fill: false,
      });
    });

  return { labels, datasets };
}

function formatLabelTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }
  return `${date.getMonth() + 1}/${date.getDate()} ${date
    .getHours()
    .toString()
    .padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

const containerClass = 'w-full bg-white rounded-lg shadow-md border border-slate-100';

export const MultiBookOddsChart: React.FC<MultiBookOddsChartProps> = ({
  data,
  title = 'Bookmaker Odds Comparison',
  height = 320,
  maxSeries = 6,
}) => {
  const prepared = useMemo(() => buildMultiBookOddsDatasets(data, maxSeries), [data, maxSeries]);

  const options: ChartOptions<'line'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: { usePointStyle: true },
        },
        tooltip: {
          callbacks: {
            label(context) {
              const value = context.parsed.y;
              if (value == null || Number.isNaN(value)) return `${context.dataset.label}: --`;
              return `${context.dataset.label}: ${value > 0 ? '+' : ''}${value.toFixed(2)}`;
            },
          },
        },
      },
      scales: {
        y: {
          title: { display: true, text: 'Odds (American)' },
          ticks: { callback: value => `${value}` },
          grid: { color: 'rgba(148, 163, 184, 0.15)' },
        },
        x: {
          title: { display: true, text: 'Timestamp' },
          ticks: { autoSkip: true, maxTicksLimit: 8 },
          grid: { display: false },
        },
      },
    }),
    []
  );

  return (
    <div className={containerClass}>
      <div className='px-4 py-4 border-b border-slate-100'>
        <h3 className='text-base font-semibold text-slate-900'>{title}</h3>
        <p className='text-xs text-slate-500'>
          Aggregate comparison of bookmaker odds over recent updates.
        </p>
      </div>
      <div className='px-4 py-4' style={{ height }}>
        {prepared.datasets.length > 0 ? (
          <Line data={{ labels: prepared.labels, datasets: prepared.datasets }} options={options} />
        ) : (
          <div className='h-full flex items-center justify-center text-sm text-slate-500'>
            Insufficient odds data to visualize.
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiBookOddsChart;
