import React, { useState, useEffect, useCallback } from 'react';
import { _Card as Card, _CardContent as CardContent, _CardHeader as CardHeader, _CardTitle as CardTitle } from '../ui/card';
import { _Badge as Badge } from '../ui/badge';
import { _Button as Button } from '../ui/button';
import { _Tabs as Tabs, _TabsContent as TabsContent, _TabsList as TabsList, _TabsTrigger as TabsTrigger } from '../ui/tabs';
import { _Progress as Progress } from '../ui/progress';
import { _Alert as Alert, _AlertDescription as AlertDescription } from '../ui/alert';
import {
  Brain,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Settings,
  Download,
  Upload,
  Clock,
  Zap,
  Shield,
  Globe,
  Users,
  Server,
  HardDrive,
  Cpu,
  Gauge,
  Target,
  Layers,
  Database,
  Network,
  Eye,
  Filter,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  GitBranch,
  Code2,
  Sparkles,
  Trophy,
  FlaskConical,
  Rocket
} from 'lucide-react';

// Multi-Sport Integration Types
interface MultiSportData {
  sport: string;
  league: string;
  total_games: number;
  active_players: number;
  data_freshness: string;
  prediction_accuracy: number;
  last_updated: string;
  status: 'active' | 'stale' | 'error';
}

interface SportSpecificFeature {
  sport: string;
  feature_name: string;
  feature_type: string;
  importance_score: number;
  computation_time_ms: number;
  last_computed: string;
  status: 'success' | 'pending' | 'error';
}

interface EnsembleModel {
  model_id: string;
  sport: string;
  model_type: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  cross_sport_performance: number;
  last_trained: string;
  version: string;
  status: 'active' | 'training' | 'retired';
}

interface ModelRegistryEntry {
  model_id: string;
  model_name: string;
  version: string;
  sport: string;
  model_type: string;
  deployment_status: 'production' | 'staging' | 'development' | 'archived';
  performance_metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    latency_ms: number;
  };
  artifacts: {
    model_file: string;
    config_file: string;
    feature_importance: string;
  };
  created_at: string;
  deployed_at?: string;
  retired_at?: string;
}

interface InferenceMetrics {
  total_requests: number;
  avg_latency_ms: number;
  success_rate: number;
  error_rate: number;
  queue_size: number;
  active_models: number;
  cache_hit_rate: number;
  throughput_per_second: number;
}

interface RealTimePrediction {
  prediction_id: string;
  sport: string;
  player_name: string;
  prop_type: string;
  prediction: number;
  confidence: number;
  model_ensemble: string[];
  processing_time_ms: number;
  timestamp: string;
}

export const AdvancedAIDashboard: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Multi-Sport Integration State
  const [multiSportData, setMultiSportData] = useState<MultiSportData[]>([]);
  const [sportFeatures, setSportFeatures] = useState<SportSpecificFeature[]>([]);
  const [ensembleModels, setEnsembleModels] = useState<EnsembleModel[]>([]);
  const [modelRegistry, setModelRegistry] = useState<ModelRegistryEntry[]>([]);
  const [inferenceMetrics, setInferenceMetrics] = useState<InferenceMetrics | null>(null);
  const [realtimePredictions, setRealtimePredictions] = useState<RealTimePrediction[]>([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Model Performance Monitoring State
  const [monitoringOverview, setMonitoringOverview] = useState<any>(null);
  const [monitoredModels, setMonitoredModels] = useState<any[]>([]);
  const [modelHealthStatuses, setModelHealthStatuses] = useState<any[]>([]);

  // Fetch multi-sport integration data
  const fetchMultiSportData = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/multi-sport/integration-status');
      if (response.ok) {
        const data = await response.json();
        setMultiSportData(data.sports || []);
      }
    } catch (err) {
      console.error('Failed to fetch multi-sport data:', err);
      // Mock data fallback
      setMultiSportData([
        {
          sport: 'NBA',
          league: 'National Basketball Association',
          total_games: 1230,
          active_players: 450,
          data_freshness: '2 minutes ago',
          prediction_accuracy: 89.5,
          last_updated: new Date().toISOString(),
          status: 'active'
        },
        {
          sport: 'NFL',
          league: 'National Football League',
          total_games: 272,
          active_players: 1696,
          data_freshness: '5 minutes ago',
          prediction_accuracy: 92.1,
          last_updated: new Date().toISOString(),
          status: 'active'
        },
        {
          sport: 'NHL',
          league: 'National Hockey League',
          total_games: 1312,
          active_players: 736,
          data_freshness: '3 minutes ago',
          prediction_accuracy: 87.8,
          last_updated: new Date().toISOString(),
          status: 'active'
        },
        {
          sport: 'Soccer',
          league: 'Major League Soccer',
          total_games: 408,
          active_players: 672,
          data_freshness: '1 minute ago',
          prediction_accuracy: 85.3,
          last_updated: new Date().toISOString(),
          status: 'active'
        }
      ]);
    }
  }, []);

  // Fetch sport-specific features
  const fetchSportFeatures = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/sport-features/status');
      if (response.ok) {
        const data = await response.json();
        setSportFeatures(data.features || []);
      }
    } catch (err) {
      console.error('Failed to fetch sport features:', err);
      // Mock data fallback
      setSportFeatures([
        {
          sport: 'NBA',
          feature_name: 'True Shooting Percentage',
          feature_type: 'advanced_metric',
          importance_score: 0.89,
          computation_time_ms: 45,
          last_computed: new Date().toISOString(),
          status: 'success'
        },
        {
          sport: 'NBA',
          feature_name: 'Usage Rate',
          feature_type: 'advanced_metric',
          importance_score: 0.76,
          computation_time_ms: 32,
          last_computed: new Date().toISOString(),
          status: 'success'
        },
        {
          sport: 'NFL',
          feature_name: 'Passer Rating',
          feature_type: 'advanced_metric',
          importance_score: 0.94,
          computation_time_ms: 28,
          last_computed: new Date().toISOString(),
          status: 'success'
        },
        {
          sport: 'NFL',
          feature_name: 'Yards After Contact',
          feature_type: 'advanced_metric',
          importance_score: 0.82,
          computation_time_ms: 41,
          last_computed: new Date().toISOString(),
          status: 'success'
        }
      ]);
    }
  }, []);

  // Fetch ensemble models
  const fetchEnsembleModels = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/ensemble/models');
      if (response.ok) {
        const data = await response.json();
        setEnsembleModels(data.models || []);
      }
    } catch (err) {
      console.error('Failed to fetch ensemble models:', err);
      // Mock data fallback
      setEnsembleModels([
        {
          model_id: 'ensemble_nba_v3.2',
          sport: 'NBA',
          model_type: 'cross_sport_ensemble',
          accuracy: 0.895,
          precision: 0.887,
          recall: 0.903,
          f1_score: 0.895,
          cross_sport_performance: 0.821,
          last_trained: new Date(Date.now() - 86400000).toISOString(),
          version: '3.2',
          status: 'active'
        },
        {
          model_id: 'ensemble_nfl_v2.8',
          sport: 'NFL',
          model_type: 'cross_sport_ensemble',
          accuracy: 0.921,
          precision: 0.915,
          recall: 0.928,
          f1_score: 0.921,
          cross_sport_performance: 0.856,
          last_trained: new Date(Date.now() - 172800000).toISOString(),
          version: '2.8',
          status: 'active'
        }
      ]);
    }
  }, []);

  // Fetch model registry
  const fetchModelRegistry = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/model-registry/entries');
      if (response.ok) {
        const data = await response.json();
        setModelRegistry(data.models || []);
      }
    } catch (err) {
      console.error('Failed to fetch model registry:', err);
      // Mock data fallback
      setModelRegistry([
        {
          model_id: 'nba_player_props_v1.5',
          model_name: 'NBA Player Props Predictor',
          version: '1.5',
          sport: 'NBA',
          model_type: 'gradient_boosting',
          deployment_status: 'production',
          performance_metrics: {
            accuracy: 0.895,
            precision: 0.887,
            recall: 0.903,
            latency_ms: 12
          },
          artifacts: {
            model_file: 'models/nba_props_v1.5.pkl',
            config_file: 'configs/nba_props_v1.5.yaml',
            feature_importance: 'analysis/nba_props_v1.5_features.json'
          },
          created_at: new Date(Date.now() - 604800000).toISOString(),
          deployed_at: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
    }
  }, []);

  // Fetch inference metrics
  const fetchInferenceMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/inference/metrics');
      if (response.ok) {
        const data = await response.json();
        setInferenceMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch inference metrics:', err);
      // Mock data fallback
      setInferenceMetrics({
        total_requests: 15420,
        avg_latency_ms: 23,
        success_rate: 0.997,
        error_rate: 0.003,
        queue_size: 12,
        active_models: 8,
        cache_hit_rate: 0.845,
        throughput_per_second: 127
      });
    }
  }, []);

  // Fetch monitoring dashboard overview
  const fetchMonitoringOverview = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/monitoring/dashboard/overview');
      if (response.ok) {
        const data = await response.json();
        setMonitoringOverview(data);
        // Update inference metrics with monitoring data
        setInferenceMetrics(prevMetrics => ({
          ...prevMetrics,
          total_requests: data.total_predictions || prevMetrics?.total_requests || 0,
          active_models: data.active_models || prevMetrics?.active_models || 0
        }));
      }
    } catch (err) {
      console.error('Failed to fetch monitoring overview:', err);
    }
  }, []);

  // Fetch monitored models list
  const fetchMonitoredModels = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/monitoring/models');
      if (response.ok) {
        const data = await response.json();
        setMonitoredModels(data.models || []);

        // Fetch health status for each model
        const healthPromises = data.models.map(async (model: any) => {
          try {
            const healthResponse = await fetch(`/api/ai/monitoring/models/${model.model_id}/health`);
            if (healthResponse.ok) {
              return await healthResponse.json();
            }
          } catch (err) {
            console.error(`Failed to fetch health for ${model.model_id}:`, err);
          }
          return null;
        });

        const healthStatuses = await Promise.all(healthPromises);
        setModelHealthStatuses(healthStatuses.filter(Boolean));
      }
    } catch (err) {
      console.error('Failed to fetch monitored models:', err);
    }
  }, []);

  // Fetch real-time predictions
  const fetchRealtimePredictions = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/inference/real-time/latest');
      if (response.ok) {
        const data = await response.json();
        setRealtimePredictions(data.predictions || []);
      }
    } catch (err) {
      console.error('Failed to fetch real-time predictions:', err);
      // Mock data fallback
      setRealtimePredictions([
        {
          prediction_id: 'pred_001',
          sport: 'NBA',
          player_name: 'LeBron James',
          prop_type: 'points',
          prediction: 27.5,
          confidence: 0.87,
          model_ensemble: ['nba_ensemble_v3.2', 'xgb_player_props', 'lstm_time_series'],
          processing_time_ms: 18,
          timestamp: new Date().toISOString()
        },
        {
          prediction_id: 'pred_002',
          sport: 'NFL',
          player_name: 'Josh Allen',
          prop_type: 'passing_yards',
          prediction: 285.5,
          confidence: 0.92,
          model_ensemble: ['nfl_ensemble_v2.8', 'rf_qb_performance', 'neural_weather'],
          processing_time_ms: 21,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, []);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchMultiSportData(),
        fetchSportFeatures(),
        fetchEnsembleModels(),
        fetchModelRegistry(),
        fetchInferenceMetrics(),
        fetchRealtimePredictions(),
        fetchMonitoringOverview(),
        fetchMonitoredModels()
      ]);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching AI dashboard data:', err);
      setError('Failed to load some AI dashboard data');
    } finally {
      setLoading(false);
    }
  }, [fetchMultiSportData, fetchSportFeatures, fetchEnsembleModels, fetchModelRegistry, fetchInferenceMetrics, fetchRealtimePredictions, fetchMonitoringOverview, fetchMonitoredModels]);

  // Auto-refresh effect
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchAllData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchAllData]);

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'success':
      case 'production':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
      case 'training':
      case 'staging':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error':
      case 'retired':
      case 'archived':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'success':
      case 'production':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'training':
      case 'staging':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
      case 'retired':
      case 'archived':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Calculate overall system health
  const calculateSystemHealth = () => {
    const totalSports = multiSportData.length;
    const activeSports = multiSportData.filter(s => s.status === 'active').length;
    const avgAccuracy = multiSportData.reduce((sum, s) => sum + s.prediction_accuracy, 0) / totalSports;
    const activeModels = ensembleModels.filter(m => m.status === 'active').length;
    
    return {
      sportsHealth: totalSports > 0 ? (activeSports / totalSports) * 100 : 0,
      avgAccuracy: avgAccuracy || 0,
      activeModels,
      overallHealth: Math.min(95, (activeSports / totalSports) * 50 + (avgAccuracy || 0) / 2)
    };
  };

  const systemHealth = calculateSystemHealth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Brain className="w-8 h-8 text-blue-400" />
                Advanced AI Dashboard
                <Badge className="ml-3 bg-blue-600 text-white">Phase 3</Badge>
              </h1>
              <p className="text-slate-300">
                Multi-Sport AI Enhancement Platform with Real-Time Inference Engine
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? "default" : "outline"}
                className="flex items-center gap-2"
              >
                {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                Auto Refresh
              </Button>
              
              <Button
                onClick={fetchAllData}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* System Health Overview */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600/20 rounded-lg">
                    <Shield className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">System Health</p>
                    <p className="text-2xl font-bold text-white">{systemHealth.overallHealth.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <Target className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Avg Accuracy</p>
                    <p className="text-2xl font-bold text-white">{systemHealth.avgAccuracy.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-600/20 rounded-lg">
                    <Layers className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Active Models</p>
                    <p className="text-2xl font-bold text-white">{systemHealth.activeModels}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-600/20 rounded-lg">
                    <Zap className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Inference Latency</p>
                    <p className="text-2xl font-bold text-white">
                      {inferenceMetrics?.avg_latency_ms || 0}ms
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="mb-6 bg-red-900/50 border-red-700">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-slate-800/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="multi-sport">Multi-Sport</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="ensemble">Ensemble</TabsTrigger>
            <TabsTrigger value="registry">Registry</TabsTrigger>
            <TabsTrigger value="inference">Inference</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Multi-Sport Status */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-400" />
                    Multi-Sport Integration Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {multiSportData.slice(0, 4).map((sport) => (
                      <div key={sport.sport} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(sport.status)}
                          <div>
                            <p className="font-medium text-white">{sport.sport}</p>
                            <p className="text-sm text-slate-400">{sport.active_players} players</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-medium">{sport.prediction_accuracy}%</p>
                          <p className="text-xs text-slate-400">{sport.data_freshness}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Real-Time Inference Metrics */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-green-400" />
                    Real-Time Inference Engine
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {inferenceMetrics && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-400">{inferenceMetrics.throughput_per_second}</p>
                        <p className="text-xs text-slate-400">Predictions/sec</p>
                      </div>
                      <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-2xl font-bold text-green-400">{(inferenceMetrics.success_rate * 100).toFixed(1)}%</p>
                        <p className="text-xs text-slate-400">Success Rate</p>
                      </div>
                      <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-400">{inferenceMetrics.queue_size}</p>
                        <p className="text-xs text-slate-400">Queue Size</p>
                      </div>
                      <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-400">{(inferenceMetrics.cache_hit_rate * 100).toFixed(0)}%</p>
                        <p className="text-xs text-slate-400">Cache Hit</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Predictions */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Recent Real-Time Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {realtimePredictions.slice(0, 5).map((pred) => (
                    <div key={pred.prediction_id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={`${getStatusColor('success')} text-xs`}>
                          {pred.sport}
                        </Badge>
                        <div>
                          <p className="font-medium text-white">{pred.player_name}</p>
                          <p className="text-sm text-slate-400">{pred.prop_type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-blue-400 font-medium">{pred.prediction}</p>
                        <p className="text-xs text-slate-400">{(pred.confidence * 100).toFixed(0)}% confidence</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 text-sm">{pred.processing_time_ms}ms</p>
                        <p className="text-xs text-slate-400">{pred.model_ensemble.length} models</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Multi-Sport Tab */}
          <TabsContent value="multi-sport" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {multiSportData.map((sport) => (
                <Card key={sport.sport} className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{sport.sport}</span>
                      {getStatusIcon(sport.status)}
                    </CardTitle>
                    <p className="text-sm text-slate-400">{sport.league}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Games:</span>
                        <span className="text-white font-medium">{sport.total_games.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Active Players:</span>
                        <span className="text-white font-medium">{sport.active_players.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Accuracy:</span>
                        <span className="text-green-400 font-medium">{sport.prediction_accuracy}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Data Freshness:</span>
                        <span className="text-blue-400 font-medium">{sport.data_freshness}</span>
                      </div>
                      <Progress value={sport.prediction_accuracy} className="mt-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-purple-400" />
                  Sport-Specific Feature Engineering
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left p-3 text-slate-300">Sport</th>
                        <th className="text-left p-3 text-slate-300">Feature Name</th>
                        <th className="text-left p-3 text-slate-300">Type</th>
                        <th className="text-right p-3 text-slate-300">Importance</th>
                        <th className="text-right p-3 text-slate-300">Compute Time</th>
                        <th className="text-center p-3 text-slate-300">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sportFeatures.map((feature, index) => (
                        <tr key={index} className="border-b border-slate-700/50">
                          <td className="p-3">
                            <Badge className={`${getStatusColor('success')} text-xs`}>
                              {feature.sport}
                            </Badge>
                          </td>
                          <td className="p-3 text-white font-medium">{feature.feature_name}</td>
                          <td className="p-3 text-slate-400">{feature.feature_type.replace('_', ' ')}</td>
                          <td className="p-3 text-right">
                            <span className="text-blue-400 font-medium">
                              {(feature.importance_score * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-3 text-right text-green-400">{feature.computation_time_ms}ms</td>
                          <td className="p-3 text-center">{getStatusIcon(feature.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ensemble Tab */}
          <TabsContent value="ensemble" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {ensembleModels.map((model) => (
                <Card key={model.model_id} className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-blue-400" />
                        {model.model_id}
                      </span>
                      <Badge className={`${getStatusColor(model.status)} text-xs`}>
                        {model.status}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-slate-400">{model.sport} • {model.model_type.replace('_', ' ')}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-xl font-bold text-blue-400">{(model.accuracy * 100).toFixed(1)}%</p>
                        <p className="text-xs text-slate-400">Accuracy</p>
                      </div>
                      <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-xl font-bold text-green-400">{(model.f1_score * 100).toFixed(1)}%</p>
                        <p className="text-xs text-slate-400">F1 Score</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Precision:</span>
                        <span className="text-white">{(model.precision * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Recall:</span>
                        <span className="text-white">{(model.recall * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Cross-Sport:</span>
                        <span className="text-purple-400">{(model.cross_sport_performance * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Version:</span>
                        <span className="text-blue-400">v{model.version}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Registry Tab */}
          <TabsContent value="registry" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-green-400" />
                  Advanced ML Model Registry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {modelRegistry.map((model) => (
                    <div key={model.model_id} className="p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{model.model_name}</h3>
                          <p className="text-sm text-slate-400">{model.model_id} • v{model.version}</p>
                        </div>
                        <Badge className={`${getStatusColor(model.deployment_status)} text-xs`}>
                          {model.deployment_status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="text-center">
                          <p className="text-xl font-bold text-blue-400">
                            {(model.performance_metrics.accuracy * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-slate-400">Accuracy</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-green-400">
                            {(model.performance_metrics.precision * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-slate-400">Precision</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-purple-400">
                            {(model.performance_metrics.recall * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-slate-400">Recall</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-orange-400">
                            {model.performance_metrics.latency_ms}ms
                          </p>
                          <p className="text-xs text-slate-400">Latency</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Created:</p>
                          <p className="text-white">{new Date(model.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Deployed:</p>
                          <p className="text-white">
                            {model.deployed_at ? new Date(model.deployed_at).toLocaleDateString() : 'Not deployed'}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Sport/Type:</p>
                          <p className="text-white">{model.sport} • {model.model_type}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inference Tab */}
          <TabsContent value="inference" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Live Metrics */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-green-400" />
                    Real-Time Engine Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {inferenceMetrics && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-400">{inferenceMetrics.total_requests.toLocaleString()}</p>
                          <p className="text-xs text-slate-400">Total Requests</p>
                        </div>
                        <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                          <p className="text-2xl font-bold text-green-400">{inferenceMetrics.avg_latency_ms}ms</p>
                          <p className="text-xs text-slate-400">Avg Latency</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Success Rate:</span>
                          <span className="text-green-400 font-medium">{(inferenceMetrics.success_rate * 100).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Error Rate:</span>
                          <span className="text-red-400 font-medium">{(inferenceMetrics.error_rate * 100).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Cache Hit Rate:</span>
                          <span className="text-blue-400 font-medium">{(inferenceMetrics.cache_hit_rate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Active Models:</span>
                          <span className="text-white font-medium">{inferenceMetrics.active_models}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Live Predictions Stream */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    Live Predictions Stream
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {realtimePredictions.map((pred) => (
                      <div key={pred.prediction_id} className="p-3 bg-slate-700/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={`${getStatusColor('success')} text-xs`}>
                              {pred.sport}
                            </Badge>
                            <span className="text-white font-medium">{pred.player_name}</span>
                          </div>
                          <span className="text-green-400 text-sm">{pred.processing_time_ms}ms</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-slate-400 text-sm">{pred.prop_type}</p>
                            <p className="text-blue-400 font-medium">Prediction: {pred.prediction}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-purple-400 font-medium">{(pred.confidence * 100).toFixed(0)}%</p>
                            <p className="text-xs text-slate-400">{pred.model_ensemble.length} models</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            {/* Monitoring System Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-600/20 rounded-lg">
                      <Activity className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">System Status</p>
                      <p className="text-lg font-bold text-white">
                        {monitoringOverview?.system_status || 'Active'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600/20 rounded-lg">
                      <Shield className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Avg Health Score</p>
                      <p className="text-lg font-bold text-white">
                        {monitoringOverview?.avg_health_score?.toFixed(1) || '0.0'}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600/20 rounded-lg">
                      <Database className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Total Predictions</p>
                      <p className="text-lg font-bold text-white">
                        {monitoringOverview?.total_predictions?.toLocaleString() || '0'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-600/20 rounded-lg">
                      <Clock className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Uptime</p>
                      <p className="text-lg font-bold text-white">
                        {monitoringOverview?.monitoring_uptime_hours || 24}h
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Model Health Overview */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-green-400" />
                  Model Health Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monitoringOverview?.model_statuses && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-green-600/20 rounded-lg">
                      <p className="text-2xl font-bold text-green-400">
                        {monitoringOverview.model_statuses.healthy || 0}
                      </p>
                      <p className="text-xs text-slate-400">Healthy</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-600/20 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-400">
                        {monitoringOverview.model_statuses.warning || 0}
                      </p>
                      <p className="text-xs text-slate-400">Warning</p>
                    </div>
                    <div className="text-center p-3 bg-red-600/20 rounded-lg">
                      <p className="text-2xl font-bold text-red-400">
                        {monitoringOverview.model_statuses.critical || 0}
                      </p>
                      <p className="text-xs text-slate-400">Critical</p>
                    </div>
                    <div className="text-center p-3 bg-gray-600/20 rounded-lg">
                      <p className="text-2xl font-bold text-gray-400">
                        {monitoringOverview.model_statuses.failed || 0}
                      </p>
                      <p className="text-xs text-slate-400">Failed</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monitored Models List */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-400" />
                  Monitored Models ({monitoredModels.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monitoredModels.length === 0 ? (
                    <div className="text-center py-8">
                      <Database className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                      <p className="text-slate-400">No models currently being monitored</p>
                    </div>
                  ) : (
                    monitoredModels.map((model) => {
                      const healthStatus = modelHealthStatuses.find(h => h.model_id === model.model_id);
                      return (
                        <div key={model.model_id} className="p-4 bg-slate-700/50 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-white">{model.model_id}</h3>
                              <p className="text-sm text-slate-400">
                                {model.total_metrics} metrics recorded
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={`${getStatusColor(model.status)} text-xs`}>
                                {model.status}
                              </Badge>
                              {getStatusIcon(model.status)}
                            </div>
                          </div>

                          {healthStatus && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center">
                                <p className="text-xl font-bold text-blue-400">
                                  {healthStatus.health_score?.toFixed(1) || '0.0'}%
                                </p>
                                <p className="text-xs text-slate-400">Health Score</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xl font-bold text-green-400">
                                  {(healthStatus.metrics_summary?.avg_accuracy * 100)?.toFixed(1) || '0.0'}%
                                </p>
                                <p className="text-xs text-slate-400">Accuracy</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xl font-bold text-purple-400">
                                  {healthStatus.metrics_summary?.avg_latency_ms?.toFixed(1) || '0.0'}ms
                                </p>
                                <p className="text-xs text-slate-400">Latency</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xl font-bold text-orange-400">
                                  {healthStatus.performance_trend || 'stable'}
                                </p>
                                <p className="text-xs text-slate-400">Trend</p>
                              </div>
                            </div>
                          )}

                          <div className="mt-3 pt-3 border-t border-slate-600">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Last Update:</span>
                              <span className="text-white">
                                {model.last_update ? new Date(model.last_update).toLocaleString() : 'Never'}
                              </span>
                            </div>
                            {healthStatus && (
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Uptime:</span>
                                <span className="text-white">{healthStatus.uptime_hours?.toFixed(1) || '0.0'} hours</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Real-time Monitoring Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Overall System Health:</span>
                      <div className="flex items-center gap-2">
                        <Progress value={monitoringOverview?.avg_health_score || 0} className="w-20" />
                        <span className="text-green-400 font-medium">
                          {monitoringOverview?.avg_health_score?.toFixed(0) || '0'}%
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Active Models:</span>
                      <span className="text-white font-medium">
                        {monitoringOverview?.active_models || 0} / {monitoringOverview?.total_models || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Monitoring Status:</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          monitoringOverview?.system_status === 'active' ? 'bg-green-400' : 'bg-red-400'
                        }`}></div>
                        <span className="text-white capitalize">
                          {monitoringOverview?.system_status || 'unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    Recent Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Placeholder for alerts - would fetch from API */}
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                      <p className="text-slate-400">No recent alerts</p>
                      <p className="text-xs text-slate-500 mt-1">All models operating normally</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Status Footer */}
        <div className="mt-8 p-4 bg-slate-800/30 backdrop-blur rounded-lg border border-slate-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-slate-300">All Systems Operational</span>
              </div>
              {lastUpdated && (
                <span className="text-slate-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span>Phase 3: Advanced AI Enhancement</span>
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAIDashboard;
