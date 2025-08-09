// Performance Optimization Service for A1Betting
// Provides advanced performance monitoring, optimization strategies, and scalability enhancements

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  interactionToNextPaint: number;
}

interface OptimizationConfig {
  enableVirtualization: boolean;
  enableMemoryOptimization: boolean;
  enableComponentMemoization: boolean;
  enableLazyLoading: boolean;
  enableCodeSplitting: boolean;
  enablePrefetching: boolean;
  maxCacheSize: number;
  virtualScrollThreshold: number;
  debounceDelay: number;
  batchSize: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
  size: number;
}

class PerformanceOptimizationService {
  private static instance: PerformanceOptimizationService;
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    memoryUsage: 0,
    bundleSize: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0,
    firstInputDelay: 0,
    interactionToNextPaint: 0,
  };
  
  private config: OptimizationConfig = {
    enableVirtualization: true,
    enableMemoryOptimization: true,
    enableComponentMemoization: true,
    enableLazyLoading: true,
    enableCodeSplitting: true,
    enablePrefetching: true,
    maxCacheSize: 100 * 1024 * 1024, // 100MB
    virtualScrollThreshold: 50,
    debounceDelay: 300,
    batchSize: 20,
  };

  private cache = new Map<string, CacheEntry<any>>();
  private renderTracker = new Map<string, number>();
  private memoryTracker: PerformanceObserver | null = null;
  private webVitalsTracker: PerformanceObserver | null = null;

  static getInstance(): PerformanceOptimizationService {
    if (!PerformanceOptimizationService.instance) {
      PerformanceOptimizationService.instance = new PerformanceOptimizationService();
    }
    return PerformanceOptimizationService.instance;
  }

  constructor() {
    this.initializePerformanceTracking();
    this.setupWebVitalsTracking();
    this.setupMemoryTracking();
  }

  // Initialize performance tracking
  private initializePerformanceTracking(): void {
    if (typeof window === 'undefined') return;

    // Track bundle size
    this.trackBundleSize();
    
    // Setup periodic metrics collection
    setInterval(() => {
      this.collectMetrics();
    }, 30000); // Every 30 seconds
  }

  // Setup Web Vitals tracking
  private setupWebVitalsTracking(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      this.webVitalsTracker = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          switch (entry.entryType) {
            case 'paint':
              if (entry.name === 'first-contentful-paint') {
                this.metrics.firstContentfulPaint = entry.startTime;
              }
              break;
            case 'largest-contentful-paint':
              this.metrics.largestContentfulPaint = entry.startTime;
              break;
            case 'layout-shift':
              if (!(entry as any).hadRecentInput) {
                this.metrics.cumulativeLayoutShift += (entry as any).value;
              }
              break;
            case 'first-input':
              this.metrics.firstInputDelay = (entry as any).processingStart - entry.startTime;
              break;
          }
        }
      });

      this.webVitalsTracker.observe({ 
        entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] 
      });
    } catch (error) {
      console.warn('Performance tracking initialization failed:', error);
    }
  }

  // Setup memory tracking
  private setupMemoryTracking(): void {
    if (typeof window === 'undefined') return;

    // Track memory usage
    setInterval(() => {
      if ((performance as any).memory) {
        this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
      }
    }, 10000); // Every 10 seconds
  }

  // Track bundle size
  private trackBundleSize(): void {
    if (typeof window === 'undefined') return;

    // Estimate bundle size from loaded resources
    if (performance.getEntriesByType) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(r => r.name.includes('.js'));
      this.metrics.bundleSize = jsResources.reduce((total, resource) => {
        return total + (resource.transferSize || 0);
      }, 0);
    }
  }

  // Collect current metrics
  private collectMetrics(): void {
    if (typeof window === 'undefined') return;

    // Update memory usage
    if ((performance as any).memory) {
      this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }

    // Cleanup cache if needed
    this.cleanupCache();
  }

  // Advanced caching with LRU eviction
  setCache<T>(key: string, data: T, sizeEstimate: number = 1000): void {
    // Check cache size limit
    const totalSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);
    
    if (totalSize + sizeEstimate > this.config.maxCacheSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0,
      size: sizeEstimate,
    });
  }

  getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Update hit count and timestamp
    entry.hits++;
    entry.timestamp = Date.now();
    
    return entry.data;
  }

  // LRU cache eviction
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Cleanup expired cache entries
  private cleanupCache(): void {
    const maxAge = 30 * 60 * 1000; // 30 minutes
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.cache.delete(key);
      }
    }
  }

  // Track component render time
  trackRenderStart(componentName: string): void {
    this.renderTracker.set(componentName, performance.now());
  }

  trackRenderEnd(componentName: string): number {
    const startTime = this.renderTracker.get(componentName);
    if (!startTime) return 0;

    const renderTime = performance.now() - startTime;
    this.renderTracker.delete(componentName);
    
    // Update metrics
    this.metrics.renderTime = Math.max(this.metrics.renderTime, renderTime);
    
    return renderTime;
  }

  // Debounce function with configurable delay
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number = this.config.debounceDelay
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Throttle function for high-frequency events
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number = 100
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Batch processing for large datasets
  batchProcess<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    batchSize: number = this.config.batchSize
  ): Promise<R[]> {
    const batches: T[][] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    return Promise.all(batches.map(batch => processor(batch)))
      .then(results => results.flat());
  }

  // Memory optimization utilities
  optimizeComponentMemoization(dependencies: any[]): boolean {
    if (!this.config.enableComponentMemoization) return false;
    
    // Simple dependency comparison for memoization
    const key = JSON.stringify(dependencies);
    const cached = this.getCache(key);
    
    if (cached) return false; // Don't re-render
    
    this.setCache(key, true, 100);
    return true; // Re-render needed
  }

  // Virtual scrolling helper
  shouldUseVirtualization(itemCount: number): boolean {
    return this.config.enableVirtualization && 
           itemCount > this.config.virtualScrollThreshold;
  }

  // Lazy loading utilities
  createIntersectionObserver(
    callback: (entries: IntersectionObserverEntry[]) => void,
    options: IntersectionObserverInit = {}
  ): IntersectionObserver | null {
    if (!this.config.enableLazyLoading) return null;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return null;

    return new IntersectionObserver(callback, {
      rootMargin: '100px',
      threshold: 0.1,
      ...options,
    });
  }

  // Prefetching utilities
  prefetchResource(url: string, type: 'script' | 'style' | 'image' = 'script'): void {
    if (!this.config.enablePrefetching) return;
    if (typeof window === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = type;
    
    document.head.appendChild(link);
  }

  // Get current performance metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get optimization configuration
  getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  // Update optimization configuration
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Performance report generation
  generatePerformanceReport(): {
    metrics: PerformanceMetrics;
    config: OptimizationConfig;
    cacheStats: {
      size: number;
      entries: number;
      hitRate: number;
    };
    recommendations: string[];
  } {
    const cacheEntries = Array.from(this.cache.values());
    const totalHits = cacheEntries.reduce((sum, entry) => sum + entry.hits, 0);
    const cacheSize = cacheEntries.reduce((sum, entry) => sum + entry.size, 0);

    const recommendations: string[] = [];

    // Performance recommendations
    if (this.metrics.renderTime > 100) {
      recommendations.push('Consider optimizing component render performance');
    }
    if (this.metrics.memoryUsage > 50 * 1024 * 1024) {
      recommendations.push('Memory usage is high, consider implementing cleanup strategies');
    }
    if (this.metrics.largestContentfulPaint > 2500) {
      recommendations.push('Largest Contentful Paint is slow, optimize critical resources');
    }
    if (this.metrics.cumulativeLayoutShift > 0.1) {
      recommendations.push('Reduce Cumulative Layout Shift for better UX');
    }

    return {
      metrics: this.getMetrics(),
      config: this.getConfig(),
      cacheStats: {
        size: cacheSize,
        entries: this.cache.size,
        hitRate: totalHits > 0 ? cacheEntries.length / totalHits : 0,
      },
      recommendations,
    };
  }

  // Cleanup method
  cleanup(): void {
    if (this.webVitalsTracker) {
      this.webVitalsTracker.disconnect();
    }
    if (this.memoryTracker) {
      this.memoryTracker.disconnect();
    }
    this.cache.clear();
    this.renderTracker.clear();
  }
}

export default PerformanceOptimizationService;
export type { PerformanceMetrics, OptimizationConfig };
