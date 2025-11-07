import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import DataPipelineStabilityMonitor from '../../services/dataPipelineStabilityMonitor';

interface ServiceHealthMetrics {
  serviceName: string;
  responseTime: number;
  errorRate: number;
  successRate: number;
  cacheHitRate: number;
  lastHealthCheck: Date;
  status: 'healthy' | 'degraded' | 'unhealthy';
  errors: string[];
}

interface Alert {
  level: 'critical' | 'warning';
  message: string;
  timestamp: string;
}

const DataPipelineMonitoringDashboard: React.FC = () => {
  const [healthMetrics, setHealthMetrics] = useState<Record<string, ServiceHealthMetrics>>({});
  const [overallStatus, setOverallStatus] = useState<'healthy' | 'degraded' | 'unhealthy'>('healthy');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [validationResult, setValidationResult] = useState<boolean | null>(null);

  const monitor = DataPipelineStabilityMonitor.getInstance();

  useEffect(() => {
    // Check if monitoring is already active
    setIsMonitoring(monitor.isMonitoringActive());
    
    // Load initial metrics
    updateMetrics();
    
    // Load alerts from localStorage
    loadAlerts();
    
    // Set up periodic updates
    const interval = setInterval(() => {
      updateMetrics();
      loadAlerts();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const updateMetrics = () => {
    const metrics = monitor.getHealthReport();
    const status = monitor.getOverallHealthStatus();
    setHealthMetrics(metrics);
    setOverallStatus(status);
  };

  const loadAlerts = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedAlerts = JSON.parse(localStorage.getItem('pipeline-alerts') || '[]');
      setAlerts(storedAlerts.slice(-10)); // Show last 10 alerts
    }
  };

  const handleStartMonitoring = async () => {
    try {
      await monitor.startMonitoring(30000); // 30 second intervals
      setIsMonitoring(true);
      setTimeout(updateMetrics, 1000); // Update metrics after a short delay
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    }
  };

  const handleStopMonitoring = () => {
    monitor.stopMonitoring();
    setIsMonitoring(false);
  };

  const handleValidateUnifiedDataService = async () => {
    setValidationResult(null);
    const result = await monitor.validateUnifiedDataServiceFix();
    setValidationResult(result);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500 text-white';
      case 'degraded': return 'bg-yellow-500 text-black';
      case 'unhealthy': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getOverallStatusIcon = () => {
    switch (overallStatus) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'unhealthy': return '🚨';
      default: return '❓';
    }
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatResponseTime = (time: number) => `${Math.round(time)}ms`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Data Pipeline Monitoring</h1>
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getOverallStatusIcon()}</span>
          <Badge className={getStatusColor(overallStatus)}>
            {overallStatus.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoring Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button 
              onClick={handleStartMonitoring} 
              disabled={isMonitoring}
              className="bg-green-600 hover:bg-green-700"
            >
              {isMonitoring ? 'Monitoring Active' : 'Start Monitoring'}
            </Button>
            <Button 
              onClick={handleStopMonitoring} 
              disabled={!isMonitoring}
              variant="destructive"
            >
              Stop Monitoring
            </Button>
            <Button 
              onClick={handleValidateUnifiedDataService}
              variant="outline"
            >
              Validate UnifiedDataService Fix
            </Button>
          </div>
          
          {validationResult !== null && (
            <div className="mt-4">
              <Alert className={validationResult ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                <AlertDescription>
                  {validationResult 
                    ? '✅ UnifiedDataService constructor fix validated successfully' 
                    : '❌ UnifiedDataService constructor fix validation failed'
                  }
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.values(healthMetrics).map((metrics) => (
          <Card key={metrics.serviceName}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {metrics.serviceName}
                <Badge className={getStatusColor(metrics.status)}>
                  {metrics.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Response Time:</span>
                  <span className="font-mono">{formatResponseTime(metrics.responseTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <span className="font-mono">{formatPercentage(metrics.successRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Error Rate:</span>
                  <span className="font-mono">{formatPercentage(metrics.errorRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cache Hit Rate:</span>
                  <span className="font-mono">{formatPercentage(metrics.cacheHitRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Check:</span>
                  <span className="font-mono text-sm">
                    {new Date(metrics.lastHealthCheck).toLocaleTimeString()}
                  </span>
                </div>
                
                {metrics.errors.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-semibold text-red-600">Recent Errors:</h4>
                    <div className="max-h-20 overflow-y-auto">
                      {metrics.errors.slice(-3).map((error, index) => (
                        <div key={index} className="text-xs text-red-500 truncate" title={error}>
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {alerts.slice().reverse().map((alert, index) => (
                <Alert key={index} className={alert.level === 'critical' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}>
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <span>{alert.message}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>About Data Pipeline Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              This dashboard monitors the health and performance of core data services, specifically validating 
              the impact of the UnifiedDataService constructor fix from Addendum 4.
            </p>
            <p>
              <strong>Key Metrics:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Response Time:</strong> Average time for service operations</li>
              <li><strong>Success Rate:</strong> Percentage of successful operations</li>
              <li><strong>Error Rate:</strong> Percentage of failed operations</li>
              <li><strong>Cache Hit Rate:</strong> Efficiency of caching mechanisms</li>
            </ul>
            <p>
              <strong>Status Levels:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><span className="text-green-600">✅ Healthy:</span> All metrics within normal ranges</li>
              <li><span className="text-yellow-600">⚠️ Degraded:</span> Performance issues detected</li>
              <li><span className="text-red-600">🚨 Unhealthy:</span> Critical issues requiring attention</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataPipelineMonitoringDashboard;
