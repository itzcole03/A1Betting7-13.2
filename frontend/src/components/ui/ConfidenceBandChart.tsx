import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Enhanced types for chart-specific functionality
interface ChartDataPoint {
  x: number;
  y: number;
  timestamp?: Date;
  label?: string;
  metadata?: Record<string, any>;
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

const defaultConfig: ChartConfig = {
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

const getThemeColors = (variant: string, theme: string) => {
  const themes = {
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

const calculateChartScales = (
  series: ChartSeries[],
  bands: ChartConfidenceBand[],
  config: ChartConfig
) => {
  const allPoints = [
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

  const xMin = Math.min(...allPoints.map(p => p.x));
  const xMax = Math.max(...allPoints.map(p => p.x));
  const yMin = Math.min(...allPoints.map(p => p.y));
  const yMax = Math.max(...allPoints.map(p => p.y));

  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  const chartWidth = config.width - config.padding.left - config.padding.right;
  const chartHeight = config.height - config.padding.top - config.padding.bottom;

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

const formatAxisValue = (value: number, precision: number = 2): string => {
  if (Math.abs(value) >= 1e9) return (value / 1e9).toFixed(1) + 'B';
  if (Math.abs(value) >= 1e6) return (value / 1e6).toFixed(1) + 'M';
  if (Math.abs(value) >= 1e3) return (value / 1e3).toFixed(1) + 'K';
  return value.toFixed(precision);
};

const createSmoothPath = (
  points: ChartDataPoint[],
  xScale: (x: number) => number,
  yScale: (y: number) => number
): string => {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const x = xScale(points[0].x);
    const y = yScale(points[0].y);
    return `M ${x} ${y}`;
  }

  let path = '';
  for (let i = 0; i < points.length; i++) {
    const x = xScale(points[i].x);
    const y = yScale(points[i].y);

    if (i === 0) {
      path += `M ${x} ${y}`;
    } else {
      // Create smooth curves using quadratic bezier
      const prevX = xScale(points[i - 1].x);
      const prevY = yScale(points[i - 1].y);
      const cpX = (prevX + x) / 2;
      path += ` Q ${cpX} ${prevY} ${x} ${y}`;
    }
  }
  return path;
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
  const svgRef = useRef<SVGSVGElement>(null);
  const [config, setConfig] = useState<ChartConfig>({
    ...defaultConfig,
    ...userConfig,
  });
  const [hoveredElement, setHoveredElement] = useState<{
    type: 'point' | 'band' | 'series';
    data: any;
    position: { x: number; y: number };
  } | null>(null);
  const [zoomState, setZoomState] = useState<{
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  } | null>(null);

  const themeColors = getThemeColors(variant, theme);
  const scales = calculateChartScales(series, confidenceBands, config);

  // Responsive handling
  useEffect(() => {
    if (!config.responsive) return;

    const handleResize = () => {
      const container = svgRef.current?.parentElement;
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

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!config.showTooltip) return;

    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const x = event.clientX - svgRect.left;
    const y = event.clientY - svgRect.top;

    // Find closest data point
    let closestPoint: ChartDataPoint | null = null;
    let closestSeries: ChartSeries | null = null;
    let minDistance = Infinity;

    series.forEach(s => {
      if (!s.visible) return;
      s.data.forEach(point => {
        const pointX = scales.xScale(point.x);
        const pointY = scales.yScale(point.y);
        const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);

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

  const exportChart = (format: 'png' | 'svg' | 'pdf' | 'csv') => {
    if (format === 'svg' && svgRef.current) {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'confidence-band-chart.svg';
      link.click();
      URL.revokeObjectURL(url);
    }
    onExport?.(format);
  };

  const variantClasses = {
    default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    cyber:
      'bg-slate-900/95 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20 backdrop-blur-md',
    financial: 'bg-gray-900 border border-green-500/30 rounded-lg shadow-xl',
    scientific: 'bg-white border border-blue-300 rounded-lg shadow-lg',
    minimal: 'bg-gray-50 border border-gray-200 rounded-md',
  };

  return (
    <div className={cn('relative', variantClasses[variant], className)}>
      {/* Header */}
      {(title || subtitle) && (
        <div
          className={cn(
            'p-4 border-b',
            variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
          )}
        >
          {title && (
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
      <div
        className={cn(
          'flex items-center justify-between p-3 border-b text-sm',
          variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
        )}
      >
        <div className='flex items-center space-x-3'>
          {/* Series toggles */}
          {series.map(s => (
            <label key={s.id} className='flex items-center space-x-2'>
              <input
                type='checkbox'
                checked={s.visible !== false}
                onChange={e => {
                  const newSeries = series.map(series =>
                    series.id === s.id ? { ...series, visible: e.target.checked } : series
                  );
                  // Would need to update series through props
                }}
                className='rounded'
              />
              <span style={{ color: s.color }}>{s.name}</span>
            </label>
          ))}
        </div>

        <div className='flex items-center space-x-2'>
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
      <div className='p-4'>
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
            <g className='opacity-30'>
              {/* Vertical grid lines */}
              {Array.from({ length: 8 }, (_, i) => {
                const x =
                  config.padding.left +
                  (i * (config.width - config.padding.left - config.padding.right)) / 7;
                return (
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
                const y =
                  config.padding.top +
                  (i * (config.height - config.padding.top - config.padding.bottom)) / 5;
                return (
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
            const upperPath = createSmoothPath(band.upperBound, scales.xScale, scales.yScale);
            const lowerPath = createSmoothPath(
              band.lowerBound.slice().reverse(),
              scales.xScale,
              scales.yScale
            );
            const areaPath = `${upperPath} L ${lowerPath.slice(1)} Z`;

            return (
              <g key={`band-${band.level}`}>
                <path
                  d={areaPath}
                  fill={band.color || `rgba(59, 130, 246, ${0.1 + index * 0.05})`}
                  stroke={band.color || `rgba(59, 130, 246, ${0.3 + index * 0.1})`}
                  strokeWidth='1'
                  opacity={band.opacity || 0.7}
                  className='transition-all duration-300'
                />

                {/* Band borders */}
                <path
                  d={upperPath}
                  fill='none'
                  stroke={band.color || `rgba(59, 130, 246, 0.5)`}
                  strokeWidth='1'
                  strokeDasharray={
                    band.pattern === 'dashed' ? '5,5' : band.pattern === 'dotted' ? '2,2' : '0'
                  }
                />
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
              const path = createSmoothPath(s.data, scales.xScale, scales.yScale);

              return (
                <g key={s.id}>
                  {s.type === 'area' && (
                    <path
                      d={`${path} L ${scales.xScale(s.data[s.data.length - 1]?.x || 0)} ${config.height - config.padding.bottom} L ${scales.xScale(s.data[0]?.x || 0)} ${config.height - config.padding.bottom} Z`}
                      fill={s.color}
                      opacity={s.opacity || 0.3}
                    />
                  )}

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
            <g key={annotation.id}>
              {annotation.type === 'vertical' && (
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
            <g>
              {/* X-axis */}
              <line
                x1={config.padding.left}
                y1={config.height - config.padding.bottom}
                x2={config.width - config.padding.right}
                y2={config.height - config.padding.bottom}
                stroke={themeColors.text}
                strokeWidth='2'
              />

              {/* Y-axis */}
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
          <g fill={themeColors.text} fontSize='12'>
            {/* X-axis ticks */}
            {Array.from({ length: 8 }, (_, i) => {
              const x =
                config.padding.left +
                (i * (config.width - config.padding.left - config.padding.right)) / 7;
              const value = scales.xMin + (i * (scales.xMax - scales.xMin)) / 7;
              return (
                <g key={`x-tick-${i}`}>
                  <line
                    x1={x}
                    y1={config.height - config.padding.bottom}
                    x2={x}
                    y2={config.height - config.padding.bottom + 5}
                    stroke={themeColors.text}
                  />
                  <text x={x} y={config.height - config.padding.bottom + 18} textAnchor='middle'>
                    {formatAxisValue(value, precision)}
                  </text>
                </g>
              );
            })}

            {/* Y-axis ticks */}
            {Array.from({ length: 6 }, (_, i) => {
              const y =
                config.height -
                config.padding.bottom -
                (i * (config.height - config.padding.top - config.padding.bottom)) / 5;
              const value = scales.yMin + (i * (scales.yMax - scales.yMin)) / 5;
              return (
                <g key={`y-tick-${i}`}>
                  <line
                    x1={config.padding.left - 5}
                    y1={y}
                    x2={config.padding.left}
                    y2={y}
                    stroke={themeColors.text}
                  />
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
              <div>
                <div className='font-medium text-base'>{hoveredElement.data.series.name}</div>
                <div>X: {formatAxisValue(hoveredElement.data.point.x, precision)}</div>
                <div>Y: {formatAxisValue(hoveredElement.data.point.y, precision)}</div>
                {hoveredElement.data.point.timestamp && (
                  <div className='text-xs opacity-70 mt-1'>
                    {hoveredElement.data.point.timestamp.toLocaleString()}
                  </div>
                )}
                {hoveredElement.data.point.label && (
                  <div className='text-xs mt-1'>{hoveredElement.data.point.label}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

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
