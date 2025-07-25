import React, { useState, useEffect, useRef } from 'react';
// @ts-expect-error TS(2307): Cannot find module '@/lib/utils' or its correspond... Remove this comment to see the full error message
import { cn } from '@/lib/utils';

// Enhanced types for chart-specific functionality
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

const _defaultConfig: ChartConfig = {
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

const _getThemeColors = (variant: string, theme: string) => {
  const _themes = {
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
      grid: '#374151',
      accent: '#a855f7',
    },
  };

  if (variant === 'cyber') return themes.cyber;
  return themes[theme as keyof typeof themes] || themes.light;
};

const _calculateChartScales = (
  series: ChartSeries[],
  bands: ChartConfidenceBand[],
  config: ChartConfig
) => {
  const _allPoints = [
    ...series.flatMap(s => s.data),
    ...bands.flatMap(b => [...b.upperBound, ...b.lowerBound]),
  ];

  if (allPoints.length === 0) {
    return {
      xScale: (x: number) => config.padding.left,
      yScale: (y: number) => config.height - config.padding.bottom,
      xMin: 0,
      xMax: 1,
      yMin: 0,
      yMax: 1,
    };
  }

  const _xMin = Math.min(...allPoints.map(p => p.x));
  const _xMax = Math.max(...allPoints.map(p => p.x));
  const _yMin = Math.min(...allPoints.map(p => p.y));
  const _yMax = Math.max(...allPoints.map(p => p.y));

  const _xRange = xMax - xMin || 1;
  const _yRange = yMax - yMin || 1;

  const _chartWidth = config.width - config.padding.left - config.padding.right;
  const _chartHeight = config.height - config.padding.top - config.padding.bottom;

  return {
    xScale: (x: number) => ((x - xMin) / xRange) * chartWidth + config.padding.left,
    yScale: (y: number) =>
      config.height - config.padding.bottom - ((y - yMin) / yRange) * chartHeight,
    xMin,
    xMax,
    yMin,
    yMax,
  };
};

const _formatAxisValue = (value: number, precision: number = 2): string => {
  if (Math.abs(value) >= 1e9) return (value / 1e9).toFixed(1) + 'B';
  if (Math.abs(value) >= 1e6) return (value / 1e6).toFixed(1) + 'M';
  if (Math.abs(value) >= 1e3) return (value / 1e3).toFixed(1) + 'K';
  return value.toFixed(precision);
};

const _createSmoothPath = (
  points: ChartDataPoint[],
  xScale: (x: number) => number,
  yScale: (y: number) => number
): string => {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const _x = xScale(points[0].x);
    const _y = yScale(points[0].y);
    return `M ${x} ${y}`;
  }

  let _path = '';
  for (let _i = 0; i < points.length; i++) {
    const _x = xScale(points[i].x);
    const _y = yScale(points[i].y);

    if (i === 0) {
      path += `M ${x} ${y}`;
    } else {
      // Create smooth curves using quadratic bezier
      const _prevX = xScale(points[i - 1].x);
      const _prevY = yScale(points[i - 1].y);
      const _cpX = (prevX + x) / 2;
      path += ` Q ${cpX} ${prevY} ${x} ${y}`;
    }
  }
  return path;
};

export const _ConfidenceBandChart: React.FC<ConfidenceBandChartProps> = ({
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
  const _svgRef = useRef<SVGSVGElement>(null);
  const [config, setConfig] = useState<ChartConfig>({
    ...defaultConfig,
    ...userConfig,
  });
  const [hoveredElement, setHoveredElement] = useState<{
    type: 'point' | 'band' | 'series';
    data: unknown;
    position: { x: number; y: number };
  } | null>(null);
  const [zoomState, setZoomState] = useState<{
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  } | null>(null);

  const _themeColors = getThemeColors(variant, theme);
  const _scales = calculateChartScales(series, confidenceBands, config);

  // Responsive handling
  useEffect(() => {
    if (!config.responsive) return;

    const _handleResize = () => {
      const _container = svgRef.current?.parentElement;
      if (container) {
        const { width } = container.getBoundingClientRect();
        setConfig(prev => ({
          ...prev,
          width: Math.max(400, width - 40),
        }));
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [config.responsive]);

  const _handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!config.showTooltip) return;

    const _svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const _x = event.clientX - svgRect.left;
    const _y = event.clientY - svgRect.top;

    // Find closest data point
    let _closestPoint: ChartDataPoint | null = null;
    let _closestSeries: ChartSeries | null = null;
    let _minDistance = Infinity;

    series.forEach(s => {
      if (!s.visible) return;
      s.data.forEach(point => {
        const _pointX = scales.xScale(point.x);
        const _pointY = scales.yScale(point.y);
        const _distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);

        if (distance < minDistance && distance < 20) {
          minDistance = distance;
          closestPoint = point;
          closestSeries = s;
        }
      });
    });

    if (closestPoint && closestSeries) {
      setHoveredElement({
        type: 'point',
        data: { point: closestPoint, series: closestSeries },
        position: { x, y },
      });
    } else {
      setHoveredElement(null);
    }
  };

  const _exportChart = (format: 'png' | 'svg' | 'pdf' | 'csv') => {
    if (format === 'svg' && svgRef.current) {
      const _svgData = new XMLSerializer().serializeToString(svgRef.current);
      const _blob = new Blob([svgData], { type: 'image/svg+xml' });
      const _url = URL.createObjectURL(blob);
      const _link = document.createElement('a');
      link.href = url;
      link.download = 'confidence-band-chart.svg';
      link.click();
      URL.revokeObjectURL(url);
    }
    onExport?.(format);
  };

  const _variantClasses = {
    default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    cyber:
      'bg-slate-900/95 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20 backdrop-blur-md',
    financial: 'bg-gray-900 border border-green-500/30 rounded-lg shadow-xl',
    scientific: 'bg-white border border-blue-300 rounded-lg shadow-lg',
    minimal: 'bg-gray-50 border border-gray-200 rounded-md',
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className={cn('relative', variantClasses[variant], className)}>
      {/* Header */}
      {(title || subtitle) && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'p-4 border-b',
            variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
          )}
        >
          {title && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3
              className={cn(
                'text-lg font-semibold',
                variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
              )}
            >
              {title}
            </h3>
          )}
          {subtitle && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <p
              className={cn(
                'text-sm mt-1',
                variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600'
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Controls */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={cn(
          'flex items-center justify-between p-3 border-b text-sm',
          variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
        )}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center space-x-3'>
          {/* Series toggles */}
          {series.map(s => (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <label key={s.id} className='flex items-center space-x-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <input
                type='checkbox'
                checked={s.visible !== false}
                onChange={e => {
                  const _newSeries = series.map(series =>
                    series.id === s.id ? { ...series, visible: e.target.checked } : series
                  );
                  // Would need to update series through props
                }}
                className='rounded'
              />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span style={{ color: s.color }}>{s.name}</span>
            </label>
          ))}
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center space-x-2'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <button
            onClick={() => exportChart('svg')}
            className={cn(
              'px-2 py-1 text-xs rounded transition-colors',
              variant === 'cyber'
                ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            Export
          </button>
        </div>
      </div>

      {/* Chart */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='p-4'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <svg
          ref={svgRef}
          width={config.width}
          height={config.height}
          style={{ backgroundColor: themeColors.background }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredElement(null)}
          className='overflow-visible'
        >
          {/* Grid */}
          {config.showGrid && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <g className='opacity-30'>
              {/* Vertical grid lines */}
              {Array.from({ length: 8 }, (_, i) => {
                const _x =
                  config.padding.left +
                  (i * (config.width - config.padding.left - config.padding.right)) / 7;
                return (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <line
                    key={`v-grid-${i}`}
                    x1={x}
                    y1={config.padding.top}
                    x2={x}
                    y2={config.height - config.padding.bottom}
                    stroke={themeColors.grid}
                    strokeWidth='1'
                  />
                );
              })}

              {/* Horizontal grid lines */}
              {Array.from({ length: 6 }, (_, i) => {
                const _y =
                  config.padding.top +
                  (i * (config.height - config.padding.top - config.padding.bottom)) / 5;
                return (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <line
                    key={`h-grid-${i}`}
                    x1={config.padding.left}
                    y1={y}
                    x2={config.width - config.padding.right}
                    y2={y}
                    stroke={themeColors.grid}
                    strokeWidth='1'
                  />
                );
              })}
            </g>
          )}

          {/* Confidence Bands */}
          {confidenceBands.map((band, index) => {
            const _upperPath = createSmoothPath(band.upperBound, scales.xScale, scales.yScale);
            const _lowerPath = createSmoothPath(
              band.lowerBound.slice().reverse(),
              scales.xScale,
              scales.yScale
            );
            const _areaPath = `${upperPath} L ${lowerPath.slice(1)} Z`;

            return (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <g key={`band-${band.level}`}>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <path
                  d={areaPath}
                  fill={band.color || `rgba(59, 130, 246, ${0.1 + index * 0.05})`}
                  stroke={band.color || `rgba(59, 130, 246, ${0.3 + index * 0.1})`}
                  strokeWidth='1'
                  opacity={band.opacity || 0.7}
                  className='transition-all duration-300'
                />

                {/* Band borders */}
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <path
                  d={upperPath}
                  fill='none'
                  stroke={band.color || `rgba(59, 130, 246, 0.5)`}
                  strokeWidth='1'
                  strokeDasharray={
                    band.pattern === 'dashed' ? '5,5' : band.pattern === 'dotted' ? '2,2' : '0'
                  }
                />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <path
                  d={createSmoothPath(band.lowerBound, scales.xScale, scales.yScale)}
                  fill='none'
                  stroke={band.color || `rgba(59, 130, 246, 0.5)`}
                  strokeWidth='1'
                  strokeDasharray={
                    band.pattern === 'dashed' ? '5,5' : band.pattern === 'dotted' ? '2,2' : '0'
                  }
                />
              </g>
            );
          })}

          {/* Series */}
          {series
            .filter(s => s.visible !== false)
            .map(s => {
              const _path = createSmoothPath(s.data, scales.xScale, scales.yScale);

              return (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <g key={s.id}>
                  {s.type === 'area' && (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <path
                      d={`${path} L ${scales.xScale(s.data[s.data.length - 1]?.x || 0)} ${config.height - config.padding.bottom} L ${scales.xScale(s.data[0]?.x || 0)} ${config.height - config.padding.bottom} Z`}
                      fill={s.color}
                      opacity={s.opacity || 0.3}
                    />
                  )}

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <path
                    d={path}
                    fill='none'
                    stroke={s.color}
                    strokeWidth={s.strokeWidth || 2}
                    opacity={s.opacity || 1}
                    className='transition-all duration-300'
                  />

                  {(s.type === 'scatter' || s.type === 'line') &&
                    s.data.map((point, index) => (
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <circle
                        key={`${s.id}-point-${index}`}
                        cx={scales.xScale(point.x)}
                        cy={scales.yScale(point.y)}
                        r={s.type === 'scatter' ? 4 : 2}
                        fill={s.color}
                        stroke='white'
                        strokeWidth='1'
                        className='cursor-pointer hover:r-6 transition-all'
                        onClick={() => onPointClick?.(point, s)}
                      />
                    ))}
                </g>
              );
            })}

          {/* Annotations */}
          {annotations.map(annotation => (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <g key={annotation.id}>
              {annotation.type === 'vertical' && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <line
                  x1={scales.xScale(annotation.value as number)}
                  y1={config.padding.top}
                  x2={scales.xScale(annotation.value as number)}
                  y2={config.height - config.padding.bottom}
                  stroke={annotation.color || themeColors.accent}
                  strokeWidth='2'
                  strokeDasharray={annotation.style === 'dashed' ? '5,5' : '0'}
                />
              )}

              {annotation.type === 'horizontal' && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <line
                  x1={config.padding.left}
                  y1={scales.yScale(annotation.value as number)}
                  x2={config.width - config.padding.right}
                  y2={scales.yScale(annotation.value as number)}
                  stroke={annotation.color || themeColors.accent}
                  strokeWidth='2'
                  strokeDasharray={annotation.style === 'dashed' ? '5,5' : '0'}
                />
              )}

              {annotation.label && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <text
                  x={
                    annotation.type === 'vertical'
                      ? scales.xScale(annotation.value as number) + 5
                      : config.padding.left + 5
                  }
                  y={
                    annotation.type === 'horizontal'
                      ? scales.yScale(annotation.value as number) - 5
                      : config.padding.top + 15
                  }
                  fill={themeColors.text}
                  fontSize='12'
                  className='font-medium'
                >
                  {annotation.label}
                </text>
              )}
            </g>
          ))}

          {/* Axes */}
          {config.showAxes && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <g>
              {/* X-axis */}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <line
                x1={config.padding.left}
                y1={config.height - config.padding.bottom}
                x2={config.width - config.padding.right}
                y2={config.height - config.padding.bottom}
                stroke={themeColors.text}
                strokeWidth='2'
              />

              {/* Y-axis */}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <line
                x1={config.padding.left}
                y1={config.padding.top}
                x2={config.padding.left}
                y2={config.height - config.padding.bottom}
                stroke={themeColors.text}
                strokeWidth='2'
              />

              {/* Axis labels */}
              {xAxisLabel && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <text
                  x={config.width / 2}
                  y={config.height - 20}
                  textAnchor='middle'
                  fill={themeColors.text}
                  fontSize='14'
                  className='font-medium'
                >
                  {xAxisLabel}
                </text>
              )}

              {yAxisLabel && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <text
                  x={20}
                  y={config.height / 2}
                  textAnchor='middle'
                  transform={`rotate(-90, 20, ${config.height / 2})`}
                  fill={themeColors.text}
                  fontSize='14'
                  className='font-medium'
                >
                  {yAxisLabel}
                </text>
              )}
            </g>
          )}

          {/* Axis ticks and labels */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <g fill={themeColors.text} fontSize='12'>
            {/* X-axis ticks */}
            {Array.from({ length: 8 }, (_, i) => {
              const _x =
                config.padding.left +
                (i * (config.width - config.padding.left - config.padding.right)) / 7;
              const _value = scales.xMin + (i * (scales.xMax - scales.xMin)) / 7;
              return (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <g key={`x-tick-${i}`}>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <line
                    x1={x}
                    y1={config.height - config.padding.bottom}
                    x2={x}
                    y2={config.height - config.padding.bottom + 5}
                    stroke={themeColors.text}
                  />
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <text x={x} y={config.height - config.padding.bottom + 18} textAnchor='middle'>
                    {formatAxisValue(value, precision)}
                  </text>
                </g>
              );
            })}

            {/* Y-axis ticks */}
            {Array.from({ length: 6 }, (_, i) => {
              const _y =
                config.height -
                config.padding.bottom -
                (i * (config.height - config.padding.top - config.padding.bottom)) / 5;
              const _value = scales.yMin + (i * (scales.yMax - scales.yMin)) / 5;
              return (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <g key={`y-tick-${i}`}>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <line
                    x1={config.padding.left - 5}
                    y1={y}
                    x2={config.padding.left}
                    y2={y}
                    stroke={themeColors.text}
                  />
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <text x={config.padding.left - 10} y={y + 4} textAnchor='end'>
                    {formatAxisValue(value, precision)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Tooltip */}
        {hoveredElement && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn(
              'absolute pointer-events-none z-10 p-3 rounded-lg shadow-lg border text-sm max-w-xs',
              variant === 'cyber'
                ? 'bg-slate-800 border-cyan-500/30 text-cyan-300'
                : 'bg-white border-gray-200 text-gray-900'
            )}
            style={{
              left: hoveredElement.position.x + 10,
              top: hoveredElement.position.y - 10,
            }}
          >
            {hoveredElement.type === 'point' && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='font-medium text-base'>{hoveredElement.data.series.name}</div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>X: {formatAxisValue(hoveredElement.data.point.x, precision)}</div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>Y: {formatAxisValue(hoveredElement.data.point.y, precision)}</div>
                {hoveredElement.data.point.timestamp && (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-xs opacity-70 mt-1'>
                    {hoveredElement.data.point.timestamp.toLocaleString()}
                  </div>
                )}
                {hoveredElement.data.point.label && (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-xs mt-1'>{hoveredElement.data.point.label}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

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
