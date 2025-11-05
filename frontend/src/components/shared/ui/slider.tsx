import React, { useId, useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

export interface SliderProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number) => void;
  onValueCommit?: (value: number) => void;
  variant?: 'default' | 'cyber' | 'glass' | 'neon';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  showValue?: boolean;
  showTicks?: boolean;
  tickCount?: number;
  label?: string;
  formatValue?: (value: number) => string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'cyan';
  className?: string;
}

const sizeClasses = {
  sm: { track: 'h-1', thumb: 'w-3 h-3' },
  md: { track: 'h-2', thumb: 'w-4 h-4' },
  lg: { track: 'h-3', thumb: 'w-5 h-5' },
} as const;

const colorClasses = {
  blue: {
    track: 'bg-blue-500',
    gradient: 'from-blue-400 to-blue-600',
    glow: 'shadow-[0_0_10px_rgba(59,130,246,0.5)]',
    thumb: 'bg-blue-500 border-blue-400',
  },
  green: {
    track: 'bg-green-500',
    gradient: 'from-green-400 to-green-600',
    glow: 'shadow-[0_0_10px_rgba(34,197,94,0.5)]',
    thumb: 'bg-green-500 border-green-400',
  },
  yellow: {
    track: 'bg-yellow-500',
    gradient: 'from-yellow-400 to-yellow-600',
    glow: 'shadow-[0_0_10px_rgba(251,191,36,0.5)]',
    thumb: 'bg-yellow-500 border-yellow-400',
  },
  red: {
    track: 'bg-red-500',
    gradient: 'from-red-400 to-red-600',
    glow: 'shadow-[0_0_10px_rgba(239,68,68,0.5)]',
    thumb: 'bg-red-500 border-red-400',
  },
  purple: {
    track: 'bg-purple-500',
    gradient: 'from-purple-400 to-purple-600',
    glow: 'shadow-[0_0_10px_rgba(168,85,247,0.5)]',
    thumb: 'bg-purple-500 border-purple-400',
  },
  cyan: {
    track: 'bg-cyan-500',
    gradient: 'from-cyan-400 to-cyan-600',
    glow: 'shadow-[0_0_10px_rgba(34,211,238,0.5)]',
    thumb: 'bg-cyan-500 border-cyan-400',
  },
} as const;

export const SliderComponent: React.FC<SliderProps> = ({
  value: controlledValue,
  defaultValue = 0,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  onValueCommit,
  variant = 'default',
  size = 'md',
  disabled = false,
  showValue = false,
  showTicks = false,
  tickCount = 5,
  label,
  formatValue = (v) => v.toString(),
  color = 'blue',
  className = '',
}) => {
  const id = useId();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const currentValue = controlledValue ?? internalValue;

  const safeRange = max - min || 1; // avoid division by zero
  const pct = ((currentValue - min) / safeRange) * 100;

  const variantClasses: Record<string, { track: string; activeTrack: string; thumb: string }> = {
    default: {
      track: 'bg-slate-700',
      activeTrack: colorClasses[color].track,
      thumb: `${colorClasses[color].thumb} border-2`,
    },
    cyber: {
      track: 'bg-slate-900/50 border border-cyan-500/30',
      activeTrack: `bg-gradient-to-r ${colorClasses[color].gradient} ${colorClasses[color].glow}`,
      thumb: `${colorClasses[color].thumb} border-2 ${colorClasses[color].glow}`,
    },
    glass: {
      track: 'bg-white/10 backdrop-blur-sm border border-white/10',
      activeTrack: `bg-gradient-to-r ${colorClasses[color].gradient} backdrop-blur-sm`,
      thumb: `${colorClasses[color].thumb} border-2 backdrop-blur-sm`,
    },
    neon: {
      track: 'bg-slate-800/50',
      activeTrack: `${colorClasses[color].track} ${colorClasses[color].glow} animate-pulse`,
      thumb: `${colorClasses[color].thumb} border-2 ${colorClasses[color].glow} animate-pulse`,
    },
  };

  const calculateValueFromPosition = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return currentValue;
      const rect = sliderRef.current.getBoundingClientRect();
      const rawPct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const rawValue = min + rawPct * (max - min);
      const stepped = Math.round(rawValue / step) * step;
      return Math.max(min, Math.min(max, stepped));
    },
    [currentValue, min, max, step]
  );

  const commit = useCallback(
    (val: number) => {
      onValueChange?.(val);
      onValueCommit?.(val);
    },
    [onValueChange, onValueCommit]
  );

  const handlePointer = useCallback(
    (clientX: number) => {
      const newValue = calculateValueFromPosition(clientX);
      if (controlledValue == null) setInternalValue(newValue);
      onValueChange?.(newValue);
      return newValue;
    },
    [calculateValueFromPosition, controlledValue, onValueChange]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      e.preventDefault();
      setIsDragging(true);
      handlePointer(e.clientX);
    },
    [disabled, handlePointer]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || disabled) return;
      handlePointer(e.clientX);
    },
    [isDragging, disabled, handlePointer]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    commit(controlledValue ?? internalValue);
  }, [isDragging, commit, controlledValue, internalValue]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    let next = currentValue;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = Math.min(max, currentValue + step);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = Math.max(min, currentValue - step);
        break;
      case 'Home':
        next = min;
        break;
      case 'End':
        next = max;
        break;
      default:
        return;
    }
    e.preventDefault();
    if (controlledValue == null) setInternalValue(next);
    commit(next);
  };

  const renderTicks = () => {
    if (!showTicks) return null;
    const ticks: JSX.Element[] = [];
    for (let i = 0; i <= tickCount; i++) {
      const tickValue = min + (i / tickCount) * (max - min);
      const tickPct = ((tickValue - min) / safeRange) * 100;
      ticks.push(
        <div
          key={i}
          className='absolute w-0.5 h-2 bg-gray-400 -translate-x-1/2'
          style={{ left: `${tickPct}%`, top: '100%' }}
        />
      );
    }
    return ticks;
  };

  const activeClasses = variantClasses[variant];

  return (
    <div className={`space-y-3 ${className}`}>
      {(label || showValue) && (
        <div className='flex items-center justify-between'>
          {label && (
            <label htmlFor={id} className='text-sm font-medium text-gray-300'>
              {label}
            </label>
          )}
          {showValue && (
            <span className='text-sm font-semibold text-white'>{formatValue(currentValue)}</span>
          )}
        </div>
      )}
      <div className='relative py-2'>
        <div
          ref={sliderRef}
          id={id}
            className={`relative w-full rounded-full cursor-pointer select-none ${sizeClasses[size].track} ${activeClasses.track} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          role='slider'
          aria-valuenow={currentValue}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onMouseDown={handleMouseDown}
          onKeyDown={handleKeyDown}
        >
          {variant === 'cyber' && (
            <div
              className='absolute inset-0 opacity-20 rounded-full'
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(34,211,238,0.1) 2px, rgba(34,211,238,0.1) 4px)',
              }}
            />
          )}
          <div
            className={`absolute top-0 left-0 rounded-full transition-all duration-200 ${sizeClasses[size].track} ${activeClasses.activeTrack}`}
            style={{ width: `${pct}%` }}
          >
            {variant === 'cyber' && (
              <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] rounded-full' />
            )}
          </div>
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full cursor-pointer border-2 border-white transition-transform duration-150 will-change-transform hover:scale-110 active:scale-125 focus-visible:scale-110 ${sizeClasses[size].thumb} ${activeClasses.thumb} ${disabled ? 'cursor-not-allowed' : ''}`}
            style={{ left: `${pct}%` }}
            onMouseDown={handleMouseDown}
          >
            {variant === 'cyber' && (
              <div className='absolute inset-0.5 rounded-full bg-gradient-to-r from-cyan-400/50 to-blue-500/50 animate-pulse' />
            )}
          </div>
          {renderTicks()}
        </div>
        {variant === 'cyber' && isDragging && (
          <motion.div
            className='absolute -top-8 bg-slate-900 border border-cyan-500/50 rounded px-2 py-1 text-xs text-cyan-400 pointer-events-none'
            style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {formatValue(currentValue)}
          </motion.div>
        )}
      </div>
      {(showTicks || variant === 'cyber') && (
        <div className='flex justify-between text-xs text-gray-400'>
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
      )}
    </div>
  );
};

export const Slider = SliderComponent;
export default SliderComponent;
