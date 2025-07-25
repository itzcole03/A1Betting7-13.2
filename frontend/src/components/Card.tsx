import { motion } from 'framer-motion';
import React from 'react';

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'as'> {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'outline';
  hoverEffect?: boolean;
}

/**
 * Card Component
 *
 * A versatile card component with multiple styles and hover effects, designed for the A1Betting platform.
 * Used to create consistent layouts and container styles.
 *
 * @param variant - Visual style of the card
 * @param hoverEffect - Whether to apply a hover effect
 * @param children - Card content
 */

export const _Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', hoverEffect = false, children, className, ...props }, ref) => {
    const baseClasses = 'rounded-lg overflow-hidden transition-all duration-300';
    const variantClasses: Record<string, string> = {
      default: 'bg-gray-800 border border-gray-700',
      glass: 'bg-white/5 backdrop-blur-md border border-white/10',
      outline: 'bg-transparent border border-gray-700',
    };
    const hoverClasses = hoverEffect
      ? 'hover:shadow-lg hover:border-cyan-500/50 hover:-translate-y-1'
      : '';
    // Destructure out problematic drag-related props
    const { onDrag, onDragStart, onDragEnd, onAnimationStart, ...rest } = props;
    return (
      <motion.div
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className || ''}`}
        whileHover={hoverEffect ? { scale: 1.02 } : {}}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }
);
_Card.displayName = 'Card';

// Card Subcomponents for better structure

export const _CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`p-6 border-b border-gray-700 ${className}`} {...props} />
  )
);
_CardHeader.displayName = 'CardHeader';

export const _CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={`p-6 ${className}`} {...props} />
);
_CardContent.displayName = 'CardContent';

export const _CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`p-6 border-t border-gray-700 ${className}`} {...props} />
  )
);
_CardFooter.displayName = 'CardFooter';

// Export all as named exports for clarity
export default _Card;
