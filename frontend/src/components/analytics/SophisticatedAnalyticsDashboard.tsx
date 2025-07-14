import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
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

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const getPerformanceColor = (value: number, isGood: boolean = true) => {
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

  const getHealthIcon = (value: number, threshold: number = 80) => {
    if (value >= threshold) return <AlertTriangle className='h-4 w-4 text-red-600' />;
    if (value >= threshold * 0.7) return <Activity className='h-4 w-4 text-yellow-600' />;
    return <CheckCircle className='h-4 w-4 text-green-600' />;
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6'>
      <div className='max-w-7xl mx-auto space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-3'>
              <BarChart3 className='h-8 w-8 text-blue-600' />
              Advanced Analytics Dashboard
            </h1>
            <p className='text-gray-600 mt-2'>
              Comprehensive performance monitoring with quantum insights and ML analytics
            </p>
          </div>

          <div className='flex items-center gap-4'>
            <div className='flex rounded-lg border border-gray-200 bg-white'>
              {(['1d', '7d', '30d', '90d'] as const).map(period => (
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

            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className='bg-blue-600 hover:bg-blue-700'
            >
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue='overview' className='w-full'>
          <TabsList className='grid w-full grid-cols-6'>
            <TabsTrigger value='overview' className='flex items-center gap-2'>
              <Target className='h-4 w-4' />
              Overview
            </TabsTrigger>
            <TabsTrigger value='ml-models' className='flex items-center gap-2'>
              <Brain className='h-4 w-4' />
              ML Models
            </TabsTrigger>
            <TabsTrigger value='quantum' className='flex items-center gap-2'>
              <Zap className='h-4 w-4' />
              Quantum
            </TabsTrigger>
            <TabsTrigger value='performance' className='flex items-center gap-2'>
              <TrendingUp className='h-4 w-4' />
              Performance
            </TabsTrigger>
            <TabsTrigger value='system' className='flex items-center gap-2'>
              <Cpu className='h-4 w-4' />
              System Health
            </TabsTrigger>
            <TabsTrigger value='insights' className='flex items-center gap-2'>
              <Star className='h-4 w-4' />
              AI Insights
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value='overview' className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-gray-600'>Overall Accuracy</p>
                      <p
                        className={`text-2xl font-bold ${getPerformanceColor(performanceMetrics.accuracy)}`}
                      >
                        {performanceMetrics.accuracy}%
                      </p>
                    </div>
                    <Target className='h-8 w-8 text-blue-600' />
                  </div>
                  <div className='mt-4'>
                    <Progress value={performanceMetrics.accuracy} className='h-2' />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-gray-600'>ROI ({timeframe})</p>
                      <p
                        className={`text-2xl font-bold ${performanceMetrics.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {performanceMetrics.roi > 0 ? '+' : ''}
                        {performanceMetrics.roi}%
                      </p>
                    </div>
                    <DollarSign className='h-8 w-8 text-green-600' />
                  </div>
                  <div className='mt-2'>
                    <p className='text-sm text-gray-500'>
                      ${performanceMetrics.profitLoss > 0 ? '+' : ''}
                      {performanceMetrics.profitLoss.toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-gray-600'>Sharpe Ratio</p>
                      <p
                        className={`text-2xl font-bold ${getPerformanceColor(performanceMetrics.sharpeRatio * 40)}`}
                      >
                        {performanceMetrics.sharpeRatio}
                      </p>
                    </div>
                    <LineChart className='h-8 w-8 text-purple-600' />
                  </div>
                  <div className='mt-2'>
                    <p className='text-sm text-gray-500'>Risk-adjusted returns</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-gray-600'>Quantum Advantage</p>
                      <p className='text-2xl font-bold text-cyan-600'>
                        +{quantumMetrics.quantumAdvantage}%
                      </p>
                    </div>
                    <Zap className='h-8 w-8 text-cyan-600' />
                  </div>
                  <div className='mt-2'>
                    <p className='text-sm text-gray-500'>vs Classical</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Activity className='h-5 w-5' />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm font-medium'>Win Rate</span>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-bold'>{performanceMetrics.winRate}%</span>
                        <Progress value={performanceMetrics.winRate} className='w-24 h-2' />
                      </div>
                    </div>

                    <div className='flex justify-between items-center'>
                      <span className='text-sm font-medium'>Avg Bet Size</span>
                      <span className='text-sm font-bold'>{performanceMetrics.avgBetSize}%</span>
                    </div>

                    <div className='flex justify-between items-center'>
                      <span className='text-sm font-medium'>Total Bets</span>
                      <span className='text-sm font-bold'>
                        {performanceMetrics.totalBets.toLocaleString()}
                      </span>
                    </div>

                    <div className='flex justify-between items-center'>
                      <span className='text-sm font-medium'>Max Drawdown</span>
                      <span className='text-sm font-bold text-red-600'>
                        {performanceMetrics.maxDrawdown}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Brain className='h-5 w-5' />
                    Top Model Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {modelPerformances.slice(0, 4).map((model, index) => (
                      <div
                        key={model.name}
                        className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                      >
                        <div className='flex items-center gap-3'>
                          <Badge variant={index === 0 ? 'default' : 'secondary'}>
                            #{index + 1}
                          </Badge>
                          <span className='font-medium'>{model.name}</span>
                        </div>
                        <div className='text-right'>
                          <div className='text-sm font-bold'>{model.accuracy}%</div>
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
          <TabsContent value='ml-models' className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {modelPerformances.map(model => (
                <Card key={model.name}>
                  <CardHeader>
                    <CardTitle className='flex items-center justify-between'>
                      <span className='flex items-center gap-2'>
                        <Brain className='h-5 w-5' />
                        {model.name}
                      </span>
                      <Badge variant='outline'>{model.predictions} predictions</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <p className='text-sm text-gray-600'>Accuracy</p>
                        <div className='flex items-center gap-2'>
                          <span className='text-lg font-bold'>{model.accuracy}%</span>
                          <Progress value={model.accuracy} className='flex-1 h-2' />
                        </div>
                      </div>

                      <div>
                        <p className='text-sm text-gray-600'>Confidence</p>
                        <div className='flex items-center gap-2'>
                          <span className='text-lg font-bold'>{model.confidence}%</span>
                          <Progress value={model.confidence} className='flex-1 h-2' />
                        </div>
                      </div>
                    </div>

                    <div className='grid grid-cols-3 gap-3'>
                      <div className='text-center p-3 bg-blue-50 rounded-lg'>
                        <div className='text-sm text-gray-600'>Precision</div>
                        <div className='text-lg font-bold text-blue-600'>{model.precision}%</div>
                      </div>

                      <div className='text-center p-3 bg-green-50 rounded-lg'>
                        <div className='text-sm text-gray-600'>Recall</div>
                        <div className='text-lg font-bold text-green-600'>{model.recall}%</div>
                      </div>

                      <div className='text-center p-3 bg-purple-50 rounded-lg'>
                        <div className='text-sm text-gray-600'>F1 Score</div>
                        <div className='text-lg font-bold text-purple-600'>{model.f1Score}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Quantum Tab */}
          <TabsContent value='quantum' className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Zap className='h-5 w-5' />
                    Quantum Advantage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-center'>
                    <div className='text-3xl font-bold text-cyan-600 mb-2'>
                      +{quantumMetrics.quantumAdvantage}%
                    </div>
                    <p className='text-sm text-gray-600'>
                      Performance improvement over classical algorithms
                    </p>
                    <div className='mt-4'>
                      <Progress value={quantumMetrics.quantumAdvantage} className='h-3' />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Activity className='h-5 w-5' />
                    Entanglement Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-center'>
                    <div className='text-3xl font-bold text-purple-600 mb-2'>
                      {quantumMetrics.entanglementScore}
                    </div>
                    <p className='text-sm text-gray-600'>
                      Quantum correlation between betting outcomes
                    </p>
                    <div className='mt-4'>
                      <Progress value={quantumMetrics.entanglementScore * 100} className='h-3' />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Clock className='h-5 w-5' />
                    Optimization Speed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-center'>
                    <div className='text-3xl font-bold text-green-600 mb-2'>
                      {quantumMetrics.optimizationSpeed}x
                    </div>
                    <p className='text-sm text-gray-600'>Faster than classical optimization</p>
                    <div className='mt-4'>
                      <div className='text-xs text-gray-500'>
                        Coherence Time: {quantumMetrics.coherenceTime}ms
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quantum vs Classical Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex justify-between items-center p-4 bg-cyan-50 rounded-lg'>
                    <div>
                      <div className='font-medium'>Quantum Algorithm Performance</div>
                      <div className='text-sm text-gray-600'>
                        Portfolio optimization with quantum annealing
                      </div>
                    </div>
                    <div className='text-2xl font-bold text-cyan-600'>
                      {quantumMetrics.quantumAdvantage + quantumMetrics.classicalComparison}%
                    </div>
                  </div>

                  <div className='flex justify-between items-center p-4 bg-gray-50 rounded-lg'>
                    <div>
                      <div className='font-medium'>Classical Algorithm Performance</div>
                      <div className='text-sm text-gray-600'>
                        Traditional portfolio optimization
                      </div>
                    </div>
                    <div className='text-2xl font-bold text-gray-600'>
                      {quantumMetrics.classicalComparison}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value='system' className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Cpu className='h-5 w-5' />
                    System Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      {getHealthIcon(systemHealth.cpuUsage)}
                      <span className='font-medium'>CPU Usage</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-bold'>{systemHealth.cpuUsage}%</span>
                      <Progress value={systemHealth.cpuUsage} className='w-24 h-2' />
                    </div>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      {getHealthIcon(systemHealth.memoryUsage)}
                      <span className='font-medium'>Memory Usage</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-bold'>{systemHealth.memoryUsage}%</span>
                      <Progress value={systemHealth.memoryUsage} className='w-24 h-2' />
                    </div>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <CheckCircle className='h-4 w-4 text-green-600' />
                      <span className='font-medium'>Uptime</span>
                    </div>
                    <span className='text-sm font-bold text-green-600'>{systemHealth.uptime}</span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      {getHealthIcon(systemHealth.errorRate * 100, 5)}
                      <span className='font-medium'>Error Rate</span>
                    </div>
                    <span className='text-sm font-bold'>{systemHealth.errorRate}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Database className='h-5 w-5' />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <span className='font-medium'>Prediction Latency</span>
                    <span className='text-sm font-bold'>{systemHealth.predictionLatency}ms</span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='font-medium'>API Response Time</span>
                    <span className='text-sm font-bold'>{systemHealth.apiResponseTime}ms</span>
                  </div>

                  <Alert>
                    <CheckCircle className='h-4 w-4' />
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
          <TabsContent value='insights' className='space-y-6'>
            <div className='grid grid-cols-1 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Star className='h-5 w-5' />
                    AI-Generated Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <Alert>
                    <TrendingUp className='h-4 w-4' />
                    <AlertDescription>
                      <strong>Performance Trend:</strong> Your betting accuracy has improved by 12%
                      over the last 7 days, primarily driven by the Neural Ensemble model's enhanced
                      feature recognition in NBA player props.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <Zap className='h-4 w-4' />
                    <AlertDescription>
                      <strong>Quantum Optimization:</strong> The quantum annealing algorithm has
                      identified 3 high-correlation betting opportunities that classical
                      optimization missed, resulting in 23% higher expected value.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <Brain className='h-4 w-4' />
                    <AlertDescription>
                      <strong>Model Recommendation:</strong> Consider increasing allocation to the
                      Transformer model for NFL predictions, as it's showing 94.2% accuracy with
                      sequential data patterns.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <Target className='h-4 w-4' />
                    <AlertDescription>
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
