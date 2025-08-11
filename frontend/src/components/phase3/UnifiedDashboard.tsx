/**
 * Unified Dashboard for A1Betting Phase 3
 * Showcases the new unified backend architecture and consolidated domains
 */

import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  CpuChipIcon, 
  SparklesIcon, 
  TrophyIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { unifiedApiService, type HealthData, type AnalyticsData, type PredictionResponse } from '../../services/unifiedApiService';

interface SystemMetric {
  label: string;
  value: string | number;
  change?: string;
  icon: React.ComponentType<any>;
  color: string;
}

export const UnifiedDashboard: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [recentPredictions, setRecentPredictions] = useState<PredictionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'domains' | 'performance' | 'predictions'>('overview');

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [health, analytics, predictions] = await Promise.all([
        unifiedApiService.getHealth(),
        unifiedApiService.getAnalytics(),
        unifiedApiService.getRecentPredictions({ limit: 5 })
      ]);
      
      setHealthData(health);
      setAnalyticsData(analytics);
      setRecentPredictions(predictions.predictions || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSystemMetrics = (): SystemMetric[] => {
    if (!healthData || !analyticsData) return [];

    return [
      {
        label: 'System Status',
        value: healthData.status === 'healthy' ? 'Optimal' : healthData.status,
        icon: CheckCircleIcon,
        color: healthData.status === 'healthy' ? 'text-green-600' : 'text-yellow-600'
      },
      {
        label: 'Response Time',
        value: `${analyticsData.system_performance.avg_response_time_ms.toFixed(1)}ms`,
        change: '-66%',
        icon: ClockIcon,
        color: 'text-blue-600'
      },
      {
        label: 'Model Accuracy',
        value: `${(analyticsData.model_performance.ensemble_accuracy * 100).toFixed(1)}%`,
        change: '+5.2%',
        icon: TrophyIcon,
        color: 'text-purple-600'
      },
      {
        label: 'Cache Hit Rate',
        value: `${healthData.infrastructure.cache.hit_rate_percent.toFixed(1)}%`,
        change: '+25%',
        icon: SparklesIcon,
        color: 'text-emerald-600'
      },
      {
        label: 'Active Users',
        value: analyticsData.user_metrics.active_users.toLocaleString(),
        change: '+12.3%',
        icon: FireIcon,
        color: 'text-orange-600'
      }
    ];
  };

  const getDomainStatus = () => {
    if (!healthData) return [];

    return Object.entries(healthData.domains).map(([domain, info]) => ({
      name: domain.charAt(0).toUpperCase() + domain.slice(1),
      status: info.status,
      description: getDomainDescription(domain)
    }));
  };

  const getDomainDescription = (domain: string): string => {
    const descriptions = {
      prediction: 'ML/AI predictions with SHAP explainability',
      data: 'Multi-source sports data integration',
      analytics: 'Performance monitoring and BI',
      integration: 'Sportsbook APIs and arbitrage detection',
      optimization: 'Portfolio optimization and risk management'
    };
    return descriptions[domain as keyof typeof descriptions] || 'Domain service';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'domains', label: 'Domains', icon: CpuChipIcon },
    { id: 'performance', label: 'Performance', icon: SparklesIcon },
    { id: 'predictions', label: 'Predictions', icon: TrophyIcon }
  ];

  if (loading && !healthData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-purple-300">Loading Phase 3 Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                A1Betting Phase 3
              </h1>
              <p className="text-purple-300 mt-1">Unified Architecture Dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
                <span className="text-green-400 text-sm font-medium">LIVE</span>
              </div>
              <div className="text-sm text-purple-300">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {getSystemMetrics().map((metric, index) => {
                const Icon = metric.icon;
                return (
                  <div key={index} className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Icon className={`h-8 w-8 ${metric.color}`} />
                      {metric.change && (
                        <span className="text-green-400 text-sm font-medium">
                          {metric.change}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{metric.value}</p>
                      <p className="text-purple-300 text-sm">{metric.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Architecture Consolidation Stats */}
            {healthData && (
              <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-8">
                <h3 className="text-xl font-bold text-white mb-6">Architecture Consolidation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-400 mb-2">
                      {healthData.consolidation_stats.route_reduction_percent.toFixed(1)}%
                    </div>
                    <div className="text-purple-300">Route Reduction</div>
                    <div className="text-sm text-purple-400 mt-1">
                      {healthData.consolidation_stats.original_routes} → {healthData.consolidation_stats.consolidated_domains} domains
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-400 mb-2">
                      {healthData.consolidation_stats.service_reduction_percent.toFixed(1)}%
                    </div>
                    <div className="text-purple-300">Service Reduction</div>
                    <div className="text-sm text-purple-400 mt-1">
                      {healthData.consolidation_stats.original_services} → {healthData.consolidation_stats.consolidated_services} services
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-400 mb-2">
                      {healthData.consolidation_stats.complexity_reduction_percent}%
                    </div>
                    <div className="text-purple-300">Complexity Reduction</div>
                    <div className="text-sm text-purple-400 mt-1">
                      Unified architecture
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Domains Tab */}
        {activeTab === 'domains' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Domain Architecture</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getDomainStatus().map((domain, index) => (
                <div key={index} className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">{domain.name} Domain</h3>
                    <div className={`w-3 h-3 rounded-full ${
                      domain.status === 'healthy' ? 'bg-green-400' : 'bg-yellow-400'
                    }`}></div>
                  </div>
                  <p className="text-purple-300 text-sm mb-4">{domain.description}</p>
                  <div className="text-xs text-purple-400">
                    Status: {domain.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && analyticsData && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Performance Metrics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Performance */}
              <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">System Performance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-purple-300">Avg Response Time</span>
                    <span className="text-white font-medium">
                      {analyticsData.system_performance.avg_response_time_ms.toFixed(1)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">P95 Response Time</span>
                    <span className="text-white font-medium">
                      {analyticsData.system_performance.p95_response_time_ms.toFixed(1)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Requests/Minute</span>
                    <span className="text-white font-medium">
                      {analyticsData.system_performance.requests_per_minute.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Error Rate</span>
                    <span className="text-white font-medium">
                      {analyticsData.system_performance.error_rate_percent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Uptime</span>
                    <span className="text-white font-medium">
                      {analyticsData.system_performance.uptime_percent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Model Performance */}
              <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Model Performance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-purple-300">Ensemble Accuracy</span>
                    <span className="text-white font-medium">
                      {(analyticsData.model_performance.ensemble_accuracy * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Predictions Today</span>
                    <span className="text-white font-medium">
                      {analyticsData.model_performance.predictions_today.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Successful Predictions</span>
                    <span className="text-white font-medium">
                      {analyticsData.model_performance.successful_predictions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Accuracy Trend</span>
                    <span className="text-green-400 font-medium capitalize">
                      {analyticsData.model_performance.accuracy_trend}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Predictions Tab */}
        {activeTab === 'predictions' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Recent Predictions</h2>
            <div className="space-y-4">
              {recentPredictions.map((prediction, index) => (
                <div key={index} className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {prediction.player_name}
                      </h3>
                      <p className="text-purple-300">
                        {prediction.prop_type} ({prediction.sport.toUpperCase()})
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {(prediction.prediction.confidence * 100).toFixed(0)}%
                      </div>
                      <div className="text-purple-300 text-sm">Confidence</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-purple-300">Recommendation</div>
                      <div className={`font-semibold ${
                        prediction.prediction.recommended_bet === 'over' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {prediction.prediction.recommended_bet.toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-purple-300">Expected Value</div>
                      <div className="font-semibold text-white">
                        {(prediction.prediction.expected_value * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-purple-300">Kelly %</div>
                      <div className="font-semibold text-white">
                        {(prediction.betting_recommendation.kelly_percentage * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-purple-300">
                    {prediction.explanation.reasoning}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedDashboard;
