import React from 'react';

export type UnifiedInputVariant = 'default' | 'ghost' | 'underline';

export interface UnifiedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  errorText?: React.ReactNode;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  variant?: UnifiedInputVariant;
}

const variantClasses: Record<UnifiedInputVariant, string> = {
  default:
    'rounded-md border border-slate-700/70 bg-slate-900/90 focus-within:border-cyan-400/70 focus-within:ring-2 focus-within:ring-cyan-400/30',
  ghost:
    'rounded-md border border-transparent bg-transparent focus-within:border-cyan-400/50 focus-within:ring-2 focus-within:ring-cyan-400/30',
  underline: 'rounded-none border-0 border-b border-slate-700/75 focus-within:border-cyan-400/70',
};

/**
 * Opinionated input wrapper that keeps layout consistent across screens.
 */
export const UnifiedInput = React.forwardRef<HTMLInputElement, UnifiedInputProps>(
  (
    {
      label,
      helperText,
      errorText,
      leadingIcon,
      trailingIcon,
      variant = 'default',
      className = '',
      required,
      ...props
    },
    ref
  ) => {
    const hasError = Boolean(errorText);

    return (
      <label className='flex flex-col gap-2 text-sm'>
        {label ? (
          <span className='flex items-center gap-1 font-semibold text-slate-200'>
            {label}
            {required ? <span className='text-rose-400'>*</span> : null}
          </span>
        ) : null}
        <div
          className={`flex items-center gap-2 bg-transparent ${variantClasses[variant]} ${
            hasError
              ? 'border-rose-500/70 ring-2 ring-rose-400/30 focus-within:border-rose-400/80'
              : ''
          }`}
        >
          {leadingIcon ? <span className='pl-3 text-slate-400'>{leadingIcon}</span> : null}
          <input
            {...props}
            ref={ref}
            required={required}
            className={`flex-1 bg-transparent px-3 py-2 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none ${className}`.trim()}
          />
          {trailingIcon ? <span className='pr-3 text-slate-400'>{trailingIcon}</span> : null}
        </div>
        {hasError ? (
          <span className='text-xs font-medium text-rose-300'>{errorText}</span>
        ) : helperText ? (
          <span className='text-xs text-slate-400'>{helperText}</span>
        ) : null}
      </label>
    );
  }
);

UnifiedInput.displayName = 'UnifiedInput';

export default UnifiedInput;
