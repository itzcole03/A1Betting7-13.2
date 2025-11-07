import React, { useEffect, useRef, useState } from 'react';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'content'> {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: TooltipPlacement;
  open?: boolean;
  defaultOpen?: boolean;
  delay?: number;
  onOpenChange?: (open: boolean) => void;
  contentClassName?: string;
}

const placementClasses: Record<TooltipPlacement, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 -translate-y-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 translate-y-2',
  left: 'right-full top-1/2 -translate-y-1/2 -translate-x-2',
  right: 'left-full top-1/2 -translate-y-1/2 translate-x-2',
};

/**
 * Minimal tooltip primitive with hover and focus affordances.
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  open,
  defaultOpen = false,
  delay = 120,
  onOpenChange,
  contentClassName = '',
  className = '',
  ...props
}) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [timer, setTimer] = useState<number | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const isControlled = open !== undefined;
  const visible = isControlled ? open : internalOpen;

  const clearDelay = () => {
    if (timer !== null) {
      window.clearTimeout(timer);
      setTimer(null);
    }
  };

  const show = () => {
    clearDelay();

    const id = window.setTimeout(() => {
      if (!isControlled) {
        setInternalOpen(true);
      }
      onOpenChange?.(true);
    }, delay);

    setTimer(id);
  };

  const hide = () => {
    clearDelay();

    const id = window.setTimeout(() => {
      if (!isControlled) {
        setInternalOpen(false);
      }
      onOpenChange?.(false);
    }, 60);

    setTimer(id);
  };

  useEffect(() => () => clearDelay(), [timer]);

  return (
    <div
      className={`relative inline-flex ${className}`.trim()}
      ref={triggerRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      {...props}
    >
      {children}
      {visible ? (
        <div
          role='tooltip'
          className={`pointer-events-none absolute z-40 max-w-xs rounded-md border border-slate-700/70 bg-slate-900/95 px-3 py-2 text-xs text-slate-200 shadow-lg ${placementClasses[placement]} ${contentClassName}`.trim()}
        >
          {content}
        </div>
      ) : null}
    </div>
  );
};

export default Tooltip;
