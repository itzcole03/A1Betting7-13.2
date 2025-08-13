import type { CLSMetric, FCPMetric, FIDMetric, LCPMetric, TTFBMetric } from 'web-vitals';
/**
 * Real-Time Performance Tracker
 * Monitors live demo performance, user interactions, and system metrics
 */

interface UserInteraction {
  type: 'click' | 'scroll' | 'navigation' | 'search' | 'filter';
  element: string;
  timestamp: Date;
  performance: {
    responseTime: number;
    renderTime: number;
  };
}

interface DemoSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  interactions: UserInteraction[];
  metrics: {
    totalInteractions: number;
    averageResponseTime: number;
    bounceRate: number;
    engagementScore: number;
  };
}

interface PerformanceSnapshot {
  timestamp: Date;
  metrics: {
    // Core Web Vitals
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    fcp: number; // First Contentful Paint
    ttfb: number; // Time to First Byte

    // Custom Metrics
    apiResponseTime: number;
    componentRenderTime: number;
    memoryUsage: number;
    errorCount: number;

    // User Experience
    interactionLatency: number;
    visualStability: number;
    loadingPerformance: number;
  };
  context: {
    url: string;
    userAgent: string;
    connectionType: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
  };
}

interface PerformanceTrend {
  metric: string;
  trend: 'improving' | 'stable' | 'declining';
  change: number; // percentage change
  period: string;
}

export class RealTimePerformanceTracker {
  private static instance: RealTimePerformanceTracker;
  private isTracking = false;
  private currentSession: DemoSession | null = null;
  private performanceSnapshots: PerformanceSnapshot[] = [];
  private observers: Map<string, PerformanceObserver | IntersectionObserver> = new Map();
  private eventListeners: Map<string, () => void> = new Map();

  private readonly maxSnapshots = 1000;
  private readonly snapshotInterval = 10000; // 10 seconds

  static getInstance(): RealTimePerformanceTracker {
    if (!RealTimePerformanceTracker.instance) {
      RealTimePerformanceTracker.instance = new RealTimePerformanceTracker();
    }
    return RealTimePerformanceTracker.instance;
  }

  private constructor() {
    this.setupPerformanceObservers();
  }

  private setupPerformanceObservers(): void {
    if (typeof window === 'undefined') return;

    // Performance Observer for Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Long Task Observer
      try {
        const longTaskObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            this.recordLongTask(entry);
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (e) {
        console.warn('Long task observer not supported');
      }

      // Layout Shift Observer
      try {
        const layoutShiftObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            this.recordLayoutShift(entry);
          }
        });
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('layout-shift', layoutShiftObserver);
      } catch (e) {
        console.warn('Layout shift observer not supported');
      }

      // First Input Observer
      try {
        const firstInputObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            this.recordFirstInput(entry);
          }
        });
        firstInputObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('first-input', firstInputObserver);
      } catch (e) {
        console.warn('First input observer not supported');
      }
    }

    // Intersection Observer for visibility tracking
    if ('IntersectionObserver' in window) {
      const visibilityObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          this.recordVisibilityChange(entry);
        });
      });
      this.observers.set('visibility', visibilityObserver);
    }
  }

  startTracking(): void {
    if (this.isTracking) return;

    this.isTracking = true;
    this.currentSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: new Date(),
      interactions: [],
      metrics: {
        totalInteractions: 0,
        averageResponseTime: 0,
        bounceRate: 0,
        engagementScore: 0,
      },
    };

    this.setupEventListeners();
    this.startPerformanceSnapshots();

    console.log(
      '[RealTimePerformanceTracker] Tracking started for session:',
      this.currentSession.id
    );
  }

  stopTracking(): void {
    if (!this.isTracking) return;

    this.isTracking = false;

    if (this.currentSession) {
      this.currentSession.endTime = new Date();
      this.calculateSessionMetrics();
      this.logSessionSummary();
    }

    this.removeEventListeners();
    this.stopPerformanceSnapshots();

    console.log('[RealTimePerformanceTracker] Tracking stopped');
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Click tracking
    const clickHandler = (event: MouseEvent) => {
      this.recordInteraction('click', this.getElementDescription(event.target as Element));
    };
    window.addEventListener('click', clickHandler);
    this.eventListeners.set('click', () => window.removeEventListener('click', clickHandler));

    // Scroll tracking
    let scrollTimer: NodeJS.Timeout;
    const scrollHandler = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        this.recordInteraction('scroll', `scrollY: ${window.scrollY}`);
      }, 100);
    };
    window.addEventListener('scroll', scrollHandler);
    this.eventListeners.set('scroll', () => window.removeEventListener('scroll', scrollHandler));

    // Navigation tracking
    const navigationHandler = () => {
      this.recordInteraction('navigation', window.location.pathname);
    };
    window.addEventListener('popstate', navigationHandler);
    this.eventListeners.set('navigation', () =>
      window.removeEventListener('popstate', navigationHandler)
    );

    // Error tracking
    const errorHandler = (event: ErrorEvent) => {
      this.recordError(event);
    };
    window.addEventListener('error', errorHandler);
    this.eventListeners.set('error', () => window.removeEventListener('error', errorHandler));

    // Unhandled promise rejection tracking
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      this.recordUnhandledRejection(event);
    };
    window.addEventListener('unhandledrejection', rejectionHandler);
    this.eventListeners.set('unhandledrejection', () =>
      window.removeEventListener('unhandledrejection', rejectionHandler)
    );
  }

  private removeEventListeners(): void {
    this.eventListeners.forEach(removeListener => removeListener());
    this.eventListeners.clear();
  }

  private startPerformanceSnapshots(): void {
    const snapshotTimer = setInterval(() => {
      this.takePerformanceSnapshot();
    }, this.snapshotInterval);

    this.eventListeners.set('snapshot', () => clearInterval(snapshotTimer));
  }

  private stopPerformanceSnapshots(): void {
    const removeSnapshot = this.eventListeners.get('snapshot');
    if (removeSnapshot) {
      removeSnapshot();
      this.eventListeners.delete('snapshot');
    }
  }

  private recordInteraction(type: UserInteraction['type'], element: string): void {
    if (!this.currentSession) return;

    const startTime = performance.now();

    // Simulate measuring response and render time
    requestAnimationFrame(() => {
      const renderTime = performance.now() - startTime;

      const interaction: UserInteraction = {
        type,
        element,
        timestamp: new Date(),
        performance: {
          responseTime: renderTime,
          renderTime,
        },
      };

      this.currentSession!.interactions.push(interaction);
      this.currentSession!.metrics.totalInteractions++;
    });
  }

  private recordLongTask(entry: PerformanceEntry): void {
    if ('duration' in entry && 'startTime' in entry && 'name' in entry) {
      console.warn('[Performance] Long task detected:', {
        duration: (entry as any).duration,
        startTime: entry.startTime,
        name: (entry as any).name,
      });
    }
  }

  private recordLayoutShift(entry: PerformanceEntry): void {
    if ('hadRecentInput' in entry && (entry as any).hadRecentInput) return;
    if ('value' in entry && 'startTime' in entry) {
      console.log('[Performance] Layout shift:', {
        value: (entry as any).value,
        startTime: entry.startTime,
      });
    }
  }

  private recordFirstInput(entry: PerformanceEntry): void {
    if ('processingStart' in entry && 'startTime' in entry && 'duration' in entry) {
      console.log('[Performance] First input:', {
        processingStart: (entry as any).processingStart,
        startTime: entry.startTime,
        duration: (entry as any).duration,
      });
    }
  }

  private recordVisibilityChange(entry: IntersectionObserverEntry): void {
    // Track when important elements come into view
    if (entry.isIntersecting && entry.target.getAttribute('data-track-visibility')) {
      this.recordInteraction('scroll', `visible: ${this.getElementDescription(entry.target)}`);
    }
  }

  private recordError(event: ErrorEvent): void {
    console.error('[Performance] JavaScript error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });
  }

  private recordUnhandledRejection(event: PromiseRejectionEvent): void {
    console.error('[Performance] Unhandled promise rejection:', event.reason);
  }

  private getElementDescription(element: Element | null): string {
    if (!element) return 'unknown';

    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const className = element.className ? `.${element.className.split(' ').join('.')}` : '';
    const text = element.textContent?.slice(0, 30) || '';

    return `${tag}${id}${className} "${text}"`.trim();
  }

  private async takePerformanceSnapshot(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const metrics = await this.gatherPerformanceMetrics();
      const context = this.gatherContext();

      const snapshot: PerformanceSnapshot = {
        timestamp: new Date(),
        metrics,
        context,
      };

      this.performanceSnapshots.push(snapshot);

      // Keep only recent snapshots
      if (this.performanceSnapshots.length > this.maxSnapshots) {
        this.performanceSnapshots = this.performanceSnapshots.slice(-this.maxSnapshots);
      }

      // Detect performance regressions
      this.detectPerformanceRegressions(snapshot);
    } catch (error) {
      console.error('[RealTimePerformanceTracker] Error taking snapshot:', error);
    }
  }

  private async gatherPerformanceMetrics(): Promise<PerformanceSnapshot['metrics']> {
    const metrics = {
      lcp: 0,
      fid: 0,
      cls: 0,
      fcp: 0,
      ttfb: 0,
      apiResponseTime: 0,
      componentRenderTime: 0,
      memoryUsage: 0,
      errorCount: 0,
      interactionLatency: 0,
      visualStability: 0,
      loadingPerformance: 0,
    };

    // Gather Core Web Vitals using the web-vitals library if available
    try {
      const webVitals = await import('web-vitals');
      const { onCLS, onFCP, onFID, onLCP, onTTFB } = webVitals;
      onCLS((metric: CLSMetric) => {
        metrics.cls = metric.value;
      });
      onFCP((metric: FCPMetric) => {
        metrics.fcp = metric.value;
      });
      onFID((metric: FIDMetric) => {
        metrics.fid = metric.value;
      });
      onLCP((metric: LCPMetric) => {
        metrics.lcp = metric.value;
      });
      onTTFB((metric: TTFBMetric) => {
        metrics.ttfb = metric.value;
      });
    } catch (error) {
      console.warn('[RealTimePerformanceTracker] Web Vitals not available');
    }

    // Memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metrics.memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    }

    // Calculate custom metrics
    if (this.currentSession) {
      const recentInteractions = this.currentSession.interactions.slice(-10);
      if (recentInteractions.length > 0) {
        metrics.interactionLatency =
          recentInteractions.reduce((sum, i) => sum + i.performance.responseTime, 0) /
          recentInteractions.length;
      }
    }

    // API response time (measure health endpoint)
    const apiStart = performance.now();
    try {
      await fetch('/api/health', { method: 'HEAD' });
      metrics.apiResponseTime = performance.now() - apiStart;
    } catch (error) {
      metrics.apiResponseTime = 5000; // High value indicates API issues
    }

    return metrics;
  }

  private gatherContext(): PerformanceSnapshot['context'] {
    const connection =
      (
        navigator as Navigator & {
          connection?: {
            effectiveType?: string;
          };
          mozConnection?: {
            effectiveType?: string;
          };
          webkitConnection?: {
            effectiveType?: string;
          };
        }
      ).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    return {
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType:
        connection && typeof connection.effectiveType === 'string'
          ? connection.effectiveType
          : 'unknown',
      deviceType: this.detectDeviceType(),
    };
  }

  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private detectPerformanceRegressions(snapshot: PerformanceSnapshot): void {
    if (this.performanceSnapshots.length < 5) return; // Need some history

    const recent = this.performanceSnapshots.slice(-5);
    const averages = this.calculateAverages(recent);

    // Check for regressions (simplified)
    const thresholds: Partial<Record<keyof PerformanceSnapshot['metrics'], number>> = {
      lcp: 2500,
      cls: 0.1,
      apiResponseTime: 1000,
      memoryUsage: 80,
    };

    Object.entries(thresholds).forEach(([metric, threshold]) => {
      const value = snapshot.metrics[metric as keyof PerformanceSnapshot['metrics']];
      if (typeof value === 'number' && value > threshold!) {
        console.warn(`[Performance] Regression detected in ${metric}:`, {
          current: value,
          threshold,
          average: averages[metric as keyof PerformanceSnapshot['metrics']],
        });
      }
    });
  }

  private calculateAverages(
    snapshots: PerformanceSnapshot[]
  ): Partial<PerformanceSnapshot['metrics']> {
    const sums: Partial<Record<keyof PerformanceSnapshot['metrics'], number>> = {};
    const count = snapshots.length;

    snapshots.forEach(snapshot => {
      Object.entries(snapshot.metrics).forEach(([key, value]) => {
        if (typeof value === 'number') {
          sums[key as keyof PerformanceSnapshot['metrics']] =
            (sums[key as keyof PerformanceSnapshot['metrics']] || 0) + value;
        }
      });
    });

    const averages: Partial<Record<keyof PerformanceSnapshot['metrics'], number>> = {};
    Object.keys(sums).forEach(key => {
      averages[key as keyof PerformanceSnapshot['metrics']] =
        sums[key as keyof PerformanceSnapshot['metrics']]! / count;
    });

    return averages;
  }

  private calculateSessionMetrics(): void {
    if (!this.currentSession) return;

    const session = this.currentSession;
    const interactions = session.interactions;

    if (interactions.length > 0) {
      // Average response time
      session.metrics.averageResponseTime =
        interactions.reduce((sum, i) => sum + i.performance.responseTime, 0) / interactions.length;

      // Engagement score (simplified)
      const duration = session.endTime!.getTime() - session.startTime.getTime();
      const interactionsPerMinute = (interactions.length / duration) * 60000;
      session.metrics.engagementScore = Math.min(100, interactionsPerMinute * 10);

      // Bounce rate (simplified - if session < 30 seconds and < 3 interactions)
      session.metrics.bounceRate = duration < 30000 && interactions.length < 3 ? 100 : 0;
    }
  }

  private logSessionSummary(): void {
    if (!this.currentSession) return;

    const session = this.currentSession;
    const duration = session.endTime!.getTime() - session.startTime.getTime();

    console.log('[RealTimePerformanceTracker] Session Summary:', {
      sessionId: session.id,
      duration: `${(duration / 1000).toFixed(1)}s`,
      interactions: session.metrics.totalInteractions,
      averageResponseTime: `${session.metrics.averageResponseTime.toFixed(1)}ms`,
      engagementScore: session.metrics.engagementScore.toFixed(1),
      bounceRate: `${session.metrics.bounceRate}%`,
    });
  }

  // Public API methods
  getCurrentSession(): DemoSession | null {
    return this.currentSession;
  }

  getPerformanceSnapshots(limit = 50): PerformanceSnapshot[] {
    return this.performanceSnapshots.slice(-limit);
  }

  getPerformanceTrends(hours = 1): PerformanceTrend[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    const recentSnapshots = this.performanceSnapshots.filter(s => s.timestamp.getTime() > cutoff);

    if (recentSnapshots.length < 2) return [];

    const trends: PerformanceTrend[] = [];
    const metrics = ['lcp', 'cls', 'apiResponseTime', 'memoryUsage'];

    metrics.forEach(metric => {
      const values = recentSnapshots.map(s => (s.metrics as any)[metric]);
      const firstHalf = values.slice(0, Math.floor(values.length / 2));
      const secondHalf = values.slice(Math.floor(values.length / 2));

      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      const change = ((secondAvg - firstAvg) / firstAvg) * 100;

      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (Math.abs(change) > 5) {
        // For metrics where lower is better
        if (['lcp', 'cls', 'apiResponseTime', 'memoryUsage'].includes(metric)) {
          trend = change < 0 ? 'improving' : 'declining';
        } else {
          trend = change > 0 ? 'improving' : 'declining';
        }
      }

      trends.push({
        metric,
        trend,
        change,
        period: `${hours}h`,
      });
    });

    return trends;
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }
}

export default RealTimePerformanceTracker;
