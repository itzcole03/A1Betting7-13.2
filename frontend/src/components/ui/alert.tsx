import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, X, Zap, AlertCircle } from 'lucide-react';

export interface AlertProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'cyber';
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  description?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  animate?: boolean;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'default',
  size = 'md',
  title,
  description,
  children,
  icon,
  dismissible = false,
  onDismiss,
  className = '',
  animate = true,
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.();
    }, 300);
  };

  const sizeClasses = {
    sm: 'p-3 text-sm',
    md: 'p-4 text-base',
    lg: 'p-6 text-lg',
  };

  const variantConfig = {
    default: {
      container: 'bg-slate-800/50 border-slate-700/50 text-slate-200',
      icon: Info,
      iconColor: 'text-slate-400',
      titleColor: 'text-slate-100',
    },
    success: {
      container: 'bg-green-900/20 border-green-500/30 text-green-100',
      icon: CheckCircle,
      iconColor: 'text-green-400',
      titleColor: 'text-green-300',
      glow: 'shadow-[0_0_20px_rgba(34,197,94,0.2)]',
    },
    warning: {
      container: 'bg-yellow-900/20 border-yellow-500/30 text-yellow-100',
      icon: AlertTriangle,
      iconColor: 'text-yellow-400',
      titleColor: 'text-yellow-300',
      glow: 'shadow-[0_0_20px_rgba(251,191,36,0.2)]',
    },
    error: {
      container: 'bg-red-900/20 border-red-500/30 text-red-100',
      icon: AlertCircle,
      iconColor: 'text-red-400',
      titleColor: 'text-red-300',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]',
    },
    info: {
      container: 'bg-blue-900/20 border-blue-500/30 text-blue-100',
      icon: Info,
      iconColor: 'text-blue-400',
      titleColor: 'text-blue-300',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]',
    },
    cyber: {
      container: 'bg-cyan-900/20 border-cyan-500/30 text-cyan-100',
      icon: Zap,
      iconColor: 'text-cyan-400',
      titleColor: 'text-cyan-300',
      glow: 'shadow-[0_0_25px_rgba(34,211,238,0.3)]',
    },
  };

  const config = variantConfig[variant];
  const IconComponent = icon || config.icon;

  const alertVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: -10,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: {
        duration: 0.2,
        ease: 'easeIn',
      },
    },
  };

  const shimmerVariants = {
    animate: {
      x: ['-100%', '100%'],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`
            relative rounded-lg border backdrop-blur-sm overflow-hidden
            ${sizeClasses[size]}
            ${config.container}
            ${config.glow || ''}
            ${className}
          `}
          variants={alertVariants}
          initial={animate ? 'hidden' : 'visible'}
          animate='visible'
          exit='exit'
          role='alert'
          aria-live='polite'
        >
          {/* Cyber grid overlay for cyber variant */}
          {variant === 'cyber' && (
            <div
              className='absolute inset-0 opacity-10 pointer-events-none'
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(34,211,238,0.1) 10px, rgba(34,211,238,0.1) 11px)',
              }}
            />
          )}

          {/* Shimmer effect for cyber variant */}
          {variant === 'cyber' && (
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              <motion.div
                className='absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent'
                variants={shimmerVariants}
                animate='animate'
              />
            </div>
          )}

          <div className='relative flex items-start space-x-3'>
            {/* Icon */}
            {IconComponent && (
              <div className={`flex-shrink-0 ${config.iconColor}`}>
                {React.isValidElement(IconComponent) ? (
                  IconComponent
                ) : (
                  <IconComponent className='w-5 h-5' />
                )}
              </div>
            )}

            {/* Content */}
            <div className='flex-1 min-w-0'>
              {title && <h4 className={`font-semibold mb-1 ${config.titleColor}`}>{title}</h4>}

              {description && <p className='text-sm opacity-90 mb-2'>{description}</p>}

              {children && <div className='text-sm opacity-90'>{children}</div>}
            </div>

            {/* Dismiss Button */}
            {dismissible && (
              <button
                onClick={handleDismiss}
                className={`
                  flex-shrink-0 p-1 rounded-md transition-colors
                  ${config.iconColor} hover:bg-white/10
                  focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 focus:ring-offset-transparent
                `}
                aria-label='Dismiss alert'
              >
                <X className='w-4 h-4' />
              </button>
            )}
          </div>

          {/* Pulsing border for cyber variant */}
          {variant === 'cyber' && (
            <div className='absolute inset-0 rounded-lg border border-cyan-400/50 animate-pulse pointer-events-none' />
          )}

          {/* Bottom accent line */}
          <div
            className={`absolute bottom-0 left-0 right-0 h-0.5 ${config.iconColor.replace('text-', 'bg-')} opacity-50`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Additional Alert components for compound pattern
export const AlertTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <h4 className={`font-semibold mb-1 ${className}`}>{children}</h4>;

export const AlertDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`text-sm opacity-90 ${className}`}>{children}</div>;

export default Alert;
