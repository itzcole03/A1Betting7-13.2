/**
 * UnifiedDataService Extensions Tests
 * Tests for enhanced functionality: deduplication, metrics, stale-while-revalidate, etc.
 * These tests complement the existing tests without modifying original behavior.
 */

import { UnifiedDataService } from '../UnifiedDataService';
import { UnifiedServiceRegistry } from '../UnifiedServiceRegistry';
import { UnifiedCache } from '../UnifiedCache';

// Mock dependencies
jest.mock('../UnifiedServiceRegistry');
jest.mock('../UnifiedCache');

describe('UnifiedDataService Extensions', () => {
  let dataService: UnifiedDataService;
  let mockCache: jest.Mocked<UnifiedCache>;
  let mockRegistry: jest.Mocked<UnifiedServiceRegistry>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset singleton for clean test state
    UnifiedDataService.resetForTests();
    
    // Mock cache instance
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      getKeys: jest.fn(),
    } as any;

    // Mock registry instance
    mockRegistry = {
      register: jest.fn(),
      get: jest.fn(),
      healthCheck: jest.fn(),
    } as any;

    // Mock static methods
    (UnifiedCache.getInstance as jest.Mock).mockReturnValue(mockCache);
    (UnifiedServiceRegistry.getInstance as jest.Mock).mockReturnValue(mockRegistry);

    // Get fresh service instance
    dataService = UnifiedDataService.getInstance();
    
    // Mock the HTTP client methods
    dataService.api = {
      get: jest.fn().mockResolvedValue({ data: { success: true } }),
      post: jest.fn().mockResolvedValue({ data: { results: [] } }),
    };

    dataService.logger = {
      error: jest.fn(),
      info: jest.fn(),
    };
  });

  describe('In-Flight Request Deduplication', () => {
    test('should deduplicate concurrent fetchSportsData calls', async () => {
      mockCache.get.mockReturnValue(null);
      const apiData = { teams: ['Team A', 'Team B'] };
      (dataService.api.get as jest.Mock).mockResolvedValue({ data: apiData });

      // Make two concurrent calls for the same data
      const promise1 = dataService.fetchSportsData('mlb');
      const promise2 = dataService.fetchSportsData('mlb');

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Both should return the same result
      expect(result1).toEqual(apiData);
      expect(result2).toEqual(apiData);
      
      // API should only be called once due to deduplication
      expect(dataService.api.get).toHaveBeenCalledTimes(1);
      
      // Logger should indicate reuse
      expect(dataService.logger.info).toHaveBeenCalledWith(expect.stringContaining('inFlight reuse'));
    });

    test('should deduplicate mixed method calls with same cache key', async () => {
      mockCache.get.mockReturnValue(null);
      const apiData = { teams: ['Team A'] };
      (dataService.api.get as jest.Mock).mockResolvedValue({ data: apiData });

      // Two calls for same sport data
      const promise1 = dataService.fetchSportsData('nfl', '2024-01-01');
      const promise2 = dataService.fetchSportsData('nfl', '2024-01-01');

      await Promise.all([promise1, promise2]);

      expect(dataService.api.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Metrics Tracking', () => {
    test('should track cache hits correctly', async () => {
      const cachedData = { teams: ['Cached Team'] };
      mockCache.get.mockReturnValue(cachedData);

      await dataService.fetchSportsData('mlb');

      const metrics = dataService.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(0);
      expect(metrics.network).toBe(0);
    });

    test('should track cache misses and network calls', async () => {
      mockCache.get.mockReturnValue(null);
      const apiData = { teams: ['Team A'] };
      (dataService.api.get as jest.Mock).mockResolvedValue({ data: apiData });

      await dataService.fetchSportsData('mlb');

      const metrics = dataService.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(1);
      expect(metrics.network).toBe(1);
    });

    test('should track errors correctly', async () => {
      mockCache.get.mockReturnValue(null);
      const error = new Error('API Error');
      (dataService.api.get as jest.Mock).mockRejectedValue(error);

      try {
        await dataService.fetchSportsData('mlb');
      } catch {
        // Expected error
      }

      const metrics = dataService.getMetrics();
      expect(metrics.errors).toBe(1);
    });

    test('should return shallow copy of metrics', () => {
      const metrics1 = dataService.getMetrics();
      const metrics2 = dataService.getMetrics();
      
      expect(metrics1).not.toBe(metrics2); // Different objects
      expect(metrics1).toEqual(metrics2); // Same values
    });
  });

  describe('Stale While Revalidate', () => {
    test('should serve stale data when allowStale is true and network fails', async () => {
      const staleData = { teams: ['Stale Team'] };
      
      // First return stale data, then null to simulate expired cache
      mockCache.get.mockReturnValueOnce(staleData).mockReturnValueOnce(null);
      
      const error = new Error('Network Error');
      (dataService.api.post as jest.Mock).mockRejectedValue(error);

      const result = await dataService.searchData('test', {}, { allowStale: true });

      expect(result).toEqual(staleData);
      
      const metrics = dataService.getMetrics();
      expect(metrics.staleServed).toBe(1);
      expect(metrics.errors).toBe(1);
    });

    test('should throw error when stale not allowed and network fails', async () => {
      mockCache.get.mockReturnValue(null);
      const error = new Error('Network Error');
      (dataService.api.post as jest.Mock).mockRejectedValue(error);

      await expect(dataService.searchData('test', {}, { allowStale: false }))
        .rejects.toThrow('Network Error');
    });
  });

  describe('Enhanced Search Options', () => {
    test('should force refresh when forceRefresh is true', async () => {
      const cachedData = { results: ['Cached'] };
      const freshData = { results: ['Fresh'] };
      
      mockCache.get.mockReturnValue(cachedData);
      (dataService.api.post as jest.Mock).mockResolvedValue({ data: freshData });

      const result = await dataService.searchData('test', {}, { forceRefresh: true });

      expect(result).toEqual(freshData);
      expect(dataService.api.post).toHaveBeenCalled();
      // Cache should be updated with fresh data
      expect(mockCache.set).toHaveBeenCalledWith(
        'search_test_{}',
        freshData,
        180000
      );
    });

    test('should use custom TTL when provided', async () => {
      mockCache.get.mockReturnValue(null);
      const apiData = { results: ['Test'] };
      (dataService.api.post as jest.Mock).mockResolvedValue({ data: apiData });

      const customTTL = 500000;
      await dataService.searchData('test', {}, { ttl: customTTL });

      expect(mockCache.set).toHaveBeenCalledWith(
        'search_test_{}',
        apiData,
        customTTL
      );
    });
  });

  describe('Prefix Invalidation', () => {
    test('should invalidate keys starting with prefix', () => {
      const keys = [
        'sports_data_mlb_today',
        'sports_data_nfl_today',
        'player_stats_123_mlb',
        'team_data_456_nfl'
      ];
      mockCache.getKeys.mockReturnValue(keys);

      dataService.invalidatePrefix('sports_data');

      expect(mockCache.delete).toHaveBeenCalledWith('sports_data_mlb_today');
      expect(mockCache.delete).toHaveBeenCalledWith('sports_data_nfl_today');
      expect(mockCache.delete).not.toHaveBeenCalledWith('player_stats_123_mlb');
      expect(mockCache.delete).not.toHaveBeenCalledWith('team_data_456_nfl');
    });

    test('should handle empty key list gracefully', () => {
      mockCache.getKeys.mockReturnValue([]);

      expect(() => dataService.invalidatePrefix('sports_')).not.toThrow();
      expect(mockCache.delete).not.toHaveBeenCalled();
    });
  });

  describe('Cache Warming', () => {
    test('should prefetch sports data for multiple dates', async () => {
      mockCache.get.mockReturnValue(null); // No cached data
      const apiData = { teams: ['Team A'] };
      (dataService.api.get as jest.Mock).mockResolvedValue({ data: apiData });

      const dates = ['2024-01-01', '2024-01-02', '2024-01-03'];
      await dataService.warmSportsData('mlb', dates);

      expect(dataService.api.get).toHaveBeenCalledTimes(3);
      expect(dataService.api.get).toHaveBeenCalledWith('/api/sports/mlb');
    });

    test('should skip already cached dates', async () => {
      const cachedData = { teams: ['Cached'] };
      
      // Mock cache to return data for first date, null for others
      mockCache.get
        .mockReturnValueOnce(cachedData)  // First date cached
        .mockReturnValueOnce(null)       // Second date not cached
        .mockReturnValueOnce(null);      // Third date not cached

      (dataService.api.get as jest.Mock).mockResolvedValue({ data: { teams: ['Fresh'] } });

      const dates = ['2024-01-01', '2024-01-02', '2024-01-03'];
      await dataService.warmSportsData('mlb', dates);

      // Should only make 2 API calls (skipping the first cached date)
      expect(dataService.api.get).toHaveBeenCalledTimes(2);
    });

    test('should continue warming on individual failures', async () => {
      mockCache.get.mockReturnValue(null);
      
      // First call fails, second succeeds
      (dataService.api.get as jest.Mock)
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({ data: { teams: ['Team'] } });

      const dates = ['2024-01-01', '2024-01-02'];
      await dataService.warmSportsData('mlb', dates);

      expect(dataService.api.get).toHaveBeenCalledTimes(2);
      expect(dataService.logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to warm cache'),
        expect.any(Error)
      );
    });
  });

  describe('Logging Enhancements', () => {
    test('should log cache hits', async () => {
      const cachedData = { teams: ['Cached'] };
      mockCache.get.mockReturnValue(cachedData);

      await dataService.fetchSportsData('mlb');

      expect(dataService.logger.info).toHaveBeenCalledWith(
        'cache hit (fresh): sports_data_mlb_today'
      );
    });

    test('should log network fetch operations', async () => {
      mockCache.get.mockReturnValue(null);
      (dataService.api.get as jest.Mock).mockResolvedValue({ data: { teams: [] } });

      await dataService.fetchSportsData('mlb');

      expect(dataService.logger.info).toHaveBeenCalledWith(
        'network fetch start: sports_data_mlb_today'
      );
      expect(dataService.logger.info).toHaveBeenCalledWith(
        'network fetch success: sports_data_mlb_today'
      );
    });
  });

  describe('Background Revalidation', () => {
    test('should not block response during background operations', async () => {
      mockCache.get.mockReturnValue(null);
      
      let resolveApiCall: ((value: any) => void) | undefined;
      const apiPromise = new Promise(resolve => {
        resolveApiCall = resolve;
      });
      
      (dataService.api.get as jest.Mock).mockReturnValue(apiPromise);

      const fetchPromise = dataService.fetchSportsData('mlb');
      
      // Resolve API call
      resolveApiCall!({ data: { teams: ['Team A'] } });
      
      const result = await fetchPromise;
      expect(result).toEqual({ teams: ['Team A'] });
      
      // Should complete without hanging
      expect(result).toBeDefined();
    });
  });
});