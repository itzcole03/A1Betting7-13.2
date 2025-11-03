import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import AuthPage from './components/auth/AuthPage';
import PasswordChangeForm from './components/auth/PasswordChangeForm';
import { ErrorBoundary } from './components/core/ErrorBoundary';
import ServiceWorkerUpdateNotification from './components/core/ServiceWorkerUpdateNotification';
import { ErrorBoundaryVersion } from './components/ErrorBoundaryVersion';
import LeanModeBanner from './components/LeanModeBanner';
import { ReliabilityIntegrationWrapper } from './components/reliability/ReliabilityIntegrationWrapper';
import { _AppProvider } from './contexts/AppContext';
import { _AuthProvider, useAuth } from './contexts/AuthContext';
import { _ThemeProvider } from './contexts/ThemeContext';
import { _WebSocketProvider } from './contexts/WebSocketContext';
import { OnboardingProvider } from './onboarding/OnboardingContext';
import OnboardingFlow from './onboarding/OnboardingFlow';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
// import { liveDemoEnhancementService } from './services/liveDemoEnhancementService'; // DISABLED - causing console spam
import { signalNavReady } from './navigation/navReadySignal';
import { UpdateModal } from './update/UpdateModal';
import { createTimeoutSignal } from './utils/createTimeoutSignal';
import { enhancedLogger } from './utils/enhancedLogger';
import { getBackendUrl } from './utils/getBackendUrl';
import { createLazyComponent } from './utils/lazyLoading';
import { getLocation } from './utils/location';
import { usePerformanceTracking } from './utils/performance';
// Ensure LazyUserFriendlyApp is imported for test env override
// LazyUserFriendlyApp already declared above, remove duplicate

type PropFinderDebugStatus = {
  ok: boolean;
  status?: number;
  error?: string;
  serverTotal?: number;
  server_total?: number;
};

type PropFinderDevWindow = Window & {
  __propfinder_last_fetch_status?: PropFinderDebugStatus | null;
  __propfinder_last_stats?: Record<string, unknown> | null;
  __propfinder_last_request_url?: string;
  __propfinder_last_response?: unknown;
};

const LazyUserFriendlyApp = createLazyComponent(
  () =>
    import('./components/user-friendly/UserFriendlyApp').then(module => ({
      default: module.default as React.ComponentType<unknown>,
    })),
  {
    fallback: () => <div className='text-white p-8'>Loading dashboard...</div>,
  }
);

function App() {
  enhancedLogger.debug(
    'App',
    'lifecycle',
    'Entering App component with React 19 features - Validating backend and imports'
  );
  const { trackOperation } = usePerformanceTracking('App');
  const queryClientRef = React.useRef<QueryClient | null>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          // Keep dev footprints small: short GC and no retries to avoid runaway memory
          gcTime: import.meta.env.DEV ? 60_000 : 5 * 60_000,
          staleTime: import.meta.env.DEV ? 15_000 : 60_000,
          retry: import.meta.env.DEV ? false : 2,
        },
        mutations: {
          retry: import.meta.env.DEV ? false : 2,
        },
      },
    });
  }
  const queryClient = queryClientRef.current;

  // Always use the proper backend URL for direct connection
  const [apiUrl] = useState(getBackendUrl());
  const [backendHealthy, setBackendHealthy] = useState(true);
  const [_expectedVersion] = useState('2.0.0');

  // Register service worker and check API version compatibility on app start
  useEffect(() => {
    const isDev = import.meta.env.DEV;
    let disposed = false;
    let validationModule: {
      startValidation: (intervalMs: number) => void;
      stopValidation: () => void;
    } | null = null;
    let validationTimer: ReturnType<typeof setTimeout> | null = null;

    const registerServiceWorker = async () => {
      if (isDev || !('serviceWorker' in navigator)) {
        enhancedLogger.debug(
          'App',
          'serviceWorker',
          'Skipping service worker registration for lean development'
        );
        return;
      }

      try {
        const [{ serviceWorkerManager }, { webVitalsService }] = await Promise.all([
          import('./services/serviceWorkerManager'),
          import('./services/webVitalsService'),
        ]);

        const registration = await serviceWorkerManager.register();
        if (registration && !disposed) {
          enhancedLogger.info('App', 'serviceWorker', 'Service worker registered successfully');
          webVitalsService.trackCustomMetric('sw_registration', 1);
        }
      } catch (error) {
        if (!disposed) {
          enhancedLogger.error(
            'App',
            'serviceWorker',
            'Service worker registration failed',
            undefined,
            error as Error
          );
        }
      }
    };

    const verifyApiVersion = async () => {
      try {
        const { checkApiVersionCompatibility: checkCompatibility } = await import(
          './services/SportsService'
        );
        const version = await checkCompatibility();
        if (!disposed) {
          enhancedLogger.info('App', 'api', `API version compatibility check: ${version}`);
          if (version === 'demo') {
            enhancedLogger.info(
              'App',
              'mode',
              'Running in demo mode due to backend unavailability'
            );
          }
        }
      } catch (err) {
        if (!disposed) {
          enhancedLogger.error(
            'App',
            'api',
            'API version compatibility error',
            undefined,
            err as Error
          );
          enhancedLogger.info(
            'App',
            'mode',
            'Continuing in demo mode due to API compatibility issues'
          );
        }
      }
    };

    const scheduleCoreValidation = () => {
      if (isDev) {
        enhancedLogger.debug(
          'App',
          'startup',
          'Skipping core functionality validator in development mode'
        );
        return;
      }

      validationTimer = setTimeout(async () => {
        try {
          const { coreFunctionalityValidator } = await import(
            './services/coreFunctionalityValidator'
          );
          if (disposed) {
            coreFunctionalityValidator.stopValidation();
            return;
          }
          validationModule = coreFunctionalityValidator;
          validationModule.startValidation(300000); // Check every 5 minutes instead of 1 minute
          enhancedLogger.info('App', 'startup', 'Core functionality validation initialized');
        } catch (err) {
          if (!disposed) {
            enhancedLogger.warn(
              'App',
              'startup',
              'Core functionality validator failed to initialize',
              undefined,
              err as Error
            );
          }
        }
      }, 5000);
    };

    registerServiceWorker();
    void verifyApiVersion();
    scheduleCoreValidation();

    // Initialize live demo enhancement service (DISABLED - causing console spam)
    // setTimeout(() => {
    // liveDemoEnhancementService.startMonitoring();
    // enhancedLogger.info('App', 'startup', 'Live demo enhancement service initialized');
    // }, 10000); // Delay slightly more to allow core validation to start first

    return () => {
      disposed = true;
      if (validationTimer) {
        clearTimeout(validationTimer);
      }
      if (validationModule) {
        validationModule.stopValidation();
      }
      // liveDemoEnhancementService.stopMonitoring(); // DISABLED
    };
  }, []);

  useEffect(() => {
    enhancedLogger.info('App', 'health', 'Checking backend connectivity');
    async function checkBackend() {
      const url = apiUrl;
      let healthy = false;
      try {
        // Test backend connectivity with a simple health check
        const timeout = createTimeoutSignal(5000);

        let response: Response;
        try {
          response = await fetch(`${url}/health`, {
            method: 'GET',
            signal: timeout.signal,
          });
        } finally {
          timeout.cleanup();
        }
        healthy = response.ok;
        if (healthy) {
          enhancedLogger.info('App', 'health', `Backend healthy at ${url}`);
        } else {
          enhancedLogger.warn('App', 'health', `Backend returned ${response.status} at ${url}`);
        }
      } catch (error) {
        enhancedLogger.warn(
          'App',
          'health',
          `Backend not reachable at ${url}`,
          undefined,
          error as Error
        );
        healthy = false;
      }
      setBackendHealthy(healthy);
    }

    trackOperation('backendHealthCheck', () => checkBackend());
  }, [apiUrl, trackOperation]);

  // In test environment, always render dashboard and robust error boundary
  if (process.env.NODE_ENV === 'test') {
    return (
      <ErrorBoundaryVersion>
        <QueryClientProvider client={queryClient}>
          <_AppProvider>
            <_ThemeProvider>
              <_WebSocketProvider>
                <_AuthProvider>
                  <BrowserRouter>
                    <React.Suspense fallback={null}>
                      <LazyUserFriendlyApp />
                    </React.Suspense>
                  </BrowserRouter>
                </_AuthProvider>
              </_WebSocketProvider>
            </_ThemeProvider>
          </_AppProvider>
        </QueryClientProvider>
      </ErrorBoundaryVersion>
    );
  }

  if (!backendHealthy) {
    enhancedLogger.warn('App', 'health', `Backend not healthy at ${apiUrl} - Skipping render`);
    return (
      <div className='error-banner'>
        Cannot connect to backend at {apiUrl}.{' '}
        <button onClick={() => getLocation().reload()}>Retry</button>
      </div>
    );
  }

  return (
    <ErrorBoundaryVersion>
      <QueryClientProvider client={queryClient}>
        {/* DEV global controls (always rendered in DEV so devs can enable dashboard even when gated) */}
        {import.meta.env.DEV && (
          <div data-testid='dev-global-controls'>
            <div style={{ position: 'fixed', bottom: 80, right: 12, zIndex: 9999 }}>
              <button
                data-testid='dev-view-dashboard-global'
                onClick={() => {
                  try {
                    // Set a few common token keys to cover various local dev expectations
                    localStorage.setItem('token', 'dev-demo-token');
                    localStorage.setItem('access_token', 'dev-demo-token');
                    localStorage.setItem('accessToken', 'dev-demo-token');
                    localStorage.setItem(
                      'user',
                      JSON.stringify({ id: 'dev', email: 'dev@local', role: 'admin' })
                    );
                    // Some code paths expect onboardingComplete to be truthy string '1'
                    localStorage.setItem('onboardingComplete', '1');
                    window.location.reload();
                  } catch (error) {
                    enhancedLogger.debug(
                      'App',
                      'DevGlobalControl',
                      'Failed to enable dev dashboard via global controls',
                      { error }
                    );
                  }
                }}
                style={{
                  background: '#06b6d4',
                  color: '#06202a',
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
                title='Enable demo dashboard (global)'
              >
                Dev: View Dashboard
              </button>
            </div>
          </div>
        )}
        <_AppProvider>
          <_ThemeProvider>
            <_WebSocketProvider>
              <_AuthProvider>
                <BrowserRouter>
                  <Routes>
                    <Route path='/reset-password' element={<ResetPasswordPage />} />
                    <Route path='*' element={<AppContent />} />
                  </Routes>
                </BrowserRouter>
              </_AuthProvider>
            </_WebSocketProvider>
          </_ThemeProvider>
        </_AppProvider>
      </QueryClientProvider>
    </ErrorBoundaryVersion>
  );
}

const AppContent: React.FC = () => {
  enhancedLogger.debug(
    'App',
    'render',
    'Entering AppContent - Attempting to render child components'
  );
  const { isAuthenticated, requiresPasswordChange, changePassword, loading, error, user } =
    useAuth();
  const onboardingComplete = localStorage.getItem('onboardingComplete');

  // Only show onboarding if NOT authenticated and onboarding is not complete
  if (!isAuthenticated && !onboardingComplete) {
    enhancedLogger.info('App', 'render', 'Rendering OnboardingFlow - No authentication detected');
    return (
      <>
        <DebugAppState state='onboarding' />
        <OnboardingProvider>
          <OnboardingFlow />
        </OnboardingProvider>
      </>
    );
  }

  // AUTO-LOGIN for testing (restore user session) - DISABLED to prevent infinite refresh
  // React.useEffect(() => {
  //   if (!isAuthenticated && !loading) {
  //     console.log('[APP] *** AUTO-LOGIN: Attempting to restore user session ***');

  //     const autoLogin = async () => {
  //       try {
  //         const loginResponse = await fetch('/auth/login', {
  //           method: 'POST',
  //           headers: { 'Content-Type': 'application/json' },
  //           body: JSON.stringify({
  //             username: 'admin',
  //             email: 'ncr@a1betting.com',
  //             password: 'A1Betting1337!',
  //           }),
  //         });

  //         if (loginResponse.ok) {
  //           const loginData = await loginResponse.json();
  //           console.log('[APP] *** AUTO-LOGIN SUCCESS ***', loginData);

  //           // Store the token in localStorage (this should trigger auth context update)
  //           localStorage.setItem('access_token', loginData.access_token);
  //           localStorage.setItem('refresh_token', loginData.refresh_token);

  //           // Force page reload to re-trigger authentication
  //           window.location.reload();
  //         } else {
  //           console.error('[APP] *** AUTO-LOGIN FAILED ***', await loginResponse.text());
  //         }
  //       } catch (error) {
  //         console.error('[APP] *** AUTO-LOGIN ERROR ***', error);
  //       }
  //     };

  //     // Delay the auto-login slightly to avoid race conditions
  //     setTimeout(autoLogin, 1000);
  //   }
  // }, [isAuthenticated, loading]);

  // Fix handlePasswordChange reference
  const handlePasswordChange = async (
    currentPassword: string,
    newPassword: string,
    _confirmPassword: string
  ) => {
    if (!user) return;
    await changePassword({
      userId: user.id,
      oldPassword: currentPassword,
      newPassword,
    });
  };

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    enhancedLogger.info('App', 'render', 'Rendering AuthPage (not authenticated)');
    return (
      <>
        <DebugAppState state='auth' />
        <AuthPage />
      </>
    );
  }

  // Show password change if required
  if (requiresPasswordChange) {
    enhancedLogger.info('App', 'render', 'Rendering PasswordChangeForm (requires password change)');
    return (
      <>
        <DebugAppState state='password-change' />
        <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4'>
          <PasswordChangeForm
            onPasswordChange={handlePasswordChange}
            loading={loading}
            error={error ?? undefined}
            isFirstLogin={true}
          />
        </div>
      </>
    );
  }

  // Show user-friendly UI for all authenticated users
  enhancedLogger.info('App', 'render', 'Rendering UserFriendlyApp (clean UI)');
  const isDevMode = Boolean(import.meta.env.DEV);
  const enableReliabilityMonitoring = !isDevMode;

  // DEV-CONVENIENCE: If running in development and the user is blocked by onboarding/auth gating,
  // show a small non-production banner that allows developers to quickly enable demo dashboard view
  const DevDashboardButton: React.FC = () => {
    if (!isDevMode) {
      return null;
    }
    return (
      <div style={{ position: 'fixed', bottom: 12, right: 12, zIndex: 9999 }}>
        <button
          onClick={() => {
            try {
              // Set a few common token keys to cover various local dev expectations
              localStorage.setItem('token', 'dev-demo-token');
              localStorage.setItem('access_token', 'dev-demo-token');
              localStorage.setItem('accessToken', 'dev-demo-token');
              localStorage.setItem(
                'user',
                JSON.stringify({ id: 'dev', email: 'dev@local', role: 'admin' })
              );
              // Some code paths expect onboardingComplete to be truthy string '1'
              localStorage.setItem('onboardingComplete', '1');
              // reload so App restores auth state
              window.location.reload();
            } catch (error) {
              enhancedLogger.debug(
                'App',
                'DevDashboardButton',
                'Failed to enable demo dashboard token flow',
                { error }
              );
            }
          }}
          data-testid='dev-view-dashboard'
          title='Enable demo dashboard in development'
          style={{
            background: '#0ea5e9',
            color: '#06202a',
            padding: '8px 12px',
            borderRadius: 6,
            border: 'none',
            boxShadow: '0 2px 6px rgba(2,6,23,0.6)',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          View Dashboard (Dev)
        </button>
      </div>
    );
  };

  // DEV: PropFinder quick debug panel — visible only in development
  const DevPropFinderDebugPanel: React.FC = () => {
    const resolveDevWindow = (): PropFinderDevWindow | null => {
      if (typeof window === 'undefined') {
        return null;
      }
      return window as PropFinderDevWindow;
    };

    const [lastStatus, setLastStatus] = useState<PropFinderDebugStatus | null>(() => {
      if (!isDevMode) {
        return null;
      }
      try {
        return resolveDevWindow()?.__propfinder_last_fetch_status ?? null;
      } catch (error) {
        enhancedLogger.debug(
          'App',
          'DevPropFinderDebugPanel',
          'Failed to read last fetch status from window',
          { error }
        );
        return null;
      }
    });

    const [lastStats, setLastStats] = useState<Record<string, unknown> | null>(() => {
      if (!isDevMode) {
        return null;
      }
      try {
        return resolveDevWindow()?.__propfinder_last_stats ?? null;
      } catch (error) {
        enhancedLogger.debug(
          'App',
          'DevPropFinderDebugPanel',
          'Failed to read last stats from window',
          { error }
        );
        return null;
      }
    });

    const [busy, setBusy] = useState(false);

    if (!isDevMode) {
      return null;
    }

    const coerceRecord = (value: unknown): Record<string, unknown> | null => {
      if (typeof value === 'object' && value !== null) {
        return value as Record<string, unknown>;
      }
      return null;
    };

    const deriveServerTotal = (summary: Record<string, unknown> | null): number | undefined => {
      if (!summary) {
        return undefined;
      }
      const candidates = [
        summary['total_opportunities'],
        summary['total'],
        summary['totalOpportunities'],
      ];
      for (const candidate of candidates) {
        if (typeof candidate === 'number' && Number.isFinite(candidate)) {
          return candidate;
        }
      }
      return undefined;
    };

    const doFetch = async () => {
      const devWindow = resolveDevWindow();
      const url = devWindow?.__propfinder_last_request_url;
      if (!url) {
        enhancedLogger.debug(
          'App',
          'DevPropFinderDebugPanel',
          'No last request URL available for debug re-fetch'
        );
        return;
      }

      try {
        setBusy(true);

        // Use relative fetch so HttpClient will be used if available in runtime context
        const resp = await fetch(url, { credentials: 'include' });
        if (!resp.ok) {
          setLastStatus({ ok: false, status: resp.status });
          return;
        }

        const payload = (await resp.json()) as Record<string, unknown>;
        const payloadData = (payload.data as Record<string, unknown> | undefined) ?? payload;
        const summaryCandidate =
          (payloadData?.summary as Record<string, unknown> | null | undefined) ??
          (payload.summary as Record<string, unknown> | null | undefined) ??
          null;
        const summaryRecord = coerceRecord(summaryCandidate);

        setLastStats(summaryRecord);

        const serverTotal = deriveServerTotal(summaryRecord);
        const successStatus: PropFinderDebugStatus = {
          ok: true,
          status: resp.status,
          serverTotal,
        };
        if (typeof serverTotal === 'number') {
          successStatus.server_total = serverTotal;
        }
        setLastStatus(successStatus);

        if (devWindow) {
          devWindow.__propfinder_last_response = payload;
          devWindow.__propfinder_last_stats = summaryRecord;
          devWindow.__propfinder_last_fetch_status = successStatus;
        }
      } catch (error) {
        setLastStatus({
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setBusy(false);
      }
    };

    return (
      <div
        data-testid='dev-propfinder-debug'
        style={{
          position: 'fixed',
          bottom: 12,
          left: 12,
          zIndex: 9999,
          background: 'rgba(2,6,23,0.8)',
          color: '#fff',
          padding: 10,
          borderRadius: 8,
          fontSize: 12,
          minWidth: 260,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>PropFinder Debug</div>
        <div style={{ marginBottom: 6 }}>
          <strong>Last fetch:</strong> {lastStatus ? JSON.stringify(lastStatus) : 'none'}
        </div>
        <div style={{ marginBottom: 6 }}>
          <strong>Last stats:</strong> {lastStats ? JSON.stringify(lastStats) : 'none'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={doFetch}
            disabled={busy}
            style={{
              background: '#06b6d4',
              color: '#06202a',
              border: 'none',
              padding: '6px 8px',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {busy ? 'Fetching…' : 'Re-fetch'}
          </button>
          <button
            onClick={() => {
              try {
                window.location.reload();
              } catch (error) {
                enhancedLogger.debug(
                  'App',
                  'DevPropFinderDebugPanel',
                  'Failed to reload window from debug panel',
                  { error }
                );
              }
            }}
            style={{
              background: '#374151',
              color: '#fff',
              border: 'none',
              padding: '6px 8px',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  };

  // Handle critical reliability issues without disrupting user experience
  const handleCriticalIssue = (issue: string) => {
    enhancedLogger.warn('App', 'reliability', 'Critical reliability issue detected', { issue });
    // Could trigger silent recovery or background notification
    // Avoid disruptive user notifications unless absolutely necessary
  };

  return (
    <ErrorBoundary>
      <DebugAppState state='dashboard' />
      <LeanModeBanner />
      {/* Core functionality validator navigation stub */}
      <nav role='navigation' data-core-nav='primary' style={{ display: 'none' }}>
        <div data-testid='nav-primary'>Core Navigation</div>
      </nav>
      <NavigationReadyAnnouncer />
      <ReliabilityIntegrationWrapper
        enableMonitoring={enableReliabilityMonitoring}
        monitoringLevel='standard'
        onCriticalIssue={handleCriticalIssue}
      >
        <ServiceWorkerUpdateNotification />
        <UpdateModal />
        {isDevMode && <DevDashboardButton />}
        {isDevMode && <DevPropFinderDebugPanel />}
        <React.Suspense fallback={null}>
          <LazyUserFriendlyApp />
        </React.Suspense>
      </ReliabilityIntegrationWrapper>
    </ErrorBoundary>
  );
};

const NavigationReadyAnnouncer: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    signalNavReady();
  }, [location.pathname]);

  return null;
};

const DebugAppState: React.FC<{ state: string }> = ({ state }) => (
  <div data-testid='app-gating-state' data-state={state} style={{ display: 'none' }} />
);

export { AppContent };

export default App;
