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
import React, { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';

// Chart.js registration is guarded so Jest/lightweight environments without Canvas do not explode.
if (
  typeof (ChartJS as unknown as { register?: (...args: unknown[]) => void }).register === 'function'
) {
  ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);
}

export type PerformanceSeriesPoint = {
  date: string;
  actual: number;
  line: number;
  projection?: number | null;
  opponent?: string | null;
};

export type TimeframeValue = number | 'all';

export type TimeframeOption = {
  label: string;
  value: TimeframeValue;
};

export type ChartViewMode = 'absolute' | 'delta';

export type OpponentFilterValue = string | 'all';

export type PerformanceLineComparisonProps = {
  data: PerformanceSeriesPoint[];
  title?: string;
  timeframeValue?: TimeframeValue;
  timeframeOptions?: TimeframeOption[];
  onTimeframeChange?: (value: TimeframeValue) => void;
  showProjection?: boolean;
  showMovingAverage?: boolean;
  movingAverageWindow?: number;
  highlightOpponent?: string | null;
  height?: number;
  showHeader?: boolean;
  variant?: 'card' | 'embedded';
  enableSeriesToggles?: boolean;
  persistSeriesToggles?: boolean;
  seriesPersistenceKey?: string;
  enableDeltaView?: boolean;
  defaultViewMode?: ChartViewMode;
  enableOpponentFilter?: boolean;
  opponentFilterLabel?: string;
  opponentFilterValue?: OpponentFilterValue;
  onOpponentFilterChange?: (value: OpponentFilterValue) => void;
  defaultOpponentFilter?: OpponentFilterValue;
};

const defaultTimeframes: TimeframeOption[] = [
  { label: 'Last 5', value: 5 },
  { label: 'Last 10', value: 10 },
  { label: 'Last 20', value: 20 },
  { label: 'All', value: 'all' },
];

const defaultPalette = {
  actual: '#10B981',
  line: '#F97316',
  projection: '#6366F1',
  average: '#0EA5E9',
  point: '#0F172A',
  highlightPoint: '#B91C1C',
};

const DEFAULT_OPPONENT_FILTER: OpponentFilterValue = 'all';

type SeriesVisibility = {
  actual: boolean;
  line: boolean;
  projection: boolean;
  average: boolean;
};

type StoredFilters = {
  opponent?: OpponentFilterValue;
  timeframe?: TimeframeValue;
};

type StoredSeriesPreferences = {
  visibility?: Partial<SeriesVisibility>;
  viewMode?: ChartViewMode;
  filters?: StoredFilters;
};

const SERIES_STORAGE_PREFIX = 'a1betting:performance-line-series:';

const normalizeStorageKey = (rawKey: string) =>
  rawKey
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');

const buildSeriesStorageKey = (baseKey: string) => {
  const normalized = normalizeStorageKey(baseKey);
  return `${SERIES_STORAGE_PREFIX}${normalized || 'default'}`;
};

const canUseBrowserStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const loadSeriesPreferences = (storageKey: string): StoredSeriesPreferences | null => {
  if (!canUseBrowserStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed == null) return null;

    const candidate: StoredSeriesPreferences = {};

    const ensureVisibility = (value: unknown): Partial<SeriesVisibility> | null => {
      if (typeof value !== 'object' || value == null) return null;
      const visibilityValue = value as Record<string, unknown>;
      const visibility: Partial<SeriesVisibility> = {};

      if (typeof visibilityValue.actual === 'boolean') visibility.actual = visibilityValue.actual;
      if (typeof visibilityValue.line === 'boolean') visibility.line = visibilityValue.line;
      if (typeof visibilityValue.projection === 'boolean')
        visibility.projection = visibilityValue.projection;
      if (typeof visibilityValue.average === 'boolean')
        visibility.average = visibilityValue.average;

      return Object.keys(visibility).length > 0 ? visibility : null;
    };

    // Support legacy format where visibility booleans are stored at the root level
    const legacyVisibility = ensureVisibility(parsed);
    if (legacyVisibility) {
      candidate.visibility = legacyVisibility;
    }

    if (candidate.visibility == null && 'visibility' in parsed) {
      const structuredVisibility = ensureVisibility((parsed as Record<string, unknown>).visibility);
      if (structuredVisibility) {
        candidate.visibility = structuredVisibility;
      }
    }

    const potentialViewMode = (parsed as Record<string, unknown>).viewMode;
    if (potentialViewMode === 'absolute' || potentialViewMode === 'delta') {
      candidate.viewMode = potentialViewMode;
    }

    const rawFilters = (parsed as Record<string, unknown>).filters;
    if (typeof rawFilters === 'object' && rawFilters != null) {
      const filtersCandidate: StoredFilters = {};
      const filtersRecord = rawFilters as Record<string, unknown>;

      const opponentRaw = filtersRecord.opponent;
      if (typeof opponentRaw === 'string' && opponentRaw.trim().length > 0) {
        filtersCandidate.opponent = opponentRaw as OpponentFilterValue;
      }

      const timeframeRaw = filtersRecord.timeframe;
      if (
        timeframeRaw === 'all' ||
        (typeof timeframeRaw === 'number' && Number.isFinite(timeframeRaw) && timeframeRaw > 0)
      ) {
        filtersCandidate.timeframe = timeframeRaw as TimeframeValue;
      }

      if (Object.keys(filtersCandidate).length > 0) {
        candidate.filters = filtersCandidate;
      }
    }

    return Object.keys(candidate).length > 0 ? candidate : null;
  } catch (error) {
    console.warn('[PerformanceLineComparison] Failed to load chart preferences', error);
    return null;
  }
};

const saveSeriesPreferences = (
  storageKey: string,
  visibility: SeriesVisibility,
  viewMode: ChartViewMode,
  filters?: StoredFilters
) => {
  if (!canUseBrowserStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        visibility,
        viewMode,
        filters,
      })
    );
  } catch (error) {
    console.warn('[PerformanceLineComparison] Failed to persist chart preferences', error);
  }
};

export const mergeSeriesVisibility = (
  defaults: SeriesVisibility,
  stored: Partial<SeriesVisibility> | null,
  options: { showProjection: boolean; showMovingAverage: boolean }
): SeriesVisibility => {
  const { showProjection, showMovingAverage } = options;
  const nextVisibility: SeriesVisibility = {
    actual: stored?.actual ?? defaults.actual,
    line: stored?.line ?? defaults.line,
    projection: showProjection ? stored?.projection ?? defaults.projection : false,
    average: showMovingAverage ? stored?.average ?? defaults.average : false,
  };

  return nextVisibility;
};

export type PreparedPerformanceData = {
  labels: string[];
  datasets: ChartDataset<'line', (number | null)[]>[];
  points: PerformanceSeriesPoint[];
};

export type PerformanceInsights = {
  sampleSize: number;
  averageActual: number | null;
  averageLine: number | null;
  overHitRate: number | null;
  underHitRate: number | null;
  lastActual: number | null;
  lastLine: number | null;
  lastDelta: number | null;
};

export const computePerformanceInsights = (
  actualValues: Array<number | null>,
  lineValues: Array<number | null>
): PerformanceInsights => {
  const pairedSamples = actualValues
    .map((actual, index) => {
      const line = lineValues[index] ?? null;
      if (actual == null || line == null) {
        return null;
      }
      return { actual, line };
    })
    .filter((value): value is { actual: number; line: number } => value != null);

  if (pairedSamples.length === 0) {
    return {
      sampleSize: 0,
      averageActual: null,
      averageLine: null,
      overHitRate: null,
      underHitRate: null,
      lastActual: null,
      lastLine: null,
      lastDelta: null,
    };
  }

  let sumActual = 0;
  let sumLine = 0;
  let overHits = 0;
  let underHits = 0;

  pairedSamples.forEach(sample => {
    sumActual += sample.actual;
    sumLine += sample.line;
    if (sample.actual > sample.line) {
      overHits += 1;
    } else if (sample.actual < sample.line) {
      underHits += 1;
    }
  });

  const lastSample = pairedSamples[pairedSamples.length - 1];

  const averageActual = Number((sumActual / pairedSamples.length).toFixed(2));
  const averageLine = Number((sumLine / pairedSamples.length).toFixed(2));
  const overHitRate = Number(((overHits / pairedSamples.length) * 100).toFixed(1));
  const underHitRate = Number(((underHits / pairedSamples.length) * 100).toFixed(1));
  const lastDelta = Number((lastSample.actual - lastSample.line).toFixed(2));

  return {
    sampleSize: pairedSamples.length,
    averageActual,
    averageLine,
    overHitRate,
    underHitRate,
    lastActual: Number(lastSample.actual.toFixed(2)),
    lastLine: Number(lastSample.line.toFixed(2)),
    lastDelta,
  };
};

export function buildPerformanceLineDatasets(
  rawData: PerformanceSeriesPoint[],
  timeframe: TimeframeValue,
  opts: {
    showProjection: boolean;
    showMovingAverage: boolean;
    movingAverageWindow: number;
    highlightOpponent: string | null | undefined;
  }
): PreparedPerformanceData {
  const { showProjection, showMovingAverage, movingAverageWindow, highlightOpponent } = opts;
  if (!Array.isArray(rawData) || rawData.length === 0) {
    return { labels: [], datasets: [], points: [] };
  }

  const trimmed =
    timeframe === 'all' || typeof timeframe !== 'number' || timeframe <= 0
      ? rawData.slice()
      : rawData.slice(-Math.max(1, timeframe));

  const formatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
  const labels = trimmed.map(entry => {
    const date = new Date(entry.date);
    return Number.isNaN(date.getTime()) ? entry.date : formatter.format(date);
  });

  const actualValues = trimmed.map(entry => (Number.isFinite(entry.actual) ? entry.actual : null));
  const lineValues = trimmed.map(entry => (Number.isFinite(entry.line) ? entry.line : null));
  const projectionValues = trimmed.map(entry =>
    Number.isFinite(entry.projection ?? undefined) ? (entry.projection as number) : null
  );

  const movingAverageValues = showMovingAverage
    ? computeMovingAverage(actualValues, Math.max(1, movingAverageWindow))
    : [];

  const basePointColors = trimmed.map(entry =>
    highlightOpponent && entry.opponent === highlightOpponent
      ? defaultPalette.highlightPoint
      : defaultPalette.point
  );

  const datasets: ChartDataset<'line', (number | null)[]>[] = [
    {
      label: 'Actual',
      data: actualValues,
      borderColor: defaultPalette.actual,
      backgroundColor: defaultPalette.actual,
      tension: 0.35,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: basePointColors,
      pointBorderColor: defaultPalette.actual,
      fill: {
        target: 'origin',
        above: 'rgba(16, 185, 129, 0.15)',
        below: 'rgba(248, 113, 113, 0.12)',
      },
    },
    {
      label: 'Line',
      data: lineValues,
      borderColor: defaultPalette.line,
      backgroundColor: defaultPalette.line,
      borderDash: [6, 4],
      tension: 0.2,
      pointRadius: 3,
      pointHoverRadius: 5,
      fill: false,
    },
  ];

  if (showProjection && projectionValues.some(value => value !== null)) {
    datasets.push({
      label: 'Projection',
      data: projectionValues,
      borderColor: defaultPalette.projection,
      backgroundColor: defaultPalette.projection,
      borderDash: [2, 6],
      tension: 0.2,
      pointRadius: 3,
      pointHoverRadius: 5,
      fill: false,
    });
  }

  if (showMovingAverage && movingAverageValues.length > 0) {
    datasets.push({
      label: `${Math.max(1, movingAverageWindow)}-Game Avg`,
      data: movingAverageValues,
      borderColor: defaultPalette.average,
      backgroundColor: defaultPalette.average,
      borderDash: [8, 4],
      tension: 0.25,
      pointRadius: 0,
      spanGaps: true,
      fill: false,
    });
  }

  return { labels, datasets, points: trimmed };
}

export function computeMovingAverage(
  values: Array<number | null>,
  windowSize: number
): (number | null)[] {
  if (!values.length || windowSize <= 1) {
    return values.map(value => (value == null ? null : value));
  }

  const safeWindow = Math.max(2, windowSize);
  const result: (number | null)[] = values.map(() => null);

  let rollingSum = 0;
  let rollingCount = 0;

  values.forEach((value, index) => {
    if (value != null) {
      rollingSum += value;
      rollingCount += 1;
    }

    if (index >= safeWindow) {
      const exitValue = values[index - safeWindow];
      if (exitValue != null) {
        rollingSum -= exitValue;
        rollingCount -= 1;
      }
    }

    if (rollingCount > 0) {
      result[index] = Number((rollingSum / rollingCount).toFixed(2));
    }
  });

  return result;
}

const containerClass = 'w-full bg-white rounded-lg shadow-md border border-slate-100';

const toolbarButtonClass = (isActive: boolean) =>
  `px-3 py-1 text-xs font-medium rounded-md transition-colors duration-150 border ${
    isActive
      ? 'bg-slate-900 text-white border-slate-900 shadow'
      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
  }`;

export const PerformanceLineComparison: React.FC<PerformanceLineComparisonProps> = ({
  data,
  title = 'Performance vs Betting Line',
  timeframeValue = 'all',
  timeframeOptions = defaultTimeframes,
  onTimeframeChange,
  showProjection = true,
  showMovingAverage = true,
  movingAverageWindow = 5,
  highlightOpponent = null,
  height = 360,
  showHeader = true,
  variant = 'card',
  enableSeriesToggles = false,
  persistSeriesToggles = false,
  seriesPersistenceKey,
  enableDeltaView = false,
  defaultViewMode = 'absolute',
  enableOpponentFilter = false,
  opponentFilterLabel = 'Opponent',
  opponentFilterValue,
  onOpponentFilterChange,
  defaultOpponentFilter = DEFAULT_OPPONENT_FILTER,
}) => {
  const storageKey = persistSeriesToggles
    ? buildSeriesStorageKey(seriesPersistenceKey ?? title ?? 'default')
    : null;

  const defaultVisibility: SeriesVisibility = {
    actual: true,
    line: true,
    projection: Boolean(showProjection),
    average: Boolean(showMovingAverage),
  };

  const storedPreferences = useMemo(() => {
    if (!persistSeriesToggles || !storageKey) {
      return null;
    }
    return loadSeriesPreferences(storageKey);
  }, [persistSeriesToggles, storageKey]);

  const [seriesVisibility, setSeriesVisibility] = useState<SeriesVisibility>(() =>
    mergeSeriesVisibility(defaultVisibility, storedPreferences?.visibility ?? null, {
      showProjection,
      showMovingAverage,
    })
  );

  const [viewMode, setViewMode] = useState<ChartViewMode>(() => {
    if (!enableDeltaView) {
      return 'absolute';
    }

    if (storedPreferences?.viewMode && storedPreferences.viewMode === 'delta') {
      return 'delta';
    }

    return defaultViewMode === 'delta' ? 'delta' : 'absolute';
  });

  const isTimeframeControlled = typeof onTimeframeChange === 'function';
  const [internalTimeframe, setInternalTimeframe] = useState<TimeframeValue>(() => {
    if (storedPreferences?.filters?.timeframe) {
      return storedPreferences.filters.timeframe;
    }
    return timeframeValue;
  });

  useEffect(() => {
    if (isTimeframeControlled) {
      setInternalTimeframe(timeframeValue);
    }
  }, [isTimeframeControlled, timeframeValue]);

  const effectiveTimeframe = isTimeframeControlled ? timeframeValue : internalTimeframe;

  const isOpponentControlled = typeof opponentFilterValue !== 'undefined';
  const [internalOpponent, setInternalOpponent] = useState<OpponentFilterValue>(() => {
    if (storedPreferences?.filters?.opponent) {
      return storedPreferences.filters.opponent;
    }
    if (defaultOpponentFilter && typeof defaultOpponentFilter === 'string') {
      return defaultOpponentFilter;
    }
    return DEFAULT_OPPONENT_FILTER;
  });

  useEffect(() => {
    if (!enableOpponentFilter) {
      return;
    }
    if (isOpponentControlled) {
      setInternalOpponent(opponentFilterValue ?? DEFAULT_OPPONENT_FILTER);
    }
  }, [enableOpponentFilter, isOpponentControlled, opponentFilterValue]);

  const opponentOptions = useMemo(() => {
    if (!enableOpponentFilter) {
      return [] as string[];
    }
    const unique = new Set<string>();
    data.forEach(point => {
      if (point.opponent) {
        unique.add(point.opponent);
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [data, enableOpponentFilter]);

  useEffect(() => {
    if (!enableOpponentFilter || isOpponentControlled) {
      return;
    }
    if (internalOpponent === DEFAULT_OPPONENT_FILTER) {
      return;
    }
    if (!opponentOptions.includes(internalOpponent)) {
      setInternalOpponent(DEFAULT_OPPONENT_FILTER);
    }
  }, [enableOpponentFilter, isOpponentControlled, opponentOptions, internalOpponent]);

  const resolvedOpponent = enableOpponentFilter
    ? isOpponentControlled
      ? opponentFilterValue ?? DEFAULT_OPPONENT_FILTER
      : internalOpponent
    : DEFAULT_OPPONENT_FILTER;

  const sanitizedOpponent: OpponentFilterValue =
    !enableOpponentFilter || resolvedOpponent === DEFAULT_OPPONENT_FILTER
      ? DEFAULT_OPPONENT_FILTER
      : opponentOptions.includes(resolvedOpponent)
      ? resolvedOpponent
      : DEFAULT_OPPONENT_FILTER;

  useEffect(() => {
    if (!enableOpponentFilter || isOpponentControlled) {
      return;
    }
    if (internalOpponent !== sanitizedOpponent) {
      setInternalOpponent(sanitizedOpponent);
    }
  }, [enableOpponentFilter, isOpponentControlled, sanitizedOpponent, internalOpponent]);

  const filteredData = useMemo(() => {
    if (!enableOpponentFilter || sanitizedOpponent === DEFAULT_OPPONENT_FILTER) {
      return data;
    }
    return data.filter(point => point.opponent === sanitizedOpponent);
  }, [data, enableOpponentFilter, sanitizedOpponent]);

  const computedHighlight =
    highlightOpponent ??
    (enableOpponentFilter && sanitizedOpponent !== DEFAULT_OPPONENT_FILTER
      ? sanitizedOpponent
      : null);

  const prepared = useMemo(
    () =>
      buildPerformanceLineDatasets(filteredData, effectiveTimeframe, {
        showProjection,
        showMovingAverage,
        movingAverageWindow,
        highlightOpponent: computedHighlight,
      }),
    [
      filteredData,
      effectiveTimeframe,
      showProjection,
      showMovingAverage,
      movingAverageWindow,
      computedHighlight,
    ]
  );

  const handleTimeframeSelect = (value: TimeframeValue) => {
    setInternalTimeframe(value);
    onTimeframeChange?.(value);
  };

  const handleOpponentSelect = (value: OpponentFilterValue) => {
    if (!enableOpponentFilter) {
      return;
    }
    const currentValue = isOpponentControlled
      ? opponentFilterValue ?? DEFAULT_OPPONENT_FILTER
      : internalOpponent;
    if (value === currentValue) {
      return;
    }
    setInternalOpponent(value);
    onOpponentFilterChange?.(value);
  };

  useEffect(() => {
    const stored = persistSeriesToggles && storageKey ? loadSeriesPreferences(storageKey) : null;

    setSeriesVisibility(prev => {
      const merged = mergeSeriesVisibility(
        {
          actual: prev.actual ?? true,
          line: prev.line ?? true,
          projection: Boolean(showProjection && (prev.projection ?? true)),
          average: Boolean(showMovingAverage && (prev.average ?? true)),
        },
        stored?.visibility ?? null,
        { showProjection, showMovingAverage }
      );

      if (
        merged.actual === prev.actual &&
        merged.line === prev.line &&
        merged.projection === prev.projection &&
        merged.average === prev.average
      ) {
        return prev;
      }

      return merged;
    });
  }, [persistSeriesToggles, storageKey, showProjection, showMovingAverage]);

  useEffect(() => {
    if (!enableDeltaView && viewMode !== 'absolute') {
      setViewMode('absolute');
      return;
    }

    if (!persistSeriesToggles || !storageKey || !enableDeltaView) {
      return;
    }

    const stored = loadSeriesPreferences(storageKey);
    if (stored?.viewMode && stored.viewMode !== viewMode) {
      setViewMode(stored.viewMode);
    }
  }, [enableDeltaView, persistSeriesToggles, storageKey, viewMode]);

  const filtersForPersistence = useMemo<StoredFilters | undefined>(() => {
    if (!persistSeriesToggles) {
      return undefined;
    }
    const filters: StoredFilters = {};
    if (enableOpponentFilter) {
      filters.opponent = sanitizedOpponent;
    }
    if (!isTimeframeControlled) {
      filters.timeframe = internalTimeframe;
    }
    return Object.keys(filters).length > 0 ? filters : undefined;
  }, [
    enableOpponentFilter,
    internalTimeframe,
    isTimeframeControlled,
    persistSeriesToggles,
    sanitizedOpponent,
  ]);

  useEffect(() => {
    if (!persistSeriesToggles || !storageKey) {
      return;
    }

    saveSeriesPreferences(storageKey, seriesVisibility, viewMode, filtersForPersistence);
  }, [filtersForPersistence, persistSeriesToggles, seriesVisibility, storageKey, viewMode]);

  const datasetsForChart = useMemo(() => {
    if (viewMode === 'delta') {
      const actualDataset = prepared.datasets.find(dataset => dataset.label === 'Actual');
      const lineDataset = prepared.datasets.find(dataset => dataset.label === 'Line');

      if (!actualDataset || !lineDataset) {
        return [] as ChartDataset<'line', (number | null)[]>[];
      }

      const actualData = (actualDataset.data as Array<number | null>) ?? [];
      const lineData = (lineDataset.data as Array<number | null>) ?? [];

      const deltaData = actualData.map((actualValue, index) => {
        const lineValue = lineData[index];
        if (actualValue == null || lineValue == null) {
          return null;
        }
        return Number((actualValue - lineValue).toFixed(2));
      });

      const zeroLine = deltaData.map(value => (value == null ? null : 0));

      return [
        {
          label: 'Actual - Line',
          data: deltaData,
          borderColor: defaultPalette.actual,
          backgroundColor: defaultPalette.actual,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: {
            target: 'origin',
            above: 'rgba(16, 185, 129, 0.18)',
            below: 'rgba(239, 68, 68, 0.22)',
          },
        },
        {
          label: 'Zero Baseline',
          data: zeroLine,
          borderColor: defaultPalette.line,
          borderDash: [6, 4],
          tension: 0,
          pointRadius: 0,
          fill: false,
        },
      ] as ChartDataset<'line', (number | null)[]>[];
    }

    return prepared.datasets.filter(dataset => {
      const label = dataset.label ?? '';
      if (label === 'Actual') return seriesVisibility.actual;
      if (label === 'Line') return seriesVisibility.line;
      if (label === 'Projection') return seriesVisibility.projection;
      if (label.includes('Avg')) return seriesVisibility.average;
      return true;
    });
  }, [prepared.datasets, seriesVisibility, viewMode]);

  const insights = useMemo(() => {
    const actualDataset = prepared.datasets.find(dataset => dataset.label === 'Actual');
    const lineDataset = prepared.datasets.find(dataset => dataset.label === 'Line');
    return computePerformanceInsights(
      (actualDataset?.data as Array<number | null>) ?? [],
      (lineDataset?.data as Array<number | null>) ?? []
    );
  }, [prepared.datasets]);

  const chartPoints = prepared.points;

  const options: ChartOptions<'line'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label(context) {
              const value = context.parsed.y;
              if (value == null || Number.isNaN(value)) return `${context.dataset.label}: --`;
              if (viewMode === 'delta' && context.dataset.label === 'Actual - Line') {
                return `Δ (Actual - Line): ${value.toFixed(2)}`;
              }
              return `${context.dataset.label}: ${value.toFixed(2)}`;
            },
            afterLabel(context) {
              const point = chartPoints[context.dataIndex];
              const opponent = point?.opponent;
              if (viewMode === 'delta') {
                if (point) {
                  const actualValue = Number.isFinite(point.actual)
                    ? point.actual.toFixed(2)
                    : '--';
                  const lineValue = Number.isFinite(point.line) ? point.line.toFixed(2) : '--';
                  return [
                    `Actual: ${actualValue}`,
                    `Line: ${lineValue}`,
                    opponent ? `vs ${opponent}` : undefined,
                  ]
                    .filter(Boolean)
                    .join('\n');
                }
              }
              return opponent ? `vs ${opponent}` : undefined;
            },
          },
        },
      },
      scales: {
        y: {
          title: {
            display: true,
            text: viewMode === 'delta' ? 'Δ (Actual - Line)' : 'Stat Value',
          },
          ticks: { precision: 0 },
          grid: { color: 'rgba(148, 163, 184, 0.15)' },
        },
        x: {
          grid: { display: false },
        },
      },
    }),
    [chartPoints, viewMode]
  );

  const containerClasses = variant === 'card' ? containerClass : 'w-full';
  const bodyPaddingClass = variant === 'card' ? 'px-4 py-4' : 'py-2';
  const headerPaddingClass = variant === 'card' ? 'px-4 py-4 border-b border-slate-100' : 'pb-2';

  const renderSeriesToggle = (
    key: keyof typeof seriesVisibility,
    label: string,
    disabled = false
  ) => {
    const isActive = seriesVisibility[key];
    return (
      <button
        key={label}
        type='button'
        disabled={disabled}
        className={
          toolbarButtonClass(isActive) + (disabled ? ' opacity-60 cursor-not-allowed' : '')
        }
        onClick={() => {
          if (disabled) return;
          setSeriesVisibility(prev => ({
            ...prev,
            [key]: !prev[key],
          }));
        }}
      >
        {label}
      </button>
    );
  };

  const canToggleProjection =
    showProjection && prepared.datasets.some(ds => ds.label === 'Projection');
  const canToggleAverage =
    showMovingAverage && prepared.datasets.some(ds => (ds.label ?? '').includes('Avg'));

  const hasVisibleDatasets = datasetsForChart.length > 0;

  return (
    <div className={containerClasses}>
      {showHeader && (
        <div
          className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${headerPaddingClass}`}
        >
          <div>
            <h3 className='text-base font-semibold text-slate-900'>{title}</h3>
            <p className='text-xs text-slate-500'>
              Interactive view of actual results compared to betting lines and projections.
            </p>
          </div>
          <div className='flex flex-col items-start gap-2 md:items-end'>
            {timeframeOptions.length > 0 && (
              <div className='flex items-center gap-2 flex-wrap justify-end'>
                {timeframeOptions.map(option => (
                  <button
                    key={option.label}
                    className={toolbarButtonClass(option.value === effectiveTimeframe)}
                    onClick={() => handleTimeframeSelect(option.value)}
                    type='button'
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
            {enableOpponentFilter && (opponentOptions.length > 0 || enableOpponentFilter) && (
              <div className='flex items-center gap-2 flex-wrap justify-end text-xs text-slate-500'>
                <label className='font-medium text-slate-600'>{opponentFilterLabel}:</label>
                <select
                  value={sanitizedOpponent}
                  onChange={event =>
                    handleOpponentSelect(event.target.value as OpponentFilterValue)
                  }
                  className='text-xs border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-slate-200'
                >
                  <option value={DEFAULT_OPPONENT_FILTER}>All</option>
                  {opponentOptions.map(opponent => (
                    <option key={opponent} value={opponent}>
                      {opponent}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {(enableDeltaView || (enableSeriesToggles && viewMode === 'absolute')) && (
              <div className='flex items-center gap-2 flex-wrap justify-end'>
                {enableDeltaView && (
                  <div className='inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm'>
                    <button
                      type='button'
                      className={toolbarButtonClass(viewMode === 'absolute')}
                      onClick={() => setViewMode('absolute')}
                    >
                      Actual vs Line
                    </button>
                    <button
                      type='button'
                      className={toolbarButtonClass(viewMode === 'delta')}
                      onClick={() => setViewMode('delta')}
                    >
                      Δ View
                    </button>
                  </div>
                )}
                {enableSeriesToggles && viewMode === 'absolute' && (
                  <div className='flex items-center gap-2 flex-wrap justify-end'>
                    {renderSeriesToggle('actual', 'Actual')}
                    {renderSeriesToggle('line', 'Line')}
                    {canToggleProjection && renderSeriesToggle('projection', 'Projection')}
                    {canToggleAverage &&
                      renderSeriesToggle('average', `${Math.max(1, movingAverageWindow)}-Game Avg`)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {!showHeader &&
        (enableSeriesToggles ||
          enableDeltaView ||
          timeframeOptions.length > 0 ||
          enableOpponentFilter) && (
          <div
            className={`${
              variant === 'card' ? 'px-4 pt-3' : 'pb-2'
            } flex items-center gap-2 flex-wrap justify-end`}
          >
            {timeframeOptions.length > 0 && (
              <div className='flex items-center gap-2 flex-wrap justify-end'>
                {timeframeOptions.map(option => (
                  <button
                    key={option.label}
                    className={toolbarButtonClass(option.value === effectiveTimeframe)}
                    onClick={() => handleTimeframeSelect(option.value)}
                    type='button'
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
            {enableOpponentFilter && (
              <div className='flex items-center gap-2 text-xs text-slate-500'>
                <label className='font-medium text-slate-600'>{opponentFilterLabel}:</label>
                <select
                  value={sanitizedOpponent}
                  onChange={event =>
                    handleOpponentSelect(event.target.value as OpponentFilterValue)
                  }
                  className='text-xs border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-slate-200'
                >
                  <option value={DEFAULT_OPPONENT_FILTER}>All</option>
                  {opponentOptions.map(opponent => (
                    <option key={opponent} value={opponent}>
                      {opponent}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {enableDeltaView && (
              <div className='inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm'>
                <button
                  type='button'
                  className={toolbarButtonClass(viewMode === 'absolute')}
                  onClick={() => setViewMode('absolute')}
                >
                  Actual vs Line
                </button>
                <button
                  type='button'
                  className={toolbarButtonClass(viewMode === 'delta')}
                  onClick={() => setViewMode('delta')}
                >
                  Δ View
                </button>
              </div>
            )}
            {enableSeriesToggles && viewMode === 'absolute' && (
              <>
                {renderSeriesToggle('actual', 'Actual')}
                {renderSeriesToggle('line', 'Line')}
                {canToggleProjection && renderSeriesToggle('projection', 'Projection')}
                {canToggleAverage &&
                  renderSeriesToggle('average', `${Math.max(1, movingAverageWindow)}-Game Avg`)}
              </>
            )}
          </div>
        )}
      <div className={`${bodyPaddingClass}`} style={{ height }}>
        {hasVisibleDatasets && prepared.labels.length > 0 ? (
          <Line data={{ labels: prepared.labels, datasets: datasetsForChart }} options={options} />
        ) : prepared.datasets.length > 0 ? (
          <div className='h-full flex items-center justify-center text-sm text-slate-500'>
            Toggle at least one series to visualize the chart.
          </div>
        ) : (
          <div className='h-full flex items-center justify-center text-sm text-slate-500'>
            No performance data available for the selected filters.
          </div>
        )}
      </div>
      {insights.sampleSize > 0 && (
        <div
          className={`${
            variant === 'card' ? 'px-4 pb-4 pt-2 border-t border-slate-100' : 'pt-3'
          } grid gap-2 text-[11px] text-slate-600 sm:grid-cols-2 lg:grid-cols-4`}
        >
          <div className='flex items-center justify-between rounded-md bg-slate-50 px-3 py-2'>
            <span className='uppercase tracking-wide font-semibold text-slate-500'>Avg Actual</span>
            <span className='text-sm font-semibold text-slate-900'>
              {insights.averageActual != null ? insights.averageActual.toFixed(2) : '--'}
            </span>
          </div>
          <div className='flex items-center justify-between rounded-md bg-slate-50 px-3 py-2'>
            <span className='uppercase tracking-wide font-semibold text-slate-500'>Avg Line</span>
            <span className='text-sm font-semibold text-slate-900'>
              {insights.averageLine != null ? insights.averageLine.toFixed(2) : '--'}
            </span>
          </div>
          <div className='flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2 text-emerald-700'>
            <span className='uppercase tracking-wide font-semibold'>Over Hit%</span>
            <span className='text-sm font-semibold'>
              {insights.overHitRate != null ? `${insights.overHitRate.toFixed(1)}%` : '--'}
            </span>
          </div>
          <div className='flex items-center justify-between rounded-md bg-sky-50 px-3 py-2 text-sky-700'>
            <span className='uppercase tracking-wide font-semibold'>Under Hit%</span>
            <span className='text-sm font-semibold'>
              {insights.underHitRate != null ? `${insights.underHitRate.toFixed(1)}%` : '--'}
            </span>
          </div>
          <div className='flex items-center justify-between rounded-md bg-indigo-50 px-3 py-2 text-indigo-700 sm:col-span-2 lg:col-span-1'>
            <span className='uppercase tracking-wide font-semibold'>Last Δ</span>
            <span
              className={`text-sm font-semibold ${
                insights.lastDelta != null && insights.lastDelta >= 0
                  ? 'text-emerald-700'
                  : 'text-rose-600'
              }`}
            >
              {insights.lastDelta != null
                ? `${insights.lastDelta >= 0 ? '+' : ''}${insights.lastDelta.toFixed(2)}`
                : '--'}
            </span>
          </div>
          <div className='flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-slate-700 sm:col-span-2 lg:col-span-1'>
            <span className='uppercase tracking-wide font-semibold'>Samples</span>
            <span className='text-sm font-semibold'>{insights.sampleSize}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceLineComparison;
