import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export type ToastTone = 'default' | 'success' | 'warning' | 'danger';

export interface ToastProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  heading?: React.ReactNode;
  description?: React.ReactNode;
  tone?: ToastTone;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
  withinPortal?: boolean;
}

const toneStyles: Record<ToastTone, string> = {
  default: 'border-slate-700/70 bg-slate-900/95 text-slate-100',
  success: 'border-emerald-500/40 bg-emerald-950/80 text-emerald-100',
  warning: 'border-amber-500/40 bg-amber-950/80 text-amber-100',
  danger: 'border-rose-500/40 bg-rose-950/80 text-rose-100',
};

/**
 * Toast notification primitive. Consumers control stacking strategy.
 */
export const Toast: React.FC<ToastProps> = ({
  open,
  onOpenChange,
  heading,
  description,
  tone = 'default',
  duration,
  actionLabel,
  onAction,
  dismissible = true,
  withinPortal = true,
  className = '',
  ...props
}) => {
  useEffect(() => {
    if (!open || !duration) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      onOpenChange?.(false);
    }, duration);

    return () => window.clearTimeout(timeout);
  }, [open, duration, onOpenChange]);

  if (!open) {
    return null;
  }

  const content = (
    <div className='pointer-events-none fixed bottom-6 right-6 z-50 flex max-w-sm flex-col gap-2'>
      <div
        role='status'
        className={`pointer-events-auto w-full overflow-hidden rounded-lg border shadow-lg backdrop-blur ${toneStyles[tone]} ${className}`.trim()}
        {...props}
      >
        <div className='px-4 py-3'>
          {heading ? <p className='text-sm font-semibold'>{heading}</p> : null}
          {description ? <p className='mt-1 text-sm text-slate-300/90'>{description}</p> : null}
        </div>
        {(dismissible || actionLabel) && (
          <div className='flex items-center justify-between gap-3 border-t border-white/5 px-4 py-2 text-xs uppercase tracking-wide text-slate-300/80'>
            {actionLabel ? (
              <button
                type='button'
                onClick={() => {
                  onAction?.();
                  onOpenChange?.(false);
                }}
                className='rounded-md bg-white/10 px-3 py-1 font-semibold text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40'
              >
                {actionLabel}
              </button>
            ) : (
              <span />
            )}
            {dismissible ? (
              <button
                type='button'
                onClick={() => onOpenChange?.(false)}
                className='rounded-md px-2 py-1 text-slate-300/80 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
              >
                Close
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );

  if (!withinPortal) {
    return content;
  }

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
};

export default Toast;
