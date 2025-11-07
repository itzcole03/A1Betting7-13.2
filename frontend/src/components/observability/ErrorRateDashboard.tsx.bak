import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { AlertTriangle, CheckCircle, XCircle, Activity, Wifi, WifiOff } from 'lucide-react';
import { buildWebSocketUrl } from '../../utils/websocketBuilder';

interface ErrorMetric {
  timestamp: number;
  errorRate: number;
  totalRequests: number;
  errorCount: number;
  responseTime: number;
  endpoint?: string;
  errorType?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface SystemHealth {
  webSocketConnected: boolean;
  apiHealthy: boolean;
  databaseConnected: boolean;
  lastUpdate: number;
  uptime: number;
}

interface DashboardProps {
  updateInterval?: number;
  retentionMinutes?: number;
  enableNotifications?: boolean;
}

const COLORS = {
  success: '#10B981',
  warning: '#F59E0B', 
  error: '#EF4444',
  critical: '#DC2626',
  info: '#3B82F6',
  background: '#1F2937',
  surface: '#374151',
  text: '#F9FAFB',
  muted: '#9CA3AF'
};

/**
 * Real-time Error Rate Dashboard Component
 * Epic 8 Implementation - Observability Metrics & Offline Queue
 * 
 * Features:
 * - Real-time error rate monitoring
 * - WebSocket connectivity status
 * - System health indicators
 * - Historical error trends
 * - Endpoint-specific error breakdown
 * - Alert notifications
 */
export const ErrorRateDashboard: React.FC<DashboardProps> = ({
  updateInterval = 5000,
  retentionMinutes = 60,
  enableNotifications = true
}) => {
  const [errorMetrics, setErrorMetrics] = useState<ErrorMetric[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    webSocketConnected: false,
    apiHealthy: false,
    databaseConnected: false,
    lastUpdate: Date.now(),
    uptime: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);

  // WebSocket connection for real-time metrics
  useEffect(() => {
    // Use canonical WebSocket URL builder with specific path for metrics
    const wsUrl = buildWebSocketUrl({ baseUrl: 'ws://localhost:8000', clientId: 'metrics-dashboard' });
    // Override path for metrics endpoint (this is a special case)
    const metricsUrl = wsUrl.replace('/ws/client', '/ws/metrics');
    const ws = new WebSocket(metricsUrl);
    
    ws.onopen = () => {
      setIsConnected(true);
      setSystemHealth(prev => ({ ...prev, webSocketConnected: true }));
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      setSystemHealth(prev => ({ ...prev, webSocketConnected: false }));
    };
    
    ws.onerror = () => {
      setIsConnected(false);
      setSystemHealth(prev => ({ ...prev, webSocketConnected: false }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'error_metrics') {
          const newMetric: ErrorMetric = {
            timestamp: data.timestamp,
            errorRate: data.error_rate,
            totalRequests: data.total_requests,
            errorCount: data.error_count,
            responseTime: data.avg_response_time,
            endpoint: data.endpoint,
            errorType: data.error_type,
            severity: data.severity
          };
          
          setErrorMetrics(prev => {
            const cutoffTime = Date.now() - (retentionMinutes * 60 * 1000);
            const filtered = prev.filter(m => m.timestamp > cutoffTime);
            return [...filtered, newMetric].slice(-1000); // Keep last 1000 points
          });
          
          // Check for alerts
          if (data.error_rate > 10 && enableNotifications) {
            const alertMessage = `High error rate detected: ${data.error_rate}% on ${data.endpoint || 'system'}`;
            setAlerts(prev => [...prev.slice(-9), alertMessage]); // Keep last 10 alerts
          }
        }
        
        if (data.type === 'system_health') {
          setSystemHealth({
            webSocketConnected: true,
            apiHealthy: data.api_healthy,
            databaseConnected: data.database_connected,
            lastUpdate: Date.now(),
            uptime: data.uptime
          });
        }
        
      } catch (error) {
        // Handle WebSocket parsing errors gracefully
        // eslint-disable-next-line no-console
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    return () => {
      ws.close();
    };
  }, [retentionMinutes, enableNotifications]);
  
  // Fallback polling when WebSocket is not available
  useEffect(() => {
    if (!isConnected) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch('/api/metrics/current');
          const data = await response.json();
          
          if (data.success) {
            const newMetric: ErrorMetric = {
              timestamp: Date.now(),
              errorRate: data.error_rate,
              totalRequests: data.total_requests,
              errorCount: data.error_count,
              responseTime: data.avg_response_time
            };
            
            setErrorMetrics(prev => {
              const cutoffTime = Date.now() - (retentionMinutes * 60 * 1000);
              const filtered = prev.filter(m => m.timestamp > cutoffTime);
              return [...filtered, newMetric].slice(-1000);
            });
          }
          
          // Update system health
          const healthResponse = await fetch('/api/system/health');
          const healthData = await healthResponse.json();
          
          if (healthData.success) {
            setSystemHealth(prev => ({
              ...prev,
              apiHealthy: healthData.healthy,
              databaseConnected: healthData.database_connected,
              lastUpdate: Date.now(),
              uptime: healthData.uptime
            }));
          }
          
        } catch (error) {
          // Handle metrics fetching errors gracefully
          // eslint-disable-next-line no-console
          console.error('Error fetching metrics:', error);
          setSystemHealth(prev => ({
            ...prev,
            apiHealthy: false,
            lastUpdate: Date.now()
          }));
        }
      }, updateInterval);
      
      return () => clearInterval(interval);
    }
  }, [isConnected, updateInterval, retentionMinutes]);

  // Calculate derived metrics
  const currentMetrics = useMemo(() => {
    if (errorMetrics.length === 0) return null;
    
    const latest = errorMetrics[errorMetrics.length - 1];
    const previous = errorMetrics.length > 1 ? errorMetrics[errorMetrics.length - 2] : null;
    
    return {
      currentErrorRate: latest.errorRate,
      errorRateTrend: previous ? latest.errorRate - previous.errorRate : 0,
      avgResponseTime: latest.responseTime,
      totalRequests: latest.totalRequests,
      errorCount: latest.errorCount
    };
  }, [errorMetrics]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return errorMetrics.map(metric => ({
      time: new Date(metric.timestamp).toLocaleTimeString(),
      timestamp: metric.timestamp,
      errorRate: metric.errorRate,
      responseTime: metric.responseTime / 10, // Scale down for dual axis
      requests: metric.totalRequests
    })).slice(-50); // Show last 50 points
  }, [errorMetrics]);

  // Error breakdown by endpoint
  const endpointBreakdown = useMemo(() => {
    const breakdown = new Map<string, { errors: number, total: number }>();
    
    errorMetrics.forEach(metric => {
      if (metric.endpoint) {
        const current = breakdown.get(metric.endpoint) || { errors: 0, total: 0 };
        breakdown.set(metric.endpoint, {
          errors: current.errors + metric.errorCount,
          total: current.total + metric.totalRequests
        });
      }
    });
    
    return Array.from(breakdown.entries()).map(([endpoint, stats]) => ({
      endpoint: endpoint.replace('/api/', ''),
      errorRate: stats.total > 0 ? (stats.errors / stats.total) * 100 : 0,
      errors: stats.errors,
      total: stats.total
    })).sort((a, b) => b.errorRate - a.errorRate).slice(0, 10);
  }, [errorMetrics]);

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Activity className="text-blue-400" />
              Error Rate Dashboard
            </h1>
            <p className="text-gray-400 mt-2">Real-time observability metrics and system health monitoring</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              isConnected ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
            }`}>
              {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
              <span className="text-sm font-medium">
                {isConnected ? 'Real-time' : 'Polling'}
              </span>
            </div>
            
            {/* Last Update */}
            <div className="text-sm text-gray-400">
              Last update: {new Date(systemHealth.lastUpdate).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* System Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Current Error Rate */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-200">Error Rate</h3>
              <div className={`p-2 rounded-lg ${
                (currentMetrics?.currentErrorRate ?? 0) > 5 ? 'bg-red-900/50' : 'bg-green-900/50'
              }`}>
                {(currentMetrics?.currentErrorRate ?? 0) > 5 ? 
                  <XCircle className="text-red-400" size={20} /> : 
                  <CheckCircle className="text-green-400" size={20} />
                }
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {currentMetrics?.currentErrorRate?.toFixed(1) ?? '0.0'}%
              </span>
              {currentMetrics?.errorRateTrend !== undefined && (
                <span className={`text-sm ${
                  currentMetrics.errorRateTrend > 0 ? 'text-red-400' : 'text-green-400'
                }`}>
                  {currentMetrics.errorRateTrend > 0 ? '↑' : '↓'} 
                  {Math.abs(currentMetrics.errorRateTrend).toFixed(1)}%
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mt-2">
              {currentMetrics?.errorCount ?? 0} errors / {currentMetrics?.totalRequests ?? 0} requests
            </p>
          </div>

          {/* Response Time */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-200">Avg Response Time</h3>
              <div className="p-2 bg-blue-900/50 rounded-lg">
                <Activity className="text-blue-400" size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {currentMetrics?.avgResponseTime?.toFixed(0) ?? '0'}
              </span>
              <span className="text-gray-400">ms</span>
            </div>
            <p className="text-gray-400 text-sm mt-2">Average response time</p>
          </div>

          {/* System Health */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-200">System Health</h3>
              <div className={`p-2 rounded-lg ${
                systemHealth.apiHealthy ? 'bg-green-900/50' : 'bg-red-900/50'
              }`}>
                {systemHealth.apiHealthy ? 
                  <CheckCircle className="text-green-400" size={20} /> : 
                  <XCircle className="text-red-400" size={20} />
                }
              </div>
            </div>
            <div className="space-y-2">
              <div className={`flex items-center gap-2 text-sm ${
                systemHealth.apiHealthy ? 'text-green-400' : 'text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  systemHealth.apiHealthy ? 'bg-green-400' : 'bg-red-400'
                }`} />
                API {systemHealth.apiHealthy ? 'Healthy' : 'Unhealthy'}
              </div>
              <div className={`flex items-center gap-2 text-sm ${
                systemHealth.databaseConnected ? 'text-green-400' : 'text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  systemHealth.databaseConnected ? 'bg-green-400' : 'bg-red-400'
                }`} />
                Database {systemHealth.databaseConnected ? 'Connected' : 'Disconnected'}
              </div>
              <div className={`flex items-center gap-2 text-sm ${
                systemHealth.webSocketConnected ? 'text-green-400' : 'text-yellow-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  systemHealth.webSocketConnected ? 'bg-green-400' : 'bg-yellow-400'
                }`} />
                WebSocket {systemHealth.webSocketConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>

          {/* Uptime */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-200">Uptime</h3>
              <div className="p-2 bg-purple-900/50 rounded-lg">
                <CheckCircle className="text-purple-400" size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                {formatUptime(systemHealth.uptime)}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-2">System runtime</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Error Rate Trend Chart */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">Error Rate Trend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#9CA3AF" 
                    fontSize={12}
                    interval="preserveStartEnd"
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                    formatter={(value: number | string, name: string) => [
                      name === 'errorRate' ? `${value}%` : `${Number(value) * 10}ms`,
                      name === 'errorRate' ? 'Error Rate' : 'Response Time'
                    ]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="errorRate" 
                    stroke={COLORS.error} 
                    strokeWidth={2}
                    name="Error Rate (%)"
                    dot={{ fill: COLORS.error, strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="responseTime" 
                    stroke={COLORS.info} 
                    strokeWidth={2}
                    name="Response Time (×10ms)"
                    dot={{ fill: COLORS.info, strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Endpoint Error Breakdown */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">Error Breakdown by Endpoint</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={endpointBreakdown} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                  <YAxis 
                    type="category" 
                    dataKey="endpoint" 
                    stroke="#9CA3AF" 
                    fontSize={12}
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                    formatter={(value: number | string) => [`${Number(value).toFixed(1)}%`, 'Error Rate']}
                  />
                  <Bar 
                    dataKey="errorRate" 
                    fill={COLORS.warning}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-yellow-400" size={24} />
              <h3 className="text-xl font-semibold text-yellow-400">Recent Alerts</h3>
            </div>
            <div className="space-y-2">
              {alerts.slice(-5).reverse().map((alert, index) => (
                <div key={index} className="text-yellow-200 text-sm bg-yellow-900/30 p-3 rounded-lg">
                  {alert}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Footer */}
        <div className="text-center text-gray-400 text-sm">
          Epic 8: Observability Metrics & Offline Queue - Real-time Error Rate Dashboard
          <br />
          Connected: {isConnected ? 'WebSocket' : 'HTTP Polling'} | 
          Retention: {retentionMinutes} minutes | 
          Update Interval: {updateInterval / 1000}s
        </div>
      </div>
    </div>
  );
};

export default ErrorRateDashboard;