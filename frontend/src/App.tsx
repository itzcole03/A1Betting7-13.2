/// <reference types="node" />
/// <reference types="electron" />
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AuthPage from './components/auth/AuthPage';
import PasswordChangeForm from './components/auth/PasswordChangeForm';
import { ErrorBoundary } from './components/core/ErrorBoundary';
import ServiceWorkerUpdateNotification from './components/core/ServiceWorkerUpdateNotification';
import { _AppProvider } from './contexts/AppContext';
import { _AuthProvider, useAuth } from './contexts/AuthContext';
import { _ThemeProvider } from './contexts/ThemeContext';
import { _WebSocketProvider } from './contexts/WebSocketContext';
import { OnboardingProvider } from './onboarding/OnboardingContext';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import { discoverBackend } from './services/backendDiscovery';
import { serviceWorkerManager } from './services/serviceWorkerManager';
import { webVitalsService } from './services/webVitalsService';
import { UpdateModal } from './update/UpdateModal';
import { getBackendUrl } from './utils/getBackendUrl';
import { createLazyComponent } from './utils/lazyLoading';
import { getLocation } from './utils/location';
import { usePerformanceTracking } from './utils/performance';

console.log(
  '[APP] Starting App.tsx rendering with React 19 features - Checking for module resolution issues'
);

// Lazy load components with performance tracking
const LazyOnboardingFlow = createLazyComponent(
  () => import('./onboarding/OnboardingFlow').then(module => ({ default: module.OnboardingFlow })),
  {
    fallback: () => <div className='text-white p-8'>Loading onboarding...</div>,
  }
);

const LazyUserFriendlyApp = createLazyComponent(
  () => import('./components/user-friendly/UserFriendlyApp'),
  {
    fallback: () => <div className='text-white p-8'>Loading dashboard...</div>,
  }
);

function App() {
  console.log(
    '[APP] Entering App component with React 19 features - Validating backend and imports'
  );
  const { trackOperation } = usePerformanceTracking('App');

  // Always use the proper backend URL for direct connection
  const [apiUrl, setApiUrl] = useState(getBackendUrl());
  const [backendHealthy, setBackendHealthy] = useState(true);
  const expectedVersion = '1.0.0';

  // Register service worker on app start
  useEffect(() => {
    console.log('[APP] Registering service worker with 2025 best practices');
    serviceWorkerManager.register().then(registration => {
      if (registration) {
        console.log('[APP] Service worker registered successfully');
        webVitalsService.trackCustomMetric('sw_registration', 1);
      }
    });
  }, []);

  useEffect(() => {
    console.log('[APP] Checking backend health - Potential caching impact');
    async function checkBackend() {
      let url = apiUrl;
      let healthy = false;
      try {
        const res = await fetch(`${url}/health`);
        healthy = res.ok;
        if (healthy) {
          const versionController = new AbortController();
          const versionTimeoutId = setTimeout(() => versionController.abort(), 10000); // 10s timeout
          let versionRes;
          try {
            versionRes = await fetch(`${url}/api/version`, { signal: versionController.signal });
          } catch (err) {
            if (
              typeof err === 'object' &&
              err !== null &&
              'name' in err &&
              (err as any).name === 'AbortError'
            ) {
              console.error('[APP] Backend version check timed out (10s)');
            } else {
              console.error('[APP] Backend version check failed:', err);
            }
            versionRes = undefined;
          } finally {
            clearTimeout(versionTimeoutId);
          }
          if (versionRes && versionRes.ok) {
            const data = await versionRes.json();
            if (data.version !== expectedVersion) {
              console.warn(`[APP] Backend version mismatch - Possible resolution conflict`);
            }
          }
        }
      } catch (err) {
        console.error('[APP] Backend check failed - Error:', err);
        const discovered = await discoverBackend();
        if (discovered) {
          url = discovered;
          setApiUrl(discovered);
        }
      }
      setBackendHealthy(healthy);
    }

    trackOperation('backendHealthCheck', () => checkBackend());
  }, [apiUrl, trackOperation]);

  if (!backendHealthy) {
    console.log(`[APP] Backend not healthy at ${apiUrl} - Skipping render`);
    return (
      <div className='error-banner'>
        Cannot connect to backend at {apiUrl}.{' '}
        <button onClick={() => getLocation().reload()}>Retry</button>
      </div>
    );
  }

  return (
    <QueryClientProvider client={new QueryClient()}>
      <_AppProvider>
        <_ThemeProvider>
          <_WebSocketProvider>
            <_AuthProvider>
              <BrowserRouter>
                <Routes>
                  <Route path='/reset-password' element={<ResetPasswordPage />} />
                  <Route path='*' element={<_AppContent />} />
                </Routes>
              </BrowserRouter>
            </_AuthProvider>
          </_WebSocketProvider>
        </_ThemeProvider>
      </_AppProvider>
    </QueryClientProvider>
  );
}

const _AppContent: React.FC = () => {
  console.log('[APP] Entering _AppContent - Attempting to render child components');
  const { isAuthenticated, requiresPasswordChange, changePassword, loading, error, user } =
    useAuth();
  const onboardingComplete = localStorage.getItem('onboardingComplete');

  // Only show onboarding if NOT authenticated and onboarding is not complete
  if (!isAuthenticated && !onboardingComplete) {
    console.log('[APP] Rendering OnboardingFlow - No authentication detected');
    return (
      <OnboardingProvider>
        <LazyOnboardingFlow />
      </OnboardingProvider>
    );
  }

  // AUTO-LOGIN for testing (restore user session)
  React.useEffect(() => {
    if (!isAuthenticated && !loading) {
      console.log('[APP] *** AUTO-LOGIN: Attempting to restore user session ***');

      const autoLogin = async () => {
        try {
          const loginResponse = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: 'admin',
              email: 'ncr@a1betting.com',
              password: 'A1Betting1337!',
            }),
          });

          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log('[APP] *** AUTO-LOGIN SUCCESS ***', loginData);

            // Store the token in localStorage (this should trigger auth context update)
            localStorage.setItem('access_token', loginData.access_token);
            localStorage.setItem('refresh_token', loginData.refresh_token);

            // Force page reload to re-trigger authentication
            window.location.reload();
          } else {
            console.error('[APP] *** AUTO-LOGIN FAILED ***', await loginResponse.text());
          }
        } catch (error) {
          console.error('[APP] *** AUTO-LOGIN ERROR ***', error);
        }
      };

      // Delay the auto-login slightly to avoid race conditions
      setTimeout(autoLogin, 1000);
    }
  }, [isAuthenticated, loading]);

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
    // eslint-disable-next-line no-console
    console.log('[APP] Rendering AuthPage (not authenticated)');
    return <AuthPage />;
  }

  // Show password change if required
  if (requiresPasswordChange) {
    // eslint-disable-next-line no-console
    console.log('[APP] Rendering PasswordChangeForm (requires password change)');
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4'>
        <PasswordChangeForm
          onPasswordChange={handlePasswordChange}
          loading={loading}
          error={error ?? undefined}
          isFirstLogin={true}
        />
      </div>
    );
  }

  // Show user-friendly UI for all authenticated users
  console.log('[APP] Rendering UserFriendlyApp (clean UI)');
  return (
    <ErrorBoundary>
      <ServiceWorkerUpdateNotification />
      <UpdateModal />
      <LazyUserFriendlyApp />
    </ErrorBoundary>
  );
};

export { _AppContent as AppContent };

export default App;
