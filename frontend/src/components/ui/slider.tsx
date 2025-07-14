import React, { useState, useRef, useCallback, useEffect } from 'react';
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

export const Slider: React.FC<SliderProps> = ({
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
  formatValue = value => value.toString(),
  color = 'blue',
  className = '',
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const value = controlledValue ?? internalValue;
  const percentage = ((value - min) / (max - min)) * 100;

  const sizeClasses = {
    sm: { track: 'h-1', thumb: 'w-3 h-3' },
    md: { track: 'h-2', thumb: 'w-4 h-4' },
    lg: { track: 'h-3', thumb: 'w-5 h-5' },
  };

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
  };

  const variantClasses = {
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
      if (!sliderRef.current) return value;

      const rect = sliderRef.current.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const rawValue = min + percentage * (max - min);
      const steppedValue = Math.round(rawValue / step) * step;
      return Math.max(min, Math.min(max, steppedValue));
    },
    [min, max, step, value]
  );

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (disabled) return;

      event.preventDefault();
      setIsDragging(true);

      const newValue = calculateValueFromPosition(event.clientX);
      if (!controlledValue) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [disabled, calculateValueFromPosition, controlledValue, onValueChange]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging || disabled) return;

      const newValue = calculateValueFromPosition(event.clientX);
      if (!controlledValue) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [isDragging, disabled, calculateValueFromPosition, controlledValue, onValueChange]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onValueCommit?.(value);
    }
  }, [isDragging, value, onValueCommit]);

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

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    let newValue = value;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        newValue = Math.min(max, value + step);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        newValue = Math.max(min, value - step);
        break;
      case 'Home':
        newValue = min;
        break;
      case 'End':
        newValue = max;
        break;
      default:
        return;
    }

    event.preventDefault();
    if (!controlledValue) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
    onValueCommit?.(newValue);
  };

  const renderTicks = () => {
    if (!showTicks) return null;

    const ticks = [];
    for (let i = 0; i <= tickCount; i++) {
      const tickValue = min + (i / tickCount) * (max - min);
      const tickPercentage = ((tickValue - min) / (max - min)) * 100;

      ticks.push(
        <div
          key={i}
          className='absolute w-0.5 h-2 bg-gray-400 transform -translate-x-1/2'
          style={{ left: `${tickPercentage}%`, top: '100%' }}
        />
      );
    }
    return ticks;
  };

  const thumbVariants = {
    default: { scale: 1 },
    hover: { scale: 1.2 },
    active: { scale: 1.3 },
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label and Value */}
      {(label || showValue) && (
        <div className='flex items-center justify-between'>
          {label && <label className='text-sm font-medium text-gray-300'>{label}</label>}
          {showValue && (
            <span className='text-sm font-semibold text-white'>{formatValue(value)}</span>
          )}
        </div>
      )}

      {/* Slider Container */}
      <div className='relative py-2'>
        {/* Track */}
        <div
          ref={sliderRef}
          className={`
            relative w-full rounded-full cursor-pointer
            ${sizeClasses[size].track}
            ${variantClasses[variant].track}
            ${disabled ? 'cursor-not-allowed opacity-50' : ''}
          `}
          onMouseDown={handleMouseDown}
          role='slider'
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={handleKeyDown}
        >
          {/* Background Pattern for Cyber Variant */}
          {variant === 'cyber' && (
            <div
              className='absolute inset-0 opacity-20 rounded-full'
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(34,211,238,0.1) 2px, rgba(34,211,238,0.1) 4px)',
              }}
            />
          )}

          {/* Active Track */}
          <div
            className={`
              absolute top-0 left-0 rounded-full transition-all duration-200
              ${sizeClasses[size].track}
              ${variantClasses[variant].activeTrack}
            `}
            style={{ width: `${percentage}%` }}
          >
            {/* Shimmer Effect for Cyber Variant */}
            {variant === 'cyber' && (
              <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] rounded-full' />
            )}
          </div>

          {/* Thumb */}
          <motion.div
            ref={thumbRef}
            className={`
              absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2
              rounded-full cursor-pointer border-2 border-white
              ${sizeClasses[size].thumb}
              ${variantClasses[variant].thumb}
              ${disabled ? 'cursor-not-allowed' : ''}
            `}
            style={{ left: `${percentage}%` }}
            variants={thumbVariants}
            initial='default'
            animate={isDragging ? 'active' : 'default'}
            whileHover={!disabled ? 'hover' : undefined}
          >
            {/* Inner Glow for Cyber Variant */}
            {variant === 'cyber' && (
              <div className='absolute inset-0.5 rounded-full bg-gradient-to-r from-cyan-400/50 to-blue-500/50 animate-pulse' />
            )}
          </motion.div>

          {/* Ticks */}
          {renderTicks()}
        </div>

        {/* Value Tooltip for Cyber Variant */}
        {variant === 'cyber' && isDragging && (
          <motion.div
            className='absolute -top-8 bg-slate-900 border border-cyan-500/50 rounded px-2 py-1 text-xs text-cyan-400 pointer-events-none'
            style={{ left: `${percentage}%`, transform: 'translateX(-50%)' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {formatValue(value)}
          </motion.div>
        )}
      </div>

      {/* Min/Max Labels */}
      {(showTicks || variant === 'cyber') && (
        <div className='flex justify-between text-xs text-gray-400'>
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
      )}
    </div>
  );
};

export default Slider;
