import { isLeanMode } from '../utils/leanMode';

interface PerformanceMetrics {
  timestamp: Date;
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  memoryUsage: number;
  apiResponseTimes: Record<string, number>;
  errorCount: number;
  userInteractions: number;
  componentRenderTimes: Record<string, number>;
}

interface DemoHealthReport {
  overallScore: number;
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  criticalIssues: string[];
  recommendations: string[];
  trendAnalysis: {
    direction: 'improving' | 'stable' | 'declining';
    changePercentage: number;
  };
  metrics: PerformanceMetrics;
}

interface OptimizationSuggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'performance' | 'user-experience' | 'reliability' | 'accessibility';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  implementation: string;
}

class LiveDemoPerformanceMonitor {
  private static instance: LiveDemoPerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private performanceObserver: PerformanceObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private lastMemoryLogTime = 0;
  private readonly MEMORY_LOG_THROTTLE = 30000; // 30 seconds
  
  private readonly PERFORMANCE_TARGETS = {
    pageLoadTime: 3000,     // 3 seconds
    firstContentfulPaint: 1800,   // 1.8 seconds
    largestContentfulPaint: 2500, // 2.5 seconds
    cumulativeLayoutShift: 0.1,   // CLS score
    timeToInteractive: 3500,      // 3.5 seconds
    apiResponseTime: 1000,        // 1 second
    memoryThreshold: 100 * 1024 * 1024, // 100MB
  };

  private constructor() {
    this.initializePerformanceObserver();
    this.initializeMutationObserver();
  }

  static getInstance(): LiveDemoPerformanceMonitor {
    if (!LiveDemoPerformanceMonitor.instance) {
      LiveDemoPerformanceMonitor.instance = new LiveDemoPerformanceMonitor();
    }
    return LiveDemoPerformanceMonitor.instance;
  }

  private initializePerformanceObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.processPerformanceEntry(entry);
        });
      });

      this.performanceObserver.observe({ 
        entryTypes: ['navigation', 'paint', 'layout-shift', 'largest-contentful-paint'] 
      });
    } catch (error) {
      console.warn('PerformanceObserver not supported:', error);
    }
  }

  private initializeMutationObserver(): void {
    if (typeof window === 'undefined' || !('MutationObserver' in window)) {
      return;
    }

    this.mutationObserver = new MutationObserver((mutations) => {
      this.trackDOMChanges(mutations);
    });

    if (document.body) {
      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeOldValue: true
      });
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    // Process different types of performance entries
    if (entry.entryType === 'navigation') {
      this.updateNavigationMetrics(entry as PerformanceNavigationTiming);
    } else if (entry.entryType === 'paint') {
      this.updatePaintMetrics(entry as PerformancePaintTiming);
    } else if (entry.entryType === 'largest-contentful-paint') {
      this.updateLCPMetrics(entry as any);
    } else if (entry.entryType === 'layout-shift') {
      this.updateCLSMetrics(entry as any);
    }
  }

  private updateNavigationMetrics(entry: PerformanceNavigationTiming): void {
    const loadTime = entry.loadEventEnd - entry.fetchStart;
    const interactiveTime = entry.domInteractive - entry.fetchStart;
    
    this.recordMetric('pageLoadTime', loadTime);
    this.recordMetric('timeToInteractive', interactiveTime);
  }

  private updatePaintMetrics(entry: PerformancePaintTiming): void {
    if (entry.name === 'first-contentful-paint') {
      this.recordMetric('firstContentfulPaint', entry.startTime);
    }
  }

  private updateLCPMetrics(entry: any): void {
    this.recordMetric('largestContentfulPaint', entry.startTime);
  }

  private updateCLSMetrics(entry: any): void {
    if (!entry.hadRecentInput) {
      this.recordMetric('cumulativeLayoutShift', entry.value);
    }
  }

  private trackDOMChanges(mutations: MutationRecord[]): void {
    // Track significant DOM changes that might affect performance
    let significantChanges = 0;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        significantChanges += mutation.addedNodes.length + mutation.removedNodes.length;
      }
    });

    if (significantChanges > 10) {
      this.recordEvent('significant-dom-changes', { count: significantChanges });
    }
  }

  private recordMetric(metric: string, value: number): void {
    // Store metrics for analysis
    const event = new CustomEvent('demo-performance-metric', {
      detail: { metric, value, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }

  private recordEvent(type: string, data: any): void {
    const event = new CustomEvent('demo-performance-event', {
      detail: { type, data, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }

  async startMonitoring(intervalMs: number = 30000): Promise<void> {
    if (this.isMonitoring) {
      // eslint-disable-next-line no-console
      console.warn('Live demo monitoring is already running');
      return;
    }

    // Skip entirely if lean mode is active
    if (isLeanMode()) {
      // eslint-disable-next-line no-console
      console.log('Lean mode active - skipping performance monitoring');
      return;
    }

    this.isMonitoring = true;
    // eslint-disable-next-line no-console
    console.log('Starting live demo performance monitoring...');

    // Initial metrics collection
    await this.collectCurrentMetrics();

    // Set up periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectCurrentMetrics();
        await this.analyzePerformanceTrends();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error during performance monitoring:', error);
      }
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    
    this.isMonitoring = false;
    console.log('Live demo performance monitoring stopped');
  }

  private async collectCurrentMetrics(): Promise<PerformanceMetrics> {
    const now = new Date();
    const memoryInfo = this.getMemoryUsage();
    const apiTimes = await this.measureAPIResponseTimes();
    const componentTimes = this.measureComponentRenderTimes();

    const metrics: PerformanceMetrics = {
      timestamp: now,
      pageLoadTime: this.getPageLoadTime(),
      firstContentfulPaint: this.getFCP(),
      largestContentfulPaint: this.getLCP(),
      cumulativeLayoutShift: this.getCLS(),
      timeToInteractive: this.getTTI(),
      memoryUsage: memoryInfo,
      apiResponseTimes: apiTimes,
      errorCount: this.getErrorCount(),
      userInteractions: this.getUserInteractionCount(),
      componentRenderTimes: componentTimes,
    };

    this.metrics.push(metrics);
    
    // Keep only last 100 metrics for memory efficiency
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    return metrics;
  }

  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      const memoryUsage = (window.performance as any).memory.usedJSHeapSize;
      
      // Throttle memory logging to at most once every 30 seconds
      const now = Date.now();
      if (now - this.lastMemoryLogTime > this.MEMORY_LOG_THROTTLE) {
        this.lastMemoryLogTime = now;
        const memoryInfo = (window.performance as any).memory;
        // eslint-disable-next-line no-console
        console.log('[Performance] Memory Usage:', {
          used: `${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
          total: `${(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
          limit: `${(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
          timestamp: new Date().toLocaleTimeString()
        });
      }
      
      return memoryUsage;
    }
    return 0;
  }

  private async measureAPIResponseTimes(): Promise<Record<string, number>> {
    const apiEndpoints = [
      '/api/health',
      '/api/props',
      '/api/predictions',
      '/api/analytics'
    ];

    const responseTimes: Record<string, number> = {};

    for (const endpoint of apiEndpoints) {
      try {
        const start = performance.now();
        await fetch(endpoint, { method: 'HEAD' });
        const end = performance.now();
        responseTimes[endpoint] = end - start;
      } catch (error) {
        responseTimes[endpoint] = -1; // Indicate error
      }
    }

    return responseTimes;
  }

  private measureComponentRenderTimes(): Record<string, number> {
    // Measure render times for key components
    const componentTimes: Record<string, number> = {};
    
    if (typeof window !== 'undefined' && window.performance) {
      const entries = window.performance.getEntriesByType('measure');
      entries.forEach((entry) => {
        if (entry.name.includes('React')) {
          componentTimes[entry.name] = entry.duration;
        }
      });
    }

    return componentTimes;
  }

  private getPageLoadTime(): number {
    if (typeof window !== 'undefined' && window.performance) {
      try {
        // Use modern Navigation Timing API
        const start = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
        return Math.round(start.duration);
      } catch (error) {
        // Fallback to deprecated timing API if available
        if (window.performance.timing) {
          return window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
        }
      }
    }
    return 0;
  }

  private getFCP(): number {
    if (typeof window !== 'undefined' && window.performance) {
      const entries = window.performance.getEntriesByName('first-contentful-paint');
      return entries.length > 0 ? entries[0].startTime : 0;
    }
    return 0;
  }

  private getLCP(): number {
    if (typeof window !== 'undefined' && window.performance) {
      try {
        // Check if largest-contentful-paint is supported
        if ('getEntriesByType' in window.performance) {
          const entries = window.performance.getEntriesByType('largest-contentful-paint');
          return entries.length > 0 ? entries[entries.length - 1].startTime : 0;
        }
      } catch (error) {
        // Silently handle unsupported entry type
      }
    }
    return 0;
  }

  private getCLS(): number {
    if (typeof window !== 'undefined' && window.performance) {
      const entries = window.performance.getEntriesByType('layout-shift');
      return entries.reduce((cls: number, entry: any) => {
        if (!entry.hadRecentInput) {
          return cls + entry.value;
        }
        return cls;
      }, 0);
    }
    return 0;
  }

  private getTTI(): number {
    // Simplified TTI calculation
    return this.getPageLoadTime() * 1.2; // Approximate
  }

  private getErrorCount(): number {
    // Track JavaScript errors
    return (window as any).__demoErrorCount || 0;
  }

  private getUserInteractionCount(): number {
    // Track user interactions
    return (window as any).__demoInteractionCount || 0;
  }

  private async analyzePerformanceTrends(): Promise<void> {
    if (this.metrics.length < 5) return; // Need sufficient data

    const recent = this.metrics.slice(-5);
    const older = this.metrics.slice(-10, -5);

    if (older.length === 0) return;

    const recentAvg = this.calculateAverageMetrics(recent);
    const olderAvg = this.calculateAverageMetrics(older);

    const trends = this.compareMetics(recentAvg, olderAvg);
    
    // Dispatch trend analysis event
    const event = new CustomEvent('demo-performance-trends', {
      detail: { trends, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }

  private calculateAverageMetrics(metrics: PerformanceMetrics[]): PerformanceMetrics {
    const avg: any = {};
    const keys = Object.keys(metrics[0]) as (keyof PerformanceMetrics)[];
    
    keys.forEach(key => {
      if (typeof metrics[0][key] === 'number') {
        avg[key] = metrics.reduce((sum, m) => sum + (m[key] as number), 0) / metrics.length;
      }
    });

    return avg as PerformanceMetrics;
  }

  private compareMetics(recent: PerformanceMetrics, older: PerformanceMetrics): any {
    return {
      pageLoadTime: this.calculateChange(recent.pageLoadTime, older.pageLoadTime),
      memoryUsage: this.calculateChange(recent.memoryUsage, older.memoryUsage),
      errorCount: this.calculateChange(recent.errorCount, older.errorCount),
    };
  }

  private calculateChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  generateHealthReport(): DemoHealthReport {
    if (this.metrics.length === 0) {
      return this.getDefaultHealthReport();
    }

    const latest = this.metrics[this.metrics.length - 1];
    const score = this.calculateOverallScore(latest);
    const grade = this.getPerformanceGrade(score);
    const issues = this.identifyCriticalIssues(latest);
    const recommendations = this.generateRecommendations(latest);
    const trends = this.analyzeTrends();

    return {
      overallScore: score,
      performanceGrade: grade,
      criticalIssues: issues,
      recommendations,
      trendAnalysis: trends,
      metrics: latest,
    };
  }

  private calculateOverallScore(metrics: PerformanceMetrics): number {
    let score = 100;
    
    // Page load time penalty
    if (metrics.pageLoadTime > this.PERFORMANCE_TARGETS.pageLoadTime) {
      score -= 15;
    }
    
    // FCP penalty
    if (metrics.firstContentfulPaint > this.PERFORMANCE_TARGETS.firstContentfulPaint) {
      score -= 10;
    }
    
    // LCP penalty
    if (metrics.largestContentfulPaint > this.PERFORMANCE_TARGETS.largestContentfulPaint) {
      score -= 15;
    }
    
    // CLS penalty
    if (metrics.cumulativeLayoutShift > this.PERFORMANCE_TARGETS.cumulativeLayoutShift) {
      score -= 20;
    }
    
    // Memory usage penalty
    if (metrics.memoryUsage > this.PERFORMANCE_TARGETS.memoryThreshold) {
      score -= 10;
    }
    
    // API response time penalty
    Object.values(metrics.apiResponseTimes).forEach(time => {
      if (time > this.PERFORMANCE_TARGETS.apiResponseTime) {
        score -= 5;
      }
    });
    
    // Error penalty
    if (metrics.errorCount > 0) {
      score -= metrics.errorCount * 5;
    }

    return Math.max(0, score);
  }

  private getPerformanceGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private identifyCriticalIssues(metrics: PerformanceMetrics): string[] {
    const issues: string[] = [];
    
    if (metrics.pageLoadTime > this.PERFORMANCE_TARGETS.pageLoadTime) {
      issues.push(`Page load time (${(metrics.pageLoadTime / 1000).toFixed(1)}s) exceeds target`);
    }
    
    if (metrics.cumulativeLayoutShift > this.PERFORMANCE_TARGETS.cumulativeLayoutShift) {
      issues.push(`Layout shift (${metrics.cumulativeLayoutShift.toFixed(3)}) causes visual instability`);
    }
    
    if (metrics.memoryUsage > this.PERFORMANCE_TARGETS.memoryThreshold) {
      issues.push(`High memory usage (${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB)`);
    }
    
    if (metrics.errorCount > 0) {
      issues.push(`${metrics.errorCount} JavaScript errors detected`);
    }

    return issues;
  }

  private generateRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];
    
    if (metrics.pageLoadTime > this.PERFORMANCE_TARGETS.pageLoadTime) {
      recommendations.push('Optimize bundle size and implement code splitting');
      recommendations.push('Enable gzip compression and browser caching');
    }
    
    if (metrics.firstContentfulPaint > this.PERFORMANCE_TARGETS.firstContentfulPaint) {
      recommendations.push('Optimize critical rendering path');
      recommendations.push('Preload essential resources');
    }
    
    if (metrics.cumulativeLayoutShift > this.PERFORMANCE_TARGETS.cumulativeLayoutShift) {
      recommendations.push('Add size attributes to images and media');
      recommendations.push('Reserve space for dynamic content');
    }
    
    if (metrics.memoryUsage > this.PERFORMANCE_TARGETS.memoryThreshold) {
      recommendations.push('Implement virtual scrolling for large lists');
      recommendations.push('Clean up event listeners and subscriptions');
    }

    return recommendations;
  }

  private analyzeTrends(): { direction: 'improving' | 'stable' | 'declining'; changePercentage: number } {
    if (this.metrics.length < 5) {
      return { direction: 'stable', changePercentage: 0 };
    }

    const recent = this.metrics.slice(-3);
    const older = this.metrics.slice(-6, -3);
    
    const recentScore = this.calculateOverallScore(this.calculateAverageMetrics(recent));
    const olderScore = this.calculateOverallScore(this.calculateAverageMetrics(older));
    
    const change = ((recentScore - olderScore) / olderScore) * 100;
    
    let direction: 'improving' | 'stable' | 'declining' = 'stable';
    if (change > 5) direction = 'improving';
    else if (change < -5) direction = 'declining';
    
    return { direction, changePercentage: Math.abs(change) };
  }

  private getDefaultHealthReport(): DemoHealthReport {
    return {
      overallScore: 0,
      performanceGrade: 'F',
      criticalIssues: ['No performance data available'],
      recommendations: ['Start performance monitoring'],
      trendAnalysis: { direction: 'stable', changePercentage: 0 },
      metrics: {
        timestamp: new Date(),
        pageLoadTime: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
        timeToInteractive: 0,
        memoryUsage: 0,
        apiResponseTimes: {},
        errorCount: 0,
        userInteractions: 0,
        componentRenderTimes: {},
      },
    };
  }

  getOptimizationSuggestions(): OptimizationSuggestion[] {
    return [
      {
        id: 'bundle-optimization',
        priority: 'high',
        category: 'performance',
        title: 'Optimize JavaScript Bundle Size',
        description: 'Reduce bundle size through code splitting and tree shaking',
        impact: 'Improve page load time by 20-30%',
        effort: 'medium',
        implementation: 'Implement dynamic imports and remove unused dependencies',
      },
      {
        id: 'image-optimization',
        priority: 'high',
        category: 'performance',
        title: 'Optimize Image Loading',
        description: 'Implement lazy loading and modern image formats',
        impact: 'Reduce LCP by 15-25%',
        effort: 'low',
        implementation: 'Use next/image or similar optimization libraries',
      },
      {
        id: 'api-caching',
        priority: 'medium',
        category: 'performance',
        title: 'Implement API Response Caching',
        description: 'Cache frequently requested API responses',
        impact: 'Improve API response times by 40-60%',
        effort: 'medium',
        implementation: 'Use React Query or SWR for intelligent caching',
      },
      {
        id: 'virtual-scrolling',
        priority: 'medium',
        category: 'performance',
        title: 'Implement Virtual Scrolling',
        description: 'Virtualize large data lists to reduce DOM nodes',
        impact: 'Reduce memory usage by 30-50%',
        effort: 'high',
        implementation: 'Use react-window or react-virtualized',
      },
      {
        id: 'error-boundary',
        priority: 'high',
        category: 'reliability',
        title: 'Add Comprehensive Error Boundaries',
        description: 'Implement error boundaries to prevent app crashes',
        impact: 'Improve app stability and user experience',
        effort: 'low',
        implementation: 'Wrap components with React error boundaries',
      },
    ];
  }

  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }
}

export default LiveDemoPerformanceMonitor;
export type { PerformanceMetrics, DemoHealthReport, OptimizationSuggestion };
