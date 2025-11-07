import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  glow?: boolean;
  dot?: boolean;
  dotColor?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-800/80 text-slate-100 border border-slate-700/80',
  success: 'bg-emerald-600/20 text-emerald-200 border border-emerald-400/40',
  warning: 'bg-amber-500/20 text-amber-100 border border-amber-400/40',
  danger: 'bg-rose-600/20 text-rose-100 border border-rose-400/40',
  info: 'bg-cyan-600/25 text-cyan-100 border border-cyan-400/40',
  outline: 'bg-transparent text-slate-100 border border-slate-600/60',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

/**
 * Visual label primitive with light styling defaults.
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      glow = false,
      dot = false,
      dotColor,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const classes = [
      'inline-flex items-center gap-1 font-medium rounded-full transition-colors whitespace-nowrap select-none',
      variantClasses[variant],
      sizeClasses[size],
      glow ? 'shadow-[0_0_12px_rgba(34,211,238,0.35)]' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <span ref={ref} className={classes} {...props}>
        {dot ? (
          <span
            aria-hidden='true'
            className='inline-block h-1.5 w-1.5 rounded-full'
            style={{ backgroundColor: dotColor ?? 'currentColor' }}
          />
        ) : null}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
