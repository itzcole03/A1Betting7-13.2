export interface TimeoutSignal {
  signal?: AbortSignal;
  cleanup: () => void;
}

/**
 * Provides an AbortSignal that automatically aborts after the provided timeout.
 * Falls back to AbortController when AbortSignal.timeout is unavailable (e.g., jsdom/Jest).
 */
export function createTimeoutSignal(ms: number): TimeoutSignal {
  if (typeof ms !== 'number' || ms <= 0) {
    return { signal: undefined, cleanup: () => {} };
  }

  const abortSignalCtor: typeof AbortSignal | undefined =
    typeof AbortSignal !== 'undefined' ? AbortSignal : undefined;

  if (abortSignalCtor && typeof (abortSignalCtor as any).timeout === 'function') {
    try {
      const timeoutSignal = (abortSignalCtor as any).timeout(ms) as AbortSignal;
      if (timeoutSignal instanceof AbortSignal) {
        return { signal: timeoutSignal, cleanup: () => {} };
      }
    } catch (error) {
      // swallow and fall back to manual AbortController implementation
      // This path is primarily hit in jest/jsdom environments where AbortSignal.timeout exists but throws
    }
  }

  if (typeof AbortController !== 'undefined') {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, ms);

    const cleanup = () => {
      clearTimeout(timeoutId);
    };

    return { signal: controller.signal, cleanup };
  }

  return { signal: undefined, cleanup: () => {} };
}
