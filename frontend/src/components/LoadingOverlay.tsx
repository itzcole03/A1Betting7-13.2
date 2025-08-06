import React from 'react';

interface LoadingOverlayProps {
  isVisible: boolean;
  stage: 'activating' | 'fetching' | 'processing';
  sport?: string;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  stage,
  sport = 'MLB',
  message,
}) => {
  const getStageMessage = () => {
    if (message) return message;

    switch (stage) {
      case 'activating':
        return `Activating ${sport} models and services...`;
      case 'fetching':
        return 'Fetching latest AI-powered projections...';
      case 'processing':
        return 'Processing AI insights...';
      default:
        return 'Loading...';
    }
  };

  const getProgressPercentage = () => {
    switch (stage) {
      case 'activating':
        return 25;
      case 'fetching':
        return 65;
      case 'processing':
        return 90;
      default:
        return 0;
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className='fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300'
      role='status'
      aria-live='polite'
      aria-label='Loading content'
    >
      <div className='bg-slate-800/90 border border-slate-600 rounded-2xl p-8 max-w-md mx-4 shadow-2xl'>
        {/* Clean, optimized loading spinner */}
        <div className='flex justify-center items-center mb-6'>
          <div className='optimized-spinner w-16 h-16 border-4 border-slate-600 rounded-full border-t-yellow-400'></div>
        </div>

        {/* Optimized progress bar */}
        <div className='w-full bg-slate-700 rounded-full h-3 mb-4 overflow-hidden relative shadow-inner'>
          <div
            className='h-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 rounded-full transition-all duration-1000 ease-out relative overflow-hidden'
            style={{ width: `${getProgressPercentage()}%` }}
          >
            <div className='absolute inset-0 optimized-shimmer'></div>
          </div>
        </div>

        {/* Clean loading message */}
        <div className='text-center'>
          <p className='text-white font-medium text-lg mb-2'>{getStageMessage()}</p>
          <p className='text-gray-400 text-sm'>
            {stage === 'activating' && 'Initializing machine learning models...'}
            {stage === 'fetching' && 'Retrieving real-time data...'}
            {stage === 'processing' && 'Finalizing predictions...'}
          </p>
        </div>

        {/* Clean stage indicators */}
        <div className='flex justify-center space-x-3 mt-4'>
          <div
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              stage === 'activating' ? 'bg-yellow-400 scale-110' : 'bg-slate-500'
            }`}
          ></div>
          <div
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              stage === 'fetching' ? 'bg-yellow-400 scale-110' : 'bg-slate-500'
            }`}
          ></div>
          <div
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              stage === 'processing' ? 'bg-yellow-400 scale-110' : 'bg-slate-500'
            }`}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
