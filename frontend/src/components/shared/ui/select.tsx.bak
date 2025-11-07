/**
 * Select component suite
 * Purpose: Provide both a simple native <select> (Select) and legacy composite API (_Select, _SelectTrigger, etc.).
 * Constraints: Backwards-compatible exports; minimal logic; no animation libs.
 */
import React, { useState, useContext, useCallback } from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'default' | 'quiet';
  error?: string;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  onValueChange?: (value: string) => void; // compatibility with prior composite API
}

const variantMap: Record<NonNullable<SelectProps['variant']>, string> = {
  default: 'bg-slate-800/50 border border-slate-600/50 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 hover:border-slate-500/50',
  quiet: 'bg-transparent border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40',
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', variant = 'default', error, options, children, onValueChange, onChange, ...rest }, ref) => {
    const classes = `w-full rounded-lg text-white px-4 py-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variantMap[variant]} ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`;
    return (
      <div className='space-y-2'>
        <select
          ref={ref}
          className={classes}
          aria-invalid={error ? true : undefined}
          data-testid='ui-select'
          onChange={e => {
            onChange?.(e);
            onValueChange?.(e.target.value);
          }}
          {...rest}
        >
          {options
            ? options.map(o => (
                <option key={o.value} value={o.value} disabled={o.disabled}>
                  {o.label}
                </option>
              ))
            : children}
        </select>
        {error && <p className='text-sm text-red-400'>{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

// --- Legacy composite API (underscore-prefixed) ----
interface LegacyContextValue {
  value: string;
  setValue: (v: string) => void;
  open: boolean;
  setOpen: (o: boolean) => void;
  placeholder?: string;
  variant: NonNullable<SelectProps['variant']>;
}
const LegacySelectContext = React.createContext<LegacyContextValue | null>(null);
const useLegacySelect = () => {
  const ctx = useContext(LegacySelectContext);
  if (!ctx) throw new Error('Select composite components must be used within _Select');
  return ctx;
};

interface LegacySelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  placeholder?: string;
  variant?: 'default' | 'quiet';
  children: React.ReactNode;
}
const LegacySelectRoot: React.FC<LegacySelectProps> = ({
  value,
  defaultValue = '',
  onValueChange,
  placeholder,
  variant = 'default',
  children,
}) => {
  const [internal, setInternal] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const currentValue = value ?? internal;
  const setValue = useCallback(
    (v: string) => {
      if (value === undefined) setInternal(v);
      onValueChange?.(v);
      setOpen(false);
    },
    [value, onValueChange]
  );
  return (
    <LegacySelectContext.Provider
      value={{ value: currentValue, setValue, open, setOpen, placeholder, variant }}
    >
      <div className='relative'>{children}</div>
    </LegacySelectContext.Provider>
  );
};

interface TriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children?: React.ReactNode;
}
const LegacySelectTrigger = React.forwardRef<HTMLButtonElement, TriggerProps>(
  ({ className = '', children, ...rest }, ref) => {
    const { open, setOpen, variant } = useLegacySelect();
    return (
      <button
        ref={ref}
        type='button'
        aria-haspopup='listbox'
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between w-full px-4 py-3 rounded-lg text-white text-left border ${variantMap[variant]} ${className}`}
        {...rest}
      >
        {children}
        <span className={`ml-2 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
    );
  }
);
LegacySelectTrigger.displayName = '_SelectTrigger';

interface ValueProps { className?: string; placeholder?: string }
const LegacySelectValue: React.FC<ValueProps> = ({ className = '', placeholder }) => {
  const { value, placeholder: ctxPlaceholder } = useLegacySelect();
  const resolved = value || placeholder || ctxPlaceholder || '';
  return <span className={`truncate ${className}`}>{resolved}</span>;
};

interface ContentProps { className?: string; children: React.ReactNode }
const LegacySelectContent: React.FC<ContentProps> = ({ className = '', children }) => {
  const { open, variant } = useLegacySelect();
  if (!open) return null;
  return (
    <div
      role='listbox'
      className={`absolute z-50 mt-2 w-full max-h-60 overflow-auto rounded-lg border bg-slate-900 p-1 shadow-lg ${variantMap[variant]} ${className}`}
    >
      {children}
    </div>
  );
};

interface ItemProps { value: string; className?: string; disabled?: boolean; children: React.ReactNode }
const LegacySelectItem: React.FC<ItemProps> = ({
  value,
  className = '',
  disabled = false,
  children,
}) => {
  const { value: current, setValue, variant } = useLegacySelect();
  const selected = current === value;
  return (
    <div
      role='option'
      aria-selected={selected}
      onClick={() => !disabled && setValue(value)}
      className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm ${selected ? 'bg-slate-700 text-white' : 'text-gray-300 hover:bg-slate-700/40'} ${variant === 'quiet' ? 'border-0' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <span className='truncate'>{children}</span>
      {selected && <span className='ml-2 text-cyan-400'>✓</span>}
    </div>
  );
};

// Backwards compatibility: default export remains main Select
// Underscore exports (backwards compatibility)
export const _Select = LegacySelectRoot;
export const _SelectTrigger = LegacySelectTrigger;
export const _SelectValue = LegacySelectValue;
export const _SelectContent = LegacySelectContent;
export const _SelectItem = LegacySelectItem;

export default Select;
