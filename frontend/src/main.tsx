/// <reference types="node" />
/// <reference types="react" />
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; // Change to import the correct App component
import { logger } from './utils/logger';
import './utils/tracing';
import './utils/consoleErrorSuppression'; // Initialize console error filtering

// Import Builder.io registry to register components
import '../builder-registry';

// import styles exactly like the prototype
import './index.css';
import './styles/enhanced-animations.css';
import './styles/force-prototype.css';
import './styles/global-cyber-theme.css';
import './styles/prototype-override.css';
import './styles/quantum-styles.css';

logger.info(
  '🚀 A1Betting Platform Loading - Production Mode',
  {
    environment: import.meta.env.MODE, // Vite environment
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  },
  'Bootstrap'
);

// Handle production error reporting;
window.addEventListener('error', event => {
  // Suppress known Vite development issues in production;
  if (event.error?.message?.includes("Cannot read properties of undefined (reading 'frame')")) {
    logger.warn('Vite error overlay issue suppressed', event.error, 'Bootstrap');
    event.preventDefault();
    return;
  }

  // Suppress WebSocket connection errors that don't impact core functionality
  if (
    event.error?.message?.includes('WebSocket closed without opened') ||
    event.error?.message?.includes('WebSocket connection failed') ||
    event.error?.message?.includes('Connection refused')
  ) {
    logger.warn('WebSocket connectivity issue (non-critical)', event.error, 'Bootstrap');
    event.preventDefault();
    return;
  }

  // Suppress fetch errors from API services (expected in development)
  if (
    event.error?.message?.includes('Failed to fetch') ||
    event.error?.message?.includes('TypeError: fetch') ||
    event.error?.message?.includes('API_UNAVAILABLE')
  ) {
    logger.debug('API connectivity issue (non-critical)', event.error, 'Bootstrap');
    event.preventDefault();
    return;
  }

  // Log all other errors for production monitoring;
  logger.error(
    'Global error caught',
    {
      message: event.error?.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    },
    'Global'
  );
});

// Handle unhandled promise rejections;
window.addEventListener('unhandledrejection', event => {
  // Suppress known Vite WebSocket errors;
  if (
    event.reason?.message?.includes('WebSocket closed without opened') ||
    event.reason?.message?.includes('WebSocket connection') ||
    (event.reason instanceof Error && event.reason.message.includes('WebSocket'))
  ) {
    logger.warn('Vite WebSocket error suppressed', { message: event.reason?.message }, 'Bootstrap');
    event.preventDefault();
    return;
  }

  // Suppress fetch errors from API services (expected in development)
  if (
    event.reason?.message?.includes('Failed to fetch') ||
    event.reason?.message?.includes('TypeError: fetch') ||
    event.reason?.message?.includes('API_UNAVAILABLE') ||
    (event.reason instanceof TypeError && event.reason.message.includes('fetch'))
  ) {
    logger.debug(
      'API connectivity issue (non-critical)',
      { message: event.reason?.message },
      'Bootstrap'
    );
    event.preventDefault();
    return;
  }

  // Properly serialize the error reason;
  const errorDetails = {
    // Removed underscore
    reasonType: typeof event.reason,
    reasonString: String(event.reason),
    message: event.reason?.message || 'No message',
    stack: event.reason?.stack || 'No stack trace',
    name: event.reason?.name || 'Unknown error',
    code: event.reason?.code,
    cause: event.reason?.cause,
  };

  // Try to extract more details if it's an Error object;
  if (event.reason instanceof Error) {
    errorDetails.message = event.reason.message;
    errorDetails.stack = event.reason.stack || 'No stack trace';
    errorDetails.name = event.reason.name;
  }

  logger.error('Unhandled promise rejection detected', errorDetails, 'Global');

  // Also log to console for immediate debugging;
  // console statement removed

  // Prevent the default browser handling to avoid "Uncaught (in promise)" errors;
  event.preventDefault();
});

const rootElement = document.getElementById('root'); // Removed underscore
if (!rootElement) throw new Error('Failed to find the root element');

const root = createRoot(rootElement); // Removed underscore
root.render(
  <React.StrictMode>
    <App /> {/* Render the correct App component */}
  </React.StrictMode>
);
