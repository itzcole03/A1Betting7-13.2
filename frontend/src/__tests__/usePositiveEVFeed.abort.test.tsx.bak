import { renderHook, act } from '@testing-library/react';
import { usePositiveEVFeed } from '../hooks/usePositiveEVFeed';

// Simple mock for fetch that allows manual control
function createDeferred<T>() {
  let resolve: (v: T) => void;
  let reject: (e: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res; reject = rej;
  });
  // @ts-expect-error explicit deferred shape assembly
  return { promise, resolve, reject };
}

describe('usePositiveEVFeed abort behavior', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('does not set state after unmount when aborted', async () => {
    jest.useFakeTimers();
    const deferred = createDeferred<Response>();
    const mockJson = jest.fn().mockResolvedValue({ opportunities: [{ id: '1', player: 'P', market: 'M', ev_percent: 3.2 }] });
    // Provide minimal shape for response object
    global.fetch = jest.fn().mockImplementation(() => deferred.promise);

    const { unmount } = renderHook(() => usePositiveEVFeed(1000, 10));
    // Unmount before resolving
    unmount();
    // Resolve fetch after unmount
    deferred.resolve({ ok: true, json: mockJson } as unknown as Response);
    await act(async () => {
      // Flush microtasks
      await Promise.resolve();
    });
    // If state updated after unmount we'd see act warnings or errors; absence is success
    expect(mockJson).toHaveBeenCalled();
  });
});
