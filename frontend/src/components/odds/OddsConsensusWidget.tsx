import React, { useMemo } from 'react';
import { useOddsConsensus } from '../../hooks/useOddsConsensus';

interface Props {
  sport: string;
  market: string;
  includeEV?: boolean;
  refreshMs?: number;
  className?: string;
  maxRows?: number;
}

const OddsConsensusWidget: React.FC<Props> = ({
  sport,
  market,
  includeEV = false,
  refreshMs,
  className,
  maxRows = 6
}) => {
  const { data, loading, error, refetch } = useOddsConsensus({ sport, market, includeEV, refreshMs });
  const rows = useMemo(() => data.slice(0, maxRows), [data, maxRows]);

  if (error) {
    return (
      <div className={`border rounded p-3 text-xs bg-white shadow-sm ${className || ''}`}>
        <div className="flex justify-between mb-2">
          <span className="font-semibold">Consensus Odds</span>
          <button onClick={refetch} className="text-[10px] px-2 py-0.5 border rounded hover:bg-gray-50">Retry</button>
        </div>
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className={`border rounded p-3 text-xs bg-white shadow-sm ${className || ''}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Consensus Odds</span>
        <button
          onClick={refetch}
          className="text-[10px] px-2 py-0.5 border rounded hover:bg-gray-50"
          disabled={loading}
        >
          {loading ? '...' : 'Refresh'}
        </button>
      </div>
      <div className="overflow-auto">
        <table className="min-w-full text-[11px]">
          <thead>
            <tr className="text-gray-500">
              <th className="text-left pr-2">Selection</th>
              <th className="text-right pr-2">Line</th>
              <th className="text-right pr-2">Books</th>
              <th className="text-right pr-2">Impl%</th>
              <th className="text-right pr-2">ConsOdds</th>
              {includeEV && <th className="text-right pr-2">Edge%</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.selection_key} data-testid="consensus-row">
                <td className="pr-2 break-all max-w-[130px]">
                  {r.selection_key.split(':').slice(-2).join(':')}
                </td>
                <td className="text-right pr-2">{r.line ?? '—'}</td>
                <td className="text-right pr-2">{r.books}</td>
                <td className="text-right pr-2">{(r.consensus_implied_prob * 100).toFixed(1)}</td>
                <td className="text-right pr-2">{r.consensus_american}</td>
                {includeEV && (
                  <td className="text-right pr-2">
                    {r.ev_edge_pct != null ? r.ev_edge_pct.toFixed(2) : '—'}
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={includeEV ? 6 : 5} className="py-2 text-center text-gray-400">
                  No data
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={includeEV ? 6 : 5} className="py-2 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-1 text-[10px] text-gray-400">
        Entries: {rows.length}/{data.length}
      </div>
    </div>
  );
};

export default OddsConsensusWidget;
