import React from 'react';
import { motion } from 'framer-motion';

export interface SkeletonProps {
  variant?: 'default' | 'cyber' | 'glass' | 'pulse' | 'wave';
  shape?: 'rectangle' | 'circle' | 'line' | 'text';
  width?: string | number;
  height?: string | number;
  className?: string;
  animate?: boolean;
  lines?: number; // For text skeleton
  spacing?: string; // Spacing between lines
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'default',
  shape = 'rectangle',
  width,
  height,
  className = '',
  animate = true,
  lines = 3,
  spacing = 'space-y-2',
}) => {
  const shapeClasses = {
    rectangle: 'rounded-md',
    circle: 'rounded-full',
    line: 'rounded-sm h-4',
    text: 'rounded-sm',
  };

  const variantClasses = {
    default: 'bg-slate-700/50',
    cyber: 'bg-slate-900/50 border border-cyan-500/20',
    glass: 'bg-white/10 backdrop-blur-sm border border-white/10',
    pulse: 'bg-slate-700/50 animate-pulse',
    wave: 'bg-slate-700/50',
  };

  const skeletonVariants = {
    shimmer: {
      x: ['-100%', '100%'],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    pulse: {
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    wave: {
      scaleY: [1, 1.1, 1],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const getSkeletonStyle = () => {
    const style: React.CSSProperties = {};

    if (width) {
      style.width = typeof width === 'number' ? `${width}px` : width;
    }

    if (height) {
      style.height = typeof height === 'number' ? `${height}px` : height;
    }

    // Default dimensions based on shape
    if (!width && !height) {
      switch (shape) {
        case 'circle':
          style.width = '40px';
          style.height = '40px';
          break;
        case 'line':
          style.width = '100%';
          style.height = '16px';
          break;
        case 'text':
          style.width = '100%';
          style.height = '16px';
          break;
        default:
          style.width = '100%';
          style.height = '20px';
      }
    }

    return style;
  };

  const renderTextSkeleton = () => {
    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className={spacing}>
        {Array.from({ length: lines }).map((_, index) => {
          const isLast = index === lines - 1;
          const lineWidth = isLast ? '75%' : '100%';

          return (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <motion.div
              key={index}
              className={`
                relative overflow-hidden
                ${shapeClasses.text}
                ${variantClasses[variant]}
                ${className}
              `}
              style={{
                width: lineWidth,
                height: '16px',
              }}
              // @ts-expect-error TS(2322): Type '{ shimmer: { x: string[]; transition: { dura... Remove this comment to see the full error message
              variants={animate ? skeletonVariants : undefined}
              animate={animate && variant !== 'pulse' ? 'shimmer' : undefined}
            >
              {/* Shimmer overlay */}
              {variant === 'default' && animate && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite]' />
              )}

              {/* Cyber grid pattern */}
              {variant === 'cyber' && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div
                  className='absolute inset-0 opacity-20'
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(34,211,238,0.1) 4px, rgba(34,211,238,0.1) 5px)',
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  if (shape === 'text') {
    return renderTextSkeleton();
  }

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <motion.div
      className={`
        relative overflow-hidden
        ${shapeClasses[shape]}
        ${variantClasses[variant]}
        ${className}
      `}
      style={getSkeletonStyle()}
      // @ts-expect-error TS(2322): Type '{ shimmer: { x: string[]; transition: { dura... Remove this comment to see the full error message
      variants={animate ? skeletonVariants : undefined}
      animate={
        animate
          ? variant === 'wave'
            ? 'wave'
            : variant === 'pulse'
              ? 'pulse'
              : 'shimmer'
          : undefined
      }
    >
      {/* Shimmer overlay for default variant */}
      {variant === 'default' && animate && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite]' />
      )}

      {/* Cyber effects */}
      {variant === 'cyber' && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <>
          {/* Grid pattern */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className='absolute inset-0 opacity-20'
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(34,211,238,0.1) 4px, rgba(34,211,238,0.1) 5px)',
            }}
          />

          {/* Scanning line */}
          {animate && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <motion.div
              className='absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent'
              animate={{ x: ['-100%', '100%'] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          )}
        </>
      )}

      {/* Glass effect */}
      {variant === 'glass' && animate && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-pulse' />
      )}

      {/* Wave effect indicators */}
      {variant === 'wave' && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='absolute inset-0 bg-gradient-to-t from-slate-600/30 to-transparent' />
      )}
    </motion.div>
  );
};

// Skeleton composition components for common patterns
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <div className={`p-6 bg-slate-800/50 rounded-lg border border-slate-700/50 ${className}`}>
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='flex items-start space-x-4'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Skeleton shape='circle' width={60} height={60} />
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex-1 space-y-3'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Skeleton width='60%' height={20} />
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Skeleton shape='text' lines={2} />
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex space-x-2'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Skeleton width={80} height={32} variant='cyber' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Skeleton width={100} height={32} variant='cyber' />
        </div>
      </div>
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({
  rows = 5,
  columns = 4,
  className = '',
}) => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <div className={`space-y-3 ${className}`}>
    {/* Header */}
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='grid gap-4' style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, i) => (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Skeleton key={`header-${i}`} height={40} variant='cyber' />
      ))}
    </div>

    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        key={`row-${rowIndex}`}
        className='grid gap-4'
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Skeleton key={`cell-${rowIndex}-${colIndex}`} height={32} />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonChart: React.FC<{ className?: string }> = ({ className = '' }) => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <div className={`p-6 bg-slate-800/50 rounded-lg border border-slate-700/50 ${className}`}>
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='space-y-4'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Skeleton width='40%' height={24} variant='cyber' />
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex items-end space-x-2 h-40'>
        {Array.from({ length: 8 }).map((_, i) => (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Skeleton
            key={i}
            width={30}
            height={Math.random() * 120 + 40}
            variant='wave'
            animate={true}
          />
        ))}
      </div>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex justify-between'>
        {Array.from({ length: 4 }).map((_, i) => (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Skeleton key={i} width={60} height={16} />
        ))}
      </div>
    </div>
  </div>
);

export default Skeleton;
