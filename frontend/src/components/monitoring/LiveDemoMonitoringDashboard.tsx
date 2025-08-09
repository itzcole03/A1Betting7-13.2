import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Eye,
  Globe,
  Heart,
  Monitor,
  TrendingUp,
  Users,
  Wifi,
  Zap,
  BarChart3,
  AlertCircle,
  Info,
  RefreshCw,
} from 'lucide-react';
import { demoMonitoringService, DemoMetrics, DemoAlert } from '../../services/demoMonitoringService';
import { webVitalsService } from '../../services/webVitalsService';

interface LiveDemoMonitoringDashboardProps {
  isVisible?: boolean;
  onClose?: () => void;
}

const LiveDemoMonitoringDashboard: React.FC<LiveDemoMonitoringDashboardProps> = ({
  isVisible = false,
  onClose
}) => {
  const [metrics, setMetrics] = useState<DemoMetrics>(demoMonitoringService.getMetrics());
  const [alerts, setAlerts] = useState<DemoAlert[]>(demoMonitoringService.getAlerts());
  const [healthStatus, setHealthStatus] = useState(demoMonitoringService.getHealthStatus());
  const [webVitals, setWebVitals] = useState(webVitalsService.getMetrics());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setMetrics(demoMonitoringService.getMetrics());
      setAlerts(demoMonitoringService.getAlerts());
      setHealthStatus(demoMonitoringService.getHealthStatus());
      setWebVitals(webVitalsService.getMetrics());
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const manualRefresh = () => {
    setMetrics(demoMonitoringService.getMetrics());
    setAlerts(demoMonitoringService.getAlerts());
    setHealthStatus(demoMonitoringService.getHealthStatus());
    setWebVitals(webVitalsService.getMetrics());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-400 bg-green-500/20';
      case 'good': return 'text-blue-400 bg-blue-500/20';
      case 'fair': return 'text-yellow-400 bg-yellow-500/20';
      case 'poor': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'high': return <AlertCircle className="w-4 h-4 text-orange-400" />;
      case 'medium': return <Info className="w-4 h-4 text-yellow-400" />;
      default: return <CheckCircle className="w-4 h-4 text-blue-400" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-slate-900/95 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Monitor className="w-6 h-6 text-cyan-400" />
              <div>
                <h2 className="text-xl font-bold text-white">Live Demo Monitoring</h2>
                <p className="text-gray-400 text-sm">Real-time performance and health metrics</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm ${
                  autoRefresh ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                }`}
              >
                <Wifi className="w-4 h-4" />
                <span>{autoRefresh ? 'Auto' : 'Manual'}</span>
              </button>
              
              <button
                onClick={manualRefresh}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Health Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Health Status</p>
                  <p className={`text-lg font-bold capitalize ${getStatusColor(healthStatus.status).split(' ')[0]}`}>
                    {healthStatus.status}
                  </p>
                  <p className="text-xs text-gray-500">{healthStatus.summary}</p>
                </div>
                <Heart className={`w-8 h-8 ${getStatusColor(healthStatus.status).split(' ')[0]}`} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Performance Score</p>
                  <p className="text-lg font-bold text-cyan-400">{metrics.performanceScore}/100</p>
                  <div className="w-full bg-slate-700 rounded-full h-1 mt-1">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-blue-400 h-1 rounded-full transition-all duration-500"
                      style={{ width: `${metrics.performanceScore}%` }}
                    />
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-cyan-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Uptime</p>
                  <p className="text-lg font-bold text-green-400">{formatUptime(metrics.uptime)}</p>
                  <p className="text-xs text-gray-500">Since start</p>
                </div>
                <Clock className="w-8 h-8 text-green-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Errors</p>
                  <p className={`text-lg font-bold ${metrics.errorCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {metrics.errorCount}
                  </p>
                  <p className="text-xs text-gray-500">Total count</p>
                </div>
                <AlertTriangle className={`w-8 h-8 ${metrics.errorCount > 0 ? 'text-red-400' : 'text-green-400'}`} />
              </div>
            </motion.div>
          </div>

          {/* Web Vitals and System Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Web Vitals */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Web Vitals</h3>
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
              
              <div className="space-y-3">
                {[
                  { name: 'LCP', value: webVitals.LCP, unit: 'ms', threshold: 2500, color: 'text-blue-400' },
                  { name: 'FID', value: webVitals.FID, unit: 'ms', threshold: 100, color: 'text-green-400' },
                  { name: 'CLS', value: webVitals.CLS, unit: '', threshold: 0.1, color: 'text-yellow-400' },
                  { name: 'TTFB', value: webVitals.TTFB, unit: 'ms', threshold: 600, color: 'text-cyan-400' },
                ].map((vital) => (
                  <div key={vital.name} className="flex items-center justify-between">
                    <span className="text-gray-400">{vital.name}:</span>
                    <div className="flex items-center space-x-2">
                      <span className={`${vital.color} font-medium`}>
                        {vital.value !== undefined ? `${vital.value.toFixed(vital.unit ? 0 : 3)}${vital.unit}` : 'N/A'}
                      </span>
                      {vital.value !== undefined && (
                        <div className={`w-2 h-2 rounded-full ${
                          vital.value <= vital.threshold ? 'bg-green-400' : 'bg-red-400'
                        }`} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* System Metrics */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">System Metrics</h3>
                <Cpu className="w-5 h-5 text-orange-400" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Memory Usage:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-orange-400 font-medium">
                      {(metrics.memoryUsage * 100).toFixed(1)}%
                    </span>
                    <div className="w-16 bg-slate-700 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full transition-all duration-500 ${
                          metrics.memoryUsage > 0.8 ? 'bg-red-400' : 'bg-orange-400'
                        }`}
                        style={{ width: `${metrics.memoryUsage * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">User Engagement:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-400 font-medium">{metrics.userEngagement}%</span>
                    <Users className="w-4 h-4 text-purple-400" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Network Latency:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-cyan-400 font-medium">
                      {metrics.networkLatency ? `${metrics.networkLatency}ms` : 'N/A'}
                    </span>
                    <Globe className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Component Load Times */}
          {Object.keys(metrics.componentLoadTimes).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Component Load Times</h3>
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(metrics.componentLoadTimes)
                  .slice(0, 8)
                  .map(([name, time]) => (
                    <div key={name} className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                      <span className="text-gray-300 text-sm truncate">{name}</span>
                      <span className={`font-medium text-sm ${time > 1000 ? 'text-red-400' : time > 500 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {time.toFixed(0)}ms
                      </span>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}

          {/* Recent Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Recent Alerts</h3>
              <Activity className="w-5 h-5 text-red-400" />
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-gray-400 text-sm">No alerts - system operating normally</p>
              ) : (
                alerts.slice(0, 10).map((alert, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start space-x-3 p-2 bg-slate-900/50 rounded"
                  >
                    {getAlertIcon(alert.severity)}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm">{alert.message}</p>
                      <p className="text-gray-400 text-xs">
                        {alert.timestamp.toLocaleTimeString()} • {alert.type}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LiveDemoMonitoringDashboard;
