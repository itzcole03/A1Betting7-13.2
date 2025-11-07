import {
  Activity,
  AlertTriangle,
  Calculator,
  CheckCircle,
  Clock,
  Play,
  RefreshCw,
  ShieldCheck,
  Target,
  TrendingUp,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { httpFetch } from '../../../services/HttpClient';
import { createTimeoutSignal } from '../../../utils/createTimeoutSignal';
import { enhancedLogger } from '../../../utils/enhancedLogger';

// Types and Interfaces
interface ArbitrageOpportunity {
  id: string;
  sport: string;
  event: string;
  market: string;
  start_time: string;
  bookmaker_a: {
    name: string;
    selection: string;
    odds: number;
    stake: number;
  };
  bookmaker_b: {
    name: string;
    selection: string;
    odds: number;
    stake: number;
  };
  total_stake: number;
  guaranteed_profit: number;
  profit_margin: number;
  confidence_score: number;
  risk_assessment: {
    liquidity_risk: 'low' | 'medium' | 'high';
    timing_risk: 'low' | 'medium' | 'high';
    odds_movement_risk: 'low' | 'medium' | 'high';
    overall_risk: 'low' | 'medium' | 'high';
  };
  execution_time_window: number; // seconds
  last_updated: string;
  status: 'active' | 'executing' | 'executed' | 'expired' | 'failed';
}

interface ExecutionStep {
  id: number;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  bookmaker?: string;
  stake?: number;
  estimated_time?: number;
  completed_at?: string;
  error_message?: string;
}

interface ArbitrageSummaryEnvelope {
  status?: string;
  data?: {
    count: number;
    unique_selections: number;
    books_involved: number;
    avg_margin: number;
    avg_margin_pct: number;
    max_margin: number;
    max_margin_pct: number;
    top_opportunity: Record<string, unknown> | null;
  };
  error?: string;
}

interface NormalizedArbitrageSummary {
  totalOpportunities: number;
  uniqueSelections: number;
  booksInvolved: number;
  averageMarginPct: number;
  maxMarginPct: number;
}

interface HistoricalArbitrageSnapshot {
  timestamp: string;
  opportunities: number;
  profit: number;
  avgMargin: number;
  executionRate: number;
}

interface LoadOptions {
  showSpinner?: boolean;
  isRetry?: boolean;
}

interface ConsolidatedArbitrageGroup {
  key: string;
  sport: string;
  event: string;
  market: string;
  opportunities: ArbitrageOpportunity[];
  bestOpportunity: ArbitrageOpportunity;
  averageMargin: number;
  combinedProfit: number;
  averageConfidence: number;
  lastUpdated: string;
}

const API_BASE_PATH = '/api/odds/arbitrage';

const riskBadgeClasses: Record<string, { bg: string; text: string }> = {
  low: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-200',
  },
  medium: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-200',
  },
  high: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-200',
  },
};

const americanToDecimal = (american: number): number => {
  if (!Number.isFinite(american)) return 0;
  if (american > 0) {
    return +(1 + american / 100).toFixed(4);
  }
  if (american < 0) {
    return +(1 + 100 / Math.abs(american)).toFixed(4);
  }
  return 1;
};

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);

const ArbitrageOpportunities: React.FC = () => {
  const [consolidatedOpportunities, setConsolidatedOpportunities] = useState<
    ConsolidatedArbitrageGroup[]
  >([]);
  const [summary, setSummary] = useState<NormalizedArbitrageSummary | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalArbitrageSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const selectedOpportunityRef = useRef<ArbitrageOpportunity | null>(null);

  // Filter States
  const [sportFilter, setSportFilter] = useState<string>('All');
  const [minProfitMargin, setMinProfitMargin] = useState<number>(1.0);
  const [minConfidence, setMinConfidence] = useState<number>(70);
  const [riskFilter, setRiskFilter] = useState<string>('All');

  // Execution Dialog States
  const [executionDialogOpen, setExecutionDialogOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<ArbitrageOpportunity | null>(null);
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [executionInProgress, setExecutionInProgress] = useState(false);

  // Calculator Dialog States
  const [calculatorDialogOpen, setCalculatorDialogOpen] = useState(false);
  const [calculatorOddsA, setCalculatorOddsA] = useState<number>(2.0);
  const [calculatorOddsB, setCalculatorOddsB] = useState<number>(2.2);
  const [calculatorTotalStake, setCalculatorTotalStake] = useState<number>(100);

  const getOpportunityKey = useCallback(
    (opportunity: ArbitrageOpportunity) =>
      `${opportunity.id}|${opportunity.bookmaker_a.name}|${opportunity.bookmaker_b.name}`,
    []
  );

  const resolveSportParam = useCallback(() => {
    if (sportFilter === 'All') return 'MLB';
    return sportFilter.toUpperCase();
  }, [sportFilter]);

  const warmArbitrageSnapshots = useCallback(async (): Promise<boolean> => {
    const params = new URLSearchParams();
    params.append('sport', resolveSportParam());
    params.append('market', 'player_props');

    try {
      // Attempt to trigger backend snapshot ingestion when the API returns no data.
      enhancedLogger.info(
        'ArbitrageOpportunities',
        'warmArbitrageSnapshots',
        'Triggering odds snapshot refresh'
      );

      const response = await httpFetch(`/api/odds/refresh?${params.toString()}`, {
        method: 'POST',
        logLabel: 'arbitrage:refresh',
        span_name: 'arbitrage.refresh',
      });

      if (!response.ok) {
        enhancedLogger.warn(
          'ArbitrageOpportunities',
          'warmArbitrageSnapshots',
          `Refresh request failed: ${response.status} ${response.statusText}`
        );
        return false;
      }

      let details: Record<string, unknown> | null = null;
      try {
        details = await response.json();
      } catch {
        details = null;
      }

      enhancedLogger.info(
        'ArbitrageOpportunities',
        'warmArbitrageSnapshots',
        'Refresh response received',
        { details }
      );

      if (details && typeof details === 'object') {
        const status = (details as { status?: unknown }).status;
        if (typeof status === 'string' && status === 'ingestion_unavailable') {
          return false;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 600));
      return true;
    } catch (err) {
      enhancedLogger.warn(
        'ArbitrageOpportunities',
        'warmArbitrageSnapshots',
        'Failed to warm arbitrage snapshots',
        undefined,
        err as Error
      );
      return false;
    }
  }, [resolveSportParam]);

  const loadArbitrageData = useCallback(
    async (options: LoadOptions = {}) => {
      const { showSpinner = true, isRetry = false } = options;
      if (showSpinner) {
        setLoading(true);
        setRefreshing(false);
      } else {
        setRefreshing(true);
      }
      setError(null);

      try {
        const baseParams = new URLSearchParams();
        baseParams.append('sport', resolveSportParam());
        baseParams.append('market', 'player_props');
        baseParams.append('min_margin', minProfitMargin.toFixed(2));

        enhancedLogger.info(
          'ArbitrageOpportunities',
          'loadArbitrageData',
          'Fetching arbitrage opportunities'
        );

        const timeoutMain = createTimeoutSignal(10_000);
        let opportunitiesResponse: Response;
        try {
          opportunitiesResponse = await httpFetch(`${API_BASE_PATH}?${baseParams.toString()}`, {
            signal: timeoutMain.signal,
            logLabel: 'arbitrage:opportunities',
            span_name: 'arbitrage.list',
          });
        } finally {
          timeoutMain.cleanup();
        }

        if (!opportunitiesResponse.ok) {
          throw new Error(
            `Arbitrage API returned ${opportunitiesResponse.status} ${opportunitiesResponse.statusText}`
          );
        }

  const payload: { count?: number; data?: unknown[] } = await opportunitiesResponse.json();
        let rawOpportunities = Array.isArray(payload?.data) ? payload.data : [];

  // Auto-warm the ingestion pipeline once when the initial fetch returns nothing.
  if (!isRetry && rawOpportunities.length === 0) {
          enhancedLogger.info(
            'ArbitrageOpportunities',
            'loadArbitrageData',
            'No arbitrage data returned from API, attempting warm refresh'
          );

          const warmed = await warmArbitrageSnapshots();
          if (warmed) {
            const retryTimeout = createTimeoutSignal(10_000);
            try {
              const retryResponse = await httpFetch(`${API_BASE_PATH}?${baseParams.toString()}`, {
                signal: retryTimeout.signal,
                logLabel: 'arbitrage:opportunities.retry',
                span_name: 'arbitrage.list.retry',
              });

              if (retryResponse.ok) {
                const retryPayload: { count?: number; data?: unknown[] } =
                  await retryResponse.json();
                rawOpportunities = Array.isArray(retryPayload?.data)
                  ? retryPayload.data
                  : [];
              } else {
                enhancedLogger.warn(
                  'ArbitrageOpportunities',
                  'loadArbitrageData',
                  `Retry fetch failed: ${retryResponse.status} ${retryResponse.statusText}`
                );
              }
            } finally {
              retryTimeout.cleanup();
            }
          } else {
            enhancedLogger.warn(
              'ArbitrageOpportunities',
              'loadArbitrageData',
              'Snapshot warm attempt did not yield opportunities'
            );
          }
        }

  const transformed: ArbitrageOpportunity[] = rawOpportunities.map((opp, index) => {
        const marginPct = Number((opp as Record<string, unknown>)?.margin_pct ?? 0);
        const totalStake = Number((opp as Record<string, unknown>)?.total_stake ?? 0);
        const guaranteedProfit = Number((opp as Record<string, unknown>)?.guaranteed_profit ?? 0);

        const selectionKey = String(
          (opp as Record<string, unknown>)?.selection_key ?? `arb_${index + 1}`
        );
        const eventLabel = selectionKey
          .split('|')
          .map(part => part.trim())
          .filter(Boolean)
          .join(' • ');

        const confidenceScore = Math.max(40, Math.min(98, 60 + marginPct * 5));

        const gradeRisk = (value: number): 'low' | 'medium' | 'high' => {
          if (value >= 3.5) return 'low';
          if (value >= 1.5) return 'medium';
          return 'high';
        };

        const lineValue = Number((opp as Record<string, unknown>)?.line ?? 0);

        return {
          id: selectionKey,
          sport: String((opp as Record<string, unknown>)?.sport || resolveSportParam()).toUpperCase(),
          event: eventLabel || `Selection ${index + 1}`,
          market: String((opp as Record<string, unknown>)?.market || 'player_props'),
          start_time:
            String((opp as Record<string, unknown>)?.last_updated) ||
            new Date().toISOString(),
          bookmaker_a: {
            name: String((opp as Record<string, unknown>)?.over_book || 'Unknown'),
            selection:
              (lineValue || lineValue === 0)
                ? `Over ${lineValue}`
                : String((opp as Record<string, unknown>)?.over_selection || 'Over'),
            odds: americanToDecimal(Number((opp as Record<string, unknown>)?.over_american)),
            stake: Number((opp as Record<string, unknown>)?.stake_over ?? totalStake / 2),
          },
          bookmaker_b: {
            name: String((opp as Record<string, unknown>)?.under_book || 'Unknown'),
            selection:
              (lineValue || lineValue === 0)
                ? `Under ${lineValue}`
                : String((opp as Record<string, unknown>)?.under_selection || 'Under'),
            odds: americanToDecimal(Number((opp as Record<string, unknown>)?.under_american)),
            stake: Number((opp as Record<string, unknown>)?.stake_under ?? totalStake / 2),
          },
          total_stake: totalStake,
          guaranteed_profit: guaranteedProfit,
          profit_margin: marginPct,
          confidence_score: confidenceScore,
          risk_assessment: {
            liquidity_risk: gradeRisk(marginPct + 0.5),
            timing_risk: gradeRisk(marginPct),
            odds_movement_risk: gradeRisk(marginPct - 0.5),
            overall_risk: gradeRisk(marginPct),
          },
          execution_time_window: Math.max(45, Math.round(240 - marginPct * 20)),
          last_updated:
            String((opp as Record<string, unknown>)?.last_updated) ||
            new Date().toISOString(),
          status: 'active',
        };
      });

      const groupedMap = new Map<
        string,
        {
          sport: string;
          event: string;
          market: string;
          opportunities: ArbitrageOpportunity[];
          bestOpportunity: ArbitrageOpportunity;
          totalMargin: number;
          totalProfit: number;
          totalConfidence: number;
          lastUpdated: string;
        }
      >();

      transformed.forEach(opportunity => {
        const groupKey = `${opportunity.event}|${opportunity.market}|${opportunity.sport}`;
        const existing = groupedMap.get(groupKey);

        if (!existing) {
          groupedMap.set(groupKey, {
            sport: opportunity.sport,
            event: opportunity.event,
            market: opportunity.market,
            opportunities: [opportunity],
            bestOpportunity: opportunity,
            totalMargin: opportunity.profit_margin,
            totalProfit: opportunity.guaranteed_profit,
            totalConfidence: opportunity.confidence_score,
            lastUpdated: opportunity.last_updated,
          });
          return;
        }

        existing.opportunities.push(opportunity);
        existing.totalMargin += opportunity.profit_margin;
        existing.totalProfit += opportunity.guaranteed_profit;
        existing.totalConfidence += opportunity.confidence_score;

        if (
          new Date(opportunity.last_updated).getTime() >
          new Date(existing.lastUpdated).getTime()
        ) {
          existing.lastUpdated = opportunity.last_updated;
        }

        if (opportunity.profit_margin > existing.bestOpportunity.profit_margin) {
          existing.bestOpportunity = opportunity;
        }
      });

      const consolidatedList: ConsolidatedArbitrageGroup[] = Array.from(groupedMap.entries()).map(
        ([key, value]) => {
          const sortedOpportunities = [...value.opportunities].sort(
            (a, b) => b.profit_margin - a.profit_margin
          );
          const best = sortedOpportunities[0];
          return {
            key,
            sport: value.sport,
            event: value.event,
            market: value.market,
            opportunities: sortedOpportunities,
            bestOpportunity: best,
            averageMargin: value.totalMargin / sortedOpportunities.length,
            combinedProfit: value.totalProfit,
            averageConfidence: value.totalConfidence / sortedOpportunities.length,
            lastUpdated: value.lastUpdated,
          };
        }
      );

      const sortedConsolidated = consolidatedList.sort((a, b) => {
        if (b.bestOpportunity.profit_margin !== a.bestOpportunity.profit_margin) {
          return b.bestOpportunity.profit_margin - a.bestOpportunity.profit_margin;
        }
        return (
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        );
      });

      setConsolidatedOpportunities(sortedConsolidated);

      const previousSelectionKey = selectedOpportunityRef.current
        ? getOpportunityKey(selectedOpportunityRef.current)
        : null;

      let resolvedSelection: ArbitrageOpportunity | null = null;

      if (previousSelectionKey) {
        resolvedSelection = transformed.find(
          opportunity => getOpportunityKey(opportunity) === previousSelectionKey
        ) || null;
      }

      if (!resolvedSelection && sortedConsolidated.length > 0) {
        resolvedSelection = sortedConsolidated[0].bestOpportunity;
      }

      if (resolvedSelection) {
        const resolvedKey = getOpportunityKey(resolvedSelection);
        if (resolvedKey !== previousSelectionKey) {
          setSelectedOpportunity(resolvedSelection);
        }
      } else if (previousSelectionKey) {
        setSelectedOpportunity(null);
      }

      const timeoutSummary = createTimeoutSignal(10_000);
      try {
        const summaryResponse = await httpFetch(
          `${API_BASE_PATH}/summary?${baseParams.toString()}`,
          {
            signal: timeoutSummary.signal,
            logLabel: 'arbitrage:summary',
            span_name: 'arbitrage.summary',
          }
        );

        if (summaryResponse.ok) {
          const summaryPayload: ArbitrageSummaryEnvelope = await summaryResponse.json();
          const normalized: NormalizedArbitrageSummary = {
            totalOpportunities:
              Number(summaryPayload.data?.count ?? transformed.length) || transformed.length,
            uniqueSelections:
                Number(summaryPayload.data?.unique_selections ?? consolidatedList.length) ||
                consolidatedList.length,
            booksInvolved: Number(summaryPayload.data?.books_involved ?? 0) || 0,
            averageMarginPct:
              Number(summaryPayload.data?.avg_margin_pct ?? 0) ||
              (transformed.length
                ? transformed.reduce((acc, opp) => acc + opp.profit_margin, 0) /
                  transformed.length
                : 0),
            maxMarginPct:
                Number(summaryPayload.data?.max_margin_pct ?? 0) ||
                (sortedConsolidated.length
                  ? Math.max(
                      ...sortedConsolidated.map(group => group.bestOpportunity.profit_margin)
                    )
                  : 0),
          };
          setSummary(normalized);
        } else {
          setSummary({
            totalOpportunities: transformed.length,
            uniqueSelections: sortedConsolidated.length,
            booksInvolved: new Set(transformed.flatMap(opp => [
              opp.bookmaker_a.name,
              opp.bookmaker_b.name,
            ])).size,
            averageMarginPct:
              transformed.length
                ? transformed.reduce((acc, opp) => acc + opp.profit_margin, 0) /
                  transformed.length
                : 0,
            maxMarginPct:
              sortedConsolidated.length
                ? Math.max(
                    ...sortedConsolidated.map(group => group.bestOpportunity.profit_margin)
                  )
                : 0,
          });
        }
      } catch (summaryError) {
        enhancedLogger.warn(
          'ArbitrageOpportunities',
          'loadArbitrageData',
          'Failed to load summary data',
          undefined,
          summaryError as Error
        );
        setSummary({
          totalOpportunities: transformed.length,
          uniqueSelections: sortedConsolidated.length,
          booksInvolved: new Set(transformed.flatMap(opp => [
            opp.bookmaker_a.name,
            opp.bookmaker_b.name,
          ])).size,
          averageMarginPct:
            transformed.length
              ? transformed.reduce((acc, opp) => acc + opp.profit_margin, 0) /
                transformed.length
              : 0,
          maxMarginPct:
            sortedConsolidated.length
              ? Math.max(
                  ...sortedConsolidated.map(group => group.bestOpportunity.profit_margin)
                )
              : 0,
        });
      } finally {
        timeoutSummary.cleanup();
      }

      const totalProfit = transformed.reduce(
        (sum, opp) => sum + (opp.guaranteed_profit || 0),
        0
      );
      const avgMargin =
        transformed.length > 0
          ? transformed.reduce((sum, opp) => sum + opp.profit_margin, 0) / transformed.length
          : 0;
      const avgConfidence =
        transformed.length > 0
          ? transformed.reduce((sum, opp) => sum + opp.confidence_score, 0) /
            transformed.length
          : 0;

      setHistoricalData(prev => {
        const next: HistoricalArbitrageSnapshot[] = [
          ...prev,
          {
            timestamp: new Date().toISOString(),
            opportunities: transformed.length,
            profit: Number(totalProfit.toFixed(2)),
            avgMargin: Number(avgMargin.toFixed(2)),
            executionRate: Number((avgConfidence / 100).toFixed(3)),
          },
        ];
        return next.slice(-60);
      });

      enhancedLogger.info(
        'ArbitrageOpportunities',
        'loadArbitrageData',
        `Loaded ${transformed.length} opportunities`,
        {
          count: transformed.length,
        }
      );
    } catch (err) {
        enhancedLogger.error(
          'ArbitrageOpportunities',
          'loadArbitrageData',
          'Failed to load arbitrage data',
          undefined,
          err as Error
        );
  setConsolidatedOpportunities([]);
  setSummary(null);
  setHistoricalData([]);
        setError(
          err instanceof Error
            ? err.message
            : 'An unknown error occurred while loading arbitrage data.'
        );
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
    },
    [getOpportunityKey, minProfitMargin, resolveSportParam, warmArbitrageSnapshots]
  );

  useEffect(() => {
    void loadArbitrageData();
  }, [loadArbitrageData]);

  useEffect(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    if (autoRefresh) {
      refreshTimerRef.current = setInterval(() => {
        void loadArbitrageData({ showSpinner: false });
      }, 15_000);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [autoRefresh, loadArbitrageData]);

  useEffect(() => {
    selectedOpportunityRef.current = selectedOpportunity;
  }, [selectedOpportunity]);

  // Handlers
  const handleExecuteArbitrage = (opportunity: ArbitrageOpportunity) => {
    setSelectedOpportunity(opportunity);
    setExecutionSteps([
      {
        id: 1,
        description: `Place ${opportunity.bookmaker_a.selection} bet with ${opportunity.bookmaker_a.name}`,
        status: 'pending',
        bookmaker: opportunity.bookmaker_a.name,
        stake: opportunity.bookmaker_a.stake,
        estimated_time: 8,
      },
      {
        id: 2,
        description: `Place ${opportunity.bookmaker_b.selection} bet with ${opportunity.bookmaker_b.name}`,
        status: 'pending',
        bookmaker: opportunity.bookmaker_b.name,
        stake: opportunity.bookmaker_b.stake,
        estimated_time: 8,
      },
      {
        id: 3,
        description: 'Verify both bets placed successfully',
        status: 'pending',
        estimated_time: 5,
      },
      {
        id: 4,
        description: 'Update portfolio and risk metrics',
        status: 'pending',
        estimated_time: 2,
      },
    ]);
    setExecutionDialogOpen(true);
  };

  const handleConfirmExecution = async () => {
    if (!selectedOpportunity) return;

    setExecutionInProgress(true);

    try {
      // Mock execution process
      for (let i = 0; i < executionSteps.length; i++) {
        setExecutionSteps(prev =>
          prev.map(step => (step.id === i + 1 ? { ...step, status: 'in_progress' } : step))
        );

        // Simulate execution time
        await new Promise(resolve =>
          setTimeout(resolve, (executionSteps[i].estimated_time || 1) * 200)
        );

        setExecutionSteps(prev =>
          prev.map(step =>
            step.id === i + 1
              ? {
                  ...step,
                  status: 'completed',
                  completed_at: new Date().toISOString(),
                }
              : step
          )
        );
      }

      // Update opportunity status
      setConsolidatedOpportunities(prev =>
        prev.map(group => {
          if (
            !group.opportunities.some(
              opportunity =>
                getOpportunityKey(opportunity) === getOpportunityKey(selectedOpportunity)
            )
          ) {
            return group;
          }

          const updatedOpportunities = group.opportunities.map(opportunity =>
            getOpportunityKey(opportunity) === getOpportunityKey(selectedOpportunity)
              ? { ...opportunity, status: 'executed' as const }
              : opportunity
          );

          const sortedUpdated = [...updatedOpportunities].sort(
            (a, b) => b.profit_margin - a.profit_margin
          );

          return {
            ...group,
            opportunities: updatedOpportunities,
            bestOpportunity:
              getOpportunityKey(group.bestOpportunity) ===
              getOpportunityKey(selectedOpportunity)
                ? sortedUpdated[0]
                : group.bestOpportunity,
          };
        })
      );

      setSelectedOpportunity(prev =>
        prev && getOpportunityKey(prev) === getOpportunityKey(selectedOpportunity)
          ? { ...prev, status: 'executed' }
          : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setExecutionInProgress(false);
    }
  };

  const handleRefresh = () => {
    void loadArbitrageData({ showSpinner: false });
  };

  const getTimeUntilExpiry = (opportunity: ArbitrageOpportunity) => {
    const now = new Date();
    const startTime = new Date(opportunity.start_time);
    const timeWindow = opportunity.execution_time_window * 1000; // Convert to ms
    const expiryTime = new Date(startTime.getTime() - timeWindow);
    const timeLeft = expiryTime.getTime() - now.getTime();

    if (timeLeft <= 0) return 'Expired';

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Filter opportunities
  const filteredGroups = useMemo(() => {
    return consolidatedOpportunities.filter(group => {
      const { bestOpportunity } = group;
      if (sportFilter !== 'All' && bestOpportunity.sport !== sportFilter) return false;
      if (bestOpportunity.profit_margin < minProfitMargin) return false;
      if (bestOpportunity.confidence_score < minConfidence) return false;
      if (
        riskFilter !== 'All' &&
        bestOpportunity.risk_assessment.overall_risk !== riskFilter
      ) {
        return false;
      }
      if (bestOpportunity.status !== 'active') return false;
      return true;
    });
  }, [consolidatedOpportunities, minConfidence, minProfitMargin, riskFilter, sportFilter]);

  const latestUpdateLabel = useMemo(() => {
    if (!consolidatedOpportunities.length) return '—';
    const latestTimestamp = consolidatedOpportunities.reduce((latest, group) => {
      const current = new Date(group.lastUpdated).getTime();
      return current > latest ? current : latest;
    }, 0);
    if (!latestTimestamp) return '—';
    return new Date(latestTimestamp).toLocaleTimeString();
  }, [consolidatedOpportunities]);

  // Calculate arbitrage for calculator
  const calculateArbitrage = () => {
    const impliedProbA = 1 / calculatorOddsA;
    const impliedProbB = 1 / calculatorOddsB;
    const totalImpliedProb = impliedProbA + impliedProbB;

    if (totalImpliedProb >= 1) {
      return {
        isArbitrage: false,
        stakeA: 0,
        stakeB: 0,
        profit: 0,
        margin: 0,
      };
    }

    const stakeA = (calculatorTotalStake * impliedProbA) / totalImpliedProb;
    const stakeB = (calculatorTotalStake * impliedProbB) / totalImpliedProb;
    const profit = calculatorTotalStake * (1 - totalImpliedProb);
    const margin = (profit / calculatorTotalStake) * 100;

    return {
      isArbitrage: true,
      stakeA: stakeA,
      stakeB: stakeB,
      profit: profit,
      margin: margin,
    };
  };

  const calculationResult = calculateArbitrage();

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8'>
        <header className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div>
            <h1
              className='text-3xl font-bold flex items-center gap-3'
              data-testid='arbitrage-opportunities-heading'
            >
              <Target className='h-8 w-8 text-cyan-300' />
              <span>Institutional Arbitrage Scanner</span>
            </h1>
            <p className='mt-1 text-sm text-slate-300'>
              Monitor real-time sure-bet opportunities across books with automatic risk grading and
              execution tracking.
            </p>
          </div>
          <div className='flex flex-wrap items-center gap-3'>
            <button
              onClick={() => setCalculatorDialogOpen(true)}
              type='button'
              className='inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-100 shadow transition hover:bg-slate-900/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500'
            >
              <Calculator className='h-4 w-4 text-cyan-300' />
              Calculator
            </button>

            <button
              type='button'
              data-testid={`arbitrage-opportunity-btn-${selectedOpportunity?.id ?? 'none'}`}
              className='inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-200 shadow transition hover:bg-emerald-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-50'
              onClick={() => selectedOpportunity && handleExecuteArbitrage(selectedOpportunity)}
              disabled={!selectedOpportunity || selectedOpportunity.status !== 'active'}
            >
              <Play className='h-4 w-4' />
              Execute Selected
            </button>

            <button
              type='button'
              onClick={handleRefresh}
              className='inline-flex items-center gap-2 rounded-lg border border-sky-500/40 bg-sky-500/15 px-4 py-2 text-sm font-semibold text-sky-200 shadow transition hover:bg-sky-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-50'
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <div className='flex items-center rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-300 shadow'>
              <span className='mr-2 text-slate-400'>Auto</span>
              <button
                onClick={() => setAutoRefresh(prev => !prev)}
                className={`rounded-full px-3 py-1 transition ${
                  autoRefresh
                    ? 'bg-emerald-500/20 text-emerald-200'
                    : 'bg-slate-800/80 text-slate-300'
                }`}
              >
                {autoRefresh ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className='rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100 shadow-lg shadow-rose-900/30'>
            <div className='flex items-center justify-between gap-3'>
              <div className='flex items-center gap-2'>
                <AlertTriangle className='h-4 w-4 text-rose-200' />
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className='rounded-full bg-rose-500/20 px-2 py-1 text-xs uppercase tracking-wide text-rose-100 hover:bg-rose-500/30'
              >
                dismiss
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className='rounded-2xl border border-sky-500/30 bg-sky-500/10 p-6 shadow-lg shadow-sky-900/30'>
            <div className='flex items-center gap-3 text-sky-100'>
              <RefreshCw className='h-5 w-5 animate-spin' />
              <span>Scanning books for guaranteed-profit pairs…</span>
            </div>
          </div>
        )}

        {summary && (
          <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            <article className='rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/30 backdrop-blur'>
              <div className='flex items-center justify-between text-sm text-slate-300'>
                <span>Total Opportunities</span>
                <Target className='h-5 w-5 text-cyan-300' />
              </div>
              <p className='mt-3 text-3xl font-semibold text-white'>
                {summary.totalOpportunities.toLocaleString()}
              </p>
              <p className='mt-1 text-xs text-slate-500'>Active pairs meeting current filters</p>
            </article>

            <article className='rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/30 backdrop-blur'>
              <div className='flex items-center justify-between text-sm text-slate-300'>
                <span>Books Involved</span>
                <ShieldCheck className='h-5 w-5 text-emerald-300' />
              </div>
              <p className='mt-3 text-3xl font-semibold text-emerald-300'>
                {summary.booksInvolved}
              </p>
              <p className='mt-1 text-xs text-slate-500'>Unique sportsbooks supporting edge</p>
            </article>

            <article className='rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/30 backdrop-blur'>
              <div className='flex items-center justify-between text-sm text-slate-300'>
                <span>Average Margin</span>
                <TrendingUp className='h-5 w-5 text-amber-300' />
              </div>
              <p className='mt-3 text-3xl font-semibold text-amber-200'>
                {summary.averageMarginPct.toFixed(2)}%
              </p>
              <p className='mt-1 text-xs text-slate-500'>Per-opportunity blended margin</p>
            </article>

            <article className='rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/30 backdrop-blur'>
              <div className='flex items-center justify-between text-sm text-slate-300'>
                <span>Max Margin</span>
                <Activity className='h-5 w-5 text-rose-300' />
              </div>
              <p className='mt-3 text-3xl font-semibold text-rose-200'>
                {summary.maxMarginPct.toFixed(2)}%
              </p>
              <p className='mt-1 text-xs text-slate-500'>Highest single sure-bet margin surfaced</p>
            </article>
          </section>
        )}

        <section className='rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-2xl shadow-black/40 backdrop-blur'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <div>
              <h2 className='text-lg font-semibold text-white'>Filters &amp; guardrails</h2>
              <p className='text-xs text-slate-400'>Tune discovery thresholds without losing live refresh.</p>
            </div>
            <div className='flex items-center gap-2 text-xs text-slate-400'>
              <Clock className='h-4 w-4 text-slate-500' />
              Updated {latestUpdateLabel}
            </div>
          </div>

          <div className='mt-4 grid gap-4 md:grid-cols-4'>
            <label className='text-xs'>
              <span className='mb-2 block text-slate-400'>Sport</span>
              <select
                value={sportFilter}
                onChange={event => setSportFilter(event.target.value)}
                className='w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500'
              >
                {['All', 'MLB', 'NBA', 'NFL', 'NHL'].map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className='text-xs'>
              <span className='mb-2 block text-slate-400'>Risk profile</span>
              <select
                value={riskFilter}
                onChange={event => setRiskFilter(event.target.value)}
                className='w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500'
              >
                {['All', 'low', 'medium', 'high'].map(option => (
                  <option key={option} value={option}>
                    {option === 'All' ? 'All risk levels' : option}
                  </option>
                ))}
              </select>
            </label>

            <label className='text-xs'>
              <span className='mb-2 block text-slate-400'>Min margin ({minProfitMargin.toFixed(1)}%)</span>
              <input
                type='range'
                min={0}
                max={10}
                step={0.1}
                value={minProfitMargin}
                onChange={event => setMinProfitMargin(Number(event.target.value))}
                className='w-full accent-cyan-500'
              />
            </label>

            <label className='text-xs'>
              <span className='mb-2 block text-slate-400'>Min confidence ({minConfidence}%)</span>
              <input
                type='range'
                min={40}
                max={100}
                step={5}
                value={minConfidence}
                onChange={event => setMinConfidence(Number(event.target.value))}
                className='w-full accent-emerald-500'
              />
            </label>
          </div>
        </section>

        <section className='rounded-2xl border border-slate-800 bg-slate-950/60 p-6 shadow-2xl shadow-black/40 backdrop-blur'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <div>
              <h2 className='text-lg font-semibold text-white'>Live arbitrage board</h2>
              <p className='text-xs text-slate-400'>Sorted by margin, double-click to mark for execution.</p>
            </div>
            <span className='text-xs text-slate-500'>
              {filteredGroups.length.toLocaleString()} opportunities after filters
            </span>
          </div>

          <div className='mt-4 overflow-x-auto rounded-xl border border-slate-800'>
            <table className='min-w-full divide-y divide-slate-800 text-sm'>
              <thead className='bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400'>
                <tr>
                  <th className='px-4 py-3 text-left font-semibold'>Event</th>
                  <th className='px-4 py-3 text-left font-semibold'>Books &amp; Legs</th>
                  <th className='px-4 py-3 text-left font-semibold'>Economics</th>
                  <th className='px-4 py-3 text-left font-semibold'>Risk</th>
                  <th className='px-4 py-3 text-left font-semibold'>Window</th>
                  <th className='px-4 py-3 text-left font-semibold'>Action</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-800 bg-slate-950/40 text-slate-200'>
                {filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan={6} className='px-4 py-10 text-center text-sm text-slate-400'>
                      No arbitrage pairs meet the current risk guardrails.
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map(group => {
                    const activeOpportunity =
                      selectedOpportunity &&
                      group.opportunities.some(
                        opportunity =>
                          getOpportunityKey(opportunity) === getOpportunityKey(selectedOpportunity)
                      )
                        ? selectedOpportunity
                        : group.bestOpportunity;

                    const riskKey = activeOpportunity.risk_assessment.overall_risk;
                    const riskStyle = riskBadgeClasses[riskKey] || {
                      bg: 'bg-slate-800',
                      text: 'text-slate-200',
                    };

                    const timeUntilExpiry = getTimeUntilExpiry(activeOpportunity);
                    const isGroupSelected =
                      selectedOpportunity &&
                      group.opportunities.some(
                        opportunity =>
                          getOpportunityKey(opportunity) === getOpportunityKey(selectedOpportunity)
                      );

                    return (
                      <tr
                        key={group.key}
                        className={`transition-colors hover:bg-slate-900/50 ${
                          isGroupSelected ? 'bg-slate-900/60' : ''
                        }`}
                        onDoubleClick={() => setSelectedOpportunity(activeOpportunity)}
                      >
                        <td className='px-4 py-4 align-top'>
                          <div className='font-semibold text-white'>{group.event}</div>
                          <div className='text-xs text-slate-400'>
                            {group.sport} ·{' '}
                            {new Date(activeOpportunity.start_time).toLocaleString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className='px-4 py-4 align-top'>
                          <div className='mb-2 rounded-lg border border-slate-800/80 bg-slate-900/80 p-3 text-xs'>
                            <div className='flex items-center justify-between text-slate-300'>
                              <span className='font-medium text-emerald-200'>
                                {activeOpportunity.bookmaker_a.name}
                              </span>
                              <span>{activeOpportunity.bookmaker_a.odds.toFixed(2)}</span>
                            </div>
                            <div className='mt-1 text-slate-400'>
                              {activeOpportunity.bookmaker_a.selection}
                            </div>
                            <div className='mt-1 text-slate-500'>
                              Stake {formatCurrency(activeOpportunity.bookmaker_a.stake)}
                            </div>
                          </div>
                          <div className='rounded-lg border border-slate-800/80 bg-slate-900/80 p-3 text-xs'>
                            <div className='flex items-center justify-between text-slate-300'>
                              <span className='font-medium text-sky-200'>
                                {activeOpportunity.bookmaker_b.name}
                              </span>
                              <span>{activeOpportunity.bookmaker_b.odds.toFixed(2)}</span>
                            </div>
                            <div className='mt-1 text-slate-400'>
                              {activeOpportunity.bookmaker_b.selection}
                            </div>
                            <div className='mt-1 text-slate-500'>
                              Stake {formatCurrency(activeOpportunity.bookmaker_b.stake)}
                            </div>
                          </div>
                          {group.opportunities.length > 1 && (
                            <div className='mt-3 rounded-lg border border-slate-800/60 bg-slate-900/60 p-3 text-xs text-slate-400'>
                              <div className='flex items-center justify-between text-slate-500'>
                                <span>Other book pairings</span>
                                <span>{group.opportunities.length - 1} alt</span>
                              </div>
                              <div className='mt-2 flex flex-wrap gap-2'>
                                {group.opportunities.map(candidate => {
                                  const candidateKey = getOpportunityKey(candidate);
                                  const isSelectedCandidate =
                                    getOpportunityKey(activeOpportunity) === candidateKey;

                                  return (
                                    <button
                                      key={`${candidateKey}-chip`}
                                      onClick={() => setSelectedOpportunity(candidate)}
                                      className={`rounded-full border px-3 py-1 text-[11px] transition ${
                                        isSelectedCandidate
                                          ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-100'
                                          : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-cyan-400/30 hover:text-cyan-100'
                                      }`}
                                    >
                                      {candidate.bookmaker_a.name} / {candidate.bookmaker_b.name}{' '}
                                      · {candidate.profit_margin.toFixed(2)}%
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className='px-4 py-4 align-top text-sm'>
                          <div className='font-semibold text-emerald-300'>
                            +{formatCurrency(activeOpportunity.guaranteed_profit)}
                          </div>
                          <div className='mt-1 text-xs text-slate-400'>
                            Total stake {formatCurrency(activeOpportunity.total_stake)}
                          </div>
                          <div className='mt-2 flex items-center gap-2 text-xs text-slate-400'>
                            <span
                              className='inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-1 font-semibold text-emerald-200'
                            >
                              {activeOpportunity.profit_margin.toFixed(2)}%
                            </span>
                            <span className='flex items-center gap-2'>
                              <span className='block h-2 w-16 rounded-full bg-slate-800'>
                                <span
                                  className='block h-2 rounded-full bg-cyan-400'
                                  style={{
                                    width: `${Math.min(activeOpportunity.confidence_score, 100)}%`,
                                  }}
                                />
                              </span>
                              {activeOpportunity.confidence_score}%
                            </span>
                          </div>
                          {group.opportunities.length > 1 && (
                            <div className='mt-2 text-[11px] text-slate-500'>
                              Combined profit {formatCurrency(group.combinedProfit)} · Avg margin{' '}
                              {group.averageMargin.toFixed(2)}%
                            </div>
                          )}
                        </td>
                        <td className='px-4 py-4 align-top text-xs'>
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold capitalize ${riskStyle.bg} ${riskStyle.text}`}
                          >
                            <ShieldCheck className='h-3 w-3' /> {riskKey}
                          </span>
                          <div className='mt-2 space-y-1 text-slate-400'>
                            <div>Liquidity: {activeOpportunity.risk_assessment.liquidity_risk}</div>
                            <div>Timing: {activeOpportunity.risk_assessment.timing_risk}</div>
                            <div>
                              Movement: {activeOpportunity.risk_assessment.odds_movement_risk}
                            </div>
                          </div>
                        </td>
                        <td className='px-4 py-4 align-top text-sm'>
                          <div className={`${timeUntilExpiry === 'Expired' ? 'text-rose-300' : 'text-slate-200'}`}>
                            <Clock className='mr-2 inline h-4 w-4 text-slate-500' />
                            {timeUntilExpiry}
                          </div>
                          <div className='mt-1 text-xs text-slate-500'>
                            Window {activeOpportunity.execution_time_window}s
                          </div>
                        </td>
                        <td className='px-4 py-4 align-top'>
                          <button
                            data-testid={`arbitrage-opportunity-btn-${group.bestOpportunity.id}`}
                            onClick={() => handleExecuteArbitrage(activeOpportunity)}
                            disabled={
                              activeOpportunity.status !== 'active' ||
                              timeUntilExpiry === 'Expired'
                            }
                            className='inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50'
                          >
                            <Play className='h-3 w-3' />
                            Execute
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className='rounded-2xl border border-slate-800 bg-slate-950/60 p-6 shadow-2xl shadow-black/40 backdrop-blur'>
          <h2 className='text-lg font-semibold text-white'>Performance telemetry</h2>
          <div className='mt-4 grid gap-6 lg:grid-cols-2'>
            <div className='rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/30 backdrop-blur'>
              <h3 className='mb-3 text-sm font-semibold text-slate-300'>Opportunity cadence</h3>
              <ResponsiveContainer width='100%' height={280}>
                <BarChart data={historicalData}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#1f2937' />
                  <XAxis dataKey='timestamp' tickFormatter={value => new Date(value).toLocaleTimeString()} stroke='#94a3b8' fontSize={12} tickLine={false} axisLine={{ stroke: '#1f2937' }} />
                  <YAxis stroke='#94a3b8' fontSize={12} tickLine={false} axisLine={{ stroke: '#1f2937' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #1f2937',
                      borderRadius: 12,
                      color: '#e2e8f0',
                    }}
                    labelFormatter={value => new Date(value).toLocaleTimeString()}
                  />
                  <Legend wrapperStyle={{ color: '#94a3b8' }} />
                  <Bar dataKey='opportunities' fill='#22d3ee' name='Opportunities' radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className='rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/30 backdrop-blur'>
              <h3 className='mb-3 text-sm font-semibold text-slate-300'>Profitability vs execution</h3>
              <ResponsiveContainer width='100%' height={280}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#1f2937' />
                  <XAxis dataKey='timestamp' tickFormatter={value => new Date(value).toLocaleTimeString()} stroke='#94a3b8' fontSize={12} tickLine={false} axisLine={{ stroke: '#1f2937' }} />
                  <YAxis yAxisId='left' stroke='#22d3ee' fontSize={12} tickLine={false} axisLine={{ stroke: '#1f2937' }} />
                  <YAxis yAxisId='right' orientation='right' stroke='#c084fc' fontSize={12} tickLine={false} axisLine={{ stroke: '#1f2937' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #1f2937',
                      borderRadius: 12,
                      color: '#e2e8f0',
                    }}
                    labelFormatter={value => new Date(value).toLocaleTimeString()}
                  />
                  <Legend wrapperStyle={{ color: '#94a3b8' }} />
                  <Line
                    yAxisId='left'
                    type='monotone'
                    dataKey='profit'
                    stroke='#22d3ee'
                    name='Profit ($)'
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId='right'
                    type='monotone'
                    dataKey='avgMargin'
                    stroke='#c084fc'
                    name='Avg margin %'
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {executionDialogOpen && selectedOpportunity && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-10'>
            <div className='w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl shadow-black/60 backdrop-blur'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <h2 className='text-xl font-semibold text-white'>
                    Execute arbitrage · {selectedOpportunity.event}
                  </h2>
                  <p className='text-xs text-slate-400'>Guide each leg sequentially and mark completion in platform.</p>
                </div>
                <button
                  onClick={() => setExecutionDialogOpen(false)}
                  className='rounded-full bg-slate-800/70 px-2 py-1 text-xs text-slate-400 hover:bg-slate-800'
                >
                  Close
                </button>
              </div>

              <div className='mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200'>
                <div className='flex flex-wrap items-center gap-4'>
                  <span>
                    <span className='text-slate-400'>Guaranteed Profit:</span>{' '}
                    <span className='font-semibold text-emerald-300'>
                      {formatCurrency(selectedOpportunity.guaranteed_profit)}
                    </span>
                  </span>
                  <span>
                    <span className='text-slate-400'>Margin:</span>{' '}
                    <span className='font-semibold text-emerald-200'>
                      {selectedOpportunity.profit_margin.toFixed(2)}%
                    </span>
                  </span>
                  <span>
                    <span className='text-slate-400'>Window:</span>{' '}
                    <span className='font-semibold text-slate-200'>
                      {selectedOpportunity.execution_time_window}s
                    </span>
                  </span>
                </div>
              </div>

              <h3 className='mt-6 text-sm font-semibold text-slate-200'>Manual execution playbook</h3>
              <div className='mt-3 space-y-3'>
                {executionSteps.map((step, index) => {
                  const statusClasses = {
                    completed: 'bg-emerald-500/15 text-emerald-200',
                    failed: 'bg-rose-500/15 text-rose-200',
                    in_progress: 'bg-sky-500/15 text-sky-200',
                    pending: 'bg-slate-800/70 text-slate-300',
                  };
                  const iconMap = {
                    completed: <CheckCircle className='h-4 w-4' />,
                    failed: <AlertTriangle className='h-4 w-4' />,
                    in_progress: <RefreshCw className='h-4 w-4 animate-spin' />,
                    pending: <span className='text-xs'>{index + 1}</span>,
                  } as const;

                  return (
                    <div key={step.id} className='flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4'>
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${statusClasses[step.status]}`}> 
                        {iconMap[step.status]}
                      </div>
                      <div className='flex-1 text-sm text-slate-200'>
                        <div className='font-medium'>{step.description}</div>
                        {step.bookmaker && (
                          <div className='text-xs text-slate-400'>
                            {step.bookmaker} · {formatCurrency(step.stake ?? 0)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className='mt-6 flex justify-end gap-3'>
                <button
                  onClick={() => setExecutionDialogOpen(false)}
                  disabled={executionInProgress}
                  className='rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-300 hover:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 disabled:cursor-not-allowed disabled:opacity-60'
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmExecution}
                  disabled={executionInProgress}
                  className='rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-60'
                >
                  {executionInProgress ? 'Executing…' : 'Confirm Execution'}
                </button>
              </div>
            </div>
          </div>
        )}

        {calculatorDialogOpen && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-10'>
            <div className='w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl shadow-black/60 backdrop-blur'>
              <div className='flex items-start justify-between gap-3'>
                <div className='flex items-center gap-2'>
                  <Calculator className='h-5 w-5 text-cyan-300' />
                  <h2 className='text-xl font-semibold text-white'>Arbitrage calculator</h2>
                </div>
                <button
                  onClick={() => setCalculatorDialogOpen(false)}
                  className='rounded-full bg-slate-800/70 px-2 py-1 text-xs text-slate-400 hover:bg-slate-800'
                >
                  Close
                </button>
              </div>

              <div className='mt-4 space-y-4 text-sm text-slate-200'>
                <label className='block'>
                  <span className='mb-1 block text-xs uppercase tracking-wide text-slate-400'>Odds A</span>
                  <input
                    type='number'
                    min='1.01'
                    step='0.01'
                    value={calculatorOddsA}
                    onChange={event => setCalculatorOddsA(Number(event.target.value))}
                    className='w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500'
                  />
                </label>

                <label className='block'>
                  <span className='mb-1 block text-xs uppercase tracking-wide text-slate-400'>Odds B</span>
                  <input
                    type='number'
                    min='1.01'
                    step='0.01'
                    value={calculatorOddsB}
                    onChange={event => setCalculatorOddsB(Number(event.target.value))}
                    className='w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500'
                  />
                </label>

                <label className='block'>
                  <span className='mb-1 block text-xs uppercase tracking-wide text-slate-400'>Total Stake ($)</span>
                  <input
                    type='number'
                    min='1'
                    step='1'
                    value={calculatorTotalStake}
                    onChange={event => setCalculatorTotalStake(Number(event.target.value))}
                    className='w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500'
                  />
                </label>

                {calculationResult.isArbitrage ? (
                  <div className='rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-4 text-sm text-emerald-100'>
                    <div className='flex items-center gap-2 text-base font-semibold'>
                      <CheckCircle className='h-5 w-5' />
                      Arbitrage confirmed
                    </div>
                    <div className='mt-3 space-y-2'>
                      <div>Stake A: {formatCurrency(calculationResult.stakeA)}</div>
                      <div>Stake B: {formatCurrency(calculationResult.stakeB)}</div>
                      <div>Guaranteed Profit: {formatCurrency(calculationResult.profit)}</div>
                      <div>Margin: {calculationResult.margin.toFixed(2)}%</div>
                    </div>
                  </div>
                ) : (
                  <div className='rounded-2xl border border-rose-500/40 bg-rose-500/15 p-4 text-sm text-rose-100'>
                    <div className='flex items-center gap-2 text-base font-semibold'>
                      <AlertTriangle className='h-5 w-5' />
                      No risk-free spread
                    </div>
                    <p className='mt-3 text-xs text-rose-200'>
                      Combined implied probability is{' '}
                      {((1 / calculatorOddsA + 1 / calculatorOddsB) * 100).toFixed(2)}% - target &lt;
                      100%.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArbitrageOpportunities;
