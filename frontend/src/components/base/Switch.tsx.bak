import React from 'react';

export type SwitchSize = 'sm' | 'md' | 'lg';

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: SwitchSize;
  label?: React.ReactNode;
  hint?: React.ReactNode;
}

const trackClasses: Record<SwitchSize, string> = {
  sm: 'h-5 w-9',
  md: 'h-6 w-11',
  lg: 'h-7 w-14',
};

const thumbClasses: Record<SwitchSize, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const offsetClasses: Record<SwitchSize, string> = {
  sm: 'translate-x-4',
  md: 'translate-x-5',
  lg: 'translate-x-6',
};

/**
 * Accessible toggle switch backed by a native button element.
 */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked,
      onCheckedChange,
      size = 'md',
      label,
      hint,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const handleToggle = (
      event: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>
    ) => {
      event.preventDefault();
      if (disabled) {
        return;
      }
      onCheckedChange?.(!checked);
    };

    const trackClass = trackClasses[size];
    const thumbClass = thumbClasses[size];
    const translation = offsetClasses[size];

    return (
      <label
        className={`inline-flex cursor-pointer flex-col gap-1 ${
          disabled ? 'cursor-not-allowed opacity-60' : ''
        }`.trim()}
      >
        {label ? <span className='text-sm font-medium text-slate-200'>{label}</span> : null}
        <button
          {...props}
          ref={ref}
          type='button'
          role='switch'
          aria-checked={checked}
          disabled={disabled}
          onClick={handleToggle}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              handleToggle(event);
            }
          }}
          className={`relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${
            checked ? 'bg-cyan-500/80' : 'bg-slate-700/70'
          } ${trackClass} ${className}`.trim()}
        >
          <span
            aria-hidden='true'
            className={`pointer-events-none inline-block transform rounded-full bg-white shadow transition-transform duration-200 ease-out ${thumbClass} ${
              checked ? translation : 'translate-x-1'
            }`}
          >
            {children}
          </span>
        </button>
        {hint ? <span className='text-xs text-slate-400'>{hint}</span> : null}
      </label>
    );
  }
);

Switch.displayName = 'Switch';

export default Switch;
