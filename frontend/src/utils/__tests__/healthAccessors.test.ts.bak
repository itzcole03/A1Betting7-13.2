/**
 * Regression tests for hit_rate runtime error fixes
 * Ensures unified accessors handle various hit_rate data structures safely
 */

import { getCacheHitRate, hasPerformanceSection, safeIterateCacheMetrics, debugHealthStructure, getCacheType } from '../healthAccessors';
import { ensureHealthShape } from '../ensureHealthShape';

// Suppress console warnings during tests and mock NODE_ENV
let consoleWarnSpy: jest.SpyInstance;
const originalNodeEnv = process.env.NODE_ENV;

beforeEach(() => {
  consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  // Set NODE_ENV to development for warning tests
  process.env.NODE_ENV = 'development';
});

afterEach(() => {
  consoleWarnSpy.mockRestore();
  process.env.NODE_ENV = originalNodeEnv;
});

describe('getCacheHitRate', () => {
  describe('Priority 1: Canonical cache_hit_rate', () => {
    it('should return cache_hit_rate when present', () => {
      const health = {
        performance: { cache_hit_rate: 85.5 },
      };
      
      expect(getCacheHitRate(health)).toBe(85.5);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('Priority 2: Legacy performance.hit_rate', () => {
    it('should return performance.hit_rate and warn when cache_hit_rate missing', () => {
      const health = {
        performance: { hit_rate: 72.3 }
      };

      expect(getCacheHitRate(health)).toBe(72.3);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[HealthCompat] Using legacy performance.hit_rate, consider migrating to cache_hit_rate'
      );
    });

    it('should prefer cache_hit_rate over hit_rate when both exist', () => {
      const health = {
        performance: { 
          cache_hit_rate: 90.5, 
          hit_rate: 75.2 
        }
      };

      expect(getCacheHitRate(health)).toBe(90.5);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('Priority 3: Phase 3 infrastructure structure', () => {
    it('should return infrastructure.cache.hit_rate_percent and warn', () => {
      const health = {
        infrastructure: {
          cache: { hit_rate_percent: 88.7 }
        }
      };

      expect(getCacheHitRate(health)).toBe(88.7);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[HealthCompat] Using infrastructure.cache.hit_rate_percent, consider migrating to performance.cache_hit_rate'
      );
    });
  });

  describe('Priority 4: Metrics structure', () => {
    it('should return cache_performance.hit_rate', () => {
      const health = {
        cache_performance: { hit_rate: 92.1 }
      };

      expect(getCacheHitRate(health)).toBe(92.1);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('Priority 5: Flat legacy structure', () => {
    it('should return flat hit_rate and warn', () => {
      const health = {
        hit_rate: 78.9
      };

      expect(getCacheHitRate(health)).toBe(78.9);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[HealthCompat] Using flat hit_rate, consider migrating to performance.cache_hit_rate'
      );
    });
  });

  describe('Default cases', () => {
    it('should return 0 for null/undefined', () => {
      expect(getCacheHitRate(null)).toBe(0);
      expect(getCacheHitRate(undefined)).toBe(0);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should return 0 when no hit_rate fields present', () => {
      const health = {
        performance: { uptime: 3600 }
      };

      expect(getCacheHitRate(health)).toBe(0);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});

describe('hasPerformanceSection', () => {
  it('should return true for canonical performance section', () => {
    const health = { performance: { cache_hit_rate: 85 } };
    expect(hasPerformanceSection(health)).toBe(true);
  });

  it('should return true for infrastructure section', () => {
    const health = { infrastructure: { cache: { hit_rate_percent: 90 } } };
    expect(hasPerformanceSection(health)).toBe(true);
  });

  it('should return true for cache_performance section', () => {
    const health = { cache_performance: { hit_rate: 88 } };
    expect(hasPerformanceSection(health)).toBe(true);
  });

  it('should return true for flat hit_rate', () => {
    const health = { hit_rate: 75 };
    expect(hasPerformanceSection(health)).toBe(true);
  });

  it('should return false for empty objects', () => {
    expect(hasPerformanceSection({})).toBe(false);
    expect(hasPerformanceSection(null)).toBe(false);
    expect(hasPerformanceSection(undefined)).toBe(false);
  });
});

describe('safeIterateCacheMetrics', () => {
  it('should filter valid metrics and return mapped results', () => {
    const metrics = [
      { hit_rate: 85.5, type: 'memory' },
      { hit_rate: 92.1, type: 'redis' },
      { invalid: 'data' },
      null
    ];

    const result = safeIterateCacheMetrics(metrics, (m) => m.type);
    expect(result).toEqual(['memory', 'redis']);
  });

  it('should return empty array for null/undefined input', () => {
    expect(safeIterateCacheMetrics(null, (m) => m)).toEqual([]);
    expect(safeIterateCacheMetrics(undefined, (m) => m)).toEqual([]);
  });

  it('should return empty array for non-array input', () => {
    expect(safeIterateCacheMetrics('not-array', (m) => m)).toEqual([]);
    expect(safeIterateCacheMetrics({}, (m) => m)).toEqual([]);
  });
});

describe('Integration with ensureHealthShape', () => {
  it('should work with ensureHealthShape output', () => {
    const messyHealth = {
      performance: { hit_rate: 78.9 }
    };
    
    const normalizedHealth = ensureHealthShape(messyHealth);
    const result = getCacheHitRate(normalizedHealth);
    
    expect(result).toBe(78.9);
  });
});

describe('getCacheType', () => {
  it('should return performance.cache_type when present', () => {
    const health = {
      performance: { cache_type: 'Redis' }
    };
    
    expect(getCacheType(health)).toBe('Redis');
  });

  it('should return flat cache_type when performance missing', () => {
    const health = {
      cache_type: 'Memory'
    };
    
    expect(getCacheType(health)).toBe('Memory');
  });

  it('should prefer performance.cache_type over flat cache_type', () => {
    const health = {
      performance: { cache_type: 'Redis' },
      cache_type: 'Memory'
    };
    
    expect(getCacheType(health)).toBe('Redis');
  });

  it('should return "Unknown" for null/undefined', () => {
    expect(getCacheType(null)).toBe('Unknown');
    expect(getCacheType(undefined)).toBe('Unknown');
  });

  it('should return "Unknown" when no cache_type fields present', () => {
    const health = {
      performance: { cache_hit_rate: 85 }
    };
    
    expect(getCacheType(health)).toBe('Unknown');
  });
});