import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Zap } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'quantum';
  title: string;
  message?: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

interface NotificationToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

export const _NotificationToast: React.FC<NotificationToastProps> = ({ toast, onDismiss }) => {
  const { id, type, title, message, duration = 5000, actions = [] } = toast;

  useEffect(() => {
    if (duration > 0) {
      const _timer = setTimeout(() => {
        onDismiss(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);

  const _typeConfig = {
    success: {
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-600',
      border: 'border-green-400/50',
      glow: 'shadow-[0_0_20px_rgba(34,197,94,0.4)]',
      bg: 'from-green-900/20 to-emerald-900/20',
    },
    error: {
      icon: AlertCircle,
      gradient: 'from-red-500 to-orange-600',
      border: 'border-red-400/50',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]',
      bg: 'from-red-900/20 to-orange-900/20',
    },
    warning: {
      icon: AlertTriangle,
      gradient: 'from-yellow-500 to-orange-500',
      border: 'border-yellow-400/50',
      glow: 'shadow-[0_0_20px_rgba(251,191,36,0.4)]',
      bg: 'from-yellow-900/20 to-orange-900/20',
    },
    info: {
      icon: Info,
      gradient: 'from-blue-500 to-cyan-600',
      border: 'border-blue-400/50',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.4)]',
      bg: 'from-blue-900/20 to-cyan-900/20',
    },
    quantum: {
      icon: Zap,
      gradient: 'from-purple-500 via-pink-500 to-indigo-500',
      border: 'border-purple-400/50',
      glow: 'shadow-[0_0_25px_rgba(168,85,247,0.5)]',
      bg: 'from-purple-900/20 via-pink-900/20 to-indigo-900/20',
    },
  };

  const _config = typeConfig[type];
  const _IconComponent = config.icon;

  const _toastVariants = {
    hidden: {
      opacity: 0,
      y: -50,
      scale: 0.9,
      x: 300,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      x: 0,
      transition: {
        type: 'spring',
        duration: 0.5,
        bounce: 0.3,
      },
    },
    exit: {
      opacity: 0,
      x: 300,
      scale: 0.9,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <motion.div
      className={`
        relative max-w-sm w-full backdrop-blur-lg border rounded-xl p-4
        bg-gradient-to-br ${config.bg} ${config.border} ${config.glow}
        shadow-lg
      `}
      // @ts-expect-error TS(2322): Type '{ hidden: { opacity: number; y: number; scal... Remove this comment to see the full error message
      variants={toastVariants}
      initial='hidden'
      animate='visible'
      exit='exit'
      layout
    >
      {/* Cyber grid overlay */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='absolute inset-0 rounded-xl opacity-5'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className='w-full h-full rounded-xl'
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '10px 10px',
          }}
        />
      </div>

      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='relative flex items-start space-x-3'>
        {/* Icon */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          bg-gradient-to-r ${config.gradient}
        `}
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <IconComponent className='w-4 h-4 text-white' />
        </div>

        {/* Content */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex-1 min-w-0'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h4 className='text-sm font-semibold text-white mb-1'>{title}</h4>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          {message && <p className='text-sm text-gray-300 mb-3'>{message}</p>}

          {/* Actions */}
          {actions.length > 0 && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex space-x-2'>
              {actions.map((action, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <button
                  key={index}
                  onClick={action.action}
                  className={`
                    px-3 py-1 text-xs font-medium rounded-md transition-all
                    ${
                      action.variant === 'primary'
                        ? `bg-gradient-to-r ${config.gradient} text-white hover:opacity-90`
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Close button */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <button
          onClick={() => onDismiss(id)}
          className='flex-shrink-0 text-gray-400 hover:text-white transition-colors'
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <X className='w-4 h-4' />
        </button>
      </div>

      {/* Progress bar */}
      {duration > 0 && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <motion.div
          className='absolute bottom-0 left-0 h-1 bg-gradient-to-r from-white/30 to-white/60 rounded-b-xl'
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      )}

      {/* Animated border */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='absolute inset-0 rounded-xl overflow-hidden pointer-events-none'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full animate-[shimmer_2s_infinite]' />
      </div>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const _ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  position = 'top-right',
}) => {
  const _positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className={`fixed ${positionClasses[position]} z-50 space-y-3`}>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <AnimatePresence>
        {toasts.map(toast => (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <NotificationToast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationToast;
