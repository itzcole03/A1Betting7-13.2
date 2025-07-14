import React, { useState, useMemo } from 'react';
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

const defaultConfidenceLevels = [68, 95, 99]; // 1σ, 2σ, 3σ equivalent

const generateConfidenceColors = (variant: string = 'default') => {
  const colorSchemes = {
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

const calculateScales = (data: PredictionData, width: number, height: number, padding = 40) => {
  const allPoints = [
    ...data.actual,
    ...data.predicted,
    ...data.confidenceBands.flatMap(band => [...band.upperBound, ...band.lowerBound]),
  ];

  const xMin = Math.min(...allPoints.map(p => p.x));
  const xMax = Math.max(...allPoints.map(p => p.x));
  const yMin = Math.min(...allPoints.map(p => p.y));
  const yMax = Math.max(...allPoints.map(p => p.y));

  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

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

const formatValue = (value: number, precision = 2): string => {
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toFixed(precision);
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

  const scales = useMemo(() => calculateScales(data, width, height), [data, width, height]);

  const colors = useMemo(() => generateConfidenceColors(variant), [variant]);

  const filteredBands = data.confidenceBands.filter(band => selectedBands.has(band.level));

  const createPath = (points: DataPoint[]): string => {
    if (points.length === 0) return '';

    const pathData = points
      .map((point, index) => {
        const x = scales.xScale(point.x);
        const y = scales.yScale(point.y);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    return pathData;
  };

  const createAreaPath = (upperBound: DataPoint[], lowerBound: DataPoint[]): string => {
    if (upperBound.length === 0 || lowerBound.length === 0) return '';

    const upperPath = upperBound
      .map((point, index) => {
        const x = scales.xScale(point.x);
        const y = scales.yScale(point.y);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    const lowerPath = lowerBound
      .slice()
      .reverse()
      .map(point => {
        const x = scales.xScale(point.x);
        const y = scales.yScale(point.y);
        return `L ${x} ${y}`;
      })
      .join(' ');

    return `${upperPath} ${lowerPath} Z`;
  };

  const toggleBand = (level: number) => {
    const newSelected = new Set(selectedBands);
    if (newSelected.has(level)) {
      newSelected.delete(level);
    } else {
      newSelected.add(level);
    }
    setSelectedBands(newSelected);
  };

  const variantClasses = {
    default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    cyber:
      'bg-slate-900/95 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20 backdrop-blur-md',
    minimal: 'bg-gray-50 border border-gray-200 rounded-md',
    detailed: 'bg-white border border-gray-300 rounded-xl shadow-lg',
    interactive:
      'bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-xl',
  };

  return (
    <div className={cn('relative', variantClasses[variant], className)}>
      {/* Header */}
      {title && (
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
          {data.metadata && (
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
      <div className='p-4'>
        <div className='relative'>
          <svg
            width={width}
            height={height}
            className={cn('overflow-visible', variant === 'cyber' && 'drop-shadow-lg')}
          >
            {/* Grid */}
            {showGrid && (
              <g className='opacity-30'>
                {/* Vertical grid lines */}
                {Array.from({ length: 6 }, (_, i) => {
                  const x = 40 + (i * (width - 80)) / 5;
                  return (
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
                  const y = 40 + (i * (height - 80)) / 5;
                  return (
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
              const color = colors[index % colors.length];
              return (
                <g key={`band-${band.level}`}>
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
                        const rect = e.currentTarget.getBoundingClientRect();
                        const svgRect = e.currentTarget.closest('svg')?.getBoundingClientRect();
                        if (svgRect) {
                          const x = e.clientX - svgRect.left;
                          // Find closest data point
                          const closestPoint = band.upperBound.reduce((closest, point) => {
                            const pointX = scales.xScale(point.x);
                            const distance = Math.abs(pointX - x);
                            const closestDistance = Math.abs(scales.xScale(closest.x) - x);
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
            <g className={cn(variant === 'cyber' ? 'text-cyan-300' : 'text-gray-600')}>
              {/* X-axis */}
              <line
                x1={40}
                y1={height - 40}
                x2={width - 40}
                y2={height - 40}
                stroke='currentColor'
                strokeWidth='2'
              />

              {/* Y-axis */}
              <line
                x1={40}
                y1={40}
                x2={40}
                y2={height - 40}
                stroke='currentColor'
                strokeWidth='2'
              />

              {/* Axis labels */}
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

            {/* Axis tick marks and labels */}
            <g
              className={cn('text-xs', variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500')}
            >
              {/* X-axis ticks */}
              {Array.from({ length: 6 }, (_, i) => {
                const x = 40 + (i * (width - 80)) / 5;
                const value = scales.xMin + (i * scales.xRange) / 5;
                return (
                  <g key={`x-tick-${i}`}>
                    <line x1={x} y1={height - 40} x2={x} y2={height - 35} stroke='currentColor' />
                    <text x={x} y={height - 25} textAnchor='middle' className='fill-current'>
                      {formatValue(value)}
                    </text>
                  </g>
                );
              })}

              {/* Y-axis ticks */}
              {Array.from({ length: 6 }, (_, i) => {
                const y = height - 40 - (i * (height - 80)) / 5;
                const value = scales.yMin + (i * scales.yRange) / 5;
                return (
                  <g key={`y-tick-${i}`}>
                    <line x1={35} y1={y} x2={40} y2={y} stroke='currentColor' />
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
              <div>X: {formatValue(hoveredPoint.point.x)}</div>
              <div>Y: {formatValue(hoveredPoint.point.y)}</div>
              {hoveredPoint.point.timestamp && (
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
        <div
          className={cn(
            'p-4 border-t',
            variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
          )}
        >
          <div className='flex flex-wrap items-center gap-4'>
            {/* Actual Data Legend */}
            {showActualData && (
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
            )}

            {/* Predicted Data Legend */}
            {showPredictions && (
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
            )}

            {/* Confidence Bands Legend */}
            {data.confidenceBands.map((band, index) => {
              const color = colors[index % colors.length];
              const isSelected = selectedBands.has(band.level);
              return (
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
                  <div
                    className='w-4 h-3 rounded-sm border'
                    style={{
                      backgroundColor: color.bg,
                      borderColor: color.border,
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
      )}

      {/* Cyber Effects */}
      {variant === 'cyber' && (
        <>
          <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-lg pointer-events-none' />
          <div className='absolute inset-0 bg-grid-white/[0.02] rounded-lg pointer-events-none' />
        </>
      )}
    </div>
  );
};
