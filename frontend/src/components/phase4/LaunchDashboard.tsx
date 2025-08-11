/**
 * Launch Dashboard Component
 * Comprehensive system monitoring and launch readiness dashboard
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  Database,
  Server,
  Monitor,
  Zap,
  Shield,
  Target,
  TrendingUp,
  Globe,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  RefreshCw,
  Eye,
  BarChart3,
  Settings,
  AlertCircle,
  PlayCircle,
  PauseCircle
} from 'lucide-react';

interface SystemMetric {
  name: string;
  value: number | string;
  status: 'good' | 'warning' | 'error';
  trend?: 'up' | 'down' | 'stable';
  unit?: string;
}

interface LaunchCheckpoint {
  id: string;
  name: string;
  status: 'complete' | 'in_progress' | 'pending' | 'error';
  progress: number;
  description: string;
  timestamp?: string;
}

const LaunchDashboard: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock real-time system metrics
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([
    { name: 'CPU Usage', value: 23, status: 'good', trend: 'stable', unit: '%' },
    { name: 'Memory Usage', value: 67, status: 'good', trend: 'down', unit: '%' },
    { name: 'Database Load', value: 12, status: 'good', trend: 'stable', unit: '%' },
    { name: 'API Response Time', value: 145, status: 'good', trend: 'down', unit: 'ms' },
    { name: 'Active Users', value: 1247, status: 'good', trend: 'up', unit: '' },
    { name: 'Predictions/min', value: 89, status: 'good', trend: 'up', unit: '' },
    { name: 'Error Rate', value: 0.02, status: 'good', trend: 'stable', unit: '%' },
    { name: 'Uptime', value: '99.97', status: 'good', trend: 'stable', unit: '%' }
  ]);

  const [launchCheckpoints] = useState<LaunchCheckpoint[]>([
    {
      id: 'testing',
      name: 'System Testing & Validation',
      status: 'complete',
      progress: 100,
      description: 'End-to-end testing, load testing, and security validation completed',
      timestamp: '2024-01-15 14:30:00'
    },
    {
      id: 'onboarding',
      name: 'User Onboarding System',
      status: 'complete',
      progress: 100,
      description: 'Interactive tutorials and guided tours implemented',
      timestamp: '2024-01-16 09:15:00'
    },
    {
      id: 'documentation',
      name: 'Documentation & Help System',
      status: 'complete',
      progress: 100,
      description: 'User guides, API docs, and troubleshooting resources completed',
      timestamp: '2024-01-16 16:45:00'
    },
    {
      id: 'monitoring',
      name: 'Production Monitoring',
      status: 'in_progress',
      progress: 85,
      description: 'Real-time monitoring, alerting, and analytics dashboard setup',
      timestamp: '2024-01-17 11:20:00'
    },
    {
      id: 'security',
      name: 'Security Validation',
      status: 'complete',
      progress: 100,
      description: 'Security audit, penetration testing, and compliance validation',
      timestamp: '2024-01-17 13:00:00'
    },
    {
      id: 'deployment',
      name: 'Deployment Pipeline',
      status: 'in_progress',
      progress: 92,
      description: 'CI/CD pipeline, rollback procedures, and deployment automation',
      timestamp: '2024-01-17 15:30:00'
    }
  ]);

  // Simulate real-time updates
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      setSystemMetrics(prev => prev.map(metric => ({
        ...metric,
        value: typeof metric.value === 'number' 
          ? Math.max(0, metric.value + (Math.random() - 0.5) * 5)
          : metric.value
      })));
      setLastUpdate(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
      case 'complete':
        return 'text-green-400 bg-green-500/20';
      case 'warning':
      case 'in_progress':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'error':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
      case 'complete':
        return CheckCircle;
      case 'warning':
      case 'in_progress':
        return Clock;
      case 'error':
        return AlertTriangle;
      default:
        return AlertCircle;
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'system', name: 'System Health', icon: Monitor },
    { id: 'performance', name: 'Performance', icon: Zap },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'deployment', name: 'Deployment', icon: Globe }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Launch Control Dashboard
            </h1>
            <p className="text-slate-400 mt-2">
              Real-time monitoring and launch readiness validation
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-slate-800 px-4 py-2 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm">{isMonitoring ? 'Live' : 'Paused'}</span>
            </div>
            
            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors"
            >
              {isMonitoring ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
              <span>{isMonitoring ? 'Pause' : 'Resume'}</span>
            </button>
            
            <button
              onClick={() => setLastUpdate(new Date())}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="text-sm text-slate-500 mt-4">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 mb-8 bg-slate-800/50 rounded-lg p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                selectedTab === tab.id
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-8">
          {/* Launch Progress */}
          <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Target className="w-6 h-6 mr-3 text-emerald-400" />
              Launch Readiness Status
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {launchCheckpoints.map((checkpoint) => {
                const StatusIcon = getStatusIcon(checkpoint.status);
                return (
                  <motion.div
                    key={checkpoint.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/50 border border-slate-600 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className={`w-5 h-5 ${getStatusColor(checkpoint.status).split(' ')[0]}`} />
                        <h3 className="font-semibold text-white">{checkpoint.name}</h3>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(checkpoint.status)}`}>
                        {checkpoint.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-slate-400 text-sm mb-3">{checkpoint.description}</p>
                    
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-white">{checkpoint.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${checkpoint.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {checkpoint.timestamp && (
                      <div className="text-xs text-slate-500">
                        {checkpoint.timestamp}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* System Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {systemMetrics.slice(0, 8).map((metric, index) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-slate-400 text-sm font-medium">{metric.name}</h3>
                  {getTrendIcon(metric.trend)}
                </div>
                
                <div className="flex items-baseline space-x-1">
                  <span className={`text-2xl font-bold ${getStatusColor(metric.status).split(' ')[0]}`}>
                    {typeof metric.value === 'number' ? metric.value.toFixed(metric.name.includes('Rate') ? 2 : 0) : metric.value}
                  </span>
                  {metric.unit && (
                    <span className="text-slate-400 text-sm">{metric.unit}</span>
                  )}
                </div>
                
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${getStatusColor(metric.status)}`}>
                  {metric.status.toUpperCase()}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* System Health Tab */}
      {selectedTab === 'system' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Cpu className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold">CPU Performance</h3>
              </div>
              <div className="text-3xl font-bold text-blue-400 mb-2">23%</div>
              <div className="text-slate-400 text-sm">4 cores / 8 threads</div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <MemoryStick className="w-6 h-6 text-green-400" />
                <h3 className="text-lg font-semibold">Memory Usage</h3>
              </div>
              <div className="text-3xl font-bold text-green-400 mb-2">67%</div>
              <div className="text-slate-400 text-sm">10.7GB / 16GB</div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <HardDrive className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-semibold">Storage</h3>
              </div>
              <div className="text-3xl font-bold text-yellow-400 mb-2">34%</div>
              <div className="text-slate-400 text-sm">340GB / 1TB</div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Wifi className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold">Network</h3>
              </div>
              <div className="text-3xl font-bold text-purple-400 mb-2">1.2GB/s</div>
              <div className="text-slate-400 text-sm">Throughput</div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {selectedTab === 'performance' && (
        <div className="space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Zap className="w-6 h-6 mr-3 text-yellow-400" />
              Performance Metrics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">API Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Average Response Time</span>
                    <span className="text-green-400 font-semibold">145ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">95th Percentile</span>
                    <span className="text-yellow-400 font-semibold">298ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Throughput</span>
                    <span className="text-blue-400 font-semibold">1,247 req/min</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Database Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Query Time</span>
                    <span className="text-green-400 font-semibold">23ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Connections</span>
                    <span className="text-blue-400 font-semibold">47/200</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Cache Hit Rate</span>
                    <span className="text-green-400 font-semibold">94.7%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">ML Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Prediction Time</span>
                    <span className="text-green-400 font-semibold">67ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Model Accuracy</span>
                    <span className="text-green-400 font-semibold">94.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Predictions/min</span>
                    <span className="text-blue-400 font-semibold">89</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {selectedTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Shield className="w-6 h-6 mr-3 text-green-400" />
              Security Status
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Security Checks</h3>
                <div className="space-y-3">
                  {[
                    { name: 'SSL/TLS Configuration', status: 'complete' },
                    { name: 'Authentication System', status: 'complete' },
                    { name: 'API Security', status: 'complete' },
                    { name: 'Data Encryption', status: 'complete' },
                    { name: 'Access Controls', status: 'complete' },
                    { name: 'Vulnerability Scan', status: 'complete' }
                  ].map((check, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-slate-300">{check.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Compliance</h3>
                <div className="space-y-3">
                  {[
                    { name: 'GDPR Compliance', status: 'complete' },
                    { name: 'SOC 2 Type II', status: 'complete' },
                    { name: 'PCI DSS', status: 'complete' },
                    { name: 'ISO 27001', status: 'in_progress' }
                  ].map((compliance, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-slate-300">{compliance.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(compliance.status)}`}>
                        {compliance.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deployment Tab */}
      {selectedTab === 'deployment' && (
        <div className="space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Globe className="w-6 h-6 mr-3 text-blue-400" />
              Deployment Pipeline
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Development</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-slate-300 text-sm">Tests Passing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-slate-300 text-sm">Code Quality</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-slate-300 text-sm">Security Scan</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Staging</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-slate-300 text-sm">Integration Tests</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-slate-300 text-sm">Performance Tests</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-yellow-400" />
                      <span className="text-slate-300 text-sm">Load Testing</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Production</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-slate-300 text-sm">Infrastructure Ready</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-slate-300 text-sm">Monitoring Setup</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-yellow-400" />
                      <span className="text-slate-300 text-sm">Final Validation</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Deployment History</h3>
                <div className="space-y-3">
                  {[
                    { version: 'v4.0.0-rc.3', status: 'success', timestamp: '2024-01-17 15:30:00', environment: 'staging' },
                    { version: 'v4.0.0-rc.2', status: 'success', timestamp: '2024-01-17 14:15:00', environment: 'staging' },
                    { version: 'v4.0.0-rc.1', status: 'success', timestamp: '2024-01-17 10:45:00', environment: 'staging' },
                  ].map((deployment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-white font-medium">{deployment.version}</span>
                        <span className="text-slate-400 text-sm">{deployment.environment}</span>
                      </div>
                      <span className="text-slate-400 text-sm">{deployment.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaunchDashboard;
