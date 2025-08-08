/**
 * ConsolidatedCacheManager - Unified Frontend Caching Solution
 * 
 * Consolidates all fragmented frontend caching services into a single,
 * efficient cache manager with LRU policies, memory pressure management,
 * and real-time WebSocket invalidation.
 */

import { EventEmitter } from 'events';

// Cache Configuration
export interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  enablePersistence?: boolean;
  compression?: boolean;
}

// Cache Entry Structure
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  size: number;
  lastAccessed: number;
}

// Cache Categories for Different Data Types
export enum CacheCategory {
  ANALYSIS = 'analysis',
  SPORTS_DATA = 'sports_data',
  USER_PREFERENCES = 'user_preferences',
  API_RESPONSES = 'api_responses',
  PREDICTIONS = 'predictions',
  REAL_TIME = 'real_time',
  STATIC_ASSETS = 'static_assets'
}

// Memory Pressure Levels
enum MemoryPressure {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Cache Statistics
interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  memoryUsage: number;
  entriesCount: number;
  hitRatio: number;
}

// LRU Cache Implementation for Each Category
class LRUCache<T = any> extends EventEmitter {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private accessOrder: string[] = [];
  private config: CacheConfig;
  private stats: CacheStats;

  constructor(config: CacheConfig) {
    super();
    this.config = config;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      memoryUsage: 0,
      entriesCount: 0,
      hitRatio: 0
    };

    // Auto-cleanup expired entries every 30 seconds
    setInterval(() => this.cleanupExpired(), 30000);
  }

  set(key: string, value: T, customTtl?: number): void {
    const ttl = customTtl || this.config.ttl;
    const size = this.calculateSize(value);
    const now = Date.now();

    // Check if we need to make space
    this.ensureCapacity(size);

    // Remove if already exists
    if (this.cache.has(key)) {
      this.remove(key);
    }

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: now,
      ttl,
      hits: 0,
      size,
      lastAccessed: now
    };

    this.cache.set(key, entry);
    this.accessOrder.push(key);
    this.updateStats();

    this.emit('set', { key, value, size });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    const now = Date.now();

    if (!entry) {
      this.stats.misses++;
      this.updateHitRatio();
      return null;
    }

    // Check if expired
    if (now - entry.timestamp > entry.ttl) {
      this.remove(key);
      this.stats.misses++;
      this.updateHitRatio();
      return null;
    }

    // Update access statistics
    entry.hits++;
    entry.lastAccessed = now;
    this.stats.hits++;

    // Move to end (most recently used)
    this.moveToEnd(key);
    this.updateHitRatio();

    return entry.data;
  }

  has(key: string): boolean {
    return this.cache.has(key) && !this.isExpired(key);
  }

  remove(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.removeFromAccessOrder(key);
    this.stats.memoryUsage -= entry.size;
    this.stats.entriesCount--;

    this.emit('remove', { key, entry });
    return true;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      memoryUsage: 0,
      entriesCount: 0,
      hitRatio: 0
    };
    this.emit('clear');
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  keys(): string[] {
    return Array.from(this.cache.keys()).filter(key => !this.isExpired(key));
  }

  size(): number {
    return this.cache.size;
  }

  private ensureCapacity(newEntrySize: number): void {
    const wouldExceedSize = this.stats.memoryUsage + newEntrySize > this.config.maxSize;
    
    if (wouldExceedSize) {
      this.evictLeastRecentlyUsed(newEntrySize);
    }
  }

  private evictLeastRecentlyUsed(requiredSpace: number): void {
    let freedSpace = 0;
    
    while (freedSpace < requiredSpace && this.accessOrder.length > 0) {
      const oldestKey = this.accessOrder[0];
      const entry = this.cache.get(oldestKey);
      
      if (entry) {
        freedSpace += entry.size;
        this.stats.evictions++;
      }
      
      this.remove(oldestKey);
    }
  }

  private cleanupExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.remove(key));
  }

  private isExpired(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;

    const now = Date.now();
    return now - entry.timestamp > entry.ttl;
  }

  private moveToEnd(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private calculateSize(value: any): number {
    if (typeof value === 'string') {
      return value.length * 2; // UTF-16 characters
    }
    
    try {
      return new Blob([JSON.stringify(value)]).size;
    } catch {
      return 1000; // Default fallback size
    }
  }

  private updateStats(): void {
    this.stats.memoryUsage = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0);
    this.stats.entriesCount = this.cache.size;
  }

  private updateHitRatio(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRatio = total > 0 ? this.stats.hits / total : 0;
  }
}

// Main Consolidated Cache Manager
export class ConsolidatedCacheManager extends EventEmitter {
  private caches: Map<CacheCategory, LRUCache> = new Map();
  private memoryPressureLevel: MemoryPressure = MemoryPressure.LOW;
  private totalMemoryLimit: number;
  private webSocketConnection?: WebSocket;
  private isInitialized: boolean = false;

  // Default configurations for each cache category
  private readonly defaultConfigs: Record<CacheCategory, CacheConfig> = {
    [CacheCategory.ANALYSIS]: {
      maxSize: 50 * 1024 * 1024, // 50MB
      ttl: 30 * 60 * 1000, // 30 minutes
      enablePersistence: true,
      compression: true
    },
    [CacheCategory.SPORTS_DATA]: {
      maxSize: 100 * 1024 * 1024, // 100MB
      ttl: 5 * 60 * 1000, // 5 minutes
      enablePersistence: false,
      compression: true
    },
    [CacheCategory.USER_PREFERENCES]: {
      maxSize: 5 * 1024 * 1024, // 5MB
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      enablePersistence: true,
      compression: false
    },
    [CacheCategory.API_RESPONSES]: {
      maxSize: 75 * 1024 * 1024, // 75MB
      ttl: 2 * 60 * 1000, // 2 minutes
      enablePersistence: false,
      compression: true
    },
    [CacheCategory.PREDICTIONS]: {
      maxSize: 25 * 1024 * 1024, // 25MB
      ttl: 10 * 60 * 1000, // 10 minutes
      enablePersistence: true,
      compression: true
    },
    [CacheCategory.REAL_TIME]: {
      maxSize: 30 * 1024 * 1024, // 30MB
      ttl: 30 * 1000, // 30 seconds
      enablePersistence: false,
      compression: false
    },
    [CacheCategory.STATIC_ASSETS]: {
      maxSize: 20 * 1024 * 1024, // 20MB
      ttl: 60 * 60 * 1000, // 1 hour
      enablePersistence: true,
      compression: false
    }
  };

  constructor(totalMemoryLimit: number = 300 * 1024 * 1024) { // 300MB default
    super();
    this.totalMemoryLimit = totalMemoryLimit;
    this.initialize();
  }

  private initialize(): void {
    // Initialize all cache categories
    Object.values(CacheCategory).forEach(category => {
      const config = this.defaultConfigs[category];
      const cache = new LRUCache(config);
      
      // Forward cache events
      cache.on('set', (data) => this.emit('cache-set', { category, ...data }));
      cache.on('remove', (data) => this.emit('cache-remove', { category, ...data }));
      cache.on('clear', () => this.emit('cache-clear', { category }));
      
      this.caches.set(category, cache);
    });

    // Set up memory pressure monitoring
    this.startMemoryPressureMonitoring();
    
    // Initialize WebSocket for real-time invalidation
    this.initializeWebSocket();
    
    this.isInitialized = true;
    this.emit('initialized');
  }

  // Core Cache Operations
  set<T>(category: CacheCategory, key: string, value: T, ttl?: number): void {
    if (!this.isInitialized) {
      throw new Error('ConsolidatedCacheManager not initialized');
    }

    const cache = this.caches.get(category);
    if (!cache) {
      throw new Error(`Cache category ${category} not found`);
    }

    // Apply memory pressure adjustments
    const adjustedTtl = this.adjustTtlForMemoryPressure(ttl || this.defaultConfigs[category].ttl);
    
    cache.set(key, value, adjustedTtl);
    this.checkMemoryPressure();
  }

  get<T>(category: CacheCategory, key: string): T | null {
    if (!this.isInitialized) {
      return null;
    }

    const cache = this.caches.get(category);
    if (!cache) {
      return null;
    }

    return cache.get(key);
  }

  has(category: CacheCategory, key: string): boolean {
    const cache = this.caches.get(category);
    return cache ? cache.has(key) : false;
  }

  remove(category: CacheCategory, key: string): boolean {
    const cache = this.caches.get(category);
    return cache ? cache.remove(key) : false;
  }

  clear(category?: CacheCategory): void {
    if (category) {
      const cache = this.caches.get(category);
      if (cache) {
        cache.clear();
      }
    } else {
      // Clear all caches
      this.caches.forEach(cache => cache.clear());
    }
  }

  // Advanced Cache Operations
  getMultiple<T>(category: CacheCategory, keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {};
    keys.forEach(key => {
      result[key] = this.get<T>(category, key);
    });
    return result;
  }

  setMultiple<T>(category: CacheCategory, entries: Record<string, T>, ttl?: number): void {
    Object.entries(entries).forEach(([key, value]) => {
      this.set(category, key, value, ttl);
    });
  }

  invalidatePattern(category: CacheCategory, pattern: RegExp): number {
    const cache = this.caches.get(category);
    if (!cache) return 0;

    const keysToRemove = cache.keys().filter(key => pattern.test(key));
    keysToRemove.forEach(key => cache.remove(key));
    
    return keysToRemove.length;
  }

  // Cache Statistics and Monitoring
  getStats(category?: CacheCategory): Record<string, CacheStats> | CacheStats {
    if (category) {
      const cache = this.caches.get(category);
      return cache ? cache.getStats() : {} as CacheStats;
    }

    const allStats: Record<string, CacheStats> = {};
    this.caches.forEach((cache, category) => {
      allStats[category] = cache.getStats();
    });
    
    return allStats;
  }

  getTotalMemoryUsage(): number {
    let total = 0;
    this.caches.forEach(cache => {
      total += cache.getStats().memoryUsage;
    });
    return total;
  }

  getMemoryPressureLevel(): MemoryPressure {
    return this.memoryPressureLevel;
  }

  // Memory Pressure Management
  private checkMemoryPressure(): void {
    const totalUsage = this.getTotalMemoryUsage();
    const usageRatio = totalUsage / this.totalMemoryLimit;

    let newPressureLevel: MemoryPressure;
    
    if (usageRatio > 0.9) {
      newPressureLevel = MemoryPressure.CRITICAL;
    } else if (usageRatio > 0.75) {
      newPressureLevel = MemoryPressure.HIGH;
    } else if (usageRatio > 0.5) {
      newPressureLevel = MemoryPressure.MEDIUM;
    } else {
      newPressureLevel = MemoryPressure.LOW;
    }

    if (newPressureLevel !== this.memoryPressureLevel) {
      this.memoryPressureLevel = newPressureLevel;
      this.handleMemoryPressureChange(newPressureLevel);
      this.emit('memory-pressure-change', { level: newPressureLevel, usage: totalUsage });
    }
  }

  private handleMemoryPressureChange(level: MemoryPressure): void {
    switch (level) {
      case MemoryPressure.CRITICAL:
        // Aggressive cleanup
        this.clear(CacheCategory.REAL_TIME);
        this.clear(CacheCategory.API_RESPONSES);
        break;
        
      case MemoryPressure.HIGH:
        // Clear short-lived caches
        this.clear(CacheCategory.REAL_TIME);
        break;
        
      case MemoryPressure.MEDIUM:
        // Reduce TTL for new entries
        break;
        
      case MemoryPressure.LOW:
        // Normal operation
        break;
    }
  }

  private adjustTtlForMemoryPressure(baseTtl: number): number {
    switch (this.memoryPressureLevel) {
      case MemoryPressure.CRITICAL:
        return baseTtl * 0.25; // Reduce TTL to 25%
      case MemoryPressure.HIGH:
        return baseTtl * 0.5;  // Reduce TTL to 50%
      case MemoryPressure.MEDIUM:
        return baseTtl * 0.75; // Reduce TTL to 75%
      default:
        return baseTtl;
    }
  }

  private startMemoryPressureMonitoring(): void {
    // Check memory pressure every 10 seconds
    setInterval(() => {
      this.checkMemoryPressure();
    }, 10000);
  }

  // WebSocket Integration for Real-time Cache Invalidation
  private initializeWebSocket(): void {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws/cache';
    
    try {
      this.webSocketConnection = new WebSocket(wsUrl);
      
      this.webSocketConnection.onopen = () => {
        this.emit('websocket-connected');
      };
      
      this.webSocketConnection.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.webSocketConnection.onclose = () => {
        this.emit('websocket-disconnected');
        // Attempt reconnection after 5 seconds
        setTimeout(() => this.initializeWebSocket(), 5000);
      };
      
      this.webSocketConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
    } catch (error) {
      console.warn('WebSocket initialization failed:', error);
    }
  }

  private handleWebSocketMessage(message: any): void {
    const { type, category, key, pattern } = message;
    
    switch (type) {
      case 'invalidate':
        if (category && key) {
          this.remove(category, key);
        }
        break;
        
      case 'invalidate-pattern':
        if (category && pattern) {
          this.invalidatePattern(category, new RegExp(pattern));
        }
        break;
        
      case 'clear':
        if (category) {
          this.clear(category);
        }
        break;
        
      case 'clear-all':
        this.clear();
        break;
    }
  }

  // Persistence Operations
  async persistCache(category: CacheCategory): Promise<void> {
    const cache = this.caches.get(category);
    const config = this.defaultConfigs[category];
    
    if (!cache || !config.enablePersistence) {
      return;
    }

    try {
      const cacheData = cache.keys().reduce((acc, key) => {
        const value = cache.get(key);
        if (value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      localStorage.setItem(`cache_${category}`, JSON.stringify(cacheData));
      this.emit('cache-persisted', { category });
    } catch (error) {
      console.error(`Failed to persist cache ${category}:`, error);
    }
  }

  async loadPersistedCache(category: CacheCategory): Promise<void> {
    const config = this.defaultConfigs[category];
    
    if (!config.enablePersistence) {
      return;
    }

    try {
      const persistedData = localStorage.getItem(`cache_${category}`);
      if (persistedData) {
        const cacheData = JSON.parse(persistedData);
        Object.entries(cacheData).forEach(([key, value]) => {
          this.set(category, key, value);
        });
        this.emit('cache-loaded', { category });
      }
    } catch (error) {
      console.error(`Failed to load persisted cache ${category}:`, error);
    }
  }

  // Utility Methods
  exportCacheData(category?: CacheCategory): any {
    if (category) {
      const cache = this.caches.get(category);
      if (!cache) return null;
      
      return cache.keys().reduce((acc, key) => {
        acc[key] = cache.get(key);
        return acc;
      }, {} as Record<string, any>);
    }

    const exportData: Record<string, any> = {};
    this.caches.forEach((cache, category) => {
      exportData[category] = this.exportCacheData(category);
    });
    
    return exportData;
  }

  importCacheData(data: any, category?: CacheCategory): void {
    if (category && data) {
      Object.entries(data).forEach(([key, value]) => {
        this.set(category, key, value);
      });
    } else if (data && typeof data === 'object') {
      Object.entries(data).forEach(([cat, categoryData]) => {
        if (Object.values(CacheCategory).includes(cat as CacheCategory)) {
          this.importCacheData(categoryData, cat as CacheCategory);
        }
      });
    }
  }

  // Cleanup and Destruction
  destroy(): void {
    // Close WebSocket connection
    if (this.webSocketConnection) {
      this.webSocketConnection.close();
    }

    // Clear all caches
    this.clear();

    // Remove all listeners
    this.removeAllListeners();

    this.isInitialized = false;
  }
}

// Singleton instance
let cacheManagerInstance: ConsolidatedCacheManager | null = null;

export const getCacheManager = (): ConsolidatedCacheManager => {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new ConsolidatedCacheManager();
  }
  return cacheManagerInstance;
};

// Convenience functions for common operations
export const cacheGet = <T>(category: CacheCategory, key: string): T | null => {
  return getCacheManager().get<T>(category, key);
};

export const cacheSet = <T>(category: CacheCategory, key: string, value: T, ttl?: number): void => {
  getCacheManager().set(category, key, value, ttl);
};

export const cacheRemove = (category: CacheCategory, key: string): boolean => {
  return getCacheManager().remove(category, key);
};

export const cacheClear = (category?: CacheCategory): void => {
  getCacheManager().clear(category);
};

export default ConsolidatedCacheManager;
