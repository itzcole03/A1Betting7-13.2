/**
 * Runtime error debugging utilities for development environment
 * Captures unhandled errors and promise rejections with detailed logging
 */

// Only initialize in development environment
if (process.env.NODE_ENV === 'development') {
  // Global error handler for synchronous errors
  window.onerror = (
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error
  ) => {
    // eslint-disable-next-line no-console
    console.group('[GlobalRuntimeError] Synchronous Error Captured');
    // eslint-disable-next-line no-console
    console.log('[GlobalRuntimeError] Message:', message);
    // eslint-disable-next-line no-console
    console.log('[GlobalRuntimeError] Source:', source);
    // eslint-disable-next-line no-console
    console.log('[GlobalRuntimeError] Line:', lineno);
    // eslint-disable-next-line no-console
    console.log('[GlobalRuntimeError] Column:', colno);
    // eslint-disable-next-line no-console
    console.log('[GlobalRuntimeError] Error object:', error);
    
    if (error) {
      // eslint-disable-next-line no-console
      console.log('[GlobalRuntimeError] Error stack:', error.stack);
      // eslint-disable-next-line no-console
      console.log('[GlobalRuntimeError] Error name:', error.name);
      // eslint-disable-next-line no-console
      console.log('[GlobalRuntimeError] Error message:', error.message);
      
      // Log additional error properties
      const errorProps = Object.getOwnPropertyNames(error);
      if (errorProps.length > 0) {
        // eslint-disable-next-line no-console
        console.log('[GlobalRuntimeError] Error properties:', errorProps);
        errorProps.forEach(prop => {
          if (prop !== 'stack' && prop !== 'message' && prop !== 'name') {
            try {
              // eslint-disable-next-line no-console
              console.log(`[GlobalRuntimeError] ${prop}:`, (error as unknown as Record<string, unknown>)[prop]);
            } catch {
              // Ignore if property access fails
            }
          }
        });
      }
    }
    
    // eslint-disable-next-line no-console
    console.log('[GlobalRuntimeError] Timestamp:', new Date().toISOString());
    // eslint-disable-next-line no-console
    console.log('[GlobalRuntimeError] URL:', window.location.href);
    // eslint-disable-next-line no-console
    console.log('[GlobalRuntimeError] User Agent:', navigator.userAgent);
    // eslint-disable-next-line no-console
    console.groupEnd();
    
    // Return false to allow default error handling
    return false;
  };

  // Global handler for unhandled promise rejections
  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    // eslint-disable-next-line no-console
    console.group('[GlobalRuntimeError] Unhandled Promise Rejection');
    // eslint-disable-next-line no-console
    console.log('[GlobalRuntimeError] Reason:', event.reason);
    // eslint-disable-next-line no-console
    console.log('[GlobalRuntimeError] Promise:', event.promise);
    
    if (event.reason instanceof Error) {
      // eslint-disable-next-line no-console
      console.log('[GlobalRuntimeError] Error stack:', event.reason.stack);
      // eslint-disable-next-line no-console
      console.log('[GlobalRuntimeError] Error name:', event.reason.name);
      // eslint-disable-next-line no-console
      console.log('[GlobalRuntimeError] Error message:', event.reason.message);
    } else if (typeof event.reason === 'object' && event.reason !== null) {
      try {
        // eslint-disable-next-line no-console
        console.log('[GlobalRuntimeError] Reason JSON:', JSON.stringify(event.reason, null, 2));
      } catch {
        // eslint-disable-next-line no-console
        console.log('[GlobalRuntimeError] Reason (non-serializable):', event.reason);
      }
    }
    
    // eslint-disable-next-line no-console
    console.log('[GlobalRuntimeError] Timestamp:', new Date().toISOString());
    // eslint-disable-next-line no-console
    console.log('[GlobalRuntimeError] URL:', window.location.href);
    // eslint-disable-next-line no-console
    console.groupEnd();
    
    // Don't prevent default handling
    return false;
  };

  // Log initialization
  // eslint-disable-next-line no-console
  console.log('[GlobalRuntimeError] Global error listeners initialized for development');
}

// Helper function to manually trigger error capture for testing
export const triggerTestError = () => {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[GlobalRuntimeError] Manually triggering test error...');
    
    // This should trigger the "Cannot convert undefined or null to object" error
    const testUndefined = undefined;
    try {
      // This will throw the error we're looking for
      Object.keys(testUndefined!);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('[GlobalRuntimeError] Test error captured:', error);
      throw error; // Re-throw to see full stack
    }
  }
};

// Helper function to capture the exact bootstrap error
export const captureBootstrapError = () => {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[GlobalRuntimeError] Monitoring for bootstrap errors...');
    
    // Override console.error temporarily to catch any React errors
    // eslint-disable-next-line no-console
    const originalConsoleError = console.error;
    // eslint-disable-next-line no-console
    console.error = (...args: unknown[]) => {
      if (args.some((arg) => 
        typeof arg === 'string' && 
        arg.includes('Cannot convert undefined or null to object')
      )) {
        // eslint-disable-next-line no-console
        console.group('[GlobalRuntimeError] Bootstrap Error Detected');
        // eslint-disable-next-line no-console
        console.log('[GlobalRuntimeError] Console.error args:', args);
        // eslint-disable-next-line no-console
        console.log('[GlobalRuntimeError] Stack trace:', new Error().stack);
        // eslint-disable-next-line no-console
        console.groupEnd();
      }
      
      // Call original console.error
      originalConsoleError.apply(console, args);
    };
    
    // Restore original console.error after 10 seconds
    setTimeout(() => {
      // eslint-disable-next-line no-console
      console.error = originalConsoleError;
      // eslint-disable-next-line no-console
      console.log('[GlobalRuntimeError] Restored original console.error');
    }, 10000);
  }
};

export default {
  triggerTestError,
  captureBootstrapError,
};