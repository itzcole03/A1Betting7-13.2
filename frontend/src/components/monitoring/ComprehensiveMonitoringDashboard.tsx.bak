import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, AlertTriangle, CheckCircle, XCircle, Clock, 
  Database, Server, Cpu, Memory, Network, HardDrive,
  BarChart3, TrendingUp, TrendingDown, RefreshCw,
  Bell, Settings, Download, Filter, Search, Eye,
  Zap, Brain, Target, Shield, Users, Globe,
  Calendar, Timer, Gauge, AlertCircle, Info
} from 'lucide-react';

// Comprehensive monitoring interfaces
interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  score: number;
  lastUpdated: Date;
  uptime: number;
  responseTime: number;
}

interface DataPipelineMetrics {
  id: string;
  name: string;
  type: 'ingestion' | 'processing' | 'validation' | 'aggregation';
  status: 'running' | 'stopped' | 'error' | 'pending';
  health: SystemHealth;
  performance: {
    throughput: number;
    latency: number;
    errorRate: number;
    successRate: number;
    dataQuality: number;
  };
  resources: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  lastRun: Date;
  nextRun: Date;
  totalRuns: number;
  failedRuns: number;
  averageRuntime: number;
  dataVolume: {
    processed: number;
    failed: number;
    total: number;
  };
  alertsCount: number;
  dependencies: string[];
}

interface MLModelMetrics {
  id: string;
  name: string;
  type: 'classification' | 'regression' | 'ensemble' | 'neural_network';
  version: string;
  status: 'active' | 'training' | 'inactive' | 'error';
  health: SystemHealth;
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    auc: number;
    mse: number;
  };
  predictions: {
    total: number;
    daily: number;
    hourly: number;
    avgConfidence: number;
    lowConfidenceCount: number;
  };
  training: {
    lastTrained: Date;
    trainingTime: number;
    datasetSize: number;
    epochs: number;
    loss: number;
    validationLoss: number;
  };
  drift: {
    featureDrift: number;
    targetDrift: number;
    dataQuality: number;
    lastCheck: Date;
  };
  resources: {
    cpu: number;
    memory: number;
    gpu?: number;
  };
  alerts: Alert[];
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  source: string;
  timestamp: Date;
  resolved: boolean;
  acknowledgedBy?: string;
  resolutionTime?: number;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  threshold: {
    warning: number;
    critical: number;
  };
  history: { timestamp: Date; value: number }[];
}

const ComprehensiveMonitoringDashboard: React.FC = () => {
  const [pipelines, setPipelines] = useState<DataPipelineMetrics[]>([]);
  const [models, setModels] = useState<MLModelMetrics[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<PerformanceMetric[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedView, setSelectedView] = useState<'overview' | 'pipelines' | 'models' | 'alerts'>('overview');
  const [showSystemDetails, setShowSystemDetails] = useState(false);

  // Generate realistic monitoring data
  const generatePipelineData = useCallback((): DataPipelineMetrics[] => {
    const pipelineTypes = ['ingestion', 'processing', 'validation', 'aggregation'] as const;
    const statuses = ['running', 'stopped', 'error', 'pending'] as const;
    
    return Array.from({ length: 12 }, (_, i) => {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const health = status === 'running' ? 
        { status: 'healthy' as const, score: 85 + Math.random() * 15 } :
        status === 'error' ? 
        { status: 'critical' as const, score: Math.random() * 30 } :
        { status: 'warning' as const, score: 50 + Math.random() * 35 };
      
      return {
        id: `pipeline-${i}`,
        name: `${['Player Stats', 'Odds Feed', 'Game Data', 'Weather', 'Injury Updates', 'News Sentiment'][i % 6]} Pipeline`,
        type: pipelineTypes[Math.floor(Math.random() * pipelineTypes.length)],
        status,
        health: {
          ...health,
          lastUpdated: new Date(Date.now() - Math.random() * 3600000),
          uptime: Math.random() * 99.8 + 0.2,
          responseTime: Math.random() * 500 + 50
        },
        performance: {
          throughput: Math.random() * 10000 + 1000,
          latency: Math.random() * 200 + 10,
          errorRate: Math.random() * 5,
          successRate: 95 + Math.random() * 5,
          dataQuality: 85 + Math.random() * 15
        },
        resources: {
          cpu: Math.random() * 80 + 10,
          memory: Math.random() * 70 + 20,
          disk: Math.random() * 60 + 30,
          network: Math.random() * 50 + 10
        },
        lastRun: new Date(Date.now() - Math.random() * 7200000),
        nextRun: new Date(Date.now() + Math.random() * 3600000),
        totalRuns: Math.floor(Math.random() * 10000 + 1000),
        failedRuns: Math.floor(Math.random() * 100),
        averageRuntime: Math.random() * 300 + 30,
        dataVolume: {
          processed: Math.floor(Math.random() * 1000000 + 100000),
          failed: Math.floor(Math.random() * 10000),
          total: 0
        },
        alertsCount: Math.floor(Math.random() * 5),
        dependencies: ['Database', 'API Gateway', 'Queue System'].slice(0, Math.floor(Math.random() * 3) + 1)
      };
    }).map(pipeline => ({
      ...pipeline,
      dataVolume: {
        ...pipeline.dataVolume,
        total: pipeline.dataVolume.processed + pipeline.dataVolume.failed
      }
    }));
  }, []);

  const generateModelData = useCallback((): MLModelMetrics[] => {
    const modelTypes = ['classification', 'regression', 'ensemble', 'neural_network'] as const;
    const statuses = ['active', 'training', 'inactive', 'error'] as const;
    
    return Array.from({ length: 8 }, (_, i) => {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const health = status === 'active' ? 
        { status: 'healthy' as const, score: 80 + Math.random() * 20 } :
        status === 'error' ? 
        { status: 'critical' as const, score: Math.random() * 40 } :
        { status: 'warning' as const, score: 40 + Math.random() * 40 };

      return {
        id: `model-${i}`,
        name: `${['Player Prop Predictor', 'Game Outcome', 'Injury Risk', 'Performance Forecast', 'Arbitrage Detector', 'Value Finder'][i % 6]} v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}`,
        type: modelTypes[Math.floor(Math.random() * modelTypes.length)],
        version: `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
        status,
        health: {
          ...health,
          lastUpdated: new Date(Date.now() - Math.random() * 3600000),
          uptime: Math.random() * 99.5 + 0.5,
          responseTime: Math.random() * 100 + 10
        },
        performance: {
          accuracy: 0.75 + Math.random() * 0.20,
          precision: 0.70 + Math.random() * 0.25,
          recall: 0.72 + Math.random() * 0.23,
          f1Score: 0.71 + Math.random() * 0.24,
          auc: 0.80 + Math.random() * 0.18,
          mse: Math.random() * 0.1 + 0.01
        },
        predictions: {
          total: Math.floor(Math.random() * 1000000 + 100000),
          daily: Math.floor(Math.random() * 10000 + 1000),
          hourly: Math.floor(Math.random() * 500 + 50),
          avgConfidence: 0.70 + Math.random() * 0.25,
          lowConfidenceCount: Math.floor(Math.random() * 100)
        },
        training: {
          lastTrained: new Date(Date.now() - Math.random() * 604800000),
          trainingTime: Math.random() * 7200 + 300,
          datasetSize: Math.floor(Math.random() * 100000 + 10000),
          epochs: Math.floor(Math.random() * 100 + 50),
          loss: Math.random() * 0.5 + 0.1,
          validationLoss: Math.random() * 0.6 + 0.1
        },
        drift: {
          featureDrift: Math.random() * 0.3,
          targetDrift: Math.random() * 0.25,
          dataQuality: 0.85 + Math.random() * 0.15,
          lastCheck: new Date(Date.now() - Math.random() * 86400000)
        },
        resources: {
          cpu: Math.random() * 70 + 20,
          memory: Math.random() * 80 + 15,
          gpu: Math.random() > 0.5 ? Math.random() * 90 + 10 : undefined
        },
        alerts: []
      };
    });
  }, []);

  const generateAlerts = useCallback((): Alert[] => {
    const alertTypes = ['critical', 'warning', 'info'] as const;
    const sources = ['Pipeline', 'Model', 'System', 'Data Source'];
    
    return Array.from({ length: 15 }, (_, i) => ({
      id: `alert-${i}`,
      type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
      title: [
        'High Error Rate Detected',
        'Model Performance Degradation',
        'Data Quality Issues',
        'Pipeline Failure',
        'Resource Utilization Warning',
        'API Rate Limit Reached',
        'Disk Space Low',
        'Memory Usage High',
        'Model Drift Detected',
        'Data Source Unavailable'
      ][Math.floor(Math.random() * 10)],
      message: 'Detailed alert message with context and recommended actions.',
      source: sources[Math.floor(Math.random() * sources.length)],
      timestamp: new Date(Date.now() - Math.random() * 86400000),
      resolved: Math.random() > 0.3,
      acknowledgedBy: Math.random() > 0.5 ? 'admin' : undefined,
      resolutionTime: Math.random() > 0.7 ? Math.random() * 3600 : undefined
    }));
  }, []);

  const generateSystemMetrics = useCallback((): PerformanceMetric[] => {
    return [
      {
        name: 'API Response Time',
        value: Math.random() * 100 + 50,
        unit: 'ms',
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as any,
        threshold: { warning: 200, critical: 500 },
        history: Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(Date.now() - (23 - i) * 3600000),
          value: Math.random() * 150 + 50
        }))
      },
      {
        name: 'Database Connections',
        value: Math.floor(Math.random() * 50 + 10),
        unit: 'connections',
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as any,
        threshold: { warning: 80, critical: 95 },
        history: Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(Date.now() - (23 - i) * 3600000),
          value: Math.floor(Math.random() * 60 + 10)
        }))
      },
      {
        name: 'Prediction Accuracy',
        value: 0.78 + Math.random() * 0.15,
        unit: '%',
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as any,
        threshold: { warning: 0.70, critical: 0.60 },
        history: Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(Date.now() - (23 - i) * 3600000),
          value: 0.75 + Math.random() * 0.20
        }))
      },
      {
        name: 'Data Quality Score',
        value: 0.85 + Math.random() * 0.10,
        unit: '%',
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as any,
        threshold: { warning: 0.80, critical: 0.70 },
        history: Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(Date.now() - (23 - i) * 3600000),
          value: 0.80 + Math.random() * 0.15
        }))
      }
    ];
  }, []);

  // Initialize data
  useEffect(() => {
    const pipelineData = generatePipelineData();
    const modelData = generateModelData();
    const alertData = generateAlerts();
    const metricsData = generateSystemMetrics();
    
    setPipelines(pipelineData);
    setModels(modelData);
    setAlerts(alertData);
    setSystemMetrics(metricsData);
  }, [generatePipelineData, generateModelData, generateAlerts, generateSystemMetrics]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Simulate real-time updates
      setPipelines(prev => prev.map(pipeline => ({
        ...pipeline,
        health: {
          ...pipeline.health,
          score: Math.max(0, Math.min(100, pipeline.health.score + (Math.random() - 0.5) * 5)),
          responseTime: Math.max(0, pipeline.health.responseTime + (Math.random() - 0.5) * 20)
        },
        performance: {
          ...pipeline.performance,
          throughput: Math.max(0, pipeline.performance.throughput + (Math.random() - 0.5) * 1000),
          latency: Math.max(0, pipeline.performance.latency + (Math.random() - 0.5) * 10)
        }
      })));

      setModels(prev => prev.map(model => ({
        ...model,
        health: {
          ...model.health,
          score: Math.max(0, Math.min(100, model.health.score + (Math.random() - 0.5) * 3))
        },
        performance: {
          ...model.performance,
          accuracy: Math.max(0, Math.min(1, model.performance.accuracy + (Math.random() - 0.5) * 0.02))
        }
      })));
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Filter and search logic
  const filteredPipelines = useMemo(() => {
    return pipelines.filter(pipeline => {
      const matchesStatus = filterStatus === 'all' || pipeline.status === filterStatus;
      const matchesSearch = pipeline.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [pipelines, filterStatus, searchTerm]);

  const filteredModels = useMemo(() => {
    return models.filter(model => {
      const matchesStatus = filterStatus === 'all' || model.status === filterStatus;
      const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [models, filterStatus, searchTerm]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'unresolved' && !alert.resolved) ||
        (filterStatus === 'resolved' && alert.resolved);
      const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           alert.message.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [alerts, filterStatus, searchTerm]);

  // Overall system health calculation
  const overallHealth = useMemo(() => {
    const allItems = [...pipelines, ...models];
    const avgScore = allItems.reduce((sum, item) => sum + item.health.score, 0) / allItems.length;
    const criticalCount = allItems.filter(item => item.health.status === 'critical').length;
    const warningCount = allItems.filter(item => item.health.status === 'warning').length;
    
    return {
      score: avgScore,
      status: criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'healthy',
      criticalCount,
      warningCount,
      totalItems: allItems.length
    };
  }, [pipelines, models]);

  const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
    const colors = {
      healthy: 'bg-green-500/20 text-green-400 border-green-500/30',
      warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
      running: 'bg-green-500/20 text-green-400 border-green-500/30',
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      stopped: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      error: 'bg-red-500/20 text-red-400 border-red-500/30',
      training: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    };

    const sizeClasses = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1';

    return (
      <span className={`${colors[status as keyof typeof colors] || colors.warning} border rounded-full ${sizeClasses} font-medium`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const HealthBar: React.FC<{ score: number; size?: 'sm' | 'md' | 'lg' }> = ({ score, size = 'md' }) => {
    const height = size === 'sm' ? 'h-2' : size === 'lg' ? 'h-4' : 'h-3';
    const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500';
    
    return (
      <div className={`w-full bg-gray-700 rounded-full ${height}`}>
        <div 
          className={`${height} ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-8 h-8 text-purple-500" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  System Monitoring
                </h1>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  overallHealth.status === 'healthy' ? 'bg-green-500' :
                  overallHealth.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                } animate-pulse`} />
                <span className="text-sm text-gray-300">
                  {overallHealth.status.charAt(0).toUpperCase() + overallHealth.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`p-2 rounded-lg transition-colors ${
                    autoRefresh ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                </button>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                >
                  <option value={10}>10s</option>
                  <option value={30}>30s</option>
                  <option value={60}>1m</option>
                  <option value={300}>5m</option>
                </select>
              </div>

              <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
              </button>
              <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'pipelines', label: 'Pipelines', icon: Database },
              { id: 'models', label: 'ML Models', icon: Brain },
              { id: 'alerts', label: 'Alerts', icon: Bell }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedView(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    selectedView === tab.id 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.id === 'alerts' && filteredAlerts.filter(a => !a.resolved).length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {filteredAlerts.filter(a => !a.resolved).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">All Status</option>
              <option value="running">Running</option>
              <option value="active">Active</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="stopped">Stopped</option>
              <option value="unresolved">Unresolved</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Overview Dashboard */}
        {selectedView === 'overview' && (
          <div className="space-y-6">
            {/* System Health Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">System Health</h3>
                  <Gauge className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-3xl font-bold mb-2">{overallHealth.score.toFixed(0)}%</div>
                <HealthBar score={overallHealth.score} size="lg" />
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Critical:</span>
                    <span className="text-red-400 font-medium">{overallHealth.criticalCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Warnings:</span>
                    <span className="text-yellow-400 font-medium">{overallHealth.warningCount}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Active Pipelines</h3>
                  <Database className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-3xl font-bold mb-2">
                  {pipelines.filter(p => p.status === 'running').length}
                </div>
                <div className="text-sm text-gray-400">of {pipelines.length} total</div>
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400">Running:</span>
                    <span>{pipelines.filter(p => p.status === 'running').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-400">Errors:</span>
                    <span>{pipelines.filter(p => p.status === 'error').length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">ML Models</h3>
                  <Brain className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-3xl font-bold mb-2">
                  {models.filter(m => m.status === 'active').length}
                </div>
                <div className="text-sm text-gray-400">active models</div>
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400">Active:</span>
                    <span>{models.filter(m => m.status === 'active').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-400">Training:</span>
                    <span>{models.filter(m => m.status === 'training').length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Active Alerts</h3>
                  <Bell className="w-5 h-5 text-red-400" />
                </div>
                <div className="text-3xl font-bold mb-2">
                  {alerts.filter(a => !a.resolved).length}
                </div>
                <div className="text-sm text-gray-400">unresolved</div>
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-400">Critical:</span>
                    <span>{alerts.filter(a => !a.resolved && a.type === 'critical').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-400">Warnings:</span>
                    <span>{alerts.filter(a => !a.resolved && a.type === 'warning').length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Key Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {systemMetrics.map((metric, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">{metric.name}</span>
                      <div className="flex items-center space-x-1">
                        {metric.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : metric.trend === 'down' ? (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {typeof metric.value === 'number' && metric.value < 1 ? 
                        (metric.value * 100).toFixed(1) : 
                        metric.value.toFixed(1)
                      }
                      <span className="text-sm text-gray-400 ml-1">{metric.unit}</span>
                    </div>
                    <HealthBar 
                      score={metric.value < 1 ? metric.value * 100 : 
                             metric.value > metric.threshold.critical ? 
                             100 - ((metric.value - metric.threshold.critical) / metric.threshold.critical * 50) : 
                             (metric.value / metric.threshold.warning) * 100} 
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pipelines View */}
        {selectedView === 'pipelines' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredPipelines.map((pipeline) => (
                <motion.div
                  key={pipeline.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">{pipeline.name}</h3>
                    <StatusBadge status={pipeline.status} />
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-400">Health Score</span>
                        <span className="text-sm font-medium">{pipeline.health.score.toFixed(0)}%</span>
                      </div>
                      <HealthBar score={pipeline.health.score} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Throughput:</span>
                        <div className="font-medium">{pipeline.performance.throughput.toFixed(0)}/min</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Latency:</span>
                        <div className="font-medium">{pipeline.performance.latency.toFixed(0)}ms</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Success Rate:</span>
                        <div className="font-medium text-green-400">{pipeline.performance.successRate.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Data Quality:</span>
                        <div className="font-medium text-blue-400">{pipeline.performance.dataQuality.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Last run: {pipeline.lastRun.toLocaleTimeString()}</span>
                    {pipeline.alertsCount > 0 && (
                      <div className="flex items-center space-x-1 text-red-400">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{pipeline.alertsCount} alerts</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Models View */}
        {selectedView === 'models' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredModels.map((model) => (
                <motion.div
                  key={model.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{model.name}</h3>
                      <div className="text-sm text-gray-400">{model.version}</div>
                    </div>
                    <StatusBadge status={model.status} />
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-400">Accuracy</span>
                        <span className="text-sm font-medium">{(model.performance.accuracy * 100).toFixed(1)}%</span>
                      </div>
                      <HealthBar score={model.performance.accuracy * 100} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Predictions/day:</span>
                        <div className="font-medium">{model.predictions.daily.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Avg Confidence:</span>
                        <div className="font-medium text-purple-400">{(model.predictions.avgConfidence * 100).toFixed(0)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-400">F1 Score:</span>
                        <div className="font-medium text-green-400">{model.performance.f1Score.toFixed(3)}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Drift Score:</span>
                        <div className={`font-medium ${model.drift.featureDrift < 0.1 ? 'text-green-400' : 'text-yellow-400'}`}>
                          {(model.drift.featureDrift * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Trained: {model.training.lastTrained.toLocaleDateString()}</span>
                    <div className="flex items-center space-x-2">
                      <Cpu className="w-3 h-3" />
                      <span>{model.resources.cpu.toFixed(0)}%</span>
                      <Memory className="w-3 h-3" />
                      <span>{model.resources.memory.toFixed(0)}%</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts View */}
        {selectedView === 'alerts' && (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-lg border ${
                  alert.type === 'critical' ? 'bg-red-900/20 border-red-500/30' :
                  alert.type === 'warning' ? 'bg-yellow-900/20 border-yellow-500/30' :
                  'bg-blue-900/20 border-blue-500/30'
                } ${alert.resolved ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`mt-1 ${
                      alert.type === 'critical' ? 'text-red-400' :
                      alert.type === 'warning' ? 'text-yellow-400' :
                      'text-blue-400'
                    }`}>
                      {alert.type === 'critical' ? <XCircle className="w-5 h-5" /> :
                       alert.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                       <Info className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold">{alert.title}</h4>
                        <StatusBadge status={alert.type} size="sm" />
                        {alert.resolved && <StatusBadge status="resolved" size="sm" />}
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{alert.message}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <span>{alert.source}</span>
                        <span>{alert.timestamp.toLocaleString()}</span>
                        {alert.acknowledgedBy && <span>Ack by {alert.acknowledgedBy}</span>}
                        {alert.resolutionTime && <span>Resolved in {Math.round(alert.resolutionTime / 60)}m</span>}
                      </div>
                    </div>
                  </div>
                  
                  {!alert.resolved && (
                    <div className="flex items-center space-x-2">
                      <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
                        Acknowledge
                      </button>
                      <button className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors">
                        Resolve
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {filteredAlerts.length === 0 && (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No alerts found</h3>
                <p className="text-gray-500">All systems are running smoothly</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComprehensiveMonitoringDashboard;
