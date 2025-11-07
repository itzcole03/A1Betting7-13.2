import { X } from 'lucide-react';
import React, { useEffect } from 'react';
import { Button } from './Button';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';
export type ModalVariant = 'default' | 'cyber' | 'minimal';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  variant?: ModalVariant;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const variantClasses: Record<ModalVariant, string> = {
  default: 'bg-slate-900/95 border border-slate-800 shadow-xl',
  cyber: 'bg-slate-950/95 border border-cyan-400/40 shadow-[0_0_40px_rgba(34,211,238,0.25)]',
  minimal: 'bg-slate-900/90 border border-slate-700 shadow-lg',
};

/**
 * Composable modal with escape handling and overlay control.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  variant = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
}) => {
  useEffect(() => {
    if (!isOpen || !closeOnEscape) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div
        className='absolute inset-0 bg-slate-950/70 backdrop-blur-sm'
        onClick={handleOverlayClick}
      />
      <div
        role='dialog'
        aria-modal='true'
        aria-label={typeof title === 'string' ? title : undefined}
        className={`relative w-full rounded-2xl focus:outline-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`.trim()}
      >
        {(title || showCloseButton) && (
          <header className='flex items-center justify-between px-6 py-4 border-b border-slate-800'>
            {title ? <h2 className='text-lg font-semibold text-slate-100'>{title}</h2> : <span />}
            {showCloseButton ? (
              <Button variant='ghost' size='sm' aria-label='Close modal' onClick={onClose}>
                <X className='h-5 w-5' />
              </Button>
            ) : null}
          </header>
        )}
        <section className='px-6 py-5 text-slate-200'>{children}</section>
        {footer ? (
          <footer className='px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3'>
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
};

export default Modal;
