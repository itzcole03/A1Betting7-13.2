// Comprehensive API Service Tests
import { ApiService } from '../../../frontend/src/services/api/ApiService';
import { TestHelpers, TestDataFactory } from '../../utils/testUtils';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ApiService', () => {
  let apiService: ApiService;

  beforeEach(() => {
    jest.clearAllMocks();
    apiService = new ApiService({
      baseURL: 'http://localhost:8000/api',
      timeout: 5000,
    });
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultService = new ApiService();
      expect(defaultService).toBeDefined();
    });

    it('should initialize with custom configuration', () => {
      const customService = new ApiService({
        baseURL: 'https://custom.api.com',
        timeout: 10000,
        headers: {
          'Custom-Header': 'test-value',
        },
      });
      expect(customService).toBeDefined();
    });

    it('should setup request interceptors', () => {
      expect(mockedAxios.interceptors.request.use).toHaveBeenCalled();
    });

    it('should setup response interceptors', () => {
      expect(mockedAxios.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('HTTP Methods', () => {
    describe('GET Requests', () => {
      it('should make GET request successfully', async () => {
        const mockData = TestDataFactory.createMockPlayer();
        mockedAxios.get.mockResolvedValue({ data: mockData, status: 200 });

        const result = await apiService.get('/players/1');

        expect(mockedAxios.get).toHaveBeenCalledWith('/players/1', undefined);
        expect(result).toEqual(mockData);
      });

      it('should make GET request with query parameters', async () => {
        const mockData = TestDataFactory.createMockPlayers(5);
        mockedAxios.get.mockResolvedValue({ data: mockData, status: 200 });

        const params = { sport: 'NBA', limit: 5 };
        const result = await apiService.get('/players', { params });

        expect(mockedAxios.get).toHaveBeenCalledWith('/players', { params });
        expect(result).toEqual(mockData);
      });

      it('should handle GET request errors', async () => {
        const errorMessage = 'Player not found';
        mockedAxios.get.mockRejectedValue({
          response: { status: 404, data: { error: errorMessage } },
        });

        await expect(apiService.get('/players/999')).rejects.toThrow();
      });

      it('should handle GET request timeout', async () => {
        mockedAxios.get.mockRejectedValue({
          code: 'ECONNABORTED',
          message: 'timeout of 5000ms exceeded',
        });

        await expect(apiService.get('/players/slow')).rejects.toThrow();
      });
    });

    describe('POST Requests', () => {
      it('should make POST request successfully', async () => {
        const newPlayer = TestDataFactory.createMockPlayer();
        const createdPlayer = { ...newPlayer, id: 123 };
        mockedAxios.post.mockResolvedValue({ data: createdPlayer, status: 201 });

        const result = await apiService.post('/players', newPlayer);

        expect(mockedAxios.post).toHaveBeenCalledWith('/players', newPlayer, undefined);
        expect(result).toEqual(createdPlayer);
      });

      it('should make POST request with headers', async () => {
        const prediction = TestDataFactory.createMockPrediction();
        const headers = { 'Content-Type': 'application/json' };
        mockedAxios.post.mockResolvedValue({ data: prediction, status: 201 });

        const result = await apiService.post('/predictions', prediction, { headers });

        expect(mockedAxios.post).toHaveBeenCalledWith('/predictions', prediction, { headers });
        expect(result).toEqual(prediction);
      });

      it('should handle POST validation errors', async () => {
        const invalidData = { name: '' }; // Invalid player data
        mockedAxios.post.mockRejectedValue({
          response: { 
            status: 400, 
            data: { error: 'Validation failed', details: ['name is required'] }
          },
        });

        await expect(apiService.post('/players', invalidData)).rejects.toThrow();
      });

      it('should handle POST authorization errors', async () => {
        const data = TestDataFactory.createMockPrediction();
        mockedAxios.post.mockRejectedValue({
          response: { status: 401, data: { error: 'Unauthorized' } },
        });

        await expect(apiService.post('/predictions', data)).rejects.toThrow();
      });
    });

    describe('PUT Requests', () => {
      it('should make PUT request successfully', async () => {
        const updatedPlayer = TestDataFactory.createMockPlayer({ id: 1 });
        mockedAxios.put.mockResolvedValue({ data: updatedPlayer, status: 200 });

        const result = await apiService.put('/players/1', updatedPlayer);

        expect(mockedAxios.put).toHaveBeenCalledWith('/players/1', updatedPlayer, undefined);
        expect(result).toEqual(updatedPlayer);
      });

      it('should handle PUT resource not found', async () => {
        const playerData = TestDataFactory.createMockPlayer();
        mockedAxios.put.mockRejectedValue({
          response: { status: 404, data: { error: 'Player not found' } },
        });

        await expect(apiService.put('/players/999', playerData)).rejects.toThrow();
      });
    });

    describe('DELETE Requests', () => {
      it('should make DELETE request successfully', async () => {
        mockedAxios.delete.mockResolvedValue({ data: null, status: 204 });

        await apiService.delete('/players/1');

        expect(mockedAxios.delete).toHaveBeenCalledWith('/players/1', undefined);
      });

      it('should handle DELETE errors', async () => {
        mockedAxios.delete.mockRejectedValue({
          response: { status: 403, data: { error: 'Forbidden' } },
        });

        await expect(apiService.delete('/players/1')).rejects.toThrow();
      });
    });
  });

  describe('Authentication', () => {
    it('should add auth token to requests when available', async () => {
      const token = 'test-jwt-token';
      apiService.setAuthToken(token);

      const mockData = TestDataFactory.createMockUser();
      mockedAxios.get.mockResolvedValue({ data: mockData, status: 200 });

      await apiService.get('/user/profile');

      expect(mockedAxios.get).toHaveBeenCalledWith('/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
    });

    it('should remove auth token when cleared', async () => {
      apiService.setAuthToken('test-token');
      apiService.clearAuthToken();

      const mockData = TestDataFactory.createMockUser();
      mockedAxios.get.mockResolvedValue({ data: mockData, status: 200 });

      await apiService.get('/user/profile');

      expect(mockedAxios.get).toHaveBeenCalledWith('/user/profile', undefined);
    });

    it('should handle token refresh automatically', async () => {
      const expiredToken = 'expired-token';
      const newToken = 'new-token';
      
      apiService.setAuthToken(expiredToken);

      // First request fails with 401
      mockedAxios.get
        .mockRejectedValueOnce({
          response: { status: 401, data: { error: 'Token expired' } },
        })
        .mockResolvedValueOnce({ data: { token: newToken }, status: 200 }) // Token refresh
        .mockResolvedValueOnce({ data: TestDataFactory.createMockUser(), status: 200 }); // Retry

      const result = await apiService.get('/user/profile');

      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValue({
        code: 'ENOTFOUND',
        message: 'Network Error',
      });

      await expect(apiService.get('/players')).rejects.toMatchObject({
        type: 'NETWORK_ERROR',
        message: 'Network Error',
      });
    });

    it('should handle timeout errors', async () => {
      mockedAxios.get.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      });

      await expect(apiService.get('/players')).rejects.toMatchObject({
        type: 'TIMEOUT_ERROR',
        message: expect.stringContaining('timeout'),
      });
    });

    it('should handle server errors', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { 
          status: 500, 
          data: { error: 'Internal server error' }
        },
      });

      await expect(apiService.get('/players')).rejects.toMatchObject({
        type: 'SERVER_ERROR',
        status: 500,
      });
    });

    it('should handle client errors', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { 
          status: 400, 
          data: { error: 'Bad request', details: ['Invalid parameter'] }
        },
      });

      await expect(apiService.get('/players')).rejects.toMatchObject({
        type: 'CLIENT_ERROR',
        status: 400,
      });
    });

    it('should retry requests on network errors', async () => {
      const mockData = TestDataFactory.createMockPlayer();
      
      mockedAxios.get
        .mockRejectedValueOnce({ code: 'ENOTFOUND' })
        .mockRejectedValueOnce({ code: 'ENOTFOUND' })
        .mockResolvedValueOnce({ data: mockData, status: 200 });

      const result = await apiService.get('/players/1', { retry: true, maxRetries: 3 });

      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockData);
    });

    it('should not retry on client errors', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 400, data: { error: 'Bad request' } },
      });

      await expect(apiService.get('/players', { retry: true })).rejects.toThrow();
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance', () => {
    it('should implement request caching', async () => {
      const mockData = TestDataFactory.createMockPlayer();
      mockedAxios.get.mockResolvedValue({ data: mockData, status: 200 });

      // First request
      const result1 = await apiService.get('/players/1', { cache: true });
      
      // Second request (should use cache)
      const result2 = await apiService.get('/players/1', { cache: true });

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });

    it('should respect cache expiration', async () => {
      const mockData = TestDataFactory.createMockPlayer();
      mockedAxios.get.mockResolvedValue({ data: mockData, status: 200 });

      // First request with short cache
      await apiService.get('/players/1', { cache: true, cacheTime: 100 });
      
      // Wait for cache to expire
      await TestHelpers.delay(150);
      
      // Second request (should not use cache)
      await apiService.get('/players/1', { cache: true, cacheTime: 100 });

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent requests efficiently', async () => {
      const mockData = TestDataFactory.createMockPlayers(10);
      mockedAxios.get.mockResolvedValue({ data: mockData, status: 200 });

      const requests = Array.from({ length: 5 }, (_, i) =>
        apiService.get(`/players/${i + 1}`)
      );

      const results = await Promise.all(requests);

      expect(results).toHaveLength(5);
      expect(mockedAxios.get).toHaveBeenCalledTimes(5);
    });

    it('should measure request duration', async () => {
      const mockData = TestDataFactory.createMockPlayer();
      mockedAxios.get.mockImplementation(() =>
        TestHelpers.delay(100).then(() => ({ data: mockData, status: 200 }))
      );

      const startTime = performance.now();
      await apiService.get('/players/1');
      const endTime = performance.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Request/Response Interceptors', () => {
    it('should add correlation ID to requests', async () => {
      const mockData = TestDataFactory.createMockPlayer();
      mockedAxios.get.mockResolvedValue({ data: mockData, status: 200 });

      await apiService.get('/players/1');

      // Verify that correlation ID was added
      const requestInterceptor = mockedAxios.interceptors.request.use.mock.calls[0][0];
      const config = { headers: {} };
      const modifiedConfig = requestInterceptor(config);

      expect(modifiedConfig.headers['X-Correlation-ID']).toBeDefined();
    });

    it('should log request metrics', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockData = TestDataFactory.createMockPlayer();
      mockedAxios.get.mockResolvedValue({ data: mockData, status: 200 });

      await apiService.get('/players/1');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('API Request')
      );

      consoleSpy.mockRestore();
    });

    it('should transform response data', async () => {
      const rawData = {
        player_id: 1,
        player_name: 'Test Player',
        team_name: 'Test Team',
      };
      
      mockedAxios.get.mockResolvedValue({ data: rawData, status: 200 });

      const result = await apiService.get('/players/1');

      // Verify that snake_case was converted to camelCase
      expect(result).toMatchObject({
        playerId: 1,
        playerName: 'Test Player',
        teamName: 'Test Team',
      });
    });
  });

  describe('Configuration', () => {
    it('should allow runtime configuration updates', () => {
      apiService.updateConfig({
        timeout: 10000,
        baseURL: 'https://new-api.com',
      });

      expect(apiService.getConfig().timeout).toBe(10000);
      expect(apiService.getConfig().baseURL).toBe('https://new-api.com');
    });

    it('should validate configuration parameters', () => {
      expect(() => {
        apiService.updateConfig({
          timeout: -1000, // Invalid timeout
        });
      }).toThrow('Invalid timeout value');
    });

    it('should maintain configuration immutability', () => {
      const originalConfig = apiService.getConfig();
      originalConfig.timeout = 99999;

      expect(apiService.getConfig().timeout).not.toBe(99999);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null response data', async () => {
      mockedAxios.get.mockResolvedValue({ data: null, status: 200 });

      const result = await apiService.get('/players/empty');

      expect(result).toBeNull();
    });

    it('should handle empty string response', async () => {
      mockedAxios.get.mockResolvedValue({ data: '', status: 200 });

      const result = await apiService.get('/players/empty');

      expect(result).toBe('');
    });

    it('should handle large response payloads', async () => {
      const largeData = TestDataFactory.createMockPlayers(10000);
      mockedAxios.get.mockResolvedValue({ data: largeData, status: 200 });

      const result = await apiService.get('/players/all');

      expect(result).toHaveLength(10000);
    });

    it('should handle special characters in URLs', async () => {
      const mockData = TestDataFactory.createMockPlayer({ name: 'José Martínez' });
      mockedAxios.get.mockResolvedValue({ data: mockData, status: 200 });

      const result = await apiService.get('/players/José%20Martínez');

      expect(mockedAxios.get).toHaveBeenCalledWith('/players/José%20Martínez', undefined);
      expect(result).toEqual(mockData);
    });
  });
});
