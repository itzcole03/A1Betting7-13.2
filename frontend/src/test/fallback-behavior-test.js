/**
 * Test script to verify mock data fallback behavior
 * This script tests what happens when the backend is unavailable
 */
/* eslint-env jest, node */
/* global describe, test, expect, beforeEach, afterEach, jest, global, require, console */

import { PlayerDataService } from '../services/data/PlayerDataService';
import { ApiService } from '../services/unified/ApiService';

// Mock a network error to test fallback behavior
const originalFetch = global.fetch;

function simulateNetworkError() {
  global.fetch = jest.fn(() => {
    return Promise.reject(new Error('Failed to fetch'));
    /**
     * @jest-environment node
     * @jest-globals
     * @global
     * @node
     * Globals: describe, test, expect, beforeEach, afterEach, jest, global, require, console
     */
  });
}

function restoreNetwork() {
  global.fetch = originalFetch;
}

describe('Fallback Behavior Tests', () => {
  beforeEach(() => {
    // Clear any existing instances
    jest.clearAllMocks();
  });

  afterEach(() => {
    restoreNetwork();
  });

  test('PlayerDataService should return mock data when backend fails', async () => {
    simulateNetworkError();

    const playerService = PlayerDataService.getInstance();

    try {
      const playerData = await playerService.getPlayer('test-player', 'MLB');

      // Should return mock data, not throw an error
      expect(playerData).toBeDefined();
      expect(playerData.id).toBe('test-player');
      expect(playerData.name).toContain('Test');
      expect(playerData.sport).toBe('MLB');

      // console.log('✅ PlayerDataService fallback working correctly');
    } catch (error) {
      // console.error('❌ PlayerDataService fallback failed:', error);
      throw error;
    }
  });

  test('ApiService should fail fast with short timeout', async () => {
    const start = Date.now();

    simulateNetworkError();

    const apiService = ApiService.getInstance();

    try {
      await apiService.get('/test-endpoint');
    } catch (error) {
      const duration = Date.now() - start;

      // Should fail within 5 seconds (faster than old 30 second timeout)
      expect(duration).toBeLessThan(5000);
      expect(error.message).toContain('Failed to fetch');

      // console.log(`✅ ApiService failed fast in ${duration}ms`);
    }
  });

  test('Enhanced data manager should normalize errors correctly', async () => {
    simulateNetworkError();

    // Use dynamic import for ES module compatibility
    const { EnhancedDataManager } = await import('../services/EnhancedDataManager');
    const dataManager = new EnhancedDataManager();

    try {
      await dataManager.fetchData('/test-endpoint');
    } catch (error) {
      // Should normalize to a detectable error format
      expect(error.message).toBe('Failed to fetch');
      expect(error.name).toBe('NetworkError');

      // console.log('✅ Error normalization working correctly');
    }
  });
});

// Run the tests if this script is executed directly
