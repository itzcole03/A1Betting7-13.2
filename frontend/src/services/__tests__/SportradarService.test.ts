import { createSportRadarService } from '../sportRadarService';

// Mock default export from robustApi module
const mockGet = jest.fn();
jest.mock('../../utils/robustApi', () => ({
  __esModule: true,
  default: { get: mockGet },
}));
import robustApi from '../../utils/robustApi';

describe('SportRadarService (mock mode)', () => {
  it('returns mock health status and does not call robustApiClient.get when in cloud demo mode', async () => {
    const svc = createSportRadarService({ isCloudEnvironment: true });

    const health = await svc.getHealthStatus();

    expect(health).toBeDefined();
    expect(health.service).toBe('comprehensive_sportradar');
    expect((robustApi as any).get as jest.Mock).not.toHaveBeenCalled();
  });
});
