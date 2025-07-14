import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Zap, Brain, Target, Activity } from 'lucide-react';

export interface LoadingOverlayProps {
  isLoading: boolean;
  variant?: 'default' | 'cyber' | 'quantum' | 'matrix' | 'pulse';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  progress?: number; // 0-100
  backdrop?: 'blur' | 'solid' | 'transparent';
  className?: string;
  children?: React.ReactNode; // Content to show while loading
  onCancel?: () => void; // Optional cancel function
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  variant = 'default',
  size = 'md',
  message = 'Loading...',
  progress,
  backdrop = 'blur',
  className = '',
  children,
  onCancel,
}) => {
  const sizeConfig = {
    sm: { spinner: 'w-6 h-6', text: 'text-sm', container: 'p-4' },
    md: { spinner: 'w-8 h-8', text: 'text-base', container: 'p-6' },
    lg: { spinner: 'w-12 h-12', text: 'text-lg', container: 'p-8' },
    xl: { spinner: 'w-16 h-16', text: 'text-xl', container: 'p-12' },
  };

  const backdropClasses = {
    blur: 'backdrop-blur-md bg-black/60',
    solid: 'bg-slate-900/90',
    transparent: 'bg-transparent',
  };

  const getVariantConfig = () => {
    switch (variant) {
      case 'cyber':
        return {
          icon: Zap,
          iconColor: 'text-cyan-400',
          gradient: 'from-cyan-400 to-blue-500',
          glow: 'shadow-[0_0_30px_rgba(34,211,238,0.5)]',
          border: 'border-cyan-500/30',
          bg: 'bg-slate-900/90',
        };
      case 'quantum':
        return {
          icon: Brain,
          iconColor: 'text-purple-400',
          gradient: 'from-purple-400 to-pink-500',
          glow: 'shadow-[0_0_30px_rgba(168,85,247,0.5)]',
          border: 'border-purple-500/30',
          bg: 'bg-purple-900/20',
        };
      case 'matrix':
        return {
          icon: Activity,
          iconColor: 'text-green-400',
          gradient: 'from-green-400 to-emerald-500',
          glow: 'shadow-[0_0_30px_rgba(34,197,94,0.5)]',
          border: 'border-green-500/30',
          bg: 'bg-green-900/20',
        };
      case 'pulse':
        return {
          icon: Target,
          iconColor: 'text-yellow-400',
          gradient: 'from-yellow-400 to-orange-500',
          glow: 'shadow-[0_0_30px_rgba(251,191,36,0.5)]',
          border: 'border-yellow-500/30',
          bg: 'bg-yellow-900/20',
        };
      default:
        return {
          icon: Loader2,
          iconColor: 'text-blue-400',
          gradient: 'from-blue-400 to-cyan-500',
          glow: 'shadow-[0_0_20px_rgba(59,130,246,0.4)]',
          border: 'border-blue-500/30',
          bg: 'bg-slate-800/90',
        };
    }
  };

  const config = getVariantConfig();
  const IconComponent = config.icon;

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 },
    },
  };

  const contentVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 20,
      transition: {
        duration: 0.2,
        ease: 'easeIn',
      },
    },
  };

  const spinnerVariants = {
    spin: {
      rotate: 360,
      transition: {
        duration: variant === 'matrix' ? 0.8 : variant === 'quantum' ? 1.2 : 1,
        repeat: Infinity,
        ease: 'linear',
      },
    },
    pulse: {
      scale: [1, 1.2, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const matrixVariants = {
    float: {
      y: [0, -10, 0],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className={`
            fixed inset-0 z-50 flex items-center justify-center
            ${backdropClasses[backdrop]}
            ${className}
          `}
          variants={overlayVariants}
          initial='hidden'
          animate='visible'
          exit='exit'
          role='dialog'
          aria-label='Loading'
          aria-describedby='loading-message'
        >
          {/* Background Effects */}
          {variant === 'cyber' && (
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              <div className='absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-transparent to-blue-900/20' />
              <div
                className='absolute inset-0 opacity-10'
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, transparent, transparent 100px, rgba(34,211,238,0.1) 100px, rgba(34,211,238,0.1) 101px)',
                }}
              />
            </div>
          )}

          {variant === 'matrix' && (
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className='absolute w-0.5 h-20 bg-gradient-to-b from-green-400 to-transparent'
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: ['0vh', '100vh'],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: Math.random() * 2 + 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
          )}

          {/* Main Content */}
          <motion.div
            className={`
              relative rounded-xl border backdrop-blur-lg
              ${sizeConfig[size].container}
              ${config.bg}
              ${config.border}
              ${config.glow}
            `}
            variants={contentVariants}
            initial='hidden'
            animate='visible'
            exit='exit'
          >
            {/* Cyber grid overlay */}
            {variant === 'cyber' && (
              <div
                className='absolute inset-0 rounded-xl opacity-20 pointer-events-none'
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(34,211,238,0.1) 20px, rgba(34,211,238,0.1) 21px)',
                }}
              />
            )}

            <div className='relative flex flex-col items-center space-y-4'>
              {/* Spinner/Icon */}
              <div className='relative'>
                <motion.div
                  className={`${config.iconColor} ${sizeConfig[size].spinner}`}
                  variants={variant === 'pulse' ? matrixVariants : spinnerVariants}
                  animate={variant === 'pulse' ? 'float' : variant === 'matrix' ? 'pulse' : 'spin'}
                >
                  <IconComponent className='w-full h-full' />
                </motion.div>

                {/* Quantum orbiting particles */}
                {variant === 'quantum' && (
                  <>
                    {[0, 120, 240].map((rotation, i) => (
                      <motion.div
                        key={i}
                        className='absolute top-1/2 left-1/2 w-2 h-2 bg-purple-400 rounded-full'
                        style={{
                          transformOrigin: '0 0',
                        }}
                        animate={{
                          rotate: [rotation, rotation + 360],
                          x: 30,
                          y: -1,
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'linear',
                          delay: i * 0.5,
                        }}
                      />
                    ))}
                  </>
                )}
              </div>

              {/* Message */}
              <div className='text-center space-y-2'>
                <p
                  id='loading-message'
                  className={`${config.iconColor} font-medium ${sizeConfig[size].text}`}
                >
                  {message}
                </p>

                {/* Progress Bar */}
                {progress !== undefined && (
                  <div className='w-48 h-2 bg-slate-700 rounded-full overflow-hidden'>
                    <motion.div
                      className={`h-full bg-gradient-to-r ${config.gradient} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}

                {progress !== undefined && (
                  <p className='text-xs text-gray-400'>{Math.round(progress)}% complete</p>
                )}
              </div>

              {/* Cancel Button */}
              {onCancel && (
                <button
                  onClick={onCancel}
                  className={`
                    px-4 py-2 text-sm rounded-lg border transition-colors
                    ${config.border} ${config.iconColor}
                    hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-current
                  `}
                >
                  Cancel
                </button>
              )}

              {/* Custom Children */}
              {children && <div className='mt-4'>{children}</div>}
            </div>

            {/* Animated border for cyber variant */}
            {variant === 'cyber' && (
              <div className='absolute inset-0 rounded-xl border border-cyan-400/50 animate-pulse pointer-events-none' />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingOverlay;
