import React from 'react.ts';
import { MotionProps } from 'framer-motion.ts';
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'premium';
  hover?: boolean;
  glow?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}
export declare const Card: React.ForwardRefExoticComponent<
  CardProps & MotionProps & React.RefAttributes<HTMLDivElement>
>;
