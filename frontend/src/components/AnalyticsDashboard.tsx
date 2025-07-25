import { motion } from 'framer-motion';
import { Activity, Award, BarChart3, Clock, Target, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
// @ts-expect-error TS(6142): Module '../components/ui/badge' was resolved to 'C... Remove this comment to see the full error message
import { Badge } from '../components/ui/badge';
// @ts-expect-error TS(6142): Module '../components/ui/button' was resolved to '... Remove this comment to see the full error message
import { Button } from '../components/ui/button';
// @ts-expect-error TS(6142): Module '../components/ui/card' was resolved to 'C:... Remove this comment to see the full error message
import { Card } from '../components/ui/card';

interface PerformanceMetric {
  label: string;
  value: number;
  change: number;
  format: 'currency' | 'percentage' | 'number';
  trend: 'up' | 'down' | 'stable';
}

interface SportAnalytics {
  sport: string;
  totalBets: number;
  winRate: number;
  roi: number;
  avgOdds: number;
  profit: number;
  volume: number;
}

interface ModelPerformance {
  modelName: string;
  accuracy: number;
  sharpeRatio: number;
  maxDrawdown: number;
  predictions: number;
  profit: number;
  confidence: number;
}

interface TimeSeriesData {
  date: string;
  profit: number;
  volume: number;
  bets: number;
  winRate: number;
}

export const _AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [sportAnalytics, setSportAnalytics] = useState<SportAnalytics[]>([]);
  const [modelPerformance, setModelPerformance] = useState<ModelPerformance[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    const _generateMetrics = (): PerformanceMetric[] => {
      return [
        {
          label: 'Total Profit',
          value: 18420,
          change: 12.5,
          format: 'currency',
          trend: 'up',
        },
        {
          label: 'Win Rate',
          value: 73.8,
          change: 2.3,
          format: 'percentage',
          trend: 'up',
        },
        {
          label: 'ROI',
          value: 847,
          change: -5.2,
          format: 'percentage',
          trend: 'down',
        },
        {
          label: 'Sharpe Ratio',
          value: 1.42,
          change: 0.08,
          format: 'number',
          trend: 'up',
        },
        {
          label: 'Total Bets',
          value: 324,
          change: 15,
          format: 'number',
          trend: 'up',
        },
        {
          label: 'Max Drawdown',
          value: -8.3,
          change: 1.2,
          format: 'percentage',
          trend: 'up',
        },
        {
          label: 'Avg Stake',
          value: 127,
          change: -3.1,
          format: 'currency',
          trend: 'down',
        },
        {
          label: 'Models Active',
          value: 47,
          change: 2,
          format: 'number',
          trend: 'up',
        },
      ];
    };

    const _generateSportAnalytics = (): SportAnalytics[] => {
      const _sports = ['NBA', 'NFL', 'MLB', 'NHL', 'Soccer', 'Tennis'];
      return sports.map(sport => ({
        sport,
        totalBets: Math.floor(Math.random() * 100) + 20,
        winRate: 60 + Math.random() * 25,
        roi: (Math.random() - 0.3) * 50,
        avgOdds: 1.8 + Math.random() * 0.8,
        profit: (Math.random() - 0.3) * 5000,
        volume: Math.floor(Math.random() * 20000) + 5000,
      }));
    };

    const _generateModelPerformance = (): ModelPerformance[] => {
      const _models = [
        'Quantum Neural Network',
        'Ensemble Predictor',
        'LSTM Deep Model',
        'Random Forest Pro',
        'XGBoost Enhanced',
        'Transformer AI',
      ];

      return models.map(modelName => ({
        modelName,
        accuracy: 85 + Math.random() * 12,
        sharpeRatio: 1.0 + Math.random() * 1.0,
        maxDrawdown: Math.random() * 15 + 3,
        predictions: Math.floor(Math.random() * 5000) + 1000,
        profit: (Math.random() - 0.2) * 8000,
        confidence: 75 + Math.random() * 20,
      }));
    };

    const _generateTimeSeriesData = (): TimeSeriesData[] => {
      const _days =
        selectedTimeframe === '7d'
          ? 7
          : selectedTimeframe === '30d'
            ? 30
            : selectedTimeframe === '90d'
              ? 90
              : 365;
      const _data: TimeSeriesData[] = [];
      let _cumulativeProfit = 0;

      for (let _i = days; i >= 0; i--) {
        const _dailyProfit = (Math.random() - 0.4) * 500;
        cumulativeProfit += dailyProfit;

        data.push({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          profit: cumulativeProfit,
          volume: Math.floor(Math.random() * 2000) + 500,
          bets: Math.floor(Math.random() * 15) + 3,
          winRate: 60 + Math.random() * 25,
        });
      }

      return data;
    };

    setMetrics(generateMetrics());
    setSportAnalytics(generateSportAnalytics());
    setModelPerformance(generateModelPerformance());
    setTimeSeriesData(generateTimeSeriesData());
  }, [selectedTimeframe]);

  const _formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  const _getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <TrendingUp className='w-4 h-4 text-green-400' />;
      case 'down':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <TrendingUp className='w-4 h-4 text-red-400 rotate-180' />;
      default:
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <Activity className='w-4 h-4 text-gray-400' />;
    }
  };

  const _getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='space-y-8'>
      {/* Header */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Card className='p-12 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border-indigo-500/30'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h1 className='text-5xl font-black bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent mb-4'>
            ANALYTICS DASHBOARD
          </h1>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <p className='text-xl text-gray-300 mb-8'>Comprehensive Performance Analytics</p>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-center gap-8'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className='text-indigo-500'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <BarChart3 className='w-12 h-12' />
            </motion.div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='grid grid-cols-4 gap-8 text-center'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-3xl font-bold text-indigo-400'>
                  {timeSeriesData.length > 0
                    ? timeSeriesData[timeSeriesData.length - 1].profit.toFixed(0)
                    : 0}
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-gray-400'>Portfolio Value</div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-3xl font-bold text-green-400'>
                  {sportAnalytics.reduce((sum, s) => sum + s.totalBets, 0)}
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-gray-400'>Total Bets</div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-3xl font-bold text-blue-400'>{modelPerformance.length}</div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-gray-400'>Active Models</div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-3xl font-bold text-purple-400'>{sportAnalytics.length}</div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-gray-400'>Sports Tracked</div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Timeframe Selector */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Card className='p-6'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center justify-between'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h3 className='text-xl font-bold text-white'>Performance Overview</h3>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center gap-2'>
            {(['7d', '30d', '90d', '1y'] as const).map(timeframe => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                size='sm'
                className={
                  selectedTimeframe === timeframe
                    ? 'bg-indigo-500 hover:bg-indigo-600'
                    : 'border-gray-600 hover:border-indigo-400'
                }
              >
                {timeframe.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Key Metrics Grid */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-6'>
        {metrics.map((metric, index) => (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Card className='p-6 hover:border-indigo-500/30 transition-all'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-start justify-between mb-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <h4 className='text-gray-400 text-sm font-medium'>{metric.label}</h4>
                {getTrendIcon(metric.trend)}
              </div>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='text-2xl font-bold text-white mb-1'>
                {formatValue(metric.value, metric.format)}
              </div>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className={`text-sm flex items-center gap-1 ${getTrendColor(metric.trend)}`}>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span>
                  {metric.change > 0 ? '+' : ''}
                  {metric.change.toFixed(1)}%
                </span>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-gray-500'>vs last period</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Analytics */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='grid grid-cols-1 xl:grid-cols-2 gap-8'>
        {/* Sport Performance */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Card className='p-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h3 className='text-xl font-bold text-white mb-6 flex items-center gap-2'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Target className='w-5 h-5 text-green-400' />
            Sport Performance
          </h3>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='space-y-4'>
            {sportAnalytics.map((sport, index) => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <motion.div
                key={sport.sport}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className='p-4 bg-slate-800/50 rounded-lg border border-slate-700/50'
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-start justify-between mb-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center gap-3'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='w-10 h-10 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold'>
                      {sport.sport[0]}
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <h4 className='font-bold text-white'>{sport.sport}</h4>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <p className='text-gray-400 text-sm'>{sport.totalBets} bets</p>
                    </div>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Badge
                    variant='outline'
                    className={
                      sport.profit > 0
                        ? 'text-green-400 border-green-400'
                        : 'text-red-400 border-red-400'
                    }
                  >
                    {sport.profit > 0 ? '+' : ''}${sport.profit.toFixed(0)}
                  </Badge>
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='grid grid-cols-3 gap-3 text-sm'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Win Rate:</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-green-400 font-bold'>{sport.winRate.toFixed(1)}%</div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>ROI:</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div
                      className={`font-bold ${sport.roi > 0 ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {sport.roi.toFixed(1)}%
                    </div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Avg Odds:</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-blue-400 font-bold'>{sport.avgOdds.toFixed(2)}</div>
                  </div>
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='mt-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex justify-between text-xs mb-1'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Volume</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-purple-400'>${sport.volume.toLocaleString()}</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='w-full bg-gray-700 rounded-full h-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <motion.div
                      className='bg-gradient-to-r from-indigo-400 to-purple-500 h-2 rounded-full'
                      animate={{ width: `${(sport.volume / 20000) * 100}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Model Performance */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Card className='p-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h3 className='text-xl font-bold text-white mb-6 flex items-center gap-2'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Award className='w-5 h-5 text-purple-400' />
            Model Performance
          </h3>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='space-y-4'>
            {modelPerformance.map((model, index) => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <motion.div
                key={model.modelName}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className='p-4 bg-slate-800/50 rounded-lg border border-slate-700/50'
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-start justify-between mb-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <h4 className='font-bold text-white text-sm'>{model.modelName}</h4>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <p className='text-gray-400 text-xs'>
                      {model.predictions.toLocaleString()} predictions
                    </p>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Badge
                    variant='outline'
                    className={
                      model.profit > 0
                        ? 'text-green-400 border-green-400'
                        : 'text-red-400 border-red-400'
                    }
                  >
                    {model.profit > 0 ? '+' : ''}${model.profit.toFixed(0)}
                  </Badge>
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='grid grid-cols-3 gap-2 text-xs mb-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Accuracy:</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-green-400 font-bold'>{model.accuracy.toFixed(1)}%</div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Sharpe:</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-blue-400 font-bold'>{model.sharpeRatio.toFixed(2)}</div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Confidence:</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-purple-400 font-bold'>{model.confidence.toFixed(0)}%</div>
                  </div>
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex justify-between text-xs mb-1'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Performance Score</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-white'>
                      {((model.accuracy + model.confidence) / 2).toFixed(1)}%
                    </span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='w-full bg-gray-700 rounded-full h-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <motion.div
                      className='bg-gradient-to-r from-purple-400 to-pink-500 h-2 rounded-full'
                      animate={{ width: `${(model.accuracy + model.confidence) / 2}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {/* Portfolio Timeline */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Card className='p-6'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <h3 className='text-xl font-bold text-white mb-6 flex items-center gap-2'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Clock className='w-5 h-5 text-blue-400' />
          Portfolio Timeline ({selectedTimeframe.toUpperCase()})
        </h3>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-2xl font-bold text-green-400'>
              {timeSeriesData.length > 0
                ? `+${(timeSeriesData[timeSeriesData.length - 1].profit - timeSeriesData[0].profit).toFixed(0)}`
                : 0}
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Period P&L</div>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-2xl font-bold text-blue-400'>
              {timeSeriesData.reduce((sum, d) => sum + d.volume, 0).toLocaleString()}
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Total Volume</div>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-2xl font-bold text-purple-400'>
              {timeSeriesData.reduce((sum, d) => sum + d.bets, 0)}
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Total Bets</div>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-2xl font-bold text-yellow-400'>
              {timeSeriesData.length > 0
                ? (
                    timeSeriesData.reduce((sum, d) => sum + d.winRate, 0) / timeSeriesData.length
                  ).toFixed(1)
                : 0}
              %
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Avg Win Rate</div>
          </div>
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='relative h-64 bg-slate-800/30 rounded-lg p-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-center text-gray-400 mt-20'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <BarChart3 className='w-12 h-12 mx-auto mb-4 opacity-50' />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <p>Interactive chart visualization would be rendered here</p>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <p className='text-sm mt-2'>Showing portfolio performance over {selectedTimeframe}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
