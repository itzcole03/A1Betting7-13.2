import { AlertCircle } from 'lucide-react';
import React, { useId } from 'react';

export type InputVariant = 'default' | 'cyber' | 'minimal';
export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'children'> {
  variant?: InputVariant;
  size?: InputSize;
  error?: string;
  helperText?: string;
  label?: React.ReactNode;
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  fullWidth?: boolean;
}

const cn = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');

const variantClasses: Record<InputVariant, string> = {
  default:
    'bg-slate-900/60 border border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30',
  cyber:
    'bg-slate-950/80 border border-cyan-400/40 text-cyan-100 placeholder-cyan-400/60 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/40 shadow-[0_0_12px_rgba(34,211,238,0.15)]',
  minimal:
    'bg-transparent border border-slate-700/70 text-slate-100 placeholder-slate-500 focus:border-slate-300 focus:ring-2 focus:ring-slate-300/30',
};

const sizeClasses: Record<InputSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-base',
  lg: 'h-12 px-5 text-lg',
};

const iconSize: Record<InputSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

/**
 * Standard text input with optional adornments and messaging.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      size = 'md',
      error,
      helperText,
      label,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const internalId = useId();
    const inputId = id ?? internalId;
    const hasError = Boolean(error);

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label ? (
          <label htmlFor={inputId} className='text-sm font-medium text-slate-300'>
            {label}
          </label>
        ) : null}
        <div className='relative'>
          {LeftIcon ? (
            <span className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400'>
              <LeftIcon className={iconSize[size]} />
            </span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-lg transition-colors duration-150 focus:outline-none',
              variantClasses[variant],
              sizeClasses[size],
              LeftIcon && 'pl-10',
              (RightIcon || hasError) && 'pr-10',
              hasError &&
                'border-rose-400 focus:border-rose-400 focus:ring-rose-300/40 text-rose-100 placeholder-rose-200/70',
              className
            )}
            aria-invalid={hasError}
            aria-describedby={helperText || error ? `${inputId}-hint` : undefined}
            {...props}
          />
          {RightIcon || hasError ? (
            <span className='absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400'>
              {hasError ? (
                <AlertCircle className={cn(iconSize[size], 'text-rose-400')} />
              ) : RightIcon ? (
                <RightIcon className={iconSize[size]} />
              ) : null}
            </span>
          ) : null}
        </div>
        {error || helperText ? (
          <p
            id={`${inputId}-hint`}
            className={cn('text-sm', hasError ? 'text-rose-300' : 'text-slate-400')}
          >
            {error || helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
