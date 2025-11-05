/**
 * Label component
 * Purpose: Typed label with optional required mark; minimal styling, no behavior changes.
 * Constraints: Non-breaking. Keeps default export name.
 */
import React from 'react';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  requiredMark?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = '', children, requiredMark, ...rest }, ref) => (
    <label
      ref={ref}
      className={`block text-sm font-medium text-gray-300 ${className}`}
      data-testid='ui-label'
      {...rest}
    >
      <span className='flex items-center space-x-1'>
        <span>{children}</span>
        {requiredMark && (
          <span className='text-red-400 ml-1' aria-label='Required field'>
            *
          </span>
        )}
      </span>
    </label>
  )
);

Label.displayName = 'Label';
export const _Label = Label;
export default Label;
