/// <reference types="node" />
/// <reference types="electron" />
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AuthPage from './components/auth/AuthPage';
import PasswordChangeForm from './components/auth/PasswordChangeForm';
import ComprehensiveAdminDashboard from './components/comprehensive/ComprehensiveAdminDashboard';
import { ErrorBoundary } from './components/core/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import { discoverBackend } from './services/backendDiscovery';

// Navigation and component mapping

// Main App Content Component - Now uses comprehensive admin dashboard

const AppContent: React.FC = () => {
  const { isAuthenticated, requiresPasswordChange, changePassword, loading, error, user } =
    useAuth();

  console.log('🏠 [DEBUG] App component - comprehensive admin dashboard loading');

  // Handle password change
  const handlePasswordChange = async (
    currentPassword: string,
    newPassword: string,
    _confirmPassword: string
  ) => {
    // PasswordChangeRequest expects: userId, oldPassword, newPassword
    if (!user) return;
    await changePassword({
      userId: user.id,
      oldPassword: currentPassword,
      newPassword,
    });
  };

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Show password change if required
  if (requiresPasswordChange) {
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

  // Show comprehensive admin dashboard
  return (
    <ErrorBoundary>
      <ComprehensiveAdminDashboard />
    </ErrorBoundary>
  );
};

const queryClient = new QueryClient();

function App() {
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000');
  const [backendHealthy, setBackendHealthy] = useState(true);
  // Remove backendVersion, only warn if version mismatch
  const expectedVersion = '1.0.0'; // Update as needed
  /// <reference types="node" />

  useEffect(() => {
    async function checkBackend() {
      let url = apiUrl;
      let healthy = false;
      try {
        const res = await fetch(`${url}/api/health/status`);
        healthy = res.ok;
        if (healthy) {
          const versionRes = await fetch(`${url}/api/version`);
          if (versionRes.ok) {
            const data = await versionRes.json();
            if (data.version !== expectedVersion) {
              // Only warn, don't block
              console.warn(
                `Backend version mismatch! Frontend expects ${expectedVersion}, backend is ${data.version}`
              );
            }
          }
        }
      } catch {
        // Try discovery if not healthy
        const discovered = await discoverBackend();
        if (discovered) {
          url = discovered;
          setApiUrl(discovered);
          const res = await fetch(`${discovered}/api/health/status`);
          healthy = res.ok;
          if (healthy) {
            const versionRes = await fetch(`${discovered}/api/version`);
            if (versionRes.ok) {
              const data = await versionRes.json();
              if (data.version !== expectedVersion) {
                console.warn(
                  `Backend version mismatch! Frontend expects ${expectedVersion}, backend is ${data.version}`
                );
              }
            }
          }
        }
      }
      setBackendHealthy(healthy);
    }
    checkBackend();
  }, [apiUrl]);

  if (!backendHealthy) {
    return (
      <div className='error-banner'>
        Cannot connect to backend at {apiUrl}.{' '}
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path='/reset-password' element={<ResetPasswordPage />} />
            <Route path='*' element={<AppContent />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Export AppContent for use without AuthProvider wrapper
export { AppContent };

export default App;
