import React, { useState, useMemo } from 'react';
// @ts-expect-error TS(2307): Cannot find module '@/lib/utils' or its correspond... Remove this comment to see the full error message
import { cn } from '@/lib/utils';

// Types for confidence band data
interface DataPoint {
  x: number;
  y: number;
  timestamp?: Date;
  label?: string;
}

interface ConfidenceBand {
  level: number; // e.g., 95 for 95% confidence
  upperBound: DataPoint[];
  lowerBound: DataPoint[];
  color?: string;
  opacity?: number;
}

interface PredictionData {
  actual: DataPoint[];
  predicted: DataPoint[];
  confidenceBands: ConfidenceBand[];
  metadata?: {
    model: string;
    accuracy: number;
    lastUpdated: Date;
    sampleSize: number;
  };
}

interface ConfidenceBandsProps {
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
  confidenceLevels?: number[]; // Which confidence levels to show
  xAxisLabel?: string;
  yAxisLabel?: string;
  title?: string;
  className?: string;
  onDataPointClick?: (point: DataPoint, type: 'actual' | 'predicted') => void;
  onBandHover?: (band: ConfidenceBand, point: DataPoint) => void;
}

const _defaultConfidenceLevels = [68, 95, 99]; // 1σ, 2σ, 3σ equivalent

const _generateConfidenceColors = (variant: string = 'default') => {
  const _colorSchemes = {
    default: [
      { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)' }, // blue
      { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)' }, // green
      { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)' }, // amber
    ],
    cyber: [
      { bg: 'rgba(6, 182, 212, 0.1)', border: 'rgba(6, 182, 212, 0.4)' }, // cyan
      { bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.4)' }, // purple
      { bg: 'rgba(236, 72, 153, 0.1)', border: 'rgba(236, 72, 153, 0.4)' }, // pink
    ],
  };

  return variant === 'cyber' ? colorSchemes.cyber : colorSchemes.default;
};

const _calculateScales = (data: PredictionData, width: number, height: number, padding = 40) => {
  const _allPoints = [
    ...data.actual,
    ...data.predicted,
    ...data.confidenceBands.flatMap(band => [...band.upperBound, ...band.lowerBound]),
  ];

  const _xMin = Math.min(...allPoints.map(p => p.x));
  const _xMax = Math.max(...allPoints.map(p => p.x));
  const _yMin = Math.min(...allPoints.map(p => p.y));
  const _yMax = Math.max(...allPoints.map(p => p.y));

  const _xRange = xMax - xMin || 1;
  const _yRange = yMax - yMin || 1;

  return {
    xScale: (x: number) => ((x - xMin) / xRange) * (width - 2 * padding) + padding,
    yScale: (y: number) => height - padding - ((y - yMin) / yRange) * (height - 2 * padding),
    xMin,
    xMax,
    yMin,
    yMax,
    xRange,
    yRange,
  };
};

const _formatValue = (value: number, precision = 2): string => {
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toFixed(precision);
};

export const _ConfidenceBands: React.FC<ConfidenceBandsProps> = ({
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
  confidenceLevels = defaultConfidenceLevels,
  xAxisLabel = 'X',
  yAxisLabel = 'Y',
  title,
  className,
  onDataPointClick,
  onBandHover,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    point: DataPoint;
    type: 'actual' | 'predicted' | 'band';
    band?: ConfidenceBand;
  } | null>(null);
  const [selectedBands, setSelectedBands] = useState<Set<number>>(new Set(confidenceLevels));

  const _scales = useMemo(() => calculateScales(data, width, height), [data, width, height]);

  const _colors = useMemo(() => generateConfidenceColors(variant), [variant]);

  const _filteredBands = data.confidenceBands.filter(band => selectedBands.has(band.level));

  const _createPath = (points: DataPoint[]): string => {
    if (points.length === 0) return '';

    const _pathData = points
      .map((point, index) => {
        const _x = scales.xScale(point.x);
        const _y = scales.yScale(point.y);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    return pathData;
  };

  const _createAreaPath = (upperBound: DataPoint[], lowerBound: DataPoint[]): string => {
    if (upperBound.length === 0 || lowerBound.length === 0) return '';

    const _upperPath = upperBound
      .map((point, index) => {
        const _x = scales.xScale(point.x);
        const _y = scales.yScale(point.y);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    const _lowerPath = lowerBound
      .slice()
      .reverse()
      .map(point => {
        const _x = scales.xScale(point.x);
        const _y = scales.yScale(point.y);
        return `L ${x} ${y}`;
      })
      .join(' ');

    return `${upperPath} ${lowerPath} Z`;
  };

  const _toggleBand = (level: number) => {
    const _newSelected = new Set(selectedBands);
    if (newSelected.has(level)) {
      newSelected.delete(level);
    } else {
      newSelected.add(level);
    }
    setSelectedBands(newSelected);
  };

  const _variantClasses = {
    default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    cyber:
      'bg-slate-900/95 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20 backdrop-blur-md',
    minimal: 'bg-gray-50 border border-gray-200 rounded-md',
    detailed: 'bg-white border border-gray-300 rounded-xl shadow-lg',
    interactive:
      'bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-xl',
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className={cn('relative', variantClasses[variant], className)}>
      {/* Header */}
      {title && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'p-4 border-b',
            variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
          )}
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h3
            className={cn(
              'text-lg font-semibold',
              variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
            )}
          >
            {title}
          </h3>
          {data.metadata && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div
              className={cn(
                'text-sm mt-1',
                variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600'
              )}
            >
              Model: {data.metadata.model} • Accuracy: {(data.metadata.accuracy * 100).toFixed(1)}%
              • Samples: {data.metadata.sampleSize.toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Chart Container */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='p-4'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='relative'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <svg
            width={width}
            height={height}
            className={cn('overflow-visible', variant === 'cyber' && 'drop-shadow-lg')}
          >
            {/* Grid */}
            {showGrid && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <g className='opacity-30'>
                {/* Vertical grid lines */}
                {Array.from({ length: 6 }, (_, i) => {
                  const _x = 40 + (i * (width - 80)) / 5;
                  return (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <line
                      key={`v-grid-${i}`}
                      x1={x}
                      y1={40}
                      x2={x}
                      y2={height - 40}
                      stroke={variant === 'cyber' ? '#06b6d4' : '#e5e7eb'}
                      strokeWidth='1'
                      strokeDasharray='2,2'
                    />
                  );
                })}

                {/* Horizontal grid lines */}
                {Array.from({ length: 6 }, (_, i) => {
                  const _y = 40 + (i * (height - 80)) / 5;
                  return (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <line
                      key={`h-grid-${i}`}
                      x1={40}
                      y1={y}
                      x2={width - 40}
                      y2={y}
                      stroke={variant === 'cyber' ? '#06b6d4' : '#e5e7eb'}
                      strokeWidth='1'
                      strokeDasharray='2,2'
                    />
                  );
                })}
              </g>
            )}

            {/* Confidence Bands */}
            {filteredBands.map((band, index) => {
              const _color = colors[index % colors.length];
              return (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <g key={`band-${band.level}`}>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <path
                    d={createAreaPath(band.upperBound, band.lowerBound)}
                    fill={color.bg}
                    stroke={color.border}
                    strokeWidth='1'
                    className={cn('transition-all duration-300', animate && 'animate-fade-in')}
                    style={{
                      animationDelay: animate ? `${index * 200}ms` : '0ms',
                    }}
                    onMouseEnter={e => {
                      if (showTooltips) {
                        // Find closest point for tooltip
                        const _rect = e.currentTarget.getBoundingClientRect();
                        const _svgRect = e.currentTarget.closest('svg')?.getBoundingClientRect();
                        if (svgRect) {
                          const _x = e.clientX - svgRect.left;
                          // Find closest data point
                          const _closestPoint = band.upperBound.reduce((closest, point) => {
                            const _pointX = scales.xScale(point.x);
                            const _distance = Math.abs(pointX - x);
                            const _closestDistance = Math.abs(scales.xScale(closest.x) - x);
                            return distance < closestDistance ? point : closest;
                          });
                          setHoveredPoint({ point: closestPoint, type: 'band', band });
                          onBandHover?.(band, closestPoint);
                        }
                      }
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                </g>
              );
            })}

            {/* Predicted Line */}
            {showPredictions && data.predicted.length > 0 && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <path
                d={createPath(data.predicted)}
                fill='none'
                stroke={variant === 'cyber' ? '#a855f7' : '#6366f1'}
                strokeWidth='2'
                strokeDasharray='5,5'
                className={cn('transition-all duration-300', animate && 'animate-draw-line')}
              />
            )}

            {/* Actual Data Line */}
            {showActualData && data.actual.length > 0 && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <path
                d={createPath(data.actual)}
                fill='none'
                stroke={variant === 'cyber' ? '#06b6d4' : '#059669'}
                strokeWidth='3'
                className={cn('transition-all duration-300', animate && 'animate-draw-line')}
                style={{
                  animationDelay: animate ? '400ms' : '0ms',
                }}
              />
            )}

            {/* Actual Data Points */}
            {showActualData &&
              data.actual.map((point, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <circle
                  key={`actual-${index}`}
                  cx={scales.xScale(point.x)}
                  cy={scales.yScale(point.y)}
                  r='4'
                  fill={variant === 'cyber' ? '#06b6d4' : '#059669'}
                  stroke='white'
                  strokeWidth='2'
                  className={cn(
                    'cursor-pointer transition-all duration-200 hover:r-6',
                    animate && 'animate-fade-in'
                  )}
                  style={{
                    animationDelay: animate ? `${600 + index * 50}ms` : '0ms',
                  }}
                  onClick={() => onDataPointClick?.(point, 'actual')}
                  onMouseEnter={() => showTooltips && setHoveredPoint({ point, type: 'actual' })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}

            {/* Predicted Data Points */}
            {showPredictions &&
              data.predicted.map((point, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <circle
                  key={`predicted-${index}`}
                  cx={scales.xScale(point.x)}
                  cy={scales.yScale(point.y)}
                  r='3'
                  fill={variant === 'cyber' ? '#a855f7' : '#6366f1'}
                  stroke='white'
                  strokeWidth='1'
                  className={cn(
                    'cursor-pointer transition-all duration-200 hover:r-5',
                    animate && 'animate-fade-in'
                  )}
                  style={{
                    animationDelay: animate ? `${800 + index * 50}ms` : '0ms',
                  }}
                  onClick={() => onDataPointClick?.(point, 'predicted')}
                  onMouseEnter={() => showTooltips && setHoveredPoint({ point, type: 'predicted' })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}

            {/* Axes */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <g className={cn(variant === 'cyber' ? 'text-cyan-300' : 'text-gray-600')}>
              {/* X-axis */}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <line
                x1={40}
                y1={height - 40}
                x2={width - 40}
                y2={height - 40}
                stroke='currentColor'
                strokeWidth='2'
              />

              {/* Y-axis */}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <line
                x1={40}
                y1={40}
                x2={40}
                y2={height - 40}
                stroke='currentColor'
                strokeWidth='2'
              />

              {/* Axis labels */}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <text
                x={width / 2}
                y={height - 10}
                textAnchor='middle'
                className='text-sm fill-current'
              >
                {xAxisLabel}
              </text>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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

            {/* Axis tick marks and labels */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <g
              className={cn('text-xs', variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500')}
            >
              {/* X-axis ticks */}
              {Array.from({ length: 6 }, (_, i) => {
                const _x = 40 + (i * (width - 80)) / 5;
                const _value = scales.xMin + (i * scales.xRange) / 5;
                return (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <g key={`x-tick-${i}`}>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <line x1={x} y1={height - 40} x2={x} y2={height - 35} stroke='currentColor' />
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <text x={x} y={height - 25} textAnchor='middle' className='fill-current'>
                      {formatValue(value)}
                    </text>
                  </g>
                );
              })}

              {/* Y-axis ticks */}
              {Array.from({ length: 6 }, (_, i) => {
                const _y = height - 40 - (i * (height - 80)) / 5;
                const _value = scales.yMin + (i * scales.yRange) / 5;
                return (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <g key={`y-tick-${i}`}>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <line x1={35} y1={y} x2={40} y2={y} stroke='currentColor' />
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <text x={30} y={y + 4} textAnchor='end' className='fill-current'>
                      {formatValue(value)}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Tooltip */}
          {showTooltips && hoveredPoint && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='font-medium'>
                {hoveredPoint.type === 'actual'
                  ? 'Actual'
                  : hoveredPoint.type === 'predicted'
                    ? 'Predicted'
                    : `${hoveredPoint.band?.level}% Confidence`}
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>X: {formatValue(hoveredPoint.point.x)}</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>Y: {formatValue(hoveredPoint.point.y)}</div>
              {hoveredPoint.point.timestamp && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-xs opacity-70'>
                  {hoveredPoint.point.timestamp.toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'p-4 border-t',
            variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
          )}
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex flex-wrap items-center gap-4'>
            {/* Actual Data Legend */}
            {showActualData && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center space-x-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div
                  className={cn('w-4 h-0.5', variant === 'cyber' ? 'bg-cyan-400' : 'bg-green-600')}
                />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span
                  className={cn('text-sm', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-700')}
                >
                  Actual
                </span>
              </div>
            )}

            {/* Predicted Data Legend */}
            {showPredictions && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center space-x-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div
                  className={cn(
                    'w-4 h-0.5 border-dashed border-2',
                    variant === 'cyber' ? 'border-purple-400' : 'border-indigo-600'
                  )}
                />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span
                  className={cn('text-sm', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-700')}
                >
                  Predicted
                </span>
              </div>
            )}

            {/* Confidence Bands Legend */}
            {data.confidenceBands.map((band, index) => {
              const _color = colors[index % colors.length];
              const _isSelected = selectedBands.has(band.level);
              return (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <button
                  key={`legend-${band.level}`}
                  onClick={() => toggleBand(band.level)}
                  className={cn(
                    'flex items-center space-x-2 px-2 py-1 rounded transition-colors',
                    isSelected
                      ? variant === 'cyber'
                        ? 'bg-cyan-500/20'
                        : 'bg-blue-50'
                      : 'opacity-50 hover:opacity-75'
                  )}
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div
                    className='w-4 h-3 rounded-sm border'
                    style={{
                      backgroundColor: color.bg,
                      borderColor: color.border,
                    }}
                  />
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
      )}

      {/* Cyber Effects */}
      {variant === 'cyber' && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-lg pointer-events-none' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='absolute inset-0 bg-grid-white/[0.02] rounded-lg pointer-events-none' />
        </>
      )}
    </div>
  );
};
