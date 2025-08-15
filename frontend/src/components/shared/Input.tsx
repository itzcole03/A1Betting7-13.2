/**
 * Input Component - Phase 3.3 UI/UX Consistency
 * Standardized input using design tokens
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

// Simple class name utility
const cn = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'cyber' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  error?: string;
  label?: string;
  helperText?: string;
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  fullWidth?: boolean;
}

const Input: React.FC<InputProps> = ({
  variant = 'default',
  size = 'md',
  error,
  label,
  helperText,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  fullWidth = false,
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseClasses = 'border rounded-lg transition-all focus:outline-none focus:ring-2';

  const variantClasses = {
    default: 'bg-slate-800/50 border-slate-700 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20',
    cyber: 'bg-transparent border-cyan-400/30 text-cyan-400 placeholder-cyan-400/50 focus:border-cyan-400 focus:ring-cyan-400/20 cyber-glow',
    minimal: 'bg-transparent border-gray-600 text-gray-300 placeholder-gray-500 focus:border-gray-400 focus:ring-gray-400/20'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const hasError = !!error;

  return (
    <div className={cn(fullWidth && 'w-full')}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LeftIcon className={cn(iconSizes[size], 'text-gray-400')} />
          </div>
        )}
        
        <input
          id={inputId}
          className={cn(
            baseClasses,
            variantClasses[variant],
            sizeClasses[size],
            LeftIcon && 'pl-10',
            (RightIcon || hasError) && 'pr-10',
            hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            fullWidth && 'w-full',
            className
          )}
          {...props}
        />
        
        {(RightIcon || hasError) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {hasError ? (
              <AlertCircle className={cn(iconSizes[size], 'text-red-500')} />
            ) : RightIcon ? (
              <RightIcon className={cn(iconSizes[size], 'text-gray-400')} />
            ) : null}
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <p className={cn(
          'mt-1 text-sm',
          hasError ? 'text-red-400' : 'text-gray-400'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
