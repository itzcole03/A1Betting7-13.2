import React, { useMemo, useState } from 'react';
import { useArbitrageOps } from '../../hooks/useArbitrageOps';

interface Props {
  sport: string;
  market: string;
  minMargin?: number;
  refreshMs?: number;
  className?: string;
  maxRows?: number;
}

const ArbitrageWidget: React.FC<Props> = ({
  sport,
  market,
  minMargin = 0.25,
  refreshMs,
  className,
  maxRows = 6
}) => {
  const { data, loading, error, refetch } = useArbitrageOps({ sport, market, minMargin, refreshMs });
  const [showAll, setShowAll] = useState(false);
  const rows = useMemo(
    () => (showAll ? data : data.slice(0, maxRows)),
    [data, showAll, maxRows]
  );

  return (
    <div className={`border rounded p-3 text-xs bg-white shadow-sm ${className || ''}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Arbitrage</span>
        <div className="flex gap-2">
          {data.length > maxRows && (
            <button
              onClick={() => setShowAll(s => !s)}
              className="text-[10px] px-2 py-0.5 border rounded hover:bg-gray-50"
            >
              {showAll ? 'Collapse' : 'More'}
            </button>
          )}
          <button
            onClick={refetch}
            className="text-[10px] px-2 py-0.5 border rounded hover:bg-gray-50"
            disabled={loading}
          >
            {loading ? '...' : 'Refresh'}
          </button>
        </div>
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="overflow-auto">
        <table className="min-w-full text-[11px]">
          <thead>
            <tr className="text-gray-500">
              <th className="text-left pr-2">Selection</th>
              <th className="text-right pr-2">Over(book)</th>
              <th className="text-right pr-2">Under(book)</th>
              <th className="text-right pr-2">Edge%</th>
              <th className="text-right pr-2">Profit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={`${r.selection_key}-${r.over_book}-${r.under_book}`}>
                <td className="pr-2 break-all max-w-[140px]">
                  {r.selection_key.split(':').slice(-2).join(':')}
                </td>
                <td className="text-right pr-2">
                  {r.over_american} ({r.over_book})
                </td>
                <td className="text-right pr-2">
                  {r.under_american} ({r.under_book})
                </td>
                <td className="text-right pr-2 font-semibold text-emerald-600">
                  {r.margin_pct.toFixed(2)}
                </td>
                <td className="text-right pr-2">
                  ${r.guaranteed_profit.toFixed(2)}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-2 text-center text-gray-400">
                  No opportunities
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={5} className="py-2 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-1 text-[10px] text-gray-400">
        Showing {rows.length}/{data.length}
      </div>
    </div>
  );
};

export default ArbitrageWidget;
