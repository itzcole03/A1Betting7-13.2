import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
export interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
  orientation: 'horizontal' | 'vertical';
  variant: 'default' | 'cyber' | 'glass' | 'pills';
}

export interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'cyber' | 'glass' | 'pills';
  children: React.ReactNode;
  className?: string;
}

export interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

// Context
const TabsContext = createContext<TabsContextType | undefined>(undefined);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
};

// Main Tabs Component
export const Tabs: React.FC<TabsProps> = ({
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  orientation = 'horizontal',
  variant = 'default',
  children,
  className = '',
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);

  const value = controlledValue ?? internalValue;

  const handleValueChange = (newValue: string) => {
    if (!controlledValue) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  const contextValue: TabsContextType = {
    value,
    onValueChange: handleValueChange,
    orientation,
    variant,
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div
        className={`
          ${orientation === 'vertical' ? 'flex' : ''}
          ${className}
        `}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
};

// Tabs List Component
export const TabsList: React.FC<TabsListProps> = ({ children, className = '' }) => {
  const { orientation, variant } = useTabsContext();

  const variantClasses = {
    default: `
      bg-slate-800/50 border border-slate-700/50 rounded-lg p-1
    `,
    cyber: `
      bg-slate-900/50 border-2 border-cyan-500/30 rounded-lg p-1
      shadow-[0_0_10px_rgba(34,211,238,0.2)]
    `,
    glass: `
      bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-1
    `,
    pills: `
      bg-transparent space-x-2
    `,
  };

  const orientationClasses = orientation === 'vertical' ? 'flex-col space-y-1' : 'flex space-x-1';

  return (
    <div
      className={`
        ${orientationClasses}
        ${variantClasses[variant]}
        ${className}
      `}
      role='tablist'
      aria-orientation={orientation}
    >
      {children}
    </div>
  );
};

// Tabs Trigger Component
export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  children,
  disabled = false,
  className = '',
}) => {
  const { value: selectedValue, onValueChange, variant } = useTabsContext();
  const isSelected = selectedValue === value;

  const variantClasses = {
    default: isSelected
      ? 'bg-slate-700 text-white border-slate-600'
      : 'text-gray-400 hover:text-white hover:bg-slate-700/50',
    cyber: isSelected
      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
      : 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 border-transparent',
    glass: isSelected
      ? 'bg-white/10 text-white border-white/20'
      : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent',
    pills: isSelected
      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
      : 'bg-slate-700/50 text-gray-400 hover:text-white hover:bg-slate-600/50',
  };

  const triggerVariants = {
    inactive: { scale: 1, opacity: 0.8 },
    active: { scale: 1.02, opacity: 1 },
    hover: { scale: 1.01, opacity: 1 },
  };

  return (
    <motion.button
      role='tab'
      aria-selected={isSelected}
      aria-controls={`tabpanel-${value}`}
      tabIndex={isSelected ? 0 : -1}
      disabled={disabled}
      onClick={() => !disabled && onValueChange(value)}
      className={`
        relative px-4 py-2 rounded-md font-medium text-sm transition-all duration-200
        border focus:outline-none focus:ring-2 focus:ring-cyan-400/50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${className}
      `}
      variants={triggerVariants}
      initial='inactive'
      animate={isSelected ? 'active' : 'inactive'}
      whileHover={!disabled ? 'hover' : undefined}
    >
      {children}

      {/* Active indicator for cyber variant */}
      {variant === 'cyber' && isSelected && (
        <motion.div
          className='absolute bottom-0 left-1/2 w-8 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500'
          initial={{ scaleX: 0, x: '-50%' }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Glow effect for pills variant */}
      {variant === 'pills' && isSelected && (
        <div className='absolute inset-0 rounded-md bg-gradient-to-r from-cyan-500/20 to-blue-600/20 animate-pulse' />
      )}
    </motion.button>
  );
};

// Tabs Content Component
export const TabsContent: React.FC<TabsContentProps> = ({ value, children, className = '' }) => {
  const { value: selectedValue } = useTabsContext();
  const isSelected = selectedValue === value;

  const contentVariants = {
    hidden: {
      opacity: 0,
      y: 10,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: 'easeIn',
      },
    },
  };

  return (
    <AnimatePresence mode='wait'>
      {isSelected && (
        <motion.div
          key={value}
          role='tabpanel'
          id={`tabpanel-${value}`}
          aria-labelledby={`tab-${value}`}
          className={`focus:outline-none ${className}`}
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

// Export all components
export default Tabs;
