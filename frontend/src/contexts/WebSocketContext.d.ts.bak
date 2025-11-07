/**
 * WebSocketContextType
 * Provides WebSocket connection state and messaging utilities.
 */
export interface WebSocketContextType {
  connected: boolean;
  send: (msg: unknown) => void;
  subscribe: (event: string, handler: (data: unknown) => void) => void;
  unsubscribe: (event: string, handler: (data: unknown) => void) => void;
}

export {};
