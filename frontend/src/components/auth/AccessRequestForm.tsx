import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { accessRequestService, AccessRequestResponse } from '../../services/AccessRequestService';

interface AccessRequestFormProps {
  onRequestSubmitted?: (response: AccessRequestResponse) => void;
}

const AccessRequestForm: React.FC<AccessRequestFormProps> = ({ onRequestSubmitted }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<AccessRequestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email.trim()) {
      setError('Email address is required');
      return;
    }

    if (!accessRequestService.isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Check for existing request first
      const existingRequest = await accessRequestService.checkExistingRequest(email);

      if (existingRequest) {
        setError(
          `You already have a ${existingRequest.status} access request. Please check your email or contact support.`
        );
        setIsSubmitting(false);
        return;
      }

      // Submit new request
      const requestResponse = await accessRequestService.submitAccessRequest({
        email: email.trim(),
        message: message.trim() || undefined,
      });

      setResponse(requestResponse);
      setShowSuccess(true);

      // Reset form
      setEmail('');
      setMessage('');

      // Notify parent component
      if (onRequestSubmitted) {
        onRequestSubmitted(requestResponse);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit access request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowSuccess(false);
    setResponse(null);
    setError(null);
    setEmail('');
    setMessage('');
  };

  if (showSuccess && response?.success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className='max-w-md mx-auto'
      >
        <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-8 text-center'>
          <div className='w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center'>
            <CheckCircle className='w-8 h-8 text-white' />
          </div>

          <h3 className='text-xl font-bold text-white mb-4'>Request Submitted!</h3>

          <p className='text-gray-300 mb-6 leading-relaxed'>{response.message}</p>

          <div className='bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6'>
            <div className='flex items-start space-x-3'>
              <Info className='w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0' />
              <div className='text-left'>
                <p className='text-blue-300 font-medium text-sm'>What happens next?</p>
                <ul className='text-blue-200/80 text-xs mt-2 space-y-1'>
                  <li>• Your request will be reviewed by the admin team</li>
                  <li>• You'll receive an email notification with the decision</li>
                  <li>• If approved, you'll get temporary login credentials</li>
                  <li>• Check your spam folder if you don't see our email</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={resetForm}
            className='px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors'
          >
            Submit Another Request
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='max-w-md mx-auto'
    >
      <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-8'>
        <div className='text-center mb-8'>
          <div className='w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-cyber-primary to-cyber-accent rounded-full flex items-center justify-center'>
            <Mail className='w-8 h-8 text-slate-900' />
          </div>
          <h2 className='text-2xl font-bold text-white mb-2'>Request Access</h2>
          <p className='text-gray-400'>
            Enter your email to request access to the A1 Betting platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className='bg-red-500/10 border border-red-500/50 rounded-lg p-4'
            >
              <div className='flex items-center space-x-3'>
                <AlertCircle className='w-5 h-5 text-red-400 flex-shrink-0' />
                <p className='text-red-300 text-sm'>{error}</p>
              </div>
            </motion.div>
          )}

          <div>
            <label htmlFor='email' className='block text-sm font-medium text-gray-300 mb-2'>
              Email Address <span className='text-red-400'>*</span>
            </label>
            <input
              id='email'
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='your.email@company.com'
              className='w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-primary focus:ring-2 focus:ring-cyber-primary/20 transition-all'
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label htmlFor='message' className='block text-sm font-medium text-gray-300 mb-2'>
              Additional Message <span className='text-gray-500'>(optional)</span>
            </label>
            <textarea
              id='message'
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder='Tell us about your intended use case or any additional context...'
              rows={3}
              className='w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-primary focus:ring-2 focus:ring-cyber-primary/20 transition-all resize-none'
              disabled={isSubmitting}
              maxLength={500}
            />
            <p className='text-xs text-gray-500 mt-1'>{message.length}/500 characters</p>
          </div>

          <div className='bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4'>
            <div className='flex items-start space-x-3'>
              <Info className='w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0' />
              <div>
                <p className='text-yellow-300 font-medium text-sm'>Access Review Process</p>
                <p className='text-yellow-200/80 text-xs mt-1'>
                  All access requests are manually reviewed. You'll receive an email notification
                  with the decision, typically within 24-48 hours.
                </p>
              </div>
            </div>
          </div>

          <button
            type='submit'
            disabled={isSubmitting || !email.trim()}
            className='w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyber-primary to-cyber-accent hover:from-cyber-secondary hover:to-cyber-primary rounded-lg text-slate-900 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isSubmitting ? (
              <>
                <div className='w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin' />
                <span>Submitting Request...</span>
              </>
            ) : (
              <>
                <Send className='w-5 h-5' />
                <span>Submit Access Request</span>
              </>
            )}
          </button>
        </form>

        <div className='mt-6 pt-6 border-t border-slate-700/50 text-center'>
          <p className='text-xs text-gray-500'>
            Already have access?{' '}
            <button
              onClick={() => (window.location.href = '/login')}
              className='text-cyber-primary hover:text-cyber-secondary transition-colors'
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default AccessRequestForm;
