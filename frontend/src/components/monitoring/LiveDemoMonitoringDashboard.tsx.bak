import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  Eye,
  MousePointer,
  Gauge
} from 'lucide-react';
import { liveDemoEnhancementService } from '../../services/liveDemoEnhancementService';
import type { DemoMetrics, DemoEnhancement, LiveDemoStatus } from '../../services/liveDemoEnhancementService';

interface LiveDemoMonitoringDashboardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const LiveDemoMonitoringDashboard: React.FC<LiveDemoMonitoringDashboardProps> = ({
  className = '',
  autoRefresh = true,
  refreshInterval = 30000
}) => {
  const [demoStatus, setDemoStatus] = useState<LiveDemoStatus | null>(null);
  const [metrics, setMetrics] = useState<DemoMetrics | null>(null);
  const [enhancements, setEnhancements] = useState<DemoEnhancement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'enhancements'>('overview');

  // Load data on component mount
  useEffect(() => {
    loadDemoData();
    
    if (autoRefresh) {
      const interval = setInterval(loadDemoData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const loadDemoData = async () => {
    try {
      setIsLoading(true);
      
      const [status, currentMetrics, currentEnhancements] = await Promise.all([
        Promise.resolve(liveDemoEnhancementService.getDemoStatus()),
        Promise.resolve(liveDemoEnhancementService.getMetrics()),
        Promise.resolve(liveDemoEnhancementService.getEnhancements())
      ]);

      setDemoStatus(status);
      setMetrics(currentMetrics);
      setEnhancements(currentEnhancements);
    } catch (error) {
      console.error('[LiveDemoMonitoring] Failed to load demo data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyEnhancement = async (enhancementId: string) => {
    try {
      const success = await liveDemoEnhancementService.applyEnhancement(enhancementId);
      if (success) {
        await loadDemoData(); // Refresh data after applying enhancement
      }
    } catch (error) {
      console.error('[LiveDemoMonitoring] Failed to apply enhancement:', error);
    }
  };

  if (isLoading || !demoStatus || !metrics) {
    return (
      <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-700 rounded w-2/3"></div>
            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const getHealthColor = (health: LiveDemoStatus['health']) => {
    switch (health) {
      case 'EXCELLENT': return 'text-green-400';
      case 'GOOD': return 'text-blue-400';
      case 'FAIR': return 'text-yellow-400';
      case 'POOR': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getHealthIcon = (health: LiveDemoStatus['health']) => {
    switch (health) {
      case 'EXCELLENT':
      case 'GOOD':
        return <CheckCircle className="w-5 h-5" />;
      case 'FAIR':
      case 'POOR':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getPriorityColor = (priority: DemoEnhancement['priority']) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'LOW': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-slate-700/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Monitor className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Live Demo Monitoring</h3>
              <p className="text-sm text-gray-400">Real-time demo performance and enhancement tracking</p>
            </div>
          </div>
          
          <div className={`flex items-center space-x-2 ${getHealthColor(demoStatus.health)}`}>
            {getHealthIcon(demoStatus.health)}
            <span className="font-medium">{demoStatus.health}</span>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{demoStatus.currentUsers}</div>
            <div className="text-xs text-gray-400">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{demoStatus.performanceScore}%</div>
            <div className="text-xs text-gray-400">Performance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{demoStatus.featuresAvailable.length}</div>
            <div className="text-xs text-gray-400">Features</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {demoStatus.isActive ? 'LIVE' : 'OFFLINE'}
            </div>
            <div className="text-xs text-gray-400">Status</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-700/50">
        <div className="flex space-x-0">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'metrics', label: 'Metrics', icon: Gauge },
            { id: 'enhancements', label: 'Enhancements', icon: Zap }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-slate-700/30'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Session Duration</div>
                      <div className="text-lg font-bold text-white">
                        {formatDuration(metrics.userEngagement.sessionDuration)}
                      </div>
                    </div>
                    <Clock className="w-8 h-8 text-blue-400" />
                  </div>
                </div>

                <div className="bg-slate-700/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Features Explored</div>
                      <div className="text-lg font-bold text-white">
                        {metrics.userEngagement.featuresExplored.length}
                      </div>
                    </div>
                    <Target className="w-8 h-8 text-green-400" />
                  </div>
                </div>

                <div className="bg-slate-700/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Click Rate</div>
                      <div className="text-lg font-bold text-white">
                        {formatPercentage(metrics.userEngagement.clickThroughRate)}
                      </div>
                    </div>
                    <MousePointer className="w-8 h-8 text-purple-400" />
                  </div>
                </div>
              </div>

              {/* Feature Usage */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-4">Feature Usage</h4>
                <div className="space-y-3">
                  {Object.entries(metrics.featureUsage).map(([feature, usage]) => (
                    <div key={feature} className="flex items-center justify-between">
                      <span className="text-gray-300 capitalize">
                        {feature.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-slate-600 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(usage * 20, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-400 w-8">{usage}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Features */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-4">Available Demo Features</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {demoStatus.featuresAvailable.map(feature => (
                    <div key={feature} className="bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2">
                      <div className="text-sm text-green-400 font-medium">{feature}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'metrics' && (
            <motion.div
              key="metrics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Performance Metrics */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-4">Performance Metrics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Load Time</span>
                      <span className="text-white">{metrics.performanceMetrics.loadTime.toFixed(2)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Response Time</span>
                      <span className="text-white">{metrics.performanceMetrics.responseTime.toFixed(2)}ms</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Error Rate</span>
                      <span className="text-white">{formatPercentage(metrics.performanceMetrics.errorRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Uptime</span>
                      <span className="text-green-400">{metrics.performanceMetrics.uptime}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Engagement Metrics */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-4">User Engagement</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Click Through Rate</span>
                      <span className="text-white">{formatPercentage(metrics.userEngagement.clickThroughRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Bounce Rate</span>
                      <span className="text-white">{formatPercentage(metrics.userEngagement.bounceRate)}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Session Duration</span>
                      <span className="text-white">{formatDuration(metrics.userEngagement.sessionDuration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Features Explored</span>
                      <span className="text-white">{metrics.userEngagement.featuresExplored.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversion Metrics */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-4">Conversion Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Signup Rate</span>
                    <span className="text-white">{formatPercentage(metrics.conversionMetrics.signupRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Feature Adoption Rate</span>
                    <span className="text-white">{formatPercentage(metrics.conversionMetrics.featureAdoptionRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Return Visitor Rate</span>
                    <span className="text-white">{formatPercentage(metrics.conversionMetrics.returnVisitorRate)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'enhancements' && (
            <motion.div
              key="enhancements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {enhancements.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-white mb-2">All Enhancements Applied</h4>
                  <p className="text-gray-400">Demo is running optimally with no pending enhancements.</p>
                </div>
              ) : (
                enhancements.map((enhancement, index) => (
                  <div key={index} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(enhancement.priority)}`}>
                            {enhancement.priority}
                          </span>
                          <span className="text-xs text-gray-400 bg-slate-600/50 px-2 py-1 rounded">
                            {enhancement.type}
                          </span>
                        </div>
                        
                        <h5 className="text-white font-medium mb-2">{enhancement.description}</h5>
                        <p className="text-sm text-gray-400 mb-3">{enhancement.implementation}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            <span className="text-gray-300">Impact: {enhancement.expectedImpact}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-blue-400" />
                            <span className="text-gray-300">Timeline: {enhancement.timeline}</span>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => applyEnhancement(enhancement.description)}
                        className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700/50 bg-slate-900/30 px-6 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            Last updated: {demoStatus.lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={loadDemoData}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveDemoMonitoringDashboard;
