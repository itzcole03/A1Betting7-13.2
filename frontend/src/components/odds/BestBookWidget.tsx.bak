import React from 'react';
import { useBestBookOdds } from '../../hooks/useBestBookOdds';

interface Props {
  sport: string;
  market: string;
  includeConsensus?: boolean;
  refreshMs?: number;
  className?: string;
  maxRows?: number;
}

const BestBookWidget: React.FC<Props> = ({
  sport,
  market,
  includeConsensus = false,
  refreshMs,
  className,
  maxRows = 6
}) => {
  const { data, loading, error, refetch } = useBestBookOdds({ sport, market, includeConsensus, refreshMs });
  const rows = data.slice(0, maxRows);

  return (
    <div className={`border rounded p-3 text-xs bg-white shadow-sm ${className || ''}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Best Book Odds</span>
        <button
          onClick={refetch}
          className="text-[10px] px-2 py-0.5 border rounded hover:bg-gray-50"
          disabled={loading}
        >
          {loading ? '...' : 'Refresh'}
        </button>
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="overflow-auto">
        <table className="min-w-full text-[11px]">
          <thead>
            <tr className="text-gray-500">
              <th className="text-left pr-2">Selection</th>
              <th className="text-right pr-2">Line</th>
              <th className="text-right pr-2">Best</th>
              <th className="text-right pr-2">Book</th>
              <th className="text-right pr-2">Books</th>
              {includeConsensus && <th className="text-right pr-2">Cons</th>}
              {includeConsensus && <th className="text-right pr-2">Edge%</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.selection_key} data-testid="bestbook-row">
                <td className="pr-2 break-all max-w-[130px]">
                  {r.selection_key.split(':').slice(-2).join(':')}
                </td>
                <td className="text-right pr-2">{r.line ?? '—'}</td>
                <td className="text-right pr-2">{r.best_american}</td>
                <td className="text-right pr-2">{r.best_book}</td>
                <td className="text-right pr-2">{r.books_considered}</td>
                {includeConsensus && (
                  <>
                    <td className="text-right pr-2">{r.consensus_american ?? '—'}</td>
                    <td className="text-right pr-2">
                      {r.consensus_edge_pct != null ? r.consensus_edge_pct.toFixed(2) : '—'}
                    </td>
                  </>
                )}
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td className="py-2 text-center text-gray-400" colSpan={includeConsensus ? 7 : 5}>No data</td></tr>
            )}
            {loading && (
              <tr><td className="py-2 text-center text-gray-400" colSpan={includeConsensus ? 7 : 5}>Loading...</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-1 text-[10px] text-gray-400">Entries: {rows.length}/{data.length}</div>
    </div>
  );
};

export default BestBookWidget;
