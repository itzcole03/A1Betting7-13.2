import * as React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Activity } from 'lucide-react';

interface StatusIndicatorProps {
  status: 'healthy' | 'warning' | 'error' | 'loading';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status, 
  message, 
  size = 'md' 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'healthy':
        return {
          icon: CheckCircle,
          color: 'text-green-400',
          bgColor: 'bg-green-400/20',
          borderColor: 'border-green-400/30',
          text: message || 'All systems operational'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/20',
          borderColor: 'border-yellow-400/30',
          text: message || 'Some issues detected'
        };
      case 'error':
        return {
          icon: XCircle,
          color: 'text-red-400',
          bgColor: 'bg-red-400/20',
          borderColor: 'border-red-400/30',
          text: message || 'Service unavailable'
        };
      case 'loading':
        return {
          icon: Activity,
          color: 'text-blue-400',
          bgColor: 'bg-blue-400/20',
          borderColor: 'border-blue-400/30',
          text: message || 'Loading...'
        };
      default:
        return {
          icon: Activity,
          color: 'text-gray-400',
          bgColor: 'bg-gray-400/20',
          borderColor: 'border-gray-400/30',
          text: message || 'Unknown status'
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1',
          icon: 'w-3 h-3',
          text: 'text-xs'
        };
      case 'lg':
        return {
          container: 'px-4 py-3',
          icon: 'w-6 h-6',
          text: 'text-base'
        };
      default:
        return {
          container: 'px-3 py-2',
          icon: 'w-4 h-4',
          text: 'text-sm'
        };
    }
  };

  const config = getStatusConfig();
  const sizeClasses = getSizeClasses();
  const Icon = config.icon;

  return (
    <div className={`
      inline-flex items-center space-x-2 rounded-lg border
      ${config.bgColor} ${config.borderColor} ${sizeClasses.container}
    `}>
      <Icon className={`
        ${config.color} ${sizeClasses.icon}
        ${status === 'loading' ? 'animate-pulse' : ''}
      `} />
      <span className={`${config.color} ${sizeClasses.text} font-medium`}>
        {config.text}
      </span>
    </div>
  );
};

export default StatusIndicator;
