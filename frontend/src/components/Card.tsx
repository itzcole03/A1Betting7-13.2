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
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
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

    return (
      <motion.div
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className || ''}`}
        whileHover={hoverEffect ? { scale: 1.02 } : {}}
        {...(props as any)}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

// Card Subcomponents for better structure
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`p-6 border-b border-gray-700 ${className}`} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={`p-6 ${className}`} {...props} />
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`p-6 border-t border-gray-700 ${className}`} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { CardContent, CardFooter, CardHeader };
export default Card;
