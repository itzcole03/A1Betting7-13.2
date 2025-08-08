import { MasterServiceRegistry } from '../MasterServiceRegistry';

describe('MasterServiceRegistry', () => {
  it('should return a singleton instance', () => {
    const instance1 = MasterServiceRegistry.getInstance();
    const instance2 = MasterServiceRegistry.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should register and retrieve services', () => {
    const registry = MasterServiceRegistry.getInstance();
    const mockService = { healthCheck: jest.fn() };
    registry.registerService('mock', mockService);
    expect(registry.getService('mock')).toBe(mockService);
  });

  it('should update and retrieve service health', () => {
    const registry = MasterServiceRegistry.getInstance();
    registry.updateServiceHealth('mock', 'healthy', 42);
    const health = registry.getServiceHealth('mock');
    expect(health).toBeDefined();
    expect((health as any).status).toBe('healthy');
    expect((health as any).responseTime).toBe(42);
  });

  it('should initialize and retrieve service metrics', () => {
    const registry = MasterServiceRegistry.getInstance();
    registry.registerService('mockMetrics', {});
    const metrics = registry.getServiceMetrics('mockMetrics');
    expect(metrics).toBeDefined();
    expect((metrics as any).totalRequests).toBe(0);
    expect((metrics as any).successRate).toBe(100);
  });
});
