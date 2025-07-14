import { motion } from 'framer-motion';
import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  asChild?: boolean;
  children: React.ReactNode;
}

/**
 * Button Component
 *
 * A versatile, accessible button with multiple variants and sizes, built for the A1Betting platform.
 * Includes loading states and smooth animations.
 *
 * @param variant - Visual style of the button
 * @param size - Size of the button
 * @param isLoading - Whether the button is in a loading state
 * @param asChild - Whether to render as a child element (for use with other components)
 * @param children - Button content
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      asChild = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center rounded-md font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses: Record<ButtonVariant, string> = {
      primary: 'bg-cyan-500 text-white hover:bg-cyan-600 focus-visible:ring-cyan-500',
      secondary: 'bg-gray-700 text-white hover:bg-gray-600 focus-visible:ring-gray-500',
      outline:
        'border border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 focus-visible:ring-cyan-500',
      ghost: 'text-gray-300 hover:bg-gray-700 hover:text-white',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
    };

    const sizeClasses: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      icon: 'h-10 w-10',
    };

    const Comp = asChild ? 'span' : 'button';

    return (
      <motion.button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
          className || ''
        }`}
        whileHover={{ scale: isLoading || props.disabled ? 1 : 1.05 }}
        whileTap={{ scale: isLoading || props.disabled ? 1 : 0.95 }}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <motion.div
            className='w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2'
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        )}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
