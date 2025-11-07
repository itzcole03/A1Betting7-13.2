import { useCallback, useEffect, useRef, useState } from 'react';

export interface BestBookEntry {
  selection_key: string;
  sport: string;
  market: string;
  line: number | null;
  best_american: number;
  best_book: string;
  books_considered: number;
  last_updated: string;
  consensus_american?: number;
  consensus_implied_prob?: number;
  consensus_edge_pct?: number | null;
}

interface Options {
  sport: string;
  market: string;
  includeConsensus?: boolean;
  refreshMs?: number;
}

interface BestBookHook {
  data: BestBookEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBestBookOdds(opts: Options): BestBookHook {
  const { sport, market, includeConsensus = false, refreshMs = 30000 } = opts;
  const [data, setData] = useState<BestBookEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!sport || !market) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const params = new URLSearchParams({ sport, market });
      if (includeConsensus) params.set('include_consensus', 'true');
      const res = await fetch(`/api/odds/best-book?${params.toString()}`, { signal: abortRef.current.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data || []);
      setError(null);
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') setError(e.message || 'Failed to load best-book odds');
    } finally {
      setLoading(false);
    }
  }, [sport, market, includeConsensus]);

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
