export interface EventTypes {
  [event: string]: unknown;
}
export declare class EventBus {
  private static instance;
  private emitter;
  private constructor();
  static getInstance(): EventBus;
  on<K extends keyof EventTypes & (string | symbol)>(
    event: K,
    listener: (data: EventTypes[K]) => void
  ): void;
  once<K extends keyof EventTypes & (string | symbol)>(
    event: K,
    listener: (data: EventTypes[K]) => void
  ): void;
  off<K extends keyof EventTypes & (string | symbol)>(
    event: K,
    listener: (data: EventTypes[K]) => void
  ): void;
  emit<K extends keyof EventTypes & (string | symbol)>(event: K, data: EventTypes[K]): void;
  removeAllListeners<K extends keyof EventTypes & (string | symbol)>(event?: K): void;
  listenerCount<K extends keyof EventTypes & (string | symbol)>(event: K): number;
  listeners<K extends keyof EventTypes & (string | symbol)>(
    event: K
  ): Array<(data: EventTypes[K]) => void>;
  eventNames(): Array<keyof EventTypes>;
  onAny(listener: (eventName: string, data: any) => void): void;
  offAny(listener: (eventName: string, data: any) => void): void;
}
export declare const eventBus: EventBus;
