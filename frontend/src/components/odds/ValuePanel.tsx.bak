import React, { useEffect, useState } from 'react';
import OddsConsensusWidget from './OddsConsensusWidget';
import BestBookWidget from './BestBookWidget';
import ArbitrageWidget from './ArbitrageWidget';

// Backend summary schema returns { status, data: { count, avg_margin_pct, max_margin_pct, ... }}
// The user-provided interface had different names; adapt while keeping a stable UI contract.
interface ArbitrageSummaryUI {
  count: number;
  avg_margin: number; // displayed avg %
  max_margin: number;
  median_margin?: number; // not provided yet, placeholder
  sampled: number; // count mirrored
  top_books: { pair: string; count: number }[];
}

interface Props {
  sport: string;
  market?: string;
  includeEV?: boolean;
  showConsensus?: boolean;
  showBestBook?: boolean;
  showArbitrage?: boolean;
  className?: string;
  refreshMs?: number;
}

const ValuePanel: React.FC<Props> = ({
  sport,
  market = 'player_props',
  includeEV = false,
  showConsensus = true,
  showBestBook = true,
  showArbitrage = true,
  className,
  refreshMs = 30000
}) => {
  const [summary, setSummary] = useState<ArbitrageSummaryUI | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    let abort: AbortController | undefined;

    const load = async () => {
      abort?.abort();
      abort = new AbortController();
      try {
        const res = await fetch(`/api/odds/arbitrage/summary?sport=${sport}&market=${market}`, { signal: abort.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const js: unknown = await res.json();
        // Accept either flattened user-provided structure or backend {status,data}
        let core: Record<string, unknown> = {};
        if (js && typeof js === 'object') {
          const obj = js as Record<string, unknown> & { status?: string };
          if ('data' in obj && obj.status === 'ok' && typeof obj.data === 'object' && obj.data) {
            core = obj.data as Record<string, unknown>;
          } else {
            core = obj;
          }
        }
        const ui: ArbitrageSummaryUI = {
          count: typeof core.count === 'number' ? core.count : 0,
          avg_margin: typeof core.avg_margin === 'number' ? core.avg_margin : (typeof core.avg_margin_pct === 'number' ? core.avg_margin_pct : 0),
          max_margin: typeof core.max_margin === 'number' ? core.max_margin : (typeof core.max_margin_pct === 'number' ? core.max_margin_pct : 0),
          // median not computed backend yet; placeholder logic
          median_margin: typeof core.median_margin === 'number' ? core.median_margin : undefined,
          sampled: typeof core.sampled === 'number' ? core.sampled : (typeof core.count === 'number' ? core.count : 0),
          top_books: Array.isArray(core.top_books) ? (core.top_books as { pair: string; count: number }[]) : [],
        };
        setSummary(ui);
        setSummaryError(null);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        const msg = e instanceof Error ? e.message : 'Failed summary';
        setSummaryError(msg);
      }
    };

    load();
    const intervalId = window.setInterval(load, refreshMs);
    return () => {
      if (intervalId) window.clearInterval(intervalId);
      abort?.abort();
    };
  }, [sport, market, refreshMs]);

  return (
    <div className={className || ''}>
      <div className="grid gap-3 md:grid-cols-3">
        {showConsensus && (
          <OddsConsensusWidget sport={sport} market={market} includeEV={includeEV} />
        )}
        {showBestBook && (
          <BestBookWidget sport={sport} market={market} includeConsensus={false} />
        )}
        {showArbitrage && (
          <ArbitrageWidget sport={sport} market={market} minMargin={0.1} />
        )}
      </div>
      {showArbitrage && (
        <div className="mt-3 border rounded p-3 text-xs bg-white shadow-sm">
          <div className="flex justify-between mb-1">
            <span className="font-semibold">Arbitrage Summary</span>
          </div>
          {summaryError && (
            <div className="text-red-600">{summaryError}</div>
          )}
          {!summaryError && !summary && (
            <div className="text-gray-400">Loading...</div>
          )}
          {summary && (
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <div>Count: {summary.count}</div>
              <div>Avg%: {summary.avg_margin}</div>
              <div>Max%: {summary.max_margin}</div>
              {summary.median_margin != null && <div>Median%: {summary.median_margin}</div>}
              <div>Sampled: {summary.sampled}</div>
              <div className="flex gap-1">
                Top:
                {summary.top_books.length === 0 && <span className="text-gray-400">—</span>}
                {summary.top_books.map(tb => (
                  <span key={tb.pair} className="px-1 bg-gray-100 rounded">
                    {tb.pair}({tb.count})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ValuePanel;
