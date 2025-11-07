/**
 * Request Deduplicator
 * Prevents concurrent identical requests by coalescing them
 * Useful for filter changes that trigger rapid refetches
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  resolvers: Array<(value: T) => void>;
  rejecters: Array<(error: Error) => void>;
  createdAt: number;
  subscribers: number;
}

interface DeduplicatorOptions {
  ttl?: number; // Time to live for pending request (ms)
  debug?: boolean;
}

export class RequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest<any>> = new Map();
  private ttl: number;
  private debug: boolean;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: DeduplicatorOptions = {}) {
    this.ttl = options.ttl ?? 30000; // 30s default
    this.debug = options.debug ?? false;
    this.startCleanupTimer();
  }

  /**
   * Execute a request, deduplicating identical concurrent requests
   */
  async deduplicate<T>(
    key: string,
    executor: () => Promise<T>
  ): Promise<T> {
    // Check if we have a pending request for this key
    const existing = this.pendingRequests.get(key);
    if (existing) {
      existing.subscribers++;
      if (this.debug) {
        // eslint-disable-next-line no-console
        console.debug(`[Deduplicator] Coalescing request: ${key} (subscribers: ${existing.subscribers})`);
      }
      return existing.promise;
    }

    // Create a new deferred promise
    let resolveFunc: (value: T) => void;
    let rejectFunc: (error: Error) => void;

    const promise = new Promise<T>((resolve, reject) => {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

    const pending: PendingRequest<T> = {
      promise,
      resolvers: [resolveFunc!],
      rejecters: [rejectFunc!],
      createdAt: Date.now(),
      subscribers: 1,
    };

    this.pendingRequests.set(key, pending);

    if (this.debug) {
      // eslint-disable-next-line no-console
      console.debug(`[Deduplicator] Starting request: ${key}`);
    }

    // Execute the actual request
    try {
      const result = await executor();

      // Resolve all waiters
      for (const resolve of pending.resolvers) {
        try {
          resolve(result);
        } catch (err) {
          // Ignore errors in resolver execution
        }
      }

      if (this.debug) {
        // eslint-disable-next-line no-console
        console.debug(`[Deduplicator] Request completed: ${key} (resolved ${pending.subscribers} subscribers)`);
      }

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Reject all waiters
      for (const reject of pending.rejecters) {
        try {
          reject(err);
        } catch (rejErr) {
          // Ignore errors in rejecter execution
        }
      }

      if (this.debug) {
        // eslint-disable-next-line no-console
        console.error(`[Deduplicator] Request failed: ${key}`, err);
      }

      throw err;
    } finally {
      // Clean up the pending request
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Get the number of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Get details about pending requests
   */
  getPendingRequests(): Array<{ key: string; subscribers: number; ageMs: number }> {
    const now = Date.now();
    return Array.from(this.pendingRequests.entries()).map(([key, pending]) => ({
      key,
      subscribers: pending.subscribers,
      ageMs: now - pending.createdAt,
    }));
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * Start periodic cleanup of stale pending requests
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      for (const [key, pending] of this.pendingRequests.entries()) {
        if (now - pending.createdAt > this.ttl) {
          keysToDelete.push(key);
        }
      }

      if (keysToDelete.length > 0) {
        for (const key of keysToDelete) {
          const pending = this.pendingRequests.get(key);
          if (pending) {
            const err = new Error(`Request timeout after ${this.ttl}ms`);
            for (const reject of pending.rejecters) {
              try {
                reject(err);
              } catch (rejErr) {
                // Ignore
              }
            }
          }
          this.pendingRequests.delete(key);
        }

        if (this.debug) {
          // eslint-disable-next-line no-console
          console.debug(`[Deduplicator] Cleaned up ${keysToDelete.length} stale requests`);
        }
      }
    }, Math.max(5000, this.ttl / 2));
  }

  /**
   * Stop the cleanup timer
   */
  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.pendingRequests.clear();
  }
}

// Global instance
let instance: RequestDeduplicator | null = null;

export function getRequestDeduplicator(): RequestDeduplicator {
  if (!instance) {
    instance = new RequestDeduplicator({
      ttl: 30000,
      debug: process.env.NODE_ENV === 'development',
    });
  }
  return instance;
}

export const requestDeduplicator = getRequestDeduplicator();
