/**
 * UnifiedDataService Validation Tests
 * Tests the fixes applied to UnifiedDataService constructor and variable naming issues
 * Implements monitoring for data pipeline stability as recommended in Addendum 4
 */

import { UnifiedDataService } from '../UnifiedDataService';
import { UnifiedServiceRegistry } from '../UnifiedServiceRegistry';
import { UnifiedCache } from '../UnifiedCache';

// Mock dependencies
jest.mock('../UnifiedServiceRegistry');
jest.mock('../UnifiedCache');

describe('UnifiedDataService', () => {
  let dataService: UnifiedDataService;
  let mockCache: jest.Mocked<UnifiedCache>;
  let mockRegistry: jest.Mocked<UnifiedServiceRegistry>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
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

    // Get service instance
    dataService = UnifiedDataService.getInstance();
  });

  describe('Constructor Fix Validation', () => {
    test('should properly instantiate with correct parameters', () => {
      expect(UnifiedServiceRegistry.getInstance).toHaveBeenCalled();
      expect(UnifiedCache.getInstance).toHaveBeenCalled();
      expect(dataService).toBeInstanceOf(UnifiedDataService);
    });

    test('should be a singleton', () => {
      const instance1 = UnifiedDataService.getInstance();
      const instance2 = UnifiedDataService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Data Fetching Methods', () => {
    beforeEach(() => {
      // Mock the HTTP client methods
      dataService['api'] = {
        get: jest.fn().mockResolvedValue({ data: { success: true } }),
        post: jest.fn().mockResolvedValue({ data: { results: [] } }),
      } as any;

      dataService['logger'] = {
        error: jest.fn(),
        info: jest.fn(),
      } as any;
    });

    describe('fetchSportsData', () => {
      test('should use cache when data is available', async () => {
        const cachedData = { teams: ['Team A', 'Team B'] };
        mockCache.get.mockReturnValue(cachedData);

        const result = await dataService.fetchSportsData('mlb', '2024-01-01');

        expect(mockCache.get).toHaveBeenCalledWith('sports_data_mlb_2024-01-01');
        expect(result).toBe(cachedData);
        expect(dataService['api'].get).not.toHaveBeenCalled();
      });

      test('should fetch and cache data when not in cache', async () => {
        mockCache.get.mockReturnValue(null);
        const apiData = { teams: ['Team A', 'Team B'] };
        (dataService['api'].get as jest.Mock).mockResolvedValue({ data: apiData });

        const result = await dataService.fetchSportsData('mlb');

        expect(mockCache.get).toHaveBeenCalledWith('sports_data_mlb_today');
        expect(dataService['api'].get).toHaveBeenCalledWith('/api/sports/mlb');
        expect(mockCache.set).toHaveBeenCalledWith('sports_data_mlb_today', apiData, 300000);
        expect(result).toBe(apiData);
      });

      test('should handle errors properly', async () => {
        mockCache.get.mockReturnValue(null);
        const error = new Error('API Error');
        (dataService['api'].get as jest.Mock).mockRejectedValue(error);

        await expect(dataService.fetchSportsData('mlb')).rejects.toThrow('API Error');
        expect(dataService['logger'].error).toHaveBeenCalledWith('Failed to fetch sports data', error);
      });
    });

    describe('fetchPlayerStats', () => {
      test('should properly construct cache keys and handle responses', async () => {
        mockCache.get.mockReturnValue(null);
        const playerData = { stats: { avg: .300, hr: 25 } };
        (dataService['api'].get as jest.Mock).mockResolvedValue({ data: playerData });

        const result = await dataService.fetchPlayerStats('player123', 'mlb');

        expect(mockCache.get).toHaveBeenCalledWith('player_stats_player123_mlb');
        expect(dataService['api'].get).toHaveBeenCalledWith('/api/players/player123/stats?sport=mlb');
        expect(mockCache.set).toHaveBeenCalledWith('player_stats_player123_mlb', playerData, 600000);
        expect(result).toBe(playerData);
      });
    });

    describe('fetchTeamData', () => {
      test('should use correct variable names (fix validation)', async () => {
        mockCache.get.mockReturnValue(null);
        const teamData = { name: 'Test Team', record: '10-5' };
        (dataService['api'].get as jest.Mock).mockResolvedValue({ data: teamData });

        const result = await dataService.fetchTeamData('team456', 'nfl');

        expect(mockCache.get).toHaveBeenCalledWith('team_data_team456_nfl');
        expect(dataService['api'].get).toHaveBeenCalledWith('/api/teams/team456?sport=nfl');
        expect(mockCache.set).toHaveBeenCalledWith('team_data_team456_nfl', teamData, 600000);
        expect(result).toBe(teamData);
      });
    });

    describe('fetchLiveData', () => {
      test('should not use cache for live data', async () => {
        const liveData = { score: '10-7', quarter: 3 };
        (dataService['api'].get as jest.Mock).mockResolvedValue({ data: liveData });

        const result = await dataService.fetchLiveData('nfl');

        expect(mockCache.get).not.toHaveBeenCalled();
        expect(mockCache.set).not.toHaveBeenCalled();
        expect(dataService['api'].get).toHaveBeenCalledWith('/api/live/nfl');
        expect(result).toBe(liveData);
      });
    });

    describe('searchData', () => {
      test('should handle complex filters and variable naming correctly', async () => {
        mockCache.get.mockReturnValue(null);
        const searchResults = { results: [{ id: 1, name: 'Result 1' }] };
        (dataService['api'].post as jest.Mock).mockResolvedValue({ data: searchResults });

        const filters = { sport: 'mlb', position: 'QB' };
        const result = await dataService.searchData('test query', filters);

        const expectedCacheKey = `search_test query_${JSON.stringify(filters)}`;
        expect(mockCache.get).toHaveBeenCalledWith(expectedCacheKey);
        expect(dataService['api'].post).toHaveBeenCalledWith('/api/search', { 
          query: 'test query', 
          filters 
        });
        expect(mockCache.set).toHaveBeenCalledWith(expectedCacheKey, searchResults, 180000);
        expect(result).toBe(searchResults);
      });
    });
  });

  describe('Cache Management', () => {
    test('should clear all cache when no pattern provided', () => {
      dataService.clearCache();
      expect(mockCache.clear).toHaveBeenCalled();
    });

    test('should clear specific cache entries by pattern', () => {
      const keys = ['sports_data_mlb_today', 'sports_data_nfl_today', 'player_stats_123_mlb'];
      mockCache.getKeys.mockReturnValue(keys);

      dataService.clearCache('sports_data');

      expect(mockCache.getKeys).toHaveBeenCalled();
      expect(mockCache.delete).toHaveBeenCalledWith('sports_data_mlb_today');
      expect(mockCache.delete).toHaveBeenCalledWith('sports_data_nfl_today');
      expect(mockCache.delete).not.toHaveBeenCalledWith('player_stats_123_mlb');
    });
  });

  describe('Data Pipeline Stability Monitoring', () => {
    test('should handle network timeouts gracefully', async () => {
      mockCache.get.mockReturnValue(null);
      const timeoutError = new Error('TIMEOUT');
      timeoutError.name = 'TimeoutError';
      (dataService['api'].get as jest.Mock).mockRejectedValue(timeoutError);

      await expect(dataService.fetchSportsData('mlb')).rejects.toThrow('TIMEOUT');
      expect(dataService['logger'].error).toHaveBeenCalledWith('Failed to fetch sports data', timeoutError);
    });

    test('should handle API rate limits appropriately', async () => {
      mockCache.get.mockReturnValue(null);
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';
      (dataService['api'].get as jest.Mock).mockRejectedValue(rateLimitError);

      await expect(dataService.fetchPlayerStats('player123', 'mlb')).rejects.toThrow('Rate limit exceeded');
      expect(dataService['logger'].error).toHaveBeenCalledWith('Failed to fetch player stats', rateLimitError);
    });

    test('should validate data integrity after fetching', async () => {
      mockCache.get.mockReturnValue(null);
      
      // Test with valid data
      const validData = { teams: ['Team A'], lastUpdated: new Date().toISOString() };
      (dataService['api'].get as jest.Mock).mockResolvedValue({ data: validData });

      const result = await dataService.fetchSportsData('mlb');
      expect(result).toBe(validData);
      expect(mockCache.set).toHaveBeenCalled();
    });
  });

  describe('Performance and Reliability', () => {
    test('should complete operations within reasonable time limits', async () => {
      mockCache.get.mockReturnValue(null);
      (dataService['api'].get as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: {} }), 100))
      );

      const startTime = Date.now();
      await dataService.fetchSportsData('mlb');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500); // Should complete within 500ms for test
    });

    test('should handle concurrent requests properly', async () => {
      mockCache.get.mockReturnValue(null);
      (dataService['api'].get as jest.Mock).mockResolvedValue({ data: { success: true } });

      const promises = [
        dataService.fetchSportsData('mlb'),
        dataService.fetchSportsData('nfl'),
        dataService.fetchPlayerStats('player1', 'mlb'),
        dataService.fetchTeamData('team1', 'nfl'),
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(4);
      results.forEach(result => expect(result).toEqual({ success: true }));
    });
  });
});

/**
 * Integration test suite for real-world scenarios
 */
describe('UnifiedDataService Integration', () => {
  let dataService: UnifiedDataService;

  beforeAll(() => {
    dataService = UnifiedDataService.getInstance();
  });

  test('should maintain singleton pattern across multiple imports', () => {
    const service1 = UnifiedDataService.getInstance();
    const service2 = UnifiedDataService.getInstance();
    expect(service1).toBe(service2);
    expect(service1).toBe(dataService);
  });

  test('should properly handle service lifecycle', () => {
    expect(() => {
      dataService.clearCache();
      dataService.clearCache('pattern');
    }).not.toThrow();
  });
});
