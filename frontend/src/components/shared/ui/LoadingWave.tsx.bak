import React from 'react';
import { motion } from 'framer-motion';

interface LoadingWaveProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'cyber' | 'quantum' | 'neon';
  text?: string;
  className?: string;
}

export const _LoadingWave: React.FC<LoadingWaveProps> = ({
  size = 'md',
  variant = 'default',
  text = 'Loading...',
  className = '',
}) => {
  const _sizeConfig = {
    sm: { dots: 'w-2 h-2', container: 'h-8', text: 'text-sm', spacing: 'space-x-1' },
    md: { dots: 'w-3 h-3', container: 'h-12', text: 'text-base', spacing: 'space-x-2' },
    lg: { dots: 'w-4 h-4', container: 'h-16', text: 'text-lg', spacing: 'space-x-3' },
    xl: { dots: 'w-6 h-6', container: 'h-20', text: 'text-xl', spacing: 'space-x-4' },
  };

  const _variantConfig = {
    default: {
      gradient: 'from-blue-400 to-cyan-500',
      glow: 'shadow-[0_0_10px_rgba(59,130,246,0.5)]',
    },
    cyber: {
      gradient: 'from-cyan-400 to-blue-500',
      glow: 'shadow-[0_0_15px_rgba(34,211,238,0.6)]',
    },
    quantum: {
      gradient: 'from-purple-400 to-pink-500',
      glow: 'shadow-[0_0_15px_rgba(168,85,247,0.6)]',
    },
    neon: {
      gradient: 'from-green-400 to-emerald-500',
      glow: 'shadow-[0_0_15px_rgba(34,197,94,0.6)]',
    },
  };

  const _sizeConf = sizeConfig[size];
  const _variantConf = variantConfig[variant];

  const _dotVariants = {
    start: { y: '0%' },
    end: { y: '100%' },
  };

  const _dotTransition = {
    duration: 0.5,
    repeat: Infinity,
    repeatType: 'reverse' as const,
    ease: 'easeInOut',
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Wave Animation */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className={`flex items-end ${sizeConf.spacing} ${sizeConf.container}`}>
        {[...Array(5)].map((_, i) => (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            key={i}
            className={`
              ${sizeConf.dots} rounded-full 
              bg-gradient-to-t ${variantConf.gradient}
              ${variantConf.glow}
            `}
            variants={dotVariants}
            initial='start'
            animate='end'
            // @ts-expect-error TS(2322): Type '{ delay: number; duration: number; repeat: n... Remove this comment to see the full error message
            transition={{
              ...dotTransition,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>

      {/* Loading Text */}
      {text && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <motion.p
          className={`
            ${sizeConf.text} font-medium 
            bg-gradient-to-r ${variantConf.gradient} bg-clip-text text-transparent
          `}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

export const _LoadingSpinner: React.FC<LoadingWaveProps> = ({
  size = 'md',
  variant = 'default',
  className = '',
}) => {
  const _sizeConfig = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const _variantConfig = {
    default: 'border-blue-500',
    cyber: 'border-cyan-400',
    quantum: 'border-purple-500',
    neon: 'border-green-400',
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <motion.div
      className={`
        ${sizeConfig[size]} ${variantConfig[variant]}
        border-2 border-t-transparent rounded-full
        ${className}
      `}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
};

export const _LoadingPulse: React.FC<LoadingWaveProps> = ({
  size = 'md',
  variant = 'default',
  className = '',
}) => {
  const _sizeConfig = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  };

  const _variantConfig = {
    default: {
      gradient: 'from-blue-400 to-cyan-500',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.5)]',
    },
    cyber: {
      gradient: 'from-cyan-400 to-blue-500',
      glow: 'shadow-[0_0_25px_rgba(34,211,238,0.6)]',
    },
    quantum: {
      gradient: 'from-purple-400 to-pink-500',
      glow: 'shadow-[0_0_25px_rgba(168,85,247,0.6)]',
    },
    neon: {
      gradient: 'from-green-400 to-emerald-500',
      glow: 'shadow-[0_0_25px_rgba(34,197,94,0.6)]',
    },
  };

  const _variantConf = variantConfig[variant];

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <motion.div
      className={`
        ${sizeConfig[size]} rounded-full
        bg-gradient-to-r ${variantConf.gradient}
        ${variantConf.glow}
        ${className}
      `}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.7, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};

export default LoadingWave;
