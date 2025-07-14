import React from 'react.ts';
import { ButtonProps } from './Button.ts';
export interface BettingButtonProps extends Omit<ButtonProps, 'variant'> {
  betType?: 'straight' | 'parlay' | 'teaser';
  odds?: number;
  stake?: number;
  potentialReturn?: number;
  isPlacing?: boolean;
  isConfirmed?: boolean;
  showDetails?: boolean;
}
export declare const BettingButton: React.FC<BettingButtonProps>;
