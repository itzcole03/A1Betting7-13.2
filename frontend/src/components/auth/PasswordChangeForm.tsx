import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Key, Shield } from 'lucide-react';

interface PasswordChangeFormProps {
  onPasswordChange?: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<void>;
  loading?: boolean;
  error?: string;
  isFirstLogin?: boolean;
  userEmail?: string;
}

const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({
  onPasswordChange,
  loading = false,
  error,
  isFirstLogin = false,
  userEmail,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validatePassword = (password: string) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    return checks;
  };

  const passwordChecks = validatePassword(newPassword);
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    if (!currentPassword.trim()) {
      setValidationError('Current password is required');
      return;
    }

    if (!newPassword.trim()) {
      setValidationError('New password is required');
      return;
    }

    if (!confirmPassword.trim()) {
      setValidationError('Password confirmation is required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError('New passwords do not match');
      return;
    }

    if (!isPasswordValid) {
      setValidationError('New password does not meet security requirements');
      return;
    }

    if (newPassword === currentPassword) {
      setValidationError('New password must be different from current password');
      return;
    }

    if (onPasswordChange) {
      try {
        await onPasswordChange(currentPassword, newPassword, confirmPassword);
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
          <div className='w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center'>
            {isFirstLogin ? (
              <Key className='w-8 h-8 text-white' />
            ) : (
              <Lock className='w-8 h-8 text-white' />
            )}
          </div>
          <h2 className='text-2xl font-bold text-white mb-2'>
            {isFirstLogin ? 'First Time Setup' : 'Change Password'}
          </h2>
          <p className='text-gray-400'>
            {isFirstLogin
              ? 'Please create a secure password for your account'
              : 'Update your password for enhanced security'}
          </p>
          {userEmail && <p className='text-sm text-cyber-primary mt-2'>{userEmail}</p>}
        </div>

        {isFirstLogin && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className='bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6'
          >
            <div className='flex items-start space-x-3'>
              <Shield className='w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0' />
              <div>
                <p className='text-blue-300 font-medium text-sm'>Welcome to A1 Betting Platform!</p>
                <p className='text-blue-200/80 text-xs mt-1'>
                  For security, you must create a new password before accessing your account.
                </p>
              </div>
            </div>
          </motion.div>
        )}

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
            <label
              htmlFor='current-password'
              className='block text-sm font-medium text-gray-300 mb-2'
            >
              {isFirstLogin ? 'Temporary Password' : 'Current Password'}
            </label>
            <div className='relative'>
              <input
                id='current-password'
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder={
                  isFirstLogin ? 'Enter your temporary password' : 'Enter current password'
                }
                className='w-full px-4 py-3 pr-12 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-primary focus:ring-2 focus:ring-cyber-primary/20 transition-all'
                disabled={loading}
                required
                autoComplete='current-password'
              />
              <button
                type='button'
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors'
                disabled={loading}
              >
                {showCurrentPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor='new-password' className='block text-sm font-medium text-gray-300 mb-2'>
              New Password
            </label>
            <div className='relative'>
              <input
                id='new-password'
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder='Enter your new password'
                className='w-full px-4 py-3 pr-12 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-primary focus:ring-2 focus:ring-cyber-primary/20 transition-all'
                disabled={loading}
                required
                autoComplete='new-password'
              />
              <button
                type='button'
                onClick={() => setShowNewPassword(!showNewPassword)}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors'
                disabled={loading}
              >
                {showNewPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
              </button>
            </div>

            {/* Password Requirements */}
            {newPassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className='mt-3 p-3 bg-slate-700/30 rounded-lg'
              >
                <p className='text-xs font-medium text-gray-300 mb-2'>Password Requirements:</p>
                <div className='space-y-1'>
                  {[
                    { key: 'length', label: 'At least 8 characters', check: passwordChecks.length },
                    {
                      key: 'uppercase',
                      label: 'One uppercase letter',
                      check: passwordChecks.uppercase,
                    },
                    {
                      key: 'lowercase',
                      label: 'One lowercase letter',
                      check: passwordChecks.lowercase,
                    },
                    { key: 'number', label: 'One number', check: passwordChecks.number },
                    {
                      key: 'special',
                      label: 'One special character',
                      check: passwordChecks.special,
                    },
                  ].map(({ key, label, check }) => (
                    <div key={key} className='flex items-center space-x-2'>
                      <CheckCircle
                        className={`w-3 h-3 ${check ? 'text-green-400' : 'text-gray-500'}`}
                      />
                      <span className={`text-xs ${check ? 'text-green-300' : 'text-gray-400'}`}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          <div>
            <label
              htmlFor='confirm-password'
              className='block text-sm font-medium text-gray-300 mb-2'
            >
              Confirm New Password
            </label>
            <div className='relative'>
              <input
                id='confirm-password'
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder='Confirm your new password'
                className='w-full px-4 py-3 pr-12 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-primary focus:ring-2 focus:ring-cyber-primary/20 transition-all'
                disabled={loading}
                required
                autoComplete='new-password'
              />
              <button
                type='button'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors'
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
              </button>
            </div>

            {/* Password Match Indicator */}
            {confirmPassword && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='mt-2'>
                {newPassword === confirmPassword ? (
                  <div className='flex items-center space-x-2 text-green-400'>
                    <CheckCircle className='w-4 h-4' />
                    <span className='text-xs'>Passwords match</span>
                  </div>
                ) : (
                  <div className='flex items-center space-x-2 text-red-400'>
                    <AlertCircle className='w-4 h-4' />
                    <span className='text-xs'>Passwords do not match</span>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          <button
            type='submit'
            disabled={
              loading || !isPasswordValid || newPassword !== confirmPassword || !currentPassword
            }
            className='w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyber-primary to-cyber-accent hover:from-cyber-secondary hover:to-cyber-primary rounded-lg text-slate-900 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? (
              <>
                <div className='w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin' />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <Lock className='w-5 h-5' />
                <span>{isFirstLogin ? 'Complete Setup' : 'Update Password'}</span>
              </>
            )}
          </button>
        </form>

        {isFirstLogin && (
          <div className='mt-6 pt-6 border-t border-slate-700/50 text-center'>
            <p className='text-xs text-gray-500'>
              By completing setup, you agree to our terms of service and privacy policy.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PasswordChangeForm;
