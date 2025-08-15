/**
 * Bootstrap App Module - Idempotent Application Initialization
 * 
 * Provides centralized, idempotent initialization of core A1Betting platform
 * services to eliminate duplicate bootstrap executions.
 * 
 * Features:
 * - Global symbol guard prevents duplicate initialization
 * - Accurate environment detection and logging
 * - Single initialization of auth restoration, ReliabilityOrchestrator
 * - Performance timing instrumentation
 * - Force option for development/testing scenarios
 * 
 * @module bootstrap/bootstrapApp
 */

import { getRuntimeEnv, type RuntimeEnv } from './env';
import { logger } from '../utils/logger';

// Global symbol to prevent accidental name collisions
const BOOTSTRAP_FLAG = Symbol.for('a1.bet.platform.bootstrapped');

/**
 * Type-safe global property access for bootstrap state
 */
type BootstrapGlobalState = Record<symbol, unknown> & {
  __A1_ERROR_HANDLERS_REGISTERED?: boolean;
};

// Helper functions for type-safe global access
const getGlobal = (): BootstrapGlobalState => globalThis as unknown as BootstrapGlobalState;

/**
 * Bootstrap result information
 */
export interface BootstrapResult {
  alreadyBootstrapped: boolean;
  environment: RuntimeEnv;
  durationMs: number;
  timestamp: string;
  services: {
    authRestored: boolean;
    reliabilityStarted: boolean;
    webVitalsInitialized: boolean;
    errorHandlersRegistered: boolean;
  };
}

/**
 * Bootstrap options for controlling initialization behavior
 */
export interface BootstrapOptions {
  /** Force re-initialization even if already bootstrapped */
  force?: boolean;
  /** Skip authentication restoration (for testing scenarios) */
  skipAuth?: boolean;
  /** Skip reliability monitoring (for lean mode) */
  skipReliability?: boolean;
  /** Skip Web Vitals initialization (for performance testing) */
  skipWebVitals?: boolean;
}

/**
 * Check if the application has already been bootstrapped
 * @returns {boolean} True if already bootstrapped
 */
export function isBootstrapped(): boolean {
  return !!getGlobal()[BOOTSTRAP_FLAG];
}

/**
 * Mark the application as bootstrapped
 * @private
 */
function markBootstrapped(): void {
  getGlobal()[BOOTSTRAP_FLAG] = {
    timestamp: new Date().toISOString(),
    symbol: BOOTSTRAP_FLAG,
  };
}

/**
 * Main bootstrap function with idempotency guarantee
 * 
 * Initializes core platform services in proper order:
 * 1. Environment detection & logging setup
 * 2. Error handlers registration
 * 3. Auth session restoration  
 * 4. ReliabilityOrchestrator initialization
 * 5. Web Vitals service initialization
 * 
 * @param {BootstrapOptions} options - Bootstrap configuration options
 * @returns {Promise<BootstrapResult>} Bootstrap result with timing and status
 */
export async function bootstrapApp(options: BootstrapOptions = {}): Promise<BootstrapResult> {
  const startTime = performance.now();
  const environment = getRuntimeEnv();
  const timestamp = new Date().toISOString();

  // Initialize result structure
  const result: BootstrapResult = {
    alreadyBootstrapped: false,
    environment,
    durationMs: 0,
    timestamp,
    services: {
      authRestored: false,
      reliabilityStarted: false,  
      webVitalsInitialized: false,
      errorHandlersRegistered: false,
    },
  };

  // Check if already bootstrapped (unless force option is used)
  if (!options.force && isBootstrapped()) {
    result.alreadyBootstrapped = true;
    result.durationMs = performance.now() - startTime;
    
    logger.debug(
      'Bootstrap skipped - already initialized',
      { 
        environment: environment.mode,
        timestamp,
        durationMs: result.durationMs,
      },
      'Bootstrap'
    );
    
    return result;
  }

  // Start bootstrap process
  logger.info(
    `A1Betting Platform Loading - ${environment.mode === 'production' ? 'Production' : environment.mode === 'development' ? 'Development' : 'Test'} Mode`,
    {
      environment: environment.mode,
      source: environment.source,
      timestamp,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      force: options.force || false,
    },
    'Bootstrap'
  );

  try {
    // 1. Initialize error handlers
    await initializeErrorHandlers(environment);
    result.services.errorHandlersRegistered = true;

    // 2. Initialize auth session restoration (unless skipped)
    if (!options.skipAuth) {
      await initializeAuthRestoration();
      result.services.authRestored = true;
    }

    // 3. Initialize ReliabilityOrchestrator (unless skipped or in lean mode)
    if (!options.skipReliability && !isLeanMode()) {
      await initializeReliabilityOrchestrator();
      result.services.reliabilityStarted = true;
    }

    // 4. Initialize Web Vitals service (unless skipped)
    if (!options.skipWebVitals) {
      await initializeWebVitals();
      result.services.webVitalsInitialized = true;
    }

    // Mark as successfully bootstrapped
    markBootstrapped();
    
    const durationMs = performance.now() - startTime;
    result.durationMs = durationMs;

    logger.info(
      `Bootstrap ✅ Completed in ${durationMs.toFixed(1)}ms`,
      {
        environment: environment.mode,
        services: result.services,
        durationMs,
        timestamp,
      },
      'Bootstrap'
    );

    return result;

  } catch (error) {
    const durationMs = performance.now() - startTime;
    result.durationMs = durationMs;

    logger.error(
      'Bootstrap failed',
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        environment: environment.mode,
        durationMs,
        services: result.services,
      },
      'Bootstrap'
    );

    throw error;
  }
}

/**
 * Initialize global error handlers
 * @private
 */
async function initializeErrorHandlers(_environment: RuntimeEnv): Promise<void> {
  // Only register if not already done
  if (!getGlobal().__A1_ERROR_HANDLERS_REGISTERED) {
    // Global error handler
    window.addEventListener('error', (event) => {
      // Suppress known Vite development issues in production
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

      // Log all other errors for production monitoring
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

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      // Suppress known Vite WebSocket errors
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

      // Properly serialize the error reason
      const errorDetails = {
        reasonType: typeof event.reason,
        reasonString: String(event.reason),
        message: event.reason?.message || 'No message',
        stack: event.reason?.stack || 'No stack trace',
        name: event.reason?.name || 'Unknown error',
        code: event.reason?.code,
        cause: event.reason?.cause,
      };

      // Try to extract more details if it's an Error object
      if (event.reason instanceof Error) {
        errorDetails.message = event.reason.message;
        errorDetails.stack = event.reason.stack || 'No stack trace';
        errorDetails.name = event.reason.name;
      }

      logger.error('Unhandled promise rejection detected', errorDetails, 'Global');

      // Prevent the default browser handling to avoid "Uncaught (in promise)" errors
      event.preventDefault();
    });

    getGlobal().__A1_ERROR_HANDLERS_REGISTERED = true;
  }
}

/**
 * Initialize authentication session restoration 
 * @private
 */
async function initializeAuthRestoration(): Promise<void> {
  // Lazy import to avoid circular dependencies
  const { _authService } = await import('../services/authService');
  
  // Only restore if authenticated (prevents duplicate restoration logs)
  if (_authService.isAuthenticated()) {
    const user = _authService.getUser();
    if (user) {
      // Mark as restored to coordinate with AuthContext
      const globalState = window as typeof window & { __A1_AUTH_RESTORED?: boolean };
      globalState.__A1_AUTH_RESTORED = true;
      
      // Log structured auth restoration (only once per bootstrap)
      logger.info(
        '🔐 Authentication restored',
        {
          email: user.email,
          role: user.role,
          userId: user.id,
          timestamp: new Date().toISOString(),
        },
        'Auth'
      );
    }
  }
}

/**
 * Initialize ReliabilityOrchestrator with singleton pattern
 * @private  
 */
async function initializeReliabilityOrchestrator(): Promise<void> {
  // Lazy import to avoid circular dependencies
  const { reliabilityMonitoringOrchestrator } = await import('../services/reliabilityMonitoringOrchestrator');
  
  // The orchestrator already has built-in singleton and isActive checks
  // This ensures idempotent initialization
  await reliabilityMonitoringOrchestrator.startMonitoring();
}

/**
 * Initialize Web Vitals service with idempotency
 * @private
 */
async function initializeWebVitals(): Promise<void> {
  // Lazy import to avoid circular dependencies  
  const { webVitalsService } = await import('../services/webVitalsService');
  
  // The webVitalsService.init() method already handles idempotency
  webVitalsService.init();
}

/**
 * Check if lean mode is enabled (prevents heavy monitoring in development)
 * @private
 */
function isLeanMode(): boolean {
  return (
    localStorage.getItem('DEV_LEAN_MODE') === 'true' ||
    new URLSearchParams(window.location.search).get('lean') === 'true'
  );
}

/**
 * Reset bootstrap state (for testing scenarios)
 * @internal Used only for testing - not part of public API
 */
export function __resetBootstrapForTesting(): void {
  if (process.env.NODE_ENV === 'test') {
    delete getGlobal()[BOOTSTRAP_FLAG];
    delete getGlobal().__A1_ERROR_HANDLERS_REGISTERED;
  }
}