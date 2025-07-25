import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getBackendUrl } from '../../utils/getBackendUrl';

import Register from '../Register';
import AccessRequestForm from './AccessRequestForm';
import LoginForm from './LoginForm';
import PasswordChangeForm from './PasswordChangeForm';
// Import the simple user-friendly app as the default dashboard
const UserFriendlyApp = React.lazy(() =>
  import('../user-friendly/UserFriendlyApp').then(module => ({ default: module.default }))
);

type AuthMode = 'login' | 'signup' | 'request-access' | 'password-change';

const _AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const { login, changePassword, loading, error, user, isAuthenticated, requiresPasswordChange } =
    useAuth();

  // Forgot password state
  // Removed unused forgotPasswordLoading state

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle'
  );
  const [forgotMessage, setForgotMessage] = useState('');

  // Redirect to password change if required
  useEffect(() => {
    if (isAuthenticated && requiresPasswordChange) {
      setAuthMode('password-change');
    }
  }, [isAuthenticated, requiresPasswordChange]);

  const _handleLogin = async (email: string, password: string) => {
    await login(email, password);
  };

  // Forgot password handler
  const _handleForgotPassword = async (email: string) => {
    // Removed unused setForgotPasswordLoading
    try {
      // Call backend endpoint
      await fetch(getBackendUrl() + '/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // Success and error handling can be implemented here if needed
    } catch (error) {
      // Network error handling can be implemented here if needed
    } finally {
      // Removed unused setForgotPasswordLoading
    }
  };

  const _submitForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatus('loading');
    setForgotMessage('');
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      setForgotStatus('success');
      setForgotMessage('If this email is registered, a password reset link has been sent.');
    } catch (err) {
      setForgotStatus('error');
      setForgotMessage('Failed to send reset email. Please try again later.');
    }
  };

  const _closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotStatus('idle');
    setForgotMessage('');
  };

  const _handleRequestAccess = () => {
    setAuthMode('request-access');
  };

  // Removed unused _handleBackToLogin

  const _handleAccessRequestSubmitted = () => {
    // Optionally switch back to login after successful request
    setTimeout(() => {
      setAuthMode('login');
    }, 3000);
  };

  const _handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    await changePassword({
      userId: user?.id || '',
      oldPassword: currentPassword,
      newPassword,
    });
  };

  // Registration success handler
  // Removed unused _handleRegisterSuccess

  // Redirect to dashboard after login
  useEffect(() => {
    if (isAuthenticated && !requiresPasswordChange) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, requiresPasswordChange, navigate]);

  // If authenticated and not in password change mode, render the simple UI dashboard
  if (isAuthenticated && !requiresPasswordChange) {
    return (
      <React.Suspense fallback={<div className='text-white p-8'>Loading dashboard...</div>}>
        <UserFriendlyApp />
      </React.Suspense>
    );
  }

  // Otherwise, render the auth UI as before
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4'>
      {/* Background Pattern */}
      <div className='absolute inset-0 bg-quantum-grid opacity-5' />
      {/* Animated Background Orbs */}
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute -top-10 -left-10 w-80 h-80 bg-cyber-primary/10 rounded-full blur-3xl animate-pulse' />
        <div className='absolute -bottom-10 -right-10 w-80 h-80 bg-cyber-accent/10 rounded-full blur-3xl animate-pulse delay-1000' />
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyber-purple/5 rounded-full blur-3xl animate-pulse delay-2000' />
      </div>
      <div className='relative z-10 w-full max-w-md'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-center mb-8'
        >
          <div className='inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-purple-500 rounded-2xl mb-6 shadow-lg shadow-yellow-400/25'>
            <span className='text-2xl font-bold text-slate-900'>PropGPT</span>
          </div>
          <h1 className='text-3xl font-bold text-yellow-400 mb-2'>PropGPT</h1>
          <p className='text-gray-400'>AI Prop Research & Analytics</p>
        </motion.div>
        {/* Auth Mode Toggle - Only show if not in password change mode */}
        {authMode !== 'password-change' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className='flex justify-center mb-8'
          >
            <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-lg p-1 flex'>
              <button
                onClick={() => setAuthMode('login')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  authMode === 'login'
                    ? 'bg-cyber-primary text-slate-900'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  authMode === 'signup'
                    ? 'bg-cyber-primary text-slate-900'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => setAuthMode('request-access')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  authMode === 'request-access'
                    ? 'bg-cyber-primary text-slate-900'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Request Access
              </button>
            </div>
          </motion.div>
        )}
        {/* Auth Forms */}
        <AnimatePresence mode='wait'>
          {authMode === 'login' && (
            <motion.div
              key='login'
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <LoginForm
                onLogin={_handleLogin}
                onForgotPassword={_handleForgotPassword}
                onRequestAccess={_handleRequestAccess}
                loading={loading}
                error={error ?? undefined}
              />
            </motion.div>
          )}
          {authMode === 'signup' && (
            <motion.div
              key='signup'
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Integrate Register form, pass AuthContext register and success handler */}

              <Register />
            </motion.div>
          )}
          {authMode === 'request-access' && (
            <motion.div
              key='request-access'
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AccessRequestForm onRequestSubmitted={_handleAccessRequestSubmitted} />
            </motion.div>
          )}
          {authMode === 'password-change' && (
            <motion.div
              key='password-change'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PasswordChangeForm
                onPasswordChange={_handlePasswordChange}
                loading={loading}
                error={error ?? undefined}
                userEmail={user?.email}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {/* Forgot Password Modal */}
        <AnimatePresence>
          {showForgotModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm'
            >
              <div className='bg-slate-900 rounded-xl shadow-lg p-8 w-full max-w-sm relative'>
                <button
                  className='absolute top-2 right-2 text-gray-400 hover:text-white text-xl'
                  onClick={_closeForgotModal}
                  aria-label='Close'
                >
                  &times;
                </button>
                <h2 className='text-xl font-bold text-white mb-2'>Forgot Password</h2>
                <p className='text-gray-400 mb-4'>
                  Enter your email address and we'll send you a password reset link.
                </p>
                <form onSubmit={_submitForgotPassword} className='space-y-4'>
                  <input
                    type='email'
                    className='w-full px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyber-primary'
                    placeholder='Email address'
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                  />
                  <button
                    type='submit'
                    className='w-full py-2 rounded-md bg-cyber-primary text-slate-900 font-semibold hover:bg-cyber-accent transition-colors disabled:opacity-60'
                    disabled={forgotStatus === 'loading'}
                  >
                    {forgotStatus === 'loading' ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
                {forgotMessage && (
                  <div
                    className={`mt-4 text-sm ${
                      forgotStatus === 'success' ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {forgotMessage}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className='mt-8 text-center'
        >
          <p className='text-xs text-gray-500'>© 2025 PropGPT. All rights reserved.</p>
          <div className='flex justify-center space-x-4 mt-2'>
            <button
              type='button'
              className='text-xs text-gray-500 hover:text-gray-400 transition-colors bg-transparent border-none p-0 cursor-pointer'
            >
              Terms
            </button>
            <button
              type='button'
              className='text-xs text-gray-500 hover:text-gray-400 transition-colors bg-transparent border-none p-0 cursor-pointer'
            >
              Privacy
            </button>
            <button
              type='button'
              className='text-xs text-gray-500 hover:text-gray-400 transition-colors bg-transparent border-none p-0 cursor-pointer'
            >
              Support
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default _AuthPage;
