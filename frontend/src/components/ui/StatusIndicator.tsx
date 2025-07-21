import React from 'react';
// @ts-expect-error TS(2307): Cannot find module '@/lib/utils' or its correspond... Remove this comment to see the full error message
import { cn } from '@/lib/utils';

// Types for status system
type Status =
  | 'online'
  | 'offline'
  | 'busy'
  | 'away'
  | 'maintenance'
  | 'error'
  | 'warning'
  | 'success'
  | 'loading'
  | 'unknown';

interface StatusIndicatorProps {
  status: Status;
  variant?: 'default' | 'cyber' | 'minimal' | 'detailed' | 'pulse' | 'dot';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  description?: string;
  showLabel?: boolean;
  showDescription?: boolean;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

const getStatusConfig = (status: Status) => {
  const configs = {
    online: {
      color: 'green',
      label: 'Online',
      description: 'System is operational',
      icon: '●',
    },
    offline: {
      color: 'gray',
      label: 'Offline',
      description: 'System is unavailable',
      icon: '●',
    },
    busy: {
      color: 'red',
      label: 'Busy',
      description: 'System is at capacity',
      icon: '●',
    },
    away: {
      color: 'yellow',
      label: 'Away',
      description: 'System is idle',
      icon: '●',
    },
    maintenance: {
      color: 'orange',
      label: 'Maintenance',
      description: 'System under maintenance',
      icon: '🔧',
    },
    error: {
      color: 'red',
      label: 'Error',
      description: 'System has encountered an error',
      icon: '❌',
    },
    warning: {
      color: 'yellow',
      label: 'Warning',
      description: 'System has warnings',
      icon: '⚠️',
    },
    success: {
      color: 'green',
      label: 'Success',
      description: 'Operation completed successfully',
      icon: '✅',
    },
    loading: {
      color: 'blue',
      label: 'Loading',
      description: 'System is processing',
      icon: '⟳',
    },
    unknown: {
      color: 'gray',
      label: 'Unknown',
      description: 'Status unknown',
      icon: '?',
    },
  };

  return configs[status] || configs.unknown;
};

const getStatusColors = (color: string, variant: string = 'default') => {
  const colorMap = {
    default: {
      green: 'bg-green-500 border-green-500 text-green-700',
      red: 'bg-red-500 border-red-500 text-red-700',
      yellow: 'bg-yellow-500 border-yellow-500 text-yellow-700',
      blue: 'bg-blue-500 border-blue-500 text-blue-700',
      orange: 'bg-orange-500 border-orange-500 text-orange-700',
      gray: 'bg-gray-500 border-gray-500 text-gray-700',
    },
    cyber: {
      green: 'bg-green-400 border-green-400 text-green-300 shadow-green-400/50',
      red: 'bg-red-400 border-red-400 text-red-300 shadow-red-400/50',
      yellow: 'bg-yellow-400 border-yellow-400 text-yellow-300 shadow-yellow-400/50',
      blue: 'bg-cyan-400 border-cyan-400 text-cyan-300 shadow-cyan-400/50',
      orange: 'bg-orange-400 border-orange-400 text-orange-300 shadow-orange-400/50',
      gray: 'bg-gray-400 border-gray-400 text-gray-300 shadow-gray-400/50',
    },
  };

  return variant === 'cyber'
    ? colorMap.cyber[color as keyof typeof colorMap.cyber] || colorMap.cyber.gray
    : colorMap.default[color as keyof typeof colorMap.default] || colorMap.default.gray;
};

const getSizeClasses = (size: string, variant: string = 'default') => {
  const sizeMap = {
    dot: {
      xs: 'w-2 h-2',
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
      xl: 'w-6 h-6',
    },
    default: {
      xs: 'w-4 h-4 text-xs',
      sm: 'w-6 h-6 text-sm',
      md: 'w-8 h-8 text-base',
      lg: 'w-10 h-10 text-lg',
      xl: 'w-12 h-12 text-xl',
    },
  };

  const mapKey = variant === 'dot' || variant === 'minimal' ? 'dot' : 'default';
  return sizeMap[mapKey][size as keyof typeof sizeMap.dot] || sizeMap[mapKey].md;
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  variant = 'default',
  size = 'md',
  label,
  description,
  showLabel = false,
  showDescription = false,
  animated = true,
  className,
  onClick,
}) => {
  const config = getStatusConfig(status);
  const statusColors = getStatusColors(config.color, variant);
  const sizeClasses = getSizeClasses(size, variant);

  const displayLabel = label || config.label;
  const displayDescription = description || config.description;

  const isInteractive = !!onClick;

  // Dot variant
  if (variant === 'dot' || variant === 'minimal') {
    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={cn(
          'inline-flex items-center space-x-2',
          isInteractive && 'cursor-pointer',
          className
        )}
        onClick={onClick}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'rounded-full border-2',
            sizeClasses,
            statusColors,
            animated && status === 'loading' && 'animate-spin',
            animated && status === 'online' && 'animate-pulse',
            // @ts-expect-error TS(2367): This condition will always return 'false' since th... Remove this comment to see the full error message
            variant === 'cyber' && 'shadow-lg'
          )}
        />

        {(showLabel || showDescription) && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex flex-col'>
            {showLabel && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span
                className={cn(
                  'text-sm font-medium',
                  // @ts-expect-error TS(2367): This condition will always return 'false' since th... Remove this comment to see the full error message
                  variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                )}
              >
                {displayLabel}
              </span>
            )}
            {showDescription && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span
                className={cn(
                  'text-xs',
                  // @ts-expect-error TS(2367): This condition will always return 'false' since th... Remove this comment to see the full error message
                  variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600'
                )}
              >
                {displayDescription}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Pulse variant
  if (variant === 'pulse') {
    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={cn(
          'relative inline-flex items-center space-x-2',
          isInteractive && 'cursor-pointer',
          className
        )}
        onClick={onClick}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='relative'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn(
              'rounded-full',
              sizeClasses,
              statusColors,
              animated && 'animate-ping absolute inline-flex opacity-75'
            )}
          />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className={cn('relative inline-flex rounded-full', sizeClasses, statusColors)} />
        </div>

        {(showLabel || showDescription) && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex flex-col'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            {showLabel && <span className='text-sm font-medium text-gray-900'>{displayLabel}</span>}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            {showDescription && <span className='text-xs text-gray-600'>{displayDescription}</span>}
          </div>
        )}
      </div>
    );
  }

  // Detailed variant
  if (variant === 'detailed') {
    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={cn(
          'inline-flex items-center space-x-3 px-3 py-2 rounded-lg border',
          'bg-white border-gray-200 shadow-sm',
          isInteractive && 'cursor-pointer hover:shadow-md transition-shadow',
          className
        )}
        onClick={onClick}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'flex items-center justify-center rounded-full border-2',
            sizeClasses,
            statusColors,
            animated && status === 'loading' && 'animate-spin'
          )}
        >
          {config.icon && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='text-white text-xs'>{status === 'loading' ? '⟳' : config.icon}</span>
          )}
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex flex-col'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <span className='text-sm font-medium text-gray-900'>{displayLabel}</span>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <span className='text-xs text-gray-600'>{displayDescription}</span>
        </div>
      </div>
    );
  }

  // Cyber variant
  if (variant === 'cyber') {
    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={cn(
          'relative inline-flex items-center space-x-3 px-4 py-2 rounded-lg',
          'bg-slate-900/90 border border-cyan-500/30 shadow-lg shadow-cyan-500/20',
          'backdrop-blur-sm',
          isInteractive && 'cursor-pointer hover:shadow-cyan-500/40 transition-all',
          className
        )}
        onClick={onClick}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'flex items-center justify-center rounded-full border-2',
            sizeClasses,
            statusColors,
            'shadow-lg',
            animated && status === 'loading' && 'animate-spin',
            animated && (status === 'online' || status === 'success') && 'animate-pulse'
          )}
        >
          {config.icon && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='text-white text-xs'>{status === 'loading' ? '⟳' : config.icon}</span>
          )}
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex flex-col'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <span className='text-sm font-medium text-cyan-300'>{displayLabel}</span>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <span className='text-xs text-cyan-400/70'>{displayDescription}</span>
        </div>

        {/* Cyber Grid Overlay */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='absolute inset-0 bg-grid-white/[0.05] rounded-lg pointer-events-none' />

        {/* Shimmer effect */}
        {animated && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-shimmer rounded-lg pointer-events-none' />
        )}
      </div>
    );
  }

  // Default variant
  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div
      className={cn(
        'inline-flex items-center space-x-2',
        isInteractive && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={cn(
          'flex items-center justify-center rounded-full border-2',
          sizeClasses,
          statusColors,
          animated && status === 'loading' && 'animate-spin'
        )}
      >
        {config.icon && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <span className='text-white text-xs'>{status === 'loading' ? '⟳' : config.icon}</span>
        )}
      </div>

      {(showLabel || showDescription) && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex flex-col'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          {showLabel && <span className='text-sm font-medium text-gray-900'>{displayLabel}</span>}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          {showDescription && <span className='text-xs text-gray-600'>{displayDescription}</span>}
        </div>
      )}
    </div>
  );
};
