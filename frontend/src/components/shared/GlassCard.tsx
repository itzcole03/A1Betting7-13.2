/**
 * Glass Card Component - Phase 3.2 Shared UI Components
 * Reusable glass morphism card with consistent styling
 */

import React from 'react';

// Simple class name utility
const cn = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'compact' | 'featured' | 'minimal';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  opacity?: 'light' | 'medium' | 'heavy';
  border?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

const GlassCard: React.FC<GlassCardProps> = ({
  variant = 'default',
  blur = 'lg',
  opacity = 'medium',
  border = true,
  padding = 'md',
  className,
  children,
  ...props
}) => {
  const baseClasses = 'rounded-xl';
  
  const variantClasses = {
    default: 'bg-slate-800/50',
    compact: 'bg-slate-900/40',
    featured: 'bg-gradient-to-br from-slate-800/60 to-slate-900/40',
    minimal: 'bg-slate-800/30'
  };

  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md', 
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl'
  };

  const opacityClasses = {
    light: opacity === 'light' ? variantClasses[variant].replace('/50', '/30').replace('/40', '/25').replace('/60', '/35') : '',
    medium: variantClasses[variant],
    heavy: opacity === 'heavy' ? variantClasses[variant].replace('/50', '/70').replace('/40', '/60').replace('/30', '/50') : ''
  };

  const borderClasses = border ? 'border border-slate-700/50' : '';

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
        opacity === 'light' || opacity === 'heavy' ? opacityClasses[opacity] || variantClasses[variant] : variantClasses[variant],
        blurClasses[blur],
        borderClasses,
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
