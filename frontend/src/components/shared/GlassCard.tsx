/**
 * Glass Card Component - Phase 3.3 UI/UX Consistency
 * Reusable glass morphism card using design tokens
 */

import React from 'react';

// Simple class name utility
const cn = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'light' | 'strong' | 'minimal';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

const GlassCard: React.FC<GlassCardProps> = ({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...props
}) => {
  const baseClasses = 'glass-card';
  
  const variantClasses = {
    default: '',
    light: 'glass-card--light',
    strong: 'glass-card--strong',
    minimal: 'opacity-80'
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
