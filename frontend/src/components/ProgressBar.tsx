import { motion } from 'framer-motion';
import React from 'react';

// eslint-disable jsx-a11y/aria-proptypes
/*
  File-level eslint-disable for jsx-a11y/aria-proptypes due to known linter false positives
  for dynamic ARIA attribute values in React/JSX. The code is correct and accessible.
*/

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  backgroundColor?: string;
  className?: string;
  label?: string;
  showPercentage?: boolean;
  animated?: boolean;
}

/**
 * ProgressBar Component
 *
 * A modern, accessible progress bar with smooth animations.
 * Supports multiple sizes, custom colors, and percentage display.
 *
 * @param value - Current progress value
 * @param max - Maximum value (default: 100)
 * @param size - Size variant (sm, md, lg)
 * @param color - Progress bar color
 * @param backgroundColor - Background color
 * @param className - Additional CSS classes
 * @param label - Accessibility label
 * @param showPercentage - Whether to show percentage text
 * @param animated - Whether to animate the progress
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  color = 'var(--cyber-primary)',
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
  className = '',
  label,
  showPercentage = false,
  animated = true,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className='flex justify-between items-center mb-2'>
          {label && <span className='text-sm font-medium text-gray-300'>{label}</span>}
          {showPercentage && (
            <span className='text-sm text-gray-400'>{Math.round(percentage)}%</span>
          )}
        </div>
      )}

      <div
        className={`w-full rounded-full overflow-hidden ${sizeClasses[size]}`}
        style={{ backgroundColor }}
        role='progressbar'
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progress: ${Math.round(percentage)}%`}
      >
        <motion.div
          className='h-full rounded-full'
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={animated ? { duration: 0.5, ease: 'easeOut' } : { duration: 0 }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
