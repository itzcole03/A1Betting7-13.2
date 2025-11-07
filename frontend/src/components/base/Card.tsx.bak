import React from 'react';

export type CardVariant = 'default' | 'glass' | 'outline';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hoverEffect?: boolean;
  padded?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-slate-900/80 border border-slate-800',
  glass: 'bg-white/5 border border-white/10 backdrop-blur-md',
  outline: 'bg-transparent border border-slate-700',
};

/**
 * Base card primitive with common slots.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { variant = 'default', hoverEffect = false, padded = true, className = '', children, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={[
          'rounded-xl transition-all duration-200 shadow-sm overflow-hidden',
          variantClasses[variant],
          hoverEffect ? 'hover:-translate-y-1 hover:shadow-lg' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {padded ? <div className='space-y-4'>{children}</div> : children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`px-6 pt-6 ${className}`.trim()} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = '', ...props }, ref) => (
  <h3 ref={ref} className={`text-xl font-semibold text-slate-50 ${className}`.trim()} {...props} />
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = '', ...props }, ref) => (
  <p ref={ref} className={`text-sm text-slate-400 ${className}`.trim()} {...props} />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`px-6 pb-6 ${className}`.trim()} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`px-6 pb-6 pt-4 border-t border-slate-800 ${className}`.trim()}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export default Card;
