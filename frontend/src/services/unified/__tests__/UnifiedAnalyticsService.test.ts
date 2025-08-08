import { _masterServiceRegistry } from '../../MasterServiceRegistry';
import { UnifiedAnalyticsService } from '../UnifiedAnalyticsService';
describe('UnifiedAnalyticsService', () => {
  describe('UnifiedAnalyticsService', () => {
    it('should return a singleton instance', () => {
      const instance1 = UnifiedAnalyticsService.getInstance(_masterServiceRegistry);
      const instance2 = UnifiedAnalyticsService.getInstance(_masterServiceRegistry);
      expect(instance1).toBe(instance2);
    });
  });

  it('should return recent activity as an array sorted by timestamp', async () => {
    const instance = UnifiedAnalyticsService.getInstance(_masterServiceRegistry);
    // Mock dependencies for isolation
    (instance as any).bettingService = {
      getRecentBets: jest.fn(() =>
        Promise.resolve([
          { id: 'b1', event: 'Game1', amount: 10, odds: 2.0, timestamp: 100, status: 'success' },
          { id: 'b2', event: 'Game2', amount: 20, odds: 1.5, timestamp: 200, status: 'success' },
        ])
      ),
    };
    (instance as any).predictionService = {
      getRecentPredictions: jest.fn(() =>
        Promise.resolve([{ id: 'p1', event: 'Game1', timestamp: 150, status: 'pending' }])
      ),
      getRecentOpportunities: jest.fn(() =>
        Promise.resolve([{ id: 'o1', event: 'Game2', timestamp: 250, status: 'success' }])
      ),
    };
    const activities = await instance.getRecentActivity(5);
    expect(Array.isArray(activities)).toBe(true);
    expect(activities.length).toBe(4);
    expect(activities[0].timestamp).toBe(250); // Sorted descending
  });

  it('should fetch performance metrics (mocked)', async () => {
    const instance = UnifiedAnalyticsService.getInstance(_masterServiceRegistry);
    (instance as any).api = {
      get: jest.fn(() => Promise.resolve({ data: { accuracy: 0.9, precision: 0.8 } })),
    };
    const metrics = await instance.getPerformanceMetricsApi('e1', 'm1', 's1');
    expect(metrics).toHaveProperty('accuracy');
    expect(metrics).toHaveProperty('precision');
  });
});
