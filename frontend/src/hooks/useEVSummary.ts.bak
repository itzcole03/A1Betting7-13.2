import { useEffect, useState, useRef, useCallback } from 'react';

export interface EVSummary {
  total: number;
  edges_gt_2: number;
  edges_gt_5: number;
  avg_edge: number;
  generated_at: string;
}

export function useEVSummary(refreshMs = 30000) {
  const [data, setData] = useState<EVSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      const res = await fetch('/api/ev/summary', { signal: abortRef.current.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      if ((e as any)?.name !== 'AbortError') setError(e instanceof Error ? e.message : 'Failed to load EV summary');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    timerRef.current = window.setInterval(fetchSummary, refreshMs);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      abortRef.current?.abort();
    };
  }, [fetchSummary, refreshMs]);

  return { data, loading, error, refetch: fetchSummary };
}

export default useEVSummary;
