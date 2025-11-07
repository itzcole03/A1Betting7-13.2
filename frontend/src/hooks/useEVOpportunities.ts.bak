import { useEffect, useRef, useState } from 'react';

export interface EVOpportunity {
  id: string; sport: string; market: string; player?: string | null;
  line: number; fair_odds: number; market_odds: number;
  edge_pct: number; implied_prob: number; fair_prob: number;
  source_book: string; timestamp: string;
  kelly_fraction?: number; recommended_stake?: number;
}

interface Options { sport?: string; minEdge?: number; refreshMs?: number; bankroll?: number; includeKelly?: boolean; }

export function useEVOpportunities(opts: Options = {}) {
  const { sport, minEdge = 2, refreshMs = 30000, bankroll, includeKelly } = opts;
  const [data, setData] = useState<EVOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const lastSerializedRef = useRef<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('min_edge', String(minEdge));
      params.set('limit', '50');
      if (sport) params.set('sport', sport);
      if (includeKelly) params.set('include_kelly', 'true');
      if (includeKelly && bankroll && bankroll > 0) params.set('bankroll', String(bankroll));
      const res = await fetch(`/api/ev/opportunities?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const incoming: EVOpportunity[] = json.data || [];
      // simple dedupe: only update state if serialized payload changed
      const serialized = JSON.stringify(incoming.map(o => ({ id: o.id, edge_pct: o.edge_pct, kf: o.kelly_fraction })));
      if (serialized !== lastSerializedRef.current) {
        lastSerializedRef.current = serialized;
        setData(incoming);
      }
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'fetch failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    timerRef.current = window.setInterval(fetchData, refreshMs);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport, minEdge, refreshMs, bankroll, includeKelly]);

  return { data, loading, error, refetch: fetchData };
}

export default useEVOpportunities;
