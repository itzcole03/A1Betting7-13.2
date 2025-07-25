import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, X } from 'lucide-react';

// Types
export interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  variant: 'default' | 'cyber' | 'glass';
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  variant?: 'default' | 'cyber' | 'glass';
  children: React.ReactNode;
}

export interface SelectTriggerProps {
  children?: React.ReactNode;
  className?: string;
}

export interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
  position?: 'popper' | 'item-aligned';
}

export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

// Context
const _SelectContext = createContext<SelectContextType | undefined>(undefined);

const _useSelectContext = () => {
  const _context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within a Select provider');
  }
  return context;
};

// Main Select Component
export const _Select: React.FC<SelectProps> = ({
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  placeholder,
  disabled = false,
  variant = 'default',
  children,
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);

  const _value = controlledValue ?? internalValue;

  const _handleValueChange = (newValue: string) => {
    if (!controlledValue) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
    setOpen(false);
  };

  const _handleOpenChange = (newOpen: boolean) => {
    if (!disabled) {
      setOpen(newOpen);
    }
  };

  const _contextValue: SelectContextType = {
    value,
    onValueChange: handleValueChange,
    open,
    onOpenChange: handleOpenChange,
    placeholder,
    disabled,
    variant,
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <SelectContext.Provider value={contextValue}>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='relative'>{children}</div>
    </SelectContext.Provider>
  );
};

// Select Trigger Component
export const _SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className = '' }) => {
  const { open, onOpenChange, disabled, variant } = useSelectContext();
  const _triggerRef = useRef<HTMLButtonElement>(null);

  const _variantClasses = {
    default: `
      bg-slate-800/50 border border-slate-600/50 
      hover:border-slate-500/50
      focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50
    `,
    cyber: `
      bg-slate-900/50 border-2 border-cyan-500/30 
      hover:border-cyan-500/50
      focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20
      shadow-[0_0_10px_rgba(34,211,238,0.1)]
      focus:shadow-[0_0_20px_rgba(34,211,238,0.3)]
    `,
    glass: `
      bg-white/5 backdrop-blur-lg border border-white/10
      hover:border-white/20
      focus:border-white/30 focus:ring-1 focus:ring-white/20
    `,
  };

  const _triggerVariants = {
    closed: { scale: 1 },
    open: { scale: 1.01 },
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <motion.button
      ref={triggerRef}
      type='button'
      role='combobox'
      aria-expanded={open}
      aria-haspopup='listbox'
      disabled={disabled}
      onClick={() => onOpenChange(!open)}
      className={`
        flex items-center justify-between w-full px-4 py-3 text-left
        rounded-lg text-white transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${className}
      `}
      variants={triggerVariants}
      animate={open ? 'open' : 'closed'}
    >
      {children}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <ChevronDown
        className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      />
    </motion.button>
  );
};

// Select Value Component
export const _SelectValue: React.FC<SelectValueProps> = ({
  placeholder: propPlaceholder,
  className = '',
}) => {
  const { value, placeholder: contextPlaceholder } = useSelectContext();
  const _displayPlaceholder = propPlaceholder ?? contextPlaceholder;

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <span className={`truncate ${className}`}>
      {value || (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <span className='text-gray-400'>{displayPlaceholder || 'Select an option...'}</span>
      )}
    </span>
  );
};

// Select Content Component
export const _SelectContent: React.FC<SelectContentProps> = ({
  children,
  className = '',
  position = 'popper',
}) => {
  const { open, variant } = useSelectContext();
  const _contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const _handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        // We would call onOpenChange(false) here, but we don't have access to it
        // This would be handled by the trigger's blur event in a real implementation
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const _variantClasses = {
    default: 'bg-slate-800 border border-slate-700',
    cyber: 'bg-slate-900 border-2 border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]',
    glass: 'bg-black/20 backdrop-blur-xl border border-white/10',
  };

  const _contentVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: -10,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.15,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: {
        duration: 0.1,
        ease: 'easeIn',
      },
    },
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <AnimatePresence>
      {open && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <motion.div
          ref={contentRef}
          role='listbox'
          className={`
            absolute z-50 mt-2 w-full rounded-lg shadow-lg
            max-h-60 overflow-auto p-1
            ${variantClasses[variant]}
            ${className}
          `}
          // @ts-expect-error TS(2322): Type '{ hidden: { opacity: number; scale: number; ... Remove this comment to see the full error message
          variants={contentVariants}
          initial='hidden'
          animate='visible'
          exit='exit'
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Select Item Component
export const _SelectItem: React.FC<SelectItemProps> = ({
  value,
  children,
  disabled = false,
  className = '',
}) => {
  const { value: selectedValue, onValueChange, variant } = useSelectContext();
  const _isSelected = selectedValue === value;

  const _variantClasses = {
    default: isSelected ? 'bg-slate-700 text-white' : 'hover:bg-slate-700/50 text-gray-300',
    cyber: isSelected
      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400'
      : 'hover:bg-cyan-500/10 text-gray-300 hover:text-cyan-400',
    glass: isSelected ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-300',
  };

  const _itemVariants = {
    default: { scale: 1 },
    hover: { scale: 1.01 },
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <motion.div
      role='option'
      aria-selected={isSelected}
      onClick={() => !disabled && onValueChange(value)}
      className={`
        flex items-center justify-between px-3 py-2 rounded-md cursor-pointer
        transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${className}
      `}
      variants={itemVariants}
      initial='default'
      whileHover={!disabled ? 'hover' : undefined}
    >
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <span className='truncate'>{children}</span>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      {isSelected && <Check className='w-4 h-4 ml-2 flex-shrink-0' />}
    </motion.div>
  );
};

// Export all components
export default Select;
