/**
 * Runtime error debugging utilities for development environment
 * Captures unhandled errors and promise rejections with detailed logging
 */

// Only initialize in development environment
if (process.env.NODE_ENV === 'development') {
  const restoreNativeConsole = (() => {
    let restored = false;

    return () => {
      if (restored) {
        return;
      }

      try {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.documentElement?.appendChild(iframe);

        const iframeConsole = (iframe.contentWindow as unknown as { console?: Console | undefined })
          ?.console;
        if (iframeConsole) {
          const methods = Object.keys(iframeConsole) as Array<keyof Console>;
          methods.forEach(method => {
            const replacement = iframeConsole[method];
            if (typeof replacement === 'function') {
              const bound = (replacement as (...args: unknown[]) => unknown).bind(iframeConsole);
              (console as unknown as Record<string, unknown>)[method as string] = bound;
            } else {
              (console as Console)[method] = replacement as never;
            }
          });

          restored = true;
        }

        iframe.remove();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[GlobalRuntimeError] Failed to restore native console', err);
      }
    };
  })();

  const disableConsoleNinja = () => {
    try {
      const globalAny = window as unknown as Record<string, unknown>;

      Object.defineProperty(globalAny, '_consoleNinjaAllowedToStart', {
        configurable: true,
        get: () => false,
        set: () => {
          /* ignore attempts to re-enable */
        },
      });
      (globalAny as { _consoleNinjaAllowedToStart?: boolean })._consoleNinjaAllowedToStart = false;

      const existingNinja = (globalAny as { _console_ninja?: unknown })._console_ninja as
        | Record<string, unknown>
        | undefined;
      if (existingNinja) {
        if (
          typeof (existingNinja as { pauseNetworkLogging?: () => void }).pauseNetworkLogging ===
          'function'
        ) {
          (existingNinja as { pauseNetworkLogging: () => void }).pauseNetworkLogging();
        }
        if (
          typeof (existingNinja as { _reconnectTimeout?: ReturnType<typeof setTimeout> })
            ._reconnectTimeout !== 'undefined'
        ) {
          clearTimeout(
            (existingNinja as { _reconnectTimeout: ReturnType<typeof setTimeout> })
              ._reconnectTimeout
          );
        }
      }

      Reflect.deleteProperty(globalAny, '_console_ninja');
      Object.defineProperty(globalAny, '_console_ninja', {
        configurable: true,
        get: () => undefined,
        set: () => {
          /* ignore attempts to re-register */
        },
      });

      const pauseNetworkLogging = (globalAny as { pauseNetworkLogging?: () => void })
        .pauseNetworkLogging;
      if (typeof pauseNetworkLogging === 'function') {
        pauseNetworkLogging();
      }

      const ninjaSession = (globalAny as { _console_ninja_session?: unknown })
        ._console_ninja_session as
        | ({
            _allowedToSend?: boolean;
            _allowedToConnectOnSend?: boolean;
            _connecting?: boolean;
            _connected?: boolean;
            [key: string]: unknown;
          } & Record<string, unknown>)
        | undefined;
      if (ninjaSession) {
        ninjaSession._allowedToSend = false;
        ninjaSession._allowedToConnectOnSend = false;
        ninjaSession._connecting = false;
        ninjaSession._connected = false;
      }

      restoreNativeConsole();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[GlobalRuntimeError] Failed to disable Console Ninja overlay', err);
    }
  };

  disableConsoleNinja();
  const watchdog = setInterval(disableConsoleNinja, 1500);
  setTimeout(() => clearInterval(watchdog), 20000);

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
              console.log(
                `[GlobalRuntimeError] ${prop}:`,
                (error as unknown as Record<string, unknown>)[prop]
              );
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
    try {
      // Expose last uncaught error for easy retrieval in dev tools / tests
      (window as unknown as Record<string, unknown>).__propfinder_last_uncaught_error = {
        message: typeof message === 'string' ? message : String(message),
        source: source || undefined,
        lineno: lineno ?? undefined,
        colno: colno ?? undefined,
        name: error?.name ?? undefined,
        stack: error?.stack ?? new Error().stack ?? undefined,
        timestamp: new Date().toISOString(),
      };
    } catch {
      // ignore
    }

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
    try {
      (window as unknown as Record<string, unknown>).__propfinder_last_uncaught_error = {
        message:
          event.reason instanceof Error
            ? event.reason.message
            : typeof event.reason === 'string'
            ? event.reason
            : JSON.stringify(event.reason),
        name: event.reason instanceof Error ? event.reason.name : undefined,
        stack: event.reason instanceof Error ? event.reason.stack : undefined,
        timestamp: new Date().toISOString(),
      };
    } catch {
      // ignore
    }

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
      if (
        args.some(
          arg =>
            typeof arg === 'string' && arg.includes('Cannot convert undefined or null to object')
        )
      ) {
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
