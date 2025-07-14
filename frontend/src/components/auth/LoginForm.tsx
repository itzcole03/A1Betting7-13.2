import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';

interface LoginFormProps {
  onLogin?: (email: string, password: string) => Promise<void>;
  onForgotPassword?: (email: string) => void;
  onRequestAccess?: () => void;
  loading?: boolean;
  error?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  onForgotPassword,
  onRequestAccess,
  loading = false,
  error,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    if (!email.trim()) {
      setValidationError('Email address is required');
      return;
    }

    if (!password.trim()) {
      setValidationError('Password is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address');
      return;
    }

    if (onLogin) {
      try {
        await onLogin(email.trim(), password);
      } catch (err) {
        // Error is handled by parent component
      }
    }
  };

  const displayError = error || validationError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='max-w-md mx-auto'
    >
      <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-8'>
        <div className='text-center mb-8'>
          <div className='w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-cyber-primary to-cyber-accent rounded-full flex items-center justify-center'>
            <Shield className='w-8 h-8 text-slate-900' />
          </div>
          <h2 className='text-2xl font-bold text-white mb-2'>Welcome Back</h2>
          <p className='text-gray-400'>Sign in to access your A1 Betting dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {displayError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className='bg-red-500/10 border border-red-500/50 rounded-lg p-4'
            >
              <div className='flex items-center space-x-3'>
                <AlertCircle className='w-5 h-5 text-red-400 flex-shrink-0' />
                <p className='text-red-300 text-sm'>{displayError}</p>
              </div>
            </motion.div>
          )}

          <div>
            <label htmlFor='login-email' className='block text-sm font-medium text-gray-300 mb-2'>
              Email Address
            </label>
            <input
              id='login-email'
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='your.email@company.com'
              className='w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-primary focus:ring-2 focus:ring-cyber-primary/20 transition-all'
              disabled={loading}
              required
              autoComplete='email'
            />
          </div>

          <div>
            <label
              htmlFor='login-password'
              className='block text-sm font-medium text-gray-300 mb-2'
            >
              Password
            </label>
            <div className='relative'>
              <input
                id='login-password'
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder='Enter your password'
                className='w-full px-4 py-3 pr-12 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-primary focus:ring-2 focus:ring-cyber-primary/20 transition-all'
                disabled={loading}
                required
                autoComplete='current-password'
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors'
                disabled={loading}
              >
                {showPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
              </button>
            </div>
          </div>

          <div className='flex items-center justify-between'>
            <label className='flex items-center'>
              <input
                type='checkbox'
                className='w-4 h-4 text-cyber-primary bg-slate-700 border-slate-600 rounded focus:ring-cyber-primary focus:ring-2'
                disabled={loading}
              />
              <span className='ml-2 text-sm text-gray-300'>Remember me</span>
            </label>

            {onForgotPassword && (
              <button
                type='button'
                onClick={() => onForgotPassword(email)}
                className='text-sm text-cyber-primary hover:text-cyber-secondary transition-colors'
                disabled={loading}
              >
                Forgot password?
              </button>
            )}
          </div>

          <button
            type='submit'
            disabled={loading || !email.trim() || !password.trim()}
            className='w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyber-primary to-cyber-accent hover:from-cyber-secondary hover:to-cyber-primary rounded-lg text-slate-900 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? (
              <>
                <div className='w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin' />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <LogIn className='w-5 h-5' />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {onRequestAccess && (
          <div className='mt-6 pt-6 border-t border-slate-700/50 text-center'>
            <p className='text-sm text-gray-400 mb-3'>Don't have an account yet?</p>
            <button
              onClick={onRequestAccess}
              className='text-cyber-primary hover:text-cyber-secondary transition-colors font-medium'
              disabled={loading}
            >
              Request Access
            </button>
          </div>
        )}

        <div className='mt-4 text-center'>
          <p className='text-xs text-gray-500'>
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginForm;
