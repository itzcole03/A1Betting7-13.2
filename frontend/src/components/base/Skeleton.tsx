import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: number | string;
  height?: number | string;
  rounded?: boolean | string;
  lines?: number;
  lineHeight?: number | string;
  gap?: number;
}

const resolveSize = (value?: number | string): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return `${value}px`;
  }

  return value;
};

/**
 * Low-level shimmering placeholder for loading states.
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      width,
      height,
      rounded = true,
      lines = 1,
      lineHeight = 14,
      gap = 10,
      className = '',
      ...props
    },
    ref
  ) => {
    const count = Math.max(1, Math.floor(lines));
    const radius = typeof rounded === 'string' ? rounded : rounded ? '999px' : '0px';
    const resolvedWidth = resolveSize(width);
    const resolvedHeight = resolveSize(height ?? lineHeight);
    const resolvedGap = resolveSize(gap);

    if (count === 1) {
      return (
        <div
          ref={ref}
          className={`animate-pulse bg-slate-800/80 ${className}`.trim()}
          style={{ width: resolvedWidth, height: resolvedHeight, borderRadius: radius }}
          {...props}
        />
      );
    }

    return (
      <div ref={ref} className={`flex flex-col ${className}`.trim()} {...props}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className='animate-pulse bg-slate-800/80'
            style={{
              width: resolvedWidth,
              height: resolvedHeight,
              borderRadius: radius,
              marginBottom: index === count - 1 ? undefined : resolvedGap,
            }}
          />
        ))}
      </div>
    );
  }
);

Skeleton.displayName = 'Skeleton';

export default Skeleton;
