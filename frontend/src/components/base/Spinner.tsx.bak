import { BarChart3, Brain, Loader, Zap } from 'lucide-react';
import React from 'react';

export type SpinnerVariant = 'default' | 'brain' | 'chart' | 'zap';
export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerTone = 'primary' | 'secondary' | 'success' | 'warning' | 'error';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SpinnerVariant;
  size?: SpinnerSize;
  tone?: SpinnerTone;
  label?: string;
  showProgress?: boolean;
}

const variantIcons: Record<SpinnerVariant, React.ComponentType<{ className?: string }>> = {
  default: Loader,
  brain: Brain,
  chart: BarChart3,
  zap: Zap,
};

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const toneClasses: Record<SpinnerTone, string> = {
  primary: 'text-cyan-400',
  secondary: 'text-slate-400',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  error: 'text-rose-400',
};

const toneBarClasses: Record<SpinnerTone, string> = {
  primary: 'from-cyan-400/20 via-cyan-400/60 to-cyan-400/20',
  secondary: 'from-slate-400/20 via-slate-400/60 to-slate-400/20',
  success: 'from-emerald-400/20 via-emerald-400/60 to-emerald-400/20',
  warning: 'from-amber-400/20 via-amber-400/60 to-amber-400/20',
  error: 'from-rose-400/20 via-rose-400/60 to-rose-400/20',
};

/**
 * Animated loading indicator with optional descriptive label and progress bar.
 */
export const Spinner: React.FC<SpinnerProps> = ({
  variant = 'default',
  size = 'md',
  tone = 'primary',
  label = 'Loading…',
  showProgress = false,
  className = '',
  ...props
}) => {
  const IconComponent = variantIcons[variant];

  return (
    <div
      role='status'
      aria-live='polite'
      className={`flex flex-col items-center justify-center gap-3 text-center ${className}`.trim()}
      {...props}
    >
      <div className='relative'>
        <IconComponent className={`${sizeClasses[size]} ${toneClasses[tone]} animate-spin`} />
        {variant !== 'default' ? (
          <Loader className='absolute -top-1 -right-1 h-3 w-3 text-white animate-spin opacity-80' />
        ) : null}
      </div>
      {label ? <span className='text-sm text-slate-300'>{label}</span> : null}
      {showProgress ? (
        <div className='h-2 w-32 overflow-hidden rounded-full bg-slate-800/60'>
          <div className={`h-full w-full animate-pulse bg-gradient-to-r ${toneBarClasses[tone]}`} />
        </div>
      ) : null}
    </div>
  );
};

export const LoadingSpinner = Spinner;

export default Spinner;
