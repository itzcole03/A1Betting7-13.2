import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Database,
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
  Gauge
} from 'lucide-react';

// Types for data ecosystem monitoring
interface DataSource {
  id: string;
  name: string;
  type: 'player_tracking' | 'alternative_data' | 'niche_sports' | 'betting_odds';
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  health_score: number;
  last_updated: string;
  data_points: number;
  latency_ms: number;
}

interface ValidationMetrics {
  data_source: string;
  total_validations: number;
  issues_found: number;
  success_rate: number;
  critical_issues: number;
  auto_fixes: number;
}

interface CacheMetrics {
  cache_type: string;
  hit_rate: number;
  miss_rate: number;
  total_requests: number;
  average_response_time: number;
  memory_usage_mb: number;
}

interface WarehouseMetrics {
  total_storage_gb: number;
  compression_ratio: number;
  query_performance_ms: number;
  optimization_score: number;
  active_partitions: number;
  cache_efficiency: number;
}

interface SystemAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  source: string;
  resolved: boolean;
}

const DataEcosystemDashboard: React.FC = () => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [validationMetrics, setValidationMetrics] = useState<ValidationMetrics[]>([]);
  const [cacheMetrics, setCacheMetrics] = useState<CacheMetrics[]>([]);
  const [warehouseMetrics, setWarehouseMetrics] = useState<WarehouseMetrics | null>(null);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Mock data for demonstration
  const initializeMockData = useCallback(() => {
    const mockDataSources: DataSource[] = [
      {
        id: 'player_tracking',
        name: 'Advanced Player Tracking',
        type: 'player_tracking',
        status: 'healthy',
        health_score: 0.95,
        last_updated: new Date(Date.now() - 30000).toISOString(),
        data_points: 1250000,
        latency_ms: 45
      },
      {
        id: 'sentiment_data',
        name: 'Social Sentiment Data',
        type: 'alternative_data',
        status: 'warning',
        health_score: 0.78,
        last_updated: new Date(Date.now() - 300000).toISOString(),
        data_points: 890000,
        latency_ms: 120
      },
      {
        id: 'niche_sports',
        name: 'Niche Sports Integration',
        type: 'niche_sports',
        status: 'healthy',
        health_score: 0.89,
        last_updated: new Date(Date.now() - 60000).toISOString(),
        data_points: 450000,
        latency_ms: 67
      },
      {
        id: 'betting_odds',
        name: 'Betting Odds Feed',
        type: 'betting_odds',
        status: 'critical',
        health_score: 0.62,
        last_updated: new Date(Date.now() - 900000).toISOString(),
        data_points: 2100000,
        latency_ms: 250
      }
    ];

    const mockValidationMetrics: ValidationMetrics[] = [
      {
        data_source: 'player_stats',
        total_validations: 15420,
        issues_found: 234,
        success_rate: 0.985,
        critical_issues: 12,
        auto_fixes: 189
      },
      {
        data_source: 'betting_odds',
        total_validations: 28930,
        issues_found: 1250,
        success_rate: 0.957,
        critical_issues: 89,
        auto_fixes: 1050
      },
      {
        data_source: 'social_sentiment',
        total_validations: 8450,
        issues_found: 67,
        success_rate: 0.992,
        critical_issues: 3,
        auto_fixes: 61
      }
    ];

    const mockCacheMetrics: CacheMetrics[] = [
      {
        cache_type: 'betting_odds',
        hit_rate: 0.94,
        miss_rate: 0.06,
        total_requests: 450000,
        average_response_time: 12.5,
        memory_usage_mb: 2048
      },
      {
        cache_type: 'player_stats',
        hit_rate: 0.87,
        miss_rate: 0.13,
        total_requests: 320000,
        average_response_time: 18.3,
        memory_usage_mb: 1536
      },
      {
        cache_type: 'predictions',
        hit_rate: 0.91,
        miss_rate: 0.09,
        total_requests: 180000,
        average_response_time: 8.7,
        memory_usage_mb: 1024
      }
    ];

    const mockWarehouseMetrics: WarehouseMetrics = {
      total_storage_gb: 2847.5,
      compression_ratio: 4.2,
      query_performance_ms: 125.8,
      optimization_score: 0.82,
      active_partitions: 348,
      cache_efficiency: 0.89
    };

    const mockAlerts: SystemAlert[] = [
      {
        id: 'alert_1',
        severity: 'critical',
        message: 'Betting odds data source latency exceeded threshold (250ms)',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        source: 'betting_odds',
        resolved: false
      },
      {
        id: 'alert_2',
        severity: 'medium',
        message: 'Social sentiment cache hit rate below optimal (78%)',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        source: 'sentiment_data',
        resolved: false
      },
      {
        id: 'alert_3',
        severity: 'low',
        message: 'Player tracking data validation found 12 anomalies',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        source: 'player_tracking',
        resolved: true
      }
    ];

    setDataSources(mockDataSources);
    setValidationMetrics(mockValidationMetrics);
    setCacheMetrics(mockCacheMetrics);
    setWarehouseMetrics(mockWarehouseMetrics);
    setSystemAlerts(mockAlerts);
    setIsLoading(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    initializeMockData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      initializeMockData();
    }, 30000);

    return () => clearInterval(interval);
  }, [initializeMockData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'offline':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      initializeMockData();
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading data ecosystem status...</span>
      </div>
    );
  }

  const totalValidations = validationMetrics.reduce((sum, metric) => sum + metric.total_validations, 0);
  const totalIssues = validationMetrics.reduce((sum, metric) => sum + metric.issues_found, 0);
  const overallSuccessRate = totalValidations > 0 ? 1 - (totalIssues / totalValidations) : 1;

  const totalCacheRequests = cacheMetrics.reduce((sum, metric) => sum + metric.total_requests, 0);
  const averageCacheHitRate = cacheMetrics.length > 0 
    ? cacheMetrics.reduce((sum, metric) => sum + metric.hit_rate, 0) / cacheMetrics.length 
    : 0;

  const healthySources = dataSources.filter(source => source.status === 'healthy').length;
  const totalSources = dataSources.length;

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Ecosystem Monitor</h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring of A1Betting's data infrastructure and quality
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Last updated: {formatTimestamp(lastRefresh.toISOString())}
          </div>
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Sources</p>
                <p className="text-3xl font-bold text-gray-900">
                  {healthySources}/{totalSources}
                </p>
                <p className="text-sm text-green-600">
                  {Math.round((healthySources / totalSources) * 100)}% healthy
                </p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Quality</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(overallSuccessRate * 100)}%
                </p>
                <p className="text-sm text-gray-500">
                  {totalIssues} issues found
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(averageCacheHitRate * 100)}%
                </p>
                <p className="text-sm text-gray-500">
                  {totalCacheRequests.toLocaleString()} requests
                </p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Storage</p>
                <p className="text-3xl font-bold text-gray-900">
                  {warehouseMetrics?.total_storage_gb.toFixed(1)}GB
                </p>
                <p className="text-sm text-gray-500">
                  {warehouseMetrics?.compression_ratio.toFixed(1)}x compressed
                </p>
              </div>
              <HardDrive className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {systemAlerts.filter(alert => !alert.resolved).length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Active Alerts:</strong> {systemAlerts.filter(alert => !alert.resolved).length} issues require attention
          </AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="sources" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sources">Data Sources</TabsTrigger>
          <TabsTrigger value="validation">Data Validation</TabsTrigger>
          <TabsTrigger value="cache">Cache Performance</TabsTrigger>
          <TabsTrigger value="warehouse">Data Warehouse</TabsTrigger>
          <TabsTrigger value="alerts">System Alerts</TabsTrigger>
        </TabsList>

        {/* Data Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Data Sources Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {dataSources.map((source) => (
                  <div 
                    key={source.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(source.status)}
                      <div>
                        <h3 className="font-medium text-gray-900">{source.name}</h3>
                        <p className="text-sm text-gray-500">
                          {source.data_points.toLocaleString()} data points
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          Health: {Math.round(source.health_score * 100)}%
                        </div>
                        <div className="text-sm text-gray-500">
                          Latency: {source.latency_ms}ms
                        </div>
                      </div>
                      
                      <Progress 
                        value={source.health_score * 100} 
                        className="w-24"
                      />
                      
                      <Badge className={getStatusColor(source.status)}>
                        {source.status}
                      </Badge>
                      
                      <div className="text-sm text-gray-500">
                        {formatTimestamp(source.last_updated)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Phase 2 Implementation Status */}
          <Card>
            <CardHeader>
              <CardTitle>Phase 2: Data Ecosystem Expansion Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Phase 2.1: Data Source Integration</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Advanced Player Tracking</span>
                      <Badge className="bg-green-100 text-green-800">Complete</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Alternative Data Sources</span>
                      <Badge className="bg-green-100 text-green-800">Complete</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Niche Sports Integration</span>
                      <Badge className="bg-green-100 text-green-800">Complete</Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Phase 2.2: Data Quality & Performance</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Data Validation & Anomaly Detection</span>
                      <Badge className="bg-green-100 text-green-800">Complete</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Intelligent Caching Strategy</span>
                      <Badge className="bg-green-100 text-green-800">Complete</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Data Warehouse Optimization</span>
                      <Badge className="bg-green-100 text-green-800">Complete</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Validation Tab */}
        <TabsContent value="validation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Data Validation Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {validationMetrics.map((metric, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900 capitalize">
                        {metric.data_source.replace('_', ' ')}
                      </h3>
                      <Badge className={
                        metric.success_rate > 0.95 
                          ? 'bg-green-100 text-green-800'
                          : metric.success_rate > 0.9 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }>
                        {Math.round(metric.success_rate * 100)}% success rate
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Validations</div>
                        <div className="font-medium">{metric.total_validations.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Issues Found</div>
                        <div className="font-medium text-red-600">{metric.issues_found}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Critical Issues</div>
                        <div className="font-medium text-red-800">{metric.critical_issues}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Auto Fixes</div>
                        <div className="font-medium text-green-600">{metric.auto_fixes}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Fix Rate</div>
                        <div className="font-medium">
                          {Math.round((metric.auto_fixes / metric.issues_found) * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cache Performance Tab */}
        <TabsContent value="cache" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Cache Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {cacheMetrics.map((metric, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900 capitalize">
                        {metric.cache_type.replace('_', ' ')} Cache
                      </h3>
                      <Badge className={
                        metric.hit_rate > 0.9 
                          ? 'bg-green-100 text-green-800'
                          : metric.hit_rate > 0.8 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }>
                        {Math.round(metric.hit_rate * 100)}% hit rate
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Total Requests</div>
                        <div className="font-medium">{metric.total_requests.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Hit Rate</div>
                        <div className="font-medium text-green-600">
                          {Math.round(metric.hit_rate * 100)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Miss Rate</div>
                        <div className="font-medium text-red-600">
                          {Math.round(metric.miss_rate * 100)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Avg Response</div>
                        <div className="font-medium">{metric.average_response_time.toFixed(1)}ms</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Memory Usage</div>
                        <div className="font-medium">{metric.memory_usage_mb}MB</div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Cache Efficiency</span>
                        <span>{Math.round(metric.hit_rate * 100)}%</span>
                      </div>
                      <Progress value={metric.hit_rate * 100} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Warehouse Tab */}
        <TabsContent value="warehouse" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="h-5 w-5 mr-2" />
                Data Warehouse Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {warehouseMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Storage Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Storage</span>
                        <span className="font-medium">{warehouseMetrics.total_storage_gb.toFixed(1)} GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Compression Ratio</span>
                        <span className="font-medium">{warehouseMetrics.compression_ratio.toFixed(1)}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Active Partitions</span>
                        <span className="font-medium">{warehouseMetrics.active_partitions}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Performance Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Query Performance</span>
                        <span className="font-medium">{warehouseMetrics.query_performance_ms.toFixed(1)}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Cache Efficiency</span>
                        <span className="font-medium">{Math.round(warehouseMetrics.cache_efficiency * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Optimization Score</span>
                        <span className="font-medium">{Math.round(warehouseMetrics.optimization_score * 100)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Health Status</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Storage Optimization</span>
                          <span>{Math.round(warehouseMetrics.optimization_score * 100)}%</span>
                        </div>
                        <Progress value={warehouseMetrics.optimization_score * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Query Performance</span>
                          <span>{warehouseMetrics.query_performance_ms < 100 ? 'Excellent' : warehouseMetrics.query_performance_ms < 200 ? 'Good' : 'Needs Improvement'}</span>
                        </div>
                        <Progress 
                          value={Math.max(0, 100 - (warehouseMetrics.query_performance_ms / 5))} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                System Alerts & Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemAlerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className={`p-4 border rounded-lg ${alert.resolved ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                          alert.severity === 'critical' ? 'text-red-500' :
                          alert.severity === 'high' ? 'text-orange-500' :
                          alert.severity === 'medium' ? 'text-yellow-500' :
                          'text-blue-500'
                        }`} />
                        <div>
                          <p className="font-medium text-gray-900">{alert.message}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>Source: {alert.source}</span>
                            <span>{formatTimestamp(alert.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        {alert.resolved && (
                          <Badge className="bg-green-100 text-green-800">
                            Resolved
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {systemAlerts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No active alerts. All systems operating normally.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataEcosystemDashboard;
