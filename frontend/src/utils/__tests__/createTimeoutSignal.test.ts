import { createTimeoutSignal } from '../createTimeoutSignal';

describe('createTimeoutSignal', () => {
  const originalTimeout = (AbortSignal as any).timeout;

  afterEach(() => {
    (AbortSignal as any).timeout = originalTimeout;
    jest.useRealTimers();
  });

  it('returns undefined signal for non-positive durations', () => {
    const zero = createTimeoutSignal(0);
    const negative = createTimeoutSignal(-100);

    expect(zero.signal).toBeUndefined();
    expect(typeof zero.cleanup).toBe('function');

    expect(negative.signal).toBeUndefined();
    expect(typeof negative.cleanup).toBe('function');
  });

  it('uses native AbortSignal.timeout when available', () => {
    const result = createTimeoutSignal(50);

    expect(result.signal).toBeInstanceOf(AbortSignal);
    expect(result.signal?.aborted).toBe(false);

    // cleanup should be a noop and not throw even for native signals
    expect(() => result.cleanup()).not.toThrow();
  });

  describe('fallback behaviour', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      (AbortSignal as any).timeout = () => {
        throw new Error('Native timeout not supported');
      };
    });

    it('aborts the signal once the timeout elapses', () => {
      const result = createTimeoutSignal(1000);
      const abortSpy = jest.fn();

      result.signal?.addEventListener('abort', abortSpy);

      jest.advanceTimersByTime(999);
      expect(abortSpy).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(abortSpy).toHaveBeenCalledTimes(1);

      // cleanup after abort should not throw
      expect(() => result.cleanup()).not.toThrow();
    });

    it('stops the pending timeout when cleanup is invoked early', () => {
      const result = createTimeoutSignal(1000);
      const abortSpy = jest.fn();

      result.signal?.addEventListener('abort', abortSpy);

      result.cleanup();

      jest.advanceTimersByTime(1000);
      expect(abortSpy).not.toHaveBeenCalled();
    });
  });
});
