// Minimal LoadingOverlay placeholder for type-checking
import React from 'react';

type LoadingStage = 'activating' | 'fetching' | 'processing';

export default function LoadingOverlay(props: {
  isVisible?: boolean;
  stage?: LoadingStage;
  message?: string;
  progress?: number;
  sport?: string | null;
}): React.ReactElement | null {
  const { isVisible = true, stage = 'fetching', message, progress } = props;

  if (!isVisible) return null;

  // Keep the UI minimal for now — this component is a placeholder
  return (
    <div className="loading-overlay fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-black/60 rounded p-4 text-white text-center pointer-events-auto">
        <div className="font-medium">{stage === 'activating' ? 'Activating' : stage === 'processing' ? 'Processing' : 'Loading'}</div>
        {message && <div className="text-sm opacity-80 mt-1">{message}</div>}
        {typeof progress === 'number' && (
          <div className="mt-2 text-sm">{Math.round(progress)}%</div>
        )}
      </div>
    </div>
  );
}
