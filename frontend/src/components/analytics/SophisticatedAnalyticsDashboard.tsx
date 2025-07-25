import React, { useState, useEffect } from 'react';
// @ts-expect-error TS(6142): Module '../ui/Card' was resolved to 'C:/Users/bcma... Remove this comment to see the full error message
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
// @ts-expect-error TS(6142): Module '../ui/Button' was resolved to 'C:/Users/bc... Remove this comment to see the full error message
import { Button } from '../ui/Button';
// @ts-expect-error TS(6142): Module '../ui/Badge' was resolved to 'C:/Users/bcm... Remove this comment to see the full error message
import { Badge } from '../ui/Badge';
// @ts-expect-error TS(6142): Module '../ui/Progress' was resolved to 'C:/Users/... Remove this comment to see the full error message
import { Progress } from '../ui/Progress';
// @ts-expect-error TS(6142): Module '../ui/Tabs' was resolved to 'C:/Users/bcma... Remove this comment to see the full error message
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
// @ts-expect-error TS(6142): Module '../ui/Alert' was resolved to 'C:/Users/bcm... Remove this comment to see the full error message
import { Alert, AlertDescription } from '../ui/Alert';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Brain,
  Zap,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Percent,
  Calculator,
  LineChart,
  Cpu,
  Database,
} from 'lucide-react';

interface PerformanceMetrics {
  accuracy: number;
  roi: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  avgBetSize: number;
  totalBets: number;
  profitLoss: number;
}

interface ModelPerformance {
  name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confidence: number;
  predictions: number;
}

interface QuantumMetrics {
  quantumAdvantage: number;
  entanglementScore: number;
  coherenceTime: number;
  optimizationSpeed: number;
  classicalComparison: number;
}

interface SystemHealth {
  cpuUsage: number;
  memoryUsage: number;
  predictionLatency: number;
  apiResponseTime: number;
  uptime: string;
  errorRate: number;
}

export function SophisticatedAnalyticsDashboard() {
  const [timeframe, setTimeframe] = useState<'1d' | '7d' | '30d' | '90d'>('7d');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - in real app, this would come from API
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    accuracy: 87.3,
    roi: 12.4,
    sharpeRatio: 2.1,
    maxDrawdown: -8.2,
    winRate: 68.5,
    avgBetSize: 2.3,
    totalBets: 1247,
    profitLoss: 3240.5,
  });

  const [modelPerformances, setModelPerformances] = useState<ModelPerformance[]>([
    {
      name: 'Neural Ensemble',
      accuracy: 89.2,
      precision: 87.1,
      recall: 91.3,
      f1Score: 89.1,
      confidence: 94.2,
      predictions: 342,
    },
    {
      name: 'XGBoost',
      accuracy: 85.7,
      precision: 84.2,
      recall: 87.8,
      f1Score: 85.9,
      confidence: 88.5,
      predictions: 298,
    },
    {
      name: 'LightGBM',
      accuracy: 86.4,
      precision: 85.9,
      recall: 86.2,
      f1Score: 86.0,
      confidence: 90.1,
      predictions: 276,
    },
    {
      name: 'Transformer',
      accuracy: 88.1,
      precision: 86.7,
      recall: 89.8,
      f1Score: 88.2,
      confidence: 92.3,
      predictions: 213,
    },
    {
      name: 'Random Forest',
      accuracy: 82.3,
      precision: 81.1,
      recall: 83.9,
      f1Score: 82.5,
      confidence: 85.7,
      predictions: 189,
    },
    {
      name: 'Gradient Boost',
      accuracy: 84.6,
      precision: 83.4,
      recall: 86.1,
      f1Score: 84.7,
      confidence: 87.2,
      predictions: 167,
    },
  ]);

  const [quantumMetrics, setQuantumMetrics] = useState<QuantumMetrics>({
    quantumAdvantage: 23.7,
    entanglementScore: 0.847,
    coherenceTime: 125.3,
    optimizationSpeed: 4.2,
    classicalComparison: 31.2,
  });

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    cpuUsage: 34.2,
    memoryUsage: 67.8,
    predictionLatency: 89.3,
    apiResponseTime: 142.7,
    uptime: '99.97%',
    errorRate: 0.23,
  });

  const _handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const _getPerformanceColor = (value: number, isGood: boolean = true) => {
    if (isGood) {
      if (value >= 85) return 'text-green-600';
      if (value >= 70) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (value <= 15) return 'text-green-600';
      if (value <= 30) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const _getHealthIcon = (value: number, threshold: number = 80) => {
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    if (value >= threshold) return <AlertTriangle className='h-4 w-4 text-red-600' />;
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    if (value >= threshold * 0.7) return <Activity className='h-4 w-4 text-yellow-600' />;
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    return <CheckCircle className='h-4 w-4 text-green-600' />;
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='max-w-7xl mx-auto space-y-6'>
        {/* Header */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center justify-between'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-3'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <BarChart3 className='h-8 w-8 text-blue-600' />
              Advanced Analytics Dashboard
            </h1>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <p className='text-gray-600 mt-2'>
              Comprehensive performance monitoring with quantum insights and ML analytics
            </p>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center gap-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex rounded-lg border border-gray-200 bg-white'>
              {(['1d', '7d', '30d', '90d'] as const).map(period => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <button
                  key={period}
                  onClick={() => setTimeframe(period)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    timeframe === period
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className='bg-blue-600 hover:bg-blue-700'
            >
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Tabs defaultValue='overview' className='w-full'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <TabsList className='grid w-full grid-cols-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <TabsTrigger value='overview' className='flex items-center gap-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Target className='h-4 w-4' />
              Overview
            </TabsTrigger>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <TabsTrigger value='ml-models' className='flex items-center gap-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Brain className='h-4 w-4' />
              ML Models
            </TabsTrigger>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <TabsTrigger value='quantum' className='flex items-center gap-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Zap className='h-4 w-4' />
              Quantum
            </TabsTrigger>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <TabsTrigger value='performance' className='flex items-center gap-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <TrendingUp className='h-4 w-4' />
              Performance
            </TabsTrigger>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <TabsTrigger value='system' className='flex items-center gap-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Cpu className='h-4 w-4' />
              System Health
            </TabsTrigger>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <TabsTrigger value='insights' className='flex items-center gap-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Star className='h-4 w-4' />
              AI Insights
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <TabsContent value='overview' className='space-y-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Card>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardContent className='p-6'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <p className='text-sm font-medium text-gray-600'>Overall Accuracy</p>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <p
                        className={`text-2xl font-bold ${getPerformanceColor(performanceMetrics.accuracy)}`}
                      >
                        {performanceMetrics.accuracy}%
                      </p>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Target className='h-8 w-8 text-blue-600' />
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='mt-4'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Progress value={performanceMetrics.accuracy} className='h-2' />
                  </div>
                </CardContent>
              </Card>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Card>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardContent className='p-6'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <p className='text-sm font-medium text-gray-600'>ROI ({timeframe})</p>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <p
                        className={`text-2xl font-bold ${performanceMetrics.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {performanceMetrics.roi > 0 ? '+' : ''}
                        {performanceMetrics.roi}%
                      </p>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <DollarSign className='h-8 w-8 text-green-600' />
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='mt-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <p className='text-sm text-gray-500'>
                      ${performanceMetrics.profitLoss > 0 ? '+' : ''}
                      {performanceMetrics.profitLoss.toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Card>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardContent className='p-6'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <p className='text-sm font-medium text-gray-600'>Sharpe Ratio</p>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <p
                        className={`text-2xl font-bold ${getPerformanceColor(performanceMetrics.sharpeRatio * 40)}`}
                      >
                        {performanceMetrics.sharpeRatio}
                      </p>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <LineChart className='h-8 w-8 text-purple-600' />
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='mt-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <p className='text-sm text-gray-500'>Risk-adjusted returns</p>
                  </div>
                </CardContent>
              </Card>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Card>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardContent className='p-6'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <p className='text-sm font-medium text-gray-600'>Quantum Advantage</p>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <p className='text-2xl font-bold text-cyan-600'>
                        +{quantumMetrics.quantumAdvantage}%
                      </p>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Zap className='h-8 w-8 text-cyan-600' />
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='mt-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <p className='text-sm text-gray-500'>vs Classical</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Card>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardHeader>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardTitle className='flex items-center gap-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Activity className='h-5 w-5' />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardContent>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='space-y-4'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex justify-between items-center'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-sm font-medium'>Win Rate</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='flex items-center gap-2'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-sm font-bold'>{performanceMetrics.winRate}%</span>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <Progress value={performanceMetrics.winRate} className='w-24 h-2' />
                      </div>
                    </div>

                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex justify-between items-center'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-sm font-medium'>Avg Bet Size</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-sm font-bold'>{performanceMetrics.avgBetSize}%</span>
                    </div>

                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex justify-between items-center'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-sm font-medium'>Total Bets</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-sm font-bold'>
                        {performanceMetrics.totalBets.toLocaleString()}
                      </span>
                    </div>

                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex justify-between items-center'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-sm font-medium'>Max Drawdown</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-sm font-bold text-red-600'>
                        {performanceMetrics.maxDrawdown}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Card>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardHeader>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardTitle className='flex items-center gap-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Brain className='h-5 w-5' />
                    Top Model Performance
                  </CardTitle>
                </CardHeader>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardContent>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='space-y-3'>
                    {modelPerformances.slice(0, 4).map((model, index) => (
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div
                        key={model.name}
                        className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                      >
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex items-center gap-3'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <Badge variant={index === 0 ? 'default' : 'secondary'}>
                            #{index + 1}
                          </Badge>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='font-medium'>{model.name}</span>
                        </div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='text-right'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='text-sm font-bold'>{model.accuracy}%</div>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='text-xs text-gray-500'>
                            {model.predictions} predictions
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ML Models Tab */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <TabsContent value='ml-models' className='space-y-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {modelPerformances.map(model => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Card key={model.name}>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardHeader>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <CardTitle className='flex items-center justify-between'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='flex items-center gap-2'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <Brain className='h-5 w-5' />
                        {model.name}
                      </span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Badge variant='outline'>{model.predictions} predictions</Badge>
                    </CardTitle>
                  </CardHeader>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardContent className='space-y-4'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='grid grid-cols-2 gap-4'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <p className='text-sm text-gray-600'>Accuracy</p>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex items-center gap-2'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-lg font-bold'>{model.accuracy}%</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <Progress value={model.accuracy} className='flex-1 h-2' />
                        </div>
                      </div>

                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <p className='text-sm text-gray-600'>Confidence</p>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex items-center gap-2'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-lg font-bold'>{model.confidence}%</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <Progress value={model.confidence} className='flex-1 h-2' />
                        </div>
                      </div>
                    </div>

                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='grid grid-cols-3 gap-3'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-center p-3 bg-blue-50 rounded-lg'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='text-sm text-gray-600'>Precision</div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='text-lg font-bold text-blue-600'>{model.precision}%</div>
                      </div>

                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-center p-3 bg-green-50 rounded-lg'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='text-sm text-gray-600'>Recall</div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='text-lg font-bold text-green-600'>{model.recall}%</div>
                      </div>

                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-center p-3 bg-purple-50 rounded-lg'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='text-sm text-gray-600'>F1 Score</div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='text-lg font-bold text-purple-600'>{model.f1Score}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Quantum Tab */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <TabsContent value='quantum' className='space-y-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Card>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardHeader>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardTitle className='flex items-center gap-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Zap className='h-5 w-5' />
                    Quantum Advantage
                  </CardTitle>
                </CardHeader>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardContent>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-center'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-3xl font-bold text-cyan-600 mb-2'>
                      +{quantumMetrics.quantumAdvantage}%
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <p className='text-sm text-gray-600'>
                      Performance improvement over classical algorithms
                    </p>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='mt-4'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Progress value={quantumMetrics.quantumAdvantage} className='h-3' />
                    </div>
                  </div>
                </CardContent>
              </Card>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Card>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardHeader>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardTitle className='flex items-center gap-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Activity className='h-5 w-5' />
                    Entanglement Score
                  </CardTitle>
                </CardHeader>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardContent>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-center'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-3xl font-bold text-purple-600 mb-2'>
                      {quantumMetrics.entanglementScore}
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <p className='text-sm text-gray-600'>
                      Quantum correlation between betting outcomes
                    </p>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='mt-4'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Progress value={quantumMetrics.entanglementScore * 100} className='h-3' />
                    </div>
                  </div>
                </CardContent>
              </Card>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Card>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardHeader>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardTitle className='flex items-center gap-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Clock className='h-5 w-5' />
                    Optimization Speed
                  </CardTitle>
                </CardHeader>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardContent>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-center'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-3xl font-bold text-green-600 mb-2'>
                      {quantumMetrics.optimizationSpeed}x
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <p className='text-sm text-gray-600'>Faster than classical optimization</p>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='mt-4'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-xs text-gray-500'>
                        Coherence Time: {quantumMetrics.coherenceTime}ms
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Card>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <CardHeader>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardTitle>Quantum vs Classical Comparison</CardTitle>
              </CardHeader>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <CardContent>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='space-y-4'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex justify-between items-center p-4 bg-cyan-50 rounded-lg'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='font-medium'>Quantum Algorithm Performance</div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm text-gray-600'>
                        Portfolio optimization with quantum annealing
                      </div>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-2xl font-bold text-cyan-600'>
                      {quantumMetrics.quantumAdvantage + quantumMetrics.classicalComparison}%
                    </div>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex justify-between items-center p-4 bg-gray-50 rounded-lg'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='font-medium'>Classical Algorithm Performance</div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm text-gray-600'>
                        Traditional portfolio optimization
                      </div>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-2xl font-bold text-gray-600'>
                      {quantumMetrics.classicalComparison}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Health Tab */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <TabsContent value='system' className='space-y-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Card>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardHeader>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardTitle className='flex items-center gap-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Cpu className='h-5 w-5' />
                    System Resources
                  </CardTitle>
                </CardHeader>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardContent className='space-y-4'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center gap-2'>
                      {getHealthIcon(systemHealth.cpuUsage)}
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='font-medium'>CPU Usage</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center gap-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-sm font-bold'>{systemHealth.cpuUsage}%</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Progress value={systemHealth.cpuUsage} className='w-24 h-2' />
                    </div>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center gap-2'>
                      {getHealthIcon(systemHealth.memoryUsage)}
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='font-medium'>Memory Usage</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center gap-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-sm font-bold'>{systemHealth.memoryUsage}%</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Progress value={systemHealth.memoryUsage} className='w-24 h-2' />
                    </div>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center gap-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <CheckCircle className='h-4 w-4 text-green-600' />
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='font-medium'>Uptime</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-sm font-bold text-green-600'>{systemHealth.uptime}</span>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center gap-2'>
                      {getHealthIcon(systemHealth.errorRate * 100, 5)}
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='font-medium'>Error Rate</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-sm font-bold'>{systemHealth.errorRate}%</span>
                  </div>
                </CardContent>
              </Card>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Card>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardHeader>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardTitle className='flex items-center gap-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Database className='h-5 w-5' />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardContent className='space-y-4'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='font-medium'>Prediction Latency</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-sm font-bold'>{systemHealth.predictionLatency}ms</span>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='font-medium'>API Response Time</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-sm font-bold'>{systemHealth.apiResponseTime}ms</span>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Alert>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <CheckCircle className='h-4 w-4' />
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <AlertDescription>
                      All systems operating within normal parameters. Quantum optimization running
                      efficiently.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Insights Tab */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <TabsContent value='insights' className='space-y-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='grid grid-cols-1 gap-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Card>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardHeader>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardTitle className='flex items-center gap-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Star className='h-5 w-5' />
                    AI-Generated Insights
                  </CardTitle>
                </CardHeader>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardContent className='space-y-4'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Alert>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <TrendingUp className='h-4 w-4' />
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <AlertDescription>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <strong>Performance Trend:</strong> Your betting accuracy has improved by 12%
                      over the last 7 days, primarily driven by the Neural Ensemble model's enhanced
                      feature recognition in NBA player props.
                    </AlertDescription>
                  </Alert>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Alert>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Zap className='h-4 w-4' />
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <AlertDescription>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <strong>Quantum Optimization:</strong> The quantum annealing algorithm has
                      identified 3 high-correlation betting opportunities that classical
                      optimization missed, resulting in 23% higher expected value.
                    </AlertDescription>
                  </Alert>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Alert>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Brain className='h-4 w-4' />
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <AlertDescription>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <strong>Model Recommendation:</strong> Consider increasing allocation to the
                      Transformer model for NFL predictions, as it's showing 94.2% accuracy with
                      sequential data patterns.
                    </AlertDescription>
                  </Alert>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Alert>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Target className='h-4 w-4' />
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <AlertDescription>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <strong>Portfolio Optimization:</strong> Your current portfolio has a
                      diversification score of 0.73. Adding more soccer props could improve
                      risk-adjusted returns by 8.4%.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
