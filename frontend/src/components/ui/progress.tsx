import React from 'react';
import { motion } from 'framer-motion';

export interface ProgressProps {
  value: number;
  max?: number;
  variant?: 'default' | 'cyber' | 'glass' | 'gradient' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  showPercentage?: boolean;
  label?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'cyan';
  animate?: boolean;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showValue = false,
  showPercentage = false,
  label,
  color = 'blue',
  animate = true,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const colorClasses = {
    blue: {
      bg: 'bg-blue-500',
      gradient: 'from-blue-400 to-blue-600',
      glow: 'shadow-[0_0_10px_rgba(59,130,246,0.5)]',
    },
    green: {
      bg: 'bg-green-500',
      gradient: 'from-green-400 to-green-600',
      glow: 'shadow-[0_0_10px_rgba(34,197,94,0.5)]',
    },
    yellow: {
      bg: 'bg-yellow-500',
      gradient: 'from-yellow-400 to-yellow-600',
      glow: 'shadow-[0_0_10px_rgba(251,191,36,0.5)]',
    },
    red: {
      bg: 'bg-red-500',
      gradient: 'from-red-400 to-red-600',
      glow: 'shadow-[0_0_10px_rgba(239,68,68,0.5)]',
    },
    purple: {
      bg: 'bg-purple-500',
      gradient: 'from-purple-400 to-purple-600',
      glow: 'shadow-[0_0_10px_rgba(168,85,247,0.5)]',
    },
    cyan: {
      bg: 'bg-cyan-500',
      gradient: 'from-cyan-400 to-cyan-600',
      glow: 'shadow-[0_0_10px_rgba(34,211,238,0.5)]',
    },
  };

  const variantClasses = {
    default: 'bg-slate-700',
    cyber: 'bg-slate-900/50 border border-cyan-500/30',
    glass: 'bg-white/10 backdrop-blur-sm border border-white/10',
    gradient: 'bg-slate-700',
    pulse: 'bg-slate-700',
  };

  const getProgressBarClasses = () => {
    const colorConfig = colorClasses[color];

    switch (variant) {
      case 'cyber':
        return `bg-gradient-to-r ${colorConfig.gradient} ${colorConfig.glow}`;
      case 'glass':
        return `bg-gradient-to-r ${colorConfig.gradient} backdrop-blur-sm`;
      case 'gradient':
        return `bg-gradient-to-r ${colorConfig.gradient}`;
      case 'pulse':
        return `${colorConfig.bg} animate-pulse`;
      default:
        return colorConfig.bg;
    }
  };

  const progressVariants = {
    initial: { width: 0 },
    animate: {
      width: `${percentage}%`,
      transition: {
        duration: animate ? 1 : 0,
        ease: 'easeOut',
      },
    },
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and Value */}
      {(label || showValue || showPercentage) && (
        <div className='flex items-center justify-between text-sm'>
          {label && <span className='text-gray-300 font-medium'>{label}</span>}
          <div className='flex items-center space-x-2'>
            {showValue && (
              <span className='text-white font-semibold'>
                {value.toLocaleString()}/{max.toLocaleString()}
              </span>
            )}
            {showPercentage && <span className='text-gray-400'>{percentage.toFixed(1)}%</span>}
          </div>
        </div>
      )}

      {/* Progress Bar Container */}
      <div
        className={`
          relative w-full rounded-full overflow-hidden
          ${sizeClasses[size]}
          ${variantClasses[variant]}
        `}
        role='progressbar'
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        {/* Background Pattern for Cyber Variant */}
        {variant === 'cyber' && (
          <div
            className='absolute inset-0 opacity-20'
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(34,211,238,0.1) 2px, rgba(34,211,238,0.1) 4px)',
            }}
          />
        )}

        {/* Progress Fill */}
        <motion.div
          className={`
            h-full rounded-full transition-all duration-300
            ${getProgressBarClasses()}
            ${variant === 'pulse' ? 'animate-pulse' : ''}
          `}
          variants={progressVariants}
          initial='initial'
          animate='animate'
        >
          {/* Shimmer Effect for Cyber Variant */}
          {variant === 'cyber' && (
            <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] w-full h-full' />
          )}

          {/* Glow Effect for Glass Variant */}
          {variant === 'glass' && (
            <div className='absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 animate-pulse' />
          )}
        </motion.div>

        {/* Percentage Text Overlay for Large Size */}
        {size === 'lg' && showPercentage && percentage > 15 && (
          <div className='absolute inset-0 flex items-center justify-center'>
            <span className='text-xs font-bold text-white mix-blend-difference'>
              {percentage.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Additional Info for Cyber Variant */}
      {variant === 'cyber' && (
        <div className='flex items-center justify-between text-xs text-cyan-400'>
          <span>Progress: {percentage.toFixed(1)}%</span>
          <span className='animate-pulse'>● ACTIVE</span>
        </div>
      )}
    </div>
  );
};

export default Progress;
