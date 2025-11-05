import React from 'react';

export type ProgressTone = 'default' | 'success' | 'warning' | 'danger';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showValue?: boolean;
  tone?: ProgressTone;
  animated?: boolean;
  label?: React.ReactNode;
}

const toneClasses: Record<ProgressTone, string> = {
  default: 'from-cyan-400 to-blue-500',
  success: 'from-emerald-400 to-emerald-500',
  warning: 'from-amber-400 to-orange-500',
  danger: 'from-rose-500 to-red-500',
};

/**
 * Progress indicator for deterministic or pseudo-deterministic tasks.
 */
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value,
      max = 100,
      showValue = false,
      tone = 'default',
      animated = false,
      label,
      className = '',
      ...props
    },
    ref
  ) => {
    const cappedMax = max <= 0 ? 100 : max;
    const ratio = Math.min(Math.max(value / cappedMax, 0), 1);
    const percentage = Math.round(ratio * 100);

    return (
      <div className='flex flex-col gap-1'>
        {label ? (
          <span className='text-xs font-medium uppercase tracking-wide text-slate-400'>
            {label}
          </span>
        ) : null}
        <div
          ref={ref}
          role='progressbar'
          aria-valuenow={Math.round(value)}
          aria-valuemin={0}
          aria-valuemax={cappedMax}
          className={`relative h-2 w-full overflow-hidden rounded-full bg-slate-800/80 ${className}`.trim()}
          {...props}
        >
          <div
            className={`h-full w-full origin-left rounded-full bg-gradient-to-r ${
              toneClasses[tone]
            } ${animated ? 'animate-pulse' : ''}`}
            style={{ transform: `scaleX(${ratio})` }}
          />
        </div>
        {showValue ? (
          <span className='text-xs font-semibold text-slate-300'>{percentage}%</span>
        ) : null}
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export default Progress;
