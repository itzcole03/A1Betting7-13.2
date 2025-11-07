/**
 * AutoRefreshService
 *
 * Centralized refresh scheduler that allows multiple components/hooks to
 * subscribe with their preferred refresh interval. The service maintains a
 * single timer (based on the smallest requested interval) and dispatches
 * callbacks to subscribers when their requested interval has elapsed.
 */

type Subscriber = {
  id: number;
  cb: () => void | Promise<void>;
  intervalMs: number;
  lastCalled: number;
  jitterMs?: number; // Random jitter to add to interval
  nextCallTime?: number; // Next scheduled call time (for precise timing)
};

export class AutoRefreshService {
  private static instance: AutoRefreshService | null = null;
  private subscribers: Map<number, Subscriber> = new Map();
  private nextId = 1;
  private timerId: number | null = null;
  private tickMs = 1000; // default base tick (will be adjusted)
  private useHighResolution = false; // Use RAF for higher precision

  private constructor() {
    // Check if we can use high-resolution timing
    this.useHighResolution = typeof requestAnimationFrame !== 'undefined';
  }

  static getInstance(): AutoRefreshService {
    if (!AutoRefreshService.instance) {
      AutoRefreshService.instance = new AutoRefreshService();
    }
    return AutoRefreshService.instance;
  }

  subscribe(
    cb: () => void | Promise<void>,
    intervalMs: number = 30000,
    invokeImmediately = false,
    options: { jitterMs?: number } = {}
  ) {
    const id = this.nextId++;
    // Raise the minimum allowed interval to 5s to avoid aggressive polling.
    const MIN_INTERVAL = 5000;
    // Add jitter (10% of interval by default) to prevent thundering herd
    const jitterMs = options.jitterMs ?? Math.floor(Math.max(MIN_INTERVAL, intervalMs) * 0.1);

    const sub: Subscriber = {
      id,
      cb,
      intervalMs: Math.max(MIN_INTERVAL, intervalMs),
      lastCalled: 0,
      jitterMs,
      nextCallTime: Date.now() + Math.max(MIN_INTERVAL, intervalMs) + (Math.random() * jitterMs),
    };
    this.subscribers.set(id, sub);
    this.recomputeTimer();

    if (invokeImmediately) {
      // fire but don't block subscription
      Promise.resolve().then(() => cb());
      sub.lastCalled = Date.now();
      sub.nextCallTime = Date.now() + Math.max(MIN_INTERVAL, intervalMs) + (Math.random() * jitterMs);
    }

    return () => this.unsubscribe(id);
  }

  unsubscribe(id: number) {
    this.subscribers.delete(id);
    this.recomputeTimer();
  }

  private recomputeTimer() {
    if (this.subscribers.size === 0) {
      if (this.timerId != null) {
        clearInterval(this.timerId);
        this.timerId = null;
      }
      return;
    }

    // Coalesce intervals using GCD to avoid unnecessarily-frequent ticks while
    // still honoring subscriber intervals. Enforce a minimum tick of 5s.
    const MIN_TICK = 5000;
    const intervals = Array.from(this.subscribers.values()).map(s =>
      Math.max(MIN_TICK, s.intervalMs)
    );

    // Helper: greatest common divisor
    const gcd = (a: number, b: number): number => {
      while (b !== 0) {
        const t = b;
        b = a % b;
        a = t;
      }
      return a;
    };

    let base = intervals[0] || MIN_TICK;
    for (let i = 1; i < intervals.length; i++) {
      base = gcd(base, intervals[i]);
    }
    const minInterval = Math.max(MIN_TICK, base);

    if (this.timerId != null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    this.tickMs = minInterval;
    this.timerId = window.setInterval(() => this.onTick(), this.tickMs);
  }

  private onTick() {
    const now = Date.now();
    for (const sub of Array.from(this.subscribers.values())) {
      try {
        // Use nextCallTime for more precise scheduling if available
        const shouldCall = sub.nextCallTime ? now >= sub.nextCallTime : now - sub.lastCalled >= sub.intervalMs;

        if (shouldCall) {
          // update lastCalled before calling to avoid reentrancy issues
          sub.lastCalled = now;
          // Schedule next call with jitter
          const jitterAmount = Math.random() * (sub.jitterMs || 0);
          sub.nextCallTime = now + sub.intervalMs + jitterAmount;

          // call and ignore returned promise
          Promise.resolve().then(() => sub.cb());
        }
      } catch (err) {
        // swallow subscriber errors
        // eslint-disable-next-line no-console
        console.error('[AutoRefreshService] subscriber error', err);
      }
    }
  }
}

export const autoRefreshService = AutoRefreshService.getInstance();
