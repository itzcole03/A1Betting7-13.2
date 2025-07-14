import React from 'react.ts';
export interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showValue?: boolean;
  valuePosition?: 'top' | 'right' | 'bottom';
  label?: string;
  className?: string;
  animate?: boolean;
}
export declare const Progress: React.FC<ProgressProps>;
