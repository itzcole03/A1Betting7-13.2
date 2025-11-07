import { useEffect, useRef, useState, useCallback } from 'react';
import { EVOpportunity } from '../types/ev-types';

interface UsePositiveEVFeedResult {
  items: EVOpportunity[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Map backend snake_case edge_tier to camelCase edgeTier without mutating original
interface RawOpportunity {
  [key: string]: unknown;
  edge_tier?: string;
  edgeTier?: string;
}

function mapOpportunity(raw: RawOpportunity): EVOpportunity {
  const edgeTier = raw.edge_tier || raw.edgeTier || 'micro';
  return {
    ...raw,
    edgeTier,
  } as EVOpportunity;
}

export function usePositiveEVFeed(pollMs: number = 30000, limit: number = 50): UsePositiveEVFeedResult {
  const [items, setItems] = useState<EVOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const timerRef = useRef<number | null>(null);

  const fetchFeed = useCallback(async (showSpinner = true) => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    if (showSpinner) setLoading(true);
    try {
      setError(null);
      const resp = await fetch(`/api/ev/feed?limit=${limit}`, { signal: controller.signal });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const data = await resp.json();
      const mapped = Array.isArray(data.opportunities) ? data.opportunities.map(mapOpportunity) : [];
      if (isMountedRef.current) {
        setItems(mapped);
      }
    } catch (e) {
      // AbortError detection without any cast
      if (e && typeof e === 'object' && 'name' in e && (e as { name?: string }).name === 'AbortError') {
        return;
      }
      const msg = e instanceof Error ? e.message : 'Failed to load feed';
      if (isMountedRef.current) setError(msg);
    } finally {
      if (isMountedRef.current && showSpinner) setLoading(false);
    }
  }, [limit]);

  const refresh = useCallback(async () => fetchFeed(true), [fetchFeed]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchFeed(true);
    if (pollMs > 0) {
      timerRef.current = window.setInterval(() => {
        fetchFeed(false);
      }, pollMs);
    }
    return () => {
      isMountedRef.current = false;
      if (controllerRef.current) controllerRef.current.abort();
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [fetchFeed, pollMs]);

  return { items, loading, error, refresh };
}
