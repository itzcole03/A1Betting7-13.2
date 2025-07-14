import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface ChartErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

export interface ChartErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  variant?: 'default' | 'cyber' | 'minimal' | 'compact';
  className?: string;
  chartType?: string;
  chartTitle?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  showDataTable?: boolean;
  fallbackData?: any[];
  showErrorDetails?: boolean;
}

export class ChartErrorBoundary extends Component<
  ChartErrorBoundaryProps,
  ChartErrorBoundaryState
> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ChartErrorBoundaryState> {
    const errorId = `chart_err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Log chart-specific error details
    if (process.env.NODE_ENV === 'development') {
      console.error('Chart Error Boundary caught an error:', {
        chartType: this.props.chartType,
        chartTitle: this.props.chartTitle,
        error,
        errorInfo,
      });
    }
  }

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;

    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  private renderDataTable = () => {
    const { fallbackData, variant } = this.props;

    if (!fallbackData || fallbackData.length === 0) {
      return null;
    }

    const headers = Object.keys(fallbackData[0] || {});

    return (
      <div className='mt-4 max-w-full overflow-x-auto'>
        <table
          className={`min-w-full text-xs ${
            variant === 'cyber'
              ? 'bg-cyan-900/20 border border-cyan-400/30'
              : 'bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700'
          }`}
        >
          <thead>
            <tr className={variant === 'cyber' ? 'bg-cyan-400/10' : 'bg-gray-100 dark:bg-gray-700'}>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className={`px-3 py-2 text-left font-medium ${
                    variant === 'cyber' ? 'text-cyan-400' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fallbackData.slice(0, 5).map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={
                  variant === 'cyber'
                    ? 'border-t border-cyan-400/20'
                    : 'border-t border-gray-200 dark:border-gray-700'
                }
              >
                {headers.map((header, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-3 py-2 ${
                      variant === 'cyber' ? 'text-cyan-300' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {typeof row[header] === 'number'
                      ? row[header].toLocaleString()
                      : String(row[header])}
                  </td>
                ))}
              </tr>
            ))}
            {fallbackData.length > 5 && (
              <tr>
                <td
                  colSpan={headers.length}
                  className={`px-3 py-2 text-center italic ${
                    variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500'
                  }`}
                >
                  ... and {fallbackData.length - 5} more rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  render() {
    const {
      children,
      fallback,
      variant = 'default',
      className = '',
      chartType = 'chart',
      chartTitle,
      enableRetry = true,
      maxRetries = 3,
      showDataTable = false,
      showErrorDetails = false,
    } = this.props;

    if (this.state.hasError) {
      if (fallback) {
        return fallback;
      }

      const baseClasses = `
        flex flex-col items-center justify-center p-6 rounded-lg border min-h-[300px]
        ${
          variant === 'cyber'
            ? 'bg-black border-red-500 text-red-400 shadow-lg shadow-red-500/20'
            : variant === 'compact'
              ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/10 dark:border-red-800 dark:text-red-400 min-h-[200px]'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
        }
        ${className}
      `;

      const canRetry = enableRetry && this.state.retryCount < maxRetries;

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={baseClasses}
        >
          {/* Cyber grid overlay */}
          {variant === 'cyber' && (
            <div className='absolute inset-0 opacity-10 pointer-events-none'>
              <div className='grid grid-cols-6 grid-rows-4 h-full w-full'>
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className='border border-red-500/30' />
                ))}
              </div>
            </div>
          )}

          <div className='relative z-10 text-center max-w-md w-full'>
            {/* Chart Error Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className='mb-4'
            >
              {variant === 'cyber' ? (
                <div className='w-12 h-12 mx-auto border border-red-500 rounded flex items-center justify-center'>
                  <svg
                    className='w-6 h-6 text-red-500'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                    />
                  </svg>
                </div>
              ) : (
                <div
                  className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                    variant === 'cyber' ? 'bg-red-500/20' : 'bg-red-100 dark:bg-red-900/30'
                  }`}
                >
                  <svg
                    className='w-6 h-6 text-red-500'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                    />
                  </svg>
                </div>
              )}
            </motion.div>

            {/* Error Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className='mb-4'
            >
              <h3
                className={`text-lg font-bold mb-2 ${
                  variant === 'cyber' ? 'text-red-400' : 'text-red-800 dark:text-red-400'
                }`}
              >
                {variant === 'cyber' ? 'CHART RENDER FAILURE' : 'Chart Unavailable'}
              </h3>

              <p
                className={`text-sm mb-1 ${
                  variant === 'cyber' ? 'text-red-300/70' : 'text-red-600 dark:text-red-300'
                }`}
              >
                {chartTitle && `"${chartTitle}" `}
                {variant === 'cyber'
                  ? `${chartType.toUpperCase()} visualization encountered a critical error.`
                  : `Unable to render ${chartType}. The chart data may be corrupted or incompatible.`}
              </p>

              {showErrorDetails && this.state.error && (
                <details className='mt-3 text-left'>
                  <summary
                    className={`cursor-pointer text-xs font-medium ${
                      variant === 'cyber' ? 'text-red-400' : 'text-red-700 dark:text-red-400'
                    }`}
                  >
                    Error Details
                  </summary>
                  <div
                    className={`mt-2 p-2 rounded text-xs font-mono ${
                      variant === 'cyber'
                        ? 'bg-red-900/20 border border-red-500/30 text-red-300'
                        : 'bg-red-100 border border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300'
                    }`}
                  >
                    <div className='mb-1'>
                      <strong>ID:</strong> {this.state.errorId}
                    </div>
                    <div>
                      <strong>Message:</strong> {this.state.error.message}
                    </div>
                  </div>
                </details>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className='flex flex-col sm:flex-row gap-2 justify-center mb-4'
            >
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className={`px-4 py-2 rounded font-medium text-sm transition-all ${
                    variant === 'cyber'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                      : 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                  }`}
                >
                  {variant === 'cyber' ? 'RETRY RENDER' : 'Retry Chart'}
                  {this.state.retryCount > 0 && (
                    <span className='ml-1 text-xs opacity-70'>
                      ({this.state.retryCount}/{maxRetries})
                    </span>
                  )}
                </button>
              )}

              {showDataTable && this.props.fallbackData && (
                <button
                  onClick={() => {
                    const tableElement = document.querySelector('.fallback-data-table');
                    tableElement?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`px-4 py-2 rounded font-medium text-sm transition-all ${
                    variant === 'cyber'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30'
                      : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                  }`}
                >
                  {variant === 'cyber' ? 'VIEW DATA MATRIX' : 'View Data Table'}
                </button>
              )}
            </motion.div>

            {/* Retry exhausted message */}
            {enableRetry && this.state.retryCount >= maxRetries && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-xs ${variant === 'cyber' ? 'text-red-300/50' : 'text-red-500'}`}
              >
                {variant === 'cyber'
                  ? 'Chart rendering system compromised. Data visualization unavailable.'
                  : 'Chart cannot be displayed. Please check the data source or try refreshing.'}
              </motion.p>
            )}
          </div>

          {/* Fallback Data Table */}
          {showDataTable && this.props.fallbackData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className='fallback-data-table w-full mt-6'
            >
              <h4
                className={`text-sm font-medium mb-2 ${
                  variant === 'cyber' ? 'text-cyan-400' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                Raw Data ({this.props.fallbackData.length} records)
              </h4>
              {this.renderDataTable()}
            </motion.div>
          )}
        </motion.div>
      );
    }

    return children;
  }
}
