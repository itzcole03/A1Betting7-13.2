import { motion } from 'framer-motion';
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
  label?: string;
}

/**
 * LoadingSpinner Component
 *
 * A modern, accessible loading spinner with smooth animations.
 * Supports multiple sizes and custom colors.
 *
 * @param size - Size variant (sm, md, lg)
 * @param color - Custom color override
 * @param className - Additional CSS classes
 * @param label - Accessibility label
 */
export const _LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'var(--cyber-primary)',
  className = '',
  label = 'Loading...',
}) => {
  const _sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div
      className={`flex items-center justify-center ${className}`}
      role='status'
      aria-label={label}
      aria-live='polite'
    >
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <motion.div
        className={`${sizeClasses[size]} border-2 border-transparent rounded-full`}
        style={{
          borderTopColor: color,
          borderRightColor: color,
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <span className='sr-only'>{label}</span>
    </div>
  );
};

export default LoadingSpinner;
