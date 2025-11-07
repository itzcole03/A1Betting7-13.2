/**
 * Input component
 * Purpose: Provide a typed, reusable input with optional styling variants & error state.
 * Constraints: Non-breaking; behavior & basic styling preserved. Only exposes variant + error additions.
 */
import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'quiet';
  error?: string;
}

const variantStyles: Record<NonNullable<InputProps['variant']>, string> = {
  default: 'bg-slate-800/50 border border-slate-600/50 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 hover:border-slate-500/50',
  quiet: 'bg-transparent border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', variant = 'default', error, type = 'text', ...rest }, ref) => {
    const classes = `w-full rounded-lg text-white placeholder-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`;
    return (
      <div className='space-y-2'>
        <input
          ref={ref}
          type={type}
          className={classes}
          aria-invalid={error ? true : undefined}
          data-testid='ui-input'
          {...rest}
        />
        {error && <p className='text-sm text-red-400' role='alert'>{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
// Backwards-compatible underscore export
export const _Input = Input;
export default Input;
