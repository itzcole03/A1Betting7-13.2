import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Types for styled select
interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
  icon?: string | React.ReactNode;
  image?: string;
  disabled?: boolean;
  group?: string;
  metadata?: Record<string, any>;
}

interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface StyledSelectProps {
  options: SelectOption[] | SelectGroup[];
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  variant?: 'default' | 'cyber' | 'glass' | 'minimal' | 'premium';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  success?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  multiple?: boolean;
  maxSelections?: number;
  showIcons?: boolean;
  showDescriptions?: boolean;
  showImages?: boolean;
  allowCustomValues?: boolean;
  customValueLabel?: string;
  animated?: boolean;
  maxHeight?: number;
  className?: string;
  dropdownClassName?: string;
  optionClassName?: string;
  onChange?: (value: string | number | (string | number)[]) => void;
  onSearch?: (query: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onOpen?: () => void;
  onClose?: () => void;
}

const getSizeClasses = (size: string) => {
  const sizes = {
    sm: {
      trigger: 'h-8 px-2 text-sm',
      option: 'px-2 py-1.5 text-sm',
    },
    md: {
      trigger: 'h-10 px-3 text-base',
      option: 'px-3 py-2 text-base',
    },
    lg: {
      trigger: 'h-12 px-4 text-lg',
      option: 'px-4 py-3 text-lg',
    },
    xl: {
      trigger: 'h-14 px-5 text-xl',
      option: 'px-5 py-4 text-xl',
    },
  };
  return sizes[size as keyof typeof sizes] || sizes.md;
};

const getVariantClasses = (
  variant: string,
  state: { error?: boolean; success?: boolean; disabled?: boolean }
) => {
  const variants = {
    default: {
      trigger: cn(
        'bg-white border border-gray-300 rounded-md shadow-sm',
        state.error && 'border-red-500 ring-1 ring-red-500',
        state.success && 'border-green-500 ring-1 ring-green-500',
        state.disabled && 'bg-gray-100 text-gray-500 cursor-not-allowed',
        !state.disabled &&
          'hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
      ),
      dropdown: 'bg-white border border-gray-200 rounded-md shadow-lg',
      option: 'hover:bg-gray-100 focus:bg-gray-100',
    },
    cyber: {
      trigger: cn(
        'bg-slate-900/90 border border-cyan-500/30 rounded-md shadow-lg shadow-cyan-500/20 backdrop-blur-md text-cyan-300',
        state.error && 'border-red-500/50 shadow-red-500/20',
        state.success && 'border-green-500/50 shadow-green-500/20',
        state.disabled && 'bg-slate-800/50 text-cyan-500/50 cursor-not-allowed',
        !state.disabled && 'hover:border-cyan-400/50 focus:border-cyan-400 focus:shadow-cyan-400/30'
      ),
      dropdown:
        'bg-slate-900/95 border border-cyan-500/30 rounded-md shadow-2xl shadow-cyan-500/20 backdrop-blur-md',
      option: 'text-cyan-300 hover:bg-cyan-500/20 focus:bg-cyan-500/20',
    },
    glass: {
      trigger: cn(
        'bg-white/80 border border-white/20 rounded-lg shadow-lg backdrop-blur-md',
        state.error && 'border-red-500/50',
        state.success && 'border-green-500/50',
        state.disabled && 'bg-white/50 text-gray-500/70 cursor-not-allowed',
        !state.disabled && 'hover:bg-white/90 focus:bg-white/95 focus:border-white/40'
      ),
      dropdown: 'bg-white/90 border border-white/20 rounded-lg shadow-xl backdrop-blur-md',
      option: 'hover:bg-white/50 focus:bg-white/50',
    },
    minimal: {
      trigger: cn(
        'bg-transparent border-0 border-b-2 border-gray-300 rounded-none shadow-none',
        state.error && 'border-red-500',
        state.success && 'border-green-500',
        state.disabled && 'text-gray-500 cursor-not-allowed',
        !state.disabled && 'hover:border-gray-400 focus:border-blue-500'
      ),
      dropdown: 'bg-white border border-gray-200 rounded-md shadow-lg',
      option: 'hover:bg-gray-100 focus:bg-gray-100',
    },
    premium: {
      trigger: cn(
        'bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl shadow-md',
        state.error && 'from-red-50 to-red-50 border-red-300',
        state.success && 'from-green-50 to-green-50 border-green-300',
        state.disabled &&
          'from-gray-50 to-gray-50 border-gray-200 text-gray-500 cursor-not-allowed',
        !state.disabled &&
          'hover:from-purple-100 hover:to-blue-100 focus:from-purple-100 focus:to-blue-100 focus:border-purple-300'
      ),
      dropdown:
        'bg-gradient-to-b from-white to-gray-50 border border-purple-200 rounded-xl shadow-xl',
      option: 'hover:bg-purple-50 focus:bg-purple-50',
    },
  };

  return variants[variant as keyof typeof variants] || variants.default;
};

const isOptionGroup = (item: SelectOption | SelectGroup): item is SelectGroup => {
  return 'options' in item;
};

const flattenOptions = (items: (SelectOption | SelectGroup)[]): SelectOption[] => {
  return items.reduce((acc, item) => {
    if (isOptionGroup(item)) {
      return [...acc, ...item.options];
    }
    return [...acc, item];
  }, [] as SelectOption[]);
};

const filterOptions = (options: SelectOption[], query: string): SelectOption[] => {
  if (!query.trim()) return options;

  const searchTerm = query.toLowerCase();
  return options.filter(
    option =>
      option.label.toLowerCase().includes(searchTerm) ||
      option.description?.toLowerCase().includes(searchTerm) ||
      String(option.value).toLowerCase().includes(searchTerm)
  );
};

export const StyledSelect: React.FC<StyledSelectProps> = ({
  options,
  value,
  defaultValue,
  placeholder = 'Select an option...',
  variant = 'default',
  size = 'md',
  disabled = false,
  loading = false,
  error = false,
  success = false,
  searchable = false,
  clearable = false,
  multiple = false,
  maxSelections,
  showIcons = true,
  showDescriptions = false,
  showImages = false,
  allowCustomValues = false,
  customValueLabel = 'Add "{query}"',
  animated = true,
  maxHeight = 300,
  className,
  dropdownClassName,
  optionClassName,
  onChange,
  onSearch,
  onFocus,
  onBlur,
  onOpen,
  onClose,
}) => {
  const [internalValue, setInternalValue] = useState<string | number | (string | number)[]>(
    value ?? defaultValue ?? (multiple ? [] : '')
  );
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = getSizeClasses(size);
  const variantClasses = getVariantClasses(variant, { error, success, disabled });

  // Flatten options for easier processing
  const flatOptions = flattenOptions(options);

  // Filter options based on search
  const filteredOptions = searchable ? filterOptions(flatOptions, searchQuery) : flatOptions;

  // Add custom value option if enabled and query doesn't match existing options
  const customValueOption: SelectOption | null =
    allowCustomValues &&
    searchQuery.trim() &&
    !filteredOptions.some(opt => opt.label.toLowerCase() === searchQuery.toLowerCase())
      ? {
          value: searchQuery,
          label: customValueLabel.replace('{query}', searchQuery),
          icon: '➕',
        }
      : null;

  const displayOptions = customValueOption
    ? [customValueOption, ...filteredOptions]
    : filteredOptions;

  // Get current selection for display
  const currentValue = value !== undefined ? value : internalValue;
  const selectedOptions = multiple
    ? flatOptions.filter(opt => Array.isArray(currentValue) && currentValue.includes(opt.value))
    : flatOptions.find(opt => opt.value === currentValue);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => Math.min(prev + 1, displayOptions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => Math.max(prev - 1, -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && displayOptions[focusedIndex]) {
            handleSelect(displayOptions[focusedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, displayOptions]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleOpen = () => {
    if (disabled || loading) return;
    setIsOpen(true);
    setFocusedIndex(-1);
    onOpen?.();
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
    setFocusedIndex(-1);
    onClose?.();
  };

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;

    let newValue: string | number | (string | number)[];

    if (multiple) {
      const currentArray = Array.isArray(currentValue) ? currentValue : [];
      if (currentArray.includes(option.value)) {
        newValue = currentArray.filter(v => v !== option.value);
      } else {
        if (maxSelections && currentArray.length >= maxSelections) {
          return; // Max selections reached
        }
        newValue = [...currentArray, option.value];
      }
    } else {
      newValue = option.value;
      handleClose();
    }

    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = multiple ? [] : '';
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setFocusedIndex(-1);
    onSearch?.(query);
  };

  const renderOption = (option: SelectOption, index: number) => {
    const isSelected = multiple
      ? Array.isArray(currentValue) && currentValue.includes(option.value)
      : currentValue === option.value;

    const isFocused = index === focusedIndex;

    return (
      <button
        key={`${option.value}-${index}`}
        onClick={() => handleSelect(option)}
        disabled={option.disabled}
        className={cn(
          'w-full flex items-center space-x-3 transition-colors duration-150',
          sizeClasses.option,
          variantClasses.option,
          isFocused && (variant === 'cyber' ? 'bg-cyan-500/30' : 'bg-blue-50'),
          isSelected && (variant === 'cyber' ? 'bg-cyan-500/20' : 'bg-blue-100'),
          option.disabled && 'opacity-50 cursor-not-allowed',
          optionClassName
        )}
      >
        {showImages && option.image && (
          <img src={option.image} alt='' className='w-6 h-6 rounded object-cover flex-shrink-0' />
        )}

        {showIcons && option.icon && !option.image && (
          <span className='flex-shrink-0'>{option.icon}</span>
        )}

        <div className='flex-1 min-w-0 text-left'>
          <div className='truncate'>{option.label}</div>
          {showDescriptions && option.description && (
            <div
              className={cn(
                'text-xs truncate mt-0.5',
                variant === 'cyber' ? 'text-cyan-400/50' : 'text-gray-500'
              )}
            >
              {option.description}
            </div>
          )}
        </div>

        {multiple && isSelected && (
          <div
            className={cn('flex-shrink-0', variant === 'cyber' ? 'text-cyan-300' : 'text-blue-600')}
          >
            ✓
          </div>
        )}
      </button>
    );
  };

  const hasValue = multiple
    ? Array.isArray(currentValue) && currentValue.length > 0
    : currentValue !== '' && currentValue !== undefined;

  return (
    <div className='relative'>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type='button'
        onClick={handleOpen}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        className={cn(
          'relative w-full flex items-center justify-between transition-all duration-200',
          sizeClasses.trigger,
          variantClasses.trigger,
          animated && 'transform hover:scale-[1.01] focus:scale-[1.01]',
          className
        )}
      >
        <div className='flex items-center space-x-2 flex-1 min-w-0'>
          {loading && (
            <div className='animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full' />
          )}

          <div className='flex-1 min-w-0 text-left'>
            {hasValue ? (
              multiple && Array.isArray(selectedOptions) ? (
                <div className='flex flex-wrap gap-1'>
                  {selectedOptions.slice(0, 3).map(option => (
                    <span
                      key={option.value}
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs',
                        variant === 'cyber'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-gray-100 text-gray-700'
                      )}
                    >
                      {showIcons && option.icon && <span className='mr-1'>{option.icon}</span>}
                      {option.label}
                    </span>
                  ))}
                  {selectedOptions.length > 3 && (
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs',
                        variant === 'cyber'
                          ? 'bg-cyan-500/10 text-cyan-400'
                          : 'bg-gray-50 text-gray-500'
                      )}
                    >
                      +{selectedOptions.length - 3} more
                    </span>
                  )}
                </div>
              ) : (
                <div className='flex items-center space-x-2'>
                  {showImages && !multiple && (selectedOptions as SelectOption)?.image && (
                    <img
                      src={(selectedOptions as SelectOption).image}
                      alt=''
                      className='w-5 h-5 rounded object-cover'
                    />
                  )}
                  {showIcons && !multiple && (selectedOptions as SelectOption)?.icon && (
                    <span>{(selectedOptions as SelectOption).icon}</span>
                  )}
                  <span className='truncate'>
                    {multiple
                      ? `${Array.isArray(currentValue) ? currentValue.length : 0} selected`
                      : (selectedOptions as SelectOption)?.label || String(currentValue)}
                  </span>
                </div>
              )
            ) : (
              <span
                className={cn(
                  'truncate',
                  variant === 'cyber' ? 'text-cyan-400/50' : 'text-gray-500'
                )}
              >
                {placeholder}
              </span>
            )}
          </div>
        </div>

        <div className='flex items-center space-x-1 ml-2'>
          {clearable && hasValue && !disabled && (
            <button
              onClick={handleClear}
              className={cn(
                'p-1 rounded transition-colors',
                variant === 'cyber'
                  ? 'text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/20'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              )}
            >
              ✕
            </button>
          )}

          <div className={cn('transition-transform duration-200', isOpen && 'rotate-180')}>▼</div>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute z-50 w-full mt-1 overflow-hidden',
            variantClasses.dropdown,
            animated && 'animate-fade-in',
            dropdownClassName
          )}
          style={{ maxHeight }}
        >
          {searchable && (
            <div
              className={cn(
                'p-2 border-b',
                variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
              )}
            >
              <input
                ref={searchInputRef}
                type='text'
                placeholder='Search options...'
                value={searchQuery}
                onChange={handleSearchChange}
                className={cn(
                  'w-full px-3 py-2 border rounded outline-none',
                  variant === 'cyber'
                    ? 'bg-slate-800 border-cyan-500/30 text-cyan-300 placeholder-cyan-400/50'
                    : 'bg-white border-gray-300 placeholder-gray-500'
                )}
              />
            </div>
          )}

          <div className='overflow-y-auto' style={{ maxHeight: maxHeight - (searchable ? 60 : 0) }}>
            {displayOptions.length === 0 ? (
              <div
                className={cn(
                  'p-4 text-center',
                  variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500'
                )}
              >
                No options found
              </div>
            ) : (
              displayOptions.map((option, index) => renderOption(option, index))
            )}
          </div>
        </div>
      )}

      {/* Cyber Effects */}
      {variant === 'cyber' && isOpen && (
        <div className='absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-md pointer-events-none' />
      )}
    </div>
  );
};
