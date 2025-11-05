import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface ChartDataPoint {
  x: number;
  y: number;
  timestamp?: Date;
  label?: string;
  metadata?: Record<string, unknown>;
}

interface ChartConfidenceBand {
  level: number;
  upperBound: ChartDataPoint[];
  lowerBound: ChartDataPoint[];
  color?: string;
  opacity?: number;
  pattern?: 'solid' | 'dotted' | 'dashed' | 'gradient';
}

interface ChartSeries {
  id: string;
  name: string;
  data: ChartDataPoint[];
  type: 'line' | 'area' | 'scatter' | 'spline';
  color: string;
  strokeWidth?: number;
  opacity?: number;
  visible?: boolean;
}

interface ChartAnnotation {
  id: string;
  type: 'vertical' | 'horizontal' | 'point' | 'range';
  value: number | { start: number; end: number };
  label?: string;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
}

interface ChartConfig {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
  backgroundColor?: string;
  gridColor?: string;
  textColor?: string;
  showGrid: boolean;
  showAxes: boolean;
  showLegend: boolean;
  showTooltip: boolean;
  animationDuration: number;
  responsive: boolean;
}

interface ConfidenceBandChartProps {
  series: ChartSeries[];
  confidenceBands: ChartConfidenceBand[];
  annotations?: ChartAnnotation[];
  config?: Partial<ChartConfig>;
  variant?: 'default' | 'cyber' | 'financial' | 'scientific' | 'minimal';
  theme?: 'light' | 'dark' | 'auto';
  xAxisLabel?: string;
  yAxisLabel?: string;
  title?: string;
  subtitle?: string;
  timeFormat?: 'auto' | 'short' | 'long' | 'relative';
  precision?: number;
  className?: string;
  onPointClick?: (point: ChartDataPoint, series: ChartSeries) => void;
  onBandHover?: (band: ChartConfidenceBand, point: ChartDataPoint) => void;
  onZoom?: (range: { xMin: number; xMax: number; yMin: number; yMax: number }) => void;
  onExport?: (format: 'png' | 'svg' | 'pdf' | 'csv') => void;
}

type ChartScales = {
  xScale: (value: number) => number;
  yScale: (value: number) => number;
  invertX: (pixel: number) => number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  width: number;
  height: number;
};

type HoverState = {
  point: ChartDataPoint;
  series: ChartSeries;
  position: { x: number; y: number };
};

type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  grid: string;
  accent: string;
};

type BandHover = {
  band: ChartConfidenceBand;
  point: ChartDataPoint;
};

const EXPORT_FORMATS: Array<'svg' | 'png' | 'pdf' | 'csv'> = ['svg', 'png', 'pdf', 'csv'];
const MIN_CHART_WIDTH = 320;
const POINT_HIT_RADIUS = 18;

const DEFAULT_CONFIG: ChartConfig = {
  width: 800,
  height: 400,
  padding: { top: 20, right: 20, bottom: 60, left: 60 },
  showGrid: true,
  showAxes: true,
  showLegend: true,
  showTooltip: true,
  animationDuration: 300,
  responsive: true,
};

const THEME_PRESETS: Record<'light' | 'dark' | 'cyber', ThemeColors> = {
  light: {
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1f2937',
    grid: '#e5e7eb',
    accent: '#3b82f6',
  },
  dark: {
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    grid: '#374151',
    accent: '#06b6d4',
  },
  cyber: {
    background: '#0f172a',
    surface: '#1e293b',
    text: '#06b6d4',
    grid: '#3f3f46',
    accent: '#a855f7',
  },
};

const VARIANT_STYLES: Record<NonNullable<ConfidenceBandChartProps['variant']>, string> = {
  default: 'rounded-xl border border-slate-200 bg-white shadow-sm',
  cyber:
    'rounded-xl border border-cyan-500/40 bg-slate-950/80 shadow-2xl shadow-cyan-500/30 backdrop-blur',
  financial: 'rounded-xl border border-emerald-500/40 bg-slate-900/95 shadow-xl',
  scientific: 'rounded-xl border border-blue-200 bg-white shadow-sm',
  minimal: 'rounded-xl border border-slate-200 bg-slate-50 shadow-sm',
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getThemeColors = (
  variant: ConfidenceBandChartProps['variant'],
  theme: ConfidenceBandChartProps['theme']
): ThemeColors => {
  if (variant === 'cyber') {
    return THEME_PRESETS.cyber;
  }

  if (theme === 'dark') {
    return THEME_PRESETS.dark;
  }

  return THEME_PRESETS.light;
};

const mergeConfig = (config?: Partial<ChartConfig>): ChartConfig => {
  const padding = { ...DEFAULT_CONFIG.padding, ...config?.padding };
  return {
    ...DEFAULT_CONFIG,
    ...config,
    padding,
  };
};

const collectAllPoints = (
  series: ChartSeries[],
  bands: ChartConfidenceBand[]
): ChartDataPoint[] => {
  const seriesPoints = series.flatMap(current => current.data);
  const bandPoints = bands.flatMap(band => [...band.upperBound, ...band.lowerBound]);
  return [...seriesPoints, ...bandPoints];
};

const calculateChartScales = (
  series: ChartSeries[],
  bands: ChartConfidenceBand[],
  config: ChartConfig
): ChartScales => {
  const points = collectAllPoints(series, bands);
  const defaultWidth = Math.max(1, config.width - config.padding.left - config.padding.right);
  const defaultHeight = Math.max(1, config.height - config.padding.top - config.padding.bottom);

  if (points.length === 0) {
    return {
      xScale: () => config.padding.left,
      yScale: () => config.height - config.padding.bottom,
      invertX: () => 0,
      xMin: 0,
      xMax: 1,
      yMin: 0,
      yMax: 1,
      width: defaultWidth,
      height: defaultHeight,
    };
  }

  const xValues = points.map(point => point.x);
  const yValues = points.map(point => point.y);

  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);

  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  const width = defaultWidth;
  const height = defaultHeight;

  const xScale = (value: number) => config.padding.left + ((value - xMin) / xRange) * width;
  const yScale = (value: number) =>
    config.height - config.padding.bottom - ((value - yMin) / yRange) * height;

  const invertX = (pixel: number) => xMin + ((pixel - config.padding.left) / width) * xRange;

  return {
    xScale,
    yScale,
    invertX,
    xMin,
    xMax,
    yMin,
    yMax,
    width,
    height,
  };
};

const formatAxisValue = (value: number, precision: number): string => {
  const absolute = Math.abs(value);
  if (absolute >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`;
  }
  if (absolute >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  }
  if (absolute >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }
  return value.toFixed(precision);
};

const createLinePath = (
  points: ChartDataPoint[],
  xScale: (value: number) => number,
  yScale: (value: number) => number
): string => {
  if (points.length === 0) {
    return '';
  }

  return points
    .map((point, index) => {
      const x = xScale(point.x);
      const y = yScale(point.y);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');
};

const createAreaPath = (
  points: ChartDataPoint[],
  xScale: (value: number) => number,
  yScale: (value: number) => number,
  baseline: number
): string => {
  if (points.length === 0) {
    return '';
  }

  const linePath = createLinePath(points, xScale, yScale);
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];

  const lastX = xScale(lastPoint.x);
  const firstX = xScale(firstPoint.x);

  return `${linePath} L ${lastX} ${baseline} L ${firstX} ${baseline} Z`;
};

const createBandPath = (
  upper: ChartDataPoint[],
  lower: ChartDataPoint[],
  xScale: (value: number) => number,
  yScale: (value: number) => number
): string => {
  if (upper.length === 0 || lower.length === 0) {
    return '';
  }

  const upperPath = upper
    .map((point, index) => {
      const x = xScale(point.x);
      const y = yScale(point.y);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  const lowerPath = [...lower]
    .reverse()
    .map(point => `L ${xScale(point.x)} ${yScale(point.y)}`)
    .join(' ');

  return `${upperPath} ${lowerPath} Z`;
};

const generateTicks = (min: number, max: number, count: number): number[] => {
  if (!Number.isFinite(min) || !Number.isFinite(max) || count <= 1) {
    return [min];
  }

  if (min === max) {
    return [min];
  }

  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, index) => min + step * index);
};

const findClosestPointByX = (points: ChartDataPoint[], targetX: number): ChartDataPoint | null => {
  if (points.length === 0) {
    return null;
  }

  let closest = points[0];
  let smallestDifference = Math.abs(points[0].x - targetX);

  for (let index = 1; index < points.length; index += 1) {
    const difference = Math.abs(points[index].x - targetX);
    if (difference < smallestDifference) {
      closest = points[index];
      smallestDifference = difference;
    }
  }

  return closest;
};

const findNearestPoint = (
  x: number,
  y: number,
  series: ChartSeries[],
  scales: ChartScales
): HoverState | null => {
  let nearest: HoverState | null = null;
  let shortestDistance = Number.POSITIVE_INFINITY;

  series.forEach(currentSeries => {
    currentSeries.data.forEach(point => {
      const pointX = scales.xScale(point.x);
      const pointY = scales.yScale(point.y);
      const distance = Math.hypot(x - pointX, y - pointY);

      if (distance <= POINT_HIT_RADIUS && distance < shortestDistance) {
        nearest = {
          point,
          series: currentSeries,
          position: { x, y },
        };
        shortestDistance = distance;
      }
    });
  });

  return nearest;
};

const findBandHover = (
  x: number,
  y: number,
  bands: ChartConfidenceBand[],
  scales: ChartScales
): BandHover | null => {
  const xValue = scales.invertX(x);
  let currentMatch: BandHover | null = null;

  bands.forEach(band => {
    if (!band.upperBound.length || !band.lowerBound.length) {
      return;
    }

    const upperPoint = findClosestPointByX(band.upperBound, xValue);
    const lowerPoint = findClosestPointByX(band.lowerBound, xValue);

    if (!upperPoint || !lowerPoint) {
      return;
    }

    const upperY = scales.yScale(upperPoint.y);
    const lowerY = scales.yScale(lowerPoint.y);
    const top = Math.min(upperY, lowerY);
    const bottom = Math.max(upperY, lowerY);

    if (y >= top && y <= bottom) {
      currentMatch = {
        band,
        point: {
          x: xValue,
          y: (upperPoint.y + lowerPoint.y) / 2,
          label: upperPoint.label ?? lowerPoint.label,
          timestamp: upperPoint.timestamp ?? lowerPoint.timestamp,
        },
      };
    }
  });

  return currentMatch;
};

const formatTimestamp = (
  value: Date,
  granularity: ConfidenceBandChartProps['timeFormat']
): string => {
  const locale = navigator?.language ?? 'en-US';

  if (granularity === 'long') {
    return value.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
  }

  if (granularity === 'relative') {
    const delta = Date.now() - value.getTime();
    const minutes = Math.round(delta / 60000);
    if (Math.abs(minutes) < 60) {
      return minutes === 0 ? 'now' : `${minutes}m ago`;
    }
    const hours = Math.round(delta / 3600000);
    if (Math.abs(hours) < 24) {
      return `${hours}h ago`;
    }
    const days = Math.round(delta / 86400000);
    return `${days}d ago`;
  }

  return value.toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' });
};

const formatTooltipLabel = (
  point: ChartDataPoint,
  timeFormat: ConfidenceBandChartProps['timeFormat'],
  precision: number
): string => {
  if (point.label) {
    return point.label;
  }

  if (point.timestamp instanceof Date) {
    return formatTimestamp(point.timestamp, timeFormat);
  }

  return formatAxisValue(point.x, precision);
};

const useResponsiveWidth = (
  targetRef: React.RefObject<HTMLElement>,
  enabled: boolean
): number | null => {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const node = targetRef.current;
    if (!node) {
      return;
    }

    const updateWidth = () => {
      setWidth(node.getBoundingClientRect().width);
    };

    updateWidth();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(entries => {
        entries.forEach(entry => {
          if (entry.target === node) {
            setWidth(entry.contentRect.width);
          }
        });
      });
      observer.observe(node);
      return () => observer.disconnect();
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }
  }, [enabled, targetRef]);

  return width;
};

const getBandStrokeDasharray = (pattern: ChartConfidenceBand['pattern']): string | undefined => {
  if (pattern === 'dashed') {
    return '6 4';
  }
  if (pattern === 'dotted') {
    return '2 3';
  }
  return undefined;
};

export const ConfidenceBandChart: React.FC<ConfidenceBandChartProps> = ({
  series,
  confidenceBands,
  annotations = [],
  config: userConfig,
  variant = 'default',
  theme = 'light',
  xAxisLabel,
  yAxisLabel,
  title,
  subtitle,
  timeFormat = 'auto',
  precision = 2,
  className,
  onPointClick,
  onBandHover,
  onZoom,
  onExport,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const baseConfig = useMemo(() => mergeConfig(userConfig), [userConfig]);
  const responsiveWidth = useResponsiveWidth(containerRef, baseConfig.responsive);

  const resolvedConfig = useMemo<ChartConfig>(() => {
    if (!baseConfig.responsive || responsiveWidth === null) {
      return baseConfig;
    }

    const minimumWidth = baseConfig.padding.left + baseConfig.padding.right + MIN_CHART_WIDTH;
    return {
      ...baseConfig,
      width: Math.max(responsiveWidth, minimumWidth),
    };
  }, [baseConfig, responsiveWidth]);

  const themeColors = useMemo(() => getThemeColors(variant, theme), [variant, theme]);

  const [visibilityMap, setVisibilityMap] = useState<Map<string, boolean>>(
    () => new Map(series.map(item => [item.id, item.visible !== false]))
  );

  useEffect(() => {
    setVisibilityMap(new Map(series.map(item => [item.id, item.visible !== false])));
  }, [series]);

  const resolvedSeries = useMemo<ChartSeries[]>(
    () =>
      series.map(item => ({
        ...item,
        visible: visibilityMap.get(item.id) ?? item.visible !== false,
      })),
    [series, visibilityMap]
  );

  const activeSeries = useMemo(
    () => resolvedSeries.filter(item => item.visible !== false),
    [resolvedSeries]
  );

  const scales = useMemo(
    () => calculateChartScales(activeSeries, confidenceBands, resolvedConfig),
    [activeSeries, confidenceBands, resolvedConfig]
  );

  useEffect(() => {
    if (!onZoom) {
      return;
    }

    onZoom({
      xMin: scales.xMin,
      xMax: scales.xMax,
      yMin: scales.yMin,
      yMax: scales.yMax,
    });
  }, [onZoom, scales.xMin, scales.xMax, scales.yMin, scales.yMax]);

  const [hoverState, setHoverState] = useState<HoverState | null>(null);

  const handleSeriesToggle = useCallback(
    (id: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const { checked } = event.target;
      setVisibilityMap(previous => {
        const next = new Map(previous);
        next.set(id, checked);
        return next;
      });
    },
    []
  );

  const handlePointerMove = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (!resolvedConfig.showTooltip) {
        return;
      }

      const svg = svgRef.current;
      if (!svg) {
        return;
      }

      const rect = svg.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;

      const nearest = findNearestPoint(pointerX, pointerY, activeSeries, scales);
      setHoverState(nearest);

      if (onBandHover) {
        const bandMatch = findBandHover(pointerX, pointerY, confidenceBands, scales);
        if (bandMatch) {
          onBandHover(bandMatch.band, bandMatch.point);
        }
      }
    },
    [resolvedConfig.showTooltip, activeSeries, scales, confidenceBands, onBandHover]
  );

  const handlePointerLeave = useCallback(() => {
    setHoverState(null);
  }, []);

  const exportChart = useCallback(
    (format: 'png' | 'svg' | 'pdf' | 'csv') => {
      if (format === 'svg' && typeof window !== 'undefined' && svgRef.current) {
        const serializer = new XMLSerializer();
        const svgContent = serializer.serializeToString(svgRef.current);
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'confidence-band-chart.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      onExport?.(format);
    },
    [onExport]
  );

  const xTicks = useMemo(
    () => generateTicks(scales.xMin, scales.xMax, 7),
    [scales.xMin, scales.xMax]
  );
  const yTicks = useMemo(
    () => generateTicks(scales.yMin, scales.yMax, 6),
    [scales.yMin, scales.yMax]
  );

  const chartLeft = resolvedConfig.padding.left;
  const chartTop = resolvedConfig.padding.top;
  const chartRight = resolvedConfig.width - resolvedConfig.padding.right;
  const chartBottom = resolvedConfig.height - resolvedConfig.padding.bottom;

  const tooltipPosition = hoverState
    ? {
        left: clamp(hoverState.position.x + 16, chartLeft, resolvedConfig.width - 180),
        top: clamp(hoverState.position.y + 16, chartTop, resolvedConfig.height - 140),
      }
    : null;

  return (
    <div
      ref={containerRef}
      className={cn('relative flex flex-col overflow-hidden', VARIANT_STYLES[variant], className)}
    >
      {(title || subtitle) && (
        <div className='border-b border-slate-200 px-4 py-3 dark:border-slate-700'>
          {title && (
            <h3
              className={cn(
                'text-lg font-semibold',
                variant === 'cyber' ? 'text-cyan-200' : 'text-slate-900 dark:text-slate-100'
              )}
            >
              {title}
            </h3>
          )}
          {subtitle && (
            <p
              className={cn(
                'text-sm',
                variant === 'cyber' ? 'text-cyan-400/80' : 'text-slate-500 dark:text-slate-400'
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      {series.length > 0 && (
        <div className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 text-xs dark:border-slate-700'>
          <div className='flex flex-wrap items-center gap-3'>
            {series.map(item => {
              const isVisible = visibilityMap.get(item.id) ?? item.visible !== false;
              return (
                <label
                  key={item.id}
                  className='flex items-center gap-2 text-xs capitalize text-slate-600 dark:text-slate-300'
                >
                  <input
                    type='checkbox'
                    className='h-3 w-3 rounded border-slate-400 text-cyan-500 focus:ring-cyan-400'
                    checked={isVisible}
                    onChange={handleSeriesToggle(item.id)}
                  />
                  <span style={{ color: item.color }}>{item.name}</span>
                </label>
              );
            })}
          </div>

          {onExport && (
            <div className='flex items-center gap-2'>
              {EXPORT_FORMATS.map(format => (
                <button
                  key={format}
                  type='button'
                  onClick={() => exportChart(format)}
                  className={cn(
                    'rounded border px-2 py-1 uppercase tracking-wide transition-colors',
                    variant === 'cyber'
                      ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  )}
                >
                  {format}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className='relative px-4 pb-5 pt-4'>
        <svg
          ref={svgRef}
          width={resolvedConfig.width}
          height={resolvedConfig.height}
          style={{ backgroundColor: themeColors.background }}
          onMouseMove={handlePointerMove}
          onMouseLeave={handlePointerLeave}
          role='img'
        >
          {resolvedConfig.showGrid && (
            <g stroke={themeColors.grid} strokeWidth={1} className='opacity-50'>
              {xTicks.map(tick => {
                const x = scales.xScale(tick);
                return <line key={`grid-x-${tick}`} x1={x} y1={chartTop} x2={x} y2={chartBottom} />;
              })}
              {yTicks.map(tick => {
                const y = scales.yScale(tick);
                return <line key={`grid-y-${tick}`} x1={chartLeft} y1={y} x2={chartRight} y2={y} />;
              })}
            </g>
          )}

          {confidenceBands.map(band => {
            const areaPath = createBandPath(
              band.upperBound,
              band.lowerBound,
              scales.xScale,
              scales.yScale
            );
            if (!areaPath) {
              return null;
            }
            const strokeDasharray = getBandStrokeDasharray(band.pattern);
            const fillColor = band.color ?? `${themeColors.accent}55`;
            const strokeColor = band.color ?? themeColors.accent;

            return (
              <g key={`band-${band.level}`} opacity={band.opacity ?? 0.35}>
                <path d={areaPath} fill={fillColor} stroke={strokeColor} strokeWidth={0.5} />
                <path
                  d={createLinePath(band.upperBound, scales.xScale, scales.yScale)}
                  fill='none'
                  stroke={strokeColor}
                  strokeDasharray={strokeDasharray}
                />
                <path
                  d={createLinePath(band.lowerBound, scales.xScale, scales.yScale)}
                  fill='none'
                  stroke={strokeColor}
                  strokeDasharray={strokeDasharray}
                />
              </g>
            );
          })}

          {activeSeries.map(currentSeries => {
            const linePath = createLinePath(currentSeries.data, scales.xScale, scales.yScale);
            if (!linePath) {
              return null;
            }

            const areaPath =
              currentSeries.type === 'area'
                ? createAreaPath(currentSeries.data, scales.xScale, scales.yScale, chartBottom)
                : '';

            return (
              <g key={currentSeries.id}>
                {areaPath && (
                  <path
                    d={areaPath}
                    fill={currentSeries.color}
                    opacity={currentSeries.opacity ?? 0.25}
                  />
                )}

                <path
                  d={linePath}
                  fill='none'
                  stroke={currentSeries.color}
                  strokeWidth={currentSeries.strokeWidth ?? 2}
                  opacity={currentSeries.opacity ?? 1}
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />

                {(currentSeries.type === 'line' || currentSeries.type === 'scatter') &&
                  currentSeries.data.map((point, index) => {
                    const cx = scales.xScale(point.x);
                    const cy = scales.yScale(point.y);
                    return (
                      <circle
                        key={`${currentSeries.id}-point-${index}`}
                        cx={cx}
                        cy={cy}
                        r={currentSeries.type === 'scatter' ? 4 : 2.5}
                        fill={currentSeries.color}
                        stroke={themeColors.surface}
                        strokeWidth={1}
                        style={{ cursor: onPointClick ? 'pointer' : 'default' }}
                        onClick={() => onPointClick?.(point, currentSeries)}
                      />
                    );
                  })}
              </g>
            );
          })}

          {annotations.map(annotation => {
            if (annotation.type === 'vertical') {
              const value = annotation.value as number;
              const x = scales.xScale(value);
              return (
                <g key={annotation.id}>
                  <line
                    x1={x}
                    x2={x}
                    y1={chartTop}
                    y2={chartBottom}
                    stroke={annotation.color ?? themeColors.accent}
                    strokeDasharray={annotation.style === 'dashed' ? '6 4' : undefined}
                    strokeWidth={1.5}
                  />
                  {annotation.label && (
                    <text x={x + 6} y={chartTop + 14} fill={themeColors.text} fontSize={12}>
                      {annotation.label}
                    </text>
                  )}
                </g>
              );
            }

            if (annotation.type === 'horizontal') {
              const value = annotation.value as number;
              const y = scales.yScale(value);
              return (
                <g key={annotation.id}>
                  <line
                    x1={chartLeft}
                    x2={chartRight}
                    y1={y}
                    y2={y}
                    stroke={annotation.color ?? themeColors.accent}
                    strokeDasharray={annotation.style === 'dashed' ? '6 4' : undefined}
                    strokeWidth={1.5}
                  />
                  {annotation.label && (
                    <text x={chartLeft + 6} y={y - 6} fill={themeColors.text} fontSize={12}>
                      {annotation.label}
                    </text>
                  )}
                </g>
              );
            }

            if (annotation.type === 'point') {
              const value = annotation.value as number;
              const y = scales.yScale(value);
              const x = scales.xScale(value);
              return (
                <g key={annotation.id}>
                  <circle cx={x} cy={y} r={5} fill={annotation.color ?? themeColors.accent} />
                  {annotation.label && (
                    <text x={x + 6} y={y - 6} fill={themeColors.text} fontSize={12}>
                      {annotation.label}
                    </text>
                  )}
                </g>
              );
            }

            if (annotation.type === 'range') {
              const value = annotation.value as { start: number; end: number };
              const startX = scales.xScale(value.start);
              const endX = scales.xScale(value.end);
              return (
                <g key={annotation.id}>
                  <rect
                    x={Math.min(startX, endX)}
                    y={chartTop}
                    width={Math.abs(endX - startX)}
                    height={chartBottom - chartTop}
                    fill={(annotation.color ?? themeColors.accent) + '33'}
                    stroke={annotation.color ?? themeColors.accent}
                    strokeDasharray={annotation.style === 'dashed' ? '6 4' : undefined}
                    strokeWidth={1}
                  />
                  {annotation.label && (
                    <text
                      x={Math.min(startX, endX) + 6}
                      y={chartTop + 16}
                      fill={themeColors.text}
                      fontSize={12}
                    >
                      {annotation.label}
                    </text>
                  )}
                </g>
              );
            }

            return null;
          })}

          {resolvedConfig.showAxes && (
            <g stroke={themeColors.text} strokeWidth={1.5}>
              <line x1={chartLeft} y1={chartBottom} x2={chartRight} y2={chartBottom} />
              <line x1={chartLeft} y1={chartTop} x2={chartLeft} y2={chartBottom} />
            </g>
          )}

          <g fill={themeColors.text} fontSize={11}>
            {xTicks.map(tick => {
              const x = scales.xScale(tick);
              return (
                <text key={`tick-x-${tick}`} x={x} y={chartBottom + 18} textAnchor='middle'>
                  {formatAxisValue(tick, precision)}
                </text>
              );
            })}

            {yTicks.map(tick => {
              const y = scales.yScale(tick);
              return (
                <text key={`tick-y-${tick}`} x={chartLeft - 12} y={y + 4} textAnchor='end'>
                  {formatAxisValue(tick, precision)}
                </text>
              );
            })}
          </g>

          {xAxisLabel && (
            <text
              x={resolvedConfig.width / 2}
              y={resolvedConfig.height - 12}
              textAnchor='middle'
              fill={themeColors.text}
              fontSize={12}
            >
              {xAxisLabel}
            </text>
          )}

          {yAxisLabel && (
            <text
              x={14}
              y={resolvedConfig.height / 2}
              textAnchor='middle'
              fill={themeColors.text}
              fontSize={12}
              transform={`rotate(-90, 14, ${resolvedConfig.height / 2})`}
            >
              {yAxisLabel}
            </text>
          )}
        </svg>

        {hoverState && resolvedConfig.showTooltip && tooltipPosition && (
          <div
            className={cn(
              'pointer-events-none absolute w-44 rounded-md border border-slate-200 bg-white/90 p-3 text-xs shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-800/90',
              variant === 'cyber' && 'border-cyan-500/40 bg-slate-900/95 text-cyan-100'
            )}
            style={{ left: tooltipPosition.left, top: tooltipPosition.top }}
          >
            <div className='flex items-center justify-between'>
              <span className='font-semibold'>{hoverState.series.name}</span>
              <span className='text-[10px] uppercase tracking-wide'>Data Point</span>
            </div>
            <div className='mt-2 space-y-1 text-[11px]'>
              <div className='flex justify-between'>
                <span className='text-slate-500 dark:text-slate-400'>Value</span>
                <span>{hoverState.point.y.toFixed(precision)}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-500 dark:text-slate-400'>X</span>
                <span>{formatTooltipLabel(hoverState.point, timeFormat, precision)}</span>
              </div>
              {hoverState.point.metadata && (
                <div className='pt-1 text-[10px] text-slate-500 dark:text-slate-400'>
                  {Object.entries(hoverState.point.metadata)
                    .slice(0, 3)
                    .map(([key, value]) => (
                      <div key={key} className='flex justify-between'>
                        <span>{key}</span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfidenceBandChart;
