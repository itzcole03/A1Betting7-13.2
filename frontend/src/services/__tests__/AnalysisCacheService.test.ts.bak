import { AnalysisCacheService } from '../AnalysisCacheService';
import { PropAnalysisRequest, PropAnalysisResponse } from '../PropAnalysisAggregator';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    length: 0,
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('AnalysisCacheService', () => {
  let cacheService: AnalysisCacheService;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();

    // Reset singleton instance
    (AnalysisCacheService as any).instance = undefined;

    // Get new instance
    cacheService = AnalysisCacheService.getInstance();

    // Mock Date.now to return a fixed timestamp
    jest.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('getInstance returns singleton instance', () => {
    const instance1 = AnalysisCacheService.getInstance();
    const instance2 = AnalysisCacheService.getInstance();

    expect(instance1).toBe(instance2);
  });

  test('generateCacheKey creates consistent keys', () => {
    const request1: PropAnalysisRequest = {
      propId: '123',
      player: 'LeBron James',
      team: 'LAL',
      sport: 'NBA',
      statType: 'Points',
      line: 27.5,
      overOdds: 1.8,
      underOdds: 2.0,
    };

    const request2: PropAnalysisRequest = {
      propId: '123',
      player: 'LeBron James',
      team: 'LAL',
      sport: 'NBA',
      statType: 'Points',
      line: 27.5,
      overOdds: 1.8,
      underOdds: 2.0,
    };

    const key1 = AnalysisCacheService.generateCacheKey(request1);
    const key2 = AnalysisCacheService.generateCacheKey(request2);

    expect(key1).toBe(key2);
    expect(key1).toContain('prop_analysis');
    expect(key1).toContain('LeBron James');
  });

  test('set and get work correctly', () => {
    const key = 'test-key';
    const value: PropAnalysisResponse = {
      overAnalysis: 'Over analysis',
      underAnalysis: 'Under analysis',
      confidenceOver: 75,
      confidenceUnder: 25,
      keyFactorsOver: ['Factor 1', 'Factor 2'],
      keyFactorsUnder: ['Factor 3', 'Factor 4'],
      dataQuality: 0.8,
      generationTime: 1500,
      modelUsed: 'llama2',
    };

    cacheService.set(key, value);
    const result = cacheService.get(key);

    expect(result).toEqual(value);
  });

  test('has returns true for existing item', () => {
    const key = 'test-key';
    const value: PropAnalysisResponse = {
      overAnalysis: 'Over analysis',
      underAnalysis: 'Under analysis',
      confidenceOver: 75,
      confidenceUnder: 25,
      keyFactorsOver: ['Factor 1', 'Factor 2'],
      keyFactorsUnder: ['Factor 3', 'Factor 4'],
      dataQuality: 0.8,
      generationTime: 1500,
      modelUsed: 'llama2',
    };

    cacheService.set(key, value);

    expect(cacheService.has(key)).toBe(true);
  });

  test('has returns false for non-existent item', () => {
    expect(cacheService.has('non-existent-key')).toBe(false);
  });

  test('delete removes item from cache', () => {
    const key = 'test-key';
    const value: PropAnalysisResponse = {
      overAnalysis: 'Over analysis',
      underAnalysis: 'Under analysis',
      confidenceOver: 75,
      confidenceUnder: 25,
      keyFactorsOver: ['Factor 1', 'Factor 2'],
      keyFactorsUnder: ['Factor 3', 'Factor 4'],
      dataQuality: 0.8,
      generationTime: 1500,
      modelUsed: 'llama2',
    };

    cacheService.set(key, value);
    cacheService.delete(key);

    expect(cacheService.get(key)).toBeNull();
    expect(cacheService.has(key)).toBe(false);
  });

  test('clear removes all items from cache', () => {
    const key1 = 'test-key-1';
    const key2 = 'test-key-2';
    const value: PropAnalysisResponse = {
      overAnalysis: 'Over analysis',
      underAnalysis: 'Under analysis',
      confidenceOver: 75,
      confidenceUnder: 25,
      keyFactorsOver: ['Factor 1', 'Factor 2'],
      keyFactorsUnder: ['Factor 3', 'Factor 4'],
      dataQuality: 0.8,
      generationTime: 1500,
      modelUsed: 'llama2',
    };

    // Reset localStorage and clear memory cache before the test
    localStorage.clear();
    (cacheService as any).memoryCache.clear();

    cacheService.set(key1, value);
    cacheService.set(key2, value);

    // Verify items were set successfully first
    expect(cacheService.get(key1)).not.toBeNull();
    expect(cacheService.get(key2)).not.toBeNull();

    // Now clear and verify they're gone
    cacheService.clear();

    expect(cacheService.get(key1)).toBeNull();
    expect(cacheService.get(key2)).toBeNull();
  });

  test('get returns null for expired item and isStale for stale item', () => {
    const key = 'test-key';
    const value: PropAnalysisResponse = {
      overAnalysis: 'Over analysis',
      underAnalysis: 'Under analysis',
      confidenceOver: 75,
      confidenceUnder: 25,
      keyFactorsOver: ['Factor 1', 'Factor 2'],
      keyFactorsUnder: ['Factor 3', 'Factor 4'],
      dataQuality: 0.8,
      generationTime: 1500,
      modelUsed: 'llama2',
    };

    // Set with default TTL (5 min)
    cacheService.set(key, value);

    // Mock Date.now to return a time after TTL but within STALE_TTL (e.g., 10 min later)
    jest.spyOn(Date, 'now').mockReturnValue(1000 + 10 * 60 * 1000); // 10 minutes later
    const staleResult = cacheService.get(key);
    expect(staleResult).not.toBeNull();
    expect(staleResult?.isStale).toBe(true);

    // Mock Date.now to return a time after TTL + STALE_TTL (e.g., 36 min later)
    jest.spyOn(Date, 'now').mockReturnValue(1000 + 36 * 60 * 1000); // 36 minutes later
    expect(cacheService.get(key)).toBeNull();
  });

  test('get returns stale item with isStale flag', () => {
    const key = 'test-key';
    const value: PropAnalysisResponse = {
      overAnalysis: 'Over analysis',
      underAnalysis: 'Under analysis',
      confidenceOver: 75,
      confidenceUnder: 25,
      keyFactorsOver: ['Factor 1', 'Factor 2'],
      keyFactorsUnder: ['Factor 3', 'Factor 4'],
      dataQuality: 0.8,
      generationTime: 1500,
      modelUsed: 'llama2',
    };

    // Set with default TTL
    cacheService.set(key, value);

    // Mock Date.now to return a time after TTL but before STALE_TTL
    jest.spyOn(Date, 'now').mockReturnValue(1000 + 10 * 60 * 1000); // 10 minutes later

    const result = cacheService.get(key);

    expect(result).not.toBeNull();
    expect(result?.isStale).toBe(true);
    expect(result?.overAnalysis).toBe('Over analysis');
  });

  test('getStats returns cache statistics', () => {
    const key = 'test-key';
    const value: PropAnalysisResponse = {
      overAnalysis: 'Over analysis',
      underAnalysis: 'Under analysis',
      confidenceOver: 75,
      confidenceUnder: 25,
      keyFactorsOver: ['Factor 1', 'Factor 2'],
      keyFactorsUnder: ['Factor 3', 'Factor 4'],
      dataQuality: 0.8,
      generationTime: 1500,
      modelUsed: 'llama2',
    };

    // Set and get to increment hits
    cacheService.set(key, value);
    cacheService.get(key);

    // Get non-existent key to increment misses
    cacheService.get('non-existent-key');

    // Get stale item to increment stale
    jest.spyOn(Date, 'now').mockReturnValue(1000 + 10 * 60 * 1000); // 10 minutes later
    cacheService.get(key);

    const stats = cacheService.getStats();

    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.stale).toBe(1);
  });

  test('set with custom TTL', () => {
    const key = 'test-key';
    const value: PropAnalysisResponse = {
      overAnalysis: 'Over analysis',
      underAnalysis: 'Under analysis',
      confidenceOver: 75,
      confidenceUnder: 25,
      keyFactorsOver: ['Factor 1', 'Factor 2'],
      keyFactorsUnder: ['Factor 3', 'Factor 4'],
      dataQuality: 0.8,
      generationTime: 1500,
      modelUsed: 'llama2',
    };

    // Set with custom TTL of 1 minute
    cacheService.set(key, value, { ttl: 60 * 1000 });

    // After 2 minutes (TTL expired, but within STALE_TTL), should return stale value
    jest.spyOn(Date, 'now').mockReturnValue(1000 + 2 * 60 * 1000); // 2 minutes later
    const staleResult = cacheService.get(key);
    expect(staleResult).not.toBeNull();
    expect(staleResult?.isStale).toBe(true);

    // After 31 minutes (TTL + STALE_TTL), should return null
    jest.spyOn(Date, 'now').mockReturnValue(1000 + 31 * 60 * 1000); // 31 minutes later
    expect(cacheService.get(key)).toBeNull();
  });

  test('localStorage integration', () => {
    const key = 'test-key';
    const value: PropAnalysisResponse = {
      overAnalysis: 'Over analysis',
      underAnalysis: 'Under analysis',
      confidenceOver: 75,
      confidenceUnder: 25,
      keyFactorsOver: ['Factor 1', 'Factor 2'],
      keyFactorsUnder: ['Factor 3', 'Factor 4'],
      dataQuality: 0.8,
      generationTime: 1500,
      modelUsed: 'llama2',
    };

    cacheService.set(key, value);

    // Verify localStorage was called
    expect(localStorageMock.setItem).toHaveBeenCalled();

    // Clear memory cache to force localStorage retrieval
    (cacheService as any).memoryCache.clear();

    // Mock localStorage.getItem to return the cached item
    (localStorageMock.getItem as jest.Mock).mockReturnValueOnce(
      JSON.stringify({
        value,
        timestamp: 1000,
        ttl: 5 * 60 * 1000, // 5 minutes
      })
    );

    const result = cacheService.get(key);

    // Verify localStorage was called
    expect(localStorageMock.getItem).toHaveBeenCalled();

    // Verify result
    expect(result).toEqual(value);
  });
});
