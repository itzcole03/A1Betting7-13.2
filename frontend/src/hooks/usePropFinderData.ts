import { useEffect, useState, useRef, useCallback } from 'react';

// Define the missing types
type PerformancePoint = {
  date: string;
  actual: number;
  line: number;
  opponent?: string;
};

type OddsPoint = {
  label: string;
  odds: number;
};

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
  // Optional user id for syncing bookmarks (back-compat)
  userId?: string;
  // NEW: CLV integration option
  includeCLV?: boolean;
};

type PropfinderResult = {
  performance: PerformancePoint[];
  odds: OddsPoint[];
  loading: boolean;
  error?: string;
};

const DEFAULTS: Partial<UsePropfinderOptions> & {
  autoRefresh: boolean;
  refreshIntervalMs: number;
  refreshInterval: number;
  cacheTTLms: number;
  initialFilters: Record<string, unknown>;
  searchQuery: string;
  limit: number;
} = {
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
          date: (rec.lastUpdated as string) || (rec.date as string) || (rec.event_date as string) || new Date().toISOString(),
          actual: toNumber(rec.line),
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

  // If callers pass userId via opts (back-compat), automatically sync local bookmarks
  useEffect(() => {
    const userId = opts?.userId;
    if (!userId) return;
    void (async () => {
      try {
        const raw = typeof global.localStorage !== 'undefined' ? global.localStorage.getItem('local_propfinder_bookmarks') : null;
        if (!raw) return;
        const list = JSON.parse(raw) as string[];
        if (!Array.isArray(list) || list.length === 0) return;
        const promises = list.map((id) => fetch('/api/propfinder/bookmark', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, userId }) }));
        await Promise.all(promises);
        global.localStorage.removeItem('local_propfinder_bookmarks');
      } catch {
        // swallow errors during test-time sync
      }
    })();
  }, [opts?.userId]);

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
  // NEW: EV fields for Phase 4.2 frontend integration
  evValue?: number;
  evPercent?: number;
  evTier?: string; // EV tier classification: 'high', 'moderate', 'low', 'negative'
  isOutlier?: boolean;
  // NEW: Optional backend EV detail fields (non-breaking)
  // These come from backend response enrichment when available
  // Naming supports both snake_case and camelCase from API payloads
  fairAmericanOdds?: number;
  impliedProbMarket?: number;
  impliedProbFair?: number;
  edgePct?: number;
  expectedValuePer100?: number;
  // NEW: CLV fields for Step 4 frontend integration
  clvPercent?: number;
  closingLine?: number;
  closingOdds?: number;
  // NEW: Low juice fields for arbitrage expansion
  vigPercent?: number;
  isLowJuice?: boolean;
};

type PropFinderStats = {
  total_opportunities?: number;
  avg_confidence?: number;
  max_edge?: number;
  alert_triggered_count?: number;
  sharp_heavy_count?: number;
  sports_count?: number;
  markets_count?: number;
  last_updated?: string;
};

export const usePropFinderData = (options?: UsePropfinderOptions) => {
  // Adapt older callers that pass `refreshInterval` (seconds) into our ms-based option
  const adapted: UsePropfinderOptions | undefined = options ? {
    ...options,
    refreshIntervalMs: options.refreshIntervalMs ?? (options.refreshInterval ? options.refreshInterval * 1000 : undefined)
  } : undefined;

  const { loading, error } = usePropfinderData(adapted);

  // State for managing opportunities and filters
  const [opportunities, setOpportunities] = useState<PropOpportunity[]>([]);
  const [stats, setStats] = useState<PropFinderStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(options?.autoRefresh ?? true);
  // If callers pass userId via options, automatically sync local bookmarks when it becomes available
  useEffect(() => {
    const userId = options?.userId;
    if (!userId) return;
    void (async () => {
      try {
        // Imported helper (defined below) will handle localStorage reading/posting
        await syncLocalBookmarks(userId);
      } catch {
        // swallow errors during test-time sync
      }
    })();
  }, [options?.userId]);

  const fetchRealOpportunities = useCallback(async () => {
    const asRecord = (v: unknown): Record<string, unknown> => (typeof v === 'object' && v !== null) ? (v as Record<string, unknown>) : {};

    try {
      setRefreshing(true);
      const res = await fetch('/api/propfinder/opportunities');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      // Extract opportunities from the real API response
      const rawOpp = json?.data?.opportunities || json?.opportunities || [];
      const opportunitiesData: unknown[] = Array.isArray(rawOpp) ? rawOpp : [];

      // Fetch CLV data if requested
      const clvMap = new Map<string, { clvPercent?: number; closingLine?: number; closingOdds?: number }>();
      if (options?.includeCLV) {
        try {
          const clvRes = await fetch('/api/clv/leaderboard?limit=200');
          if (clvRes.ok) {
            const clvJson = await clvRes.json();
            const clvData = clvJson?.data || clvJson?.items || [];
            if (Array.isArray(clvData)) {
              clvData.forEach((r: unknown) => {
                const clvRecord = asRecord(r);
                const propId = clvRecord.prop_id || clvRecord.propId;
                if (propId) {
                  clvMap.set(String(propId), {
                    clvPercent: typeof (clvRecord.clv_percent || clvRecord.clvPercent || clvRecord.current_clv) === 'number' 
                      ? Number(clvRecord.clv_percent || clvRecord.clvPercent || clvRecord.current_clv) : undefined,
                    closingLine: typeof (clvRecord.closing_line || clvRecord.closingLine) === 'number' 
                      ? Number(clvRecord.closing_line || clvRecord.closingLine) : undefined,
                    closingOdds: typeof (clvRecord.closing_odds || clvRecord.closingOdds) === 'number' 
                      ? Number(clvRecord.closing_odds || clvRecord.closingOdds) : undefined
                  });
                }
              });
            }
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[CLV] leaderboard fetch failed', e);
        }
      }

      // Transform to PropOpportunity format using real data
      const transformedOpportunities: PropOpportunity[] = opportunitiesData.map((op: unknown) => {
        const rec = asRecord(op);
        const opportunityId = String(rec.id || `opp-${Math.random()}`);
        
        // Merge CLV data if available
        const clvData = clvMap.get(opportunityId);
        
        return {
          id: opportunityId,
          player: String(rec.player || 'Unknown Player'),
          playerImage: rec.playerImage ? String(rec.playerImage) : undefined,
          team: String(rec.team || 'Unknown Team'),
          teamLogo: rec.teamLogo ? String(rec.teamLogo) : undefined,
          opponent: String(rec.opponent || 'Unknown Opponent'),
          opponentLogo: rec.opponentLogo ? String(rec.opponentLogo) : undefined,
          sport: String(rec.sport || 'Unknown Sport'),
          market: String(rec.market || 'Unknown Market'),
          line: Number(rec.line) || 0,
          pick: String(rec.pick || 'over') as 'over' | 'under',
          odds: Number(rec.odds) || 0,
          impliedProbability: Number(rec.impliedProbability) || 0,
          aiProbability: Number(rec.aiProbability) || 0,
          edge: Number(rec.edge) || 0,
          confidence: Number(rec.confidence) || 0,
          projectedValue: Number(rec.projectedValue) || 0,
          volume: Number(rec.volume) || 0,
          trend: String(rec.trend || 'stable') as 'up' | 'down' | 'stable',
          trendStrength: Number(rec.trendStrength) || 0,
          timeToGame: String(rec.timeToGame || 'Unknown'),
          venue: String(rec.venue || 'home') as 'home' | 'away',
          weather: rec.weather ? String(rec.weather) : undefined,
          injuries: Array.isArray(rec.injuries) ? rec.injuries.map(String) : [],
          recentForm: Array.isArray(rec.recentForm) ? rec.recentForm.map(Number) : [],
          matchupHistory: asRecord(rec.matchupHistory),
          lineMovement: asRecord(rec.lineMovement),
          bookmakers: Array.isArray(rec.bookmakers) ? rec.bookmakers.map((book: unknown) => {
            const bookRec = asRecord(book);
            return {
              name: String(bookRec.name || ''),
              odds: Number(bookRec.odds) || 0,
              line: Number(bookRec.line) || 0,
            };
          }) : [],
          // Initialize bookmark status from backend data or default to false
          isBookmarked: Boolean(rec.isBookmarked || false),
          tags: Array.isArray(rec.tags) ? rec.tags.map(String) : [],
          socialSentiment: Number(rec.socialSentiment) || 50,
          sharpMoney: String(rec.sharpMoney || 'moderate') as 'heavy' | 'moderate' | 'light' | 'public',
          lastUpdated: String(rec.lastUpdated || new Date().toISOString()),
          alertTriggered: Boolean(rec.alertTriggered || false),
          alertSeverity: rec.alertSeverity ? String(rec.alertSeverity) : undefined,
          // Phase 1.2 fields
          bestBookmaker: rec.bestBookmaker ? String(rec.bestBookmaker) : undefined,
          lineSpread: Number(rec.lineSpread) || 0,
          oddsSpread: Number(rec.oddsSpread) || 0,
          numBookmakers: Number(rec.numBookmakers) || 0,
          hasArbitrage: Boolean(rec.hasArbitrage || false),
          arbitrageProfitPct: Number(rec.arbitrageProfitPct) || 0,
          // NEW: EV fields for Phase 4.2 frontend integration
          evValue: rec.evValue !== undefined && rec.evValue !== null ? Number(rec.evValue) : undefined,
          evPercent: rec.evPercent !== undefined && rec.evPercent !== null ? Number(rec.evPercent) : undefined,
          isOutlier: rec.isOutlier !== undefined && rec.isOutlier !== null ? Boolean(rec.isOutlier) : undefined,
          // Optional backend EV details (mapped if present)
          fairAmericanOdds:
            rec.fairAmericanOdds !== undefined && rec.fairAmericanOdds !== null
              ? Number(rec.fairAmericanOdds)
              : (rec.fair_american_odds !== undefined && rec.fair_american_odds !== null
                  ? Number(rec.fair_american_odds)
                  : undefined),
          impliedProbMarket:
            rec.impliedProbMarket !== undefined && rec.impliedProbMarket !== null
              ? Number(rec.impliedProbMarket)
              : (rec.implied_prob_market !== undefined && rec.implied_prob_market !== null
                  ? Number(rec.implied_prob_market)
                  : undefined),
          impliedProbFair:
            rec.impliedProbFair !== undefined && rec.impliedProbFair !== null
              ? Number(rec.impliedProbFair)
              : (rec.implied_prob_fair !== undefined && rec.implied_prob_fair !== null
                  ? Number(rec.implied_prob_fair)
                  : undefined),
          edgePct:
            rec.edgePct !== undefined && rec.edgePct !== null
              ? Number(rec.edgePct)
              : (rec.edge_pct !== undefined && rec.edge_pct !== null
                  ? Number(rec.edge_pct)
                  : undefined),
          expectedValuePer100:
            rec.expectedValuePer100 !== undefined && rec.expectedValuePer100 !== null
              ? Number(rec.expectedValuePer100)
              : (rec.expected_value_per_100 !== undefined && rec.expected_value_per_100 !== null
                  ? Number(rec.expected_value_per_100)
                  : undefined),
          // NEW: CLV fields for Step 4 frontend integration
          clvPercent: clvData?.clvPercent !== undefined ? Number(clvData.clvPercent) : (rec.clvPercent !== undefined ? Number(rec.clvPercent) : undefined),
          closingLine: clvData?.closingLine !== undefined ? Number(clvData.closingLine) : (rec.closingLine !== undefined ? Number(rec.closingLine) : undefined),
          closingOdds: clvData?.closingOdds !== undefined ? Number(clvData.closingOdds) : (rec.closingOdds !== undefined ? Number(rec.closingOdds) : undefined),
        };
      });

      // Update bookmark status asynchronously for better performance
      setTimeout(async () => {
        try {
          const { bookmarkService } = await import('../services/BookmarkService');
          setOpportunities(prev => prev.map(opp => ({
            ...opp,
            isBookmarked: bookmarkService.isBookmarked(opp.id)
          })));
        } catch {
          // Failed to load bookmark service, keep existing state
        }
      }, 0);

      setOpportunities(transformedOpportunities);

      // Extract stats from the API response
      if (json?.data?.summary) {
        const summary = asRecord(json.data.summary);
        setStats({
          total_opportunities: Number(summary.total_opportunities) || 0,
          avg_confidence: Number(summary.avg_confidence) || 0,
          max_edge: Number(summary.max_edge) || 0,
          alert_triggered_count: Number(summary.alert_triggered_count) || 0,
          sharp_heavy_count: Number(summary.sharp_heavy_count) || 0,
          sports_count: Number(summary.sports_count) || 0,
          markets_count: Number(summary.markets_count) || 0,
          last_updated: String(summary.last_updated || new Date().toISOString()),
        });
      }

    } catch {
      // Error is already handled by the parent hook's error state
    } finally {
      setRefreshing(false);
    }
  }, [options?.includeCLV]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchRealOpportunities();
  }, [fetchRealOpportunities, options?.autoRefresh, options?.refreshInterval]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!isAutoRefreshEnabled) return;

    const interval = setInterval(() => {
      fetchRealOpportunities();
    }, options?.refreshIntervalMs || 30000);

    return () => clearInterval(interval);
  }, [fetchRealOpportunities, isAutoRefreshEnabled, options?.refreshIntervalMs]);

  return {
    opportunities,
    stats,
    loading: loading || refreshing,
    refreshing,
    error: error || null,
    filters,
    searchQuery,
    refreshData: fetchRealOpportunities,
    updateFilters: (newFilters: Record<string, unknown>) => setFilters(newFilters),
    setSearchQuery,
    bookmarkOpportunity: async (opportunityId?: string, opportunity?: PropOpportunity, bookmarked?: boolean) => {
      if (!opportunityId) return;
      
      try {
        // Import BookmarkService when needed to avoid unused import errors
        const { bookmarkService } = await import('../services/BookmarkService');
        
        if (bookmarked) {
          // Add bookmark
          bookmarkService.addBookmark(opportunityId, {
            player: opportunity?.player,
            market: opportunity?.market,
            sport: opportunity?.sport,
            evPercent: opportunity?.evPercent,
          });
        } else {
          // Remove bookmark
          bookmarkService.removeBookmark(opportunityId);
        }
        
        // Update local state to reflect bookmark status
        setOpportunities(prev => prev.map(opp => 
          opp.id === opportunityId 
            ? { ...opp, isBookmarked: bookmarked }
            : opp
        ));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to update bookmark:', error);
      }
    },
    getOpportunityById: async (id: string) => {
      return opportunities.find(opp => opp.id === id) || null;
    },
    getUserBookmarks: async () => opportunities.filter(opp => opp.isBookmarked),
    toggleAutoRefresh: () => setIsAutoRefreshEnabled(!isAutoRefreshEnabled),
    isAutoRefreshEnabled,
    userId: undefined,
  } as const;
};

// Bookmark sync: when a userId becomes available elsewhere in the app, some callers
// expect local bookmarks to be POSTed to the backend and the local stash cleared.
// Implement a small exported helper that checks localStorage and posts bookmarks.
export const syncLocalBookmarks = async (userId?: string | null) => {
  if (!userId) return 0;

  try {
    const raw = typeof global.localStorage !== 'undefined' ? global.localStorage.getItem('local_propfinder_bookmarks') : null;
    if (!raw) return 0;
    const list = JSON.parse(raw) as string[];
    if (!Array.isArray(list) || list.length === 0) return 0;

    // Post each bookmark to the API endpoint
    const promises = list.map((id) => fetch('/api/propfinder/bookmark', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, userId }) }));
    await Promise.all(promises);

    // Clear local stash
    global.localStorage.removeItem('local_propfinder_bookmarks');
    return list.length;
    } catch {
      return 0;
    }
};
