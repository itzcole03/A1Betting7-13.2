import { createSportRadarService } from '../sportRadarService';

// Create a mock and ensure the module returns the same object reference
const mockGet = jest.fn();
const mockRobustApi = { get: mockGet };
jest.mock('../../utils/robustApi', () => ({
  __esModule: true,
  default: mockRobustApi,
}));
import robustApi from '../../utils/robustApi';

describe('SportRadarService (mock mode)', () => {
  it('returns mock health status and does not call robustApiClient.get when in cloud demo mode', async () => {
    const svc = createSportRadarService({ isCloudEnvironment: true });

    const health = await svc.getHealthStatus();

    expect(health).toBeDefined();
    expect(health.service).toBe('comprehensive_sportradar');
    expect((robustApi as any).get).not.toHaveBeenCalled();
  });
});
