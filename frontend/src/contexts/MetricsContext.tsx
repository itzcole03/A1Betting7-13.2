import React, { ReactNode, createContext, useContext } from 'react';

/**
 * MetricsContextType
 * Provides unified metrics utilities for the app.
 * @property {any} metrics - Metrics instance
 * @property {(event: string, data?: any) => void} track - Track a metric event
 */
export interface MetricsContextType {
  metrics: any;
  track: (event: string, data?: any) => void;
}

const MetricsContext = createContext<MetricsContextType | undefined>(undefined);

// Simple metrics implementation (replace with real metrics as needed)
const metrics = {
  track: (event: string, data?: any) => {
    console.log(`[METRIC] ${event}`, data);
  },
};

/**
 * MetricsProvider
 * Wrap your app with this provider to enable metrics utilities.
 * @param {ReactNode} children
 */
export const MetricsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const track = (event: string, data?: any) => metrics.track(event, data);
  return <MetricsContext.Provider value={{ metrics, track }}>{children}</MetricsContext.Provider>;
};

/**
 * useMetrics
 * Access the metrics context in any component.
 */
export const useMetrics = () => {
  const ctx = useContext(MetricsContext);
  if (!ctx) throw new Error('useMetrics must be used within MetricsProvider');
  return ctx;
};
