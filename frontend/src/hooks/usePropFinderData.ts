import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { API_BASE_URL } from '../config/apiConfig';
import { bookmarkService } from '../services/BookmarkService';
import { httpFetch } from '../services/HttpClient';

const DEFAULT_REFRESH_INTERVAL_MS = 30_000;

const ARRAY_FILTER_KEYS = new Set(['sports', 'markets', 'venues', 'sharp_money']);
const BOOLEAN_FILTER_KEYS = new Set([
  'bookmarked_only',
  'alert_triggered_only',
  'force_flat_baseline',
  'diagnostics',
]);

interface BookmakerQuote {
  name: string;
  odds?: number;
  line?: number;
  impliedProbability?: number;
  lastUpdated?: string;
}

type TrendDirection = 'up' | 'down' | 'flat';

interface ClvOverride {
  clvPercent?: number;
  closingLine?: number;
  closingOdds?: number;
  clvDelta?: number;
}

export interface PropOpportunity {
  id: string;
  player?: string;
  team?: string;
  opponent?: string;
  sport?: string;
  league?: string;
  market?: string;
  stat?: string;
  pick?: string;
  line?: number;
  odds?: number;
  impliedProbability?: number;
  aiProbability?: number;
  edge?: number;
  edgePct?: number;
  confidence?: number;
  projectedValue?: number;
  bestBookmaker?: string;
  bestOdds?: number;
  bestLine?: number;
  lineSpread?: number;
  oddsSpread?: number;
  numBookmakers?: number;
  hasArbitrage?: boolean;
  arbitrageProfitPct?: number;
  isLowJuice?: boolean;
  sharpMoney?: string;
  evValue?: number;
  evPercent?: number;
  evTier?: string | null;
  isOutlier?: boolean;
  expectedValuePer100?: number;
  impliedProbMarket?: number;
  impliedProbFair?: number;
  vigPercent?: number;
  closingLine?: number;
  closingOdds?: number;
  clvPercent?: number;
  clvDelta?: number;
  clv?: number;
  lastUpdated?: string;
  recentForm?: number[];
  sparkline?: number[];
  bookmakers?: BookmakerQuote[];
  trend?: TrendDirection | null;
  riskRating?: string;
  volatilityScore?: number;
  isBookmarked?: boolean;
  playerImage?: string;
  teamLogo?: string;
  opponentLogo?: string;
  alertTriggered?: boolean;
  alertSeverity?: string;
  timeToGame?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface PropFinderStats {
  total_opportunities: number;
  filtered_opportunities?: number;
  avg_confidence: number;
  max_edge: number;
  alert_triggered_count: number;
  sharp_heavy_count: number;
  sports_count: number;
  markets_count: number;
  last_updated: string;
  [key: string]: number | string | undefined;
}

export interface UsePropfinderOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  refreshIntervalMs?: number;
  includeCLV?: boolean;
  limit?: number;
  search?: string;
  initialFilters?: Record<string, unknown>;
  userId?: string | number;
  cacheTTLms?: number;
  // Pagination: initial offset (default 0)
  offset?: number;
}

// Narrow dev-only window exposures to a single local type so we avoid
// sprinkling `any` casts throughout the file. These properties are
// intentionally optional and only present in development/debug runs.
interface DevWindow extends Window {
  __propfinder_last_request_url?: string;
  __propfinder_last_request_params?: Record<string, string>;
  __propfinder_last_fetch_status?: {
    ok: boolean;
    status?: number | undefined;
    message?: string | undefined;
    server_total?: number | undefined;
  };
  __propfinder_last_response?: unknown;
  __propfinder_last_stats?: unknown;
  // allow other debug keys to exist without type noise
  [key: string]: unknown;
}

export interface PropfinderResult {
  opportunities: PropOpportunity[];
  stats: PropFinderStats | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  filters: Record<string, unknown>;
  searchQuery: string;
  isAutoRefreshEnabled: boolean;
  toggleAutoRefresh: () => void;
  refreshData: () => Promise<void>;
  updateFilters: (nextFilters: Record<string, unknown>) => void;
  setSearchQuery: (query: string) => void;
  bookmarkOpportunity: (
    id: string,
    opportunity?: PropOpportunity,
    bookmarked?: boolean
  ) => Promise<void>;
  // Pagination helpers
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

const DEFAULT_STATS: PropFinderStats = {
  total_opportunities: 0,
  filtered_opportunities: 0,
  avg_confidence: 0,
  max_edge: 0,
  alert_triggered_count: 0,
  sharp_heavy_count: 0,
  sports_count: 0,
  markets_count: 0,
  last_updated: new Date(0).toISOString(),
};

const randomId = (): string => `opp-${Math.random().toString(36).slice(2, 10)}`;

const asRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  return {};
};

const toStringValue = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return undefined;
};

const toNumberValue = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const toBooleanValue = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false;
  }
  return undefined;
};

const sanitizeNumberList = (input: unknown): number[] | undefined => {
  if (!Array.isArray(input)) return undefined;
  const result = input
    .map(item => toNumberValue(item))
    .filter((value): value is number => value !== undefined);
  return result.length ? result : undefined;
};

const sanitizeSparkline = (input: unknown): number[] | undefined => {
  if (!Array.isArray(input)) return undefined;
  const result = input
    .map(item => toNumberValue(item))
    .filter((value): value is number => value !== undefined);
  return result.length ? result : undefined;
};

const sanitizeTrend = (value: unknown): TrendDirection | null => {
  const str = toStringValue(value)?.toLowerCase();
  if (!str) return null;
  if (str === 'up' || str === 'increase' || str === 'increasing') return 'up';
  if (str === 'down' || str === 'decrease' || str === 'decreasing') return 'down';
  if (str === 'flat' || str === 'steady') return 'flat';
  return null;
};

const sanitizeBookmakers = (input: unknown): BookmakerQuote[] | undefined => {
  if (!Array.isArray(input)) return undefined;

  const quotes: BookmakerQuote[] = [];

  input.forEach(entry => {
    const record = asRecord(entry);
    const name = toStringValue(record.name ?? record.bookmaker ?? record.display_name);
    if (!name) return;

    const odds = toNumberValue(record.odds ?? record.price);
    const line = toNumberValue(record.line ?? record.total);
    const impliedProbability = toNumberValue(
      record.impliedProbability ?? record.implied_probability
    );
    const lastUpdated = toStringValue(record.lastUpdated ?? record.last_updated);

    quotes.push({
      name,
      odds: odds ?? undefined,
      line: line ?? undefined,
      impliedProbability: impliedProbability ?? undefined,
      lastUpdated,
    });
  });

  return quotes.length ? quotes : undefined;
};

const mergeClvOverride = (opportunity: PropOpportunity, override?: ClvOverride): void => {
  if (!override) return;
  if (override.clvPercent !== undefined) opportunity.clvPercent = override.clvPercent;
  if (override.closingLine !== undefined) opportunity.closingLine = override.closingLine;
  if (override.closingOdds !== undefined) opportunity.closingOdds = override.closingOdds;
  if (override.clvDelta !== undefined) opportunity.clvDelta = override.clvDelta;
};

const mergeFilters = (
  current: Record<string, unknown>,
  updates: Record<string, unknown>
): Record<string, unknown> => {
  const result = { ...current };
  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      delete result[key];
      return;
    }
    if (Array.isArray(value)) {
      const sanitized = value
        .map(item => toStringValue(item)?.trim())
        .filter((item): item is string => Boolean(item));
      if (sanitized.length) {
        result[key] = sanitized;
      } else {
        delete result[key];
      }
      return;
    }
    result[key] = value;
  });
  return result;
};

const normalizeInitialFilters = (filters?: Record<string, unknown>): Record<string, unknown> => {
  if (!filters) return {};
  return mergeFilters({}, filters);
};

const buildQueryParams = (
  filters: Record<string, unknown>,
  extras: {
    limit?: number;
    search?: string;
    includeCLV?: boolean;
    userId?: string | number;
  }
): URLSearchParams => {
  const params = new URLSearchParams();

  if (typeof extras.limit === 'number' && extras.limit > 0) {
    params.set('limit', String(extras.limit));
  }

  if (extras.search && extras.search.trim().length) {
    params.set('search', extras.search.trim());
  }

  if (extras.includeCLV) {
    params.set('include_clv', 'true');
  }

  if (extras.userId !== undefined && extras.userId !== null) {
    params.set('user_id', String(extras.userId));
  }

  Object.entries(filters).forEach(([key, rawValue]) => {
    if (rawValue === undefined || rawValue === null) return;

    if (ARRAY_FILTER_KEYS.has(key)) {
      const values = Array.isArray(rawValue) ? rawValue : [rawValue];
      const sanitized = values
        .map(item => toStringValue(item)?.trim())
        .filter((item): item is string => Boolean(item));
      if (sanitized.length) {
        params.set(key, sanitized.join(','));
      }
      return;
    }

    if (BOOLEAN_FILTER_KEYS.has(key)) {
      const boolValue = toBooleanValue(rawValue);
      if (boolValue !== undefined) {
        params.set(key, boolValue ? 'true' : 'false');
      }
      return;
    }

    const numericValue = toNumberValue(rawValue);
    if (numericValue !== undefined) {
      params.set(key, String(numericValue));
      return;
    }

    const stringValue = toStringValue(rawValue);
    if (stringValue && stringValue.trim().length) {
      params.set(key, stringValue.trim());
    }
  });

  return params;
};

export function mapRawOpportunity(
  raw: Record<string, unknown>,
  clvOverrides?: Map<string, ClvOverride>
): PropOpportunity {
  const data = asRecord(raw);

  const baseId =
    toStringValue(data.id) ||
    toStringValue(data.opportunityId) ||
    toStringValue(data.opportunity_id) ||
    undefined;

  const id = baseId || randomId();

  const opportunity: PropOpportunity = {
    id,
    player: toStringValue(data.player ?? data.player_name),
    team: toStringValue(data.team ?? data.team_name),
    opponent: toStringValue(data.opponent ?? data.opponent_name),
    sport: toStringValue(data.sport ?? data.league),
    league: toStringValue(data.league),
    market: toStringValue(data.market ?? data.market_type ?? data.stat),
    stat: toStringValue(data.stat ?? data.stat_type),
    pick: toStringValue(data.pick ?? data.side),
    line: toNumberValue(data.line ?? data.projected_line ?? data.threshold),
    odds: toNumberValue(data.odds ?? data.bestOdds ?? data.price),
    impliedProbability: toNumberValue(
      data.impliedProbability ?? data.implied_probability ?? data.implied_prob_market
    ),
    aiProbability: toNumberValue(data.aiProbability ?? data.ai_probability),
    edge: toNumberValue(data.edge),
    edgePct: toNumberValue(data.edgePct ?? data.edge_pct),
    confidence: toNumberValue(data.confidence ?? data.confidence_pct),
    projectedValue: toNumberValue(data.projectedValue ?? data.projection),
    bestBookmaker: toStringValue(
      data.bestBookmaker ?? data.best_over_bookmaker_name ?? data.bestBook
    ),
    bestOdds: toNumberValue(data.bestOdds ?? data.best_odds),
    bestLine: toNumberValue(data.bestLine ?? data.best_line),
    lineSpread: toNumberValue(data.lineSpread ?? data.line_spread),
    oddsSpread: toNumberValue(data.oddsSpread ?? data.odds_spread),
    numBookmakers: toNumberValue(data.numBookmakers ?? data.num_bookmakers),
    hasArbitrage: toBooleanValue(data.hasArbitrage ?? data.arbitrage) ?? false,
    arbitrageProfitPct: toNumberValue(data.arbitrageProfitPct ?? data.arbitrage_profit_pct),
    isLowJuice: toBooleanValue(data.isLowJuice ?? data.lowJuice) ?? false,
    sharpMoney: toStringValue(data.sharpMoney ?? data.sharp_money),
    evValue: toNumberValue(data.evValue ?? data.ev_value),
    evPercent: toNumberValue(data.evPercent ?? data.ev_percent),
    evTier: toStringValue(data.evTier ?? data.ev_tier) ?? null,
    isOutlier: toBooleanValue(data.isOutlier ?? data.is_outlier) ?? undefined,
    expectedValuePer100: toNumberValue(data.expected_value_per_100),
    impliedProbMarket: toNumberValue(data.implied_prob_market),
    impliedProbFair: toNumberValue(data.implied_prob_fair),
    vigPercent: toNumberValue(data.vig_percent ?? data.vigPercent),
    closingLine: toNumberValue(data.closingLine ?? data.closing_line),
    closingOdds: toNumberValue(data.closingOdds ?? data.closing_odds),
    clvPercent: toNumberValue(data.clvPercent ?? data.clv_percent),
    clvDelta: toNumberValue(data.clvDelta ?? data.clv_delta),
    clv: toNumberValue(data.clv),
    lastUpdated: toStringValue(data.lastUpdated ?? data.last_updated),
    recentForm: sanitizeNumberList(data.recentForm ?? data.recent_form),
    sparkline: sanitizeSparkline(data.sparkline),
    bookmakers: sanitizeBookmakers(data.bookmakers),
    trend: sanitizeTrend(data.trend),
    riskRating: toStringValue(data.riskRating ?? data.risk_rating),
    volatilityScore: toNumberValue(data.volatilityScore ?? data.volatility_score),
    playerImage: toStringValue(data.playerImage),
    teamLogo: toStringValue(data.teamLogo),
    opponentLogo: toStringValue(data.opponentLogo),
    isBookmarked: toBooleanValue(data.isBookmarked) ?? false,
    alertTriggered: toBooleanValue(data.alertTriggered ?? data.alert_triggered) ?? false,
    alertSeverity: toStringValue(data.alertSeverity ?? data.alert_severity),
    timeToGame: toStringValue(data.timeToGame ?? data.time_to_game),
  };

  const override = clvOverrides?.get(id);
  mergeClvOverride(opportunity, override);

  if (Array.isArray(data.tags)) {
    const tags = data.tags
      .map(item => toStringValue(item))
      .filter((tag): tag is string => Boolean(tag));
    if (tags.length) {
      opportunity.tags = tags;
    }
  }

  return opportunity;
}

export function mapSummaryToStats(
  summary: Record<string, unknown> | null | undefined
): PropFinderStats {
  if (!summary) {
    return { ...DEFAULT_STATS, last_updated: new Date().toISOString() };
  }

  const record = asRecord(summary);

  const resolveNumber = (...keys: string[]): number => {
    for (const key of keys) {
      const value = toNumberValue(record[key]);
      if (value !== undefined) return value;
    }
    return 0;
  };

  const resolveString = (...keys: string[]): string | undefined => {
    for (const key of keys) {
      const value = toStringValue(record[key]);
      if (value) return value;
    }
    return undefined;
  };

  return {
    total_opportunities: resolveNumber('total_opportunities', 'totalOpportunities', 'total'),
    filtered_opportunities: resolveNumber('filtered', 'filtered_opportunities'),
    avg_confidence: resolveNumber('avg_confidence', 'avgConfidence'),
    max_edge: resolveNumber('max_edge', 'maxEdge'),
    alert_triggered_count: resolveNumber('alert_triggered_count', 'alertTriggeredCount'),
    sharp_heavy_count: resolveNumber('sharp_heavy_count', 'sharpHeavyCount'),
    sports_count: resolveNumber('sports_count', 'sportsCount'),
    markets_count: resolveNumber('markets_count', 'marketsCount'),
    last_updated: resolveString('last_updated', 'lastUpdated') ?? new Date().toISOString(),
  } satisfies PropFinderStats;
}

function resolveRefreshInterval(options?: UsePropfinderOptions): number {
  if (options?.refreshIntervalMs && options.refreshIntervalMs > 0) {
    return Math.max(options.refreshIntervalMs, 1_000);
  }
  if (options?.refreshInterval && options.refreshInterval > 0) {
    return Math.max(options.refreshInterval * 1_000, 1_000);
  }
  return DEFAULT_REFRESH_INTERVAL_MS;
}

function usePropFinderDataInternal(options?: UsePropfinderOptions): PropfinderResult {
  // Preserve caller-provided initial filters. We avoid forcing a default sport
  // here so deterministic debug snapshots (used in E2E/global-setup) remain
  // consistent with server-side totals and filters.
  const initialFilters = useMemo(() => {
    return normalizeInitialFilters(options?.initialFilters);
  }, [options?.initialFilters]);

  const [filters, setFilters] = useState<Record<string, unknown>>(initialFilters);
  const [searchQueryState, setSearchQueryState] = useState<string>(options?.search ?? '');
  const [opportunities, setOpportunities] = useState<PropOpportunity[]>([]);
  const [stats, setStats] = useState<PropFinderStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [offset, setOffset] = useState<number>(options?.offset ?? 0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState<boolean>(
    Boolean(options?.autoRefresh)
  );

  const filtersRef = useRef<Record<string, unknown>>(initialFilters);
  const searchRef = useRef<string>(options?.search ?? '');
  const activeRequestRef = useRef<AbortController | null>(null);
  const initialFetchRef = useRef<boolean>(false);
  const isFetchingRef = useRef<boolean>(false);
  const manualPaginationRef = useRef<boolean>(false);

  useEffect(() => {
    setFilters(initialFilters);
    filtersRef.current = initialFilters;
  }, [initialFilters]);

  useEffect(() => {
    setSearchQueryState(options?.search ?? '');
    searchRef.current = options?.search ?? '';
  }, [options?.search]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    opportunitiesRef.current = opportunities;
  }, [opportunities]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);
  useEffect(() => {
    searchRef.current = searchQueryState;
  }, [searchQueryState]);

  const refreshIntervalMs = useMemo(() => resolveRefreshInterval(options), [options]);
  const includeCLV = Boolean(options?.includeCLV);
  // Use a conservative default page size to avoid transferring overly large
  // payloads by default. Consumers can override via options.limit.
  const effectiveLimit = options?.limit ?? 25;
  const initialOffset = options?.offset ?? 0;
  const userId = options?.userId;

  const offsetRef = useRef<number>(initialOffset);
  const opportunitiesRef = useRef<PropOpportunity[]>([]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    opportunitiesRef.current = opportunities;
  }, [opportunities]);

  const fetchOpportunities = useCallback(
    async (opts?: { silent?: boolean }) => {
      isFetchingRef.current = true;
      // Dev-only debug snapshot: if a dev snapshot is present in localStorage,
      // use it to populate opportunities/stats and skip the network fetch. This
      // is useful for headless E2E runs when the backend may have no data yet.
      try {
        if (typeof window !== 'undefined') {
          const snapshot = localStorage.getItem('propfinder.debug_snapshot');
          if (snapshot) {
            try {
              const parsed = JSON.parse(snapshot);
              const data = asRecord(parsed?.data ?? parsed);
              const rawOpportunities = Array.isArray(data.opportunities)
                ? (data.opportunities as unknown[])
                : [];

              const clvOverrides = new Map<string, ClvOverride>();
              rawOpportunities.forEach(item => {
                const rec = asRecord(item);
                const candidateId =
                  toStringValue(rec.id) ||
                  toStringValue(rec.opportunityId) ||
                  toStringValue(rec.opportunity_id);
                if (!candidateId) return;
                const metrics = asRecord(rec.clv_metrics);
                if (!Object.keys(metrics).length) return;

                const override: ClvOverride = {};
                const percent = toNumberValue(metrics.clvPercent ?? metrics.clv_percent);
                if (percent !== undefined) override.clvPercent = percent;
                const closingLine = toNumberValue(metrics.closingLine ?? metrics.closing_line);
                if (closingLine !== undefined) override.closingLine = closingLine;
                const closingOdds = toNumberValue(metrics.closingOdds ?? metrics.closing_odds);
                if (closingOdds !== undefined) override.closingOdds = closingOdds;
                const delta = toNumberValue(metrics.clvDelta ?? metrics.clv_delta);
                if (delta !== undefined) override.clvDelta = delta;

                if (Object.keys(override).length) {
                  clvOverrides.set(candidateId, override);
                }
              });

              const mapped = rawOpportunities.map(item => {
                const mappedOpportunity = mapRawOpportunity(asRecord(item), clvOverrides);
                mappedOpportunity.isBookmarked = bookmarkService.isBookmarked(mappedOpportunity.id);
                return mappedOpportunity;
              });

              setOpportunities(mapped);
              const fallbackStats = mapSummaryToStats(
                asRecord(data.summary ?? { total_opportunities: mapped.length })
              );
              setStats(fallbackStats);
              setLastUpdated(new Date().toISOString());
              setError(null);
              if (!opts?.silent) setLoading(false);
              isFetchingRef.current = false;
              return;
            } catch (e) {
              // If snapshot parsing fails, fall through to normal fetch
              // eslint-disable-next-line no-console
              console.warn(
                '[usePropFinderData] failed to parse debug snapshot, continuing to fetch',
                e
              );
            }
          }
        }
      } catch {
        // ignore debug-snapshot errors and proceed to network fetch
      }
      const controller = new AbortController();
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
      }
      activeRequestRef.current = controller;

      if (!opts?.silent) {
        setLoading(true);
        setError(null);
      }

      try {
        // Build query params from current filters/search/flags and add pagination params
        const params = buildQueryParams(filtersRef.current, {
          limit: effectiveLimit,
          search: searchRef.current,
          includeCLV,
          userId,
        });
        params.set('offset', String(offsetRef.current));
        // Request compact/list-mode by default for the opportunities list so
        // the server can return a lightweight representation and reduce
        // payload size. The server shim honors `fields=compact`.
        params.set('fields', 'compact');

        const queryString = params.toString();
        const url = queryString
          ? `/api/propfinder/opportunities?${queryString}`
          : '/api/propfinder/opportunities';

        // Expose the final request URL and params to window for easier dev debugging
        try {
          if (typeof window !== 'undefined') {
            // Narrow window to our dev-only interface to avoid `any`.
            const devWin = window as unknown as DevWindow;
            devWin.__propfinder_last_request_url = url;
            // also expose parsed params for convenience
            devWin.__propfinder_last_request_params = Object.fromEntries(params.entries());
            // add a clear debug log so it's easy to spot in devtools

            // eslint-disable-next-line no-console
            console.debug(
              '[usePropFinderData] request ->',
              url,
              devWin.__propfinder_last_request_params
            );
          }
        } catch {
          // ignore when running in non-browser contexts
        }

        const response = await httpFetch(url, {
          signal: controller.signal,
          logLabel: 'usePropFinderData',
          span_name: 'propfinder.opportunities',
        });

        if (!response.ok) {
          const errMsg = `PropFinder request failed with status ${response.status}`;
          try {
            if (typeof window !== 'undefined') {
              const devWin = window as unknown as DevWindow;
              devWin.__propfinder_last_fetch_status = {
                ok: false,
                status: response.status,
                message: errMsg,
                server_total: undefined,
              };
            }
          } catch {
            // ignore
          }

          // Attempt a simple fallback for local development when httpFetch may be misconfigured
          try {
            if (typeof window !== 'undefined') {
              const host = window.location.hostname;
              const isLocal = host === 'localhost' || host === '127.0.0.1';
              if (isLocal) {
                // Build the absolute URL directly against API_BASE_URL
                const absoluteBase = API_BASE_URL.replace(/\/$/, '');
                const relative = url.startsWith('/') ? url : `/${url}`;
                const fallbackUrl = absoluteBase + relative;
                // eslint-disable-next-line no-console
                console.warn(
                  '[usePropFinderData] primary fetch failed; attempting fallback fetch to',
                  fallbackUrl
                );
                const fallbackResp = await fetch(fallbackUrl, { credentials: 'include' });
                if (fallbackResp.ok) {
                  const payload = await fallbackResp.json();
                  const data = asRecord(payload?.data ?? payload);
                  const rawOpportunities = Array.isArray(data.opportunities)
                    ? (data.opportunities as unknown[])
                    : [];

                  const clvOverrides = new Map<string, ClvOverride>();
                  rawOpportunities.forEach(item => {
                    const rec = asRecord(item);
                    const candidateId =
                      toStringValue(rec.id) ||
                      toStringValue(rec.opportunityId) ||
                      toStringValue(rec.opportunity_id);
                    if (!candidateId) return;
                    const metrics = asRecord(rec.clv_metrics);
                    if (!Object.keys(metrics).length) return;

                    const override: ClvOverride = {};
                    const percent = toNumberValue(metrics.clvPercent ?? metrics.clv_percent);
                    if (percent !== undefined) override.clvPercent = percent;
                    const closingLine = toNumberValue(metrics.closingLine ?? metrics.closing_line);
                    if (closingLine !== undefined) override.closingLine = closingLine;
                    const closingOdds = toNumberValue(metrics.closingOdds ?? metrics.closing_odds);
                    if (closingOdds !== undefined) override.closingOdds = closingOdds;
                    const delta = toNumberValue(metrics.clvDelta ?? metrics.clv_delta);
                    if (delta !== undefined) override.clvDelta = delta;

                    if (Object.keys(override).length) {
                      clvOverrides.set(candidateId, override);
                    }
                  });

                  const mapped = rawOpportunities.map(item => {
                    const mappedOpportunity = mapRawOpportunity(asRecord(item), clvOverrides);
                    mappedOpportunity.isBookmarked = bookmarkService.isBookmarked(
                      mappedOpportunity.id
                    );
                    return mappedOpportunity;
                  });

                  setOpportunities(mapped);
                  const fallbackStats = mapSummaryToStats(
                    asRecord(data.summary ?? { total_opportunities: mapped.length })
                  );
                  setStats(fallbackStats);
                  try {
                    if (typeof window !== 'undefined') {
                      const devWin = window as unknown as DevWindow;
                      // expose fallback fetch status
                      devWin.__propfinder_last_fetch_status = {
                        ok: true,
                        status: fallbackResp.status,
                        server_total: toNumberValue(
                          fallbackStats?.total_opportunities ?? undefined
                        ),
                      };
                      // expose payload
                      devWin.__propfinder_last_response = payload;
                      devWin.__propfinder_last_stats = fallbackStats;
                    }
                  } catch {
                    // ignore
                  }

                  setLastUpdated(new Date().toISOString());
                  setError(null);
                  if (!opts?.silent) setLoading(false);
                  if (activeRequestRef.current === controller) activeRequestRef.current = null;
                  isFetchingRef.current = false;
                  return;
                }
              }
            }
          } catch (fallbackErr) {
            // swallow fallback errors and continue to throw the original error
            // eslint-disable-next-line no-console
            console.warn('[usePropFinderData] fallback fetch failed', fallbackErr);
          }

          // eslint-disable-next-line no-console
          console.error('[usePropFinderData] fetch error:', errMsg);
          throw new Error(errMsg);
        }

        const payload = await response.json();
        const data = asRecord(payload?.data ?? payload);

        const rawOpportunities = Array.isArray(data.opportunities)
          ? (data.opportunities as unknown[])
          : [];
        // Merge top-level data and nested summary so callers that place totals
        // at the top-level (e.g. `total`) or inside `summary.count` are both
        // accounted for when computing server totals and stats.
        const summary = { ...asRecord(data), ...asRecord(data.summary) } as Record<string, unknown>;

        const clvOverrides = new Map<string, ClvOverride>();
        rawOpportunities.forEach(item => {
          const rec = asRecord(item);
          const candidateId =
            toStringValue(rec.id) ||
            toStringValue(rec.opportunityId) ||
            toStringValue(rec.opportunity_id);
          if (!candidateId) return;
          const metrics = asRecord(rec.clv_metrics);
          if (!Object.keys(metrics).length) return;

          const override: ClvOverride = {};
          const percent = toNumberValue(metrics.clvPercent ?? metrics.clv_percent);
          if (percent !== undefined) override.clvPercent = percent;
          const closingLine = toNumberValue(metrics.closingLine ?? metrics.closing_line);
          if (closingLine !== undefined) override.closingLine = closingLine;
          const closingOdds = toNumberValue(metrics.closingOdds ?? metrics.closing_odds);
          if (closingOdds !== undefined) override.closingOdds = closingOdds;
          const delta = toNumberValue(metrics.clvDelta ?? metrics.clv_delta);
          if (delta !== undefined) override.clvDelta = delta;

          if (Object.keys(override).length) {
            clvOverrides.set(candidateId, override);
          }
        });

        const mapped = rawOpportunities.map(item => {
          const mappedOpportunity = mapRawOpportunity(asRecord(item), clvOverrides);
          mappedOpportunity.isBookmarked = bookmarkService.isBookmarked(mappedOpportunity.id);
          return mappedOpportunity;
        });

        // If offset is zero, replace; otherwise append
        if (!offset) {
          setOpportunities(mapped);
        } else {
          setOpportunities(prev => [...prev, ...mapped]);
        }

        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.info('[usePropFinderData] fetched opportunities', {
            count: mapped.length,
            params: Object.fromEntries(params.entries()),
            summary,
          });
        }
        // Update hasMore based on server summary or returned count
        const serverTotal =
          toNumberValue(summary.total_opportunities) ??
          toNumberValue(summary.total) ??
          toNumberValue(summary.totalOpportunities) ??
          toNumberValue(summary.count) ??
          undefined;
        if (serverTotal !== undefined) {
          const currentCount =
            (Number(offsetRef.current) || 0) +
            (mapped?.length ?? 0) +
            (opportunitiesRef.current?.length ?? 0);
          setHasMore(currentCount < Number(serverTotal));
        } else {
          // fall back to length check
          setHasMore(mapped.length === effectiveLimit);
        }
        setStats(mapSummaryToStats(summary));
        try {
          if (typeof window !== 'undefined') {
            const devWin = window as unknown as DevWindow;
            // expose fetch success and server total for quick debugging
            devWin.__propfinder_last_fetch_status = {
              ok: true,
              status: response.status,
              message: undefined,
              server_total: serverTotal,
            };
          }
        } catch {
          // ignore
        }
        setLastUpdated(new Date().toISOString());

        // Diagnostic: expose last fetched payload on window for dev/debug tooling
        try {
          const devWin = window as unknown as DevWindow;
          devWin.__propfinder_last_response = payload;
          devWin.__propfinder_last_stats = summary;
        } catch {
          // ignore in non-browser contexts
        }
        setError(null);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        const message =
          err instanceof Error ? err.message : 'Unknown error while fetching PropFinder data';
        try {
          if (typeof window !== 'undefined') {
            const devWin = window as unknown as DevWindow;
            devWin.__propfinder_last_fetch_status = {
              ok: false,
              status: undefined,
              message,
              server_total: undefined,
            };
          }
        } catch {
          // ignore
        }
        setError(message);
        // eslint-disable-next-line no-console
        console.error('[usePropFinderData] fetch exception:', message);
      } finally {
        if (!opts?.silent) {
          setLoading(false);
        }
        if (activeRequestRef.current === controller) {
          activeRequestRef.current = null;
        }
      }
    },
    [effectiveLimit, includeCLV, userId]
  );

  // loadMore increments offset and fetches next page
  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore) return;
    if (isFetchingRef.current) return;
    // mark that this offset change is a manual pagination so the offset effect
    // won't trigger a duplicate fetch
    manualPaginationRef.current = true;
    const next = (offsetRef.current ?? 0) + effectiveLimit;
    // update both state and ref synchronously so the fetch reads the correct offset
    setOffset(next);
    offsetRef.current = next;
    try {
      await fetchOpportunities({ silent: true });
    } finally {
      // nothing extra here; fetchOpportunities clears isFetchingRef itself
    }
  }, [effectiveLimit, hasMore, fetchOpportunities]);

  useEffect(() => {
    if (!initialFetchRef.current) {
      initialFetchRef.current = true;
      fetchOpportunities();
      return;
    }
    fetchOpportunities();
  }, [fetchOpportunities, filters, searchQueryState]);

  // Trigger a fetch when offset changes (pagination)
  useEffect(() => {
    // Do not trigger on initial mount because initialFetchRef handles initial run
    if (!initialFetchRef.current) return;
    if (manualPaginationRef.current) {
      // this pagination was initiated via loadMore which already called fetchOpportunities
      manualPaginationRef.current = false;
      return;
    }
    fetchOpportunities();
  }, [offset, fetchOpportunities]);

  useEffect(() => {
    return () => {
      activeRequestRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!isAutoRefreshEnabled) return undefined;

    const timer = setInterval(() => {
      fetchOpportunities({ silent: true }).catch(() => {
        // Swallow refresh errors; dedicated error state handles fatal failures.
      });
    }, refreshIntervalMs);

    return () => clearInterval(timer);
  }, [isAutoRefreshEnabled, refreshIntervalMs, fetchOpportunities]);

  const updateFilters = useCallback(
    (nextFilters: Record<string, unknown>) => {
      setFilters(prev => mergeFilters(prev, nextFilters));
      // Reset pagination when filters change
      setOffset(initialOffset);
      setHasMore(true);
    },
    [initialOffset]
  );

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query ?? '');
  }, []);

  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled(prev => {
      const next = !prev;
      if (next) {
        fetchOpportunities({ silent: true }).catch(() => {
          // Silently ignore refresh failure when toggling on.
        });
      }
      return next;
    });
  }, [fetchOpportunities]);

  const refreshData = useCallback(async () => {
    await fetchOpportunities();
  }, [fetchOpportunities]);

  const bookmarkOpportunity = useCallback(
    async (id: string, opportunity?: PropOpportunity, bookmarked?: boolean) => {
      const desiredState =
        typeof bookmarked === 'boolean' ? bookmarked : !bookmarkService.isBookmarked(id);

      let success = false;
      if (desiredState) {
        success = bookmarkService.addBookmark(id, {
          player: opportunity?.player,
          market: opportunity?.market,
          sport: opportunity?.sport,
          evPercent: opportunity?.evPercent,
        });
      } else {
        success = bookmarkService.removeBookmark(id);
      }

      if (success) {
        setOpportunities(prev =>
          prev.map(op => (op.id === id ? { ...op, isBookmarked: desiredState } : op))
        );
      }
    },
    []
  );

  return {
    opportunities,
    stats,
    loading,
    error,
    lastUpdated,
    filters,
    searchQuery: searchQueryState,
    isAutoRefreshEnabled,
    toggleAutoRefresh,
    refreshData,
    updateFilters,
    setSearchQuery,
    bookmarkOpportunity,
    loadMore,
    hasMore,
  };
}

export function usePropFinderData(options?: UsePropfinderOptions): PropfinderResult {
  return usePropFinderDataInternal(options);
}

export default function usePropfinderData(options?: UsePropfinderOptions): PropfinderResult {
  return usePropFinderDataInternal(options);
}
