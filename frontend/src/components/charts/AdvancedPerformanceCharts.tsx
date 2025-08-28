/**
 * Advanced Performance Comparison Charts
 * Phase 3: Advanced UI Features - Interactive performance visualization system
 * 
 * Features:
 * - Multi-metric comparison charts
 * - Interactive timeline controls
 * - Benchmarking against market averages
 * - Real-time performance tracking
 * - Customizable chart configurations
 * - Export-ready visualizations
 */

import React, { useState, useMemo, useCallback } from 'react';
import { BarChart3, LineChart, TrendingUp, TrendingDown, Activity, Download, Target, Maximize2, Eye } from 'lucide-react';

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  color: string;
  unit: string;
  format: 'currency' | 'percentage' | 'number' | 'decimal';
  benchmark?: number;
  target?: number;
}

export interface ChartDataPoint {
  date: string;
  timestamp: number;
  metrics: Record<string, number>;
  metadata?: Record<string, any>;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'scatter' | 'comparison';
  timeframe: '1d' | '7d' | '30d' | '90d' | '1y' | 'all';
  metrics: string[];
  showBenchmarks: boolean;
  showTargets: boolean;
  aggregation: 'sum' | 'avg' | 'max' | 'min' | 'last';
  smoothing: boolean;
  annotations: boolean;
}

// Top-level formatting helper used across chart components and tests
export function formatValue(value: number, format: string, unit: string): string {
  switch (format) {
    case 'currency':
      return `$${value.toFixed(2)}`;
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'decimal':
      return value.toFixed(3);
    default:
      return `${value.toFixed(1)}${unit ? ` ${unit}` : ''}`;
  }
}

interface AdvancedPerformanceChartsProps {
  data: ChartDataPoint[];
  metrics: PerformanceMetric[];
  onConfigChange?: (config: ChartConfig) => void;
  className?: string;
  enableExport?: boolean;
  enableFullscreen?: boolean;
}

const AdvancedPerformanceCharts: React.FC<AdvancedPerformanceChartsProps> = ({
  data,
  metrics,
  onConfigChange,
  className = '',
  enableExport = true,
  enableFullscreen = true
}) => {
  // State management
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    type: 'line',
    timeframe: '30d',
    metrics: metrics.slice(0, 3).map(m => m.id),
    showBenchmarks: true,
    showTargets: false,
    aggregation: 'last',
    smoothing: false,
    annotations: true
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(chartConfig.metrics);
  const [comparisonMode, setComparisonMode] = useState<'overlay' | 'separate' | 'stacked'>('overlay');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<ChartDataPoint | null>(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 800, height: 400 });

  // Filter data based on timeframe
  const filteredData = useMemo(() => {
    const now = Date.now();
    const timeframeDays = {
      '1d': 1,
      '7d': 7, 
      '30d': 30,
      '90d': 90,
      '1y': 365,
      'all': Infinity
    };

    const cutoffTime = now - (timeframeDays[chartConfig.timeframe] * 24 * 60 * 60 * 1000);
    return data.filter(point => point.timestamp >= cutoffTime);
  }, [data, chartConfig.timeframe]);

  // Calculate aggregated metrics
  const aggregatedMetrics = useMemo(() => {
    const result: Record<string, PerformanceMetric> = {};
    
    selectedMetrics.forEach(metricId => {
      const metric = metrics.find(m => m.id === metricId);
      if (!metric) return;

      const values = filteredData.map(point => point.metrics[metricId]).filter(v => v !== undefined);
      
      let aggregatedValue: number;
      switch (chartConfig.aggregation) {
        case 'sum':
          aggregatedValue = values.reduce((sum, val) => sum + val, 0);
          break;
        case 'avg':
          aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
          break;
        case 'max':
          aggregatedValue = Math.max(...values);
          break;
        case 'min':
          aggregatedValue = Math.min(...values);
          break;
        case 'last':
        default:
          aggregatedValue = values[values.length - 1] || 0;
          break;
      }

      result[metricId] = {
        ...metric,
        value: aggregatedValue
      };
    });

    return result;
  }, [filteredData, selectedMetrics, metrics, chartConfig.aggregation]);

  // Format values based on metric type (hoisted so chartData can use it)
  function formatValue(value: number, format: string, unit: string): string {
    switch (format) {
      case 'currency':
        return `$${value.toFixed(2)}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'decimal':
        return value.toFixed(3);
      default:
        return `${value.toFixed(1)}${unit ? ` ${unit}` : ''}`;
    }
  }

  // Generate chart data for visualization
  const chartData = useMemo(() => {
    return filteredData.map(point => {
      const chartPoint: any = {
        date: point.date,
        timestamp: point.timestamp,
        x: point.timestamp
      };

      selectedMetrics.forEach(metricId => {
        const metric = metrics.find(m => m.id === metricId);
        if (metric && point.metrics[metricId] !== undefined) {
          chartPoint[metricId] = point.metrics[metricId];
          chartPoint[`${metricId}_formatted`] = formatValue(point.metrics[metricId], metric.format, metric.unit);
        }
      });

      return chartPoint;
    });
  }, [filteredData, selectedMetrics, metrics]);

  // Update config and notify parent
  const updateConfig = useCallback((updates: Partial<ChartConfig>) => {
    const newConfig = { ...chartConfig, ...updates };
    setChartConfig(newConfig);
    onConfigChange?.(newConfig);
  }, [chartConfig, onConfigChange]);

  // (formatValue is declared above and hoisted so chartData and other helpers can use it)

  // Calculate performance insights
  const performanceInsights = useMemo(() => {
    const insights: Array<{ type: 'positive' | 'negative' | 'neutral'; message: string }> = [];
    
    Object.values(aggregatedMetrics).forEach(metric => {
      if (metric.benchmark && metric.value > metric.benchmark) {
        insights.push({
          type: 'positive',
          message: `${metric.name} is ${((metric.value / metric.benchmark - 1) * 100).toFixed(1)}% above benchmark`
        });
      } else if (metric.benchmark && metric.value < metric.benchmark * 0.9) {
        insights.push({
          type: 'negative',
          message: `${metric.name} is ${((1 - metric.value / metric.benchmark) * 100).toFixed(1)}% below benchmark`
        });
      }

      if (metric.target && metric.value >= metric.target) {
        insights.push({
          type: 'positive',
          message: `${metric.name} has reached target of ${formatValue(metric.target, metric.format, metric.unit)}`
        });
      }
    });

    return insights;
  }, [aggregatedMetrics]);

  return (
    <div className={`advanced-performance-charts bg-white rounded-lg shadow-lg ${isFullscreen ? 'fixed inset-4 z-50' : ''} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Performance Analysis</h2>
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
            {filteredData.length} data points
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => updateConfig({ annotations: !chartConfig.annotations })}
            className={`p-2 rounded-md ${chartConfig.annotations ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            title="Toggle annotations"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          {enableExport && (
            <button className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200">
              <Download className="w-4 h-4" />
            </button>
          )}
          
          {enableFullscreen && (
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex">
        {/* Controls Sidebar */}
        <div className="w-64 p-4 border-r border-gray-200 bg-gray-50">
          <ChartControls
            config={chartConfig}
            metrics={metrics}
            selectedMetrics={selectedMetrics}
            onConfigChange={updateConfig}
            onMetricsChange={setSelectedMetrics}
            comparisonMode={comparisonMode}
            onComparisonModeChange={setComparisonMode}
          />
        </div>

        {/* Main Chart Area */}
        <div className="flex-1 p-4">
          {/* Key Metrics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.values(aggregatedMetrics).map(metric => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>

          {/* Chart Visualization */}
          <div className="mb-6">
            <React.Suspense fallback={<div className="bg-gray-100 p-6 rounded">Loading chart...</div>}>
              {chartConfig.type === 'line' && (
                // Dynamically load PlayerPerformanceChart to provide an interactive visualization
                React.createElement(React.lazy(() => import('./PlayerPerformanceChart')) as any, {
                  data: chartData,
                  metrics: selectedMetrics,
                  metricConfigs: metrics,
                  height: chartDimensions.height
                })
              )}

              {chartConfig.type === 'bar' && (
                React.createElement(React.lazy(() => import('./PlayerPerformanceChart')) as any, {
                  data: chartData,
                  metrics: selectedMetrics,
                  metricConfigs: metrics,
                  height: chartDimensions.height
                })
              )}

              {chartConfig.type === 'comparison' && (
                React.createElement(React.lazy(() => import('./PlayerPerformanceChart')) as any, {
                  data: chartData,
                  metrics: selectedMetrics,
                  metricConfigs: metrics,
                  height: chartDimensions.height
                })
              )}
            </React.Suspense>
          </div>

          {/* Performance Insights */}
          {performanceInsights.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Performance Insights
              </h3>
              <div className="space-y-1">
                {performanceInsights.map((insight, index) => (
                  <div key={index} className={`text-sm flex items-center ${
                    insight.type === 'positive' ? 'text-green-700' : 
                    insight.type === 'negative' ? 'text-red-700' : 'text-blue-700'
                  }`}>
                    {insight.type === 'positive' ? <TrendingUp className="w-3 h-3 mr-1" /> :
                     insight.type === 'negative' ? <TrendingDown className="w-3 h-3 mr-1" /> :
                     <Activity className="w-3 h-3 mr-1" />}
                    {insight.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Chart Controls Component
const ChartControls: React.FC<{
  config: ChartConfig;
  metrics: PerformanceMetric[];
  selectedMetrics: string[];
  onConfigChange: (updates: Partial<ChartConfig>) => void;
  onMetricsChange: (metrics: string[]) => void;
  comparisonMode: string;
  onComparisonModeChange: (mode: any) => void;
}> = ({ config, metrics, selectedMetrics, onConfigChange, onMetricsChange, comparisonMode, onComparisonModeChange }) => {
  return (
    <div className="space-y-4">
      {/* Chart Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
        <select
          value={config.type}
          onChange={(e) => onConfigChange({ type: e.target.value as any })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="line">Line Chart</option>
          <option value="bar">Bar Chart</option>
          <option value="area">Area Chart</option>
          <option value="comparison">Comparison</option>
        </select>
      </div>

      {/* Timeframe */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
        <select
          value={config.timeframe}
          onChange={(e) => onConfigChange({ timeframe: e.target.value as any })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="1d">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="1y">Last Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Metrics Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Metrics</label>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {metrics.map(metric => (
            <label key={metric.id} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedMetrics.includes(metric.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onMetricsChange([...selectedMetrics, metric.id]);
                  } else {
                    onMetricsChange(selectedMetrics.filter(id => id !== metric.id));
                  }
                }}
                className="h-4 w-4 text-blue-600 rounded mr-2"
              />
              <span className="text-sm text-gray-700">{metric.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Display Options */}
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.showBenchmarks}
            onChange={(e) => onConfigChange({ showBenchmarks: e.target.checked })}
            className="h-4 w-4 text-blue-600 rounded mr-2"
          />
          <span className="text-sm text-gray-700">Show Benchmarks</span>
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.showTargets}
            onChange={(e) => onConfigChange({ showTargets: e.target.checked })}
            className="h-4 w-4 text-blue-600 rounded mr-2"
          />
          <span className="text-sm text-gray-700">Show Targets</span>
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.smoothing}
            onChange={(e) => onConfigChange({ smoothing: e.target.checked })}
            className="h-4 w-4 text-blue-600 rounded mr-2"
          />
          <span className="text-sm text-gray-700">Smooth Lines</span>
        </label>
      </div>

      {/* Aggregation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Aggregation</label>
        <select
          value={config.aggregation}
          onChange={(e) => onConfigChange({ aggregation: e.target.value as any })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="last">Latest Value</option>
          <option value="avg">Average</option>
          <option value="sum">Sum</option>
          <option value="max">Maximum</option>
          <option value="min">Minimum</option>
        </select>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard: React.FC<{ metric: PerformanceMetric }> = ({ metric }) => {

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{metric.name}</h3>
        {metric.change !== 0 && (
          metric.change > 0 ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )
        )}
      </div>
      
      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold" style={{ color: metric.color }}>
          {formatValue(metric.value, metric.format, metric.unit)}
        </span>
        {metric.change !== 0 && (
          <span className={`text-sm ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {metric.change > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
          </span>
        )}
      </div>

      {metric.benchmark && (
        <div className="mt-2 text-xs text-gray-500">
          Benchmark: {formatValue(metric.benchmark, metric.format, metric.unit)}
        </div>
      )}
    </div>
  );
};

// Simple chart visualization components (would use a real charting library in production)
const LineChartVisualization: React.FC<any> = ({ data, metrics, metricConfigs, config, dimensions }) => (
  <div className="bg-gray-100 rounded-lg p-4" style={{ height: dimensions.height }}>
    <div className="flex items-center justify-center h-full text-gray-600">
      <div className="text-center">
        <LineChart className="w-16 h-16 mx-auto mb-4 text-blue-500" />
        <p className="font-medium">Line Chart Visualization</p>
        <p className="text-sm">Showing {data.length} data points for {metrics.length} metrics</p>
        <p className="text-xs mt-2">Chart type: {config.type} | Timeframe: {config.timeframe}</p>
      </div>
    </div>
  </div>
);

const BarChartVisualization: React.FC<any> = ({ data, metrics, metricConfigs, config, dimensions }) => (
  <div className="bg-gray-100 rounded-lg p-4" style={{ height: dimensions.height }}>
    <div className="flex items-center justify-center h-full text-gray-600">
      <div className="text-center">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-green-500" />
        <p className="font-medium">Bar Chart Visualization</p>
        <p className="text-sm">Comparing {metrics.length} metrics</p>
        <p className="text-xs mt-2">Aggregation: {config.aggregation}</p>
      </div>
    </div>
  </div>
);

const ComparisonChartVisualization: React.FC<any> = ({ data, metrics, metricConfigs, config, mode, dimensions }) => (
  <div className="bg-gray-100 rounded-lg p-4" style={{ height: dimensions.height }}>
    <div className="flex items-center justify-center h-full text-gray-600">
      <div className="text-center">
        <Activity className="w-16 h-16 mx-auto mb-4 text-purple-500" />
        <p className="font-medium">Comparison Visualization</p>
        <p className="text-sm">Mode: {mode} | Metrics: {metrics.length}</p>
        <p className="text-xs mt-2">Benchmarks: {config.showBenchmarks ? 'Enabled' : 'Disabled'}</p>
      </div>
    </div>
  </div>
);

export default AdvancedPerformanceCharts;
