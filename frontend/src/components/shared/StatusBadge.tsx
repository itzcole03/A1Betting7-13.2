/**
 * Status Badge Component - Phase 3.2 Shared UI Components
 * Consistent status indicators and badges across the application
 */

import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Clock, Zap, TrendingUp, TrendingDown } from 'lucide-react';

interface StatusBadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'pending' | 'active' | 'confident' | 'bullish' | 'bearish';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant = 'info',
  size = 'md',
  showIcon = true,
  icon,
  pulse = false,
  children,
  className = ''
}) => {
  const variantStyles = {
    success: {
      bg: 'bg-green-500/20',
      border: 'border-green-500/30',
      text: 'text-green-400',
      icon: CheckCircle
    },
    warning: {
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/30', 
      text: 'text-yellow-400',
      icon: AlertTriangle
    },
    error: {
      bg: 'bg-red-500/20',
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: XCircle
    },
    info: {
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      icon: CheckCircle
    },
    pending: {
      bg: 'bg-gray-500/20',
      border: 'border-gray-500/30',
      text: 'text-gray-400',
      icon: Clock
    },
    active: {
      bg: 'bg-cyan-500/20',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      icon: Zap
    },
    confident: {
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      icon: CheckCircle
    },
    bullish: {
      bg: 'bg-green-500/20',
      border: 'border-green-500/30',
      text: 'text-green-400',
      icon: TrendingUp
    },
    bearish: {
      bg: 'bg-red-500/20',
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: TrendingDown
    }
  };

  const sizeStyles = {
    sm: {
      padding: 'px-2 py-1',
      text: 'text-xs',
      icon: 'w-3 h-3'
    },
    md: {
      padding: 'px-3 py-1.5',
      text: 'text-sm',
      icon: 'w-4 h-4'
    },
    lg: {
      padding: 'px-4 py-2',
      text: 'text-base',
      icon: 'w-5 h-5'
    }
  };

  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];
  const IconComponent = icon || styles.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${styles.bg} ${styles.border} ${styles.text}
        ${sizes.padding} ${sizes.text}
        ${pulse ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {showIcon && IconComponent && (
        <IconComponent className={sizes.icon} />
      )}
      {children}
    </span>
  );
};

// Convenience components for common use cases
export const ConfidenceBadge: React.FC<{ confidence: number; className?: string }> = ({ 
  confidence, 
  className 
}) => {
  const getVariant = (conf: number) => {
    if (conf >= 90) return 'confident';
    if (conf >= 80) return 'success';
    if (conf >= 70) return 'info';
    if (conf >= 60) return 'warning';
    return 'error';
  };

  return (
    <StatusBadge variant={getVariant(confidence)} className={className}>
      {confidence.toFixed(1)}%
    </StatusBadge>
  );
};

export const TrendBadge: React.FC<{ 
  trend: 'up' | 'down' | 'neutral'; 
  value?: string | number;
  className?: string;
}> = ({ trend, value, className }) => {
  const variant = trend === 'up' ? 'bullish' : trend === 'down' ? 'bearish' : 'info';
  
  return (
    <StatusBadge variant={variant} className={className}>
      {value || trend.toUpperCase()}
    </StatusBadge>
  );
};

export default StatusBadge;
