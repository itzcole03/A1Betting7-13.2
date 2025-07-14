import { MotionProps } from 'framer-motion';
import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'outline';
  hoverEffect?: boolean;
}

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;
export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;
export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

export declare const Card: React.ForwardRefExoticComponent<
  CardProps & MotionProps & React.RefAttributes<HTMLDivElement>
>;
