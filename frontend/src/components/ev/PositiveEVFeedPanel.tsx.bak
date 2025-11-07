import React from 'react';
import { EVOpportunity } from '../../types/ev-types';

interface PositiveEVFeedPanelProps {
  items: EVOpportunity[];
  className?: string;
}

const tierClasses: Record<string, string> = {
  micro: 'text-gray-600',
  solid: 'text-amber-600 font-medium',
  strong: 'text-green-600 font-semibold',
  elite: 'text-emerald-600 font-bold',
};

export const PositiveEVFeedPanel: React.FC<PositiveEVFeedPanelProps> = ({ items, className = '' }) => {
  if (!items || items.length === 0) {
    return <div className={`text-sm text-gray-500 ${className}`}>No positive EV items yet.</div>;
  }
  return (
    <div className={`space-y-2 ${className}`}> {
      items.map(i => {
        const tier = i.edgeTier || 'micro';
        const cls = tierClasses[tier] || tierClasses.micro;
        return (
          <div key={i.id} className="flex items-center justify-between border rounded px-3 py-2 bg-white shadow-sm">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{i.player}</div>
              <div className="text-xs text-gray-500 truncate">{i.market}</div>
            </div>
            <div className="text-right ml-3">
              <div className={`text-sm ${cls}`}>{i.ev_percent.toFixed(2)}%</div>
              <div className="text-[10px] text-gray-400">{tier}</div>
            </div>
          </div>
        );
      })
    }</div>
  );
};

export default PositiveEVFeedPanel;
