/**
 * Loading Spinner Component - Phase 3.2 Shared UI Components
 * Consistent loading indicators across the application
 */

import React from 'react';
import { Loader, Brain, BarChart3, Zap } from 'lucide-react';

interface LoadingSpinnerProps {
  variant?: 'default' | 'brain' | 'chart' | 'zap';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  message?: string;
  showProgress?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  variant = 'default',
  size = 'md',
  color = 'primary',
  message,
  showProgress = false,
  className = ''
}) => {
  const iconMap = {
    default: Loader,
    brain: Brain,
    chart: BarChart3,
    zap: Zap
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-cyan-400',
    secondary: 'text-slate-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400'
  };

  const IconComponent = iconMap[variant];

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div className="relative">
        <IconComponent 
          className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`} 
        />
        {variant !== 'default' && (
          <Loader className="w-3 h-3 text-white animate-spin absolute -top-0.5 -right-0.5" />
        )}
      </div>
      
      {message && (
        <p className="text-gray-400 text-center max-w-md">{message}</p>
      )}
      
      {showProgress && (
        <div className="w-32 bg-slate-800/50 rounded-lg h-2 overflow-hidden">
          <div className={`h-full bg-gradient-to-r ${
            color === 'primary' ? 'from-cyan-400 to-blue-500' :
            color === 'success' ? 'from-green-400 to-emerald-500' :
            color === 'warning' ? 'from-yellow-400 to-orange-500' :
            color === 'error' ? 'from-red-400 to-pink-500' :
            'from-slate-400 to-slate-500'
          } animate-pulse`}></div>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
