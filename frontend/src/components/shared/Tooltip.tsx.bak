/**
 * Tooltip Component - Phase 3.3 UI/UX Consistency
 * Standardized tooltip using design tokens
 */

import React, { useState, useRef, useEffect } from 'react';

// Simple class name utility
const cn = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'default' | 'cyber' | 'minimal';
  delay?: number;
  disabled?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  variant = 'default',
  delay = 300,
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState(position);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    if (disabled) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      // Adjust position if tooltip would go off-screen
      setTimeout(adjustPosition, 0);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const adjustPosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let newPosition = position;

    // Check if tooltip goes off right edge
    if (triggerRect.left + tooltipRect.width > viewportWidth) {
      if (position === 'top' || position === 'bottom') {
        // Keep top/bottom but adjust horizontally
      } else if (position === 'right') {
        newPosition = 'left';
      }
    }

    // Check if tooltip goes off left edge
    if (triggerRect.left < 0) {
      if (position === 'left') {
        newPosition = 'right';
      }
    }

    // Check if tooltip goes off top edge
    if (triggerRect.top - tooltipRect.height < 0) {
      if (position === 'top') {
        newPosition = 'bottom';
      }
    }

    // Check if tooltip goes off bottom edge
    if (triggerRect.bottom + tooltipRect.height > viewportHeight) {
      if (position === 'bottom') {
        newPosition = 'top';
      }
    }

    setTooltipPosition(newPosition);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const variantClasses = {
    default: 'bg-slate-800 border border-slate-700 text-white',
    cyber: 'bg-slate-900 border border-cyan-400/30 text-cyan-400 cyber-glow',
    minimal: 'bg-gray-800 border border-gray-600 text-gray-300'
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent'
  };

  const getArrowBorderClass = () => {
    const baseClass = 'border-4';
    switch (variant) {
      case 'cyber':
        return `${baseClass} border-slate-900`;
      case 'minimal':
        return `${baseClass} border-gray-800`;
      default:
        return `${baseClass} border-slate-800`;
    }
  };

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="cursor-help"
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            'absolute z-50 px-2 py-1 text-sm rounded shadow-lg whitespace-nowrap pointer-events-none animate-fade-in',
            variantClasses[variant],
            positionClasses[tooltipPosition]
          )}
          role="tooltip"
        >
          {content}
          
          {/* Arrow */}
          <div
            className={cn(
              'absolute',
              arrowClasses[tooltipPosition],
              getArrowBorderClass()
            )}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
