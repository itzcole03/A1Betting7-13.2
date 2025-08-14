/**
 * Test UnifiedDataService cacheData/getCachedData functionality
 * Prevents "cacheData is not a function" regression
 */

import { UnifiedDataService } from '../../frontend/src/services/unified/UnifiedDataService';

interface TestData {
  id: string;
  value: number;
  timestamp: number;
}

describe('UnifiedDataService Cache Methods', () => {
  let service: UnifiedDataService;

  beforeEach(() => {
    // Get singleton instance
    service = UnifiedDataService.getInstance();
  });

  describe('cacheData method', () => {
    test('should be defined as a function', () => {
      expect(typeof service.cacheData).toBe('function');
    });

    test('should cache data successfully', async () => {
      const testData: TestData = {
        id: 'test-1',
        value: 42,
        timestamp: Date.now()
      };

      // Should not throw
      await expect(service.cacheData('test-key', testData)).resolves.toBeUndefined();
    });
  });

  describe('getCachedData method', () => {
    test('should be defined as a function', () => {
      expect(typeof service.getCachedData).toBe('function');
    });

    test('should return cached data', async () => {
      const testData: TestData = {
        id: 'test-2',
        value: 123,
        timestamp: Date.now()
      };

      // Cache the data
      await service.cacheData('test-key-2', testData);

      // Retrieve the data
      const retrieved = await service.getCachedData<TestData>('test-key-2');

      expect(retrieved).toBeDefined();
      expect(retrieved).toEqual(testData);
      expect(retrieved?.id).toBe('test-2');
      expect(retrieved?.value).toBe(123);
    });

    test('should return undefined for unknown keys', async () => {
      const result = await service.getCachedData('non-existent-key');
      expect(result).toBeUndefined();
    });
  });

  describe('round-trip caching', () => {
    test('should preserve data integrity through cache cycle', async () => {
      const complexData = {
        user: 'test-user',
        preferences: {
          theme: 'dark',
          notifications: true,
          settings: {
            autoSave: false,
            syncEnabled: true
          }
        },
        metadata: {
          created: new Date().toISOString(),
          version: '1.2.3'
        }
      };

      // Cache complex object
      await service.cacheData('complex-data', complexData);

      // Retrieve and verify
      const retrieved = await service.getCachedData('complex-data');
      expect(retrieved).toEqual(complexData);
    });

    test('should handle different data types', async () => {
      // Test string
      await service.cacheData('string-test', 'hello world');
      const stringResult = await service.getCachedData('string-test');
      expect(stringResult).toBe('hello world');

      // Test number
      await service.cacheData('number-test', 42);
      const numberResult = await service.getCachedData('number-test');
      expect(numberResult).toBe(42);

      // Test boolean
      await service.cacheData('boolean-test', true);
      const booleanResult = await service.getCachedData('boolean-test');
      expect(booleanResult).toBe(true);

      // Test array
      const arrayData = [1, 2, 3, 'test'];
      await service.cacheData('array-test', arrayData);
      const arrayResult = await service.getCachedData('array-test');
      expect(arrayResult).toEqual(arrayData);
    });
  });

  describe('regression prevention', () => {
    test('should not throw "cacheData is not a function" error', async () => {
      // This test specifically targets the reported regression
      const testKey = 'regression-test';
      const testValue = { regression: false, fixed: true };

      // These calls should not throw "is not a function" errors
      await expect(service.cacheData(testKey, testValue)).resolves.not.toThrow();
      await expect(service.getCachedData(testKey)).resolves.toEqual(testValue);
    });

    test('should maintain method availability after multiple instantiations', () => {
      // Test that singleton pattern maintains method availability
      const service1 = UnifiedDataService.getInstance();
      const service2 = UnifiedDataService.getInstance();

      expect(service1).toBe(service2); // Same instance
      expect(typeof service1.cacheData).toBe('function');
      expect(typeof service2.cacheData).toBe('function');
      expect(typeof service1.getCachedData).toBe('function');
      expect(typeof service2.getCachedData).toBe('function');
    });
  });

  describe('error handling', () => {
    test('should handle null and undefined values gracefully', async () => {
      // Cache null value
      await service.cacheData('null-test', null);
      const nullResult = await service.getCachedData('null-test');
      expect(nullResult).toBeNull();

      // Cache undefined value
      await service.cacheData('undefined-test', undefined);
      const undefinedResult = await service.getCachedData('undefined-test');
      expect(undefinedResult).toBeUndefined();
    });

    test('should handle empty strings and objects', async () => {
      // Empty string
      await service.cacheData('empty-string', '');
      const emptyStringResult = await service.getCachedData('empty-string');
      expect(emptyStringResult).toBe('');

      // Empty object
      await service.cacheData('empty-object', {});
      const emptyObjectResult = await service.getCachedData('empty-object');
      expect(emptyObjectResult).toEqual({});

      // Empty array
      await service.cacheData('empty-array', []);
      const emptyArrayResult = await service.getCachedData('empty-array');
      expect(emptyArrayResult).toEqual([]);
    });
  });
});
