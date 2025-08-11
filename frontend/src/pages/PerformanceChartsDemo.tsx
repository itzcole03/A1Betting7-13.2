/**
 * Performance Charts Demo Page
 * Phase 3: Advanced UI Features - Performance comparison charts showcase
 */

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Target, Activity, Award, Zap } from 'lucide-react';
import AdvancedPerformanceCharts, { PerformanceMetric, ChartDataPoint, ChartConfig } from '../components/charts/AdvancedPerformanceCharts';

const PerformanceChartsDemo: React.FC = () => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock performance metrics
  const performanceMetrics: PerformanceMetric[] = [
    {
      id: 'roi',
      name: 'Return on Investment',
      value: 15.7,
      change: 2.3,
      changePercent: 17.2,
      color: '#10B981',
      unit: '%',
      format: 'percentage',
      benchmark: 12.0,
      target: 15.0
    },
    {
      id: 'total_profit',
      name: 'Total Profit',
      value: 2547.83,
      change: 347.21,
      changePercent: 15.8,
      color: '#3B82F6',
      unit: '',
      format: 'currency',
      benchmark: 2000.00,
      target: 3000.00
    },
    {
      id: 'win_rate',
      name: 'Win Rate',
      value: 67.5,
      change: -1.2,
      changePercent: -1.7,
      color: '#8B5CF6',
      unit: '%',
      format: 'percentage',
      benchmark: 65.0,
      target: 70.0
    },
    {
      id: 'avg_odds',
      name: 'Average Odds',
      value: 1.85,
      change: 0.05,
      changePercent: 2.8,
      color: '#F59E0B',
      unit: '',
      format: 'decimal',
      benchmark: 1.80,
      target: 1.90
    },
    {
      id: 'sharpe_ratio',
      name: 'Sharpe Ratio',
      value: 1.42,
      change: 0.18,
      changePercent: 14.5,
      color: '#EF4444',
      unit: '',
      format: 'decimal',
      benchmark: 1.20,
      target: 1.50
    },
    {
      id: 'max_drawdown',
      name: 'Max Drawdown',
      value: -8.3,
      change: 2.1,
      changePercent: -20.2,
      color: '#6B7280',
      unit: '%',
      format: 'percentage',
      benchmark: -10.0,
      target: -5.0
    }
  ];

  // Generate mock chart data
  useEffect(() => {
    const generateMockData = () => {
      const data: ChartDataPoint[] = [];
      const now = Date.now();
      const days = 90;

      for (let i = days; i >= 0; i--) {
        const date = new Date(now - (i * 24 * 60 * 60 * 1000));
        const timestamp = date.getTime();
        
        // Generate realistic performance data with trends
        const baseROI = 12 + Math.sin(i / 10) * 3 + (Math.random() - 0.5) * 2;
        const baseProfit = 1500 + (days - i) * 15 + Math.sin(i / 15) * 200 + (Math.random() - 0.5) * 100;
        const baseWinRate = 65 + Math.cos(i / 8) * 5 + (Math.random() - 0.5) * 3;
        const baseOdds = 1.80 + Math.sin(i / 12) * 0.1 + (Math.random() - 0.5) * 0.05;
        const baseSharpe = 1.20 + (days - i) * 0.003 + (Math.random() - 0.5) * 0.1;
        const baseDrawdown = -15 + Math.cos(i / 20) * 5 + (Math.random() - 0.5) * 2;

        data.push({
          date: date.toISOString().split('T')[0],
          timestamp,
          metrics: {
            roi: Math.max(0, baseROI),
            total_profit: Math.max(0, baseProfit),
            win_rate: Math.min(100, Math.max(0, baseWinRate)),
            avg_odds: Math.max(1.1, baseOdds),
            sharpe_ratio: Math.max(0, baseSharpe),
            max_drawdown: Math.min(0, baseDrawdown)
          },
          metadata: {
            trades_count: Math.floor(Math.random() * 20) + 5,
            volume: Math.floor(Math.random() * 10000) + 1000
          }
        });
      }

      setChartData(data);
      setIsLoading(false);
    };

    generateMockData();
  }, []);

  const handleConfigChange = (config: ChartConfig) => {
    console.log('Chart configuration changed:', config);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <span>Performance Comparison Charts</span>
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Phase 3: Interactive performance visualization and analysis
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Phase 3 Status</p>
                  <p className="text-lg font-semibold text-green-600">Charts Complete</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {performanceMetrics.map((metric) => (
            <div key={metric.id} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 truncate">{metric.name}</h3>
                {metric.change > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <Activity className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold" style={{ color: metric.color }}>
                  {metric.format === 'currency' ? `$${metric.value.toFixed(0)}` :
                   metric.format === 'percentage' ? `${metric.value.toFixed(1)}%` :
                   metric.value.toFixed(2)}
                </span>
                <span className={`text-xs ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.change > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Chart Component */}
        <div className="mb-8">
          <AdvancedPerformanceCharts
            data={chartData}
            metrics={performanceMetrics}
            onConfigChange={handleConfigChange}
            enableExport={true}
            enableFullscreen={true}
            className="h-auto"
          />
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={BarChart3}
            title="Multiple Chart Types"
            description="Line, bar, area, and comparison charts with real-time data"
            color="bg-blue-500"
          />
          <FeatureCard
            icon={Target}
            title="Benchmark Comparison"
            description="Compare performance against market benchmarks and targets"
            color="bg-green-500"
          />
          <FeatureCard
            icon={Activity}
            title="Interactive Controls"
            description="Customize timeframes, metrics, and visualization options"
            color="bg-purple-500"
          />
          <FeatureCard
            icon={Award}
            title="Performance Insights"
            description="AI-powered insights and recommendations based on trends"
            color="bg-orange-500"
          />
        </div>

        {/* Technical Features */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Zap className="w-5 h-5 text-yellow-500 mr-2" />
            Advanced Features Implemented
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Chart Capabilities</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Multi-metric overlay comparisons</li>
                <li>• Interactive timeline controls</li>
                <li>• Benchmark and target line overlays</li>
                <li>• Real-time data updates</li>
                <li>• Customizable aggregation methods</li>
                <li>• Fullscreen visualization mode</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Technical Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Responsive design with mobile support</li>
                <li>• Export-ready visualizations</li>
                <li>• Performance-optimized rendering</li>
                <li>• Configurable chart dimensions</li>
                <li>• Smart data aggregation</li>
                <li>• Advanced filtering options</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Feature Card Component
const FeatureCard: React.FC<{
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  color: string;
}> = ({ icon: Icon, title, description, color }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex items-center space-x-3 mb-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    </div>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default PerformanceChartsDemo;
