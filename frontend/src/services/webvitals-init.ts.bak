/**
 * WebVitals Initialization Script
 * 
 * Initializes the WebVitals collector with appropriate configuration
 * and sets up integration with the application.
 */

import { initWebVitals } from './webvitals-collector';

export function initializeWebVitals() {
  // Initialize with debug enabled in development
  const collector = initWebVitals({
    endpoint: '/api/metrics/v1',
    flushInterval: 30000, // 30 seconds
    maxBufferSize: 50,
    enableRetry: true,
    maxRetries: 3,
    enableWebVitals: true,
    enablePerformanceAPI: true,
    debug: process.env.NODE_ENV === 'development'
  });

  // Export globally for easy access
  if (typeof window !== 'undefined') {
    (window as Window & { webVitalsCollector?: typeof collector }).webVitalsCollector = collector;
  }

  return collector;
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWebVitals);
  } else {
    initializeWebVitals();
  }
}

export default initializeWebVitals;