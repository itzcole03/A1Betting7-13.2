import React from 'react';
import { motion } from 'framer-motion';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  variant?: 'default' | 'cyber' | 'required' | 'optional';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
}

export const _Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  (
    {
      className = '',
      variant = 'default',
      size = 'md',
      children,
      required = false,
      optional = false,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const _sizeClasses = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    };

    const _variantClasses = {
      default: 'text-gray-300 font-medium',
      cyber: 'text-cyan-400 font-semibold uppercase tracking-wider',
      required: 'text-gray-300 font-medium',
      optional: 'text-gray-400 font-normal',
    };

    const _baseClasses = `
      block transition-colors duration-200
      ${sizeClasses[size]}
      ${variantClasses[variant]}
      ${disabled ? 'text-gray-500 cursor-not-allowed' : 'cursor-pointer'}
      ${className}
    `;

    const _labelVariants = {
      default: { scale: 1, color: variantClasses[variant] },
      hover: { scale: variant === 'cyber' ? 1.02 : 1 },
    };

    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <motion.label
        ref={ref}
        className={baseClasses}
        variants={labelVariants}
        initial='default'
        whileHover={!disabled ? 'hover' : undefined}
        {...props}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <span className='flex items-center space-x-1'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <span>{children}</span>

          {/* Required indicator */}
          {(required || variant === 'required') && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='text-red-400 ml-1' aria-label='Required field'>
              *
            </span>
          )}

          {/* Optional indicator */}
          {(optional || variant === 'optional') && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='text-gray-500 text-xs font-normal ml-1'>(optional)</span>
          )}

          {/* Cyber glow effect */}
          {variant === 'cyber' && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='w-2 h-2 bg-cyan-400 rounded-full animate-pulse ml-2' />
          )}
        </span>
      </motion.label>
    );
  }
);

Label.displayName = 'Label';

export default Label;
