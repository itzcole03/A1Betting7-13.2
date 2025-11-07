import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

type SeriesPoint = {
  x: number;
  y: number;
  timestamp?: Date;
  label?: string;
};

type ConfidenceBand = {
  level: number;
  upperBound: SeriesPoint[];
  lowerBound: SeriesPoint[];
  color?: string;
  opacity?: number;
};

type PredictionData = {
  actual: SeriesPoint[];
  predicted: SeriesPoint[];
  confidenceBands: ConfidenceBand[];
  metadata?: {
    model: string;
    accuracy: number;
    lastUpdated: Date;
    sampleSize: number;
  };
};

type ConfidenceBandsProps = {
  data: PredictionData;
  variant?: 'default' | 'cyber' | 'minimal' | 'detailed' | 'interactive';
  width?: number;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showActualData?: boolean;
  showPredictions?: boolean;
  showTooltips?: boolean;
  animate?: boolean;
  confidenceLevels?: number[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  title?: string;
  className?: string;
  onDataPointClick?: (point: SeriesPoint, type: 'actual' | 'predicted') => void;
  onBandHover?: (band: ConfidenceBand, point: SeriesPoint) => void;
};

type ScaleSet = {
  xScale: (value: number) => number;
  yScale: (value: number) => number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  xRange: number;
  yRange: number;
};

type HoverState = {
  point: SeriesPoint;
  type: 'actual' | 'predicted' | 'band';
  band?: ConfidenceBand;
};

const DEFAULT_CONFIDENCE_LEVELS = Object.freeze([68, 95, 99]);
const CHART_PADDING = 40;

const COLOR_SCHEMES: Record<string, Array<{ bg: string; border: string }>> = {
  default: [
    { bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.32)' },
    { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.32)' },
    { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.32)' },
  ],
  cyber: [
    { bg: 'rgba(6, 182, 212, 0.14)', border: 'rgba(6, 182, 212, 0.48)' },
    { bg: 'rgba(168, 85, 247, 0.14)', border: 'rgba(168, 85, 247, 0.48)' },
    { bg: 'rgba(236, 72, 153, 0.14)', border: 'rgba(236, 72, 153, 0.48)' },
  ],
};

const VARIANT_CONTAINER_CLASSES: Record<Required<ConfidenceBandsProps>['variant'], string> = {
  default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
  cyber:
    'bg-slate-900/95 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20 backdrop-blur-md',
  minimal: 'bg-gray-50 border border-gray-200 rounded-md',
  detailed: 'bg-white border border-gray-300 rounded-xl shadow-lg',
  interactive:
    'bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-xl',
};

const formatTickValue = (value: number, precision = 2): string => {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return value.toFixed(precision);
};

const buildScaleSet = (
  data: PredictionData,
  width: number,
  height: number,
  padding = CHART_PADDING
): ScaleSet => {
  const series = [
    ...data.actual,
    ...data.predicted,
    ...data.confidenceBands.flatMap(band => [...band.upperBound, ...band.lowerBound]),
  ];

  if (series.length === 0) {
    const fallback = {
      xScale: () => padding,
      yScale: () => height - padding,
      xMin: 0,
      xMax: 1,
      yMin: 0,
      yMax: 1,
      xRange: 1,
      yRange: 1,
    } satisfies ScaleSet;

    return fallback;
  }

  const xValues = series.map(point => point.x);
  const yValues = series.map(point => point.y);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);

  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  return {
    xScale: value => ((value - xMin) / xRange) * (width - padding * 2) + padding,
    yScale: value => height - padding - ((value - yMin) / yRange) * (height - padding * 2),
    xMin,
    xMax,
    yMin,
    yMax,
    xRange,
    yRange,
  };
};

const generateConfidenceColors = (variant: ConfidenceBandsProps['variant']) => {
  const scheme = COLOR_SCHEMES[variant ?? 'default'];
  return scheme ?? COLOR_SCHEMES.default;
};

const findClosestPoint = (scaleSet: ScaleSet, targetX: number, band: ConfidenceBand) => {
  return band.upperBound.reduce((closest, candidate) => {
    const candidateDistance = Math.abs(scaleSet.xScale(candidate.x) - targetX);
    const closestDistance = Math.abs(scaleSet.xScale(closest.x) - targetX);

    return candidateDistance < closestDistance ? candidate : closest;
  }, band.upperBound[0]);
};

export const ConfidenceBands: React.FC<ConfidenceBandsProps> = ({
  data,
  variant = 'default',
  width = 800,
  height = 400,
  showLegend = true,
  showGrid = true,
  showActualData = true,
  showPredictions = true,
  showTooltips = true,
  animate = true,
  confidenceLevels = DEFAULT_CONFIDENCE_LEVELS,
  xAxisLabel = 'X',
  yAxisLabel = 'Y',
  title,
  className,
  onDataPointClick,
  onBandHover,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<HoverState | null>(null);
  const [selectedLevels, setSelectedLevels] = useState<Set<number>>(
    () => new Set(confidenceLevels)
  );

  useEffect(() => {
    setSelectedLevels(new Set(confidenceLevels));
  }, [confidenceLevels]);

  const scales = useMemo(() => buildScaleSet(data, width, height), [data, width, height]);
  const colors = useMemo(() => generateConfidenceColors(variant), [variant]);

  const filteredBands = useMemo(
    () => data.confidenceBands.filter(band => selectedLevels.has(band.level)),
    [data.confidenceBands, selectedLevels]
  );

  const createLinePath = useCallback(
    (points: SeriesPoint[]) => {
      if (points.length === 0) {
        return '';
      }

      return points
        .map((point, index) => {
          const prefix = index === 0 ? 'M' : 'L';
          const x = scales.xScale(point.x);
          const y = scales.yScale(point.y);
          return `${prefix} ${x} ${y}`;
        })
        .join(' ');
    },
    [scales]
  );

  const createAreaPath = useCallback(
    (upperBound: SeriesPoint[], lowerBound: SeriesPoint[]) => {
      if (upperBound.length === 0 || lowerBound.length === 0) {
        return '';
      }

      const upperPath = upperBound
        .map((point, index) => {
          const prefix = index === 0 ? 'M' : 'L';
          const x = scales.xScale(point.x);
          const y = scales.yScale(point.y);
          return `${prefix} ${x} ${y}`;
        })
        .join(' ');

      const lowerPath = [...lowerBound]
        .reverse()
        .map(point => {
          const x = scales.xScale(point.x);
          const y = scales.yScale(point.y);
          return `L ${x} ${y}`;
        })
        .join(' ');

      return `${upperPath} ${lowerPath} Z`;
    },
    [scales]
  );

  const toggleBand = useCallback((level: number) => {
    setSelectedLevels(prev => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  }, []);

  const handleBandHover = useCallback(
    (event: React.MouseEvent<SVGPathElement, MouseEvent>, band: ConfidenceBand) => {
      if (!showTooltips) {
        return;
      }

      const svg = event.currentTarget.ownerSVGElement;
      if (!svg || band.upperBound.length === 0) {
        return;
      }

      const svgRect = svg.getBoundingClientRect();
      const relativeX = event.clientX - svgRect.left;
      const closestPoint = findClosestPoint(scales, relativeX, band);

      setHoveredPoint({ point: closestPoint, type: 'band', band });
      onBandHover?.(band, closestPoint);
    },
    [onBandHover, scales, showTooltips]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredPoint(null);
  }, []);

  const renderFallback = data.actual.length === 0 && data.predicted.length === 0;

  return (
    <div className={cn('relative', VARIANT_CONTAINER_CLASSES[variant], className)}>
      {title ? (
        <div
          className={cn(
            'p-4 border-b',
            variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
          )}
        >
          <h3
            className={cn(
              'text-lg font-semibold',
              variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
            )}
          >
            {title}
          </h3>
          {data.metadata ? (
            <div
              className={cn(
                'text-sm mt-1',
                variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600'
              )}
            >
              Model: {data.metadata.model} • Accuracy:
              {` ${(data.metadata.accuracy * 100).toFixed(1)}%`} • Samples:
              {` ${data.metadata.sampleSize.toLocaleString()}`}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className='p-4'>
        <div className='relative'>
          <svg
            width={width}
            height={height}
            role='img'
            className={cn('overflow-visible', variant === 'cyber' && 'drop-shadow-lg')}
          >
            {showGrid ? (
              <g className='opacity-30'>
                {Array.from({ length: 6 }, (_, index) => {
                  const x = CHART_PADDING + (index * (width - CHART_PADDING * 2)) / 5;
                  return (
                    <line
                      key={`vertical-${index}`}
                      x1={x}
                      y1={CHART_PADDING}
                      x2={x}
                      y2={height - CHART_PADDING}
                      stroke={variant === 'cyber' ? '#06b6d4' : '#e5e7eb'}
                      strokeWidth={1}
                      strokeDasharray='2,2'
                    />
                  );
                })}

                {Array.from({ length: 6 }, (_, index) => {
                  const y = CHART_PADDING + (index * (height - CHART_PADDING * 2)) / 5;
                  return (
                    <line
                      key={`horizontal-${index}`}
                      x1={CHART_PADDING}
                      y1={y}
                      x2={width - CHART_PADDING}
                      y2={y}
                      stroke={variant === 'cyber' ? '#06b6d4' : '#e5e7eb'}
                      strokeWidth={1}
                      strokeDasharray='2,2'
                    />
                  );
                })}
              </g>
            ) : null}

            {filteredBands.map((band, index) => {
              const color = colors[index % colors.length];
              return (
                <g key={`band-${band.level}`}>
                  <path
                    d={createAreaPath(band.upperBound, band.lowerBound)}
                    fill={band.color ?? color.bg}
                    stroke={band.color ?? color.border}
                    strokeWidth={1}
                    className={cn('transition-all duration-300', animate && 'animate-fade-in')}
                    style={{ animationDelay: animate ? `${index * 200}ms` : undefined }}
                    onMouseEnter={event => handleBandHover(event, band)}
                    onMouseLeave={handleMouseLeave}
                  />
                </g>
              );
            })}

            {showPredictions && data.predicted.length > 0 ? (
              <path
                d={createLinePath(data.predicted)}
                fill='none'
                stroke={variant === 'cyber' ? '#a855f7' : '#6366f1'}
                strokeWidth={2}
                strokeDasharray='5,5'
                className={cn('transition-all duration-300', animate && 'animate-draw-line')}
              />
            ) : null}

            {showActualData && data.actual.length > 0 ? (
              <path
                d={createLinePath(data.actual)}
                fill='none'
                stroke={variant === 'cyber' ? '#06b6d4' : '#059669'}
                strokeWidth={3}
                className={cn('transition-all duration-300', animate && 'animate-draw-line')}
                style={{ animationDelay: animate ? '400ms' : undefined }}
              />
            ) : null}

            {showActualData
              ? data.actual.map((point, index) => (
                  <circle
                    key={`actual-${index}`}
                    cx={scales.xScale(point.x)}
                    cy={scales.yScale(point.y)}
                    r={4}
                    fill={variant === 'cyber' ? '#06b6d4' : '#059669'}
                    stroke='white'
                    strokeWidth={2}
                    className={cn(
                      'cursor-pointer transition-all duration-200 hover:r-6',
                      animate && 'animate-fade-in'
                    )}
                    style={{ animationDelay: animate ? `${600 + index * 50}ms` : undefined }}
                    onClick={() => onDataPointClick?.(point, 'actual')}
                    onMouseEnter={() =>
                      showTooltips ? setHoveredPoint({ point, type: 'actual' }) : undefined
                    }
                    onMouseLeave={handleMouseLeave}
                  />
                ))
              : null}

            {showPredictions
              ? data.predicted.map((point, index) => (
                  <circle
                    key={`predicted-${index}`}
                    cx={scales.xScale(point.x)}
                    cy={scales.yScale(point.y)}
                    r={3}
                    fill={variant === 'cyber' ? '#a855f7' : '#6366f1'}
                    stroke='white'
                    strokeWidth={1}
                    className={cn(
                      'cursor-pointer transition-all duration-200 hover:r-5',
                      animate && 'animate-fade-in'
                    )}
                    style={{ animationDelay: animate ? `${800 + index * 50}ms` : undefined }}
                    onClick={() => onDataPointClick?.(point, 'predicted')}
                    onMouseEnter={() =>
                      showTooltips ? setHoveredPoint({ point, type: 'predicted' }) : undefined
                    }
                    onMouseLeave={handleMouseLeave}
                  />
                ))
              : null}

            <g className={cn(variant === 'cyber' ? 'text-cyan-300' : 'text-gray-600')}>
              <line
                x1={CHART_PADDING}
                y1={height - CHART_PADDING}
                x2={width - CHART_PADDING}
                y2={height - CHART_PADDING}
                stroke='currentColor'
                strokeWidth={2}
              />

              <line
                x1={CHART_PADDING}
                y1={CHART_PADDING}
                x2={CHART_PADDING}
                y2={height - CHART_PADDING}
                stroke='currentColor'
                strokeWidth={2}
              />

              <text
                x={width / 2}
                y={height - 10}
                textAnchor='middle'
                className='text-sm fill-current'
              >
                {xAxisLabel}
              </text>

              <text
                x={15}
                y={height / 2}
                textAnchor='middle'
                transform={`rotate(-90, 15, ${height / 2})`}
                className='text-sm fill-current'
              >
                {yAxisLabel}
              </text>
            </g>

            <g
              className={cn('text-xs', variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500')}
            >
              {Array.from({ length: 6 }, (_, index) => {
                const position = CHART_PADDING + (index * (width - CHART_PADDING * 2)) / 5;
                const value = scales.xMin + (index * scales.xRange) / 5;
                return (
                  <g key={`x-tick-${index}`}>
                    <line
                      x1={position}
                      y1={height - CHART_PADDING}
                      x2={position}
                      y2={height - CHART_PADDING + 5}
                      stroke='currentColor'
                    />
                    <text x={position} y={height - CHART_PADDING + 20} textAnchor='middle'>
                      {formatTickValue(value)}
                    </text>
                  </g>
                );
              })}

              {Array.from({ length: 6 }, (_, index) => {
                const position =
                  height - CHART_PADDING - (index * (height - CHART_PADDING * 2)) / 5;
                const value = scales.yMin + (index * scales.yRange) / 5;
                return (
                  <g key={`y-tick-${index}`}>
                    <line
                      x1={CHART_PADDING - 5}
                      y1={position}
                      x2={CHART_PADDING}
                      y2={position}
                      stroke='currentColor'
                    />
                    <text x={CHART_PADDING - 10} y={position + 4} textAnchor='end'>
                      {formatTickValue(value)}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {showTooltips && hoveredPoint ? (
            <div
              className={cn(
                'absolute pointer-events-none z-10 p-2 rounded shadow-lg border text-sm',
                variant === 'cyber'
                  ? 'bg-slate-800 border-cyan-500/30 text-cyan-300'
                  : 'bg-white border-gray-200 text-gray-900'
              )}
              style={{
                left: scales.xScale(hoveredPoint.point.x) + 10,
                top: scales.yScale(hoveredPoint.point.y) - 10,
              }}
            >
              <div className='font-medium'>
                {hoveredPoint.type === 'actual'
                  ? 'Actual'
                  : hoveredPoint.type === 'predicted'
                  ? 'Predicted'
                  : `${hoveredPoint.band?.level}% Confidence`}
              </div>
              <div>X: {formatTickValue(hoveredPoint.point.x)}</div>
              <div>Y: {formatTickValue(hoveredPoint.point.y)}</div>
              {hoveredPoint.point.timestamp ? (
                <div className='text-xs opacity-70'>
                  {hoveredPoint.point.timestamp.toLocaleString()}
                </div>
              ) : null}
            </div>
          ) : null}

          {renderFallback ? (
            <div className='absolute inset-0 flex items-center justify-center text-sm text-gray-500'>
              No data available
            </div>
          ) : null}
        </div>
      </div>

      {showLegend ? (
        <div
          className={cn(
            'p-4 border-t',
            variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
          )}
        >
          <div className='flex flex-wrap items-center gap-4'>
            {showActualData ? (
              <div className='flex items-center space-x-2'>
                <div
                  className={cn('w-4 h-0.5', variant === 'cyber' ? 'bg-cyan-400' : 'bg-green-600')}
                />
                <span
                  className={cn('text-sm', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-700')}
                >
                  Actual
                </span>
              </div>
            ) : null}

            {showPredictions ? (
              <div className='flex items-center space-x-2'>
                <div
                  className={cn(
                    'w-4 h-0.5 border-dashed border-2',
                    variant === 'cyber' ? 'border-purple-400' : 'border-indigo-600'
                  )}
                />
                <span
                  className={cn('text-sm', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-700')}
                >
                  Predicted
                </span>
              </div>
            ) : null}

            {data.confidenceBands.map((band, index) => {
              const color = colors[index % colors.length];
              const isSelected = selectedLevels.has(band.level);
              return (
                <button
                  key={`legend-${band.level}`}
                  type='button'
                  onClick={() => toggleBand(band.level)}
                  className={cn(
                    'flex items-center space-x-2 px-2 py-1 rounded transition-colors',
                    isSelected
                      ? variant === 'cyber'
                        ? 'bg-cyan-500/20'
                        : 'bg-blue-50'
                      : 'opacity-60 hover:opacity-80'
                  )}
                >
                  <div
                    className='w-4 h-3 rounded-sm border'
                    style={{
                      backgroundColor: band.color ?? color.bg,
                      borderColor: band.color ?? color.border,
                    }}
                  />
                  <span
                    className={cn(
                      'text-sm',
                      variant === 'cyber' ? 'text-cyan-300' : 'text-gray-700'
                    )}
                  >
                    {band.level}% CI
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {variant === 'cyber' ? (
        <>
          <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-lg pointer-events-none' />
          <div className='absolute inset-0 bg-grid-white/[0.02] rounded-lg pointer-events-none' />
        </>
      ) : null}
    </div>
  );
};

export default ConfidenceBands;
