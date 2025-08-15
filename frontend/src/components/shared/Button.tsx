/**
 * Button Component - Phase 3.3 UI/UX Consistency
 * Standardized button using design tokens
 */

import React from 'react';
import { Loader } from 'lucide-react';

// Simple class name utility
const cn = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  className,
  children,
  ...props
}) => {
  const baseClasses = 'btn inline-flex items-center justify-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all';

  const variantClasses = {
    primary: 'btn--primary focus:ring-cyan-400',
    secondary: 'btn--secondary focus:ring-cyan-400',
    success: 'bg-green-500 hover:bg-green-600 text-white border-green-500 focus:ring-green-400',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-500 focus:ring-yellow-400',
    error: 'bg-red-500 hover:bg-red-600 text-white border-red-500 focus:ring-red-400',
    ghost: 'bg-transparent hover:bg-white/5 text-gray-300 hover:text-white border-transparent'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <Loader className={cn(iconSizes[size], 'animate-spin mr-2')} />
      )}
      
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className={cn(iconSizes[size], 'mr-2')} />
      )}
      
      {children}
      
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={cn(iconSizes[size], 'ml-2')} />
      )}
    </button>
  );
};

export default Button;
