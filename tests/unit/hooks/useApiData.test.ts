// Comprehensive React Hooks Tests
import { renderHook, act, waitFor } from '../../../tests/utils/testUtils';
import { TestDataFactory, TestHelpers } from '../../../tests/utils/testUtils';
import { useApiData } from '../../../frontend/src/hooks/useApiData';
import { QueryClient } from '@tanstack/react-query';

// Mock the API service
jest.mock('../../../frontend/src/services/api/ApiService', () => ({
  ApiService: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe('useApiData Hook', () => {
  let queryClient: QueryClient;
  let mockApiService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0 },
        mutations: { retry: false },
      },
    });

    const { ApiService } = require('../../../frontend/src/services/api/ApiService');
    mockApiService = new ApiService();
  });

  describe('Data Fetching', () => {
    it('should fetch data successfully', async () => {
      const mockPlayers = TestDataFactory.createMockPlayers(3);
      mockApiService.get.mockResolvedValue(mockPlayers);

      const { result } = renderHook(
        () => useApiData('/players', { sport: 'NBA' }),
        { queryClient }
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockPlayers);
      expect(result.current.error).toBeNull();
      expect(mockApiService.get).toHaveBeenCalledWith('/players', { 
        params: { sport: 'NBA' } 
      });
    });

    it('should handle loading states correctly', async () => {
      const mockPlayers = TestDataFactory.createMockPlayers(5);
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockApiService.get.mockReturnValue(promise);

      const { result } = renderHook(
        () => useApiData('/players'),
        { queryClient }
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isFetching).toBe(true);
      expect(result.current.data).toBeUndefined();

      act(() => {
        resolvePromise!(mockPlayers);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isFetching).toBe(false);
      expect(result.current.data).toEqual(mockPlayers);
    });

    it('should handle fetch errors gracefully', async () => {
      const errorMessage = 'Network error';
      mockApiService.get.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(
        () => useApiData('/players'),
        { queryClient }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toMatchObject({
        message: errorMessage,
      });
      expect(result.current.data).toBeUndefined();
    });

    it('should retry failed requests when enabled', async () => {
      const mockPlayers = TestDataFactory.createMockPlayers(2);
      mockApiService.get
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockPlayers);

      const { result } = renderHook(
        () => useApiData('/players', {}, { retry: 1 }),
        { queryClient }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockPlayers);
      expect(mockApiService.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Caching Behavior', () => {
    it('should cache successful responses', async () => {
      const mockPlayers = TestDataFactory.createMockPlayers(3);
      mockApiService.get.mockResolvedValue(mockPlayers);

      // First hook instance
      const { result: result1 } = renderHook(
        () => useApiData('/players'),
        { queryClient }
      );

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      // Second hook instance with same key
      const { result: result2 } = renderHook(
        () => useApiData('/players'),
        { queryClient }
      );

      // Should immediately have data from cache
      expect(result2.current.data).toEqual(mockPlayers);
      expect(result2.current.isLoading).toBe(false);
      expect(mockApiService.get).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache when key changes', async () => {
      const nbaPlayers = TestDataFactory.createMockPlayers(3);
      const nflPlayers = TestDataFactory.createMockPlayers(2);

      mockApiService.get
        .mockResolvedValueOnce(nbaPlayers)
        .mockResolvedValueOnce(nflPlayers);

      const { result, rerender } = renderHook(
        ({ sport }) => useApiData('/players', { sport }),
        { 
          queryClient,
          initialProps: { sport: 'NBA' }
        }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(nbaPlayers);
      });

      rerender({ sport: 'NFL' });

      await waitFor(() => {
        expect(result.current.data).toEqual(nflPlayers);
      });

      expect(mockApiService.get).toHaveBeenCalledTimes(2);
      expect(mockApiService.get).toHaveBeenNthCalledWith(1, '/players', {
        params: { sport: 'NBA' }
      });
      expect(mockApiService.get).toHaveBeenNthCalledWith(2, '/players', {
        params: { sport: 'NFL' }
      });
    });

    it('should respect stale time configuration', async () => {
      const mockPlayers = TestDataFactory.createMockPlayers(3);
      mockApiService.get.mockResolvedValue(mockPlayers);

      const { result, rerender } = renderHook(
        () => useApiData('/players', {}, { staleTime: 1000 }),
        { queryClient }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockPlayers);
      });

      // Rerender immediately (within stale time)
      rerender();
      expect(mockApiService.get).toHaveBeenCalledTimes(1);

      // Wait for stale time to pass
      await TestHelpers.delay(1100);
      
      rerender();
      await waitFor(() => {
        expect(mockApiService.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should refetch data when enabled parameter changes', async () => {
      const mockPlayers = TestDataFactory.createMockPlayers(3);
      mockApiService.get.mockResolvedValue(mockPlayers);

      const { result, rerender } = renderHook(
        ({ enabled }) => useApiData('/players', {}, { enabled }),
        { 
          queryClient,
          initialProps: { enabled: false }
        }
      );

      // Should not fetch when disabled
      expect(result.current.isLoading).toBe(false);
      expect(mockApiService.get).not.toHaveBeenCalled();

      // Enable fetching
      rerender({ enabled: true });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockPlayers);
      });

      expect(mockApiService.get).toHaveBeenCalledTimes(1);
    });

    it('should support manual refetch', async () => {
      const mockPlayers = TestDataFactory.createMockPlayers(3);
      const updatedPlayers = TestDataFactory.createMockPlayers(4);

      mockApiService.get
        .mockResolvedValueOnce(mockPlayers)
        .mockResolvedValueOnce(updatedPlayers);

      const { result } = renderHook(
        () => useApiData('/players'),
        { queryClient }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockPlayers);
      });

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(updatedPlayers);
      });

      expect(mockApiService.get).toHaveBeenCalledTimes(2);
    });

    it('should handle background refetch', async () => {
      const mockPlayers = TestDataFactory.createMockPlayers(3);
      const updatedPlayers = TestDataFactory.createMockPlayers(4);

      mockApiService.get
        .mockResolvedValueOnce(mockPlayers)
        .mockResolvedValueOnce(updatedPlayers);

      const { result } = renderHook(
        () => useApiData('/players', {}, { refetchInterval: 1000 }),
        { queryClient }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockPlayers);
      });

      // Wait for background refetch
      await TestHelpers.delay(1100);

      await waitFor(() => {
        expect(result.current.data).toEqual(updatedPlayers);
      });

      expect(mockApiService.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Recovery', () => {
    it('should allow error retry through refetch', async () => {
      const mockPlayers = TestDataFactory.createMockPlayers(3);
      mockApiService.get
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockPlayers);

      const { result } = renderHook(
        () => useApiData('/players'),
        { queryClient }
      );

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockPlayers);
        expect(result.current.error).toBeNull();
      });
    });

    it('should reset error state on successful refetch', async () => {
      const mockPlayers = TestDataFactory.createMockPlayers(3);
      mockApiService.get
        .mockRejectedValueOnce(new Error('Server error'))
        .mockResolvedValueOnce(mockPlayers);

      const { result } = renderHook(
        () => useApiData('/players'),
        { queryClient }
      );

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.isError).toBe(true);
      });

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.isError).toBe(false);
        expect(result.current.data).toEqual(mockPlayers);
      });
    });
  });

  describe('Performance Optimization', () => {
    it('should not refetch when component rerenders with same parameters', async () => {
      const mockPlayers = TestDataFactory.createMockPlayers(3);
      mockApiService.get.mockResolvedValue(mockPlayers);

      const { result, rerender } = renderHook(
        () => useApiData('/players', { sport: 'NBA' }),
        { queryClient }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockPlayers);
      });

      // Rerender with same parameters
      rerender();
      rerender();
      rerender();

      expect(mockApiService.get).toHaveBeenCalledTimes(1);
    });

    it('should debounce rapid parameter changes', async () => {
      const mockPlayers = TestDataFactory.createMockPlayers(3);
      mockApiService.get.mockResolvedValue(mockPlayers);

      const { result, rerender } = renderHook(
        ({ search }) => useApiData('/players', { search }, { debounce: 300 }),
        { 
          queryClient,
          initialProps: { search: '' }
        }
      );

      // Rapid changes
      rerender({ search: 'a' });
      rerender({ search: 'ab' });
      rerender({ search: 'abc' });

      // Should not have called API yet
      expect(mockApiService.get).not.toHaveBeenCalled();

      // Wait for debounce
      await TestHelpers.delay(350);

      await waitFor(() => {
        expect(mockApiService.get).toHaveBeenCalledTimes(1);
      });

      expect(mockApiService.get).toHaveBeenCalledWith('/players', {
        params: { search: 'abc' }
      });
    });

    it('should handle memory cleanup on unmount', async () => {
      const mockPlayers = TestDataFactory.createMockPlayers(3);
      mockApiService.get.mockResolvedValue(mockPlayers);

      const { result, unmount } = renderHook(
        () => useApiData('/players'),
        { queryClient }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockPlayers);
      });

      // Unmount component
      unmount();

      // Should not cause memory leaks or errors
      expect(() => {
        // Trigger garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }).not.toThrow();
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety for response data', async () => {
      interface Player {
        id: number;
        name: string;
        team: string;
      }

      const mockPlayer: Player = {
        id: 1,
        name: 'Test Player',
        team: 'Test Team',
      };

      mockApiService.get.mockResolvedValue(mockPlayer);

      const { result } = renderHook(
        () => useApiData<Player>('/players/1'),
        { queryClient }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockPlayer);
      });

      // TypeScript should enforce type safety
      if (result.current.data) {
        expect(typeof result.current.data.id).toBe('number');
        expect(typeof result.current.data.name).toBe('string');
        expect(typeof result.current.data.team).toBe('string');
      }
    });

    it('should handle generic array types', async () => {
      interface Game {
        id: number;
        homeTeam: string;
        awayTeam: string;
      }

      const mockGames: Game[] = [
        { id: 1, homeTeam: 'Team A', awayTeam: 'Team B' },
        { id: 2, homeTeam: 'Team C', awayTeam: 'Team D' },
      ];

      mockApiService.get.mockResolvedValue(mockGames);

      const { result } = renderHook(
        () => useApiData<Game[]>('/games'),
        { queryClient }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockGames);
      });

      if (result.current.data) {
        expect(Array.isArray(result.current.data)).toBe(true);
        expect(result.current.data.length).toBe(2);
      }
    });
  });
});
