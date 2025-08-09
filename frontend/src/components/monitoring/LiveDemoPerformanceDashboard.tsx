import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Clock,
  Memory,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Monitor,
  Cpu,
  HardDrive,
  Wifi,
  Eye,
  RefreshCw,
} from 'lucide-react';
import LiveDemoPerformanceMonitor, { PerformanceMetrics, DemoHealthReport, OptimizationSuggestion } from '../../services/liveDemoPerformanceMonitor';

const LiveDemoPerformanceDashboard: React.FC = () => {
  const [healthReport, setHealthReport] = useState<DemoHealthReport | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const monitor = LiveDemoPerformanceMonitor.getInstance();

  useEffect(() => {
    // Check if monitoring is already active
    setIsMonitoring(monitor.isMonitoringActive());
    
    // Load initial data
    updateDashboard();
    
    // Set up periodic updates
    const interval = setInterval(() => {
      updateDashboard();
    }, 10000); // Update every 10 seconds

    // Listen for performance events
    const handleMetricUpdate = () => updateDashboard();
    window.addEventListener('demo-performance-metric', handleMetricUpdate);
    window.addEventListener('demo-performance-trends', handleMetricUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('demo-performance-metric', handleMetricUpdate);
      window.removeEventListener('demo-performance-trends', handleMetricUpdate);
    };
  }, []);

  const updateDashboard = () => {
    const report = monitor.generateHealthReport();
    const metrics = monitor.getCurrentMetrics();
    const suggestions = monitor.getOptimizationSuggestions();
    
    setHealthReport(report);
    setCurrentMetrics(metrics);
    setOptimizationSuggestions(suggestions);
    setLastUpdate(new Date());
  };

  const handleStartMonitoring = async () => {
    try {
      await monitor.startMonitoring(30000); // 30 second intervals
      setIsMonitoring(true);
      setTimeout(updateDashboard, 2000); // Update after short delay
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    }
  };

  const handleStopMonitoring = () => {
    monitor.stopMonitoring();
    setIsMonitoring(false);
  };

  const handleRefreshData = () => {
    updateDashboard();
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-500 text-white';
      case 'B': return 'bg-blue-500 text-white';
      case 'C': return 'bg-yellow-500 text-black';
      case 'D': return 'bg-orange-500 text-white';
      case 'F': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatTime = (ms: number) => `${(ms / 1000).toFixed(2)}s`;
  const formatMemory = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)}MB`;

  if (!healthReport || !currentMetrics) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Live Demo Performance</h1>
          <Button onClick={handleStartMonitoring} className="bg-green-600 hover:bg-green-700">
            Start Monitoring
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-48">
            <div className="text-center">
              <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No performance data available</p>
              <p className="text-sm text-gray-400">Start monitoring to see live demo performance metrics</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Demo Performance</h1>
          <p className="text-gray-500">Real-time monitoring and optimization insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={isMonitoring ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
            {isMonitoring ? 'MONITORING' : 'STOPPED'}
          </Badge>
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
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
              onClick={handleRefreshData}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">{healthReport.overallScore}</div>
              <Badge className={getGradeColor(healthReport.performanceGrade)}>
                Grade {healthReport.performanceGrade}
              </Badge>
            </div>
            <div className="flex items-center mt-2 text-sm">
              {getTrendIcon(healthReport.trendAnalysis.direction)}
              <span className="ml-1 text-gray-600">
                {healthReport.trendAnalysis.changePercentage.toFixed(1)}% change
              </span>
            </div>
            <Progress value={healthReport.overallScore} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Page Load Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {formatTime(currentMetrics.pageLoadTime)}
              </div>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Target: 3.0s
            </div>
            <Progress 
              value={Math.min(100, (3000 / Math.max(currentMetrics.pageLoadTime, 1)) * 100)} 
              className="mt-3" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {formatMemory(currentMetrics.memoryUsage)}
              </div>
              <Memory className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Target: &lt;100MB
            </div>
            <Progress 
              value={Math.min(100, (currentMetrics.memoryUsage / (100 * 1024 * 1024)) * 100)} 
              className="mt-3" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Error Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-red-500">
                {currentMetrics.errorCount}
              </div>
              {currentMetrics.errorCount === 0 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              )}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Last 30 minutes
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">First Contentful Paint</span>
                <span className="text-sm">{formatTime(currentMetrics.firstContentfulPaint)}</span>
              </div>
              <Progress 
                value={Math.min(100, (1800 / Math.max(currentMetrics.firstContentfulPaint, 1)) * 100)} 
                className="h-2" 
              />
              <div className="text-xs text-gray-500">Target: 1.8s</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Largest Contentful Paint</span>
                <span className="text-sm">{formatTime(currentMetrics.largestContentfulPaint)}</span>
              </div>
              <Progress 
                value={Math.min(100, (2500 / Math.max(currentMetrics.largestContentfulPaint, 1)) * 100)} 
                className="h-2" 
              />
              <div className="text-xs text-gray-500">Target: 2.5s</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cumulative Layout Shift</span>
                <span className="text-sm">{currentMetrics.cumulativeLayoutShift.toFixed(3)}</span>
              </div>
              <Progress 
                value={Math.min(100, (0.1 / Math.max(currentMetrics.cumulativeLayoutShift, 0.001)) * 100)} 
                className="h-2" 
              />
              <div className="text-xs text-gray-500">Target: &lt;0.1</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Performance */}
      {Object.keys(currentMetrics.apiResponseTimes).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wifi className="w-5 h-5 mr-2" />
              API Response Times
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(currentMetrics.apiResponseTimes).map(([endpoint, time]) => (
                <div key={endpoint} className="flex items-center justify-between">
                  <span className="text-sm font-mono">{endpoint}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${time > 1000 ? 'text-red-500' : 'text-green-500'}`}>
                      {time === -1 ? 'Error' : `${time.toFixed(0)}ms`}
                    </span>
                    {time !== -1 && (
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${time > 1000 ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(100, (time / 2000) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critical Issues */}
      {healthReport.criticalIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Critical Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {healthReport.criticalIssues.map((issue, index) => (
                <Alert key={index} className="border-red-500 bg-red-50">
                  <AlertDescription className="text-red-700">
                    {issue}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimization Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Optimization Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {optimizationSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold">{suggestion.title}</h4>
                      <Badge className={getPriorityColor(suggestion.priority)}>
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{suggestion.description}</p>
                    <div className="text-sm space-y-1">
                      <div><strong>Impact:</strong> {suggestion.impact}</div>
                      <div><strong>Effort:</strong> {suggestion.effort}</div>
                      <div><strong>Implementation:</strong> {suggestion.implementation}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {healthReport.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Performance Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {healthReport.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveDemoPerformanceDashboard;
