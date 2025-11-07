import React, { useEffect, useState } from 'react';
import { _Card as Card, _CardContent as CardContent, _CardHeader as CardHeader, _CardTitle as CardTitle } from '../ui/card';
import { _Badge as Badge } from '../ui/badge';
import { AlertCircle, CheckCircle, Clock, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface CLVMetrics {
  enabled: boolean;
  reason?: string;
  totalEnrichments: number;
  successfulEnrichments: number;
  failedEnrichments: number;
  averageProcessingTime: number;
  cacheHitRate: number;
  lastProcessedAt: string;
}

interface CLVSystemHealth {
  status: 'healthy' | 'warning' | 'error';
  uptime: number;
  memoryUsage: number;
  errorRate: number;
  latency: {
    p50: number;
    p95: number;
    p99: number;
  };
}

const CLVMetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<CLVMetrics | null>(null);
  const [health, setHealth] = useState<CLVSystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCLVMetrics();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchCLVMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCLVMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch CLV metrics summary
      const metricsResponse = await fetch('/api/propfinder/opportunities/metrics-summary');
      if (!metricsResponse.ok) {
        throw new Error(`Failed to fetch CLV metrics: ${metricsResponse.status}`);
      }
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData.data);

      // Fetch system health (mock data for now - would come from real monitoring)
      setHealth({
        status: metricsData.data.enabled ? 'healthy' : 'warning',
        uptime: 98.5,
        memoryUsage: 245,
        errorRate: 0.02,
        latency: {
          p50: 120,
          p95: 450,
          p99: 890
        }
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch CLV metrics');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  const getStatusBadge = (enabled: boolean, reason?: string) => {
    if (enabled) {
      return <Badge className="bg-green-500 hover:bg-green-600">Enabled</Badge>;
    }
    return (
      <Badge className="bg-yellow-500 hover:bg-yellow-600">
        Disabled {reason && `(${reason})`}
      </Badge>
    );
  };

  const getHealthStatusBadge = (status: string) => {
    const statusColors = {
      healthy: 'bg-green-500 hover:bg-green-600',
      warning: 'bg-yellow-500 hover:bg-yellow-600',
      error: 'bg-red-500 hover:bg-red-600'
    };
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-500'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Activity className="animate-spin mx-auto mb-4 h-8 w-8 text-blue-500" />
          <p className="text-gray-600">Loading CLV metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <h3 className="text-lg font-semibold mb-2">Error Loading CLV Metrics</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchCLVMetrics}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CLV Metrics Dashboard</h1>
          <p className="text-gray-600">Monitor Customer Lifetime Value processing and system health</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
            <button
              onClick={fetchCLVMetrics}
              disabled={loading}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">CLV Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {getStatusBadge(metrics?.enabled || false, metrics?.reason)}
                {metrics?.enabled ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {health && getHealthStatusBadge(health.status)}
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {metrics && metrics.totalEnrichments > 0
                    ? ((metrics.successfulEnrichments / metrics.totalEnrichments) * 100).toFixed(1)
                    : '0'}%
                </span>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {metrics?.cacheHitRate ? (metrics.cacheHitRate * 100).toFixed(1) : '0'}%
                </span>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Processing Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Processing Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Enrichments</span>
                  <span className="text-lg font-bold">{metrics?.totalEnrichments || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Successful</span>
                  <span className="text-lg font-bold text-green-600">{metrics?.successfulEnrichments || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Failed</span>
                  <span className="text-lg font-bold text-red-600">{metrics?.failedEnrichments || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average Processing Time</span>
                  <span className="text-lg font-bold">{metrics?.averageProcessingTime || 0}ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Last Processed</span>
                  <span className="text-sm text-gray-600">
                    {metrics?.lastProcessedAt ? formatTimestamp(metrics.lastProcessedAt) : 'Never'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {health && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Uptime</span>
                    <span className="text-lg font-bold">{health.uptime}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-lg font-bold">{health.memoryUsage}MB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Error Rate</span>
                    <span className="text-lg font-bold">{(health.errorRate * 100).toFixed(2)}%</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Latency Percentiles</div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <div className="font-medium">P50</div>
                        <div className="text-gray-600">{health.latency.p50}ms</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">P95</div>
                        <div className="text-gray-600">{health.latency.p95}ms</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">P99</div>
                        <div className="text-gray-600">{health.latency.p99}ms</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Configuration Information */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration & Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Configuration</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Feature flag: <code>enable_clv_metrics</code></li>
                  <li>• Cache duration: 60 seconds</li>
                  <li>• Batch processing enabled</li>
                  <li>• Prometheus metrics collection</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Troubleshooting</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Check backend logs for CLV errors</li>
                  <li>• Verify feature flag configuration</li>
                  <li>• Monitor Prometheus metrics</li>
                  <li>• Review API endpoint health</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CLVMetricsDashboard;