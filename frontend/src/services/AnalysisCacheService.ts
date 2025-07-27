import { PropAnalysisRequest, PropAnalysisResponse } from './PropAnalysisAggregator';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  stale: number;
  evictions: number;
}

/**
 * Multi-level caching service for prop analysis results
 * Implements memory cache with TTL and optional localStorage persistence
 */
export class AnalysisCacheService {
  private static instance: AnalysisCacheService;
  private memoryCache: Map<string, CacheEntry<PropAnalysisResponse>>;
  private stats: CacheStats;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly STALE_TTL = 30 * 60 * 1000; // 30 minutes
  
  private constructor() {
    this.memoryCache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      stale: 0,
      evictions: 0
    };
    
    // Run cache cleanup every minute
    setInterval(() => this.cleanupExpiredEntries(), 60 * 1000);
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): AnalysisCacheService {
    if (!AnalysisCacheService.instance) {
      AnalysisCacheService.instance = new AnalysisCacheService();
    }
    return AnalysisCacheService.instance;
  }
  
  /**
   * Generate a cache key from a request
   */
  public static generateCacheKey(request: PropAnalysisRequest): string {
    const { propId, player, team, sport, statType, line } = request;
    return `prop_analysis:${propId}:${player}:${team}:${sport}:${statType}:${line}`;
  }
  
  /**
   * Get an item from cache
   * Returns null if not found or expired
   * Returns the item with isStale=true if it's stale but not fully expired
   */
  public get(key: string): PropAnalysisResponse | null {
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return this.getFromLocalStorage(key);
    }
    
    const now = Date.now();
    const age = now - entry.timestamp;
    
    // If fully expired
    if (age > entry.ttl + this.STALE_TTL) {
      this.memoryCache.delete(key);
      this.stats.misses++;
      return this.getFromLocalStorage(key);
    }
    
    // If stale but not fully expired
    if (age > entry.ttl) {
      this.stats.stale++;
      return {
        ...entry.value,
        isStale: true
      };
    }
    
    // Fresh hit
    this.stats.hits++;
    return entry.value;
  }
  
  /**
   * Set an item in cache
   */
  public set(key: string, value: PropAnalysisResponse, options?: { ttl?: number }): void {
    const ttl = options?.ttl || this.DEFAULT_TTL;
    
    this.memoryCache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
    
    // Also store in localStorage if available
    this.setInLocalStorage(key, value, ttl);
  }
  
  /**
   * Check if an item exists in cache and is not expired
   */
  public has(key: string): boolean {
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      return this.hasInLocalStorage(key);
    }
    
    const now = Date.now();
    return now - entry.timestamp <= entry.ttl;
  }
  
  /**
   * Delete an item from cache
   */
  public delete(key: string): void {
    this.memoryCache.delete(key);
    this.deleteFromLocalStorage(key);
  }
  
  /**
   * Clear the entire cache
   */
  public clear(): void {
    this.memoryCache.clear();
    this.clearLocalStorage();
  }
  
  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    return { ...this.stats };
  }
  
  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let evictionCount = 0;
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl + this.STALE_TTL) {
        this.memoryCache.delete(key);
        evictionCount++;
      }
    }
    
    if (evictionCount > 0) {
      this.stats.evictions += evictionCount;
    }
  }
  
  /**
   * Get an item from localStorage
   */
  private getFromLocalStorage(key: string): PropAnalysisResponse | null {
    try {
      if (typeof localStorage === 'undefined') return null;
      
      const storedItem = localStorage.getItem(`cache:${key}`);
      if (!storedItem) return null;
      
      const entry = JSON.parse(storedItem) as CacheEntry<PropAnalysisResponse>;
      const now = Date.now();
      const age = now - entry.timestamp;
      
      // If fully expired
      if (age > entry.ttl + this.STALE_TTL) {
        localStorage.removeItem(`cache:${key}`);
        return null;
      }
      
      // If stale but not fully expired
      if (age > entry.ttl) {
        this.stats.stale++;
        return {
          ...entry.value,
          isStale: true
        };
      }
      
      // Fresh hit from localStorage
      this.stats.hits++;
      
      // Also add to memory cache for faster access next time
      this.memoryCache.set(key, entry);
      
      return entry.value;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }
  
  /**
   * Set an item in localStorage
   */
  private setInLocalStorage(key: string, value: PropAnalysisResponse, ttl: number): void {
    try {
      if (typeof localStorage === 'undefined') return;
      
      const entry: CacheEntry<PropAnalysisResponse> = {
        value,
        timestamp: Date.now(),
        ttl
      };
      
      localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }
  
  /**
   * Check if an item exists in localStorage and is not expired
   */
  private hasInLocalStorage(key: string): boolean {
    try {
      if (typeof localStorage === 'undefined') return false;
      
      const storedItem = localStorage.getItem(`cache:${key}`);
      if (!storedItem) return false;
      
      const entry = JSON.parse(storedItem) as CacheEntry<PropAnalysisResponse>;
      const now = Date.now();
      return now - entry.timestamp <= entry.ttl;
    } catch (error) {
      console.error('Error checking localStorage:', error);
      return false;
    }
  }
  
  /**
   * Delete an item from localStorage
   */
  private deleteFromLocalStorage(key: string): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.removeItem(`cache:${key}`);
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
    }
  }
  
  /**
   * Clear all cache items from localStorage
   */
  private clearLocalStorage(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache:prop_analysis:')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing localStorage cache:', error);
    }
  }
}