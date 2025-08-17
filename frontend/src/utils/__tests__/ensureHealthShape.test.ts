/**
 * Comprehensive tests for ensureHealthShape utility
 * Focus: Preventing cache_hit_rate runtime errors and ensuring type safety
 */

import { ensureHealthShape, SystemHealth } from '../ensureHealthShape';

describe('ensureHealthShape', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('Basic normalization', () => {
    it('should handle null/undefined input gracefully', () => {
      const result1 = ensureHealthShape(null);
      const result2 = ensureHealthShape(undefined);
      
      expect(result1.performance.cache_hit_rate).toBe(0);
      expect(result2.performance.cache_hit_rate).toBe(0);
      expect(result1.status).toBe('unknown');
      expect(result2.status).toBe('unknown');
    });

    it('should handle empty object input', () => {
      const result = ensureHealthShape({});
      
      expect(result.performance.cache_hit_rate).toBe(0);
      expect(result.services.api).toBe('unknown');
      expect(result.uptime_seconds).toBe(0);
    });

    it('should preserve valid existing data', () => {
      const input = {
        status: 'healthy',
        performance: { cache_hit_rate: 85.5 },
        services: { api: 'healthy', cache: 'healthy', database: 'healthy' },
        uptime_seconds: 3600
      };
      
      const result = ensureHealthShape(input);
      
      expect(result.status).toBe('healthy');
      expect(result.performance.cache_hit_rate).toBe(85.5);
      expect(result.services.api).toBe('healthy');
      expect(result.uptime_seconds).toBe(3600);
    });
  });

  describe('Field mapping (hit_rate → cache_hit_rate)', () => {
    it('should map hit_rate to cache_hit_rate', () => {
      const input = {
        performance: { hit_rate: 72.3 }
      };
      
      const result = ensureHealthShape(input);
      
      expect(result.performance.cache_hit_rate).toBe(72.3);
      expect((result.performance as any).hit_rate).toBeUndefined();
    });

    it('should prefer cache_hit_rate over hit_rate when both exist', () => {
      const input = {
        performance: { 
          hit_rate: 50.0,
          cache_hit_rate: 75.0 
        }
      };
      
      const result = ensureHealthShape(input);
      
      expect(result.performance.cache_hit_rate).toBe(75.0);
    });

    it('should map infrastructure.cache.hit_rate_percent to cache_hit_rate', () => {
      const input = {
        infrastructure: {
          cache: { hit_rate_percent: 88.7 }
        }
      };

      const result = ensureHealthShape(input);
      expect(result.performance.cache_hit_rate).toBe(88.7);
      expect(result.originFlags?.mappedHitRate).toBe(true);
    });

    it('should prefer performance.cache_hit_rate over infrastructure structure', () => {
      const input = {
        performance: { cache_hit_rate: 95.3 },
        infrastructure: {
          cache: { hit_rate_percent: 88.7 }
        }
      };

      const result = ensureHealthShape(input);
      expect(result.performance.cache_hit_rate).toBe(95.3);
      expect(result.originFlags?.mappedHitRate).toBe(false);
    });

    it('should log field mapping in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const input = {
        performance: { hit_rate: 80.0 }
      };
      
      ensureHealthShape(input);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[ensureHealthShape] Mapped hit_rate (80) to cache_hit_rate'
      );
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Type coercion', () => {
    it('should coerce string numbers to numeric values', () => {
      const input = {
        performance: { cache_hit_rate: '85.5' },
        uptime_seconds: '3600'
      };
      
      const result = ensureHealthShape(input);
      
      expect(result.performance.cache_hit_rate).toBe(85.5);
      expect(result.uptime_seconds).toBe(3600);
    });

    it('should handle invalid numeric strings gracefully', () => {
      const input = {
        performance: { cache_hit_rate: 'invalid' },
        uptime_seconds: 'not-a-number'
      };
      
      const result = ensureHealthShape(input);
      
      expect(result.performance.cache_hit_rate).toBe(0);
      expect(result.uptime_seconds).toBe(0);
    });

    it('should handle boolean values as numbers', () => {
      const input = {
        performance: { cache_hit_rate: true },
        uptime_seconds: false
      };
      
      const result = ensureHealthShape(input);
      
      expect(result.performance.cache_hit_rate).toBe(1);
      expect(result.uptime_seconds).toBe(0);
    });
  });

  describe('Nested object handling', () => {
    it('should handle missing services object', () => {
      const input = { status: 'healthy' };
      
      const result = ensureHealthShape(input);
      
      expect(result.services).toEqual({
        api: 'unknown',
        cache: 'unknown', 
        database: 'unknown'
      });
    });

    it('should handle partial services object', () => {
      const input = {
        services: { api: 'healthy' }
      };
      
      const result = ensureHealthShape(input);
      
      expect(result.services).toEqual({
        api: 'healthy',
        cache: 'unknown',
        database: 'unknown'
      });
    });

    it('should handle missing performance object', () => {
      const input = { status: 'healthy' };
      
      const result = ensureHealthShape(input);
      
      expect(result.performance).toEqual({
        cache_hit_rate: 0,
        cache_type: 'unknown'
      });
    });
  });

  describe('Status normalization', () => {
    it('should normalize boolean status values', () => {
      const result1 = ensureHealthShape({ status: true });
      const result2 = ensureHealthShape({ status: false });
      
      expect(result1.status).toBe('healthy');
      expect(result2.status).toBe('unhealthy');
    });

    it('should handle numeric status values', () => {
      const result1 = ensureHealthShape({ status: 1 });
      const result2 = ensureHealthShape({ status: 0 });
      
      expect(result1.status).toBe('healthy');
      expect(result2.status).toBe('unhealthy');
    });

    it('should preserve valid string status', () => {
      const validStatuses = ['healthy', 'unhealthy', 'degraded', 'unknown'];
      
      validStatuses.forEach(status => {
        const result = ensureHealthShape({ status });
        expect(result.status).toBe(status);
      });
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle API response with mixed types', () => {
      const apiResponse = {
        status: 'healthy',
        services: {
          api: true,
          cache: 'degraded',
          database: 1
        },
        performance: {
          hit_rate: '92.5',
          cache_type: null
        },
        uptime_seconds: '86400'
      };
      
      const result = ensureHealthShape(apiResponse);
      
      expect(result.status).toBe('healthy');
      expect(result.services.api).toBe('healthy');
      expect(result.services.cache).toBe('degraded');
      expect(result.services.database).toBe('healthy');
      expect(result.performance.cache_hit_rate).toBe(92.5);
      expect(result.performance.cache_type).toBe('unknown');
      expect(result.uptime_seconds).toBe(86400);
    });

    it('should handle completely malformed input', () => {
      const malformedInputs = [
        'not an object',
        123,
        true,
        [],
        { completely: { wrong: { structure: true } } }
      ];
      
      malformedInputs.forEach(input => {
        const result = ensureHealthShape(input);
        
        expect(result.status).toBe('unknown');
        expect(result.performance.cache_hit_rate).toBe(0);
        expect(result.services.api).toBe('unknown');
        expect(result.uptime_seconds).toBe(0);
      });
    });
  });

  describe('Type safety validation', () => {
    it('should return proper TypeScript types', () => {
      const result = ensureHealthShape({});
      
      // TypeScript compilation validates these types
      const status: string = result.status;
      const cacheHitRate: number = result.performance.cache_hit_rate;
      const apiStatus: string = result.services.api;
      const uptime: number = result.uptime_seconds;
      
      expect(typeof status).toBe('string');
      expect(typeof cacheHitRate).toBe('number');
      expect(typeof apiStatus).toBe('string');
      expect(typeof uptime).toBe('number');
    });

    it('should satisfy SystemHealth interface completely', () => {
      const result = ensureHealthShape({});
      
      // Validate interface compliance
      const systemHealth: SystemHealth = result;
      
      expect(systemHealth).toBeDefined();
      expect(systemHealth.status).toBeDefined();
      expect(systemHealth.services.api).toBeDefined();
      expect(systemHealth.services.cache).toBeDefined();
      expect(systemHealth.services.database).toBeDefined();
      expect(systemHealth.performance.cache_hit_rate).toBeDefined();
      expect(systemHealth.performance.cache_type).toBeDefined();
      expect(systemHealth.uptime_seconds).toBeDefined();
    });
  });

  describe('Performance edge cases', () => {
    it('should handle very large numbers', () => {
      const input = {
        performance: { cache_hit_rate: Number.MAX_SAFE_INTEGER },
        uptime_seconds: Number.MAX_SAFE_INTEGER
      };
      
      const result = ensureHealthShape(input);
      
      expect(result.performance.cache_hit_rate).toBe(Number.MAX_SAFE_INTEGER);
      expect(result.uptime_seconds).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle negative numbers', () => {
      const input = {
        performance: { cache_hit_rate: -50 },
        uptime_seconds: -1000
      };
      
      const result = ensureHealthShape(input);
      
      expect(result.performance.cache_hit_rate).toBe(-50);
      expect(result.uptime_seconds).toBe(-1000);
    });

    it('should handle Infinity and NaN', () => {
      const input = {
        performance: { cache_hit_rate: Infinity },
        uptime_seconds: NaN
      };
      
      const result = ensureHealthShape(input);
      
      expect(result.performance.cache_hit_rate).toBe(0); // NaN check converts Infinity to 0
      expect(result.uptime_seconds).toBe(0); // NaN check converts NaN to 0
    });
  });
});