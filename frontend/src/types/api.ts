export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  meta?: Record<string, unknown> | null;
}

export type WsEvent<T> = ApiResponse<T> & { event: string };
