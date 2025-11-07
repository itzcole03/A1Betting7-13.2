import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X, Zap } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

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

type VariantKey = NonNullable<AlertProps['variant']>;

type VariantStyle = {
  container: string;
  icon: React.ElementType;
  iconClass: string;
  titleClass: string;
  accentClass: string;
  glow?: string;
};

const SIZE_CLASSES: Record<NonNullable<AlertProps['size']>, string> = {
  sm: 'p-3 text-sm',
  md: 'p-4 text-base',
  lg: 'p-6 text-lg',
};

const VARIANT_CONFIG: Record<VariantKey, VariantStyle> = {
  default: {
    container: 'bg-slate-800/50 border-slate-700/50 text-slate-200',
    icon: Info,
    iconClass: 'text-slate-400',
    titleClass: 'text-slate-100',
    accentClass: 'bg-slate-400',
  },
  success: {
    container: 'bg-green-900/20 border-green-500/30 text-green-100',
    icon: CheckCircle,
    iconClass: 'text-green-400',
    titleClass: 'text-green-300',
    accentClass: 'bg-green-400',
    glow: 'shadow-[0_0_20px_rgba(34,197,94,0.2)]',
  },
  warning: {
    container: 'bg-yellow-900/20 border-yellow-500/30 text-yellow-100',
    icon: AlertTriangle,
    iconClass: 'text-yellow-400',
    titleClass: 'text-yellow-300',
    accentClass: 'bg-yellow-400',
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.2)]',
  },
  error: {
    container: 'bg-red-900/20 border-red-500/30 text-red-100',
    icon: AlertCircle,
    iconClass: 'text-red-400',
    titleClass: 'text-red-300',
    accentClass: 'bg-red-400',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]',
  },
  info: {
    container: 'bg-blue-900/20 border-blue-500/30 text-blue-100',
    icon: Info,
    iconClass: 'text-blue-400',
    titleClass: 'text-blue-300',
    accentClass: 'bg-blue-400',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]',
  },
  cyber: {
    container: 'bg-cyan-900/20 border-cyan-500/30 text-cyan-100',
    icon: Zap,
    iconClass: 'text-cyan-400',
    titleClass: 'text-cyan-300',
    accentClass: 'bg-cyan-400',
    glow: 'shadow-[0_0_25px_rgba(34,211,238,0.3)]',
  },
};

const ALERT_VARIANTS = {
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
} as const;

const SHIMMER_VARIANTS: Variants = {
  animate: {
    x: ['-100%', '100%'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'default',
  size = 'md',
  title,
  description,
  children,
  icon,
  dismissible = false,
  onDismiss,
  className,
  animate = true,
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.();
    }, 300);
  };

  const variantConfig = VARIANT_CONFIG[variant];
  const sizeClasses = SIZE_CLASSES[size];

  const defaultIcon = React.createElement(variantConfig.icon, { className: 'w-5 h-5' });
  const iconNode = icon ?? defaultIcon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            'relative overflow-hidden rounded-lg border backdrop-blur-sm',
            sizeClasses,
            variantConfig.container,
            variantConfig.glow,
            className
          )}
          variants={ALERT_VARIANTS}
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
                variants={SHIMMER_VARIANTS}
                animate='animate'
              />
            </div>
          )}

          <div className='relative flex items-start space-x-3'>
            {/* Icon */}
            {iconNode ? (
              <div className={cn('flex-shrink-0', variantConfig.iconClass)}>
                {React.isValidElement(iconNode) ? (
                  React.cloneElement(iconNode, {
                    className: cn(
                      'h-5 w-5',
                      (iconNode.props as { className?: string } | undefined)?.className
                    ),
                  })
                ) : typeof iconNode === 'string' ? (
                  <span className='h-5 w-5' aria-hidden>
                    {iconNode}
                  </span>
                ) : (
                  iconNode
                )}
              </div>
            ) : null}

            {/* Content */}
            <div className='flex-1 min-w-0'>
              {title ? (
                <h4 className={cn('mb-1 font-semibold', variantConfig.titleClass)}>{title}</h4>
              ) : null}

              {description ? <p className='mb-2 text-sm opacity-90'>{description}</p> : null}

              {children ? <div className='text-sm opacity-90'>{children}</div> : null}
            </div>

            {/* Dismiss Button */}
            {dismissible && (
              <button
                onClick={handleDismiss}
                className={cn(
                  'flex-shrink-0 rounded-md p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 focus:ring-offset-transparent',
                  variantConfig.iconClass,
                  'hover:bg-white/10'
                )}
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
            className={cn(
              'absolute bottom-0 left-0 right-0 h-0.5 opacity-50',
              variantConfig.accentClass
            )}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Additional Alert components for compound pattern
export const AlertTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <h4 className={cn('mb-1 font-semibold', className)}>{children}</h4>;

export const AlertDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cn('text-sm opacity-90', className)}>{children}</div>;

export default Alert;
