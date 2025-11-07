import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface PerformanceData {
  date: string;
  gameId: string;
  opponent: string;
  statValue: number;
  projectedValue?: number;
  gameResult: 'W' | 'L';
  homeAway: 'H' | 'A';
  additionalStats?: {
    [key: string]: number;
  };
}

interface PerformanceTrendsProps {
  playerName: string;
  statType: string;
  data: PerformanceData[];
  timeRange: 'L5' | 'L10' | 'L15' | 'L20' | 'L25' | 'season';
  showProjections?: boolean;
  showTrendLine?: boolean;
  onDataPointClick?: (dataPoint: PerformanceData) => void;
}

const PerformanceTrendsChart: React.FC<PerformanceTrendsProps> = ({
  playerName,
  statType,
  data,
  timeRange,
  showProjections = true,
  showTrendLine = true,
  onDataPointClick
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<PerformanceData | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'actual' | 'projected' | 'both'>('both');

  const chartData = useMemo(() => {
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate moving averages
    const movingAverage = (arr: number[], windowSize: number = 5) => {
      return arr.map((_, index) => {
        const start = Math.max(0, index - windowSize + 1);
        const subset = arr.slice(start, index + 1);
        return subset.reduce((sum, val) => sum + val, 0) / subset.length;
      });
    };

    const actualValues = sortedData.map(d => d.statValue);
    const projectedValues = sortedData.map(d => d.projectedValue || 0);
    const movingAvg = movingAverage(actualValues);

    return sortedData.map((item, index) => ({
      ...item,
      movingAverage: movingAvg[index],
      index
    }));
  }, [data]);

  const { maxValue, minValue, avgValue, trend } = useMemo(() => {
    const values = chartData.map(d => d.statValue);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Calculate trend (linear regression slope)
    const n = values.length;
    const sumX = n * (n - 1) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + (val * index), 0);
    const sumXX = n * (n - 1) * (2 * n - 1) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const trendDirection = slope > 0.01 ? 'up' : slope < -0.01 ? 'down' : 'stable';
    
    return {
      maxValue: max,
      minValue: min,
      avgValue: avg,
      trend: { slope, direction: trendDirection }
    };
  }, [chartData]);

  const svgHeight = 300;
  const svgWidth = 600;
  const padding = 40;

  const getYPosition = (value: number) => {
    const range = maxValue - minValue;
    const adjustedRange = range === 0 ? 1 : range;
    return svgHeight - padding - ((value - minValue) / adjustedRange) * (svgHeight - 2 * padding);
  };

  const getXPosition = (index: number) => {
    return padding + (index / (chartData.length - 1)) * (svgWidth - 2 * padding);
  };

  const generateTrendLine = () => {
    if (!showTrendLine || chartData.length < 2) return '';
    
    const firstX = getXPosition(0);
    const lastX = getXPosition(chartData.length - 1);
    const firstY = getYPosition(avgValue - (trend.slope * (chartData.length - 1) / 2));
    const lastY = getYPosition(avgValue + (trend.slope * (chartData.length - 1) / 2));
    
    return `M ${firstX} ${firstY} L ${lastX} ${lastY}`;
  };

  const generatePath = (values: number[], type: 'actual' | 'projected' = 'actual') => {
    if (values.length === 0) return '';
    
    const pathData = values.map((value, index) => {
      const x = getXPosition(index);
      const y = getYPosition(value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    return pathData;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTrendColor = () => {
    switch (trend.direction) {
      case 'up': return '#10b981';
      case 'down': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTrendIcon = () => {
    switch (trend.direction) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{playerName} Performance Trends</h3>
          <p className="text-sm text-gray-600">
            {statType} - {timeRange === 'season' ? 'Full Season' : `Last ${timeRange.slice(1)} Games`}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-semibold ${trend.direction === 'up' ? 'text-green-600' : trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
              Trend {getTrendIcon()}
            </span>
          </div>
          <select 
            className="px-3 py-1 border border-gray-300 rounded text-sm"
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
          >
            <option value="both">Actual + Projected</option>
            <option value="actual">Actual Only</option>
            <option value="projected">Projected Only</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chart */}
        <div className="lg:col-span-3">
          <div className="relative">
            <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="border border-gray-200 rounded-lg">
              {/* Grid Lines */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Average Line */}
              <line
                x1={padding}
                y1={getYPosition(avgValue)}
                x2={svgWidth - padding}
                y2={getYPosition(avgValue)}
                stroke="#6b7280"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.5"
              />
              
              {/* Trend Line */}
              {showTrendLine && (
                <path
                  d={generateTrendLine()}
                  fill="none"
                  stroke={getTrendColor()}
                  strokeWidth="2"
                  strokeDasharray="3,3"
                  opacity="0.7"
                />
              )}
              
              {/* Projected Values Line */}
              {showProjections && (selectedMetric === 'projected' || selectedMetric === 'both') && (
                <path
                  d={generatePath(chartData.map(d => d.projectedValue || 0))}
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  opacity="0.7"
                />
              )}
              
              {/* Actual Values Line */}
              {(selectedMetric === 'actual' || selectedMetric === 'both') && (
                <path
                  d={generatePath(chartData.map(d => d.statValue))}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                />
              )}
              
              {/* Data Points */}
              {chartData.map((dataPoint, index) => {
                const x = getXPosition(index);
                const actualY = getYPosition(dataPoint.statValue);
                const projectedY = dataPoint.projectedValue ? getYPosition(dataPoint.projectedValue) : null;
                
                return (
                  <g key={dataPoint.gameId}>
                    {/* Projected Point */}
                    {showProjections && projectedY && (selectedMetric === 'projected' || selectedMetric === 'both') && (
                      <circle
                        cx={x}
                        cy={projectedY}
                        r="4"
                        fill="#8b5cf6"
                        stroke="white"
                        strokeWidth="2"
                        opacity="0.7"
                      />
                    )}
                    
                    {/* Actual Point */}
                    {(selectedMetric === 'actual' || selectedMetric === 'both') && (
                      <motion.circle
                        cx={x}
                        cy={actualY}
                        r={hoveredPoint === dataPoint ? "8" : "6"}
                        fill={dataPoint.gameResult === 'W' ? '#10b981' : '#ef4444'}
                        stroke="white"
                        strokeWidth="2"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPoint(dataPoint)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        onClick={() => onDataPointClick?.(dataPoint)}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.3 }}
                      />
                    )}
                  </g>
                );
              })}
              
              {/* X-axis labels */}
              {chartData.map((dataPoint, index) => {
                if (index % Math.ceil(chartData.length / 6) === 0) {
                  const x = getXPosition(index);
                  return (
                    <text
                      key={`label-${index}`}
                      x={x}
                      y={svgHeight - 10}
                      textAnchor="middle"
                      className="text-xs fill-gray-500"
                    >
                      {formatDate(dataPoint.date)}
                    </text>
                  );
                }
                return null;
              })}
              
              {/* Y-axis labels */}
              {[minValue, avgValue, maxValue].map((value, index) => (
                <text
                  key={`y-label-${index}`}
                  x={15}
                  y={getYPosition(value) + 4}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  {value.toFixed(1)}
                </text>
              ))}
            </svg>
            
            {/* Hover Tooltip */}
            {hoveredPoint && (
              <motion.div
                className="absolute bg-gray-900 text-white p-3 rounded shadow-lg text-sm z-10 pointer-events-none"
                style={{
                  left: getXPosition(hoveredPoint.index) + 10,
                  top: getYPosition(hoveredPoint.statValue) - 80
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="font-semibold">{formatDate(hoveredPoint.date)}</div>
                <div className="text-gray-300">vs {hoveredPoint.opponent} ({hoveredPoint.homeAway})</div>
                <div className="text-white">
                  Actual: <span className="font-semibold">{hoveredPoint.statValue}</span>
                </div>
                {hoveredPoint.projectedValue && (
                  <div className="text-gray-300">
                    Projected: <span className="font-semibold">{hoveredPoint.projectedValue}</span>
                  </div>
                )}
                <div className={`text-sm ${hoveredPoint.gameResult === 'W' ? 'text-green-400' : 'text-red-400'}`}>
                  Team Result: {hoveredPoint.gameResult}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Stats Panel */}
        <div className="space-y-6">
          {/* Performance Summary */}
          <div>
            <h4 className="font-semibold mb-3">Performance Summary</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average:</span>
                <span className="font-semibold">{avgValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">High:</span>
                <span className="font-semibold text-green-600">{maxValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Low:</span>
                <span className="font-semibold text-red-600">{minValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Trend:</span>
                <span className={`font-semibold ${getTrendColor() === '#10b981' ? 'text-green-600' : getTrendColor() === '#ef4444' ? 'text-red-600' : 'text-gray-600'}`}>
                  {trend.direction === 'up' ? 'Improving' : trend.direction === 'down' ? 'Declining' : 'Stable'}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Form */}
          <div>
            <h4 className="font-semibold mb-3">Recent Form (L5)</h4>
            <div className="space-y-2">
              {chartData.slice(-5).map((game, index) => (
                <div key={game.gameId} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">vs {game.opponent}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{game.statValue}</span>
                    <div className={`w-2 h-2 rounded-full ${game.gameResult === 'W' ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div>
            <h4 className="font-semibold mb-3">Legend</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Actual Performance</span>
              </div>
              {showProjections && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span>Projected</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Win</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Loss</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTrendsChart;
