import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  heading?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  closeOnOverlayClick?: boolean;
}

/**
 * Accessible modal dialog that keeps focus trapped and restores it on close.
 */
export const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  (
    {
      open,
      onOpenChange,
      heading,
      description,
      footer,
      closeOnOverlayClick = true,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseId = useId();
    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const fallbackRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
      if (!open) {
        return undefined;
      }

      fallbackRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onOpenChange?.(false);
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        fallbackRef.current?.focus?.();
      };
    }, [open, onOpenChange]);

    useEffect(() => {
      if (open && contentRef.current) {
        const firstInteractive = contentRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        firstInteractive?.focus?.();
      }
    }, [open]);

    if (!open) {
      return null;
    }

    const contentId = heading ? `${baseId}-dialog-heading` : undefined;
    const descriptionId = description ? `${baseId}-dialog-description` : undefined;

    const modalContent = (
      <div className='fixed inset-0 z-50 flex items-center justify-center px-4 py-6'>
        <div
          ref={overlayRef}
          className='absolute inset-0 bg-slate-950/75 backdrop-blur-sm'
          onClick={event => {
            if (event.target === overlayRef.current && closeOnOverlayClick) {
              onOpenChange?.(false);
            }
          }}
        />
        <div
          ref={node => {
            contentRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }
          }}
          role='dialog'
          aria-modal='true'
          aria-labelledby={contentId}
          aria-describedby={descriptionId}
          className={`relative z-10 w-full max-w-lg rounded-xl border border-slate-800/70 bg-slate-900/95 shadow-2xl ${className}`.trim()}
          {...props}
        >
          <div className='px-6 py-5'>
            {heading ? (
              <h2 id={contentId} className='text-lg font-semibold text-white'>
                {heading}
              </h2>
            ) : null}
            {description ? (
              <p id={descriptionId} className='mt-2 text-sm text-slate-300'>
                {description}
              </p>
            ) : null}
            {children ? <div className='mt-4 text-sm text-slate-200'>{children}</div> : null}
          </div>
          {footer ? (
            <div className='px-6 py-4 bg-slate-900/80 border-t border-slate-800/60'>{footer}</div>
          ) : null}
        </div>
      </div>
    );

    return typeof document !== 'undefined'
      ? createPortal(modalContent, document.body)
      : modalContent;
  }
);

Dialog.displayName = 'Dialog';

export default Dialog;
