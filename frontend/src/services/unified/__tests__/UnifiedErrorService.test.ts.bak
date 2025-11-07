import { UnifiedErrorService } from '../UnifiedErrorService';

describe('UnifiedErrorService', () => {
  it('should return a singleton instance', () => {
    const instance1 = UnifiedErrorService.getInstance();
    const instance2 = UnifiedErrorService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should report errors and generate errorId', () => {
    const instance = UnifiedErrorService.getInstance();
    const errorId = instance.reportError('Test error', { context: 'test' });
    expect(errorId).toMatch(/error_/);
    const errorDetails = instance.getError(errorId);
    expect(errorDetails).not.toBeNull();
    expect(errorDetails?.message).toBe('Test error');
  });

  it('should resolve errors', () => {
    const instance = UnifiedErrorService.getInstance();
    const errorId = instance.reportError('Resolvable error', {}, undefined, undefined);
    const resolved = instance.resolveError(errorId, 'Fixed');
    expect(resolved).toBe(true);
    const errorDetails = instance.getError(errorId);
    expect(errorDetails?.resolved).toBe(true);
  });

  it('should provide error stats and clear errors', () => {
    const instance = UnifiedErrorService.getInstance();
    instance.reportError('Stat error 1');
    instance.reportError('Stat error 2');
    const stats = instance.getErrorStats();
    expect(stats.total).toBeGreaterThanOrEqual(2);
    const cleared = instance.clearErrors();
    expect(cleared).toBeGreaterThanOrEqual(0);
  });
});
