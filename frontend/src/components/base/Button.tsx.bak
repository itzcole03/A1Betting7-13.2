import { Loader } from 'lucide-react';
import React from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'ghost'
  | 'outline'
  | 'danger'
  | 'success';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  fullWidth?: boolean;
}

const cn = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 focus-visible:ring-cyan-200',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 focus-visible:ring-slate-300',
  tertiary: 'bg-slate-700/70 hover:bg-slate-600/70 text-slate-100 focus-visible:ring-slate-200/70',
  ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-100 focus-visible:ring-slate-200/70',
  outline:
    'bg-transparent border border-slate-500 hover:bg-slate-800/50 text-slate-100 focus-visible:ring-slate-200/60',
  danger: 'bg-rose-500 hover:bg-rose-400 text-white focus-visible:ring-rose-200',
  success: 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 focus-visible:ring-emerald-200',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
  xl: 'h-14 px-6 text-lg',
  icon: 'h-10 w-10 p-0 flex items-center justify-center',
};

const iconSizeClasses: Record<ButtonSize, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
  xl: 'h-6 w-6',
  icon: 'h-5 w-5',
};

/**
 * Opinionated button primitive used across the application.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      fullWidth = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled ?? isLoading;

    return (
      <button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] hover:scale-[1.01]',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {isLoading ? (
          <Loader className={cn('animate-spin', iconSizeClasses[size])} />
        ) : LeftIcon ? (
          <LeftIcon className={cn(iconSizeClasses[size])} />
        ) : null}
        <span className='whitespace-nowrap'>{children}</span>
        {RightIcon && !isLoading ? <RightIcon className={cn(iconSizeClasses[size])} /> : null}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
