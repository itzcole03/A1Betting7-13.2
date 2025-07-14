import React from 'react.ts';
export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  height?: number | string;
  width?: number | string;
  animate?: boolean;
}
declare const _default: React.NamedExoticComponent<SkeletonProps>;
export default _default;
export declare const SkeletonText: React.FC<
  {
    lines?: number;
  } & Omit<SkeletonProps, 'variant'>
>;
export declare const SkeletonCard: React.FC<{
  rows?: number;
}>;
