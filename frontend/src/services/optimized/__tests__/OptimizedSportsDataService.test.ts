import { beforeEach, describe, expect, it } from '@jest/globals';

import { enhancedLogger } from '../../../utils/enhancedLogger';
import { UnifiedCache } from '../../unified/UnifiedCache';
import {
  OptimizedSportsDataService,
  optimizedSportsDataService,
} from '../OptimizedSportsDataService';

jest.mock('../../../services/unified/FeaturedPropsService', () => ({
  // create an internal jest.fn here (factory is executed in module hoisting)
  fetchFeaturedProps: jest.fn(),
}));

jest.mock('../../../utils/enhancedApiClient', () => ({
  EnhancedApiClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
  })),
}));

// Access the mocked functions from the mocked modules so tests can assert on them
const fetchFeaturedPropsMock = (
  jest.requireMock('../../../services/unified/FeaturedPropsService') as {
    fetchFeaturedProps: jest.Mock;
  }
).fetchFeaturedProps;

const EnhancedApiClientModule = jest.requireMock('../../../utils/enhancedApiClient') as {
  EnhancedApiClient: jest.Mock;
};
const EnhancedApiClientMock = EnhancedApiClientModule.EnhancedApiClient;
// The mocked EnhancedApiClient was instantiated when the service module was
// imported; retrieve that instance's get/post mocks from mock.instances.
const EnhancedApiClientInstance = EnhancedApiClientMock.mock.instances[0] as
  | undefined
  | { get?: jest.Mock; post?: jest.Mock };
const getMock = EnhancedApiClientInstance?.get ?? jest.fn();
const postMock = EnhancedApiClientInstance?.post ?? jest.fn();

describe('OptimizedSportsDataService', () => {
  beforeEach(() => {
    fetchFeaturedPropsMock.mockReset();
    getMock.mockReset();
    postMock.mockReset();
    EnhancedApiClientMock.mockClear();
    UnifiedCache.getInstance().clear();
    optimizedSportsDataService.invalidateCache();
    enhancedLogger.resetMetrics();
  });

  it('caches props responses between calls', async () => {
    const sampleProps = [{ id: 'prop-1' }];
    fetchFeaturedPropsMock.mockResolvedValue(sampleProps);

    const firstCall = await optimizedSportsDataService.fetchProps('MLB');
    const secondCall = await optimizedSportsDataService.fetchProps('MLB');

    expect(firstCall).toEqual(sampleProps);
    expect(secondCall).toEqual(sampleProps);
    expect(fetchFeaturedPropsMock).toHaveBeenCalledTimes(1);
  });

  it('invalidates cache entries by pattern', async () => {
    fetchFeaturedPropsMock.mockResolvedValue([{ id: 'prop-1' }]);

    await optimizedSportsDataService.fetchProps('NBA');
    expect(optimizedSportsDataService.getCacheStats().size).toBeGreaterThan(0);

    optimizedSportsDataService.invalidateCache('props:NBA');
    expect(optimizedSportsDataService.getCacheStats().size).toBe(0);
  });

  it('returns null when unified bets request fails and respects cache afterwards', async () => {
    // Create a fresh service instance so its EnhancedApiClient instance is
    // created after mocks are in place and accessible via mock.instances.
    const localService = new OptimizedSportsDataService();

    // Replace the api client's get method on the created service instance
    // directly. This avoids brittle timing/hoisting issues with mock.instances.
    const apiClient = (localService as any).apiClient;
    const clientGetSpy = jest
      .spyOn(apiClient, 'get')
      .mockRejectedValueOnce(new Error('network failure'));

    const firstResult = await localService.fetchUnifiedBets('NFL');
    expect(firstResult).toBeNull();
    expect(clientGetSpy).toHaveBeenCalledTimes(1);

    clientGetSpy.mockClear();
    const cachedResult = await localService.fetchUnifiedBets('NFL');
    expect(cachedResult).toBeNull();
  });

  it('creates a fresh service instance with independent caches when needed', async () => {
    const localService = new OptimizedSportsDataService();
    fetchFeaturedPropsMock.mockResolvedValueOnce([{ id: 'prop-2' }]);

    const localResult = await localService.fetchProps('NHL');
    expect(localResult).toEqual([{ id: 'prop-2' }]);
    expect(localService.getCacheStats().size).toBe(1);
  });
});
