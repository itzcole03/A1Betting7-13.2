export type WorkerPoolEventType =
  | 'task_queued'
  | 'task_start'
  | 'task_complete'
  | 'task_error'
  | 'task_timeout'
  | 'task_cancelled'
  | 'pool_idle';

export interface WorkerPoolEvent {
  type: WorkerPoolEventType;
  active: number;
  queued: number;
  durationMs?: number;
  error?: unknown;
}

export interface WorkerPoolOptions {
  maxConcurrency?: number;
  idleTimeoutMs?: number;
  metricsCollector?: (event: WorkerPoolEvent) => void;
}

export interface WorkerPoolStats {
  active: number;
  queued: number;
  completed: number;
  failed: number;
}

export interface RunTaskOptions {
  timeoutMs?: number;
  signal?: AbortSignal | null;
}

type WorkerTask<TPayload, TResult> = {
  id: number;
  handler: WorkerTaskHandler<TPayload, TResult>;
  payload: TPayload;
  resolve: (value: TResult | PromiseLike<TResult>) => void;
  reject: (reason?: unknown) => void;
  timeoutMs?: number;
  signal?: AbortSignal | null;
  settled: boolean;
  timeoutHandle?: ReturnType<typeof setTimeout>;
  startedAt?: number;
};

export type WorkerTaskHandler<TPayload, TResult> = (
  payload: TPayload
) => TResult | Promise<TResult>;

function createTimeoutError(timeout: number): Error {
  const error = new Error(`Worker pool task timed out after ${timeout}ms`);
  error.name = 'WorkerPoolTimeoutError';
  return error;
}

function createAbortError(): Error {
  if (typeof DOMException === 'function') {
    try {
      return new DOMException('Aborted', 'AbortError');
    } catch {
      // ignore and fallback below
    }
  }
  const error = new Error('Task aborted');
  error.name = 'AbortError';
  return error;
}

function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

export class LightweightWorkerPool {
  private static instance: LightweightWorkerPool | null = null;

  public static getInstance(options?: WorkerPoolOptions): LightweightWorkerPool {
    if (!LightweightWorkerPool.instance) {
      LightweightWorkerPool.instance = new LightweightWorkerPool(options);
    } else if (options?.metricsCollector) {
      // allow updating the collector for subsequent calls without recreating pool
      LightweightWorkerPool.instance.metricsCollector = options.metricsCollector;
    }
    return LightweightWorkerPool.instance;
  }

  private maxConcurrency: number;
  private idleTimeoutMs: number;
  private metricsCollector?: (event: WorkerPoolEvent) => void;
  private readonly queue: Array<WorkerTask<any, any>> = [];
  private active = 0;
  private completed = 0;
  private failed = 0;
  private taskCounter = 0;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;

  constructor(options?: WorkerPoolOptions) {
    this.maxConcurrency = Math.max(1, options?.maxConcurrency ?? 2);
    this.idleTimeoutMs = Math.max(10, options?.idleTimeoutMs ?? 10_000);
    this.metricsCollector = options?.metricsCollector;
  }

  public runTask<TPayload, TResult>(
    handler: WorkerTaskHandler<TPayload, TResult>,
    payload: TPayload,
    options?: RunTaskOptions
  ): Promise<TResult> {
    if (!isFunction(handler)) {
      return Promise.reject(new TypeError('Worker task handler must be a function'));
    }
    if (this.disposed) {
      return Promise.reject(new Error('LightweightWorkerPool has been shut down'));
    }

    const taskId = ++this.taskCounter;

    return new Promise<TResult>((resolve, reject) => {
      const task: WorkerTask<TPayload, TResult> = {
        id: taskId,
        handler,
        payload,
        resolve,
        reject,
        timeoutMs: options?.timeoutMs,
        signal: options?.signal ?? null,
        settled: false,
      };

      if (task.signal) {
        if (task.signal.aborted) {
          reject(createAbortError());
          return;
        }
        const abortListener = () => {
          if (task.settled) return;
          task.settled = true;
          this.removeFromQueue(task);
          reject(createAbortError());
          this.emit({ type: 'task_cancelled', active: this.active, queued: this.queue.length });
        };
        try {
          task.signal.addEventListener('abort', abortListener, { once: true });
        } catch {
          // ignore environments without addEventListener on signals
        }
      }

      this.queue.push(task);
      this.emit({ type: 'task_queued', active: this.active, queued: this.queue.length });
      this.clearIdleTimer();
      this.schedule();
    });
  }

  public getStats(): WorkerPoolStats {
    return {
      active: this.active,
      queued: this.queue.length,
      completed: this.completed,
      failed: this.failed,
    };
  }

  public clear(reason?: Error): void {
    const error = reason ?? new Error('Worker pool queue cleared');
    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      if (!task.settled) {
        task.settled = true;
        task.reject(error);
        this.emit({
          type: 'task_cancelled',
          active: this.active,
          queued: this.queue.length,
          error,
        });
      }
    }
  }

  public shutdown(): void {
    this.disposed = true;
    this.clear(new Error('Worker pool shutdown'));
    if (this.active === 0) {
      this.emit({ type: 'pool_idle', active: 0, queued: 0 });
    }
  }

  private removeFromQueue(task: WorkerTask<any, any>): void {
    const index = this.queue.indexOf(task);
    if (index >= 0) {
      this.queue.splice(index, 1);
    }
  }

  private schedule(): void {
    if (this.disposed) return;
    while (this.active < this.maxConcurrency && this.queue.length > 0) {
      const nextTask = this.queue.shift();
      if (!nextTask) break;
      this.startTask(nextTask);
    }
  }

  private startTask(task: WorkerTask<any, any>): void {
    this.active += 1;
    task.startedAt = Date.now();
    this.emit({ type: 'task_start', active: this.active, queued: this.queue.length });

    if (task.timeoutMs && task.timeoutMs > 0) {
      task.timeoutHandle = setTimeout(() => this.handleTimeout(task), task.timeoutMs);
    }

    Promise.resolve()
      .then(() => task.handler(task.payload))
      .then(result => {
        if (task.settled) return;
        task.settled = true;
        this.completed += 1;
        if (task.timeoutHandle) clearTimeout(task.timeoutHandle);
        task.resolve(result);
        this.emit({
          type: 'task_complete',
          active: this.active - 1,
          queued: this.queue.length,
          durationMs: Date.now() - (task.startedAt ?? Date.now()),
        });
        this.finishTask();
      })
      .catch(error => {
        if (task.settled) return;
        task.settled = true;
        this.failed += 1;
        if (task.timeoutHandle) clearTimeout(task.timeoutHandle);
        task.reject(error);
        this.emit({
          type: 'task_error',
          active: this.active - 1,
          queued: this.queue.length,
          error,
          durationMs: Date.now() - (task.startedAt ?? Date.now()),
        });
        this.finishTask();
      });
  }

  private handleTimeout(task: WorkerTask<any, any>): void {
    if (task.settled) return;
    task.settled = true;
    this.failed += 1;
    task.reject(createTimeoutError(task.timeoutMs ?? 0));
    this.emit({
      type: 'task_timeout',
      active: this.active,
      queued: this.queue.length,
      durationMs: Date.now() - (task.startedAt ?? Date.now()),
    });
    this.finishTask();
  }

  private finishTask(): void {
    this.active = Math.max(0, this.active - 1);
    if (this.active === 0 && this.queue.length === 0) {
      this.startIdleTimer();
    } else {
      this.schedule();
    }
  }

  private emit(event: WorkerPoolEvent): void {
    try {
      this.metricsCollector?.(event);
    } catch {
      // swallow collector errors in shim
    }
  }

  private startIdleTimer(): void {
    if (this.idleTimer || this.disposed) return;
    this.idleTimer = setTimeout(() => {
      this.idleTimer = null;
      if (this.active === 0 && this.queue.length === 0) {
        this.emit({ type: 'pool_idle', active: 0, queued: 0 });
      }
    }, this.idleTimeoutMs);
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }
}

export default LightweightWorkerPool;
