import React from 'react.ts';
interface SkeletonLoaderProps {
  /** Optional additional CSS classes */
  className?: string;
  /** Number of skeleton items to render */
  count?: number;
  /** Height of the skeleton item(s) */
  height?: string | number;
  /** Width of the skeleton item(s) */
  width?: string | number;
  /** Visual variant of the skeleton */
  variant?: 'text' | 'rect' | 'circle';
  /** Optional inline styles */
  style?: React.CSSProperties;
}
declare const _default: React.NamedExoticComponent<SkeletonLoaderProps>;
export default _default;
