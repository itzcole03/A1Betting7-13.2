import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period?: string;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'cyber' | 'glass' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'cyan';
  format?: 'number' | 'currency' | 'percentage';
  subtitle?: string;
  className?: string;
  onClick?: () => void;
  loading?: boolean;
  trend?: Array<{ value: number; label?: string }>;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  variant = 'default',
  size = 'md',
  color = 'blue',
  format = 'number',
  subtitle,
  className = '',
  onClick,
  loading = false,
  trend,
}) => {
  const isClickable = !!onClick;

  const sizeConfig = {
    sm: {
      container: 'p-4',
      title: 'text-sm',
      value: 'text-lg',
      subtitle: 'text-xs',
      icon: 'w-4 h-4',
    },
    md: {
      container: 'p-6',
      title: 'text-sm',
      value: 'text-2xl',
      subtitle: 'text-sm',
      icon: 'w-5 h-5',
    },
    lg: {
      container: 'p-8',
      title: 'text-base',
      value: 'text-3xl',
      subtitle: 'text-base',
      icon: 'w-6 h-6',
    },
  };

  const colorConfig = {
    blue: {
      gradient: 'from-blue-400 to-cyan-500',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
      border: 'border-blue-500/30',
      accent: 'text-blue-400',
    },
    green: {
      gradient: 'from-green-400 to-emerald-500',
      glow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]',
      border: 'border-green-500/30',
      accent: 'text-green-400',
    },
    yellow: {
      gradient: 'from-yellow-400 to-orange-500',
      glow: 'shadow-[0_0_20px_rgba(251,191,36,0.3)]',
      border: 'border-yellow-500/30',
      accent: 'text-yellow-400',
    },
    red: {
      gradient: 'from-red-400 to-rose-500',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
      border: 'border-red-500/30',
      accent: 'text-red-400',
    },
    purple: {
      gradient: 'from-purple-400 to-pink-500',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]',
      border: 'border-purple-500/30',
      accent: 'text-purple-400',
    },
    cyan: {
      gradient: 'from-cyan-400 to-blue-500',
      glow: 'shadow-[0_0_20px_rgba(34,211,238,0.3)]',
      border: 'border-cyan-500/30',
      accent: 'text-cyan-400',
    },
  };

  const variantClasses = {
    default: 'bg-slate-800/50 border-slate-700/50',
    cyber: `bg-slate-900/50 ${colorConfig[color].border} ${colorConfig[color].glow}`,
    glass: 'bg-white/5 backdrop-blur-lg border-white/10',
    gradient: `bg-gradient-to-br ${colorConfig[color].gradient} text-white`,
  };

  const formatValue = (val: string | number): string => {
    if (loading) return '---';

    const numValue = typeof val === 'string' ? parseFloat(val) : val;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(numValue);
      case 'percentage':
        return `${numValue.toFixed(1)}%`;
      case 'number':
      default:
        return typeof val === 'string' ? val : numValue.toLocaleString();
    }
  };

  const getChangeIcon = () => {
    if (!change) return null;

    switch (change.type) {
      case 'increase':
        return <TrendingUp className='w-3 h-3' />;
      case 'decrease':
        return <TrendingDown className='w-3 h-3' />;
      default:
        return <Minus className='w-3 h-3' />;
    }
  };

  const getChangeColor = () => {
    if (!change) return 'text-gray-400';

    switch (change.type) {
      case 'increase':
        return 'text-green-400';
      case 'decrease':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
    hover: isClickable
      ? {
          y: -4,
          scale: 1.02,
          transition: {
            duration: 0.2,
            ease: 'easeOut',
          },
        }
      : {},
  };

  const loadingVariants = {
    pulse: {
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <motion.div
      className={`
        relative rounded-xl border backdrop-blur-sm overflow-hidden
        ${sizeConfig[size].container}
        ${variantClasses[variant]}
        ${isClickable ? 'cursor-pointer' : ''}
        ${className}
      `}
      variants={cardVariants}
      initial='hidden'
      animate='visible'
      whileHover={!loading ? 'hover' : undefined}
      onClick={onClick}
    >
      {/* Cyber grid overlay */}
      {variant === 'cyber' && (
        <div
          className='absolute inset-0 opacity-10 pointer-events-none'
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 21px)',
          }}
        />
      )}

      {/* Shimmer effect for cyber variant */}
      {variant === 'cyber' && !loading && (
        <div className='absolute inset-0 overflow-hidden pointer-events-none'>
          <motion.div
            className='absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent'
            animate={{ x: ['-100%', '100%'] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>
      )}

      <div className='relative'>
        {/* Header */}
        <div className='flex items-start justify-between mb-3'>
          <div className='flex-1'>
            <h3 className={`font-medium text-gray-300 ${sizeConfig[size].title}`}>{title}</h3>
            {subtitle && (
              <p className={`text-gray-400 mt-1 ${sizeConfig[size].subtitle}`}>{subtitle}</p>
            )}
          </div>

          {icon && (
            <div
              className={`${colorConfig[color].accent} ${sizeConfig[size].icon} flex-shrink-0 ml-3`}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <div className='mb-3'>
          {loading ? (
            <motion.div
              className={`${sizeConfig[size].value} font-bold text-gray-400`}
              variants={loadingVariants}
              animate='pulse'
            >
              {formatValue(value)}
            </motion.div>
          ) : (
            <div className={`${sizeConfig[size].value} font-bold text-white`}>
              {formatValue(value)}
            </div>
          )}
        </div>

        {/* Change Indicator */}
        {change && !loading && (
          <div className='flex items-center space-x-1 mb-3'>
            <div className={`flex items-center space-x-1 ${getChangeColor()}`}>
              {getChangeIcon()}
              <span className='text-sm font-medium'>{Math.abs(change.value)}%</span>
            </div>
            {change.period && <span className='text-xs text-gray-400'>{change.period}</span>}
          </div>
        )}

        {/* Mini Trend Chart */}
        {trend && trend.length > 0 && !loading && (
          <div className='flex items-end space-x-1 h-8 mb-2'>
            {trend.map((point, index) => {
              const maxValue = Math.max(...trend.map(p => p.value));
              const height = (point.value / maxValue) * 100;

              return (
                <motion.div
                  key={index}
                  className={`flex-1 bg-gradient-to-t ${colorConfig[color].gradient} rounded-sm min-h-[4px] opacity-70`}
                  style={{ height: `${Math.max(height, 10)}%` }}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(height, 10)}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                />
              );
            })}
          </div>
        )}

        {/* Click indicator */}
        {isClickable && !loading && (
          <div className='absolute top-4 right-4'>
            <ArrowUpRight className='w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity' />
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className='absolute inset-0 bg-slate-800/50 backdrop-blur-sm rounded-xl flex items-center justify-center'>
            <motion.div
              className='w-6 h-6 border-2 border-current border-t-transparent rounded-full'
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${colorConfig[color].gradient} opacity-60`}
      />
    </motion.div>
  );
};

export default MetricCard;
