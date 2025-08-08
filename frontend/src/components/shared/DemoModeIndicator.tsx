/**
 * DemoModeIndicator - Shows when the app is running in demo mode
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DemoModeIndicatorProps {
  show: boolean;
  message?: string;
}

export const DemoModeIndicator: React.FC<DemoModeIndicatorProps> = ({ 
  show, 
  message = "Demo Mode - Backend services unavailable, showing demo data" 
}) => {
  if (!show) return null;

  return (
    <div className="bg-amber-900/50 border border-amber-700 rounded-lg p-3 mb-4">
      <div className="flex items-center gap-2 text-amber-300">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
};

export default DemoModeIndicator;
