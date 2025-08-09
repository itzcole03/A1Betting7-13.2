/**
 * Advanced Health Monitor
 * Enhanced monitoring service with automated health checks and alerting
 */

interface HealthMetric {
  id: string;
  name: string;
  value: number;
  threshold: number;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'improving' | 'stable' | 'declining';
  lastChecked: Date;
  history: { timestamp: Date; value: number }[];
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  score: number;
  metrics: HealthMetric[];
  alerts: HealthAlert[];
  recommendations: string[];
}

interface HealthAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  source: string;
}

interface HealthCheckConfig {
  interval: number; // ms
  retries: number;
  timeout: number;
  thresholds: {
    healthy: number;
    warning: number;
    critical: number;
  };
}

export class AdvancedHealthMonitor {
  private static instance: AdvancedHealthMonitor;
  private metrics: Map<string, HealthMetric> = new Map();
  private alerts: HealthAlert[] = [];
  private monitoring = false;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  
  private readonly config: HealthCheckConfig = {
    interval: 30000, // 30 seconds
    retries: 3,
    timeout: 5000,
    thresholds: {
      healthy: 90,
      warning: 70,
      critical: 50
    }
  };

  static getInstance(): AdvancedHealthMonitor {
    if (!AdvancedHealthMonitor.instance) {
      AdvancedHealthMonitor.instance = new AdvancedHealthMonitor();
    }
    return AdvancedHealthMonitor.instance;
  }

  private constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    // API Response Time
    this.registerMetric({
      id: 'api_response_time',
      name: 'API Response Time',
      value: 0,
      threshold: 1000, // 1 second
      status: 'healthy',
      trend: 'stable',
      lastChecked: new Date(),
      history: []
    });

    // Memory Usage
    this.registerMetric({
      id: 'memory_usage',
      name: 'Memory Usage',
      value: 0,
      threshold: 80, // 80%
      status: 'healthy',
      trend: 'stable',
      lastChecked: new Date(),
      history: []
    });

    // Error Rate
    this.registerMetric({
      id: 'error_rate',
      name: 'Error Rate',
      value: 0,
      threshold: 5, // 5%
      status: 'healthy',
      trend: 'stable',
      lastChecked: new Date(),
      history: []
    });

    // User Experience Score
    this.registerMetric({
      id: 'user_experience',
      name: 'User Experience Score',
      value: 100,
      threshold: 80,
      status: 'healthy',
      trend: 'stable',
      lastChecked: new Date(),
      history: []
    });

    // Core Web Vitals - Largest Contentful Paint
    this.registerMetric({
      id: 'lcp',
      name: 'Largest Contentful Paint',
      value: 0,
      threshold: 2500, // 2.5 seconds
      status: 'healthy',
      trend: 'stable',
      lastChecked: new Date(),
      history: []
    });

    // Core Web Vitals - Cumulative Layout Shift
    this.registerMetric({
      id: 'cls',
      name: 'Cumulative Layout Shift',
      value: 0,
      threshold: 0.1,
      status: 'healthy',
      trend: 'stable',
      lastChecked: new Date(),
      history: []
    });
  }

  private registerMetric(metric: HealthMetric): void {
    this.metrics.set(metric.id, metric);
  }

  async startMonitoring(): Promise<void> {
    if (this.monitoring) {
      return;
    }

    this.monitoring = true;
    console.log('[AdvancedHealthMonitor] Starting automated health monitoring...');

    // Start automated checks for each metric
    for (const [id, metric] of this.metrics) {
      this.startMetricMonitoring(id, metric);
    }

    // Start Web Vitals monitoring
    this.startWebVitalsMonitoring();
  }

  stopMonitoring(): void {
    this.monitoring = false;
    
    // Clear all intervals
    for (const [id, interval] of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.clear();

    console.log('[AdvancedHealthMonitor] Monitoring stopped');
  }

  private startMetricMonitoring(id: string, metric: HealthMetric): void {
    const interval = setInterval(async () => {
      await this.checkMetric(id);
    }, this.config.interval);
    
    this.intervals.set(id, interval);
  }

  private async checkMetric(id: string): Promise<void> {
    const metric = this.metrics.get(id);
    if (!metric) return;

    try {
      let value: number;

      switch (id) {
        case 'api_response_time':
          value = await this.measureApiResponseTime();
          break;
        case 'memory_usage':
          value = this.measureMemoryUsage();
          break;
        case 'error_rate':
          value = this.calculateErrorRate();
          break;
        case 'user_experience':
          value = await this.calculateUserExperienceScore();
          break;
        default:
          return;
      }

      this.updateMetric(id, value);
    } catch (error) {
      console.error(`[AdvancedHealthMonitor] Error checking metric ${id}:`, error);
      this.createAlert({
        id: `metric_error_${id}_${Date.now()}`,
        severity: 'warning',
        message: `Failed to check metric: ${metric.name}`,
        timestamp: new Date(),
        resolved: false,
        source: 'AdvancedHealthMonitor'
      });
    }
  }

  private async measureApiResponseTime(): Promise<number> {
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        timeout: this.config.timeout
      } as RequestInit);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return Date.now() - startTime;
    } catch (error) {
      // Return high value to indicate poor performance
      return 5000;
    }
  }

  private measureMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    }
    return 0;
  }

  private calculateErrorRate(): number {
    // Calculate error rate from recent logs
    // This would typically integrate with your logging system
    const recentErrors = this.alerts.filter(
      alert => alert.severity === 'error' && 
      Date.now() - alert.timestamp.getTime() < 300000 // Last 5 minutes
    );
    
    // Simple calculation - in real implementation you'd track total requests
    return Math.min(recentErrors.length * 2, 100);
  }

  private async calculateUserExperienceScore(): Promise<number> {
    // Calculate based on multiple factors
    const factors = {
      apiResponseTime: this.metrics.get('api_response_time')?.value || 0,
      errorRate: this.metrics.get('error_rate')?.value || 0,
      memoryUsage: this.metrics.get('memory_usage')?.value || 0
    };

    // Simple scoring algorithm
    let score = 100;
    
    if (factors.apiResponseTime > 1000) score -= 20;
    if (factors.apiResponseTime > 2000) score -= 20;
    if (factors.errorRate > 5) score -= 30;
    if (factors.memoryUsage > 80) score -= 15;
    
    return Math.max(score, 0);
  }

  private startWebVitalsMonitoring(): void {
    // Monitor Core Web Vitals using the Web Vitals library
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS((metric) => {
          this.updateMetric('cls', metric.value);
        });

        getLCP((metric) => {
          this.updateMetric('lcp', metric.value);
        });

        getFCP((metric) => {
          this.registerMetric({
            id: 'fcp',
            name: 'First Contentful Paint',
            value: metric.value,
            threshold: 1800,
            status: 'healthy',
            trend: 'stable',
            lastChecked: new Date(),
            history: []
          });
        });
      }).catch(error => {
        console.warn('[AdvancedHealthMonitor] Web Vitals not available:', error);
      });
    }
  }

  private updateMetric(id: string, value: number): void {
    const metric = this.metrics.get(id);
    if (!metric) return;

    // Calculate trend
    const previousValue = metric.value;
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    
    if (value < previousValue * 0.95) {
      trend = id === 'error_rate' || id === 'memory_usage' ? 'improving' : 'declining';
    } else if (value > previousValue * 1.05) {
      trend = id === 'error_rate' || id === 'memory_usage' ? 'declining' : 'improving';
    }

    // Determine status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (value > metric.threshold) {
      status = value > metric.threshold * 1.5 ? 'critical' : 'warning';
    }

    // Update history
    metric.history.push({
      timestamp: new Date(),
      value: value
    });

    // Keep only last 100 data points
    if (metric.history.length > 100) {
      metric.history = metric.history.slice(-100);
    }

    // Update metric
    const updatedMetric: HealthMetric = {
      ...metric,
      value,
      status,
      trend,
      lastChecked: new Date(),
      history: metric.history
    };

    this.metrics.set(id, updatedMetric);

    // Create alerts for status changes
    if (status !== metric.status) {
      this.handleStatusChange(id, metric.status, status, value);
    }
  }

  private handleStatusChange(
    metricId: string, 
    oldStatus: string, 
    newStatus: string, 
    value: number
  ): void {
    const metric = this.metrics.get(metricId);
    if (!metric) return;

    let severity: 'info' | 'warning' | 'error' | 'critical' = 'info';
    let message = `${metric.name} status changed from ${oldStatus} to ${newStatus}`;

    if (newStatus === 'critical') {
      severity = 'critical';
      message = `CRITICAL: ${metric.name} is in critical state (${value.toFixed(2)})`;
    } else if (newStatus === 'warning') {
      severity = 'warning';
      message = `WARNING: ${metric.name} exceeds threshold (${value.toFixed(2)})`;
    } else if (newStatus === 'healthy' && oldStatus !== 'healthy') {
      severity = 'info';
      message = `RECOVERED: ${metric.name} is now healthy (${value.toFixed(2)})`;
    }

    this.createAlert({
      id: `status_change_${metricId}_${Date.now()}`,
      severity,
      message,
      timestamp: new Date(),
      resolved: false,
      source: 'MetricMonitor'
    });
  }

  private createAlert(alert: HealthAlert): void {
    this.alerts.unshift(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }

    console.log(`[AdvancedHealthMonitor] ${alert.severity.toUpperCase()}: ${alert.message}`);
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  getSystemHealth(): SystemHealth {
    const metrics = Array.from(this.metrics.values());
    const healthyCount = metrics.filter(m => m.status === 'healthy').length;
    const warningCount = metrics.filter(m => m.status === 'warning').length;
    const criticalCount = metrics.filter(m => m.status === 'critical').length;

    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';
    let score = (healthyCount / metrics.length) * 100;

    if (criticalCount > 0) {
      overall = 'critical';
      score = Math.min(score, 30);
    } else if (warningCount > 0) {
      overall = 'degraded';
      score = Math.min(score, 70);
    }

    const recommendations = this.generateRecommendations(metrics);

    return {
      overall,
      score: Math.round(score),
      metrics,
      alerts: this.alerts.filter(a => !a.resolved).slice(0, 10),
      recommendations
    };
  }

  private generateRecommendations(metrics: HealthMetric[]): string[] {
    const recommendations: string[] = [];

    for (const metric of metrics) {
      if (metric.status === 'critical') {
        switch (metric.id) {
          case 'api_response_time':
            recommendations.push('Optimize API endpoints and consider caching strategies');
            break;
          case 'memory_usage':
            recommendations.push('Review memory leaks and optimize component lifecycle');
            break;
          case 'error_rate':
            recommendations.push('Investigate and fix recurring errors in error logs');
            break;
          case 'lcp':
            recommendations.push('Optimize images and critical rendering path');
            break;
        }
      }
    }

    return recommendations;
  }

  getMetricHistory(metricId: string, hours = 1): { timestamp: Date; value: number }[] {
    const metric = this.metrics.get(metricId);
    if (!metric) return [];

    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return metric.history.filter(h => h.timestamp.getTime() > cutoffTime);
  }

  isMonitoring(): boolean {
    return this.monitoring;
  }
}

export default AdvancedHealthMonitor;
