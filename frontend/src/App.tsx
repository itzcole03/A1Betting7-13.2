/// <reference types="node" />
/// <reference types="electron" />
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AuthPage from './components/auth/AuthPage';
import PasswordChangeForm from './components/auth/PasswordChangeForm';
import { ErrorBoundary } from './components/core/ErrorBoundary';
import { _AuthProvider, useAuth } from './contexts/AuthContext';
import { OnboardingProvider } from './onboarding/OnboardingContext';
import { OnboardingFlow } from './onboarding/OnboardingFlow';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import { discoverBackend } from './services/backendDiscovery';
import { UpdateModal } from './update/UpdateModal';
import { getBackendUrl } from './utils/getBackendUrl';
import { getLocation } from './utils/location';

console.log('[APP] Starting App.tsx rendering - Checking for module resolution issues');

function App() {
  console.log('[APP] Entering App component - Validating backend and imports');
  const [apiUrl, setApiUrl] = useState(getBackendUrl());
  const [backendHealthy, setBackendHealthy] = useState(true);
  const expectedVersion = '1.0.0';

  useEffect(() => {
    console.log('[APP] Checking backend health - Potential caching impact');
    async function checkBackend() {
      let url = apiUrl;
      let healthy = false;
      try {
        const res = await fetch(`${url}/api/health/status`);
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
    checkBackend();
  }, [apiUrl]);

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
      <_AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path='/reset-password' element={<ResetPasswordPage />} />
            <Route path='*' element={<_AppContent />} />
          </Routes>
        </BrowserRouter>
      </_AuthProvider>
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
        <OnboardingFlow />
      </OnboardingProvider>
    );
  }

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
  console.log('[APP] Rendering UserFriendlyApp (simple UI)');
  const UserFriendlyApp = React.lazy(() =>
    import('./components/user-friendly/UserFriendlyApp').then(module => ({
      default: module.default,
    }))
  );
  return (
    <ErrorBoundary>
      <UpdateModal />
      <React.Suspense fallback={<div className='text-white p-8'>Loading dashboard...</div>}>
        <UserFriendlyApp />
      </React.Suspense>
    </ErrorBoundary>
  );
};

export { _AppContent as AppContent };

export default App;
