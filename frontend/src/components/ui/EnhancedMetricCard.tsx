import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface MetricTrend {
  direction: 'up' | 'down' | 'flat';
  percentage: number;
  period: string;
}

export interface MetricThreshold {
  warning: number;
  critical: number;
}

export interface MetricHistory {
  timestamp: Date;
  value: number;
}

export interface EnhancedMetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  variant?: 'default' | 'cyber' | 'minimal' | 'detailed' | 'compact';
  className?: string;
  icon?: React.ReactNode;
  trend?: MetricTrend;
  target?: number;
  thresholds?: MetricThreshold;
  history?: MetricHistory[];
  isLoading?: boolean;
  description?: string;
  precision?: number;
  showSparkline?: boolean;
  showProgress?: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'cyan';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  onClick?: () => void;
  onTrendClick?: () => void;
}

export const _EnhancedMetricCard: React.FC<EnhancedMetricCardProps> = ({
  title,
  value,
  unit = '',
  variant = 'default',
  className = '',
  icon,
  trend,
  target,
  thresholds,
  history = [],
  isLoading = false,
  description,
  precision = 0,
  showSparkline = false,
  showProgress = false,
  color = 'blue',
  size = 'md',
  animated = true,
  onClick,
  onTrendClick,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const _numericValue = typeof value === 'number' ? value : parseFloat(value as string) || 0;

  // Animate numeric values
  useEffect(() => {
    if (animated && typeof value === 'number') {
      const _startValue = displayValue;
      const _endValue = value;
      const _duration = 1000;
      const _startTime = Date.now();

      const _animate = () => {
        const _elapsed = Date.now() - startTime;
        const _progress = Math.min(elapsed / duration, 1);

        const _easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const _currentValue = startValue + (endValue - startValue) * easeOutCubic;

        setDisplayValue(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    } else {
      setDisplayValue(numericValue);
    }
  }, [value, animated]);

  const _getColorClasses = (colorType: string) => {
    const _colors = {
      blue: {
        bg: variant === 'cyber' ? 'bg-blue-500/20' : 'bg-blue-100 dark:bg-blue-900/30',
        text: variant === 'cyber' ? 'text-blue-400' : 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-500/50',
        glow: 'shadow-blue-500/20',
      },
      green: {
        bg: variant === 'cyber' ? 'bg-green-500/20' : 'bg-green-100 dark:bg-green-900/30',
        text: variant === 'cyber' ? 'text-green-400' : 'text-green-700 dark:text-green-400',
        border: 'border-green-500/50',
        glow: 'shadow-green-500/20',
      },
      red: {
        bg: variant === 'cyber' ? 'bg-red-500/20' : 'bg-red-100 dark:bg-red-900/30',
        text: variant === 'cyber' ? 'text-red-400' : 'text-red-700 dark:text-red-400',
        border: 'border-red-500/50',
        glow: 'shadow-red-500/20',
      },
      yellow: {
        bg: variant === 'cyber' ? 'bg-yellow-500/20' : 'bg-yellow-100 dark:bg-yellow-900/30',
        text: variant === 'cyber' ? 'text-yellow-400' : 'text-yellow-700 dark:text-yellow-400',
        border: 'border-yellow-500/50',
        glow: 'shadow-yellow-500/20',
      },
      purple: {
        bg: variant === 'cyber' ? 'bg-purple-500/20' : 'bg-purple-100 dark:bg-purple-900/30',
        text: variant === 'cyber' ? 'text-purple-400' : 'text-purple-700 dark:text-purple-400',
        border: 'border-purple-500/50',
        glow: 'shadow-purple-500/20',
      },
      cyan: {
        bg: variant === 'cyber' ? 'bg-cyan-500/20' : 'bg-cyan-100 dark:bg-cyan-900/30',
        text: variant === 'cyber' ? 'text-cyan-400' : 'text-cyan-700 dark:text-cyan-400',
        border: 'border-cyan-500/50',
        glow: 'shadow-cyan-500/20',
      },
    };
    return colors[colorType as keyof typeof colors] || colors.blue;
  };

  const _getStatusColor = () => {
    if (!thresholds) return color;

    if (numericValue >= thresholds.critical) return 'red';
    if (numericValue >= thresholds.warning) return 'yellow';
    return 'green';
  };

  const _formatValue = (val: number) => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(precision)}M`;
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(precision)}K`;
    }
    return precision > 0 ? val.toFixed(precision) : Math.round(val).toLocaleString();
  };

  const _getTrendIcon = () => {
    if (!trend) return null;

    switch (trend.direction) {
      case 'up':
        return (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <svg
            className='w-4 h-4 text-green-500'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M7 17l9.2-9.2M17 17V7H7'
            />
          </svg>
        );
      case 'down':
        return (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <svg
            className='w-4 h-4 text-red-500'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M17 7l-9.2 9.2M7 7v10h10'
            />
          </svg>
        );
      case 'flat':
        return (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <svg
            className='w-4 h-4 text-gray-500'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M20 12H4' />
          </svg>
        );
    }
  };

  const _renderSparkline = () => {
    if (!showSparkline || history.length < 2) return null;

    const _width = 60;
    const _height = 20;
    const _values = history.map(h => h.value);
    const _min = Math.min(...values);
    const _max = Math.max(...values);
    const _range = max - min || 1;

    const _points = values
      .map((val, index) => {
        const _x = (index / (values.length - 1)) * width;
        const _y = height - ((val - min) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <svg width={width} height={height} className='opacity-60'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <polyline
          points={points}
          fill='none'
          stroke='currentColor'
          strokeWidth='1.5'
          className={getColorClasses(getStatusColor()).text}
        />
      </svg>
    );
  };

  const _progressPercentage = target ? Math.min((numericValue / target) * 100, 100) : 0;

  const _sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const _baseClasses = `
    rounded-lg border transition-all duration-200 cursor-pointer
    ${
      variant === 'cyber'
        ? `bg-black border-cyan-400/30 ${isHovered ? 'shadow-lg shadow-cyan-400/20 border-cyan-400/50' : ''}`
        : `bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${
            isHovered ? 'shadow-lg border-gray-300 dark:border-gray-600' : ''
          }`
    }
    ${onClick ? 'hover:scale-[1.02]' : ''}
    ${sizeClasses[size]}
    ${className}
  `;

  const _colorClasses = getColorClasses(getStatusColor());

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <motion.div
      className={baseClasses}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={animated ? { opacity: 0, y: 20 } : false}
      animate={animated ? { opacity: 1, y: 0 } : false}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      {/* Cyber grid overlay */}
      {variant === 'cyber' && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='absolute inset-0 opacity-10 pointer-events-none'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='grid grid-cols-6 grid-rows-4 h-full w-full'>
            {Array.from({ length: 24 }).map((_, i) => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div key={i} className='border border-cyan-400/20' />
            ))}
          </div>
        </div>
      )}

      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='relative z-10'>
        {/* Header */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-start justify-between mb-2'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center space-x-2'>
            {icon && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className={`p-1 rounded ${colorClasses.bg}`}>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className={colorClasses.text}>{icon}</div>
              </div>
            )}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3
              className={`font-medium text-sm ${
                variant === 'cyber' ? 'text-cyan-300' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {title}
            </h3>
          </div>

          {showSparkline && renderSparkline()}
        </div>

        {/* Value */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='mb-2'>
          {isLoading ? (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div
              className={`animate-pulse h-8 rounded ${
                variant === 'cyber' ? 'bg-cyan-400/20' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ) : (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-end space-x-1'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span
                className={`text-2xl font-bold ${
                  variant === 'cyber' ? 'text-cyan-400' : 'text-gray-900 dark:text-white'
                }`}
              >
                {typeof value === 'string' ? value : formatValue(displayValue)}
              </span>
              {unit && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span
                  className={`text-sm ${
                    variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500'
                  }`}
                >
                  {unit}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <p
            className={`text-xs mb-2 ${
              variant === 'cyber' ? 'text-cyan-300/70' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {description}
          </p>
        )}

        {/* Progress Bar */}
        {showProgress && target && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='mb-2'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div
              className={`w-full rounded-full h-2 ${
                variant === 'cyber' ? 'bg-gray-800' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <motion.div
                className={`h-2 rounded-full ${colorClasses.bg.replace('/30', '/60')}`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex justify-between text-xs mt-1'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className={variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500'}>0</span>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className={variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500'}>
                {formatValue(target)}
              </span>
            </div>
          </div>
        )}

        {/* Trend */}
        {trend && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            className={`flex items-center space-x-2 ${
              onTrendClick ? 'cursor-pointer hover:opacity-80' : ''
            }`}
            onClick={onTrendClick}
            whileHover={onTrendClick ? { scale: 1.05 } : undefined}
            whileTap={onTrendClick ? { scale: 0.95 } : undefined}
          >
            {getTrendIcon()}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span
              className={`text-xs font-medium ${
                trend.direction === 'up'
                  ? 'text-green-600 dark:text-green-400'
                  : trend.direction === 'down'
                    ? 'text-red-600 dark:text-red-400'
                    : variant === 'cyber'
                      ? 'text-cyan-400/70'
                      : 'text-gray-500'
              }`}
            >
              {trend.percentage > 0 ? '+' : ''}
              {trend.percentage.toFixed(1)}% {trend.period}
            </span>
          </motion.div>
        )}

        {/* Thresholds Indicator */}
        {thresholds && variant === 'detailed' && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='mt-2 pt-2 border-t border-gray-200 dark:border-gray-700'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex justify-between text-xs'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='text-green-600 dark:text-green-400'>
                Good: &lt;{thresholds.warning}
              </span>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='text-yellow-600 dark:text-yellow-400'>
                Warning: {thresholds.warning}-{thresholds.critical}
              </span>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='text-red-600 dark:text-red-400'>
                Critical: &gt;{thresholds.critical}
              </span>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <AnimatePresence>
          {isLoading && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div
                className={`animate-spin rounded-full h-6 w-6 border-2 border-transparent ${
                  variant === 'cyber' ? 'border-t-cyan-400' : 'border-t-blue-500'
                }`}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
