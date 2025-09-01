// Mock robustApi before importing the service so the service receives the mock
jest.mock('../../utils/robustApi', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const robustApi = jest.requireMock('../../utils/robustApi').default;
const { createSportRadarService } = require('../sportRadarService');

describe('SportRadarService (mock mode)', () => {
  it('returns mock health status and does not call robustApiClient.get when in cloud demo mode', async () => {
    const svc = createSportRadarService({ isCloudEnvironment: true });

    const health = await svc.getHealthStatus();

    expect(health).toBeDefined();
    expect(health.service).toBe('comprehensive_sportradar');
    expect((robustApi as any).get).not.toHaveBeenCalled();
  });
});
