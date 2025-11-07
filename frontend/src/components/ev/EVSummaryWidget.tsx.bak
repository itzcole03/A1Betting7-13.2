import React from 'react';
import { useEVSummary } from '../../hooks/useEVSummary';

interface Props {
  refreshMs?: number;
  className?: string;
}

const EVSummaryWidget: React.FC<Props> = ({ refreshMs = 30000, className }) => {
  const { data, loading, error, refetch } = useEVSummary(refreshMs);

  if (loading && !data) {
    return (
      <div className={`border rounded p-3 text-xs animate-pulse ${className || ''}`} data-testid="ev-summary-loading">
        <div className="font-semibold mb-1">EV Summary</div>
        <div className="flex gap-4">
          <span className="bg-gray-200 h-4 w-10 rounded" />
          <span className="bg-gray-200 h-4 w-10 rounded" />
          <span className="bg-gray-200 h-4 w-10 rounded" />
          <span className="bg-gray-200 h-4 w-10 rounded" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={`border rounded p-3 text-xs text-red-600 ${className || ''}`} data-testid="ev-summary-error">
        <div className="font-semibold mb-1">EV Summary</div>
        <div className="mb-2">Error: {error}</div>
        <button
          onClick={refetch}
          className="px-2 py-1 border rounded text-red-700 hover:bg-red-50"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const updated = new Date(data.generated_at).toLocaleTimeString();

  return (
    <div className={`border rounded p-3 text-xs bg-white shadow-sm ${className || ''}`} data-testid="ev-summary-widget">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold">EV Summary</span>
        <button
          onClick={refetch}
          className="text-[10px] px-2 py-0.5 border rounded hover:bg-gray-50"
          title="Refresh now"
        >
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-1">
        <div className="flex flex-col">
          <span className="text-gray-500">Total</span>
          <span className="font-semibold">{data.total}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500">&gt;=2%</span>
          <span className="font-semibold">{data.edges_gt_2}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500">&gt;=5%</span>
          <span className="font-semibold">{data.edges_gt_5}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500">Avg EV</span>
          <span className="font-semibold">
            {data.avg_edge != null ? data.avg_edge.toFixed(2) + '%' : '—'}
          </span>
        </div>
      </div>
      <div className="text-[10px] text-gray-400">
        Updated {updated}{loading ? ' • updating...' : ''}
      </div>
    </div>
  );
};

export default EVSummaryWidget;
