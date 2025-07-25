import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Eye,
  RefreshCw,
  TrendingDown,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
// Module '../../core/Layout' was resolved to 'C:/Use...'
import { Layout } from '../../core/Layout';

interface RiskAlert {
  id: string;
  type: 'portfolio' | 'bet' | 'market' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  impact: number;
  probability: number;
  timeframe: string;
  createdAt: Date;
  dismissed: boolean;
}

interface RiskMetric {
  id: string;
  name: string;
  value: number;
  maxValue: number;
  threshold: number;
  status: 'safe' | 'warning' | 'danger';
  trend: 'up' | 'down' | 'stable';
  description: string;
  category: string;
}

interface CorrelationMatrix {
  pairs: Array<{
    asset1: string;
    asset2: string;
    correlation: number;
    risk: 'low' | 'medium' | 'high';
  }>;
}

interface VaRAnalysis {
  oneDay: {
    confidence95: number;
    confidence99: number;
    expectedShortfall: number;
  };
  oneWeek: {
    confidence95: number;
    confidence99: number;
    expectedShortfall: number;
  };
  historicalSimulation: number[];
  monteCarloSimulation: number[];
}

const _RiskEngine: React.FC = () => {
  const _loadRiskData = React.useCallback(async () => {
    setIsAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      // ...mock data code here...
      // (Insert the mockAlerts, mockMetrics, mockCorrelations, mockVaR, setAlerts, setMetrics, setCorrelations, setVarAnalysis from previous implementation)
    } catch (error) {
      console.error('Failed to load risk data:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  useEffect(() => {
    loadRiskData();
    const _interval = setInterval(loadRiskData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [loadRiskData]);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [metrics, setMetrics] = useState<RiskMetric[]>([]);
  const [correlations, setCorrelations] = useState<CorrelationMatrix | null>(null);
  const [varAnalysis, setVarAnalysis] = useState<VaRAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  const _dismissAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => (alert.id === alertId ? { ...alert, dismissed: true } : alert)));
  };

  const _getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500/50 bg-red-500/10 text-red-400';
      case 'high':
        return 'border-orange-500/50 bg-orange-500/10 text-orange-400';
      case 'medium':
        return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400';
      case 'low':
        return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
      default:
        return 'border-gray-500/50 bg-gray-500/10 text-gray-400';
    }
  };

  const _getStatusColor = (status: string) => {
    switch (status) {
      case 'safe':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'danger':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const _getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingDown className='w-4 h-4 text-red-400 rotate-180' />;
      case 'down':
        return <TrendingDown className='w-4 h-4 text-green-400' />;
      case 'stable':
        return <Activity className='w-4 h-4 text-gray-400' />;
      default:
        return null;
    }
  };

  const _getCorrelationRisk = (correlation: number) => {
    const _abs = Math.abs(correlation);
    if (abs > 0.8) return 'high';
    if (abs > 0.5) return 'medium';
    return 'low';
  };

  const _filteredMetrics =
    selectedCategory === 'all' ? metrics : metrics.filter(m => m.category === selectedCategory);

  const _categories = [...new Set(metrics.map(m => m.category))];

  return (
    <Layout
      title='Risk Engine'
      subtitle='Advanced Portfolio Risk Assessment • Real-Time Monitoring'
      headerActions={
        <div className='flex items-center space-x-3'>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className='px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
          >
            <option value='all'>All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <button
            onClick={loadRiskData}
            disabled={isAnalyzing}
            className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 rounded-lg text-white font-medium transition-all disabled:opacity-50'
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                loadRiskData();
              }
            }}
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <span>{isAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
          </button>
        </div>
      }
    >
      {/* Risk Alerts */}
      {alerts.filter(a => !a.dismissed).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <h3 className='text-lg font-bold text-white mb-4 flex items-center space-x-2'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <AlertTriangle className='w-5 h-5 text-red-400' />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <span>Active Risk Alerts</span>
          </h3>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='space-y-3'>
            {alerts
              .filter(a => !a.dismissed)
              .map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`border rounded-lg overflow-hidden ${getSeverityColor(
                    alert.severity
                  )}`}
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div
                    className='p-4 cursor-pointer'
                    onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setExpandedAlert(expandedAlert === alert.id ? null : alert.id);
                      }
                    }}
                  >
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='flex items-start justify-between'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <div className='flex-1'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message
                        <div className='flex items-center space-x-3 mb-2'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                          provided... Remove this comment to see the full error message
                          <span className='px-2 py-1 rounded-full text-xs font-medium bg-current/20'>
                            {alert.severity.toUpperCase()}
                          </span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                          provided... Remove this comment to see the full error message
                          <span className='text-xs text-gray-400'>{alert.type}</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                          provided... Remove this comment to see the full error message
                          <span className='text-xs text-gray-400'>{alert.timeframe}</span>
                        </div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message
                        <h4 className='font-bold text-white mb-1'>{alert.title}</h4>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message
                        <p className='text-sm text-gray-300'>{alert.description}</p>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <div className='flex items-center space-x-3'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message
                        <div className='text-right'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                          provided... Remove this comment to see the full error message
                          <div className='text-sm font-medium'>Impact: {alert.impact}/10</div>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                          provided... Remove this comment to see the full error message
                          <div className='text-xs text-gray-400'>
                            Prob: {(alert.probability * 100).toFixed(0)}%
                          </div>
                        </div>
                        {expandedAlert === alert.id ? (
                          <ChevronUp className='w-5 h-5' />
                        ) : (
                          <ChevronDown className='w-5 h-5' />
                        )}
                      </div>
                    </div>
                  </div>
                  {expandedAlert === alert.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className='border-t border-current/20 p-4 bg-current/5'
                    >
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <div className='mb-3'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message
                        <h5 className='font-medium text-white mb-1'>Recommendation:</h5>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message
                        <p className='text-sm text-gray-300'>{alert.recommendation}</p>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <div className='flex justify-between items-center'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message
                        <span className='text-xs text-gray-400'>
                          Created: {alert.createdAt.toLocaleString()}
                        </span>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className='px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors'
                          tabIndex={0}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              dismissAlert(alert.id);
                            }
                          }}
                        >
                          Dismiss
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
          </div>
        </motion.div>
      )}
      {/* Risk Metrics Grid */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'
      >
        {filteredMetrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='flex items-start justify-between mb-4'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div>
                <h4 className='font-bold text-white'>{metric.name}</h4>

                <p className='text-xs text-gray-400 mt-1'>{metric.description}</p>
              </div>
              {getTrendIcon(metric.trend)}
            </div>
            <div className='mb-4'>
              <div className='flex items-end space-x-2 mb-2'>
                <span className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
                  {metric.value.toFixed(metric.id.includes('correlation') ? 2 : 1)}
                  {metric.id.includes('correlation') ? '' : metric.name.includes('%') ? '%' : ''}
                </span>

                <span className='text-sm text-gray-400'>/ {metric.maxValue.toFixed(0)}</span>
              </div>

              <div className='w-full bg-slate-700 rounded-full h-2'>
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    metric.status === 'safe'
                      ? 'bg-green-400'
                      : metric.status === 'warning'
                      ? 'bg-yellow-400'
                      : 'bg-red-400'
                  }`}
                  style={{ width: `${(metric.value / metric.maxValue) * 100}%` }}
                />

                <div
                  className='w-1 h-2 bg-white rounded-full -mt-2 relative'
                  style={{ left: `${(metric.threshold / metric.maxValue) * 100}%` }}
                />
              </div>
            </div>
            <div className='flex justify-between text-xs text-gray-400'>
              <span>Threshold: {metric.threshold}</span>

              <span className={`font-medium ${getStatusColor(metric.status)}`}>
                {metric.status.toUpperCase()}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>
      {/* Advanced Analytics */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Correlation Matrix */}
        {correlations && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
          >
            <div className='flex items-center justify-between mb-6'>
              <div>
                <h3 className='text-xl font-bold text-white'>Correlation Matrix</h3>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <p className='text-gray-400 text-sm'>Asset correlation analysis</p>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <Eye className='w-5 h-5 text-purple-400' />
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-3'>
              {correlations.pairs.map((pair, index) => (
                <motion.div
                  key={`${pair.asset1}-${pair.asset2}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className='flex items-center justify-between p-3 bg-slate-900/50 rounded-lg'
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='font-medium text-white'>
                      {pair.asset1} ↔ {pair.asset2}
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div
                      className={`text-xs ${
                        pair.risk === 'high'
                          ? 'text-red-400'
                          : pair.risk === 'medium'
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}
                    >
                      {pair.risk.toUpperCase()} RISK
                    </div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-right'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div
                      className={`text-lg font-bold ${
                        Math.abs(pair.correlation) > 0.8
                          ? 'text-red-400'
                          : Math.abs(pair.correlation) > 0.5
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}
                    >
                      {pair.correlation.toFixed(2)}
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-xs text-gray-400'>correlation</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* VaR Analysis */}
        {varAnalysis && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='flex items-center justify-between mb-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <h3 className='text-xl font-bold text-white'>Value at Risk</h3>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <p className='text-gray-400 text-sm'>Portfolio loss estimation</p>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <BarChart3 className='w-5 h-5 text-red-400' />
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-4'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='grid grid-cols-2 gap-4'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div className='p-4 bg-slate-900/50 rounded-lg'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <h4 className='font-medium text-white mb-3'>1-Day VaR</h4>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='space-y-2 text-sm'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='flex justify-between'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <span className='text-gray-400'>95% Confidence:</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <span className='text-red-400 font-medium'>
                        ${varAnalysis.oneDay.confidence95}
                      </span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='flex justify-between'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <span className='text-gray-400'>99% Confidence:</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <span className='text-red-400 font-medium'>
                        ${varAnalysis.oneDay.confidence99}
                      </span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='flex justify-between'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <span className='text-gray-400'>Expected Shortfall:</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <span className='text-red-400 font-medium'>
                        ${varAnalysis.oneDay.expectedShortfall}
                      </span>
                    </div>
                  </div>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div className='p-4 bg-slate-900/50 rounded-lg'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <h4 className='font-medium text-white mb-3'>1-Week VaR</h4>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='space-y-2 text-sm'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='flex justify-between'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <span className='text-gray-400'>95% Confidence:</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <span className='text-red-400 font-medium'>
                        ${varAnalysis.oneWeek.confidence95}
                      </span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='flex justify-between'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <span className='text-gray-400'>99% Confidence:</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <span className='text-red-400 font-medium'>
                        ${varAnalysis.oneWeek.confidence99}
                      </span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='flex justify-between'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <span className='text-gray-400'>Expected Shortfall:</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <span className='text-red-400 font-medium'>
                        ${varAnalysis.oneWeek.expectedShortfall}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='p-4 bg-slate-900/50 rounded-lg'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <h4 className='font-medium text-white mb-3'>Simulation Comparison</h4>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400 mb-1'>Historical Simulation</div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-red-400 font-medium'>
                      Avg: $
                      {(
                        varAnalysis.historicalSimulation.reduce((a, b) => a + b, 0) /
                        varAnalysis.historicalSimulation.length
                      ).toFixed(0)}
                    </div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400 mb-1'>Monte Carlo</div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-red-400 font-medium'>
                      Avg: $
                      {(
                        varAnalysis.monteCarloSimulation.reduce((a, b) => a + b, 0) /
                        varAnalysis.monteCarloSimulation.length
                      ).toFixed(0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default RiskEngine;
