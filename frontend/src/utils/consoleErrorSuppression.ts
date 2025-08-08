/**
 * Console Error Suppression Utility
 * Filters out known non-critical console errors to improve developer experience
 */

interface ErrorPattern {
  pattern: RegExp | string;
  description: string;
  suppress: boolean;
}

// Known non-critical error patterns that can be safely suppressed
const KNOWN_NON_CRITICAL_ERRORS: ErrorPattern[] = [
  {
    pattern: /\[mobx\.array\] Attempt to read an array index \(\d+\) that is out of bounds/,
    description: 'MobX array bounds checking warnings',
    suppress: true,
  },
  {
    pattern: /WebSocket connection to .* failed/,
    description: 'WebSocket connection failures (app continues without real-time features)',
    suppress: true,
  },
  {
    pattern: /Mixed Content.*WebSocket.*blocked/,
    description: 'Mixed content WebSocket blocking (expected in development over HTTPS)',
    suppress: true,
  },
  {
    pattern: /Failed to load resource.*net::ERR_CONNECTION_REFUSED/,
    description: 'Backend connection refused (app runs in demo mode)',
    suppress: true,
  },
  {
    pattern: /The resource .* was preloaded using link preload but not used/,
    description: 'Unused preloaded resources (optimization warning)',
    suppress: true,
  },
  {
    pattern: /Could not evaluate in iframe, doesnt exist/,
    description: 'Builder.io iframe evaluation errors (non-critical)',
    suppress: true,
  },
  {
    pattern: /Could not save screenshot/,
    description: 'Builder.io screenshot saving failures (non-critical)',
    suppress: true,
  },
  {
    pattern: /TextSelection endpoint not pointing into a node with inline content/,
    description: 'Text selection issues in Builder.io editor (non-critical)',
    suppress: true,
  },
  {
    pattern: /Uncaught NetworkError.*importScripts.*failed to load/,
    description: 'Web worker loading failures (non-critical)',
    suppress: true,
  },
  {
    pattern: /FullStory namespace conflict/,
    description: 'FullStory namespace conflicts (non-critical)',
    suppress: true,
  },
  {
    pattern: /Could not create web worker\(s\).*Falling back to loading web worker code in main thread/,
    description: 'Monaco editor web worker fallback (non-critical)',
    suppress: true,
  },
  {
    pattern: /Uncaught \[object Object\]/,
    description: 'Generic object errors from external scripts (non-critical)',
    suppress: true,
  },
  {
    pattern: /Uncaught \(in promise\) Error: Unexpected usage/,
    description: 'Monaco editor unexpected usage errors (non-critical)',
    suppress: true,
  },
  {
    pattern: /Cannot create property 'failure' on string/,
    description: 'Builder.io iframe communication errors (non-critical)',
    suppress: true,
  },
  {
    pattern: /Access to font at.*has been blocked by CORS policy/,
    description: 'CORS font loading errors (non-critical)',
    suppress: true,
  },
  {
    pattern: /Could not get cookie|Could not set cookie/,
    description: 'Cookie access errors in iframe context (non-critical)',
    suppress: true,
  },
  {
    pattern: /Node cannot be found in the current page/,
    description: 'DOM node reference errors (non-critical)',
    suppress: true,
  },
];

// Track original console methods
const originalConsole = {
  error: console.error,
  warn: console.warn,
  log: console.log,
};

// Track suppressed errors for debugging
let suppressedErrors: Array<{ message: string; timestamp: number; pattern: string }> = [];

/**
 * Check if an error message matches any known non-critical patterns
 */
function isKnownNonCriticalError(message: string): ErrorPattern | null {
  for (const errorPattern of KNOWN_NON_CRITICAL_ERRORS) {
    if (!errorPattern.suppress) continue;
    
    if (typeof errorPattern.pattern === 'string') {
      if (message.includes(errorPattern.pattern)) {
        return errorPattern;
      }
    } else if (errorPattern.pattern instanceof RegExp) {
      if (errorPattern.pattern.test(message)) {
        return errorPattern;
      }
    }
  }
  return null;
}

/**
 * Enhanced console.error that filters known non-critical errors
 */
function enhancedConsoleError(...args: any[]) {
  const message = args.join(' ');
  const knownError = isKnownNonCriticalError(message);
  
  if (knownError) {
    // Track suppressed error for debugging
    suppressedErrors.push({
      message,
      timestamp: Date.now(),
      pattern: knownError.description,
    });
    
    // In development, show as debug info instead of error
    if (import.meta.env.DEV) {
      console.debug(`[Suppressed Error] ${knownError.description}:`, message);
    }
    return;
  }
  
  // Allow genuine errors through
  originalConsole.error(...args);
}

/**
 * Enhanced console.warn that filters known non-critical warnings
 */
function enhancedConsoleWarn(...args: any[]) {
  const message = args.join(' ');
  const knownError = isKnownNonCriticalError(message);
  
  if (knownError) {
    // Track suppressed warning for debugging
    suppressedErrors.push({
      message,
      timestamp: Date.now(),
      pattern: knownError.description,
    });
    return;
  }
  
  // Allow genuine warnings through
  originalConsole.warn(...args);
}

/**
 * Initialize console error suppression
 */
export function initializeConsoleErrorSuppression() {
  if (import.meta.env.DEV) {
    console.log('[ConsoleErrorSuppression] Initializing console error filtering for development');
    
    // Override console methods
    console.error = enhancedConsoleError;
    console.warn = enhancedConsoleWarn;
    
    // Add global error handler for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      let errorMessage = '';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        errorMessage = JSON.stringify(error);
      }
      
      const knownError = isKnownNonCriticalError(errorMessage);
      if (knownError) {
        event.preventDefault(); // Prevent the error from being logged
        console.debug(`[Suppressed Promise Rejection] ${knownError.description}:`, error);
        return;
      }
      
      // Allow genuine promise rejections through
      originalConsole.error('[Unhandled Promise Rejection]', error);
    });
    
    // Add global error handler for window errors
    window.addEventListener('error', (event) => {
      const errorMessage = event.message || event.error?.message || event.error?.toString() || '';
      const knownError = isKnownNonCriticalError(errorMessage);

      if (knownError) {
        event.preventDefault(); // Prevent the error from being logged
        console.debug(`[Suppressed Window Error] ${knownError.description}:`, event.error);
        return;
      }

      // Additional check for specific error sources
      if (event.filename?.includes('sw_iframe.html') ||
          event.filename?.includes('gtm.js') ||
          event.filename?.includes('monaco-editor') ||
          event.filename?.includes('fs.js')) {
        event.preventDefault();
        console.debug(`[Suppressed External Script Error] ${event.filename}:`, event.error);
        return;
      }

      // Allow genuine errors through
      originalConsole.error('[Window Error]', event.error);
    });
  }
}

/**
 * Restore original console methods
 */
export function restoreConsole() {
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.log = originalConsole.log;
}

/**
 * Get statistics about suppressed errors (for debugging)
 */
export function getSuppressedErrorStats() {
  const stats = suppressedErrors.reduce((acc, error) => {
    acc[error.pattern] = (acc[error.pattern] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    total: suppressedErrors.length,
    byPattern: stats,
    recent: suppressedErrors.slice(-10), // Last 10 suppressed errors
  };
}

/**
 * Clear suppressed error history
 */
export function clearSuppressedErrorHistory() {
  suppressedErrors = [];
}

/**
 * Log suppressed error statistics (useful for debugging)
 */
export function logSuppressedErrorStats() {
  const stats = getSuppressedErrorStats();
  if (stats.total > 0) {
    console.group('[ConsoleErrorSuppression] Suppressed Error Statistics');
    console.log(`Total suppressed: ${stats.total}`);
    console.log('By pattern:', stats.byPattern);
    console.log('Recent errors:', stats.recent);
    console.groupEnd();
  }
}

// Auto-initialize in development
if (import.meta.env.DEV) {
  initializeConsoleErrorSuppression();

  // Log stats every 30 seconds in development
  setInterval(() => {
    const stats = getSuppressedErrorStats();
    if (stats.total > 0) {
      console.debug(`[ConsoleErrorSuppression] Suppressed ${stats.total} non-critical errors`);
    }
  }, 30000);
}
