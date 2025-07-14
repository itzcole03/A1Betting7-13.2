import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// Types for universal button
interface UniversalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'cyber'
    | 'glow'
    | 'glass'
    | 'neon'
    | 'quantum'
    | 'premium';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'glow';
  animation?: 'none' | 'hover' | 'bounce' | 'pulse' | 'wiggle' | 'spin' | 'glow' | 'shimmer';
  gradient?: boolean;
  glowIntensity?: 'subtle' | 'medium' | 'intense' | 'extreme';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
  loadingText?: string;
  successState?: boolean;
  errorState?: boolean;
  asChild?: boolean;
}

const getVariantClasses = (
  variant: string,
  props: { gradient?: boolean; glowIntensity?: string }
) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const variants = {
    default: cn(
      baseClasses,
      props.gradient
        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
        : 'bg-blue-600 hover:bg-blue-700 text-white',
      'focus:ring-blue-500'
    ),
    destructive: cn(
      baseClasses,
      props.gradient
        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
        : 'bg-red-600 hover:bg-red-700 text-white',
      'focus:ring-red-500'
    ),
    outline: cn(
      baseClasses,
      'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-gray-500'
    ),
    secondary: cn(
      baseClasses,
      props.gradient
        ? 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white'
        : 'bg-gray-600 hover:bg-gray-700 text-white',
      'focus:ring-gray-500'
    ),
    ghost: cn(baseClasses, 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500'),
    link: cn(
      baseClasses,
      'bg-transparent underline-offset-4 hover:underline text-blue-600 focus:ring-blue-500'
    ),
    cyber: cn(
      baseClasses,
      'bg-slate-900 border border-cyan-500/30 text-cyan-300 hover:bg-slate-800 hover:border-cyan-400',
      'shadow-lg shadow-cyan-500/20 focus:ring-cyan-500',
      props.glowIntensity === 'extreme' && 'shadow-2xl shadow-cyan-500/40',
      props.glowIntensity === 'intense' && 'shadow-xl shadow-cyan-500/30'
    ),
    glow: cn(
      baseClasses,
      props.gradient
        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
        : 'bg-purple-600 hover:bg-purple-700 text-white',
      'shadow-lg shadow-purple-500/30 focus:ring-purple-500',
      props.glowIntensity === 'extreme' && 'shadow-2xl shadow-purple-500/50',
      props.glowIntensity === 'intense' && 'shadow-xl shadow-purple-500/40'
    ),
    glass: cn(
      baseClasses,
      'bg-white/20 backdrop-blur-md border border-white/30 text-gray-900 hover:bg-white/30',
      'shadow-lg focus:ring-white/50'
    ),
    neon: cn(
      baseClasses,
      'bg-black border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-black',
      'shadow-lg shadow-pink-500/30 focus:ring-pink-500',
      props.glowIntensity === 'extreme' && 'shadow-2xl shadow-pink-500/50 animate-pulse'
    ),
    quantum: cn(
      baseClasses,
      'bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-size-200 hover:bg-pos-100 text-white',
      'shadow-lg shadow-purple-500/20 focus:ring-purple-500',
      'relative overflow-hidden'
    ),
    premium: cn(
      baseClasses,
      'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700',
      'text-black shadow-lg shadow-yellow-500/30 focus:ring-yellow-500',
      'border border-yellow-300'
    ),
  };

  return variants[variant as keyof typeof variants] || variants.default;
};

const getSizeClasses = (size: string) => {
  const sizes = {
    xs: 'h-6 px-2 text-xs',
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-base',
    lg: 'h-12 px-6 text-lg',
    xl: 'h-14 px-8 text-xl',
    icon: 'h-10 w-10 p-0',
  };
  return sizes[size as keyof typeof sizes] || sizes.md;
};

const getRoundedClasses = (rounded: string) => {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };
  return roundedClasses[rounded as keyof typeof roundedClasses] || roundedClasses.md;
};

const getShadowClasses = (shadow: string, variant: string) => {
  if (variant === 'cyber' || variant === 'glow' || variant === 'neon') {
    return ''; // These variants have built-in shadows
  }

  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    glow: 'shadow-lg shadow-blue-500/25',
  };
  return shadows[shadow as keyof typeof shadows] || '';
};

const getAnimationClasses = (animation: string) => {
  const animations = {
    none: '',
    hover: 'hover:scale-105 active:scale-95',
    bounce: 'hover:animate-bounce',
    pulse: 'animate-pulse',
    wiggle: 'hover:animate-wiggle',
    spin: 'hover:animate-spin',
    glow: 'animate-glow-pulse',
    shimmer: 'animate-shimmer',
  };
  return animations[animation as keyof typeof animations] || '';
};

export const UniversalButton = forwardRef<HTMLButtonElement, UniversalButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      loading = false,
      disabled = false,
      fullWidth = false,
      rounded = 'md',
      shadow = 'none',
      animation = 'hover',
      gradient = false,
      glowIntensity = 'medium',
      icon,
      iconPosition = 'left',
      children,
      loadingText,
      successState = false,
      errorState = false,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const buttonClasses = cn(
      getVariantClasses(variant, { gradient, glowIntensity }),
      getSizeClasses(size),
      getRoundedClasses(rounded),
      getShadowClasses(shadow, variant),
      !isDisabled && getAnimationClasses(animation),
      fullWidth && 'w-full',
      successState && 'bg-green-600 hover:bg-green-700 text-white',
      errorState && 'bg-red-600 hover:bg-red-700 text-white',
      className
    );

    const renderContent = () => {
      if (loading) {
        return (
          <>
            <div className='animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2' />
            {loadingText || 'Loading...'}
          </>
        );
      }

      if (successState) {
        return (
          <>
            <span className='mr-2'>✓</span>
            {children || 'Success'}
          </>
        );
      }

      if (errorState) {
        return (
          <>
            <span className='mr-2'>✗</span>
            {children || 'Error'}
          </>
        );
      }

      return (
        <>
          {icon && iconPosition === 'left' && (
            <span className={cn('flex-shrink-0', children && 'mr-2')}>{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className={cn('flex-shrink-0', children && 'ml-2')}>{icon}</span>
          )}
        </>
      );
    };

    if (asChild) {
      return <span className={buttonClasses}>{renderContent()}</span>;
    }

    return (
      <button
        className={cn(buttonClasses, 'relative overflow-hidden')}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {/* Special effects for certain variants */}
        {variant === 'cyber' && (
          <>
            <div className='absolute inset-0 bg-grid-white/[0.1] opacity-30' />
            <div className='absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-shimmer' />
          </>
        )}

        {variant === 'quantum' && (
          <>
            <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer' />
            <div className='absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full animate-ping opacity-75' />
            <div className='absolute top-1/4 left-1/4 w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse' />
            <div className='absolute bottom-1/4 right-1/4 w-0.5 h-0.5 bg-cyan-300 rounded-full animate-bounce' />
          </>
        )}

        {variant === 'neon' && glowIntensity === 'extreme' && (
          <div className='absolute inset-0 border border-pink-400/50 rounded-[inherit] animate-pulse' />
        )}

        {variant === 'glass' && (
          <div className='absolute inset-0 bg-gradient-to-br from-white/20 to-transparent' />
        )}

        {/* Button content */}
        <span className='relative z-10 flex items-center justify-center'>{renderContent()}</span>

        {/* Ripple effect overlay */}
        {!isDisabled && animation !== 'none' && (
          <div className='absolute inset-0 overflow-hidden rounded-[inherit]'>
            <div className='absolute inset-0 bg-white/20 scale-0 group-active:scale-100 transition-transform duration-200 rounded-full' />
          </div>
        )}
      </button>
    );
  }
);

UniversalButton.displayName = 'UniversalButton';

// Preset button components for common use cases
export const PrimaryButton = forwardRef<HTMLButtonElement, Omit<UniversalButtonProps, 'variant'>>(
  (props, ref) => <UniversalButton ref={ref} variant='default' {...props} />
);

export const SecondaryButton = forwardRef<HTMLButtonElement, Omit<UniversalButtonProps, 'variant'>>(
  (props, ref) => <UniversalButton ref={ref} variant='secondary' {...props} />
);

export const DangerButton = forwardRef<HTMLButtonElement, Omit<UniversalButtonProps, 'variant'>>(
  (props, ref) => <UniversalButton ref={ref} variant='destructive' {...props} />
);

export const CyberButton = forwardRef<HTMLButtonElement, Omit<UniversalButtonProps, 'variant'>>(
  (props, ref) => <UniversalButton ref={ref} variant='cyber' {...props} />
);

export const GlowButton = forwardRef<HTMLButtonElement, Omit<UniversalButtonProps, 'variant'>>(
  (props, ref) => <UniversalButton ref={ref} variant='glow' {...props} />
);

export const GlassButton = forwardRef<HTMLButtonElement, Omit<UniversalButtonProps, 'variant'>>(
  (props, ref) => <UniversalButton ref={ref} variant='glass' {...props} />
);

export const NeonButton = forwardRef<HTMLButtonElement, Omit<UniversalButtonProps, 'variant'>>(
  (props, ref) => <UniversalButton ref={ref} variant='neon' {...props} />
);

export const QuantumButton = forwardRef<HTMLButtonElement, Omit<UniversalButtonProps, 'variant'>>(
  (props, ref) => <UniversalButton ref={ref} variant='quantum' {...props} />
);

export const PremiumButton = forwardRef<HTMLButtonElement, Omit<UniversalButtonProps, 'variant'>>(
  (props, ref) => <UniversalButton ref={ref} variant='premium' {...props} />
);

// Loading button with built-in states
export const LoadingButton = forwardRef<
  HTMLButtonElement,
  UniversalButtonProps & {
    isLoading?: boolean;
    isSuccess?: boolean;
    isError?: boolean;
  }
>(({ isLoading, isSuccess, isError, ...props }, ref) => (
  <UniversalButton
    ref={ref}
    loading={isLoading}
    successState={isSuccess}
    errorState={isError}
    {...props}
  />
));

// Icon button for icon-only use cases
export const IconButton = forwardRef<
  HTMLButtonElement,
  Omit<UniversalButtonProps, 'size' | 'children'> & {
    icon: React.ReactNode;
    'aria-label': string;
  }
>(({ icon, ...props }, ref) => (
  <UniversalButton ref={ref} size='icon' {...props}>
    {icon}
  </UniversalButton>
));

PrimaryButton.displayName = 'PrimaryButton';
SecondaryButton.displayName = 'SecondaryButton';
DangerButton.displayName = 'DangerButton';
CyberButton.displayName = 'CyberButton';
GlowButton.displayName = 'GlowButton';
GlassButton.displayName = 'GlassButton';
NeonButton.displayName = 'NeonButton';
QuantumButton.displayName = 'QuantumButton';
PremiumButton.displayName = 'PremiumButton';
LoadingButton.displayName = 'LoadingButton';
IconButton.displayName = 'IconButton';
