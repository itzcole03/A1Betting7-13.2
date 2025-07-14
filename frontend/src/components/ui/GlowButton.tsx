import React from 'react';
import { cn } from '@/lib/utils';

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'cyber'
    | 'neon'
    | 'quantum';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  glowIntensity?: 'subtle' | 'medium' | 'intense' | 'extreme';
  animated?: boolean;
  pulsing?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const getVariantClasses = (variant: string, glowIntensity: string = 'medium') => {
  const intensityMap = {
    subtle: { shadow: 'shadow-md', glow: '10' },
    medium: { shadow: 'shadow-lg', glow: '20' },
    intense: { shadow: 'shadow-xl', glow: '30' },
    extreme: { shadow: 'shadow-2xl', glow: '50' },
  };

  const intensity = intensityMap[glowIntensity as keyof typeof intensityMap] || intensityMap.medium;

  const variants = {
    default: `bg-gray-600 text-white border border-gray-500 hover:bg-gray-500 ${intensity.shadow} shadow-gray-500/${intensity.glow}`,
    primary: `bg-blue-600 text-white border border-blue-500 hover:bg-blue-500 ${intensity.shadow} shadow-blue-500/${intensity.glow}`,
    secondary: `bg-purple-600 text-white border border-purple-500 hover:bg-purple-500 ${intensity.shadow} shadow-purple-500/${intensity.glow}`,
    success: `bg-green-600 text-white border border-green-500 hover:bg-green-500 ${intensity.shadow} shadow-green-500/${intensity.glow}`,
    warning: `bg-yellow-600 text-white border border-yellow-500 hover:bg-yellow-500 ${intensity.shadow} shadow-yellow-500/${intensity.glow}`,
    error: `bg-red-600 text-white border border-red-500 hover:bg-red-500 ${intensity.shadow} shadow-red-500/${intensity.glow}`,
    cyber: `bg-cyan-500 text-black border border-cyan-400 hover:bg-cyan-400 ${intensity.shadow} shadow-cyan-500/${intensity.glow}`,
    neon: `bg-pink-600 text-white border border-pink-500 hover:bg-pink-500 ${intensity.shadow} shadow-pink-500/${intensity.glow}`,
    quantum: `bg-gradient-to-r from-purple-600 to-blue-600 text-white border border-purple-500 hover:from-purple-500 hover:to-blue-500 ${intensity.shadow} shadow-purple-500/${intensity.glow}`,
  };

  return variants[variant as keyof typeof variants] || variants.default;
};

const getSizeClasses = (size: string) => {
  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };
  return sizes[size as keyof typeof sizes] || sizes.md;
};

export const GlowButton: React.FC<GlowButtonProps> = ({
  variant = 'default',
  size = 'md',
  glowIntensity = 'medium',
  animated = true,
  pulsing = false,
  disabled = false,
  loading = false,
  icon,
  children,
  className,
  ...props
}) => {
  return (
    <button
      className={cn(
        // Base styles
        'relative inline-flex items-center justify-center',
        'font-medium rounded-lg',
        'transition-all duration-300 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'transform-gpu',

        // Size
        getSizeClasses(size),

        // Variant styles with glow
        getVariantClasses(variant, glowIntensity),

        // States
        disabled && 'opacity-50 cursor-not-allowed',
        loading && 'cursor-wait',

        // Animations
        animated && !disabled && 'hover:scale-105 active:scale-95',
        pulsing && 'animate-pulse',

        // Enhanced glow on hover
        !disabled && 'hover:brightness-110',

        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {/* Background glow effect */}
      <div
        className={cn(
          'absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300',
          !disabled && 'group-hover:opacity-100',
          variant === 'cyber' && 'bg-gradient-to-r from-cyan-400/50 to-blue-400/50',
          variant === 'neon' && 'bg-gradient-to-r from-pink-400/50 to-purple-400/50',
          variant === 'quantum' && 'bg-gradient-to-r from-purple-400/50 to-blue-400/50',
          variant === 'primary' && 'bg-blue-400/50',
          variant === 'success' && 'bg-green-400/50',
          variant === 'warning' && 'bg-yellow-400/50',
          variant === 'error' && 'bg-red-400/50'
        )}
      />

      {/* Shimmer effect for cyber/quantum variants */}
      {(variant === 'cyber' || variant === 'quantum') && animated && (
        <div className='absolute inset-0 overflow-hidden rounded-lg'>
          <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer' />
        </div>
      )}

      {/* Content */}
      <div className='relative flex items-center space-x-2'>
        {/* Loading spinner */}
        {loading && (
          <div className='animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full' />
        )}

        {/* Icon */}
        {icon && !loading && <span className='flex-shrink-0'>{icon}</span>}

        {/* Text */}
        <span>{children}</span>
      </div>

      {/* Cyber grid overlay */}
      {variant === 'cyber' && (
        <div className='absolute inset-0 bg-grid-white/[0.1] rounded-lg pointer-events-none opacity-30' />
      )}

      {/* Quantum particles effect */}
      {variant === 'quantum' && animated && (
        <div className='absolute inset-0 overflow-hidden rounded-lg pointer-events-none'>
          <div className='absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full animate-ping opacity-75' />
          <div className='absolute top-1/4 left-1/4 w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse' />
          <div className='absolute bottom-1/4 right-1/4 w-0.5 h-0.5 bg-blue-300 rounded-full animate-bounce' />
        </div>
      )}

      {/* Neon border effect */}
      {variant === 'neon' && (
        <div className='absolute inset-0 rounded-lg border border-pink-400/50 shadow-inner shadow-pink-500/20 pointer-events-none' />
      )}
    </button>
  );
};
