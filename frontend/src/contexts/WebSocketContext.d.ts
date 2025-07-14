/**
 * WebSocketContextType
 * Provides WebSocket connection state and messaging utilities.
 */
export interface WebSocketContextType {
  connected: boolean;
  send: (msg: any) => void;
  subscribe: (event: string, handler: (data: any) => void) => void;
  unsubscribe: (event: string, handler: (data: any) => void) => void;
}

export {};
