/**
 * UnifiedDataService Observability Tests
 * Tests for new observability methods and defensive behaviors
 */

import UnifiedDataService from '../UnifiedDataService';
import { UnifiedCache } from '../UnifiedCache';

// Mock UnifiedCache
jest.mock('../UnifiedCache', () => ({
  UnifiedCache: {
    getInstance: jest.fn()
  }
}));

// Mock UnifiedServiceRegistry
jest.mock('../UnifiedServiceRegistry', () => ({
  UnifiedServiceRegistry: {
    getInstance: jest.fn(() => ({}))
  }
}));

describe('UnifiedDataService Observability', () => {
  let service: UnifiedDataService;
  let mockCache: jest.Mocked<UnifiedCache>;
  let mockLogger: { info: jest.Mock; error: jest.Mock };
  let mockApi: { get: jest.Mock; post: jest.Mock };

  beforeEach(() => {
    // Reset singleton
    UnifiedDataService.resetForTests();
    
    // Create mock cache instance
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      getKeys: jest.fn(() => []),
      getSize: jest.fn(() => 0)
    } as any;

    // Mock cache getInstance to return our mock
    (UnifiedCache.getInstance as jest.Mock).mockReturnValue(mockCache);
    
    // Get service instance
    service = UnifiedDataService.getInstance();
    
    // Mock logger and API
    mockLogger = {
      info: jest.fn(),
      error: jest.fn()
    };
    mockApi = {
      get: jest.fn(),
      post: jest.fn()
    };
    
    service.logger = mockLogger;
    service.api = mockApi;
  });

  describe('resetMetrics', () => {
    test('should reset all metrics to zero', async () => {
      // First generate some metrics by using the service
      mockCache.get.mockReturnValue(null); // cache miss
      mockApi.get.mockResolvedValue({ data: { sport: 'football' } });
      
      await service.fetchSportsData('football');
      
      // Verify metrics were generated
      const initialMetrics = service.getMetrics();
      expect(initialMetrics.misses).toBeGreaterThan(0);
      expect(initialMetrics.network).toBeGreaterThan(0);
      
      // Reset metrics
      service.resetMetrics();
      
      // Verify all metrics are zero
      const resetMetrics = service.getMetrics();
      expect(resetMetrics.hits).toBe(0);
      expect(resetMetrics.misses).toBe(0);
      expect(resetMetrics.staleServed).toBe(0);
      expect(resetMetrics.network).toBe(0);
      expect(resetMetrics.errors).toBe(0);
    });
  });

  describe('getInFlightCount', () => {
    test('should reflect concurrent deduplication usage', async () => {
      // Initially no in-flight requests
      expect(service.getInFlightCount()).toBe(0);
      
      // Set up a delayed API response to keep request in-flight
      let resolvePromise!: (value: any) => void;
      const delayedPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      mockCache.get.mockReturnValue(null); // cache miss
      mockApi.get.mockReturnValue(delayedPromise);
      
      // Start first request (will be in-flight)
      const request1 = service.fetchSportsData('football');
      
      // Check in-flight count increased
      expect(service.getInFlightCount()).toBe(1);
      
      // Start second request for same key (should reuse in-flight)
      const request2 = service.fetchSportsData('football');
      
      // Still only 1 in-flight request due to deduplication
      expect(service.getInFlightCount()).toBe(1);
      
      // Resolve the delayed promise
      resolvePromise({ data: { sport: 'football' } });
      
      // Wait for both requests to complete
      const [result1, result2] = await Promise.all([request1, request2]);
      expect(result1).toEqual({ sport: 'football' });
      expect(result2).toEqual({ sport: 'football' });
      
      // In-flight count should be back to 0
      expect(service.getInFlightCount()).toBe(0);
    });
  });

  describe('debugSnapshot', () => {
    test('should return expected structural fields', () => {
      mockCache.getKeys.mockReturnValue(['key1', 'key2']);
      mockCache.getSize.mockReturnValue(5);
      
      const snapshot = service.debugSnapshot();
      
      expect(snapshot).toHaveProperty('keys');
      expect(snapshot).toHaveProperty('inFlight');
      expect(snapshot).toHaveProperty('metrics');
      expect(snapshot).toHaveProperty('memorySize');
      
      expect(snapshot.keys).toEqual(['key1', 'key2']);
      expect(snapshot.inFlight).toBe(0);
      expect(snapshot.memorySize).toBe(5);
      expect(snapshot.metrics).toHaveProperty('hits');
      expect(snapshot.metrics).toHaveProperty('misses');
      expect(snapshot.metrics).toHaveProperty('staleServed');
      expect(snapshot.metrics).toHaveProperty('network');
      expect(snapshot.metrics).toHaveProperty('errors');
    });
  });

  describe('revalidate failure path', () => {
    test('should log error with [revalidate] tag', async () => {
      const cachedData = { results: ['cached'] };
      
      // Set up cache hit to trigger revalidate path
      mockCache.get.mockReturnValue(cachedData);
      
      // Mock API to fail on background revalidation
      mockApi.get.mockRejectedValue(new Error('Network failure'));
      
      // We need to trigger the revalidate path directly through the internal method
      // Since searchData doesn't expose revalidate, we'll access the private method via any
      const serviceAny = service as any;
      
      const result = await serviceAny.getOrFetch({
        key: 'test-key',
        ttl: 180000,
        fetcher: () => mockApi.get('/test'),
        allowStale: true,
        revalidate: true
      });
      
      expect(result).toEqual(cachedData);
      
      // Wait a bit for background revalidation to attempt and fail
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Check that error was logged with [revalidate] tag
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('[revalidate]'),
        expect.any(Error)
      );
    });
  });

  describe('cache layer defensive error handling', () => {
    test('should increment errors metric when cache.set throws', async () => {
      mockCache.get.mockReturnValue(null); // cache miss
      mockCache.set.mockImplementation(() => {
        throw new Error('Cache set failed');
      });
      mockApi.get.mockResolvedValue({ data: { sport: 'football' } });
      
      const result = await service.fetchSportsData('football');
      
      expect(result).toEqual({ sport: 'football' });
      
      const metrics = service.getMetrics();
      expect(metrics.errors).toBeGreaterThan(0);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Cache set failed'),
        expect.any(Error)
      );
    });

    test('should increment errors metric when cache.get throws', async () => {
      mockCache.get.mockImplementation(() => {
        throw new Error('Cache get failed');
      });
      mockApi.get.mockResolvedValue({ data: { sport: 'football' } });
      
      const result = await service.fetchSportsData('football');
      
      expect(result).toEqual({ sport: 'football' });
      
      const metrics = service.getMetrics();
      expect(metrics.errors).toBeGreaterThan(0);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Cache get failed'),
        expect.any(Error)
      );
    });
  });

  describe('inFlight guard', () => {
    test('should log warning when inFlight map exceeds 100 entries', async () => {
      // Mock a scenario where we have many concurrent requests
      mockCache.get.mockReturnValue(null);
      
      // Create a delayed promise that we can control
      const resolvers: Array<(value: any) => void> = [];
      mockApi.get.mockImplementation(() => {
        return new Promise(resolve => {
          resolvers.push(resolve);
        });
      });
      
      // Access the private inFlight map to manually add entries for testing
      const serviceAny = service as any;
      
      // Manually populate inFlight map with 101 entries to exceed the limit
      for (let i = 0; i < 101; i++) {
        serviceAny.inFlight.set(`test-key-${i}`, Promise.resolve({ data: 'test' }));
      }
      
      // Now trigger getOrFetch which will check the size
      const fetchPromise = service.fetchSportsData('trigger-guard');
      
      // Should trigger the warning immediately
      expect(mockLogger.error).toHaveBeenCalledWith(
        'InFlight map size exceeded 100 entries',
        expect.any(Error)
      );
      
      // Clean up - resolve the API call
      resolvers.forEach(resolve => resolve({ data: { sport: 'test' } }));
      await fetchPromise;
      
      // Clear the inFlight map for cleanup
      serviceAny.inFlight.clear();
    });
  });
});