/**
 * Navigation Ready Signal System
 * 
 * Lightweight event system for navigation readiness coordination
 * between components and validators.
 */

type NavReadyListener = () => void;
type UnsubscribeFn = () => void;

interface NavReadyState {
  isReady: boolean;
  readyTimestamp: number | null;
  listeners: Set<NavReadyListener>;
}

const state: NavReadyState = {
  isReady: false,
  readyTimestamp: null,
  listeners: new Set()
};

/**
 * Signal that navigation is ready and available
 * Ignores duplicate calls after first signal
 */
export function signalNavReady(): void {
  if (state.isReady) {
    return; // Ignore duplicate signals
  }

  state.isReady = true;
  state.readyTimestamp = Date.now();

  // Notify all listeners
  const listeners = Array.from(state.listeners); // Copy to avoid modification during iteration
  listeners.forEach(listener => {
    try {
      listener();
    } catch (error) {
      // Log but don't throw to prevent cascading failures
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[NavReady] Listener error:', error);
      }
    }
  });

  // Clear listeners after notification to prevent memory leaks
  state.listeners.clear();

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[NavReady] Navigation ready signal fired at', new Date(state.readyTimestamp).toISOString());
  }
}

/**
 * Subscribe to navigation ready event
 * If already ready, calls callback immediately
 */
export function onNavReady(callback: NavReadyListener): UnsubscribeFn {
  if (state.isReady) {
    // Already ready - call immediately
    try {
      callback();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[NavReady] Immediate callback error:', error);
      }
    }
    return () => {}; // No-op unsubscribe since callback already fired
  }

  // Add to listeners
  state.listeners.add(callback);

  // Return unsubscribe function
  return () => {
    state.listeners.delete(callback);
  };
}

/**
 * Check if navigation is ready (synchronous)
 */
export function isNavReady(): boolean {
  return state.isReady;
}

/**
 * Get ready timestamp (for diagnostics)
 */
export function getNavReadyTimestamp(): number | null {
  return state.readyTimestamp;
}

/**
 * Reset state (for testing only)
 */
export function resetNavReadyState(): void {
  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.warn('[NavReady] resetNavReadyState should only be used in tests');
    return;
  }
  
  state.isReady = false;
  state.readyTimestamp = null;
  state.listeners.clear();
}