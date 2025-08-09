import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Cpu,
  Wifi,
  WifiOff,
  Gauge,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings,
  AlertCircle,
  Info,
  Download,
  Upload,
  Server,
  Cloud,
  Zap,
  Shield,
  Eye,
  Brain,
  Target,
  Radio,
  Layers,
  Filter,
  Search,
  Bell,
  BellOff,
  Play,
  Pause,
  Square,
} from 'lucide-react';

// Comprehensive monitoring interfaces
interface DataPipeline {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error' | 'warning';
  type: 'ingestion' | 'processing' | 'enrichment' | 'export';
  source: string;
  destination: string;
  throughput: number;
  latency: number;
  errorRate: number;
  lastRun: string;
  nextRun: string;
  recordsProcessed: number;
  dataQuality: number;
  dependencies: string[];
  sla: {
    uptime: number;
    target: number;
    responseTime: number;
    targetResponseTime: number;
  };
  metrics: PipelineMetrics;
  alerts: Alert[];
}

interface PredictionModel {
  id: string;
  name: string;
  type: 'classification' | 'regression' | 'ensemble' | 'quantum';
  status: 'active' | 'training' | 'idle' | 'error';
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  rmse: number;
  mape: number;
  predictions: number;
  correctPredictions: number;
  lastTrained: string;
  trainingDuration: number;
  modelSize: number;
  inferenceTime: number;
  featureImportance: FeatureImportance[];
  performanceHistory: PerformancePoint[];
  driftScore: number;
  confidenceThreshold: number;
  alerts: Alert[];
}

interface PipelineMetrics {
  cpu: number;
  memory: number;
  diskIO: number;
  networkIO: number;
  queueSize: number;
  processingRate: number;
  errorCount: number;
  successRate: number;
}

interface FeatureImportance {
  feature: string;
  importance: number;
  stability: number;
}

interface PerformancePoint {
  timestamp: string;
  accuracy: number;
  latency: number;
  throughput: number;
}

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  component: string;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
  assignee?: string;
}

interface SystemMetrics {
  overall: {
    status: 'healthy' | 'degraded' | 'critical';
    uptime: number;
    requestsPerSecond: number;
    errorRate: number;
    responseTime: number;
  };
  infrastructure: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  database: {
    connections: number;
    queryTime: number;
    cacheHitRate: number;
    indexEfficiency: number;
  };
  apis: {
    totalCalls: number;
    successRate: number;
    rateLimitHits: number;
    authFailures: number;
  };
}

const ComprehensiveMonitoringDashboard: React.FC = () => {
  const [dataPipelines, setDataPipelines] = useState<DataPipeline[]>([]);
  const [predictionModels, setPredictionModels] = useState<PredictionModel[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedView, setSelectedView] = useState<'overview' | 'pipelines' | 'models' | 'alerts' | 'system'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize mock data
  useEffect(() => {
    const mockPipelines: DataPipeline[] = [
      {
        id: 'pipe-1',
        name: 'SportsRadar Data Ingestion',
        status: 'running',
        type: 'ingestion',
        source: 'SportsRadar API',
        destination: 'Raw Data Lake',
        throughput: 1247,
        latency: 45,
        errorRate: 0.02,
        lastRun: '2 minutes ago',
        nextRun: '3 minutes',
        recordsProcessed: 2847293,
        dataQuality: 98.7,
        dependencies: ['Auth Service', 'Rate Limiter'],
        sla: {
          uptime: 99.8,
          target: 99.5,
          responseTime: 45,
          targetResponseTime: 100,
        },
        metrics: {
          cpu: 23,
          memory: 67,
          diskIO: 45,
          networkIO: 78,
          queueSize: 12,
          processingRate: 1247,
          errorCount: 3,
          successRate: 99.98,
        },
        alerts: [],
      },
      {
        id: 'pipe-2',
        name: 'Odds Data Processing',
        status: 'warning',
        type: 'processing',
        source: 'Multiple Sportsbooks',
        destination: 'Processed Data Store',
        throughput: 892,
        latency: 89,
        errorRate: 0.12,
        lastRun: '5 minutes ago',
        nextRun: '1 minute',
        recordsProcessed: 1938472,
        dataQuality: 94.3,
        dependencies: ['DraftKings API', 'FanDuel API', 'BetMGM API'],
        sla: {
          uptime: 98.9,
          target: 99.5,
          responseTime: 89,
          targetResponseTime: 75,
        },
        metrics: {
          cpu: 78,
          memory: 89,
          diskIO: 67,
          networkIO: 56,
          queueSize: 234,
          processingRate: 892,
          errorCount: 23,
          successRate: 98.88,
        },
        alerts: [
          {
            id: 'alert-1',
            type: 'warning',
            severity: 'medium',
            message: 'Response time exceeding SLA threshold',
            component: 'Odds Processing',
            timestamp: '5 minutes ago',
            acknowledged: false,
            resolved: false,
          },
        ],
      },
      {
        id: 'pipe-3',
        name: 'Feature Engineering',
        status: 'running',
        type: 'enrichment',
        source: 'Processed Data Store',
        destination: 'Feature Store',
        throughput: 567,
        latency: 156,
        errorRate: 0.05,
        lastRun: '1 minute ago',
        nextRun: '4 minutes',
        recordsProcessed: 8472936,
        dataQuality: 96.8,
        dependencies: ['Weather API', 'Injury Reports'],
        sla: {
          uptime: 99.2,
          target: 99.0,
          responseTime: 156,
          targetResponseTime: 200,
        },
        metrics: {
          cpu: 45,
          memory: 72,
          diskIO: 89,
          networkIO: 34,
          queueSize: 67,
          processingRate: 567,
          errorCount: 8,
          successRate: 99.95,
        },
        alerts: [],
      },
    ];

    const mockModels: PredictionModel[] = [
      {
        id: 'model-1',
        name: 'XGBoost Ensemble',
        type: 'ensemble',
        status: 'active',
        accuracy: 94.7,
        precision: 92.3,
        recall: 96.1,
        f1Score: 94.2,
        auc: 97.8,
        rmse: 3.47,
        mape: 8.9,
        predictions: 15623,
        correctPredictions: 14789,
        lastTrained: '4 hours ago',
        trainingDuration: 847,
        modelSize: 23.7,
        inferenceTime: 12,
        featureImportance: [
          { feature: 'Recent Form', importance: 0.34, stability: 0.89 },
          { feature: 'Matchup History', importance: 0.28, stability: 0.76 },
          { feature: 'Home Field', importance: 0.19, stability: 0.92 },
          { feature: 'Weather', importance: 0.19, stability: 0.65 },
        ],
        performanceHistory: [
          { timestamp: '6h ago', accuracy: 94.2, latency: 11, throughput: 234 },
          { timestamp: '5h ago', accuracy: 94.5, latency: 12, throughput: 267 },
          { timestamp: '4h ago', accuracy: 94.7, latency: 12, throughput: 289 },
          { timestamp: '3h ago', accuracy: 94.6, latency: 13, throughput: 312 },
          { timestamp: '2h ago', accuracy: 94.8, latency: 12, throughput: 298 },
          { timestamp: '1h ago', accuracy: 94.7, latency: 12, throughput: 306 },
        ],
        driftScore: 0.08,
        confidenceThreshold: 0.85,
        alerts: [],
      },
      {
        id: 'model-2',
        name: 'LSTM Neural Network',
        type: 'regression',
        status: 'training',
        accuracy: 91.8,
        precision: 89.4,
        recall: 94.2,
        f1Score: 91.7,
        auc: 95.3,
        rmse: 4.23,
        mape: 11.2,
        predictions: 12456,
        correctPredictions: 11432,
        lastTrained: '2 hours ago',
        trainingDuration: 1247,
        modelSize: 45.2,
        inferenceTime: 23,
        featureImportance: [
          { feature: 'Sequence Pattern', importance: 0.42, stability: 0.87 },
          { feature: 'Time Decay', importance: 0.31, stability: 0.93 },
          { feature: 'Seasonal', importance: 0.27, stability: 0.71 },
        ],
        performanceHistory: [
          { timestamp: '6h ago', accuracy: 91.2, latency: 22, throughput: 187 },
          { timestamp: '5h ago', accuracy: 91.5, latency: 23, throughput: 195 },
          { timestamp: '4h ago', accuracy: 91.7, latency: 24, throughput: 203 },
          { timestamp: '3h ago', accuracy: 91.8, latency: 23, throughput: 198 },
          { timestamp: '2h ago', accuracy: 91.6, latency: 23, throughput: 201 },
          { timestamp: '1h ago', accuracy: 91.8, latency: 23, throughput: 207 },
        ],
        driftScore: 0.15,
        confidenceThreshold: 0.80,
        alerts: [
          {
            id: 'alert-2',
            type: 'info',
            severity: 'low',
            message: 'Model retraining in progress',
            component: 'LSTM Model',
            timestamp: '2 hours ago',
            acknowledged: true,
            resolved: false,
          },
        ],
      },
      {
        id: 'model-3',
        name: 'Quantum Advantage Model',
        type: 'quantum',
        status: 'active',
        accuracy: 96.4,
        precision: 95.7,
        recall: 97.1,
        f1Score: 96.4,
        auc: 98.9,
        rmse: 2.14,
        mape: 5.7,
        predictions: 8934,
        correctPredictions: 8612,
        lastTrained: '6 hours ago',
        trainingDuration: 2134,
        modelSize: 67.8,
        inferenceTime: 34,
        featureImportance: [
          { feature: 'Quantum Superposition', importance: 0.45, stability: 0.95 },
          { feature: 'Entanglement Factor', importance: 0.32, stability: 0.88 },
          { feature: 'Coherence State', importance: 0.23, stability: 0.79 },
        ],
        performanceHistory: [
          { timestamp: '6h ago', accuracy: 96.1, latency: 33, throughput: 156 },
          { timestamp: '5h ago', accuracy: 96.2, latency: 34, throughput: 162 },
          { timestamp: '4h ago', accuracy: 96.3, latency: 35, throughput: 158 },
          { timestamp: '3h ago', accuracy: 96.4, latency: 34, throughput: 164 },
          { timestamp: '2h ago', accuracy: 96.3, latency: 34, throughput: 167 },
          { timestamp: '1h ago', accuracy: 96.4, latency: 34, throughput: 171 },
        ],
        driftScore: 0.03,
        confidenceThreshold: 0.90,
        alerts: [],
      },
    ];

    const mockSystemMetrics: SystemMetrics = {
      overall: {
        status: 'healthy',
        uptime: 99.7,
        requestsPerSecond: 1247,
        errorRate: 0.08,
        responseTime: 89,
      },
      infrastructure: {
        cpu: 34,
        memory: 67,
        disk: 45,
        network: 23,
      },
      database: {
        connections: 87,
        queryTime: 12,
        cacheHitRate: 94.7,
        indexEfficiency: 89.2,
      },
      apis: {
        totalCalls: 892347,
        successRate: 99.92,
        rateLimitHits: 23,
        authFailures: 7,
      },
    };

    setDataPipelines(mockPipelines);
    setPredictionModels(mockModels);
    setSystemMetrics(mockSystemMetrics);
    
    // Collect all alerts
    const allAlerts = [
      ...mockPipelines.flatMap(p => p.alerts),
      ...mockModels.flatMap(m => m.alerts),
    ];
    setAlerts(allAlerts);
  }, []);

  // Auto-refresh simulation
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Simulate real-time updates
      setSystemMetrics(prev => prev ? {
        ...prev,
        overall: {
          ...prev.overall,
          requestsPerSecond: prev.overall.requestsPerSecond + Math.floor(Math.random() * 20 - 10),
          errorRate: Math.max(prev.overall.errorRate + (Math.random() - 0.5) * 0.01, 0),
          responseTime: Math.max(prev.overall.responseTime + Math.floor(Math.random() * 10 - 5), 10),
        },
        infrastructure: {
          ...prev.infrastructure,
          cpu: Math.min(Math.max(prev.infrastructure.cpu + Math.floor(Math.random() * 10 - 5), 10), 90),
          memory: Math.min(Math.max(prev.infrastructure.memory + Math.floor(Math.random() * 6 - 3), 20), 90),
        },
      } : null);

      setPredictionModels(prev => prev.map(model => ({
        ...model,
        predictions: model.predictions + Math.floor(Math.random() * 50),
        correctPredictions: model.correctPredictions + Math.floor(Math.random() * 45),
        inferenceTime: Math.max(model.inferenceTime + Math.floor(Math.random() * 4 - 2), 5),
      })));
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
      case 'active':
      case 'healthy':
        return 'text-green-400 bg-green-500/20';
      case 'warning':
      case 'degraded':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'error':
      case 'critical':
        return 'text-red-400 bg-red-500/20';
      case 'training':
      case 'idle':
        return 'text-blue-400 bg-blue-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'active':
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error':
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'training':
        return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'idle':
        return <Pause className="w-4 h-4 text-gray-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getPerformanceColor = (value: number, threshold: number, inverse = false) => {
    const isGood = inverse ? value < threshold : value > threshold;
    return isGood ? 'text-green-400' : 'text-red-400';
  };

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (filterSeverity.length && !filterSeverity.includes(alert.severity)) return false;
      if (searchQuery && !alert.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [alerts, filterSeverity, searchQuery]);

  // Overview metrics
  const overviewMetrics = useMemo(() => {
    const totalPipelines = dataPipelines.length;
    const healthyPipelines = dataPipelines.filter(p => p.status === 'running').length;
    const totalModels = predictionModels.length;
    const activeModels = predictionModels.filter(m => m.status === 'active').length;
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.resolved).length;
    const avgAccuracy = predictionModels.reduce((sum, m) => sum + m.accuracy, 0) / totalModels;

    return {
      pipelineHealth: (healthyPipelines / totalPipelines) * 100,
      modelHealth: (activeModels / totalModels) * 100,
      criticalAlerts,
      avgAccuracy,
    };
  }, [dataPipelines, predictionModels, alerts]);

  const renderOverview = () => (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">System Status</div>
              <div className={`text-2xl font-bold ${getStatusColor(systemMetrics?.overall.status || 'unknown').split(' ')[0]}`}>
                {systemMetrics?.overall.status?.toUpperCase() || 'UNKNOWN'}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {systemMetrics?.overall.uptime.toFixed(1)}% uptime
              </div>
            </div>
            <Activity className="w-8 h-8 text-cyan-400" />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Pipeline Health</div>
              <div className="text-2xl font-bold text-green-400">
                {overviewMetrics.pipelineHealth.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {dataPipelines.filter(p => p.status === 'running').length}/{dataPipelines.length} running
              </div>
            </div>
            <Database className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Model Performance</div>
              <div className="text-2xl font-bold text-purple-400">
                {overviewMetrics.avgAccuracy.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {predictionModels.filter(m => m.status === 'active').length}/{predictionModels.length} active
              </div>
            </div>
            <Brain className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Critical Alerts</div>
              <div className={`text-2xl font-bold ${overviewMetrics.criticalAlerts > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {overviewMetrics.criticalAlerts}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {alerts.filter(a => !a.resolved).length} total unresolved
              </div>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Real-time Metrics */}
      {systemMetrics && (
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-xl font-bold text-white mb-6">Real-time System Metrics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-400 mb-4">Infrastructure</h4>
              <div className="space-y-3">
                {Object.entries(systemMetrics.infrastructure).map(([metric, value]) => (
                  <div key={metric} className="flex items-center justify-between">
                    <span className="text-gray-300 capitalize">{metric}:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            value > 80 ? 'bg-red-400' : value > 60 ? 'bg-yellow-400' : 'bg-green-400'
                          }`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                      <span className="text-white text-sm w-12 text-right">{value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-400 mb-4">Performance</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Requests/sec:</span>
                  <span className="text-cyan-400 font-bold">{systemMetrics.overall.requestsPerSecond}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Error Rate:</span>
                  <span className={getPerformanceColor(systemMetrics.overall.errorRate, 0.1, true)}>
                    {(systemMetrics.overall.errorRate * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Response Time:</span>
                  <span className={getPerformanceColor(systemMetrics.overall.responseTime, 100, true)}>
                    {systemMetrics.overall.responseTime}ms
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-400 mb-4">Database</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Connections:</span>
                  <span className="text-white">{systemMetrics.database.connections}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Query Time:</span>
                  <span className="text-green-400">{systemMetrics.database.queryTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Cache Hit Rate:</span>
                  <span className="text-purple-400">{systemMetrics.database.cacheHitRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Alerts */}
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Recent Alerts</h3>
          <button
            onClick={() => setSelectedView('alerts')}
            className="text-cyan-400 hover:text-cyan-300 text-sm"
          >
            View All →
          </button>
        </div>
        
        <div className="space-y-3">
          {alerts.slice(0, 5).map(alert => (
            <div key={alert.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity).split(' ')[0]}`} />
                <div>
                  <div className="text-white text-sm">{alert.message}</div>
                  <div className="text-gray-400 text-xs">{alert.component} • {alert.timestamp}</div>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                {alert.severity.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPipelines = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dataPipelines.map(pipeline => (
          <motion.div
            key={pipeline.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-white">{pipeline.name}</h4>
              {getStatusIcon(pipeline.status)}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pipeline.status)}`}>
                  {pipeline.status.toUpperCase()}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Throughput:</span>
                <span className="text-cyan-400">{pipeline.throughput}/min</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Latency:</span>
                <span className="text-white">{pipeline.latency}ms</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Error Rate:</span>
                <span className={getPerformanceColor(pipeline.errorRate, 0.05, true)}>
                  {(pipeline.errorRate * 100).toFixed(2)}%
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Data Quality:</span>
                <span className="text-green-400">{pipeline.dataQuality}%</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">SLA Uptime:</span>
                <span className={getPerformanceColor(pipeline.sla.uptime, pipeline.sla.target)}>
                  {pipeline.sla.uptime}%
                </span>
              </div>
            </div>

            {pipeline.alerts.length > 0 && (
              <div className="mt-4 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <div className="text-yellow-400 text-xs font-medium">
                  {pipeline.alerts.length} Alert(s)
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderModels = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {predictionModels.map(model => (
          <motion.div
            key={model.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-white">{model.name}</h4>
                <p className="text-gray-400 text-sm capitalize">{model.type} Model</p>
              </div>
              {getStatusIcon(model.status)}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{model.accuracy.toFixed(1)}%</div>
                <div className="text-xs text-gray-400">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{model.f1Score.toFixed(1)}%</div>
                <div className="text-xs text-gray-400">F1 Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{model.predictions.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Predictions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{model.inferenceTime}ms</div>
                <div className="text-xs text-gray-400">Inference</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Drift Score:</span>
                <span className={getPerformanceColor(model.driftScore, 0.1, true)}>
                  {model.driftScore.toFixed(3)}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Model Size:</span>
                <span className="text-white">{model.modelSize}MB</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Last Trained:</span>
                <span className="text-gray-300">{model.lastTrained}</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-gray-400 mb-2">Top Features</div>
              {model.featureImportance.slice(0, 3).map((feature, i) => (
                <div key={i} className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-300">{feature.feature}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-slate-700 rounded-full h-1">
                      <div
                        className="bg-cyan-400 h-1 rounded-full"
                        style={{ width: `${feature.importance * 100}%` }}
                      />
                    </div>
                    <span className="text-white w-8 text-right">
                      {(feature.importance * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {model.alerts.length > 0 && (
              <div className="mt-4 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="text-blue-400 text-xs font-medium">
                  {model.alerts.length} Alert(s)
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-6">
      {/* Alert Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-cyan-400"
            />
          </div>

          <select
            multiple
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(Array.from(e.target.selectedOptions, option => option.value))}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
          >
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <button
          onClick={() => setAlertsEnabled(!alertsEnabled)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
            alertsEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}
        >
          {alertsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          <span className="text-sm">{alertsEnabled ? 'Enabled' : 'Disabled'}</span>
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.map(alert => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={`w-3 h-3 rounded-full mt-1 ${getSeverityColor(alert.severity).split(' ')[0]}`} />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-white">{alert.message}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {alert.component} • {alert.timestamp}
                  </div>
                  {alert.assignee && (
                    <div className="text-sm text-cyan-400 mt-1">
                      Assigned to: {alert.assignee}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {!alert.acknowledged && (
                  <button className="text-yellow-400 hover:text-yellow-300 text-sm">
                    Acknowledge
                  </button>
                )}
                {!alert.resolved && (
                  <button className="text-green-400 hover:text-green-300 text-sm">
                    Resolve
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Alerts Found</h3>
          <p className="text-gray-400">All systems are running smoothly</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              System Monitoring Dashboard
            </h1>
            <p className="text-gray-400">Real-time monitoring of data pipelines and prediction models</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Auto-refresh:</span>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-all ${
                  autoRefresh ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-gray-400'
                }`}
              >
                {autoRefresh ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                <span className="text-sm">{autoRefresh ? 'On' : 'Off'}</span>
              </button>
            </div>

            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={300}>5m</option>
            </select>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex space-x-1 bg-slate-800/50 backdrop-blur-lg rounded-xl p-2 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'pipelines', label: 'Data Pipelines', icon: Database },
            { id: 'models', label: 'ML Models', icon: Brain },
            { id: 'alerts', label: 'Alerts', icon: Bell },
            { id: 'system', label: 'System', icon: Server },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedView(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                selectedView === tab.id
                  ? 'bg-cyan-500 text-white'
                  : 'text-gray-300 hover:bg-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.id === 'alerts' && alerts.filter(a => !a.resolved).length > 0 && (
                <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {alerts.filter(a => !a.resolved).length}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {selectedView === 'overview' && renderOverview()}
            {selectedView === 'pipelines' && renderPipelines()}
            {selectedView === 'models' && renderModels()}
            {selectedView === 'alerts' && renderAlerts()}
            {selectedView === 'system' && renderOverview()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ComprehensiveMonitoringDashboard;
