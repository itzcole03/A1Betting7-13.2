import React, { useState, useEffect, useRef, useMemo } from 'react';
// @ts-expect-error TS(2307): Cannot find module '@/lib/utils' or its correspond... Remove this comment to see the full error message
import { cn } from '@/lib/utils';

// Types for safe chart
interface ChartDataPoint {
  x: number | string | Date;
  y: number;
  label?: string;
  color?: string;
  metadata?: Record<string, unknown>;
}

interface ChartSeries {
  id: string;
  name: string;
  data: ChartDataPoint[];
  color: string;
  type: 'line' | 'area' | 'bar' | 'scatter';
  visible: boolean;
}

interface ChartError {
  type: 'data' | 'render' | 'network' | 'validation';
  message: string;
  details?: unknown;
  timestamp: Date;
}

interface SafeChartProps {
  data: ChartSeries[];
  type?: 'line' | 'area' | 'bar' | 'scatter' | 'mixed';
  variant?: 'default' | 'cyber' | 'minimal' | 'professional';
  width?: number;
  height?: number;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  showErrorBoundary?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  animateOnLoad?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
  fallbackMessage?: string;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  className?: string;
  onError?: (error: ChartError) => void;
  onDataLoad?: (data: ChartSeries[]) => void;
  onPointClick?: (point: ChartDataPoint, series: ChartSeries) => void;
}

interface ChartState {
  isLoading: boolean;
  error: ChartError | null;
  retryCount: number;
  validatedData: ChartSeries[];
  zoomLevel: number;
  panOffset: { x: number; y: number };
}

const _validateChartData = (data: ChartSeries[]): { isValid: boolean; errors: string[] } => {
  const _errors: string[] = [];

  if (!Array.isArray(data)) {
    errors.push('Data must be an array');
    return { isValid: false, errors };
  }

  if (data.length === 0) {
    errors.push('Data array is empty');
    return { isValid: false, errors };
  }

  data.forEach((series, seriesIndex) => {
    if (!series.id) {
      errors.push(`Series ${seriesIndex} missing required id`);
    }

    if (!series.name) {
      errors.push(`Series ${seriesIndex} missing required name`);
    }

    if (!Array.isArray(series.data)) {
      errors.push(`Series ${seriesIndex} data must be an array`);
    } else {
      series.data.forEach((point, pointIndex) => {
        if (typeof point.y !== 'number' || isNaN(point.y)) {
          errors.push(`Series ${seriesIndex}, point ${pointIndex}: y value must be a valid number`);
        }

        if (point.x === undefined || point.x === null) {
          errors.push(`Series ${seriesIndex}, point ${pointIndex}: x value is required`);
        }
      });
    }
  });

  return { isValid: errors.length === 0, errors };
};

const _sanitizeData = (data: ChartSeries[]): ChartSeries[] => {
  return data
    .map(series => ({
      ...series,
      data: series.data
        .filter(point => typeof point.y === 'number' && !isNaN(point.y))
        .map(point => ({
          ...point,
          y: Number(point.y),
          x: point.x === null || point.x === undefined ? 0 : point.x,
        })),
    }))
    .filter(series => series.data.length > 0);
};

const _calculateScales = (data: ChartSeries[], width: number, height: number, padding = 40) => {
  const _allPoints = data.flatMap(series => series.data);

  if (allPoints.length === 0) {
    return {
      xScale: (x: unknown) => padding,
      yScale: (y: number) => height - padding,
      xMin: 0,
      xMax: 1,
      yMin: 0,
      yMax: 1,
    };
  }

  const _xValues = allPoints.map(p => (typeof p.x === 'number' ? p.x : 0));
  const _yValues = allPoints.map(p => p.y);

  const _xMin = Math.min(...xValues);
  const _xMax = Math.max(...xValues);
  const _yMin = Math.min(...yValues, 0); // Include 0 in range
  const _yMax = Math.max(...yValues);

  const _xRange = xMax - xMin || 1;
  const _yRange = yMax - yMin || 1;

  return {
    xScale: (x: number) => ((x - xMin) / xRange) * (width - 2 * padding) + padding,
    yScale: (y: number) => height - padding - ((y - yMin) / yRange) * (height - 2 * padding),
    xMin,
    xMax,
    yMin,
    yMax,
  };
};

const _createSafePath = (
  points: ChartDataPoint[],
  xScale: (x: unknown) => number,
  yScale: (y: number) => number
): string => {
  if (points.length === 0) return '';

  try {
    return points
      .map((point, index) => {
        const _x = xScale(typeof point.x === 'number' ? point.x : index);
        const _y = yScale(point.y);

        // Ensure coordinates are valid
        if (!isFinite(x) || !isFinite(y)) {
          return null;
        }

        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .filter(Boolean)
      .join(' ');
  } catch (error) {
    console.warn('Error creating path:', error);
    return '';
  }
};

export const _SafeChart: React.FC<SafeChartProps> = ({
  data,
  type = 'line',
  variant = 'default',
  width = 600,
  height = 400,
  title,
  xAxisLabel,
  yAxisLabel,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  showErrorBoundary = true,
  enableZoom = false,
  enablePan = false,
  animateOnLoad = true,
  retryOnError = true,
  maxRetries = 3,
  fallbackMessage = 'Chart data is temporarily unavailable',
  loadingComponent,
  errorComponent,
  className,
  onError,
  onDataLoad,
  onPointClick,
}) => {
  const [state, setState] = useState<ChartState>({
    isLoading: false,
    error: null,
    retryCount: 0,
    validatedData: [],
    zoomLevel: 1,
    panOffset: { x: 0, y: 0 },
  });

  const _svgRef = useRef<SVGSVGElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    point: ChartDataPoint;
    series: ChartSeries;
    position: { x: number; y: number };
  } | null>(null);

  // Validate and process data
  useEffect(() => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const _validation = validateChartData(data);

      if (!validation.isValid) {
        const _error: ChartError = {
          type: 'validation',
          message: `Data validation failed: ${validation.errors.join(', ')}`,
          details: validation.errors,
          timestamp: new Date(),
        };

        setState(prev => ({
          ...prev,
          isLoading: false,
          error,
          validatedData: sanitizeData(data), // Try to salvage what we can
        }));

        onError?.(error);
        return;
      }

      const _validatedData = sanitizeData(data);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        validatedData,
        retryCount: 0,
      }));

      onDataLoad?.(validatedData);
    } catch (error) {
      const _chartError: ChartError = {
        type: 'data',
        message: error instanceof Error ? error.message : 'Unknown data processing error',
        details: error,
        timestamp: new Date(),
      };

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: chartError,
      }));

      onError?.(chartError);
    }
  }, [data, onError, onDataLoad]);

  // Retry mechanism
  const _handleRetry = () => {
    if (state.retryCount >= maxRetries) return;

    setState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      error: null,
      isLoading: true,
    }));

    // Simulate retry delay
    setTimeout(() => {
      try {
        const _validatedData = sanitizeData(data);
        setState(prev => ({
          ...prev,
          isLoading: false,
          validatedData,
        }));
      } catch (error) {
        const _chartError: ChartError = {
          type: 'data',
          message: 'Retry failed',
          details: error,
          timestamp: new Date(),
        };

        setState(prev => ({
          ...prev,
          isLoading: false,
          error: chartError,
        }));
      }
    }, 1000);
  };

  const _scales = useMemo(
    () => calculateScales(state.validatedData, width, height),
    [state.validatedData, width, height]
  );

  const _handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!showTooltip || state.validatedData.length === 0) return;

    const _svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const _x = event.clientX - svgRect.left;
    const _y = event.clientY - svgRect.top;

    // Find closest point
    let _closestPoint: ChartDataPoint | null = null;
    let _closestSeries: ChartSeries | null = null;
    let _minDistance = Infinity;

    state.validatedData.forEach(series => {
      if (!series.visible) return;

      series.data.forEach(point => {
        try {
          const _pointX = scales.xScale(typeof point.x === 'number' ? point.x : 0);
          const _pointY = scales.yScale(point.y);
          const _distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);

          if (distance < minDistance && distance < 20) {
            minDistance = distance;
            closestPoint = point;
            closestSeries = series;
          }
        } catch (error) {
          // Silently ignore invalid points
        }
      });
    });

    if (closestPoint && closestSeries) {
      setHoveredPoint({
        point: closestPoint,
        series: closestSeries,
        position: { x, y },
      });
    } else {
      setHoveredPoint(null);
    }
  };

  const _variantClasses = {
    default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    cyber:
      'bg-slate-900/95 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20 backdrop-blur-md',
    minimal: 'bg-gray-50 border border-gray-100 rounded-md',
    professional: 'bg-white border border-gray-300 rounded-xl shadow-lg',
  };

  // Loading state
  if (state.isLoading) {
    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={cn('flex items-center justify-center', variantClasses[variant], className)}
        style={{ width, height }}
      >
        {loadingComponent || (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex flex-col items-center space-y-3'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div
              className={cn(
                'animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full',
                variant === 'cyber' ? 'text-cyan-400' : 'text-blue-500'
              )}
            />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className={cn('text-sm', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-600')}>
              Loading chart data...
            </div>
          </div>
        )}
      </div>
    );
  }

  // Error state
  if (state.error && state.validatedData.length === 0) {
    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={cn(
          'flex flex-col items-center justify-center p-6',
          variantClasses[variant],
          className
        )}
        style={{ width, height }}
      >
        {errorComponent || (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-4xl mb-3'>📊</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div
              className={cn(
                'text-lg font-medium mb-2',
                variant === 'cyber' ? 'text-red-300' : 'text-red-600'
              )}
            >
              Chart Error
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div
              className={cn(
                'text-sm text-center mb-4',
                variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600'
              )}
            >
              {state.error.message || fallbackMessage}
            </div>
            {retryOnError && state.retryCount < maxRetries && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <button
                onClick={handleRetry}
                className={cn(
                  'px-4 py-2 text-sm rounded transition-colors',
                  variant === 'cyber'
                    ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                )}
              >
                Retry ({maxRetries - state.retryCount} attempts left)
              </button>
            )}
          </>
        )}
      </div>
    );
  }

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
          {state.error && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div
              className={cn(
                'text-xs mt-1 flex items-center space-x-1',
                variant === 'cyber' ? 'text-yellow-300' : 'text-yellow-600'
              )}
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span>⚠️</span>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span>Showing partial data due to errors</span>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='p-4'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <svg
          ref={svgRef}
          width={width}
          height={height}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
          className='overflow-visible'
        >
          {/* Grid */}
          {showGrid && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <g className='opacity-30'>
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
                  />
                );
              })}

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
                  />
                );
              })}
            </g>
          )}

          {/* Series */}
          {state.validatedData
            .filter(s => s.visible)
            .map(series => {
              const _path = createSafePath(series.data, scales.xScale, scales.yScale);

              return (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <g key={series.id}>
                  {/* Area fill */}
                  {(series.type === 'area' || type === 'area') && path && (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <path
                      // @ts-expect-error TS(2345): Argument of type 'string | number | Date' is not a... Remove this comment to see the full error message
                      d={`${path} L ${scales.xScale(series.data[series.data.length - 1]?.x || 0)} ${height - 40} L ${scales.xScale(series.data[0]?.x || 0)} ${height - 40} Z`}
                      fill={series.color}
                      opacity={0.3}
                    />
                  )}

                  {/* Line */}
                  {path &&
                    (series.type === 'line' || series.type === 'area' || type === 'line') && (
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <path
                        d={path}
                        fill='none'
                        stroke={series.color}
                        strokeWidth='2'
                        className={animateOnLoad ? 'animate-draw-line' : ''}
                      />
                    )}

                  {/* Points */}
                  {series.data.map((point, index) => {
                    try {
                      const _x = scales.xScale(typeof point.x === 'number' ? point.x : index);
                      const _y = scales.yScale(point.y);

                      if (!isFinite(x) || !isFinite(y)) return null;

                      return (
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <circle
                          key={index}
                          cx={x}
                          cy={y}
                          r={series.type === 'scatter' ? 5 : 3}
                          fill={point.color || series.color}
                          stroke='white'
                          strokeWidth='1'
                          className='cursor-pointer hover:r-6 transition-all'
                          onClick={() => onPointClick?.(point, series)}
                        />
                      );
                    } catch (error) {
                      return null; // Skip invalid points
                    }
                  })}
                </g>
              );
            })}

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
            <line x1={40} y1={40} x2={40} y2={height - 40} stroke='currentColor' strokeWidth='2' />

            {/* Axis labels */}
            {xAxisLabel && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <text
                x={width / 2}
                y={height - 10}
                textAnchor='middle'
                className='text-sm fill-current'
              >
                {xAxisLabel}
              </text>
            )}

            {yAxisLabel && (
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
            )}
          </g>
        </svg>

        {/* Tooltip */}
        {showTooltip && hoveredPoint && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn(
              'absolute pointer-events-none z-10 p-2 rounded shadow-lg border text-sm',
              variant === 'cyber'
                ? 'bg-slate-800 border-cyan-500/30 text-cyan-300'
                : 'bg-white border-gray-200 text-gray-900'
            )}
            style={{
              left: hoveredPoint.position.x + 10,
              top: hoveredPoint.position.y - 10,
            }}
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='font-medium'>{hoveredPoint.series.name}</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>Value: {hoveredPoint.point.y}</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            {hoveredPoint.point.label && <div>{hoveredPoint.point.label}</div>}
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && state.validatedData.length > 1 && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'p-4 border-t',
            variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
          )}
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex flex-wrap gap-4'>
            {state.validatedData.map(series => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div key={series.id} className='flex items-center space-x-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='w-4 h-2 rounded' style={{ backgroundColor: series.color }} />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span
                  className={cn('text-sm', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-700')}
                >
                  {series.name}
                </span>
              </div>
            ))}
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
