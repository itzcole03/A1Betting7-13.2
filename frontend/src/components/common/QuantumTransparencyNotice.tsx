import React from 'react';
import { Alert, AlertDescription } from '../ui/alert';
import { Info } from 'lucide-react';

interface QuantumTransparencyNoticeProps {
  className?: string;
  variant?: 'default' | 'compact' | 'banner';
}

const QuantumTransparencyNotice: React.FC<QuantumTransparencyNoticeProps> = ({
  className = '',
  variant = 'default'
}) => {
  const getContent = () => {
    switch (variant) {
      case 'compact':
        return "This system uses quantum-inspired classical algorithms, not quantum computing hardware.";
      case 'banner':
        return "TRANSPARENCY: Advanced AI using quantum-inspired classical algorithms - not actual quantum computing.";
      default:
        return "This system uses advanced classical algorithms inspired by quantum computing principles, not actual quantum computing hardware. Terms like 'quantum' refer to mathematical optimization techniques that simulate quantum-like behavior for enhanced prediction accuracy.";
    }
  };

  if (variant === 'banner') {
    return (
      <div className={`bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="text-blue-300 text-sm font-medium">
            {getContent()}
          </span>
        </div>
      </div>
    );
  }

  return (
    <Alert className={`border-blue-500/50 bg-blue-50/10 ${className}`}>
      <Info className="h-4 w-4 text-blue-400" />
      <AlertDescription className="text-blue-300 text-sm">
        {getContent()}
      </AlertDescription>
    </Alert>
  );
};

export default QuantumTransparencyNotice;
