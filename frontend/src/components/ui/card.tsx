import React from 'react';

export const _Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div
      ref={ref}
      className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className || ''}`}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const _CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div ref={ref} className={`flex flex-col space-y-1.5 p-6 ${className || ''}`} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const _CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <h3
    ref={ref}
    className={`text-2xl font-semibold leading-none tracking-tight ${className || ''}`}
    {...props}
  >
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    {children || <span className='sr-only'>Card Title</span>}
  </h3>
));
CardTitle.displayName = 'CardTitle';

export const _CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <p ref={ref} className={`text-sm text-muted-foreground ${className || ''}`} {...props} />
));
CardDescription.displayName = 'CardDescription';

export const _CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div ref={ref} className={`p-6 pt-0 ${className || ''}`} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const _CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div ref={ref} className={`flex items-center p-6 pt-0 ${className || ''}`} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';
