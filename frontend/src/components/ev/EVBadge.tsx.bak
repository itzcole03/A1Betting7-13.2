import React from 'react';

interface EVBadgeProps { edgePct: number; className?: string; }
export const EVBadge: React.FC<EVBadgeProps> = ({ edgePct, className }) => {
  const color =
    edgePct >= 8 ? 'bg-emerald-600' :
    edgePct >= 5 ? 'bg-lime-500' :
    edgePct >= 3 ? 'bg-amber-500' : 'bg-gray-400';
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded text-white font-semibold ${color} ${className||''}`}
      title={`Positive EV: ${edgePct.toFixed(2)}%`}
      data-testid="ev-badge"
    >
      {edgePct.toFixed(1)}% EV
    </span>
  );
};
export default EVBadge;
