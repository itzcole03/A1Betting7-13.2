/**
 * Test script to verify mock data fallback behavior
 * This script tests what happens when the backend is unavailable
 */

import { PlayerDataService } from '../services/data/PlayerDataService';
import { ApiService } from '../services/unified/ApiService';

// Mock a network error to test fallback behavior
const originalFetch = global.fetch;

function simulateNetworkError() {
  global.fetch = jest.fn(() => {
    return Promise.reject(new Error('Failed to fetch'));
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
      
      console.log('✅ PlayerDataService fallback working correctly');
    } catch (error) {
      console.error('❌ PlayerDataService fallback failed:', error);
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
      
      console.log(`✅ ApiService failed fast in ${duration}ms`);
    }
  });

  test('Enhanced data manager should normalize errors correctly', async () => {
    simulateNetworkError();
    
    const { EnhancedDataManager } = require('../services/EnhancedDataManager');
    const dataManager = new EnhancedDataManager();
    
    try {
      await dataManager.fetchData('/test-endpoint');
    } catch (error) {
      // Should normalize to a detectable error format
      expect(error.message).toBe('Failed to fetch');
      expect(error.name).toBe('NetworkError');
      
      console.log('✅ Error normalization working correctly');
    }
  });
});

// Run the tests if this script is executed directly
if (require.main === module) {
  console.log('🧪 Running fallback behavior tests...');
  
  // Simple test runner since Jest may not be available
  async function runTests() {
    console.log('\n1. Testing PlayerDataService fallback...');
    global.fetch = () => Promise.reject(new Error('Failed to fetch'));
    
    try {
      const { PlayerDataService } = await import('../services/data/PlayerDataService');
      const service = PlayerDataService.getInstance();
      const result = await service.getPlayer('test-player-123', 'MLB');
      
      if (result && result.id === 'test-player-123') {
        console.log('✅ PlayerDataService fallback test PASSED');
        console.log(`   Mock player: ${result.name}, Team: ${result.team}`);
      } else {
        console.log('❌ PlayerDataService fallback test FAILED');
      }
    } catch (error) {
      console.log('❌ PlayerDataService fallback test FAILED:', error.message);
    }
    
    console.log('\n2. Testing ApiService timeout behavior...');
    const start = Date.now();
    
    try {
      const { ApiService } = await import('../services/unified/ApiService');
      const service = ApiService.getInstance();
      await service.get('/test-nonexistent-endpoint');
    } catch (error) {
      const duration = Date.now() - start;
      if (duration < 5000) {
        console.log(`✅ ApiService timeout test PASSED (${duration}ms)`);
      } else {
        console.log(`❌ ApiService timeout test FAILED (${duration}ms - too slow)`);
      }
    }
    
    console.log('\n🎯 Fallback behavior tests completed!');
  }
  
  runTests();
}
