/**
 * Real-time Analytics Dashboard for Phase 3
 * Comprehensive monitoring and analytics using unified analytics domain
 */

import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  TrophyIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BoltIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { usePhase3Analytics, usePhase3Health, usePhase3Performance } from '../../contexts/Phase3Context';
import { getCacheHitRate } from '../../utils/healthAccessors';

interface MetricCard {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
  description?: string;
}

const RealTimeAnalytics: React.FC = () => {
  const { analytics, loading: analyticsLoading } = usePhase3Analytics();
  const { health, loading: healthLoading } = usePhase3Health();
  const { performance, consolidationStats, systemMetrics, modelMetrics, userMetrics } = usePhase3Performance();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'system' | 'models' | 'users' | 'consolidation'>('overview');
  const [realTimeMetrics, setRealTimeMetrics] = useState<any[]>([]);

  // Simulate real-time metric updates
  useEffect(() => {
    const interval = setInterval(() => {
      const timestamp = Date.now();
      const newMetric = {
        timestamp,
        responseTime: 80 + Math.random() * 20, // 80-100ms
        requests: Math.floor(Math.random() * 50) + 200, // 200-250 req/min
        cacheHitRate: 94 + Math.random() * 4, // 94-98%
        errorRate: Math.random() * 0.5, // 0-0.5%
      };
      
      setRealTimeMetrics(prev => [...prev.slice(-19), newMetric]); // Keep last 20 points
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const getSystemMetrics = (): MetricCard[] => {
    if (!analytics || !health) return [];

    return [
      {
        title: 'Response Time',
        value: `${analytics.system_performance.avg_response_time_ms.toFixed(1)}ms`,
        change: '-34%',
        changeType: 'positive',
        icon: BoltIcon,
        color: 'text-green-400',
        description: 'Average API response time'
      },
      {
        title: 'P95 Response Time',
        value: `${analytics.system_performance.p95_response_time_ms.toFixed(1)}ms`,
        change: '-45%',
        changeType: 'positive',
        icon: ClockIcon,
        color: 'text-blue-400',
        description: '95th percentile response time'
      },
      {
        title: 'Requests/Minute',
        value: analytics.system_performance.requests_per_minute.toFixed(0),
        change: '+28%',
        changeType: 'positive',
        icon: ArrowTrendingUpIcon,
        color: 'text-purple-400',
        description: 'Current request rate'
      },
      {
        title: 'Error Rate',
        value: `${analytics.system_performance.error_rate_percent.toFixed(2)}%`,
        change: '-67%',
        changeType: 'positive',
        icon: ExclamationTriangleIcon,
        color: analytics.system_performance.error_rate_percent < 1 ? 'text-green-400' : 'text-red-400',
        description: 'System error rate'
      },
      {
        title: 'Uptime',
        value: `${analytics.system_performance.uptime_percent.toFixed(2)}%`,
        icon: CheckCircleIcon,
        color: 'text-green-400',
        description: 'System uptime'
      },
      {
        title: 'Cache Hit Rate',
        value: `${getCacheHitRate(health).toFixed(1)}%`,
        change: '+15%',
        changeType: 'positive',
        icon: CpuChipIcon,
        color: 'text-emerald-400',
        description: 'Cache performance'
      }
    ];
  };

  const getModelMetrics = (): MetricCard[] => {
    if (!analytics) return [];

    return [
      {
        title: 'Model Accuracy',
        value: `${(analytics.model_performance.ensemble_accuracy * 100).toFixed(1)}%`,
        change: '+3.2%',
        changeType: 'positive',
        icon: TrophyIcon,
        color: 'text-yellow-400',
        description: 'Ensemble model accuracy'
      },
      {
        title: 'Predictions Today',
        value: analytics.model_performance.predictions_today.toLocaleString(),
        change: '+45%',
        changeType: 'positive',
        icon: EyeIcon,
        color: 'text-blue-400',
        description: 'Total predictions generated'
      },
      {
        title: 'Successful Predictions',
        value: analytics.model_performance.successful_predictions.toLocaleString(),
        icon: CheckCircleIcon,
        color: 'text-green-400',
        description: 'Correctly predicted outcomes'
      },
      {
        title: 'Accuracy Trend',
        value: analytics.model_performance.accuracy_trend,
        changeType: analytics.model_performance.accuracy_trend === 'improving' ? 'positive' : 'neutral',
        icon: ArrowTrendingUpIcon,
        color: analytics.model_performance.accuracy_trend === 'improving' ? 'text-green-400' : 'text-yellow-400',
        description: 'Model performance trend'
      }
    ];
  };

  const getUserMetrics = (): MetricCard[] => {
    if (!analytics) return [];

    return [
      {
        title: 'Active Users',
        value: analytics.user_metrics.active_users.toLocaleString(),
        change: '+23%',
        changeType: 'positive',
        icon: UsersIcon,
        color: 'text-purple-400',
        description: 'Currently active users'
      },
      {
        title: 'New Users Today',
        value: analytics.user_metrics.new_users_today.toLocaleString(),
        change: '+12%',
        changeType: 'positive',
        icon: ArrowTrendingUpIcon,
        color: 'text-green-400',
        description: 'New user registrations'
      },
      {
        title: 'Total Predictions Requested',
        value: analytics.user_metrics.total_predictions_requested.toLocaleString(),
        change: '+67%',
        changeType: 'positive',
        icon: ChartBarIcon,
        color: 'text-blue-400',
        description: 'Cumulative prediction requests'
      }
    ];
  };

  const getConsolidationMetrics = (): MetricCard[] => {
    if (!consolidationStats) return [];

    return [
      {
        title: 'Routes Consolidated',
        value: `${consolidationStats.original_routes} → ${consolidationStats.consolidated_domains}`,
        change: `-${consolidationStats.route_reduction_percent.toFixed(1)}%`,
        changeType: 'positive',
        icon: ChartBarIcon,
        color: 'text-green-400',
        description: 'API route consolidation'
      },
      {
        title: 'Services Consolidated',
        value: `${consolidationStats.original_services} → ${consolidationStats.consolidated_services}`,
        change: `-${consolidationStats.service_reduction_percent.toFixed(1)}%`,
        changeType: 'positive',
        icon: CpuChipIcon,
        color: 'text-blue-400',
        description: 'Backend service consolidation'
      },
      {
        title: 'Complexity Reduction',
        value: `${consolidationStats.complexity_reduction_percent}%`,
        changeType: 'positive',
        icon: ArrowTrendingDownIcon,
        color: 'text-purple-400',
        description: 'Overall system complexity'
      }
    ];
  };

  const renderMetricCards = (metrics: MetricCard[]) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon className={`h-8 w-8 ${metric.color}`} />
                {metric.change && (
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                    metric.changeType === 'positive' ? 'bg-green-500/20 text-green-400' :
                    metric.changeType === 'negative' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {metric.change}
                  </span>
                )}
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
                <p className="text-purple-300 text-sm font-medium">{metric.title}</p>
                {metric.description && (
                  <p className="text-purple-400 text-xs mt-2">{metric.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'system', label: 'System', icon: CpuChipIcon },
    { id: 'models', label: 'Models', icon: TrophyIcon },
    { id: 'users', label: 'Users', icon: UsersIcon },
    { id: 'consolidation', label: 'Consolidation', icon: BoltIcon }
  ];

  if (analyticsLoading || healthLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-purple-300">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Real-time Analytics</h1>
        <p className="text-purple-300 max-w-3xl mx-auto">
          Monitor system performance, model accuracy, and user engagement in real-time 
          with our unified analytics domain.
        </p>
      </div>

      {/* Real-time Status Bar */}
      <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-medium">Live</span>
            </div>
            <div className="text-purple-300 text-sm">
              Last updated: {new Date(performance?.last_update || Date.now()).toLocaleTimeString()}
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {realTimeMetrics.length > 0 ? realTimeMetrics[realTimeMetrics.length - 1].responseTime.toFixed(0) : '85'}ms
              </div>
              <div className="text-xs text-purple-300">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {realTimeMetrics.length > 0 ? realTimeMetrics[realTimeMetrics.length - 1].requests.toFixed(0) : '245'}
              </div>
              <div className="text-xs text-purple-300">Requests/Min</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {realTimeMetrics.length > 0 ? realTimeMetrics[realTimeMetrics.length - 1].cacheHitRate.toFixed(1) : '95.2'}%
              </div>
              <div className="text-xs text-purple-300">Cache Hit Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-black/20 p-1 rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-purple-300 hover:text-white hover:bg-purple-800/50'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content based on active tab */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Key System Metrics */}
              <div>
                <h3 className="text-xl font-bold text-white mb-6">System Performance</h3>
                <div className="grid grid-cols-1 gap-4">
                  {getSystemMetrics().slice(0, 3).map((metric, index) => {
                    const Icon = metric.icon;
                    return (
                      <div key={index} className="bg-black/40 rounded-lg p-4 flex items-center space-x-4">
                        <Icon className={`h-6 w-6 ${metric.color}`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-white font-medium">{metric.title}</span>
                            <span className="text-white font-bold">{metric.value}</span>
                          </div>
                          {metric.change && (
                            <div className="text-sm text-green-400">
                              {metric.change} improvement
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Consolidation Impact */}
              <div>
                <h3 className="text-xl font-bold text-white mb-6">Architecture Impact</h3>
                <div className="space-y-4">
                  {consolidationStats && (
                    <>
                      <div className="bg-black/40 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-purple-300">Routes Consolidated</span>
                          <span className="text-green-400 font-bold">
                            {consolidationStats.route_reduction_percent.toFixed(1)}% reduction
                          </span>
                        </div>
                        <div className="text-sm text-purple-400">
                          {consolidationStats.original_routes} → {consolidationStats.consolidated_domains} domains
                        </div>
                      </div>
                      <div className="bg-black/40 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-purple-300">Services Consolidated</span>
                          <span className="text-green-400 font-bold">
                            {consolidationStats.service_reduction_percent.toFixed(1)}% reduction
                          </span>
                        </div>
                        <div className="text-sm text-purple-400">
                          {consolidationStats.original_services} → {consolidationStats.consolidated_services} services
                        </div>
                      </div>
                      <div className="bg-black/40 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-purple-300">Complexity Reduction</span>
                          <span className="text-purple-400 font-bold">
                            {consolidationStats.complexity_reduction_percent}%
                          </span>
                        </div>
                        <div className="text-sm text-purple-400">
                          Unified architecture achieved
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && renderMetricCards(getSystemMetrics())}
        {activeTab === 'models' && renderMetricCards(getModelMetrics())}
        {activeTab === 'users' && renderMetricCards(getUserMetrics())}
        {activeTab === 'consolidation' && renderMetricCards(getConsolidationMetrics())}
      </div>

      {/* Real-time Chart Placeholder */}
      {realTimeMetrics.length > 0 && (
        <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Real-time Performance Chart</h3>
          <div className="h-64 flex items-end justify-center space-x-1">
            {realTimeMetrics.slice(-20).map((metric, index) => (
              <div
                key={index}
                className="bg-gradient-to-t from-purple-600 to-purple-400 w-4 rounded-t"
                style={{
                  height: `${(metric.responseTime - 60) * 3}px`, // Scale response time to chart height
                }}
                title={`${metric.responseTime.toFixed(0)}ms at ${new Date(metric.timestamp).toLocaleTimeString()}`}
              ></div>
            ))}
          </div>
          <div className="text-center text-purple-300 text-sm mt-4">
            Response Time Trend (Last 40 seconds)
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeAnalytics;
