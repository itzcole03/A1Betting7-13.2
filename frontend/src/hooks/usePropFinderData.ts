import { useEffect, useState, useRef } from 'react';
import type { PerformancePoint } from '../components/charts/PlayerPerformanceChart';
import type { OddsPoint } from '../components/charts/OddsAggregationChart';

type UsePropfinderOptions = {
  autoRefresh?: boolean;
  refreshIntervalMs?: number;
  // Backwards-compatible second-based option used across older callers
  refreshInterval?: number;
  cacheTTLms?: number;
  // Compatibility: some callers pass initialFilters/searchQuery/limit
  initialFilters?: Record<string, unknown>;
  searchQuery?: string;
  limit?: number;
};

type PropfinderResult = {
  performance: PerformancePoint[];
  odds: OddsPoint[];
  loading: boolean;
  error?: string;
};

const DEFAULTS: Required<UsePropfinderOptions> = {
  autoRefresh: true,
  refreshIntervalMs: 30_000,
  refreshInterval: 30,
  cacheTTLms: 15_000,
  initialFilters: {},
  searchQuery: '',
  limit: 50,
};

export default function usePropfinderData(opts?: UsePropfinderOptions): PropfinderResult {
  const options = { ...DEFAULTS, ...(opts || {}) };
  const [state, setState] = useState<PropfinderResult>({ performance: [], odds: [], loading: true });
  const lastFetched = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const toNumber = (v: unknown): number => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };

  const asRecord = (v: unknown): Record<string, unknown> => (typeof v === 'object' && v !== null) ? (v as Record<string, unknown>) : {};

  const fetchOnce = async () => {
    try {
      setState((s) => ({ ...s, loading: true }));

      const now = Date.now();
      if (lastFetched.current && now - lastFetched.current < options.cacheTTLms) {
        setState((s) => ({ ...s, loading: false }));
        return;
      }

      const res = await fetch('/api/propfinder/opportunities');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const rawOpp = Array.isArray(json?.data?.opportunities) ? json.data.opportunities : (Array.isArray(json?.opportunities) ? json.opportunities : []);
      const opportunities = Array.isArray(rawOpp) ? rawOpp as unknown[] : [];

      const performance: PerformancePoint[] = opportunities.map((op) => {
        const rec = asRecord(op);
        return {
          date: (rec.date as string) || (rec.event_date as string) || new Date().toISOString(),
          actual: toNumber(rec.actual),
          line: toNumber(rec.line),
          opponent: (rec.opponent as string) || (rec.team as string) || undefined,
        };
      });

      const odds: OddsPoint[] = opportunities.map((op) => {
        const rec = asRecord(op);
        return {
          label: (rec.player as string) || (rec.market as string) || (rec.name as string) || 'unknown',
          odds: toNumber(rec.odds),
        };
      });

      lastFetched.current = Date.now();
      setState({ performance, odds, loading: false });
    } catch (err: unknown) {
      setState({ performance: [], odds: [], loading: false, error: err instanceof Error ? err.message : String(err) });
    }
  };

  // Keep a ref to fetchOnce so effect dependencies are stable
  const fetchOnceRef = useRef(fetchOnce);
  fetchOnceRef.current = fetchOnce;

  useEffect(() => {
    void fetchOnceRef.current();
    if (options.autoRefresh) {
      timerRef.current = window.setInterval(() => { void fetchOnceRef.current(); }, options.refreshIntervalMs);
      return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
    }
    return undefined;
  }, [options.autoRefresh, options.refreshIntervalMs, options.cacheTTLms]);

  return state;
}

// Compatibility exports for existing code that imports the older hook and types.
export type PropOpportunity = {
  id: string;
  player: string;
  playerImage?: string;
  team?: string;
  teamLogo?: string;
  opponent?: string;
  opponentLogo?: string;
  sport?: string;
  market?: string;
  line?: number;
  pick?: 'over' | 'under';
  odds?: number;
  impliedProbability?: number;
  aiProbability?: number;
  edge?: number;
  confidence?: number;
  projectedValue?: number;
  volume?: number;
  trend?: 'up' | 'down' | 'stable';
  trendStrength?: number;
  timeToGame?: string;
  venue?: 'home' | 'away';
  weather?: string;
  injuries?: string[];
  recentForm?: number[];
  matchupHistory?: {
    games?: number;
    average?: number;
    hitRate?: number;
  };
  lineMovement?: {
    open?: number;
    current?: number;
    direction?: 'up' | 'down' | 'stable';
  };
  bookmakers?: Array<{
    name: string;
    odds: number;
    line: number;
  }>;
  isBookmarked?: boolean;
  tags?: string[];
  socialSentiment?: number;
  sharpMoney?: 'heavy' | 'moderate' | 'light' | 'public';
  lastUpdated?: string;
  alertTriggered?: boolean;
  alertSeverity?: string;
  bestBookmaker?: string;
  lineSpread?: number;
  oddsSpread?: number;
  numBookmakers?: number;
  hasArbitrage?: boolean;
  arbitrageProfitPct?: number;
};

export const usePropFinderData = (options?: UsePropfinderOptions) => {
  // Adapt older callers that pass `refreshInterval` (seconds) into our ms-based option
  const adapted: UsePropfinderOptions | undefined = options ? {
    ...options,
    refreshIntervalMs: options.refreshIntervalMs ?? (options.refreshInterval ? options.refreshInterval * 1000 : undefined)
  } : undefined;

  const { performance, loading, error } = usePropfinderData(adapted);

  const opportunities: PropOpportunity[] = performance.map((p, i) => ({
    id: `${p.date}-${i}`,
    player: 'unknown',
    team: p.opponent,
    market: 'points',
    sport: undefined,
    line: p.line,
    odds: undefined,
    isBookmarked: false,
    lastUpdated: p.date,
    confidence: undefined,
    edge: undefined,
    hasArbitrage: false,
    numBookmakers: undefined,
    sharpMoney: undefined,
    bookmakers: [],
    tags: [],
  }));

  return {
    opportunities,
    stats: null,
    loading,
    refreshing: false,
    error: error ?? null,
    filters: {},
    searchQuery: '',
    refreshData: async () => { /* intentionally lightweight */ await Promise.resolve(); },
    updateFilters: (_: Partial<Record<string, unknown>>) => {},
    setSearchQuery: (_: string) => {},
    bookmarkOpportunity: async (_opportunityId?: string, _opportunity?: PropOpportunity, _bookmarked?: boolean) => {},
    getOpportunityById: async (_: string) => null,
    getUserBookmarks: async () => [] as PropOpportunity[],
    toggleAutoRefresh: () => {},
    isAutoRefreshEnabled: false,
    userId: undefined,
  } as const;
};
