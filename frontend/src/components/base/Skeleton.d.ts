import React from 'react.ts';
export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  height?: number | string;
  width?: number | string;
  animate?: boolean;
}
export declare const Skeleton: React.FC<SkeletonProps>;
export declare const SkeletonText: React.FC<
  {
    lines?: number;
  } & Omit<SkeletonProps, 'variant'>
>;
export declare const SkeletonCard: React.FC<{
  rows?: number;
}>;
