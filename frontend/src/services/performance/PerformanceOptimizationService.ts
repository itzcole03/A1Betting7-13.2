import { startTransition } from 'react';

// Performance optimization interfaces
interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage: number;
  bundleSize: number;
  cacheHitRate: number;
  networkRequests: number;
  webVitals: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    fcp: number; // First Contentful Paint
    ttfb: number; // Time to First Byte
  };
  customMetrics: {
    propLoadTime: number;
    predictionLatency: number;
    uiResponseTime: number;
    dataProcessingTime: number;
  };
}

interface OptimizationStrategy {
  id: string;
  name: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  complexity: 'simple' | 'moderate' | 'complex' | 'advanced';
  implementationTime: number;
  expectedImprovement: number;
  category: 'rendering' | 'memory' | 'network' | 'caching' | 'bundling';
  enabled: boolean;
  autoApply: boolean;
}

interface CacheConfig {
  maxSize: number;
  ttl: number;
  strategy: 'lru' | 'lfu' | 'fifo' | 'ttl';
  compression: boolean;
  persistence: boolean;
}

interface VirtualizationConfig {
  enabled: boolean;
  itemHeight: number;
  overscan: number;
  threshold: number;
  chunkSize: number;
}

interface MemoryManagement {
  garbageCollection: {
    enabled: boolean;
    interval: number;
    threshold: number;
  };
  componentCleanup: {
    enabled: boolean;
    unusedTimeout: number;
  };
  dataCleanup: {
    enabled: boolean;
    staleDataTimeout: number;
  };
}

interface NetworkOptimization {
  requestBatching: {
    enabled: boolean;
    batchSize: number;
    timeout: number;
  };
  compression: {
    enabled: boolean;
    algorithm: 'gzip' | 'brotli';
  };
  caching: {
    enabled: boolean;
    maxAge: number;
    staleWhileRevalidate: number;
  };
  preloading: {
    enabled: boolean;
    priority: 'high' | 'low';
    resources: string[];
  };
}

class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;
  private usage: Map<K, number>;
  private currentTime: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
    this.usage = new Map();
    this.currentTime = 0;
  }

  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      this.usage.set(key, ++this.currentTime);
      return this.cache.get(key);
    }
    return undefined;
  }

  set(key: K, value: V): void {
    if (this.cache.size >= this.capacity && !this.cache.has(key)) {
      this.evictLRU();
    }
    
    this.cache.set(key, value);
    this.usage.set(key, ++this.currentTime);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    this.usage.delete(key);
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.usage.clear();
    this.currentTime = 0;
  }

  size(): number {
    return this.cache.size;
  }

  private evictLRU(): void {
    let lruKey: K | undefined;
    let lruTime = Infinity;

    for (const [key, time] of this.usage) {
      if (time < lruTime) {
        lruTime = time;
        lruKey = key;
      }
    }

    if (lruKey !== undefined) {
      this.delete(lruKey);
    }
  }

  getStats(): { size: number; capacity: number; hitRate: number } {
    return {
      size: this.cache.size,
      capacity: this.capacity,
      hitRate: this.cache.size > 0 ? (this.currentTime / this.cache.size) : 0
    };
  }
}

class PerformanceOptimizationService {
  private static instance: PerformanceOptimizationService;
  private metrics: PerformanceMetrics;
  private strategies: OptimizationStrategy[];
  private caches: Map<string, LRUCache<string, any>>;
  private config: {
    cache: CacheConfig;
    virtualization: VirtualizationConfig;
    memory: MemoryManagement;
    network: NetworkOptimization;
  };
  private observers: Map<string, PerformanceObserver>;
  private isMonitoring: boolean;
  private optimizationQueue: OptimizationStrategy[];
  private lastOptimization: Date;

  private constructor() {
    this.metrics = this.initializeMetrics();
    this.strategies = this.initializeStrategies();
    this.caches = new Map();
    this.config = this.initializeConfig();
    this.observers = new Map();
    this.isMonitoring = false;
    this.optimizationQueue = [];
    this.lastOptimization = new Date();

    this.initializeCaches();
    this.startMonitoring();
  }

  public static getInstance(): PerformanceOptimizationService {
    if (!PerformanceOptimizationService.instance) {
      PerformanceOptimizationService.instance = new PerformanceOptimizationService();
    }
    return PerformanceOptimizationService.instance;
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      renderTime: 0,
      componentCount: 0,
      memoryUsage: 0,
      bundleSize: 0,
      cacheHitRate: 0,
      networkRequests: 0,
      webVitals: {
        lcp: 0,
        fid: 0,
        cls: 0,
        fcp: 0,
        ttfb: 0
      },
      customMetrics: {
        propLoadTime: 0,
        predictionLatency: 0,
        uiResponseTime: 0,
        dataProcessingTime: 0
      }
    };
  }

  private initializeStrategies(): OptimizationStrategy[] {
    return [
      {
        id: 'component-memoization',
        name: 'React Component Memoization',
        description: 'Optimize React components with React.memo and useMemo',
        impact: 'high',
        complexity: 'simple',
        implementationTime: 30,
        expectedImprovement: 25,
        category: 'rendering',
        enabled: true,
        autoApply: true
      },
      {
        id: 'virtual-scrolling',
        name: 'Virtual Scrolling Implementation',
        description: 'Implement virtual scrolling for large datasets',
        impact: 'critical',
        complexity: 'moderate',
        implementationTime: 120,
        expectedImprovement: 60,
        category: 'rendering',
        enabled: true,
        autoApply: false
      },
      {
        id: 'lazy-loading',
        name: 'Component Lazy Loading',
        description: 'Lazy load components using React.lazy and Suspense',
        impact: 'medium',
        complexity: 'simple',
        implementationTime: 45,
        expectedImprovement: 20,
        category: 'bundling',
        enabled: true,
        autoApply: true
      },
      {
        id: 'api-caching',
        name: 'Advanced API Caching',
        description: 'Implement intelligent API response caching',
        impact: 'high',
        complexity: 'moderate',
        implementationTime: 90,
        expectedImprovement: 40,
        category: 'network',
        enabled: true,
        autoApply: true
      },
      {
        id: 'bundle-splitting',
        name: 'Code Splitting Optimization',
        description: 'Optimize bundle splitting and chunk loading',
        impact: 'medium',
        complexity: 'complex',
        implementationTime: 180,
        expectedImprovement: 30,
        category: 'bundling',
        enabled: true,
        autoApply: false
      },
      {
        id: 'memory-cleanup',
        name: 'Memory Management',
        description: 'Automatic cleanup of unused data and components',
        impact: 'medium',
        complexity: 'moderate',
        implementationTime: 75,
        expectedImprovement: 25,
        category: 'memory',
        enabled: true,
        autoApply: true
      },
      {
        id: 'request-batching',
        name: 'Network Request Batching',
        description: 'Batch multiple API requests to reduce network overhead',
        impact: 'medium',
        complexity: 'moderate',
        implementationTime: 60,
        expectedImprovement: 35,
        category: 'network',
        enabled: true,
        autoApply: true
      },
      {
        id: 'concurrent-features',
        name: 'React 19 Concurrent Features',
        description: 'Utilize React 19 concurrent features for better UX',
        impact: 'high',
        complexity: 'advanced',
        implementationTime: 150,
        expectedImprovement: 45,
        category: 'rendering',
        enabled: true,
        autoApply: false
      }
    ];
  }

  private initializeConfig() {
    return {
      cache: {
        maxSize: 100,
        ttl: 300000, // 5 minutes
        strategy: 'lru' as const,
        compression: true,
        persistence: false
      },
      virtualization: {
        enabled: true,
        itemHeight: 200,
        overscan: 10,
        threshold: 50,
        chunkSize: 20
      },
      memory: {
        garbageCollection: {
          enabled: true,
          interval: 60000, // 1 minute
          threshold: 80 // 80% memory usage
        },
        componentCleanup: {
          enabled: true,
          unusedTimeout: 300000 // 5 minutes
        },
        dataCleanup: {
          enabled: true,
          staleDataTimeout: 600000 // 10 minutes
        }
      },
      network: {
        requestBatching: {
          enabled: true,
          batchSize: 10,
          timeout: 100
        },
        compression: {
          enabled: true,
          algorithm: 'gzip' as const
        },
        caching: {
          enabled: true,
          maxAge: 300,
          staleWhileRevalidate: 60
        },
        preloading: {
          enabled: true,
          priority: 'low' as const,
          resources: ['critical-components', 'fonts', 'icons']
        }
      }
    };
  }

  private initializeCaches(): void {
    // API Response Cache
    this.caches.set('api', new LRUCache<string, any>(this.config.cache.maxSize));
    
    // Component Cache
    this.caches.set('components', new LRUCache<string, any>(50));
    
    // Prediction Cache
    this.caches.set('predictions', new LRUCache<string, any>(200));
    
    // Player Data Cache
    this.caches.set('players', new LRUCache<string, any>(500));
    
    // Computed Values Cache
    this.caches.set('computed', new LRUCache<string, any>(100));
  }

  // Performance Monitoring
  public startMonitoring(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    this.setupWebVitalsObserver();
    this.setupPerformanceObserver();
    this.setupMemoryMonitoring();
    this.setupNetworkMonitoring();
    this.scheduleOptimizations();
  }

  public stopMonitoring(): void {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  private setupWebVitalsObserver(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          switch (entry.entryType) {
            case 'largest-contentful-paint':
              this.metrics.webVitals.lcp = entry.startTime;
              break;
            case 'first-input':
              this.metrics.webVitals.fid = (entry as any).processingStart - entry.startTime;
              break;
            case 'layout-shift':
              this.metrics.webVitals.cls += (entry as any).value;
              break;
            case 'paint':
              if (entry.name === 'first-contentful-paint') {
                this.metrics.webVitals.fcp = entry.startTime;
              }
              break;
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift', 'paint'] });
        this.observers.set('webVitals', observer);
      } catch (e) {
        console.warn('Web Vitals observer not supported');
      }
    }
  }

  private setupPerformanceObserver(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'measure') {
            if (entry.name.includes('render')) {
              this.metrics.renderTime = entry.duration;
            } else if (entry.name.includes('network')) {
              this.metrics.networkRequests++;
            }
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['measure'] });
        this.observers.set('performance', observer);
      } catch (e) {
        console.warn('Performance observer not supported');
      }
    }
  }

  private setupMemoryMonitoring(): void {
    if ((performance as any).memory) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        if (this.metrics.memoryUsage > this.config.memory.garbageCollection.threshold / 100) {
          this.triggerGarbageCollection();
        }
      }, this.config.memory.garbageCollection.interval);
    }
  }

  private setupNetworkMonitoring(): void {
    // Monitor network requests
    const originalFetch = window.fetch;
    let requestCount = 0;
    
    window.fetch = async (...args) => {
      const start = performance.now();
      requestCount++;
      
      try {
        const response = await originalFetch(...args);
        const end = performance.now();
        
        this.metrics.customMetrics.uiResponseTime = end - start;
        this.metrics.networkRequests = requestCount;
        
        return response;
      } catch (error) {
        this.metrics.networkRequests = requestCount;
        throw error;
      }
    };
  }

  // Caching System
  public getCache(cacheType: string): LRUCache<string, any> | undefined {
    return this.caches.get(cacheType);
  }

  public setCacheValue(cacheType: string, key: string, value: any, ttl?: number): void {
    const cache = this.caches.get(cacheType);
    if (cache) {
      const wrappedValue = {
        data: value,
        timestamp: Date.now(),
        ttl: ttl || this.config.cache.ttl
      };
      cache.set(key, wrappedValue);
    }
  }

  public getCacheValue(cacheType: string, key: string): any | undefined {
    const cache = this.caches.get(cacheType);
    if (cache) {
      const value = cache.get(key);
      if (value && Date.now() - value.timestamp < value.ttl) {
        return value.data;
      } else if (value) {
        cache.delete(key);
      }
    }
    return undefined;
  }

  public clearCache(cacheType?: string): void {
    if (cacheType) {
      const cache = this.caches.get(cacheType);
      if (cache) {
        cache.clear();
      }
    } else {
      this.caches.forEach(cache => cache.clear());
    }
  }

  // Memory Management
  private triggerGarbageCollection(): void {
    if (this.config.memory.garbageCollection.enabled) {
      // Clear old cache entries
      this.caches.forEach((cache, type) => {
        const stats = cache.getStats();
        if (stats.size > stats.capacity * 0.8) {
          this.performCacheCleanup(type);
        }
      });

      // Trigger browser garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }
    }
  }

  private performCacheCleanup(cacheType: string): void {
    const cache = this.caches.get(cacheType);
    if (cache) {
      // Remove oldest 25% of entries
      const targetSize = Math.floor(cache.size() * 0.75);
      while (cache.size() > targetSize) {
        // LRU cache will automatically remove oldest entries
        const keys = Array.from((cache as any).cache.keys());
        if (keys.length > 0) {
          cache.delete(keys[0]);
        } else {
          break;
        }
      }
    }
  }

  // Network Optimization
  public batchRequests<T>(requests: (() => Promise<T>)[]): Promise<T[]> {
    if (!this.config.network.requestBatching.enabled) {
      return Promise.all(requests.map(req => req()));
    }

    const batches: (() => Promise<T>)[][] = [];
    const batchSize = this.config.network.requestBatching.batchSize;

    for (let i = 0; i < requests.length; i += batchSize) {
      batches.push(requests.slice(i, i + batchSize));
    }

    const batchPromises = batches.map(batch => 
      new Promise<T[]>((resolve) => {
        setTimeout(() => {
          Promise.all(batch.map(req => req())).then(resolve);
        }, this.config.network.requestBatching.timeout);
      })
    );

    return Promise.all(batchPromises).then(results => results.flat());
  }

  // Component Optimization
  public memoizeComponent<T extends React.ComponentType<any>>(
    Component: T,
    arePropsEqual?: (prevProps: any, nextProps: any) => boolean
  ): T {
    return React.memo(Component, arePropsEqual) as T;
  }

  public optimizeRender<T>(computeExpensiveValue: () => T, deps: React.DependencyList): T {
    return React.useMemo(computeExpensiveValue, deps);
  }

  public deferValue<T>(value: T): T {
    return React.useDeferredValue(value);
  }

  public startTransition(callback: () => void): void {
    startTransition(callback);
  }

  // Virtual Scrolling Helper
  public shouldUseVirtualScrolling(itemCount: number): boolean {
    return this.config.virtualization.enabled && itemCount > this.config.virtualization.threshold;
  }

  public getVirtualizationConfig() {
    return this.config.virtualization;
  }

  // Performance Analysis
  public analyzePerformance(): {
    overall: number;
    recommendations: OptimizationStrategy[];
    criticalIssues: string[];
    metrics: PerformanceMetrics;
  } {
    const overallScore = this.calculateOverallScore();
    const recommendations = this.getRecommendations();
    const criticalIssues = this.identifyCriticalIssues();

    return {
      overall: overallScore,
      recommendations,
      criticalIssues,
      metrics: { ...this.metrics }
    };
  }

  private calculateOverallScore(): number {
    const weights = {
      webVitals: 0.4,
      renderTime: 0.2,
      memoryUsage: 0.15,
      cacheHitRate: 0.15,
      networkRequests: 0.1
    };

    const scores = {
      webVitals: this.scoreWebVitals(),
      renderTime: this.scoreRenderTime(),
      memoryUsage: this.scoreMemoryUsage(),
      cacheHitRate: this.scoreCacheHitRate(),
      networkRequests: this.scoreNetworkRequests()
    };

    return Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (scores[key as keyof typeof scores] * weight);
    }, 0);
  }

  private scoreWebVitals(): number {
    const { lcp, fid, cls } = this.metrics.webVitals;
    
    const lcpScore = lcp <= 2500 ? 100 : lcp <= 4000 ? 50 : 0;
    const fidScore = fid <= 100 ? 100 : fid <= 300 ? 50 : 0;
    const clsScore = cls <= 0.1 ? 100 : cls <= 0.25 ? 50 : 0;

    return (lcpScore + fidScore + clsScore) / 3;
  }

  private scoreRenderTime(): number {
    return this.metrics.renderTime <= 16 ? 100 : this.metrics.renderTime <= 50 ? 50 : 0;
  }

  private scoreMemoryUsage(): number {
    return this.metrics.memoryUsage <= 0.7 ? 100 : this.metrics.memoryUsage <= 0.9 ? 50 : 0;
  }

  private scoreCacheHitRate(): number {
    return this.metrics.cacheHitRate >= 0.8 ? 100 : this.metrics.cacheHitRate >= 0.6 ? 50 : 0;
  }

  private scoreNetworkRequests(): number {
    return this.metrics.networkRequests <= 10 ? 100 : this.metrics.networkRequests <= 20 ? 50 : 0;
  }

  private getRecommendations(): OptimizationStrategy[] {
    return this.strategies
      .filter(strategy => !strategy.enabled || this.shouldRecommendStrategy(strategy))
      .sort((a, b) => this.prioritizeStrategy(b) - this.prioritizeStrategy(a))
      .slice(0, 5);
  }

  private shouldRecommendStrategy(strategy: OptimizationStrategy): boolean {
    switch (strategy.id) {
      case 'virtual-scrolling':
        return this.metrics.componentCount > 100;
      case 'api-caching':
        return this.metrics.cacheHitRate < 0.7;
      case 'memory-cleanup':
        return this.metrics.memoryUsage > 0.8;
      case 'request-batching':
        return this.metrics.networkRequests > 15;
      default:
        return true;
    }
  }

  private prioritizeStrategy(strategy: OptimizationStrategy): number {
    const impactScores = { low: 1, medium: 2, high: 3, critical: 4 };
    const complexityScores = { simple: 4, moderate: 3, complex: 2, advanced: 1 };
    
    return impactScores[strategy.impact] * complexityScores[strategy.complexity] * strategy.expectedImprovement;
  }

  private identifyCriticalIssues(): string[] {
    const issues: string[] = [];

    if (this.metrics.webVitals.lcp > 4000) {
      issues.push('Large Contentful Paint exceeds 4 seconds');
    }

    if (this.metrics.webVitals.fid > 300) {
      issues.push('First Input Delay exceeds 300ms');
    }

    if (this.metrics.webVitals.cls > 0.25) {
      issues.push('Cumulative Layout Shift exceeds 0.25');
    }

    if (this.metrics.memoryUsage > 0.9) {
      issues.push('Memory usage exceeds 90%');
    }

    if (this.metrics.renderTime > 100) {
      issues.push('Render time exceeds 100ms');
    }

    if (this.metrics.cacheHitRate < 0.5) {
      issues.push('Cache hit rate below 50%');
    }

    return issues;
  }

  // Optimization Scheduling
  private scheduleOptimizations(): void {
    setInterval(() => {
      if (this.shouldRunOptimizations()) {
        this.runScheduledOptimizations();
      }
    }, 60000); // Check every minute
  }

  private shouldRunOptimizations(): boolean {
    const timeSinceLastOptimization = Date.now() - this.lastOptimization.getTime();
    const minInterval = 300000; // 5 minutes

    return timeSinceLastOptimization > minInterval && 
           (this.metrics.memoryUsage > 0.7 || this.metrics.cacheHitRate < 0.6);
  }

  private runScheduledOptimizations(): void {
    const autoOptimizations = this.strategies.filter(s => s.enabled && s.autoApply);
    
    autoOptimizations.forEach(optimization => {
      this.applyOptimization(optimization);
    });

    this.lastOptimization = new Date();
  }

  private applyOptimization(strategy: OptimizationStrategy): void {
    switch (strategy.id) {
      case 'memory-cleanup':
        this.triggerGarbageCollection();
        break;
      case 'api-caching':
        this.optimizeCacheConfiguration();
        break;
      case 'component-memoization':
        // This would be applied at the component level
        break;
      default:
        console.log(`Applied optimization: ${strategy.name}`);
    }
  }

  private optimizeCacheConfiguration(): void {
    this.caches.forEach((cache, type) => {
      const stats = cache.getStats();
      if (stats.hitRate < 0.5) {
        // Increase cache size for low hit rate caches
        const newCache = new LRUCache<string, any>(Math.floor(stats.capacity * 1.5));
        this.caches.set(type, newCache);
      }
    });
  }

  // Public API
  public getMetrics(): PerformanceMetrics {
    this.updateCacheMetrics();
    return { ...this.metrics };
  }

  public getStrategies(): OptimizationStrategy[] {
    return [...this.strategies];
  }

  public updateStrategy(id: string, updates: Partial<OptimizationStrategy>): void {
    const index = this.strategies.findIndex(s => s.id === id);
    if (index !== -1) {
      this.strategies[index] = { ...this.strategies[index], ...updates };
    }
  }

  public getConfig() {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...updates };
  }

  private updateCacheMetrics(): void {
    let totalHits = 0;
    let totalRequests = 0;

    this.caches.forEach(cache => {
      const stats = cache.getStats();
      totalHits += stats.hitRate * stats.size;
      totalRequests += stats.size;
    });

    this.metrics.cacheHitRate = totalRequests > 0 ? totalHits / totalRequests : 0;
  }

  // Utility methods for React components
  public measureRender<T>(componentName: string, renderFunction: () => T): T {
    const start = performance.now();
    const result = renderFunction();
    const end = performance.now();
    
    performance.mark(`${componentName}-render-start`);
    performance.mark(`${componentName}-render-end`);
    performance.measure(`${componentName}-render`, `${componentName}-render-start`, `${componentName}-render-end`);
    
    return result;
  }

  public optimizeImageLoading(src: string, options?: { lazy?: boolean; webp?: boolean }): string {
    if (options?.webp && this.supportsWebP()) {
      src = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    
    return src;
  }

  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  public preloadResource(url: string, type: 'script' | 'style' | 'image' | 'font' = 'script'): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = type;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to preload ${url}`));
      document.head.appendChild(link);
    });
  }
}

// Export singleton instance and types
export default PerformanceOptimizationService;
export type { 
  PerformanceMetrics, 
  OptimizationStrategy, 
  CacheConfig, 
  VirtualizationConfig,
  MemoryManagement,
  NetworkOptimization
};

// React hooks for using the performance service
export const usePerformanceOptimization = () => {
  const service = PerformanceOptimizationService.getInstance();
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>(service.getMetrics());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(service.getMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, [service]);

  return {
    metrics,
    service,
    analyze: () => service.analyzePerformance(),
    getCache: (type: string) => service.getCache(type),
    measureRender: <T>(name: string, fn: () => T) => service.measureRender(name, fn),
    optimizeRender: <T>(fn: () => T, deps: React.DependencyList) => service.optimizeRender(fn, deps),
    deferValue: <T>(value: T) => service.deferValue(value),
    startTransition: (callback: () => void) => service.startTransition(callback)
  };
};

export const useCache = (cacheType: string) => {
  const service = PerformanceOptimizationService.getInstance();

  return {
    get: (key: string) => service.getCacheValue(cacheType, key),
    set: (key: string, value: any, ttl?: number) => service.setCacheValue(cacheType, key, value, ttl),
    clear: () => service.clearCache(cacheType),
    cache: service.getCache(cacheType)
  };
};

export const useVirtualization = () => {
  const service = PerformanceOptimizationService.getInstance();
  
  return {
    shouldUseVirtualScrolling: (itemCount: number) => service.shouldUseVirtualScrolling(itemCount),
    config: service.getVirtualizationConfig()
  };
};
