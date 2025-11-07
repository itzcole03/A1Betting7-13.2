import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Zap,
  Shield,
  Monitor,
  Gauge,
  RefreshCw,
  Bell,
  BellOff,
  Settings,
  BarChart3,
  Eye,
  EyeOff
} from 'lucide-react';
import AdvancedHealthMonitor from '../../services/advancedHealthMonitor';

interface MetricCardProps {
  metric: {
    id: string;
    name: string;
    value: number;
    threshold: number;
    status: 'healthy' | 'warning' | 'critical';
    trend: 'improving' | 'stable' | 'declining';
    lastChecked: Date;
  };
  onViewHistory: (metricId: string) => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric, onViewHistory }) => {
  const getStatusIcon = () => {
    switch (metric.status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (metric.status) {
      case 'healthy':
        return 'border-green-500 bg-green-50';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50';
      case 'critical':
        return 'border-red-500 bg-red-50';
    }
  };

  const formatValue = (value: number, id: string) => {
    switch (id) {
      case 'api_response_time':
      case 'lcp':
      case 'fcp':
        return `${value.toFixed(0)}ms`;
      case 'memory_usage':
      case 'error_rate':
      case 'user_experience':
        return `${value.toFixed(1)}%`;
      case 'cls':
        return value.toFixed(3);
      default:
        return value.toFixed(2);
    }
  };

  return (
    <div className={`border-2 rounded-lg p-4 transition-all hover:shadow-lg ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <h3 className="font-semibold text-gray-800">{metric.name}</h3>
        </div>
        <div className="flex items-center space-x-2">
          {getTrendIcon()}
          <button
            onClick={() => onViewHistory(metric.id)}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            title="View history"
          >
            <BarChart3 className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="text-2xl font-bold text-gray-900">
          {formatValue(metric.value, metric.id)}
        </div>
        <div className="text-sm text-gray-600">
          Threshold: {formatValue(metric.threshold, metric.id)}
        </div>
        <div className="text-xs text-gray-500">
          Last checked: {metric.lastChecked.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

interface AlertItemProps {
  alert: {
    id: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: Date;
    source: string;
  };
  onResolve: (alertId: string) => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, onResolve }) => {
  const getSeverityColor = () => {
    switch (alert.severity) {
      case 'info':
        return 'text-blue-600 bg-blue-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'critical':
        return 'text-red-800 bg-red-200';
    }
  };

  return (
    <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
      <div className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor()}`}>
        {alert.severity.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{alert.message}</p>
        <div className="flex items-center space-x-2 mt-1">
          <span className="text-xs text-gray-500">{alert.source}</span>
          <span className="text-xs text-gray-500">•</span>
          <span className="text-xs text-gray-500">
            {alert.timestamp.toLocaleTimeString()}
          </span>
        </div>
      </div>
      <button
        onClick={() => onResolve(alert.id)}
        className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors"
      >
        Resolve
      </button>
    </div>
  );
};

const EnhancedMonitoringDashboard: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [selectedMetricHistory, setSelectedMetricHistory] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds

  const healthMonitor = AdvancedHealthMonitor.getInstance();

  useEffect(() => {
    // Check if monitoring is active
    setIsMonitoring(healthMonitor.isMonitoring());
    
    // Load initial health data
    updateHealth();
    
    // Set up auto-refresh
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        updateHealth();
      }, refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval]);

  const updateHealth = () => {
    const health = healthMonitor.getSystemHealth();
    setSystemHealth(health);
  };

  const handleStartMonitoring = async () => {
    try {
      await healthMonitor.startMonitoring();
      setIsMonitoring(true);
      updateHealth();
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    }
  };

  const handleStopMonitoring = () => {
    healthMonitor.stopMonitoring();
    setIsMonitoring(false);
  };

  const handleResolveAlert = (alertId: string) => {
    healthMonitor.resolveAlert(alertId);
    updateHealth();
  };

  const handleViewMetricHistory = (metricId: string) => {
    setSelectedMetricHistory(metricId === selectedMetricHistory ? null : metricId);
  };

  const getOverallStatusColor = () => {
    if (!systemHealth) return 'text-gray-500';
    
    switch (systemHealth.overall) {
      case 'healthy':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!systemHealth) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading monitoring dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Monitor className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">System Health Monitor</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getOverallStatusColor()} bg-current bg-opacity-10`}>
              {systemHealth.overall.toUpperCase()}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Score:</span>
              <span className={`text-2xl font-bold ${getScoreColor(systemHealth.score)}`}>
                {systemHealth.score}%
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAlerts(!showAlerts)}
                className={`p-2 rounded transition-colors ${showAlerts ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                title={showAlerts ? 'Hide alerts' : 'Show alerts'}
              >
                {showAlerts ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </button>
              
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded transition-colors ${autoRefresh ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
                title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              </button>
              
              {isMonitoring ? (
                <button
                  onClick={handleStopMonitoring}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Stop Monitoring
                </button>
              ) : (
                <button
                  onClick={handleStartMonitoring}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Start Monitoring
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {systemHealth.metrics.filter((m: any) => m.status === 'healthy').length}
            </div>
            <div className="text-sm text-gray-600">Healthy</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-yellow-600">
              {systemHealth.metrics.filter((m: any) => m.status === 'warning').length}
            </div>
            <div className="text-sm text-gray-600">Warning</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">
              {systemHealth.metrics.filter((m: any) => m.status === 'critical').length}
            </div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {systemHealth.alerts.length}
            </div>
            <div className="text-sm text-gray-600">Active Alerts</div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {systemHealth.metrics.map((metric: any) => (
          <MetricCard
            key={metric.id}
            metric={metric}
            onViewHistory={handleViewMetricHistory}
          />
        ))}
      </div>

      {/* Alerts Section */}
      {showAlerts && systemHealth.alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
              {systemHealth.alerts.length}
            </span>
          </div>
          
          <div className="space-y-3">
            {systemHealth.alerts.map((alert: any) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onResolve={handleResolveAlert}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {systemHealth.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recommendations</h3>
          </div>
          
          <ul className="space-y-2">
            {systemHealth.recommendations.map((recommendation: string, index: number) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Settings */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Monitor Settings</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Refresh Interval
            </label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1000}>1 second</option>
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
              <option value={30000}>30 seconds</option>
              <option value={60000}>1 minute</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="auto-refresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="auto-refresh" className="text-sm text-gray-700">
              Enable auto-refresh
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMonitoringDashboard;
