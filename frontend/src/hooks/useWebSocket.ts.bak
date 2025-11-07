import { ApiResponse, WsEvent } from '../types/api';

export function isApiResponse<T>(msg: any): msg is ApiResponse<T> {
  return typeof msg === 'object' && 'success' in msg && 'data' in msg && 'error' in msg;
}

export function isWsEvent<T>(msg: any): msg is WsEvent<T> {
  return isApiResponse<T>(msg) && 'event' in msg.meta;
}

// Example WebSocket message handler
export function handleWsMessage<T>(raw: string): WsEvent<T> | null {
  try {
    const msg = JSON.parse(raw);
    if (isApiResponse<T>(msg)) {
      // Optionally check for event type in meta
      return { ...msg, event: msg.meta?.event ?? 'unknown' } as WsEvent<T>;
    }
    return null;
  } catch {
    return null;
  }
}
