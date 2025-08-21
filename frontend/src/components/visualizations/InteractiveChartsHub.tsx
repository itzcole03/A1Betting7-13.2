import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  ResponsiveContainer,
  LineChart,
  Line as RechartsLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  BarChart,
  Bar as RechartsBar,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  RadialBarChart,
  RadialBar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  TrendingUp,
  Activity,
  Target,
  Zap,
  Brain,
  Download,
  RefreshCw,
  Settings,
  Eye,
  Calendar,
  Filter
} from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Mock data for various charts
const mockPerformanceData = {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
  datasets: [
    {
      label: 'Win Rate',
      data: [78, 82, 85, 79, 88, 92],
      borderColor: '#06ffa5',
      backgroundColor: 'rgba(6, 255, 165, 0.1)',
      fill: true,
      tension: 0.4,
    },
    {
      label: 'Expected Value',
      data: [12.5, 15.2, 18.7, 14.8, 22.1, 26.3],
      borderColor: '#00d4ff',
      backgroundColor: 'rgba(0, 212, 255, 0.1)',
      fill: true,
      tension: 0.4,
    }
  ]
};

const mockPropTypesData = {
  labels: ['Player Props', 'Team Props', 'Game Props', 'Live Props'],
  datasets: [
    {
      data: [45, 25, 20, 10],
      backgroundColor: ['#06ffa5', '#00d4ff', '#7c3aed', '#ff6b35'],
      borderWidth: 0,
    }
  ]
};

const mockPlayerStatsData = [
  { name: 'Mookie Betts', confidence: 92, edge: 15.2, volume: 1247, sport: 'MLB' },
  { name: 'Giannis A.', confidence: 88, edge: 12.8, volume: 892, sport: 'NBA' },
  { name: 'Josh Allen', confidence: 85, edge: 18.5, volume: 1456, sport: 'NFL' },
  { name: 'Connor McDavid', confidence: 90, edge: 14.7, volume: 743, sport: 'NHL' },
  { name: 'Juan Soto', confidence: 87, edge: 11.3, volume: 658, sport: 'MLB' },
  { name: 'Luka Dončić', confidence: 91, edge: 16.9, volume: 1023, sport: 'NBA' }
];

const mockTrendData = [
  { date: '2024-01-01', success: 78, profit: 245, bets: 12 },
  { date: '2024-01-02', success: 82, profit: 318, bets: 15 },
  { date: '2024-01-03', success: 79, profit: 267, bets: 11 },
  { date: '2024-01-04', success: 85, profit: 398, bets: 18 },
  { date: '2024-01-05', success: 88, profit: 445, bets: 16 },
  { date: '2024-01-06', success: 92, profit: 523, bets: 19 },
  { date: '2024-01-07', success: 89, profit: 478, bets: 17 }
];

const sportColors = {
  MLB: '#06ffa5',
  NBA: '#00d4ff',
  NFL: '#7c3aed',
  NHL: '#ff6b35'
};

const InteractiveChartsHub: React.FC = () => {
  const [selectedChart, setSelectedChart] = useState<'performance' | 'props' | 'players' | 'trends' | 'comparison'>('performance');
  const [chartLibrary, setChartLibrary] = useState<'chartjs' | 'recharts'>('chartjs');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const chartOptions = [
    { id: 'performance', label: 'Performance Analytics', icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
    { id: 'props', label: 'Prop Distribution', icon: PieChartIcon, color: 'from-blue-500 to-cyan-500' },
    { id: 'players', label: 'Player Analysis', icon: BarChart3, color: 'from-purple-500 to-violet-500' },
    { id: 'trends', label: 'Trend Analysis', icon: Activity, color: 'from-orange-500 to-red-500' },
    { id: 'comparison', label: 'Comparison View', icon: Target, color: 'from-pink-500 to-rose-500' }
  ];

  // Chart.js options
  const chartJsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e2e8f0',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Performance Analytics',
        color: '#e2e8f0',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#e2e8f0',
        bodyColor: '#e2e8f0',
        borderColor: '#06ffa5',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#94a3b8'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#94a3b8'
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#e2e8f0',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#e2e8f0',
        bodyColor: '#e2e8f0',
        borderColor: '#06ffa5',
        borderWidth: 1
      }
    }
  };

  return (
    <div className="interactive-charts-hub min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Interactive Analytics Hub
          </h1>
          <p className="text-slate-400">Advanced data visualization and insights dashboard</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Library Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Library:</span>
            <select
              value={chartLibrary}
              onChange={(e) => setChartLibrary(e.target.value as any)}
              className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="chartjs">Chart.js</option>
              <option value="recharts">Recharts</option>
            </select>
          </div>

          {/* Timeframe */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Timeframe:</span>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="90d">90 Days</option>
              <option value="1y">1 Year</option>
            </select>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 rounded-lg font-medium transition-all duration-200">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Chart Type Navigation */}
      <div className="flex flex-wrap gap-3 mb-8">
        {chartOptions.map(option => {
          const IconComponent = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => setSelectedChart(option.id as any)}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                selectedChart === option.id
                  ? `bg-gradient-to-r ${option.color} text-white shadow-lg shadow-${option.color.split('-')[1]}-500/25`
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <IconComponent className="w-5 h-5" />
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Chart Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${selectedChart}-${chartLibrary}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-[600px]"
        >
          {selectedChart === 'performance' && (
            <PerformanceCharts library={chartLibrary} options={chartJsOptions} />
          )}
          {selectedChart === 'props' && (
            <PropCharts library={chartLibrary} options={doughnutOptions} />
          )}
          {selectedChart === 'players' && (
            <PlayerCharts library={chartLibrary} data={mockPlayerStatsData} />
          )}
          {selectedChart === 'trends' && (
            <TrendCharts library={chartLibrary} data={mockTrendData} />
          )}
          {selectedChart === 'comparison' && (
            <ComparisonCharts library={chartLibrary} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Performance Charts Component
const PerformanceCharts: React.FC<{ library: string; options: any }> = ({ library, options }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-400" />
        Performance Trends
      </h3>
      <div className="h-80">
        {library === 'chartjs' ? (
          <Line data={mockPerformanceData} options={options} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  border: '1px solid #06ffa5',
                  borderRadius: '8px',
                  color: '#e2e8f0'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="success" 
                stroke="#06ffa5" 
                fill="rgba(6, 255, 165, 0.2)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>

    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-cyan-400" />
        Profit Analysis
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <RechartsTooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                border: '1px solid #00d4ff',
                borderRadius: '8px',
                color: '#e2e8f0'
              }}
            />
            <RechartsLine 
              type="monotone" 
              dataKey="profit" 
              stroke="#00d4ff" 
              strokeWidth={3}
              dot={{ fill: '#00d4ff', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

// Prop Charts Component
const PropCharts: React.FC<{ library: string; options: any }> = ({ library, options }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <PieChartIcon className="w-5 h-5 text-blue-400" />
        Prop Type Distribution
      </h3>
      <div className="h-80">
        {library === 'chartjs' ? (
          <Doughnut data={mockPropTypesData} options={options} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={mockPropTypesData.datasets[0].data.map((value, index) => ({
                  name: mockPropTypesData.labels[index],
                  value,
                  fill: mockPropTypesData.datasets[0].backgroundColor[index]
                }))}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                dataKey="value"
                label={(entry) => `${entry.name}: ${entry.value}%`}
              />
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>

    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Brain className="w-5 h-5 text-purple-400" />
        AI Confidence Levels
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="20%"
            outerRadius="80%"
            data={[
              { name: 'High', value: 45, fill: '#06ffa5' },
              { name: 'Medium', value: 35, fill: '#00d4ff' },
              { name: 'Low', value: 20, fill: '#7c3aed' }
            ]}
          >
            {/* Cast props to any to work around Recharts typing differences */}
            <RadialBar {...({ minAngle: 15, label: { position: 'insideStart', fill: '#fff' }, dataKey: 'value' } as any)} />
            <RechartsTooltip />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

// Player Charts Component
const PlayerCharts: React.FC<{ library: string; data: any[] }> = ({ library, data }) => (
  <div className="grid grid-cols-1 gap-6">
    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-purple-400" />
        Player Performance Comparison
      </h3>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <RechartsTooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                border: '1px solid #7c3aed',
                borderRadius: '8px',
                color: '#e2e8f0'
              }}
            />
            <RechartsBar dataKey="confidence" fill="#06ffa5" name="Confidence %" />
            <RechartsBar dataKey="edge" fill="#00d4ff" name="Edge %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-orange-400" />
        Confidence vs Edge Scatter
      </h3>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="confidence" stroke="#94a3b8" name="Confidence" />
            <YAxis dataKey="edge" stroke="#94a3b8" name="Edge" />
            <RechartsTooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                border: '1px solid #ff6b35',
                borderRadius: '8px',
                color: '#e2e8f0'
              }}
            />
            <Scatter dataKey="volume" fill="#ff6b35" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

// Trend Charts Component
const TrendCharts: React.FC<{ library: string; data: any[] }> = ({ library, data }) => (
  <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
      <Activity className="w-5 h-5 text-green-400" />
      Success Rate & Betting Volume Trends
    </h3>
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="date" stroke="#94a3b8" />
          <YAxis yAxisId="left" stroke="#94a3b8" />
          <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
          <RechartsTooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.9)', 
              border: '1px solid #06ffa5',
              borderRadius: '8px',
              color: '#e2e8f0'
            }}
          />
          <RechartsLegend />
          <RechartsLine 
            yAxisId="left"
            type="monotone" 
            dataKey="success" 
            stroke="#06ffa5" 
            strokeWidth={3}
            name="Success Rate %"
          />
          <RechartsLine 
            yAxisId="right"
            type="monotone" 
            dataKey="bets" 
            stroke="#00d4ff" 
            strokeWidth={3}
            name="Number of Bets"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// Comparison Charts Component
const ComparisonCharts: React.FC<{ library: string }> = ({ library }) => (
  <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700 text-center">
    <Eye className="w-16 h-16 text-slate-400 mx-auto mb-4" />
    <h3 className="text-xl font-semibold mb-2">Advanced Comparison Views</h3>
    <p className="text-slate-400">Multi-dimensional analysis and comparison charts coming soon...</p>
  </div>
);

export default InteractiveChartsHub;
