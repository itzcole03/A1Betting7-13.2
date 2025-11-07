import React, { useEffect, useId, useRef, useState } from 'react';

export interface DropdownOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  onSelect?: (option: DropdownOption) => void;
}

export interface DropdownProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  options: DropdownOption[];
  selectedValue?: string;
  defaultValue?: string;
  placeholder?: React.ReactNode;
  label?: React.ReactNode;
  onSelect?: (option: DropdownOption) => void;
  align?: 'left' | 'right';
  triggerClassName?: string;
  menuClassName?: string;
  emptyState?: React.ReactNode;
}

const findOption = (options: DropdownOption[], value?: string) =>
  value ? options.find(option => option.value === value) : undefined;

/**
 * Lightweight dropdown/menu primitive with click-outside dismissal.
 */
export const Dropdown: React.FC<DropdownProps> = ({
  options,
  selectedValue,
  defaultValue,
  placeholder = 'Select…',
  label,
  onSelect,
  align = 'left',
  triggerClassName = '',
  menuClassName = '',
  emptyState = <span className='text-sm text-slate-400'>No options</span>,
  className = '',
  ...props
}) => {
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = selectedValue !== undefined;

  const activeValue = isControlled ? selectedValue : uncontrolledValue;
  const activeOption = findOption(options, activeValue);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        open &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !triggerRef.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      window.addEventListener('mousedown', handleClickOutside);
    }

    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKey);

    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleSelect = (option: DropdownOption) => {
    if (option.disabled) {
      return;
    }

    option.onSelect?.(option);
    onSelect?.(option);

    if (!isControlled) {
      setUncontrolledValue(option.value);
    }

    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className={`relative inline-flex flex-col gap-1 ${className}`.trim()} {...props}>
      {label ? (
        <span className='text-xs font-semibold uppercase tracking-wide text-slate-400'>
          {label}
        </span>
      ) : null}
      <button
        type='button'
        ref={triggerRef}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen(current => !current)}
        className={`flex items-center justify-between gap-2 rounded-md border border-slate-700/70 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-cyan-400/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${triggerClassName}`.trim()}
      >
        <span className='flex items-center gap-2 truncate'>
          {activeOption?.icon ? <span aria-hidden='true'>{activeOption.icon}</span> : null}
          <span className={activeOption ? 'text-slate-100' : 'text-slate-400'}>
            {activeOption?.label ?? placeholder}
          </span>
        </span>
        <span aria-hidden='true' className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {open ? (
        <div
          ref={menuRef}
          id={listboxId}
          role='listbox'
          tabIndex={-1}
          className={`absolute z-40 mt-1 min-w-[12rem] overflow-hidden rounded-md border border-slate-800/70 bg-slate-900/95 shadow-xl ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${menuClassName}`.trim()}
        >
          {options.length === 0 ? (
            <div className='px-4 py-3 text-center'>{emptyState}</div>
          ) : (
            <ul className='max-h-64 overflow-y-auto py-1 text-sm text-slate-200'>
              {options.map(option => {
                const isActive = option.value === activeOption?.value;

                return (
                  <li key={option.value}>
                    <button
                      type='button'
                      role='option'
                      aria-selected={isActive}
                      disabled={option.disabled}
                      onClick={() => handleSelect(option)}
                      className={`flex w-full items-start gap-2 px-3 py-2 text-left transition-colors ${
                        option.disabled
                          ? 'cursor-not-allowed text-slate-500/70'
                          : 'hover:bg-slate-800'
                      } ${isActive ? 'bg-slate-800 text-cyan-200' : ''}`.trim()}
                    >
                      {option.icon ? <span aria-hidden='true'>{option.icon}</span> : null}
                      <span className='flex flex-col gap-1'>
                        <span>{option.label}</span>
                        {option.description ? (
                          <span className='text-xs text-slate-400'>{option.description}</span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default Dropdown;
