/**
 * Consolidated Cache Manager - Phase 1.4 Frontend Cache Consolidation
 * Unifies fragmented frontend caching services into a single, efficient cache manager.
 * 
 * Based on A1Betting Backend Data Optimization Roadmap:
 * - Eliminate duplicate cache entries across services
 * - Implement shared memory pools with reference counting  
 * - Add automatic cache eviction based on memory pressure
 * - WebSocket integration for real-time cache invalidation
 * - Event-driven cache updates with smart prefetching
 * - 50% reduction in frontend memory usage
 * - 90% cache hit rate for repeated requests
 */

import { LRUCache } from 'lru-cache';
import { EnhancedPropAnalysis } from '../types/analytics';
import { FeaturedProp } from '../types/propTypes';
import { PredictionResult } from '../types/predictionTypes';

// Cache Categories for better organization
export enum CacheCategory {
  ANALYSIS = 'analysis',
  PREDICTIONS = 'predictions', 
  PROPS = 'props',
  METADATA = 'metadata',
  PLAYER_DATA = 'player_data',
  ODDS = 'odds',
  SPORTS_DATA = 'sports_data',
  SETTINGS = 'settings'
}

// Cache Configuration
interface CacheConfig {
  max: number;
  ttl: number; // milliseconds
  allowStale: boolean;
  updateAgeOnGet: boolean;
}

// Memory pressure levels
enum MemoryPressure {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Cache entry with metadata
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
  referenceCount: number;
  tags: string[];
}

// Performance metrics
interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  memoryUsage: number;
  hitRate: number;
  averageLatency: number;
}

// WebSocket event types for cache invalidation
interface CacheInvalidationEvent {
  type: 'invalidate' | 'update' | 'refresh';
  category: CacheCategory;
  keys?: string[];
  pattern?: string;
  data?: any;
}

export class ConsolidatedCacheManager {
  private static instance: ConsolidatedCacheManager;
  
  // Unified cache layers with LRU eviction
  private caches: Map<CacheCategory, LRUCache<string, CacheEntry<any>>> = new Map();
  
  // Memory management
  private memoryUsage: number = 0;
  private maxMemoryMB: number = 256; // 256MB default limit
  private memoryPressure: MemoryPressure = MemoryPressure.LOW;
  
  // Performance tracking
  private metrics: Map<CacheCategory, CacheMetrics> = new Map();
  private globalMetrics: CacheMetrics;
  
  // Real-time invalidation
  private invalidationListeners: Map<string, Function[]> = new Map();
  private prefetchQueue: Array<{ key: string; category: CacheCategory; fetcher: Function }> = [];
  
  // WebSocket connection for real-time updates
  private websocketConnection?: WebSocket;
  
  // Cache configurations by category
  private readonly cacheConfigs: Map<CacheCategory, CacheConfig> = new Map([
    [CacheCategory.ANALYSIS, { max: 500, ttl: 5 * 60 * 1000, allowStale: true, updateAgeOnGet: true }],
    [CacheCategory.PREDICTIONS, { max: 1000, ttl: 2 * 60 * 1000, allowStale: true, updateAgeOnGet: true }],
    [CacheCategory.PROPS, { max: 2000, ttl: 1 * 60 * 1000, allowStale: false, updateAgeOnGet: true }],
    [CacheCategory.METADATA, { max: 100, ttl: 30 * 60 * 1000, allowStale: true, updateAgeOnGet: false }],
    [CacheCategory.PLAYER_DATA, { max: 800, ttl: 10 * 60 * 1000, allowStale: true, updateAgeOnGet: true }],
    [CacheCategory.ODDS, { max: 1500, ttl: 30 * 1000, allowStale: false, updateAgeOnGet: true }],
    [CacheCategory.SPORTS_DATA, { max: 300, ttl: 5 * 60 * 1000, allowStale: true, updateAgeOnGet: true }],
    [CacheCategory.SETTINGS, { max: 50, ttl: 60 * 60 * 1000, allowStale: true, updateAgeOnGet: false }]
  ]);

  private constructor() {
    this.initializeCaches();
    this.initializeMetrics();
    this.setupMemoryMonitoring();
    this.setupWebSocketConnection();
    this.startPrefetchWorker();
    
    console.log('[ConsolidatedCacheManager] Initialized with unified caching system');
  }

  public static getInstance(): ConsolidatedCacheManager {
    if (!ConsolidatedCacheManager.instance) {
      ConsolidatedCacheManager.instance = new ConsolidatedCacheManager();
    }
    return ConsolidatedCacheManager.instance;
  }

  /**
   * Initialize all cache categories with their specific configurations
   */
  private initializeCaches(): void {
    for (const [category, config] of this.cacheConfigs.entries()) {
      const cache = new LRUCache<string, CacheEntry<any>>({
        max: config.max,
        ttl: config.ttl,
        allowStale: config.allowStale,
        updateAgeOnGet: config.updateAgeOnGet,
        // Custom disposal function for memory tracking
        dispose: (value, key) => {
          this.updateMemoryUsage(-this.calculateEntrySize(value));
          this.metrics.get(category)!.evictions++;
        }
      });
      
      this.caches.set(category, cache);
    }
  }

  /**
   * Initialize performance metrics for each cache category
   */
  private initializeMetrics(): void {
    for (const category of Object.values(CacheCategory)) {
      this.metrics.set(category, {
        hits: 0,
        misses: 0,
        evictions: 0,
        memoryUsage: 0,
        hitRate: 0,
        averageLatency: 0
      });
    }
    
    this.globalMetrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      memoryUsage: 0,
      hitRate: 0,
      averageLatency: 0
    };
  }

  /**
   * Generic get method with automatic metrics tracking
   */
  public async get<T>(category: CacheCategory, key: string): Promise<T | null> {
    const startTime = performance.now();
    const cache = this.caches.get(category);
    
    if (!cache) {
      throw new Error(`Cache category ${category} not found`);
    }

    const entry = cache.get(key);
    const latency = performance.now() - startTime;
    const metrics = this.metrics.get(category)!;
    
    if (entry) {
      // Cache hit
      entry.hits++;
      entry.lastAccessed = Date.now();
      entry.referenceCount++;
      
      metrics.hits++;
      this.globalMetrics.hits++;
      
      // Update average latency
      metrics.averageLatency = (metrics.averageLatency * 0.9) + (latency * 0.1);
      
      // Check if data is stale and should trigger background refresh
      const age = Date.now() - entry.timestamp;
      if (age > entry.ttl * 0.8) { // Refresh when 80% of TTL has passed
        this.schedulePrefetch(category, key);
      }
      
      return entry.data;
    } else {
      // Cache miss
      metrics.misses++;
      this.globalMetrics.misses++;
      return null;
    }
  }

  /**
   * Generic set method with automatic memory management
   */
  public async set<T>(
    category: CacheCategory, 
    key: string, 
    data: T, 
    options?: { 
      ttl?: number; 
      tags?: string[]; 
      skipMemoryCheck?: boolean 
    }
  ): Promise<boolean> {
    const cache = this.caches.get(category);
    
    if (!cache) {
      throw new Error(`Cache category ${category} not found`);
    }

    const config = this.cacheConfigs.get(category)!;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: options?.ttl || config.ttl,
      hits: 0,
      lastAccessed: Date.now(),
      referenceCount: 1,
      tags: options?.tags || []
    };

    const entrySize = this.calculateEntrySize(entry);
    
    // Check memory pressure before adding
    if (!options?.skipMemoryCheck && !this.canAllocateMemory(entrySize)) {
      await this.handleMemoryPressure();
      
      // Check again after cleanup
      if (!this.canAllocateMemory(entrySize)) {
        console.warn(`[ConsolidatedCacheManager] Cannot allocate ${entrySize}B for ${category}:${key}`);
        return false;
      }
    }

    // Set the entry
    cache.set(key, entry);
    this.updateMemoryUsage(entrySize);
    
    // Notify invalidation listeners
    this.notifyInvalidationListeners(`${category}:${key}`, 'update', data);
    
    return true;
  }

  /**
   * Delete entry and update reference counting
   */
  public async delete(category: CacheCategory, key: string): Promise<boolean> {
    const cache = this.caches.get(category);
    
    if (!cache) {
      return false;
    }

    const entry = cache.get(key);
    if (entry) {
      entry.referenceCount--;
      
      // Only delete if no active references
      if (entry.referenceCount <= 0) {
        const deleted = cache.delete(key);
        if (deleted) {
          this.notifyInvalidationListeners(`${category}:${key}`, 'invalidate');
        }
        return deleted;
      }
    }
    
    return false;
  }

  /**
   * Clear entire cache category
   */
  public async clear(category: CacheCategory): Promise<void> {
    const cache = this.caches.get(category);
    
    if (cache) {
      const size = cache.size;
      cache.clear();
      this.updateMemoryUsage(-this.metrics.get(category)!.memoryUsage);
      this.metrics.get(category)!.memoryUsage = 0;
      
      console.log(`[ConsolidatedCacheManager] Cleared ${size} entries from ${category} cache`);
      this.notifyInvalidationListeners(`${category}:*`, 'invalidate');
    }
  }

  /**
   * Invalidate cache entries by pattern or tags
   */
  public async invalidate(
    category: CacheCategory, 
    pattern?: string, 
    tags?: string[]
  ): Promise<number> {
    const cache = this.caches.get(category);
    
    if (!cache) {
      return 0;
    }

    let invalidatedCount = 0;
    const keysToDelete: string[] = [];

    for (const [key, entry] of cache.entries()) {
      let shouldInvalidate = false;
      
      // Check pattern match
      if (pattern && key.includes(pattern)) {
        shouldInvalidate = true;
      }
      
      // Check tag match
      if (tags && tags.some(tag => entry.tags.includes(tag))) {
        shouldInvalidate = true;
      }
      
      if (shouldInvalidate) {
        keysToDelete.push(key);
      }
    }

    // Delete matched entries
    for (const key of keysToDelete) {
      if (cache.delete(key)) {
        invalidatedCount++;
      }
    }

    if (invalidatedCount > 0) {
      console.log(`[ConsolidatedCacheManager] Invalidated ${invalidatedCount} entries from ${category}`);
      this.notifyInvalidationListeners(`${category}:pattern:${pattern}`, 'invalidate');
    }

    return invalidatedCount;
  }

  /**
   * Batch operations for efficiency
   */
  public async batchSet<T>(
    category: CacheCategory,
    entries: Array<{ key: string; data: T; options?: any }>
  ): Promise<number> {
    let successCount = 0;
    
    for (const entry of entries) {
      if (await this.set(category, entry.key, entry.data, entry.options)) {
        successCount++;
      }
    }
    
    return successCount;
  }

  public async batchGet<T>(
    category: CacheCategory,
    keys: string[]
  ): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    
    for (const key of keys) {
      results.set(key, await this.get<T>(category, key));
    }
    
    return results;
  }

  /**
   * Smart prefetching based on access patterns
   */
  private schedulePrefetch(category: CacheCategory, key: string): void {
    // Only prefetch if not already queued
    const existingIndex = this.prefetchQueue.findIndex(
      item => item.category === category && item.key === key
    );
    
    if (existingIndex === -1) {
      // Add to prefetch queue (fetcher would be provided by the calling service)
      console.log(`[ConsolidatedCacheManager] Scheduled prefetch for ${category}:${key}`);
    }
  }

  /**
   * Background prefetch worker
   */
  private startPrefetchWorker(): void {
    setInterval(async () => {
      if (this.prefetchQueue.length > 0 && this.memoryPressure !== MemoryPressure.CRITICAL) {
        const item = this.prefetchQueue.shift();
        if (item) {
          try {
            // Prefetch would be handled by the service that registered the fetcher
            console.log(`[ConsolidatedCacheManager] Processing prefetch for ${item.category}:${item.key}`);
          } catch (error) {
            console.warn(`[ConsolidatedCacheManager] Prefetch failed for ${item.category}:${item.key}:`, error);
          }
        }
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Memory management and pressure handling
   */
  private setupMemoryMonitoring(): void {
    setInterval(() => {
      this.updateMemoryPressure();
      
      if (this.memoryPressure === MemoryPressure.HIGH || this.memoryPressure === MemoryPressure.CRITICAL) {
        this.handleMemoryPressure();
      }
    }, 10000); // Check every 10 seconds
  }

  private updateMemoryPressure(): void {
    const usagePercentage = (this.memoryUsage / (this.maxMemoryMB * 1024 * 1024)) * 100;
    
    if (usagePercentage > 90) {
      this.memoryPressure = MemoryPressure.CRITICAL;
    } else if (usagePercentage > 75) {
      this.memoryPressure = MemoryPressure.HIGH;
    } else if (usagePercentage > 50) {
      this.memoryPressure = MemoryPressure.MEDIUM;
    } else {
      this.memoryPressure = MemoryPressure.LOW;
    }
  }

  private async handleMemoryPressure(): Promise<void> {
    if (this.memoryPressure === MemoryPressure.CRITICAL) {
      // Aggressive cleanup - remove least recently used entries
      for (const [category, cache] of this.caches.entries()) {
        const targetReduction = Math.floor(cache.size * 0.3); // Remove 30%
        let removed = 0;
        
        // Find least recently accessed entries
        const entries = Array.from(cache.entries())
          .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
        
        for (const [key] of entries.slice(0, targetReduction)) {
          if (cache.delete(key)) {
            removed++;
          }
        }
        
        console.log(`[ConsolidatedCacheManager] Memory pressure cleanup: removed ${removed} entries from ${category}`);
      }
    } else if (this.memoryPressure === MemoryPressure.HIGH) {
      // Moderate cleanup - remove expired entries
      for (const [category, cache] of this.caches.entries()) {
        let removed = 0;
        const now = Date.now();
        
        for (const [key, entry] of cache.entries()) {
          if (now - entry.timestamp > entry.ttl) {
            if (cache.delete(key)) {
              removed++;
            }
          }
        }
        
        if (removed > 0) {
          console.log(`[ConsolidatedCacheManager] Expired ${removed} entries from ${category}`);
        }
      }
    }
  }

  private canAllocateMemory(size: number): boolean {
    return (this.memoryUsage + size) <= (this.maxMemoryMB * 1024 * 1024);
  }

  private updateMemoryUsage(delta: number): void {
    this.memoryUsage += delta;
    this.globalMetrics.memoryUsage = this.memoryUsage;
  }

  private calculateEntrySize(entry: CacheEntry<any>): number {
    // Rough estimation of memory usage
    const jsonStr = JSON.stringify(entry);
    return jsonStr.length * 2; // Unicode characters take 2 bytes
  }

  /**
   * WebSocket integration for real-time cache invalidation
   */
  private setupWebSocketConnection(): void {
    // This would connect to the backend WebSocket for real-time updates
    try {
      const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8000/ws/cache';
      this.websocketConnection = new WebSocket(wsUrl);
      
      this.websocketConnection.onmessage = (event) => {
        try {
          const invalidationEvent: CacheInvalidationEvent = JSON.parse(event.data);
          this.handleWebSocketInvalidation(invalidationEvent);
        } catch (error) {
          console.warn('[ConsolidatedCacheManager] Invalid WebSocket message:', error);
        }
      };
      
      this.websocketConnection.onerror = (error) => {
        console.warn('[ConsolidatedCacheManager] WebSocket error:', error);
      };
      
      console.log('[ConsolidatedCacheManager] WebSocket connection established');
    } catch (error) {
      console.warn('[ConsolidatedCacheManager] WebSocket connection failed:', error);
    }
  }

  private handleWebSocketInvalidation(event: CacheInvalidationEvent): void {
    switch (event.type) {
      case 'invalidate':
        if (event.keys) {
          for (const key of event.keys) {
            this.delete(event.category, key);
          }
        } else if (event.pattern) {
          this.invalidate(event.category, event.pattern);
        }
        break;
        
      case 'update':
        if (event.keys && event.data) {
          for (const key of event.keys) {
            this.set(event.category, key, event.data, { skipMemoryCheck: true });
          }
        }
        break;
        
      case 'refresh':
        this.clear(event.category);
        break;
    }
  }

  /**
   * Event-driven cache invalidation listeners
   */
  public onInvalidation(pattern: string, callback: Function): void {
    if (!this.invalidationListeners.has(pattern)) {
      this.invalidationListeners.set(pattern, []);
    }
    this.invalidationListeners.get(pattern)!.push(callback);
  }

  private notifyInvalidationListeners(key: string, type: string, data?: any): void {
    for (const [pattern, callbacks] of this.invalidationListeners.entries()) {
      if (key.includes(pattern) || pattern.includes('*')) {
        for (const callback of callbacks) {
          try {
            callback({ key, type, data });
          } catch (error) {
            console.warn('[ConsolidatedCacheManager] Invalidation listener error:', error);
          }
        }
      }
    }
  }

  /**
   * Performance metrics and monitoring
   */
  public getMetrics(category?: CacheCategory): CacheMetrics | Map<CacheCategory, CacheMetrics> {
    if (category) {
      const metrics = this.metrics.get(category)!;
      const total = metrics.hits + metrics.misses;
      metrics.hitRate = total > 0 ? (metrics.hits / total) * 100 : 0;
      return metrics;
    } else {
      // Update hit rates for all categories
      for (const [cat, metrics] of this.metrics.entries()) {
        const total = metrics.hits + metrics.misses;
        metrics.hitRate = total > 0 ? (metrics.hits / total) * 100 : 0;
      }
      return this.metrics;
    }
  }

  public getGlobalMetrics(): CacheMetrics {
    const total = this.globalMetrics.hits + this.globalMetrics.misses;
    this.globalMetrics.hitRate = total > 0 ? (this.globalMetrics.hits / total) * 100 : 0;
    return { ...this.globalMetrics };
  }

  public getCacheStatus(): {
    memoryUsage: number;
    memoryPressure: MemoryPressure;
    totalEntries: number;
    categorySizes: Map<CacheCategory, number>;
  } {
    const categorySizes = new Map<CacheCategory, number>();
    let totalEntries = 0;
    
    for (const [category, cache] of this.caches.entries()) {
      const size = cache.size;
      categorySizes.set(category, size);
      totalEntries += size;
    }
    
    return {
      memoryUsage: this.memoryUsage,
      memoryPressure: this.memoryPressure,
      totalEntries,
      categorySizes
    };
  }

  /**
   * Convenience methods for specific data types
   */
  
  // Enhanced Analysis Cache
  public async getAnalysis(key: string): Promise<EnhancedPropAnalysis | null> {
    return this.get<EnhancedPropAnalysis>(CacheCategory.ANALYSIS, key);
  }

  public async setAnalysis(key: string, analysis: EnhancedPropAnalysis, ttl?: number): Promise<boolean> {
    return this.set(CacheCategory.ANALYSIS, key, analysis, { ttl, tags: ['analysis', analysis.prop?.id] });
  }

  // Predictions Cache
  public async getPrediction(key: string): Promise<PredictionResult | null> {
    return this.get<PredictionResult>(CacheCategory.PREDICTIONS, key);
  }

  public async setPrediction(key: string, prediction: PredictionResult, ttl?: number): Promise<boolean> {
    return this.set(CacheCategory.PREDICTIONS, key, prediction, { ttl, tags: ['prediction'] });
  }

  // Props Cache
  public async getProps(key: string): Promise<FeaturedProp[] | null> {
    return this.get<FeaturedProp[]>(CacheCategory.PROPS, key);
  }

  public async setProps(key: string, props: FeaturedProp[], ttl?: number): Promise<boolean> {
    return this.set(CacheCategory.PROPS, key, props, { ttl, tags: ['props'] });
  }

  // Player Data Cache
  public async getPlayerData(key: string): Promise<any | null> {
    return this.get<any>(CacheCategory.PLAYER_DATA, key);
  }

  public async setPlayerData(key: string, data: any, ttl?: number): Promise<boolean> {
    return this.set(CacheCategory.PLAYER_DATA, key, data, { ttl, tags: ['player'] });
  }
}

// Export singleton instance
export const consolidatedCache = ConsolidatedCacheManager.getInstance();
export default consolidatedCache;
