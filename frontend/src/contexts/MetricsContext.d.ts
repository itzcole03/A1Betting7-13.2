/**
 * MetricsContextType
 * Provides unified metrics utilities for the app.
 */
export interface MetricsContextType {
  metrics: unknown;
  track: (event: string, data?: unknown) => void;
}

export {};
