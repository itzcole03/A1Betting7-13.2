/**
 * Service Worker Update Component - React 19 Best Practices
 *
 * Features:
 * - useOptimistic for instant UI updates
 * - Modern notification patterns
 * - Smooth animations with Framer Motion
 */

import { AnimatePresence, motion } from 'framer-motion';
import React, { useActionState, useState } from 'react';
import { useServiceWorkerUpdate } from '../../services/serviceWorkerManager';

interface ServiceWorkerUpdateProps {
  className?: string;
}

// Action for applying service worker updates
async function applyUpdateAction(
  previousState: { updating: boolean; error: string | null },
  formData: FormData
) {
  try {
    const { serviceWorkerManager } = await import('../../services/serviceWorkerManager');
    serviceWorkerManager.applyUpdate();

    return {
      updating: true,
      error: null,
    };
  } catch (error) {
    return {
      updating: false,
      error: error instanceof Error ? error.message : 'Update failed',
    };
  }
}

export const ServiceWorkerUpdateNotification: React.FC<ServiceWorkerUpdateProps> = ({
  className = '',
}) => {
  const { hasUpdate, isInstalling, error } = useServiceWorkerUpdate();

  // Standard optimistic UI state
  const [optimisticState, setOptimisticState] = useState<{
    updating: boolean;
    error: string | null;
  }>({ updating: false, error: null });

  // React 19: useActionState for form actions
  const [actionState, submitAction, isPending] = useActionState(applyUpdateAction, {
    updating: false,
    error: null,
  });

  const handleUpdate = () => {
    // Optimistically update UI
    setOptimisticState({ updating: true, error: null });

    // Submit the actual action
    const formData = new FormData();
    submitAction(formData);
  };

  if (!hasUpdate && !isInstalling && !error) {
    return null;
  }

  return (
    <AnimatePresence>
      {(hasUpdate || isInstalling || error) && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={`fixed top-4 right-4 z-50 max-w-sm ${className}`}
        >
          <div className='bg-gradient-to-br from-blue-600 to-purple-700 text-white rounded-lg shadow-lg border border-blue-500/20 backdrop-blur-sm'>
            <div className='p-4'>
              {error && (
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className='flex items-start space-x-3'
                >
                  <div className='flex-shrink-0'>
                    <svg className='w-5 h-5 text-red-400' fill='currentColor' viewBox='0 0 20 20'>
                      <path
                        fillRule='evenodd'
                        d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-sm font-medium'>Service Worker Error</h3>
                    <p className='mt-1 text-xs text-white/80'>{error}</p>
                  </div>
                </motion.div>
              )}

              {isInstalling && (
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className='flex items-start space-x-3'
                >
                  <div className='flex-shrink-0'>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <svg
                        className='w-5 h-5 text-blue-400'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                        />
                      </svg>
                    </motion.div>
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-sm font-medium'>Installing Update</h3>
                    <p className='mt-1 text-xs text-white/80'>
                      {optimisticState.updating
                        ? 'Applying update...'
                        : 'A new version is being installed.'}
                    </p>
                  </div>
                </motion.div>
              )}

              {hasUpdate && !isInstalling && (
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className='flex items-start space-x-3'
                >
                  <div className='flex-shrink-0'>
                    <svg className='w-5 h-5 text-green-400' fill='currentColor' viewBox='0 0 20 20'>
                      <path
                        fillRule='evenodd'
                        d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-sm font-medium'>Update Available</h3>
                    <p className='mt-1 text-xs text-white/80'>
                      A new version with improvements is ready.
                    </p>
                    <div className='mt-3 flex space-x-2'>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleUpdate}
                        disabled={isPending || optimisticState.updating}
                        className='px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        {isPending || optimisticState.updating ? (
                          <span className='flex items-center space-x-1'>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className='w-3 h-3'
                            >
                              <svg fill='currentColor' viewBox='0 0 20 20'>
                                <path
                                  fillRule='evenodd'
                                  d='M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z'
                                  clipRule='evenodd'
                                />
                              </svg>
                            </motion.div>
                            <span>Updating...</span>
                          </span>
                        ) : (
                          'Update Now'
                        )}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className='px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-xs font-medium transition-colors'
                      >
                        Later
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ServiceWorkerUpdateNotification;
