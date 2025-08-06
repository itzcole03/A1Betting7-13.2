/**
 * Consolidated Cache Manager - A1Betting7-13.2
 * Unifies fragmented frontend caching services into a single, efficient system.
 * Replaces AnalysisCacheService, PredictionCacheService, UnifiedCache, and DataCache.
 */

import { enhancedLogger } from './EnhancedLogger';
import { PropAnalysisRequest, PropAnalysisResponse } from './PropAnalysisAggregator';
import { CachedPrediction } from './predictionCache';

// Unified cache entry interface
interface ConsolidatedCacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
  category: CacheCategory;
  tags: string[];
  quality: DataQuality;
  size: number; // For memory management
}

// Cache categories for organization
enum CacheCategory {
  ANALYSIS = 'analysis',
  PREDICTIONS = 'predictions',
  PROPS = 'props',
  METADATA = 'metadata',
  AI_EXPLANATIONS = 'ai_explanations',
  USER_DATA = 'user_data',
}

// Data quality levels for cache prioritization
enum DataQuality {
  EXCELLENT = 5,
  GOOD = 4,
  FAIR = 3,
  POOR = 2,
  STALE = 1,
}

// Memory management configuration
interface MemoryConfig {
  maxTotalSize: number; // Maximum total memory usage (bytes)
  maxEntriesPerCategory: number; // Maximum entries per category
  evictionThreshold: number; // Start eviction at this memory %
  compressionThreshold: number; // Compress entries larger than this
}

// Cache statistics
interface ConsolidatedCacheStats {
  totalEntries: number;
  totalMemoryUsage: number;
  hitRate: number;
  categoryStats: Record<
    CacheCategory,
    {
      entries: number;
      hits: number;
      misses: number;
      memoryUsage: number;
      avgAccessTime: number;
    }
  >;
  evictionEvents: number;
  compressionEvents: number;
  lastCleanup: Date;
}

// WebSocket events for real-time cache invalidation
interface CacheInvalidationEvent {
  type: 'invalidate' | 'refresh' | 'clear_category';
  category?: CacheCategory;
  keys?: string[];
  tags?: string[];
  reason: string;
  timestamp: number;
}

// Background task types
interface BackgroundTask {
  id: string;
  type: 'cleanup' | 'compression' | 'prefetch' | 'sync';
  priority: number;
  scheduled: number;
  retries: number;
}

/**
 * High-performance consolidated cache manager
 * Features:
 * - Multi-level caching (memory + localStorage + sessionStorage)
 * - Intelligent memory management with LRU eviction
 * - Real-time cache invalidation via WebSocket
 * - Background optimization tasks
 * - Compression for large entries
 * - Cache warming and prefetching
 */
export class ConsolidatedCacheManager {
  private static instance: ConsolidatedCacheManager;

  // Cache storage layers
  private memoryCache = new Map<string, ConsolidatedCacheEntry<any>>();
  private persistentKeys = new Set<string>(); // Keys to persist to localStorage

  // Memory management
  private config: MemoryConfig = {
    maxTotalSize: 50 * 1024 * 1024, // 50MB
    maxEntriesPerCategory: 1000,
    evictionThreshold: 0.8, // 80%
    compressionThreshold: 100 * 1024, // 100KB
  };

  // Statistics and monitoring
  private stats: ConsolidatedCacheStats = {
    totalEntries: 0,
    totalMemoryUsage: 0,
    hitRate: 0,
    categoryStats: {} as any,
    evictionEvents: 0,
    compressionEvents: 0,
    lastCleanup: new Date(),
  };

  // Background processing
  private backgroundTasks = new Map<string, BackgroundTask>();
  private taskQueue: BackgroundTask[] = [];
  private taskProcessor: NodeJS.Timeout | null = null;

  // WebSocket for real-time invalidation
  private websocket: WebSocket | null = null;
  private subscriptions = new Map<string, (event: CacheInvalidationEvent) => void>();

  // Performance tracking
  private accessTimes = new Map<CacheCategory, number[]>();
  private compressionMap = new Map<string, Uint8Array>(); // Compressed data

  private constructor() {
    this.initializeCacheCategories();
    this.startBackgroundProcessor();
    this.initializeWebSocket();

    // Setup periodic cleanup
    setInterval(() => this.performMaintenance(), 60000); // Every minute

    enhancedLogger.info(
      'ConsolidatedCacheManager',
      'init',
      'Cache manager initialized successfully'
    );
  }

  public static getInstance(): ConsolidatedCacheManager {
    if (!ConsolidatedCacheManager.instance) {
      ConsolidatedCacheManager.instance = new ConsolidatedCacheManager();
    }
    return ConsolidatedCacheManager.instance;
  }

  /**
   * Unified cache access method
   */
  async get<T>(category: CacheCategory, key: string): Promise<T | null> {
    const startTime = performance.now();
    const fullKey = this.generateCacheKey(category, key);

    try {
      // Check memory cache first
      const memoryEntry = this.memoryCache.get(fullKey);
      if (memoryEntry && !this.isExpired(memoryEntry)) {
        this.updateAccessStats(category, startTime, true);
        memoryEntry.accessCount++;
        memoryEntry.lastAccess = Date.now();

        // Check if data is compressed
        if (memoryEntry.data instanceof Uint8Array) {
          const decompressed = await this.decompress(memoryEntry.data);
          return JSON.parse(decompressed);
        }

        return memoryEntry.data;
      }

      // Check localStorage for persistent entries
      if (this.persistentKeys.has(fullKey)) {
        const persistentData = await this.getFromPersistentStorage(fullKey);
        if (persistentData) {
          // Restore to memory cache
          await this.restoreToMemoryCache(fullKey, persistentData, category);
          this.updateAccessStats(category, startTime, true);
          return persistentData;
        }
      }

      // Cache miss
      this.updateAccessStats(category, startTime, false);
      return null;
    } catch (error) {
      enhancedLogger.error(
        'ConsolidatedCacheManager',
        'get',
        `Cache retrieval error for ${fullKey}`,
        { error }
      );
      return null;
    }
  }

  /**
   * Unified cache storage method
   */
  async set<T>(
    category: CacheCategory,
    key: string,
    data: T,
    options: {
      ttl?: number;
      persistent?: boolean;
      tags?: string[];
      quality?: DataQuality;
      compress?: boolean;
    } = {}
  ): Promise<void> {
    const fullKey = this.generateCacheKey(category, key);
    const timestamp = Date.now();
    const ttl = options.ttl || this.getDefaultTTL(category);

    try {
      // Calculate data size
      const serializedData = JSON.stringify(data);
      const dataSize = new Blob([serializedData]).size;

      // Check if compression is needed
      let finalData: T | Uint8Array = data;
      if (options.compress || dataSize > this.config.compressionThreshold) {
        finalData = await this.compress(serializedData);
        this.stats.compressionEvents++;
      }

      // Create cache entry
      const entry: ConsolidatedCacheEntry<T | Uint8Array> = {
        data: finalData,
        timestamp,
        ttl,
        accessCount: 1,
        lastAccess: timestamp,
        category,
        tags: options.tags || [],
        quality: options.quality || DataQuality.GOOD,
        size: dataSize,
      };

      // Check memory constraints before adding
      await this.ensureMemoryCapacity(dataSize, category);

      // Store in memory cache
      this.memoryCache.set(fullKey, entry);

      // Mark for persistence if requested
      if (options.persistent) {
        this.persistentKeys.add(fullKey);
        await this.saveToPersistentStorage(fullKey, data, ttl);
      }

      // Update statistics
      this.updateStats();

      enhancedLogger.debug(
        'ConsolidatedCacheManager',
        'set',
        `Cached ${fullKey} with size ${dataSize} bytes`
      );
    } catch (error) {
      enhancedLogger.error(
        'ConsolidatedCacheManager',
        'set',
        `Cache storage error for ${fullKey}`,
        { error }
      );
    }
  }

  /**
   * Batch operations for improved performance
   */
  async mget<T>(category: CacheCategory, keys: string[]): Promise<(T | null)[]> {
    const promises = keys.map(key => this.get<T>(category, key));
    return Promise.all(promises);
  }

  async mset<T>(
    category: CacheCategory,
    entries: Array<{ key: string; data: T; options?: any }>
  ): Promise<void> {
    const promises = entries.map(entry => this.set(category, entry.key, entry.data, entry.options));
    await Promise.all(promises);
  }

  /**
   * Advanced cache invalidation
   */
  async invalidate(options: {
    category?: CacheCategory;
    keys?: string[];
    tags?: string[];
    olderThan?: number;
    quality?: DataQuality;
  }): Promise<number> {
    let invalidatedCount = 0;

    for (const [fullKey, entry] of this.memoryCache.entries()) {
      let shouldInvalidate = false;

      // Check category filter
      if (options.category && entry.category !== options.category) {
        continue;
      }

      // Check specific keys
      if (options.keys && !options.keys.some(key => fullKey.includes(key))) {
        continue;
      }

      // Check tags
      if (options.tags && !options.tags.some(tag => entry.tags.includes(tag))) {
        continue;
      }

      // Check age
      if (options.olderThan && Date.now() - entry.timestamp < options.olderThan) {
        continue;
      }

      // Check quality
      if (options.quality && entry.quality > options.quality) {
        continue;
      }

      // If we reach here, invalidate the entry
      this.memoryCache.delete(fullKey);
      this.persistentKeys.delete(fullKey);
      await this.removeFromPersistentStorage(fullKey);
      invalidatedCount++;
    }

    // Broadcast invalidation event
    this.broadcastInvalidation({
      type: 'invalidate',
      category: options.category,
      keys: options.keys,
      tags: options.tags,
      reason: 'Manual invalidation',
      timestamp: Date.now(),
    });

    this.updateStats();
    return invalidatedCount;
  }

  /**
   * Memory management and optimization
   */
  private async ensureMemoryCapacity(requiredSize: number, category: CacheCategory): Promise<void> {
    const currentMemory = this.stats.totalMemoryUsage;
    const maxMemory = this.config.maxTotalSize;

    // Check if we need to free memory
    if (currentMemory + requiredSize > maxMemory * this.config.evictionThreshold) {
      await this.evictLeastRecentlyUsed(requiredSize);
    }

    // Check category limits
    const categoryCount = this.getCategoryCount(category);
    if (categoryCount >= this.config.maxEntriesPerCategory) {
      await this.evictFromCategory(category, 1);
    }
  }

  private async evictLeastRecentlyUsed(targetBytes: number): Promise<void> {
    // Sort entries by access time and quality
    const entries = Array.from(this.memoryCache.entries())
      .map(([key, entry]) => ({ key, entry }))
      .sort((a, b) => {
        // Prioritize by quality first, then by access time
        const qualityDiff = a.entry.quality - b.entry.quality;
        if (qualityDiff !== 0) return qualityDiff;
        return a.entry.lastAccess - b.entry.lastAccess;
      });

    let freedBytes = 0;
    for (const { key, entry } of entries) {
      if (freedBytes >= targetBytes) break;

      this.memoryCache.delete(key);
      this.persistentKeys.delete(key);
      freedBytes += entry.size;
      this.stats.evictionEvents++;
    }

    enhancedLogger.debug(
      'ConsolidatedCacheManager',
      'eviction',
      `Evicted ${freedBytes} bytes from cache`
    );
  }

  private async evictFromCategory(category: CacheCategory, count: number): Promise<void> {
    const categoryEntries = Array.from(this.memoryCache.entries())
      .filter(([, entry]) => entry.category === category)
      .sort(([, a], [, b]) => a.lastAccess - b.lastAccess);

    for (let i = 0; i < Math.min(count, categoryEntries.length); i++) {
      const [key] = categoryEntries[i];
      this.memoryCache.delete(key);
      this.persistentKeys.delete(key);
    }
  }

  /**
   * Compression utilities
   */
  private async compress(data: string): Promise<Uint8Array> {
    try {
      // Use CompressionStream if available (modern browsers)
      if ('CompressionStream' in window) {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        writer.write(new TextEncoder().encode(data));
        writer.close();

        const chunks: Uint8Array[] = [];
        let result = await reader.read();
        while (!result.done) {
          chunks.push(result.value);
          result = await reader.read();
        }

        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const compressed = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          compressed.set(chunk, offset);
          offset += chunk.length;
        }

        return compressed;
      } else {
        // Fallback: simple compression using btoa (base64)
        const compressed = btoa(data);
        return new TextEncoder().encode(compressed);
      }
    } catch (error) {
      enhancedLogger.warn(
        'ConsolidatedCacheManager',
        'compression',
        'Compression failed, storing uncompressed',
        { error }
      );
      return new TextEncoder().encode(data);
    }
  }

  private async decompress(compressedData: Uint8Array): Promise<string> {
    try {
      // Use DecompressionStream if available
      if ('DecompressionStream' in window) {
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        writer.write(compressedData);
        writer.close();

        const chunks: Uint8Array[] = [];
        let result = await reader.read();
        while (!result.done) {
          chunks.push(result.value);
          result = await reader.read();
        }

        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const decompressed = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          decompressed.set(chunk, offset);
          offset += chunk.length;
        }

        return new TextDecoder().decode(decompressed);
      } else {
        // Fallback: base64 decompression
        const base64 = new TextDecoder().decode(compressedData);
        return atob(base64);
      }
    } catch (error) {
      enhancedLogger.error('ConsolidatedCacheManager', 'decompression', 'Decompression failed', {
        error,
      });
      throw error;
    }
  }

  /**
   * Persistent storage management
   */
  private async saveToPersistentStorage<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      const entry = {
        data,
        timestamp: Date.now(),
        ttl,
        version: '1.0',
      };

      const serialized = JSON.stringify(entry);

      // Try localStorage first, fallback to sessionStorage
      try {
        localStorage.setItem(`cache:${key}`, serialized);
      } catch (localStorageError) {
        sessionStorage.setItem(`cache:${key}`, serialized);
      }
    } catch (error) {
      enhancedLogger.warn('ConsolidatedCacheManager', 'persistence', `Failed to persist ${key}`, {
        error,
      });
    }
  }

  private async getFromPersistentStorage<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = `cache:${key}`;
      let serialized = localStorage.getItem(cacheKey);

      if (!serialized) {
        serialized = sessionStorage.getItem(cacheKey);
      }

      if (!serialized) return null;

      const entry = JSON.parse(serialized);
      const age = Date.now() - entry.timestamp;

      // Check if expired
      if (age > entry.ttl) {
        await this.removeFromPersistentStorage(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      enhancedLogger.warn(
        'ConsolidatedCacheManager',
        'persistence',
        `Failed to retrieve persistent data for ${key}`,
        { error }
      );
      return null;
    }
  }

  private async removeFromPersistentStorage(key: string): Promise<void> {
    const cacheKey = `cache:${key}`;
    localStorage.removeItem(cacheKey);
    sessionStorage.removeItem(cacheKey);
  }

  /**
   * WebSocket real-time invalidation
   */
  private initializeWebSocket(): void {
    try {
      const wsUrl = `ws://localhost:8000/ws/cache-invalidation`;
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onmessage = event => {
        try {
          const invalidationEvent: CacheInvalidationEvent = JSON.parse(event.data);
          this.handleInvalidationEvent(invalidationEvent);
        } catch (error) {
          enhancedLogger.warn(
            'ConsolidatedCacheManager',
            'websocket',
            'Invalid invalidation message',
            { error }
          );
        }
      };

      this.websocket.onclose = () => {
        // Reconnect after 5 seconds
        setTimeout(() => this.initializeWebSocket(), 5000);
      };
    } catch (error) {
      enhancedLogger.info(
        'ConsolidatedCacheManager',
        'websocket',
        'WebSocket not available, using polling fallback'
      );
    }
  }

  private handleInvalidationEvent(event: CacheInvalidationEvent): void {
    // Execute invalidation based on event
    this.invalidate({
      category: event.category,
      keys: event.keys,
      tags: event.tags,
    });

    // Notify subscribers
    for (const callback of this.subscriptions.values()) {
      try {
        callback(event);
      } catch (error) {
        enhancedLogger.warn(
          'ConsolidatedCacheManager',
          'invalidation',
          'Subscriber callback error',
          { error }
        );
      }
    }
  }

  private broadcastInvalidation(event: CacheInvalidationEvent): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(event));
    }
  }

  /**
   * Background maintenance tasks
   */
  private startBackgroundProcessor(): void {
    this.taskProcessor = setInterval(() => {
      this.processBackgroundTasks();
    }, 5000); // Every 5 seconds
  }

  private async processBackgroundTasks(): Promise<void> {
    const now = Date.now();
    const tasksToProcess = this.taskQueue
      .filter(task => task.scheduled <= now)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3); // Process up to 3 tasks at once

    for (const task of tasksToProcess) {
      try {
        await this.executeBackgroundTask(task);
        this.taskQueue = this.taskQueue.filter(t => t.id !== task.id);
      } catch (error) {
        task.retries++;
        if (task.retries < 3) {
          task.scheduled = now + task.retries * 10000; // Exponential backoff
        } else {
          this.taskQueue = this.taskQueue.filter(t => t.id !== task.id);
        }
      }
    }
  }

  private async executeBackgroundTask(task: BackgroundTask): Promise<void> {
    switch (task.type) {
      case 'cleanup':
        await this.performCleanup();
        break;
      case 'compression':
        await this.performCompression();
        break;
      case 'prefetch':
        await this.performPrefetch();
        break;
      case 'sync':
        await this.performSync();
        break;
    }
  }

  /**
   * Utility methods
   */
  private generateCacheKey(category: CacheCategory, key: string): string {
    return `${category}:${key}`;
  }

  private getDefaultTTL(category: CacheCategory): number {
    const ttlMap = {
      [CacheCategory.ANALYSIS]: 5 * 60 * 1000, // 5 minutes
      [CacheCategory.PREDICTIONS]: 10 * 60 * 1000, // 10 minutes
      [CacheCategory.PROPS]: 15 * 60 * 1000, // 15 minutes
      [CacheCategory.METADATA]: 60 * 60 * 1000, // 1 hour
      [CacheCategory.AI_EXPLANATIONS]: 30 * 60 * 1000, // 30 minutes
      [CacheCategory.USER_DATA]: 24 * 60 * 60 * 1000, // 24 hours
    };
    return ttlMap[category] || 10 * 60 * 1000;
  }

  private isExpired(entry: ConsolidatedCacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private getCategoryCount(category: CacheCategory): number {
    return Array.from(this.memoryCache.values()).filter(entry => entry.category === category)
      .length;
  }

  private initializeCacheCategories(): void {
    for (const category of Object.values(CacheCategory)) {
      this.stats.categoryStats[category] = {
        entries: 0,
        hits: 0,
        misses: 0,
        memoryUsage: 0,
        avgAccessTime: 0,
      };
      this.accessTimes.set(category, []);
    }
  }

  private updateAccessStats(category: CacheCategory, startTime: number, hit: boolean): void {
    const accessTime = performance.now() - startTime;
    const categoryStats = this.stats.categoryStats[category];

    if (hit) {
      categoryStats.hits++;
    } else {
      categoryStats.misses++;
    }

    // Update average access time (exponential moving average)
    const alpha = 0.1;
    categoryStats.avgAccessTime = alpha * accessTime + (1 - alpha) * categoryStats.avgAccessTime;

    // Update overall hit rate
    const totalHits = Object.values(this.stats.categoryStats).reduce(
      (sum, stats) => sum + stats.hits,
      0
    );
    const totalRequests = Object.values(this.stats.categoryStats).reduce(
      (sum, stats) => sum + stats.hits + stats.misses,
      0
    );
    this.stats.hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
  }

  private updateStats(): void {
    this.stats.totalEntries = this.memoryCache.size;
    this.stats.totalMemoryUsage = Array.from(this.memoryCache.values()).reduce(
      (sum, entry) => sum + entry.size,
      0
    );

    // Update category stats
    for (const category of Object.values(CacheCategory)) {
      const categoryEntries = Array.from(this.memoryCache.values()).filter(
        entry => entry.category === category
      );

      this.stats.categoryStats[category].entries = categoryEntries.length;
      this.stats.categoryStats[category].memoryUsage = categoryEntries.reduce(
        (sum, entry) => sum + entry.size,
        0
      );
    }
  }

  private async performMaintenance(): Promise<void> {
    await this.performCleanup();
    this.updateStats();
    this.stats.lastCleanup = new Date();
  }

  private async performCleanup(): Promise<void> {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
        this.persistentKeys.delete(key);
        await this.removeFromPersistentStorage(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      enhancedLogger.debug(
        'ConsolidatedCacheManager',
        'cleanup',
        `Cleaned ${cleanedCount} expired entries`
      );
    }
  }

  private async performCompression(): Promise<void> {
    // Compress large uncompressed entries
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.size > this.config.compressionThreshold && !(entry.data instanceof Uint8Array)) {
        try {
          const compressed = await this.compress(JSON.stringify(entry.data));
          entry.data = compressed;
          entry.size = compressed.length;
          this.stats.compressionEvents++;
        } catch (error) {
          enhancedLogger.warn(
            'ConsolidatedCacheManager',
            'compression',
            `Failed to compress ${key}`,
            { error }
          );
        }
      }
    }
  }

  private async performPrefetch(): Promise<void> {
    // Prefetch logic would go here
    // This could involve predicting what data will be needed next
    // and proactively fetching it
  }

  private async performSync(): Promise<void> {
    // Sync critical data to persistent storage
    for (const key of this.persistentKeys) {
      const entry = this.memoryCache.get(key);
      if (entry && !this.isExpired(entry)) {
        let data = entry.data;
        if (data instanceof Uint8Array) {
          data = JSON.parse(await this.decompress(data));
        }
        await this.saveToPersistentStorage(key, data, entry.ttl);
      }
    }
  }

  /**
   * Public API methods for backward compatibility
   */

  // AnalysisCacheService compatibility
  async getAnalysis(request: PropAnalysisRequest): Promise<PropAnalysisResponse | null> {
    const key = this.generateAnalysisKey(request);
    return this.get<PropAnalysisResponse>(CacheCategory.ANALYSIS, key);
  }

  async setAnalysis(
    request: PropAnalysisRequest,
    response: PropAnalysisResponse,
    ttl?: number
  ): Promise<void> {
    const key = this.generateAnalysisKey(request);
    await this.set(CacheCategory.ANALYSIS, key, response, { ttl, persistent: true });
  }

  private generateAnalysisKey(request: PropAnalysisRequest): string {
    const { propId, player, team, sport, statType, line } = request;
    return `analysis:${propId}:${player}:${team}:${sport}:${statType}:${line}`;
  }

  // PredictionCacheService compatibility
  async getPrediction(
    playerName: string,
    statType: string,
    line: number
  ): Promise<CachedPrediction | null> {
    const key = `${playerName}:${statType}:${line}`;
    return this.get<CachedPrediction>(CacheCategory.PREDICTIONS, key);
  }

  async setPrediction(prediction: CachedPrediction): Promise<void> {
    const key = `${prediction.player_name}:${prediction.stat_type}:${prediction.line}`;
    await this.set(CacheCategory.PREDICTIONS, key, prediction, {
      ttl: 10 * 60 * 1000, // 10 minutes
      persistent: true,
    });
  }

  // AI Explanation cache
  async getAiExplanation(propId: string): Promise<any | null> {
    return this.get(CacheCategory.AI_EXPLANATIONS, propId);
  }

  async setAiExplanation(propId: string, explanation: any): Promise<void> {
    await this.set(CacheCategory.AI_EXPLANATIONS, propId, explanation, {
      ttl: 30 * 60 * 1000, // 30 minutes
      persistent: true,
    });
  }

  /**
   * Advanced API methods
   */

  // Subscribe to cache invalidation events
  subscribe(id: string, callback: (event: CacheInvalidationEvent) => void): void {
    this.subscriptions.set(id, callback);
  }

  unsubscribe(id: string): void {
    this.subscriptions.delete(id);
  }

  // Get comprehensive statistics
  getStats(): ConsolidatedCacheStats {
    return { ...this.stats };
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    memoryUsage: number;
    hitRate: number;
    totalEntries: number;
    issues: string[];
  }> {
    const issues: string[] = [];

    // Check memory usage
    const memoryPercent = (this.stats.totalMemoryUsage / this.config.maxTotalSize) * 100;
    if (memoryPercent > 90) {
      issues.push('High memory usage');
    }

    // Check hit rate
    if (this.stats.hitRate < 50) {
      issues.push('Low cache hit rate');
    }

    // Check WebSocket connection
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      issues.push('WebSocket disconnected');
    }

    const status = issues.length === 0 ? 'healthy' : issues.length < 3 ? 'degraded' : 'unhealthy';

    return {
      status,
      memoryUsage: this.stats.totalMemoryUsage,
      hitRate: this.stats.hitRate,
      totalEntries: this.stats.totalEntries,
      issues,
    };
  }

  // Cleanup method for component unmounting
  async destroy(): Promise<void> {
    // Stop background processor
    if (this.taskProcessor) {
      clearInterval(this.taskProcessor);
    }

    // Close WebSocket
    if (this.websocket) {
      this.websocket.close();
    }

    // Sync critical data before shutdown
    await this.performSync();

    enhancedLogger.info('ConsolidatedCacheManager', 'destroy', 'Cache manager destroyed');
  }
}

// Export singleton instance and enums
export const consolidatedCache = ConsolidatedCacheManager.getInstance();
export { CacheCategory, DataQuality };

// Export convenience functions for common operations
export const cacheUtils = {
  // Quick analysis cache access
  getAnalysis: (request: PropAnalysisRequest) => consolidatedCache.getAnalysis(request),

  setAnalysis: (request: PropAnalysisRequest, response: PropAnalysisResponse, ttl?: number) =>
    consolidatedCache.setAnalysis(request, response, ttl),

  // Quick prediction cache access
  getPrediction: (playerName: string, statType: string, line: number) =>
    consolidatedCache.getPrediction(playerName, statType, line),

  setPrediction: (prediction: CachedPrediction) => consolidatedCache.setPrediction(prediction),

  // Quick AI explanation cache
  getAiExplanation: (propId: string) => consolidatedCache.getAiExplanation(propId),

  setAiExplanation: (propId: string, explanation: any) =>
    consolidatedCache.setAiExplanation(propId, explanation),

  // Cache invalidation
  invalidateAnalysis: () => consolidatedCache.invalidate({ category: CacheCategory.ANALYSIS }),

  invalidatePredictions: () =>
    consolidatedCache.invalidate({ category: CacheCategory.PREDICTIONS }),

  invalidateStaleData: () => consolidatedCache.invalidate({ quality: DataQuality.STALE }),

  // Health check
  healthCheck: () => consolidatedCache.healthCheck(),
};
