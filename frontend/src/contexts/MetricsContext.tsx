/**
 * Metrics context and provider for unified metrics utilities and event tracking.
 *
 * @module contexts/MetricsContext
 */
import React, { ReactNode, createContext, useContext } from 'react';

/**
 * MetricsContextType
 * Provides unified metrics utilities for the app.
 * @property {any} metrics - Metrics instance
 * @property {(event: string, data?: any) => void} track - Track a metric event
 */
export interface MetricsContextType {
  metrics: unknown;
  track: (event: string, data?: unknown) => void;
}

/**
 * React context for metrics utilities and event tracking.
 */
const _MetricsContext = createContext<MetricsContextType | undefined>(undefined);

// Simple metrics implementation (replace with real metrics as needed)
const _metrics = {
  track: (event: string, data?: unknown) => {
    console.log(`[METRIC] ${event}`, data);
  },
};

/**
 * MetricsProvider component.
 * Wrap your app with this provider to enable metrics utilities.
 * @param {object} props - React children.
 * @returns {JSX.Element} The provider component.
 */
export const _MetricsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const _track = (event: string, data?: unknown) => _metrics.track(event, data);
  // Removed unused @ts-expect-error: JSX is supported in this environment
  return (
    <_MetricsContext.Provider value={{ metrics: _metrics, track: _track }}>
      {children}
    </_MetricsContext.Provider>
  );
};

/**
 * useMetrics
 * Access the metrics context in any component.
 */
export const _useMetrics = () => {
  const _ctx = useContext(_MetricsContext);
  if (!_ctx) throw new Error('useMetrics must be used within MetricsProvider');
  return _ctx;
};
