/**
 * ReliabilityPanel Component - Displays real-time reliability diagnostics
 * Shows overall status, key metrics, and active anomalies with lightweight UI
 */

import React, { useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Info,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap
} from 'lucide-react';
import useReliabilityStore, { reliabilitySelectors } from '../../store/reliabilityStore';
import useHealthStore, { healthSelectors } from '../../store/healthStore';
import { formatRelativeTime } from '../../utils/timeUtils';

// Status indicator component
const StatusPill: React.FC<{ status: 'ok' | 'degraded' | 'down' }> = ({ status }) => {
  const config = {
    ok: { 
      icon: CheckCircle, 
      color: 'bg-green-500/20 text-green-400 border-green-500/30', 
      label: 'Healthy' 
    },
    degraded: { 
      icon: AlertTriangle, 
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', 
      label: 'Degraded' 
    },
    down: { 
      icon: XCircle, 
      color: 'bg-red-500/20 text-red-400 border-red-500/30', 
      label: 'Down' 
    }
  };

  const { icon: Icon, color, label } = config[status];

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full border ${color}`}>
      <Icon className="w-4 h-4 mr-2" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
};

// Anomaly severity indicator
const SeverityBadge: React.FC<{ severity: 'info' | 'warning' | 'critical' }> = ({ severity }) => {
  const config = {
    info: { icon: Info, color: 'bg-blue-500/20 text-blue-400' },
    warning: { icon: AlertTriangle, color: 'bg-amber-500/20 text-amber-400' },
    critical: { icon: XCircle, color: 'bg-red-500/20 text-red-400' }
  };

  const { icon: Icon, color } = config[severity];

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded text-xs ${color}`}>
      <Icon className="w-3 h-3 mr-1" />
      {severity.toUpperCase()}
    </div>
  );
};

// Metric display component
const MetricCard: React.FC<{ 
  label: string; 
  value: string | number; 
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}> = ({ label, value, unit = '', trend, className = '' }) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity;
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400';

  const displayValue = typeof value === 'number' && value > 0 ? value.toFixed(1) : (value || '–');

  return (
    <div className={`bg-slate-800/30 rounded-lg p-3 border border-slate-700/50 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400 uppercase tracking-wide">{label}</div>
        {trend && <TrendIcon className={`w-3 h-3 ${trendColor}`} />}
      </div>
      <div className="text-lg font-semibold text-white mt-1">
        {displayValue}{unit}
      </div>
    </div>
  );
};

const ReliabilityPanel: React.FC = () => {
  const {
    report,
    loading,
    error,
    anomalies,
    lastFetched,
    fetchReport,
    clearError
  } = useReliabilityStore();

  // Note: health data is accessed via selectors, not direct store state

  // Auto-fetch on mount
  useEffect(() => {
    fetchReport({ force: false });
  }, [fetchReport]);

  // Derived values using selectors
  const overallStatus = reliabilitySelectors.isReliable(useReliabilityStore.getState()) ? 'ok' :
    reliabilitySelectors.isDegraded(useReliabilityStore.getState()) ? 'degraded' : 'down';

  const criticalAnomalies = reliabilitySelectors.criticalAnomalies(useReliabilityStore.getState());
  const warningAnomalies = reliabilitySelectors.warningAnomalies(useReliabilityStore.getState());
  const predictionAccuracy = reliabilitySelectors.predictionAccuracy(useReliabilityStore.getState());
  const systemStability = reliabilitySelectors.systemStability(useReliabilityStore.getState());

  // Get health metrics for display
  const cpuPercent = healthSelectors.cpuPercent(useHealthStore.getState());
  const p95Latency = healthSelectors.p95Latency(useHealthStore.getState());
  const cacheHitRate = healthSelectors.cacheHitRate(useHealthStore.getState());
  const activeEdges = healthSelectors.activeEdges(useHealthStore.getState());

  const handleRefetch = () => {
    clearError();
    fetchReport({ force: true, includeTraces: false });
  };

  const formatTimestamp = (timestamp: string | number | null): string => {
    if (!timestamp) return 'Never';
    return formatRelativeTime(timestamp);
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">System Reliability</h2>
            <p className="text-sm text-gray-400">Real-time diagnostic monitoring</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <StatusPill status={overallStatus} />
          <button
            onClick={handleRefetch}
            disabled={loading}
            className={`flex items-center px-3 py-1 text-sm rounded-lg border transition-all
              ${loading 
                ? 'bg-slate-700/50 text-gray-400 border-slate-600 cursor-not-allowed' 
                : 'bg-slate-800/50 text-gray-300 border-slate-600 hover:bg-slate-700/50 hover:border-slate-500'}`}
            title="Refetch reliability data"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refetch
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-400 mr-2" />
            <div>
              <div className="text-red-400 font-medium">Reliability Check Failed</div>
              <div className="text-red-300/70 text-sm mt-1">{error}</div>
            </div>
          </div>
          <button
            onClick={handleRefetch}
            className="mt-3 text-sm text-red-400 hover:text-red-300 underline"
          >
            Retry Now
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
          <p className="text-gray-400">Loading reliability data...</p>
        </div>
      )}

      {/* Main Content */}
      {!loading && (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard 
              label="CPU Usage" 
              value={cpuPercent} 
              unit="%" 
              trend={cpuPercent > 80 ? 'up' : cpuPercent > 50 ? 'stable' : 'down'}
            />
            <MetricCard 
              label="P95 Latency" 
              value={p95Latency} 
              unit="ms" 
              trend={p95Latency > 1000 ? 'up' : p95Latency > 500 ? 'stable' : 'down'}
            />
            <MetricCard 
              label="Cache Hit Rate" 
              value={cacheHitRate} 
              unit="%" 
              trend={cacheHitRate > 90 ? 'up' : cacheHitRate > 70 ? 'stable' : 'down'}
            />
            <MetricCard 
              label="Active Edges" 
              value={activeEdges || '–'} 
            />
          </div>

          {/* Additional Reliability Metrics */}
          {report && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <MetricCard 
                label="Prediction Accuracy" 
                value={predictionAccuracy} 
                unit="%" 
                trend={predictionAccuracy > 85 ? 'up' : predictionAccuracy > 70 ? 'stable' : 'down'}
              />
              <MetricCard 
                label="System Stability" 
                value={systemStability} 
                unit="%" 
                trend={systemStability > 95 ? 'up' : systemStability > 85 ? 'stable' : 'down'}
              />
              <MetricCard 
                label="Data Quality" 
                value={reliabilitySelectors.dataQualityScore(useReliabilityStore.getState())} 
                unit="%" 
              />
            </div>
          )}

          {/* Anomalies Section */}
          {anomalies.length > 0 && (
            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Active Anomalies</h3>
                <div className="flex space-x-2">
                  {criticalAnomalies.length > 0 && (
                    <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">
                      {criticalAnomalies.length} Critical
                    </span>
                  )}
                  {warningAnomalies.length > 0 && (
                    <span className="px-2 py-1 text-xs bg-amber-500/20 text-amber-400 rounded">
                      {warningAnomalies.length} Warning
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {anomalies.slice(0, 5).map((anomaly, index) => (
                  <div 
                    key={anomaly.code || index} 
                    className="flex items-start justify-between p-3 bg-slate-700/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <SeverityBadge severity={anomaly.severity} />
                        <code className="text-xs text-cyan-400 font-mono">
                          {anomaly.code}
                        </code>
                      </div>
                      <p className="text-sm text-gray-300">
                        {anomaly.message || 'No additional details available'}
                      </p>
                      {anomaly.category && (
                        <p className="text-xs text-gray-500 mt-1">
                          Category: {anomaly.category}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                {anomalies.length > 5 && (
                  <div className="text-center pt-2">
                    <span className="text-sm text-gray-400">
                      ... and {anomalies.length - 5} more anomalies
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No Anomalies State */}
          {anomalies.length === 0 && !loading && (
            <div className="text-center py-6 text-gray-400">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p>No active anomalies detected</p>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/50">
        <div className="flex items-center text-xs text-gray-500">
          <Clock className="w-3 h-3 mr-1" />
          Last updated: {formatTimestamp(lastFetched)}
        </div>
        
        {report?.timestamp && (
          <div className="text-xs text-gray-500">
            Report: {formatTimestamp(report.timestamp)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReliabilityPanel;