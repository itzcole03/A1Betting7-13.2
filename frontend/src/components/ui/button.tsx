import * as React from 'react';

const getVariantClasses = (variant?: string) => {
  switch (variant) {
    case 'destructive':
      return 'bg-red-600 text-white hover:bg-red-700';
    case 'outline':
      return 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50';
    case 'secondary':
      return 'bg-gray-200 text-gray-900 hover:bg-gray-300';
    case 'ghost':
      return 'text-gray-700 hover:bg-gray-100';
    case 'link':
      return 'text-blue-600 underline hover:text-blue-800';
    default:
      return 'bg-blue-600 text-white hover:bg-blue-700';
  }
};

const getSizeClasses = (size?: string) => {
  switch (size) {
    case 'sm':
      return 'h-9 px-3 text-sm';
    case 'lg':
      return 'h-11 px-8 text-base';
    case 'icon':
      return 'h-10 w-10 p-0';
    default:
      return 'h-10 px-4 py-2 text-sm';
  }
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const _Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant, size, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    const variantClasses = getVariantClasses(variant);
    const sizeClasses = getSizeClasses(size);

    return (
      <button
        className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
_Button.displayName = 'Button';

export { _Button };
