type Handler = (...args: unknown[]) => void | Promise<void>;

export interface SubscribeOptions {
  signal?: AbortSignal;
  once?: boolean;
}

export declare class EventBus {
  private static instance;
  private handlers;
  private constructor();
  static getInstance(): EventBus;
  on(event: string, handler: Handler, options?: SubscribeOptions): () => void;
  subscribe(event: string, handler: Handler, options?: SubscribeOptions): () => void;
  off(event: string, handler?: Handler): void;
  emit(event: string, ...args: unknown[]): void;
  emitAsync(event: string, ...args: unknown[]): Promise<void>;
  publish(event: string | { type: string; payload?: unknown }, payload?: unknown): Promise<void>;
  cleanup(event?: string): void;
  reset(): void;
  listenerCount(event?: string): number;
  hasListeners(event?: string): boolean;
}

export declare const _eventBus: EventBus;
export default _eventBus;
