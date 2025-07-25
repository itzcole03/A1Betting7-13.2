import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  variant?: 'default' | 'cyber' | 'minimal' | 'rich';
  className?: string;
  contentClassName?: string;
  trigger?: 'hover' | 'click' | 'focus' | 'manual';
  delay?: number;
  offset?: number;
  disabled?: boolean;
  arrow?: boolean;
  maxWidth?: number;
  showOnOverflow?: boolean;
  isVisible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}

export const _Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'auto',
  variant = 'default',
  className = '',
  contentClassName = '',
  trigger = 'hover',
  delay = 300,
  offset = 8,
  disabled = false,
  arrow = true,
  maxWidth = 250,
  showOnOverflow = false,
  isVisible: controlledVisible,
  onVisibilityChange,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const _triggerRef = useRef<HTMLDivElement>(null);
  const _tooltipRef = useRef<HTMLDivElement>(null);
  const _timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const _visible = controlledVisible !== undefined ? controlledVisible : isVisible;

  // Check for text overflow if showOnOverflow is enabled
  useEffect(() => {
    if (showOnOverflow && triggerRef.current) {
      const _element = triggerRef.current;
      const _isOverflow =
        element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;
      setIsOverflowing(isOverflow);
    }
  }, [showOnOverflow, children]);

  // Calculate optimal position
  useEffect(() => {
    if (visible && position === 'auto' && triggerRef.current && tooltipRef.current) {
      const _triggerRect = triggerRef.current.getBoundingClientRect();
      const _tooltipRect = tooltipRef.current.getBoundingClientRect();
      const _viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      let _bestPosition = 'top';

      // Check space availability in each direction
      const _spaceTop = triggerRect.top;
      const _spaceBottom = viewport.height - triggerRect.bottom;
      const _spaceLeft = triggerRect.left;
      const _spaceRight = viewport.width - triggerRect.right;

      if (spaceTop >= tooltipRect.height + offset) {
        bestPosition = 'top';
      } else if (spaceBottom >= tooltipRect.height + offset) {
        bestPosition = 'bottom';
      } else if (spaceLeft >= tooltipRect.width + offset) {
        bestPosition = 'left';
      } else if (spaceRight >= tooltipRect.width + offset) {
        bestPosition = 'right';
      } else {
        // Use the direction with most space
        const _maxSpace = Math.max(spaceTop, spaceBottom, spaceLeft, spaceRight);
        if (maxSpace === spaceTop) bestPosition = 'top';
        else if (maxSpace === spaceBottom) bestPosition = 'bottom';
        else if (maxSpace === spaceLeft) bestPosition = 'left';
        else bestPosition = 'right';
      }

      setActualPosition(bestPosition as unknown);
    } else if (position !== 'auto') {
      setActualPosition(position);
    }
  }, [visible, position, offset]);

  const _showTooltip = () => {
    if (disabled || (showOnOverflow && !isOverflowing)) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (trigger === 'hover' && delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
        onVisibilityChange?.(true);
      }, delay);
    } else {
      setIsVisible(true);
      onVisibilityChange?.(true);
    }
  };

  const _hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (trigger === 'hover' && delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        onVisibilityChange?.(false);
      }, 100);
    } else {
      setIsVisible(false);
      onVisibilityChange?.(false);
    }
  };

  const _toggleTooltip = () => {
    if (visible) {
      hideTooltip();
    } else {
      showTooltip();
    }
  };

  const _getPositionClasses = () => {
    const _baseOffset = offset;

    switch (actualPosition) {
      case 'top':
        return {
          tooltip: 'bottom-full left-1/2 transform -translate-x-1/2',
          margin: `mb-${baseOffset}`,
          arrow:
            'top-full left-1/2 transform -translate-x-1/2 border-t-4 border-l-4 border-r-4 border-transparent',
        };
      case 'bottom':
        return {
          tooltip: 'top-full left-1/2 transform -translate-x-1/2',
          margin: `mt-${baseOffset}`,
          arrow:
            'bottom-full left-1/2 transform -translate-x-1/2 border-b-4 border-l-4 border-r-4 border-transparent',
        };
      case 'left':
        return {
          tooltip: 'right-full top-1/2 transform -translate-y-1/2',
          margin: `mr-${baseOffset}`,
          arrow:
            'left-full top-1/2 transform -translate-y-1/2 border-l-4 border-t-4 border-b-4 border-transparent',
        };
      case 'right':
        return {
          tooltip: 'left-full top-1/2 transform -translate-y-1/2',
          margin: `ml-${baseOffset}`,
          arrow:
            'right-full top-1/2 transform -translate-y-1/2 border-r-4 border-t-4 border-b-4 border-transparent',
        };
      default:
        return {
          tooltip: 'bottom-full left-1/2 transform -translate-x-1/2',
          margin: 'mb-2',
          arrow:
            'top-full left-1/2 transform -translate-x-1/2 border-t-4 border-l-4 border-r-4 border-transparent',
        };
    }
  };

  const _positionClasses = getPositionClasses();

  const _getTooltipStyles = () => {
    const _baseStyles = {
      maxWidth: `${maxWidth}px`,
      zIndex: 9999,
    };

    switch (variant) {
      case 'cyber':
        return {
          ...baseStyles,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          border: '1px solid rgba(34, 211, 238, 0.5)',
          boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)',
          color: '#22d3ee',
        };
      case 'minimal':
        return {
          ...baseStyles,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
        };
      case 'rich':
        return {
          ...baseStyles,
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          color: '#374151',
        };
      default:
        return {
          ...baseStyles,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
        };
    }
  };

  const _getArrowStyles = () => {
    const _borderColor =
      variant === 'cyber' ? '#22d3ee' : variant === 'rich' ? '#e5e7eb' : 'rgba(0, 0, 0, 0.9)';

    switch (actualPosition) {
      case 'top':
        return { borderTopColor: borderColor };
      case 'bottom':
        return { borderBottomColor: borderColor };
      case 'left':
        return { borderLeftColor: borderColor };
      case 'right':
        return { borderRightColor: borderColor };
      default:
        return { borderTopColor: borderColor };
    }
  };

  const _triggerProps = {
    ref: triggerRef,
    className: `relative inline-block ${className}`,
    ...(trigger === 'hover' && {
      onMouseEnter: showTooltip,
      onMouseLeave: hideTooltip,
    }),
    ...(trigger === 'click' && {
      onClick: toggleTooltip,
    }),
    ...(trigger === 'focus' && {
      onFocus: showTooltip,
      onBlur: hideTooltip,
    }),
  };

  const _tooltipVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: actualPosition === 'top' ? 10 : actualPosition === 'bottom' ? -10 : 0,
      x: actualPosition === 'left' ? 10 : actualPosition === 'right' ? -10 : 0,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
    },
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div {...triggerProps}>
      {children}

      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <AnimatePresence>
        {visible && content && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            ref={tooltipRef}
            initial='hidden'
            animate='visible'
            exit='hidden'
            variants={tooltipVariants}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute ${positionClasses.tooltip} ${positionClasses.margin} pointer-events-none`}
            style={getTooltipStyles()}
          >
            {/* Cyber grid overlay */}
            {variant === 'cyber' && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='absolute inset-0 opacity-20 pointer-events-none'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='grid grid-cols-4 grid-rows-3 h-full w-full'>
                  {Array.from({ length: 12 }).map((_, i) => (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div key={i} className='border border-cyan-400/30' />
                  ))}
                </div>
              </div>
            )}

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className={`relative z-10 px-3 py-2 rounded-lg text-sm ${contentClassName}`}>
              {content}
            </div>

            {/* Arrow */}
            {arrow && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className={`absolute ${positionClasses.arrow}`} style={getArrowStyles()} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
