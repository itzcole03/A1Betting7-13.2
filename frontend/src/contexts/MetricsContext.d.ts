/**
 * MetricsContextType
 * Provides unified metrics utilities for the app.
 */
export interface MetricsContextType {
  metrics: any;
  track: (event: string, data?: any) => void;
}

export {};
