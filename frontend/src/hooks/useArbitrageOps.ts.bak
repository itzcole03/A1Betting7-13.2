import { useCallback, useEffect, useRef, useState } from 'react';

export interface ArbitrageOpportunity {
  selection_key: string;
  sport: string;
  market: string;
  over_book: string;
  under_book: string;
  over_american: number;
  under_american: number;
  margin_pct: number;
  stake_over: number;
  stake_under: number;
  total_stake: number;
  guaranteed_return: number;
  guaranteed_profit: number;
  last_updated: string;
}

interface Options {
  sport: string;
  market: string;
  minMargin?: number;
  refreshMs?: number;
}

export function useArbitrageOps({ sport, market, minMargin = 0.25, refreshMs = 30000 }: Options) {
  const [data, setData] = useState<ArbitrageOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | undefined>();
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!sport || !market) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sport,
        market,
        min_margin: String(minMargin)
      });
      const res = await fetch(`/api/odds/arbitrage?${params.toString()}`, { signal: abortRef.current.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data || []);
      setError(null);
    } catch (e: any) {
      if (e.name !== 'AbortError') setError(e.message || 'Failed to load arbitrage');
    } finally {
      setLoading(false);
    }
  }, [sport, market, minMargin]);

  useEffect(() => {
    fetchData();
    timerRef.current = window.setInterval(fetchData, refreshMs);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      abortRef.current?.abort();
    };
  }, [fetchData, refreshMs]);

  return { data, loading, error, refetch: fetchData };
}
