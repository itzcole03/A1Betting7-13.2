import React from 'react';
import { cn } from '@/lib/utils';

// Types for risk data structure
interface RiskLevel {
  level: number; // 1-5 scale
  label: string;
  value: number;
  percentage: number;
  color: string;
}

interface RiskCategory {
  id: string;
  name: string;
  description?: string;
  riskLevel: number; // 1-5 scale
  impact: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-100
  trend: 'increasing' | 'decreasing' | 'stable';
  lastUpdated: Date;
}

interface RiskMatrix {
  categories: RiskCategory[];
  totalRiskScore: number;
  riskDistribution: RiskLevel[];
}

interface RiskHeatMapProps {
  data: RiskMatrix;
  variant?: 'default' | 'cyber' | 'minimal' | 'detailed';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLegend?: boolean;
  showMetrics?: boolean;
  interactive?: boolean;
  className?: string;
  onCategoryClick?: (category: RiskCategory) => void;
  onRiskLevelChange?: (level: number) => void;
}

const getRiskColor = (level: number, variant: string = 'default') => {
  const colors = {
    default: {
      1: 'bg-green-500',
      2: 'bg-yellow-500',
      3: 'bg-orange-500',
      4: 'bg-red-500',
      5: 'bg-red-700',
    },
    cyber: {
      1: 'bg-green-400 shadow-green-400/50',
      2: 'bg-yellow-400 shadow-yellow-400/50',
      3: 'bg-orange-400 shadow-orange-400/50',
      4: 'bg-red-400 shadow-red-400/50',
      5: 'bg-red-600 shadow-red-600/50',
    },
  };

  return variant === 'cyber'
    ? colors.cyber[level as keyof typeof colors.cyber] || colors.cyber[3]
    : colors.default[level as keyof typeof colors.default] || colors.default[3];
};

const getRiskLabel = (level: number) => {
  const labels = {
    1: 'Very Low',
    2: 'Low',
    3: 'Medium',
    4: 'High',
    5: 'Very High',
  };
  return labels[level as keyof typeof labels] || 'Unknown';
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'increasing':
      return '↗️';
    case 'decreasing':
      return '↘️';
    default:
      return '→';
  }
};

export const RiskHeatMap: React.FC<RiskHeatMapProps> = ({
  data,
  variant = 'default',
  size = 'md',
  showLegend = true,
  showMetrics = true,
  interactive = true,
  className,
  onCategoryClick,
  onRiskLevelChange,
}) => {
  const sizeClasses = {
    sm: 'h-64 text-sm',
    md: 'h-80 text-base',
    lg: 'h-96 text-lg',
    xl: 'h-[32rem] text-xl',
  };

  const variantClasses = {
    default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    cyber:
      'bg-slate-900 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20 backdrop-blur-sm',
    minimal: 'bg-transparent border-0 shadow-none',
    detailed: 'bg-white border border-gray-300 rounded-xl shadow-lg',
  };

  const gridSize = Math.ceil(Math.sqrt(data.categories.length));
  const gridCols = gridSize;
  const gridRows = Math.ceil(data.categories.length / gridSize);

  return (
    <div
      className={cn(
        'relative p-6',
        sizeClasses[size],
        variantClasses[variant],
        variant === 'cyber' && 'animate-glow-pulse',
        className
      )}
    >
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h3
            className={cn(
              'text-xl font-bold',
              variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
            )}
          >
            Risk Heat Map
          </h3>
          {showMetrics && (
            <p
              className={cn(
                'text-sm mt-1',
                variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600'
              )}
            >
              Overall Risk Score: {data.totalRiskScore}/5.0
            </p>
          )}
        </div>

        {variant === 'cyber' && (
          <div className='absolute top-4 right-4 w-2 h-2 bg-cyan-400 rounded-full animate-pulse' />
        )}
      </div>

      {/* Main Grid */}
      <div
        className='grid gap-2 mb-6'
        style={{
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${gridRows}, 1fr)`,
        }}
      >
        {data.categories.map((category, index) => (
          <div
            key={category.id}
            className={cn(
              'relative group cursor-pointer rounded-lg p-3 transition-all duration-200',
              getRiskColor(category.riskLevel, variant),
              variant === 'cyber' && 'border border-white/10 shadow-lg',
              interactive && 'hover:scale-105 hover:shadow-lg',
              interactive && variant === 'cyber' && 'hover:shadow-cyan-400/30'
            )}
            onClick={() => onCategoryClick?.(category)}
          >
            {/* Category Content */}
            <div className='relative z-10'>
              <div className='flex items-center justify-between mb-1'>
                <span
                  className={cn(
                    'text-xs font-medium truncate',
                    category.riskLevel >= 4 ? 'text-white' : 'text-gray-900'
                  )}
                >
                  {category.name}
                </span>
                <span className='text-xs opacity-70'>{getTrendIcon(category.trend)}</span>
              </div>

              <div
                className={cn(
                  'text-xs opacity-80',
                  category.riskLevel >= 4 ? 'text-white' : 'text-gray-700'
                )}
              >
                Level {category.riskLevel}
              </div>

              {variant === 'detailed' && (
                <div
                  className={cn(
                    'text-xs mt-1 opacity-70',
                    category.riskLevel >= 4 ? 'text-white' : 'text-gray-600'
                  )}
                >
                  {category.probability}% probability
                </div>
              )}
            </div>

            {/* Cyber Grid Overlay */}
            {variant === 'cyber' && (
              <div className='absolute inset-0 opacity-20 bg-grid-white/[0.2] rounded-lg' />
            )}

            {/* Hover Tooltip */}
            {interactive && (
              <div
                className={cn(
                  'absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full',
                  'bg-gray-900 text-white text-xs rounded px-2 py-1',
                  'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                  'pointer-events-none whitespace-nowrap z-20'
                )}
              >
                {category.name}: {getRiskLabel(category.riskLevel)} Risk
                <br />
                Impact: {category.impact} | Trend: {category.trend}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <span
              className={cn(
                'text-sm font-medium',
                variant === 'cyber' ? 'text-cyan-300' : 'text-gray-700'
              )}
            >
              Risk Level:
            </span>
            <div className='flex items-center space-x-2'>
              {[1, 2, 3, 4, 5].map(level => (
                <div key={level} className='flex items-center space-x-1'>
                  <div className={cn('w-4 h-4 rounded', getRiskColor(level, variant))} />
                  <span
                    className={cn(
                      'text-xs',
                      variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600'
                    )}
                  >
                    {level}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Distribution Stats */}
          {showMetrics && variant === 'detailed' && (
            <div className='text-xs text-gray-600 space-y-1'>
              <div>Categories: {data.categories.length}</div>
              <div>Avg Risk: {data.totalRiskScore.toFixed(1)}</div>
            </div>
          )}
        </div>
      )}

      {/* Cyber Effects */}
      {variant === 'cyber' && (
        <>
          <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-lg pointer-events-none' />
          <div className='absolute inset-0 bg-grid-white/[0.02] rounded-lg pointer-events-none' />
        </>
      )}
    </div>
  );
};
