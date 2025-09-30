import { useCallback, useEffect, useRef, useState } from 'react';

export interface OddsConsensusEntry {
  selection_key: string;
  sport: string;
  market: string;
  line: number | null;
  consensus_implied_prob: number;
  consensus_american: number;
  books: number;
  last_updated: string;
  projection_prob?: number | null;
  ev_edge_pct?: number | null;
}

interface UseOddsConsensusOptions {
  sport: string;
  market: string;
  includeEV?: boolean;
  refreshMs?: number;
}

interface OddsConsensusHook {
  data: OddsConsensusEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useOddsConsensus(opts: UseOddsConsensusOptions): OddsConsensusHook {
  const { sport, market, includeEV = false, refreshMs = 30000 } = opts;
  const [data, setData] = useState<OddsConsensusEntry[]>([]);
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
      if (includeEV) params.set('include_ev', 'true');
      const res = await fetch(`/api/odds/consensus?${params.toString()}`, { signal: abortRef.current.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data || []);
      setError(null);
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        setError(e.message || 'Failed to load consensus');
      }
    } finally {
      setLoading(false);
    }
  }, [sport, market, includeEV]);

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
