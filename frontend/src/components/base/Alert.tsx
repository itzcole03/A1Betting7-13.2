import React from 'react';

export type AlertTone = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: AlertTone;
  heading?: React.ReactNode;
  message?: React.ReactNode;
  children?: React.ReactNode;
}

const toneStyles: Record<AlertTone, string> = {
  info: 'bg-cyan-500/15 border border-cyan-400/40 text-cyan-100',
  success: 'bg-emerald-500/15 border border-emerald-400/40 text-emerald-100',
  warning: 'bg-amber-500/15 border border-amber-400/40 text-amber-100',
  error: 'bg-rose-500/15 border border-rose-400/40 text-rose-100',
};

/**
 * Non-opinionated alert primitive with theming hooks.
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ tone = 'info', heading, message, children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        role='alert'
        className={`rounded-lg px-4 py-3 text-sm leading-relaxed shadow-sm ${toneStyles[tone]} ${className}`.trim()}
        {...props}
      >
        {heading ? <h4 className='font-semibold text-base mb-1'>{heading}</h4> : null}
        {message ? <p className='mb-1 last:mb-0'>{message}</p> : null}
        {children}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export default Alert;
