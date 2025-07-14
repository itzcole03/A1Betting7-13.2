import React from 'react.ts';
import { MotionProps } from 'framer-motion.ts';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}
export declare const Button: React.ForwardRefExoticComponent<
  ButtonProps & MotionProps & React.RefAttributes<HTMLButtonElement>
>;
