/**
 * Error Display Component - Phase 3.2 Shared UI Components
 * Consistent error display across the application
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorDisplayProps {
  variant?: 'default' | 'critical' | 'warning' | 'minimal';
  title?: string;
  message?: string;
  error?: Error;
  showDetails?: boolean;
  showHomeButton?: boolean;
  showReportButton?: boolean;
  onRetry?: () => void;
  onHome?: () => void;
  onReport?: () => void;
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  variant = 'default',
  title,
  message,
  error,
  showDetails = false,
  showHomeButton = false,
  showReportButton = false,
  onRetry,
  onHome,
  onReport,
  className = ''
}) => {
  const variantClasses = {
    default: 'bg-red-500/10 border-red-500/20 text-red-400',
    critical: 'bg-red-600/20 border-red-600/30 text-red-300', 
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    minimal: 'bg-slate-500/10 border-slate-500/20 text-slate-400'
  };

  const defaultTitles = {
    default: 'Something went wrong',
    critical: 'Critical Error',
    warning: 'Warning',
    minimal: 'Error'
  };

  const iconClasses = {
    default: 'text-red-400',
    critical: 'text-red-300',
    warning: 'text-yellow-400', 
    minimal: 'text-slate-400'
  };

  return (
    <div className={`border rounded-xl p-6 text-center ${variantClasses[variant]} ${className}`}>
      <AlertTriangle className={`w-12 h-12 mx-auto mb-4 ${iconClasses[variant]}`} />
      
      <h3 className="text-lg font-bold mb-2">
        {title || defaultTitles[variant]}
      </h3>
      
      {message && (
        <p className="mb-4 opacity-90">
          {message}
        </p>
      )}

      {showDetails && error && (
        <details className="mb-4 text-left">
          <summary className="cursor-pointer text-sm font-medium mb-2">
            Error Details
          </summary>
          <div className="bg-black/20 rounded-lg p-3 text-xs font-mono overflow-x-auto">
            <div className="mb-2">
              <strong>Error:</strong> {error.name}
            </div>
            <div className="mb-2">
              <strong>Message:</strong> {error.message}
            </div>
            {error.stack && (
              <div>
                <strong>Stack:</strong>
                <pre className="mt-1 whitespace-pre-wrap text-xs">
                  {error.stack}
                </pre>
              </div>
            )}
          </div>
        </details>
      )}

      <div className="flex flex-wrap gap-3 justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              variant === 'critical' 
                ? 'bg-red-600/20 hover:bg-red-600/30 border border-red-600/30'
                : variant === 'warning'
                ? 'bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30'
                : variant === 'minimal'
                ? 'bg-slate-500/20 hover:bg-slate-500/30 border border-slate-500/30'
                : 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        )}

        {showHomeButton && onHome && (
          <button
            onClick={onHome}
            className="px-4 py-2 bg-slate-600/20 hover:bg-slate-600/30 border border-slate-600/30 rounded-lg transition-colors flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
        )}

        {showReportButton && onReport && (
          <button
            onClick={onReport}
            className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 rounded-lg transition-colors flex items-center gap-2"
          >
            <Bug className="w-4 h-4" />
            Report
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
