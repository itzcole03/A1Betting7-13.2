import React from 'react.ts';
export interface BettingButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}
export declare const BettingButtonGroup: React.FC<BettingButtonGroupProps>;
