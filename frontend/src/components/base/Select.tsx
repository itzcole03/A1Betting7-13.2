import React, { useId } from 'react';

export type SelectVariant = 'default' | 'cyber' | 'minimal';
export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'multiple'> {
  variant?: SelectVariant;
  size?: SelectSize;
  label?: React.ReactNode;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
  leadingIcon?: React.ComponentType<{ className?: string }>;
  trailingIcon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

const cn = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');

const variantClasses: Record<SelectVariant, string> = {
  default:
    'bg-slate-900/60 border border-slate-700 text-slate-100 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30',
  cyber:
    'bg-slate-950/80 border border-cyan-400/40 text-cyan-100 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/40 shadow-[0_0_16px_rgba(34,211,238,0.2)]',
  minimal:
    'bg-transparent border border-slate-700/70 text-slate-100 focus:border-slate-300 focus:ring-2 focus:ring-slate-300/30',
};

const sizeClasses: Record<SelectSize, string> = {
  sm: 'h-9 pl-3 pr-8 text-sm',
  md: 'h-11 pl-4 pr-10 text-base',
  lg: 'h-12 pl-5 pr-12 text-lg',
};

const iconSize: Record<SelectSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

/**
 * Styled select element with optional adornments and messaging.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      variant = 'default',
      size = 'md',
      label,
      helperText,
      error,
      fullWidth = false,
      leadingIcon: LeadingIcon,
      trailingIcon: TrailingIcon,
      className = '',
      id,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const internalId = useId();
    const selectId = id ?? internalId;
    const hasError = Boolean(error);

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label ? (
          <label htmlFor={selectId} className='text-sm font-medium text-slate-300'>
            {label}
          </label>
        ) : null}
        <div className='relative'>
          {LeadingIcon ? (
            <span className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400'>
              <LeadingIcon className={iconSize[size]} />
            </span>
          ) : null}
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={cn(
              'w-full appearance-none rounded-lg transition-colors duration-150 focus:outline-none',
              variantClasses[variant],
              sizeClasses[size],
              'pr-10',
              LeadingIcon && 'pl-10',
              TrailingIcon && 'pr-12',
              hasError &&
                'border-rose-400 focus:border-rose-400 focus:ring-rose-300/40 text-rose-100',
              className
            )}
            aria-invalid={hasError}
            aria-describedby={helperText || error ? `${selectId}-hint` : undefined}
            {...props}
          >
            {children}
          </select>
          <span className='pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400'>
            {hasError ? (
              <span className='text-rose-300 text-sm font-semibold'>!</span>
            ) : TrailingIcon ? (
              <TrailingIcon className={iconSize[size]} />
            ) : (
              <svg
                aria-hidden='true'
                className={iconSize[size]}
                viewBox='0 0 20 20'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M5 7.5L10 12.5L15 7.5'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            )}
          </span>
        </div>
        {helperText || error ? (
          <p
            id={`${selectId}-hint`}
            className={cn('text-sm', hasError ? 'text-rose-300' : 'text-slate-400')}
          >
            {error || helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
