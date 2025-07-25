import React from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

// @ts-expect-error TS(2430): Interface 'InputProps' incorrectly extends interfa... Remove this comment to see the full error message
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'cyber' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  showPasswordToggle?: boolean;
}

export const _Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      label,
      error,
      helperText,
      variant = 'default',
      size = 'md',
      icon,
      iconPosition = 'left',
      showPasswordToggle = false,
      type = 'text',
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);

    const _inputType = type === 'password' && showPassword ? 'text' : type;

    const _sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg',
    };

    const _variantClasses = {
      default: `
        bg-slate-800/50 border border-slate-600/50 
        focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50
        hover:border-slate-500/50
      `,
      cyber: `
        bg-slate-900/50 border-2 border-cyan-500/30 
        focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20
        hover:border-cyan-500/50
        shadow-[0_0_10px_rgba(34,211,238,0.1)]
        focus:shadow-[0_0_20px_rgba(34,211,238,0.3)]
      `,
      glass: `
        bg-white/5 backdrop-blur-lg border border-white/10
        focus:border-white/30 focus:ring-1 focus:ring-white/20
        hover:border-white/20
      `,
    };

    const _baseClasses = `
      w-full rounded-lg text-white placeholder-gray-400
      transition-all duration-200 ease-in-out
      disabled:opacity-50 disabled:cursor-not-allowed
      ${sizeClasses[size]}
      ${variantClasses[variant]}
      ${icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : ''}
      ${showPasswordToggle && type === 'password' ? 'pr-10' : ''}
      ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''}
      ${className}
    `;

    const _inputVariants = {
      unfocused: { scale: 1 },
      focused: { scale: 1.01 },
    };

    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='space-y-2'>
        {/* Label */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        {label && <label className='block text-sm font-medium text-gray-300'>{label}</label>}

        {/* Input Container */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='relative'>
          {/* Left Icon */}
          {icon && iconPosition === 'left' && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'>
              {icon}
            </div>
          )}

          {/* Input Field */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.input
            ref={ref}
            type={inputType}
            className={baseClasses}
            variants={inputVariants}
            animate={isFocused ? 'focused' : 'unfocused'}
            onFocus={e => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={e => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            disabled={disabled}
            {...props}
          />

          {/* Right Icon */}
          {icon && iconPosition === 'right' && !showPasswordToggle && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400'>
              {icon}
            </div>
          )}

          {/* Password Toggle */}
          {showPasswordToggle && type === 'password' && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <button
              type='button'
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors'
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              {showPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
            </button>
          )}

          {/* Focus Ring Effect */}
          {isFocused && variant === 'cyber' && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 pointer-events-none' />
          )}
        </div>

        {/* Helper Text / Error Message */}
        {(error || helperText) && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className='flex items-start space-x-1'
          >
            {error ? (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <p className='text-sm text-red-400 flex-1'>{error}</p>
            ) : (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <p className='text-sm text-gray-400 flex-1'>{helperText}</p>
            )}
          </motion.div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
