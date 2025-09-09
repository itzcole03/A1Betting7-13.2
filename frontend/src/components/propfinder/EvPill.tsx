import React from 'react';
import { formatEvPercent, getEvPillClasses } from '../../utils/evFormatting';

interface EvPillProps {
  evPercent?: number | null;
  className?: string;
}

const EvPill: React.FC<EvPillProps> = ({ evPercent, className = '' }) => {
  const { bg, text } = getEvPillClasses(evPercent);
  const label = formatEvPercent(evPercent);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${bg} ${text} ${className}`}
      title={`Expected Value ${label}`}
      data-testid="ev-pill"
    >
      {label}
    </span>
  );
};

export default EvPill;
