import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdvancedPerformanceCharts, {
  ChartDataPoint,
  PerformanceMetric,
} from '../components/charts/AdvancedPerformanceCharts';
import MultiBookOddsChart, { BookmakerOddsPoint } from '../components/charts/MultiBookOddsChart';
import PerformanceLineComparison, {
  PerformanceSeriesPoint as ComparisonSeriesPoint,
  TimeframeValue as ComparisonTimeframeValue,
} from '../components/charts/PerformanceLineComparison';
// EV integrations
import EVBadge from '../components/ev/EVBadge';
import EVSummaryWidget from '../components/ev/EVSummaryWidget';
import ValuePanel from '../components/odds/ValuePanel';
import { useEVOpportunities } from '../hooks/useEVOpportunities';
import {
  PropOpportunity as CompatOpportunity,
  usePropFinderData,
} from '../hooks/usePropFinderData';

// Use the compatibility hook to preserve existing integrations. We still fetch the raw
// opportunities here to map richer fields (player, recentForm, lastUpdated) into the
// ChartDataPoint shape expected by the charts.
type RawOpportunity = {
  id: string;
  player?: string;
  recentForm?: number[]; // e.g. [85.2, 78.9, 92.1]
  lastUpdated?: string;
  line?: number;
  odds?: number;
  opponent?: string;
};

type OpponentSummary = {
  opponent: string;
  games: number;
  avgActual: number;
  avgLine: number;
  avgEdge: number;
  hitRate: number;
  avgOdds: number;
  lastUpdated?: string;
};

const PredictionsDashboard: React.FC = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'5' | '10' | '20' | 'all'>('10');
  const [headToHeadOnly, setHeadToHeadOnly] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<string>('all');
  // EV feature flag & state (Phase 2)
  const FRONTEND_ENABLE_EV = true; // Guard all EV-related UI/logic
  const [showEV, setShowEV] = useState(false);
  const [bankroll, setBankroll] = useState<number>(0);
  const [evSortDesc, setEvSortDesc] = useState(true);

  const { opportunities: compatOpportunities = [], loading: compatLoading } = usePropFinderData({
    autoRefresh: true,
  });

  const opportunities = useMemo<RawOpportunity[]>(() => {
    return compatOpportunities.map((opp: CompatOpportunity) => ({
      id: opp.id,
      player: opp.player ?? 'Unknown Player',
      recentForm: Array.isArray(opp.recentForm) ? [...opp.recentForm] : undefined,
      lastUpdated: opp.lastUpdated,
      line: typeof opp.line === 'number' ? opp.line : undefined,
      odds: typeof opp.odds === 'number' ? opp.odds : undefined,
      opponent: opp.opponent,
    }));
  }, [compatOpportunities]);

  const isLoading = compatLoading;

  useEffect(() => {
    if (!selectedPlayer && opportunities.length > 0) {
      setSelectedPlayer(opportunities[0].player ?? null);
      return;
    }

    if (
      selectedPlayer &&
      opportunities.length > 0 &&
      opportunities.every(op => op.player !== selectedPlayer)
    ) {
      setSelectedPlayer(opportunities[0].player ?? null);
    }
  }, [opportunities, selectedPlayer]);

  // Derive player list
  const playerList = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const op of opportunities) {
      const p = op.player ?? 'unknown';
      if (!seen.has(p)) {
        seen.add(p);
        list.push(p);
      }
    }
    return list;
  }, [opportunities]);

  const playerOpportunities = useMemo(() => {
    if (!selectedPlayer) return opportunities;
    return opportunities.filter(op => op.player === selectedPlayer);
  }, [opportunities, selectedPlayer]);

  const opponentOptions = useMemo(() => {
    if (!selectedPlayer) return [] as string[];
    const options = new Set<string>();
    playerOpportunities.forEach(op => {
      if (op.opponent) options.add(op.opponent);
    });
    return Array.from(options).sort((a, b) => a.localeCompare(b));
  }, [playerOpportunities, selectedPlayer]);

  useEffect(() => {
    if (!selectedPlayer) {
      if (selectedOpponent !== 'all') setSelectedOpponent('all');
      return;
    }

    if (opponentOptions.length === 0 && selectedOpponent !== 'all') {
      setSelectedOpponent('all');
      return;
    }

    if (selectedOpponent !== 'all' && !opponentOptions.includes(selectedOpponent)) {
      setSelectedOpponent(
        headToHeadOnly && opponentOptions.length > 0 ? opponentOptions[0] : 'all'
      );
    }
  }, [selectedPlayer, opponentOptions, selectedOpponent, headToHeadOnly]);

  useEffect(() => {
    if (headToHeadOnly && selectedOpponent === 'all' && opponentOptions.length > 0) {
      setSelectedOpponent(opponentOptions[0]);
    }
  }, [headToHeadOnly, opponentOptions, selectedOpponent]);

  const filteredOpportunities = useMemo(() => {
    if (selectedOpponent === 'all') return playerOpportunities;
    return playerOpportunities.filter(op => op.opponent === selectedOpponent);
  }, [playerOpportunities, selectedOpponent]);

  const displayOpportunities =
    filteredOpportunities.length > 0 ? filteredOpportunities : playerOpportunities;

  const targetOpportunity = useMemo(() => {
    if (displayOpportunities.length > 0) return displayOpportunities[0];
    return opportunities.length > 0 ? opportunities[0] : undefined;
  }, [displayOpportunities, opportunities]);

  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!targetOpportunity) return [];

    const op = targetOpportunity;

    const recent = Array.isArray(op.recentForm) ? op.recentForm.slice() : [];
    // If there is no recentForm, create a synthetic series using lastUpdated and line as fallback
    const games =
      timeframe === '5'
        ? 5
        : timeframe === '10'
        ? 10
        : timeframe === '20'
        ? 20
        : recent.length || 10;

    const points: ChartDataPoint[] = [];
    const now = Date.now();
    // align most recent form to the end
    const recentSlice = recent.length
      ? recent.slice(-games)
      : Array.from({ length: games }, () => NaN);

    for (let i = 0; i < recentSlice.length; i++) {
      const idx = recentSlice.length - 1 - i; // make last element most recent
      const date = new Date(now - (recentSlice.length - 1 - idx) * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const actual = Number.isFinite(recentSlice[idx] as number)
        ? (recentSlice[idx] as number)
        : NaN;
      points.push({
        date: dateStr,
        timestamp: Date.parse(dateStr),
        metrics: {
          actual: Number.isFinite(actual) ? actual : 0,
          line: typeof op.line === 'number' ? op.line : 0,
          odds: typeof op.odds === 'number' ? op.odds : 0,
        },
        metadata: { opponent: op.opponent },
      });
    }

    // If we have fewer than requested, pad older entries
    if (points.length < games) {
      const missing = games - points.length;
      for (let i = 0; i < missing; i++) {
        const date = new Date(now - (points.length + i) * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        points.unshift({
          date: dateStr,
          timestamp: Date.parse(dateStr),
          metrics: {
            actual: 0,
            line: typeof op.line === 'number' ? op.line : 0,
            odds: typeof op.odds === 'number' ? op.odds : 0,
          },
          metadata: { opponent: op.opponent },
        });
      }
    }

    return points;
  }, [targetOpportunity, timeframe]);

  const playerSummary = useMemo(() => {
    if (!selectedPlayer || chartData.length === 0) {
      return {
        games: chartData.length,
        hitRate: 0,
        avgEdge: 0,
        averageOdds: 0,
        currentLine:
          typeof targetOpportunity?.line === 'number' ? targetOpportunity.line : undefined,
        lastUpdated: targetOpportunity?.lastUpdated,
        momentum: 0,
      };
    }

    const actuals = chartData.map(d => Number(d.metrics.actual ?? 0));
    const lines = chartData.map(d => Number(d.metrics.line ?? 0));
    const odds = chartData.map(d => Number(d.metrics.odds ?? 0));
    const edges = actuals.map((val, idx) => val - (lines[idx] ?? 0));

    const games = actuals.length;
    const hits = actuals.filter((val, idx) => val >= (lines[idx] ?? 0)).length;
    const hitRate = games ? (hits / games) * 100 : 0;
    const avgEdge = edges.length ? edges.reduce((sum, val) => sum + val, 0) / edges.length : 0;
    const averageOdds = odds.length ? odds.reduce((sum, val) => sum + val, 0) / odds.length : 0;
    const momentum = edges.length >= 2 ? edges[edges.length - 1] - edges[0] : 0;

    return {
      games,
      hitRate,
      avgEdge,
      averageOdds,
      currentLine: typeof targetOpportunity?.line === 'number' ? targetOpportunity.line : undefined,
      lastUpdated: targetOpportunity?.lastUpdated,
      momentum,
    };
  }, [chartData, selectedPlayer, targetOpportunity]);

  const comparisonSeries = useMemo<ComparisonSeriesPoint[]>(
    () =>
      chartData.map(point => ({
        date: point.date,
        actual: Number(point.metrics.actual ?? 0),
        line: Number(point.metrics.line ?? 0),
        projection: null,
        opponent: (point.metadata as { opponent?: string } | undefined)?.opponent ?? null,
      })),
    [chartData]
  );

  const comparisonTimeframeValue: ComparisonTimeframeValue = useMemo(() => {
    if (timeframe === 'all') return 'all';
    const numeric = Number(timeframe);
    return Number.isFinite(numeric) ? (numeric as ComparisonTimeframeValue) : 'all';
  }, [timeframe]);

  const comparisonTimeframeOptions = useMemo(
    () => [
      { label: 'Last 5', value: 5 as ComparisonTimeframeValue },
      { label: 'Last 10', value: 10 as ComparisonTimeframeValue },
      { label: 'Last 20', value: 20 as ComparisonTimeframeValue },
      { label: 'All', value: 'all' as ComparisonTimeframeValue },
    ],
    []
  );

  const handleComparisonTimeframeChange = useCallback(
    (value: ComparisonTimeframeValue) => {
      if (value === 'all') {
        setTimeframe('all');
        return;
      }

      if (typeof value === 'number') {
        if (value <= 5) {
          setTimeframe('5');
        } else if (value <= 10) {
          setTimeframe('10');
        } else {
          setTimeframe('20');
        }
      }
    },
    [setTimeframe]
  );

  const multiBookOddsSeries = useMemo<BookmakerOddsPoint[]>(() => {
    if (!compatOpportunities || compatOpportunities.length === 0) return [];

    const rows: BookmakerOddsPoint[] = [];
    compatOpportunities
      .filter(opp => (selectedPlayer ? opp.player === selectedPlayer : true))
      .slice(0, 24)
      .forEach(opp => {
        const timestamp = opp.lastUpdated ?? new Date().toISOString();
        if (Array.isArray(opp.bookmakers) && opp.bookmakers.length > 0) {
          opp.bookmakers.forEach(book => {
            if (typeof book.odds === 'number' && Number.isFinite(book.odds)) {
              rows.push({
                timestamp,
                bookmaker: book.name || 'Unknown',
                odds: Number(book.odds),
              });
            }
          });
        } else if (typeof opp.odds === 'number' && Number.isFinite(opp.odds)) {
          rows.push({
            timestamp,
            bookmaker: opp.bestBookmaker || 'Market',
            odds: Number(opp.odds),
          });
        }
      });

    return rows.slice(-180);
  }, [compatOpportunities, selectedPlayer]);

  const opponentSummaries = useMemo(() => {
    if (!selectedPlayer) return [] as OpponentSummary[];

    const summaries: OpponentSummary[] = [];
    const groups = new Map<string, RawOpportunity[]>();

    playerOpportunities.forEach(op => {
      const key = op.opponent ?? 'Unknown';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(op);
    });

    const average = (values: number[]): number =>
      values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;

    groups.forEach((ops, opponent) => {
      const recentValues: number[] = [];
      const lines: number[] = [];
      const odds: number[] = [];

      ops.forEach(op => {
        if (Array.isArray(op.recentForm)) {
          op.recentForm.forEach(val => {
            if (typeof val === 'number' && Number.isFinite(val)) {
              recentValues.push(val);
            }
          });
        }
        if (typeof op.line === 'number' && Number.isFinite(op.line)) {
          lines.push(op.line);
        }
        if (typeof op.odds === 'number' && Number.isFinite(op.odds)) {
          odds.push(op.odds);
        }
      });

      const games = recentValues.length;
      if (games === 0) return;

      const avgActual = average(recentValues);
      const avgLine = lines.length ? average(lines) : 0;
      const avgEdge = avgActual - avgLine;
      const hitRate = games
        ? (recentValues.filter((val, idx) => val >= (lines[idx] ?? avgLine)).length / games) * 100
        : 0;
      const avgOdds = odds.length ? average(odds) : 0;
      const lastUpdated = ops.find(op => op.lastUpdated)?.lastUpdated;

      summaries.push({
        opponent,
        games,
        avgActual,
        avgLine,
        avgEdge,
        hitRate,
        avgOdds,
        lastUpdated,
      });
    });

    return summaries.sort((a, b) => {
      if (b.games !== a.games) return b.games - a.games;
      return b.avgEdge - a.avgEdge;
    });
  }, [playerOpportunities, selectedPlayer]);

  const headToHeadSummary = useMemo(() => {
    if (selectedOpponent === 'all') return undefined;
    return opponentSummaries.find(summary => summary.opponent === selectedOpponent);
  }, [opponentSummaries, selectedOpponent]);

  const metrics: PerformanceMetric[] = useMemo(() => {
    if (chartData.length === 0) {
      return [
        {
          id: 'edge',
          name: 'Edge vs Line',
          value: 0,
          change: 0,
          changePercent: 0,
          color: '#94a3b8',
          unit: 'pts',
          format: 'number',
          benchmark: 0,
        },
        {
          id: 'hit_rate',
          name: 'Hit Rate',
          value: 0,
          change: 0,
          changePercent: 0,
          color: '#94a3b8',
          unit: '',
          format: 'percentage',
          benchmark: 55,
          target: 60,
        },
        {
          id: 'recent_form',
          name: 'Recent Form Avg',
          value: 0,
          change: 0,
          changePercent: 0,
          color: '#94a3b8',
          unit: 'pts',
          format: 'number',
        },
        {
          id: 'average_odds',
          name: 'Average Odds',
          value: 0,
          change: 0,
          changePercent: 0,
          color: '#94a3b8',
          unit: '',
          format: 'number',
        },
      ];
    }

    const nums = (values: Array<number | undefined>): number[] =>
      values.map(v => (typeof v === 'number' && Number.isFinite(v) ? v : 0));
    const safeAverage = (values: number[]): number =>
      values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    const changePercent = (current: number, previous: number): number => {
      if (!Number.isFinite(previous) || Math.abs(previous) < 1e-6) return 0;
      return ((current - previous) / Math.abs(previous)) * 100;
    };

    const actuals = nums(chartData.map(d => d.metrics.actual));
    const lines = nums(chartData.map(d => d.metrics.line));
    const odds = nums(chartData.map(d => d.metrics.odds));

    const avgActual = safeAverage(actuals);
    const lastActual = actuals[actuals.length - 1] ?? avgActual;
    const prevActual = actuals.length > 1 ? actuals[actuals.length - 2] : lastActual;

    const avgLine = safeAverage(lines);
    const lastLine = lines[lines.length - 1] ?? avgLine;
    const prevLine = lines.length > 1 ? lines[lines.length - 2] : lastLine;

    const edgeNow = lastActual - lastLine;
    const prevEdge = prevActual - prevLine;

    const hits = actuals.filter((val, idx) => val >= (lines[idx] ?? 0)).length;
    const hitRate = actuals.length ? (hits / actuals.length) * 100 : 0;
    const prevActuals = actuals.slice(0, -1);
    const prevLines = lines.slice(0, -1);
    const prevHits = prevActuals.filter((val, idx) => val >= (prevLines[idx] ?? 0)).length;
    const prevHitRate = prevActuals.length ? (prevHits / prevActuals.length) * 100 : hitRate;

    const oddsAvg = safeAverage(odds);
    const lastOdds = odds[odds.length - 1] ?? oddsAvg;
    const prevOdds = odds.length > 1 ? odds[odds.length - 2] : oddsAvg;

    const windowSize = Math.min(5, actuals.length);
    const recentAvg = windowSize ? safeAverage(actuals.slice(-windowSize)) : avgActual;
    const priorAvg =
      actuals.length > windowSize ? safeAverage(actuals.slice(0, -windowSize)) : avgActual;

    return [
      {
        id: 'edge',
        name: 'Edge vs Line',
        value: Number(edgeNow.toFixed(2)),
        change: Number((edgeNow - prevEdge).toFixed(2)),
        changePercent: Number(changePercent(edgeNow, prevEdge).toFixed(2)),
        color: edgeNow >= 0 ? '#16a34a' : '#dc2626',
        unit: 'pts',
        format: 'number',
        benchmark: 0,
      },
      {
        id: 'hit_rate',
        name: 'Hit Rate',
        value: Number(hitRate.toFixed(2)),
        change: Number((hitRate - prevHitRate).toFixed(2)),
        changePercent: Number(changePercent(hitRate, prevHitRate).toFixed(2)),
        color: hitRate >= 55 ? '#22c55e' : '#f97316',
        unit: '',
        format: 'percentage',
        benchmark: 55,
        target: 60,
      },
      {
        id: 'recent_form',
        name: 'Recent Form Avg',
        value: Number(recentAvg.toFixed(2)),
        change: Number((recentAvg - priorAvg).toFixed(2)),
        changePercent: Number(changePercent(recentAvg, priorAvg).toFixed(2)),
        color: recentAvg >= avgActual ? '#2563eb' : '#f97316',
        unit: 'pts',
        format: 'number',
        benchmark: Number(avgActual.toFixed(2)),
      },
      {
        id: 'average_odds',
        name: 'Average Odds',
        value: Number(oddsAvg.toFixed(1)),
        change: Number((lastOdds - prevOdds).toFixed(1)),
        changePercent: Number(changePercent(lastOdds, prevOdds).toFixed(2)),
        color: oddsAvg <= -110 ? '#6366f1' : '#0ea5e9',
        unit: '',
        format: 'number',
      },
    ];
  }, [chartData]);

  // EV hook (does not interfere with existing data flow)
  const { data: evData } = useEVOpportunities({
    sport: undefined, // Predictions dashboard not sport-specific currently
    minEdge: 2,
    includeKelly: showEV && bankroll > 0,
    bankroll: showEV && bankroll > 0 ? bankroll : undefined,
    refreshMs: 30000,
  });

  // Merge EV data onto opportunities (by id) for display-only list
  const evMerged = useMemo(() => {
    if (!showEV)
      return [] as Array<
        RawOpportunity & { __ev?: number; __kelly_fraction?: number; __recommended_stake?: number }
      >;
    const map = new Map(evData.map(o => [o.id, o]));
    const merged = displayOpportunities.map(o => {
      const ev = map.get(o.id);
      return {
        ...o,
        __ev: ev?.edge_pct,
        __kelly_fraction: ev?.kelly_fraction,
        __recommended_stake: ev?.recommended_stake,
      };
    });
    return merged.sort((a, b) => {
      const av = a.__ev ?? -999;
      const bv = b.__ev ?? -999;
      return evSortDesc ? bv - av : av - bv;
    });
  }, [showEV, evData, displayOpportunities, evSortDesc]);

  const isHeadToHeadFilterActive = headToHeadOnly && selectedOpponent !== 'all';
  const isHeadToHeadMissing = isHeadToHeadFilterActive && filteredOpportunities.length === 0;

  if (isLoading) return <div className='p-6'>Loading predictions...</div>;

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-6xl mx-auto'>
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-2xl font-bold'>Predictions Dashboard</h1>
          <div className='flex items-center space-x-3'>
            <select
              value={selectedPlayer ?? ''}
              onChange={e => setSelectedPlayer(e.target.value || null)}
              className='px-3 py-2 border rounded'
            >
              {playerList.length === 0 ? (
                <option value=''>No players</option>
              ) : (
                playerList.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))
              )}
            </select>

            {opponentOptions.length > 0 && (
              <select
                value={selectedOpponent}
                onChange={e => setSelectedOpponent(e.target.value)}
                className='px-3 py-2 border rounded'
              >
                <option value='all'>All opponents</option>
                {opponentOptions.map(op => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            )}

            <select
              value={timeframe}
              onChange={e => setTimeframe(e.target.value as '5' | '10' | '20' | 'all')}
              className='px-3 py-2 border rounded'
            >
              <option value='5'>Last 5</option>
              <option value='10'>Last 10</option>
              <option value='20'>Last 20</option>
              <option value='all'>All</option>
            </select>

            <label className='flex items-center space-x-2'>
              <input
                type='checkbox'
                checked={headToHeadOnly}
                onChange={e => setHeadToHeadOnly(e.target.checked)}
              />
              <span className='text-sm'>Head-to-head</span>
            </label>
          </div>
        </div>

        {isHeadToHeadMissing && (
          <div className='mb-4 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800'>
            No recent head-to-head data for {selectedPlayer} versus {selectedOpponent}. Showing
            overall performance instead.
          </div>
        )}

        {FRONTEND_ENABLE_EV && (
          <div className='mb-4 bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-4'>
            <label className='flex items-center gap-2 text-sm font-medium'>
              <input type='checkbox' checked={showEV} onChange={() => setShowEV(v => !v)} />
              Show EV
            </label>
            {showEV && (
              <>
                <div className='flex items-center gap-2 text-sm'>
                  <span>Bankroll:</span>
                  <input
                    type='number'
                    min={0}
                    value={bankroll}
                    onChange={e => setBankroll(Number(e.target.value) || 0)}
                    className='border rounded px-2 py-1 w-28 text-sm'
                    placeholder='0'
                  />
                </div>
                <button
                  type='button'
                  onClick={() => setEvSortDesc(d => !d)}
                  className='text-xs px-2 py-1 border rounded bg-gray-100 hover:bg-gray-200'
                >
                  Sort EV {evSortDesc ? '↓' : '↑'}
                </button>
              </>
            )}
          </div>
        )}
        {FRONTEND_ENABLE_EV && showEV && (
          <div className='mb-4'>
            <EVSummaryWidget />
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2 bg-white rounded-lg shadow p-4'>
            <AdvancedPerformanceCharts
              data={chartData}
              metrics={metrics}
              enableExport
              enableFullscreen
            />

            {playerSummary && (
              <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                <div className='rounded-lg border border-gray-100 bg-slate-50 px-3 py-3'>
                  <p className='text-xs uppercase tracking-wide text-slate-500'>Games Tracked</p>
                  <p className='text-2xl font-semibold text-slate-800'>{playerSummary.games}</p>
                  {playerSummary.lastUpdated && (
                    <p className='mt-1 text-[11px] text-slate-500'>
                      Updated {playerSummary.lastUpdated}
                    </p>
                  )}
                </div>
                <div className='rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-3'>
                  <p className='text-xs uppercase tracking-wide text-emerald-600'>Hit Rate</p>
                  <p className='text-2xl font-semibold text-emerald-700'>
                    {playerSummary.hitRate.toFixed(1)}%
                  </p>
                  <p className='mt-1 text-[11px] text-emerald-600'>
                    Based on tracked opportunities
                  </p>
                </div>
                <div className='rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-3'>
                  <p className='text-xs uppercase tracking-wide text-indigo-600'>Average Edge</p>
                  <p className='text-2xl font-semibold text-indigo-700'>
                    {playerSummary.avgEdge >= 0 ? '+' : ''}
                    {playerSummary.avgEdge.toFixed(2)}
                  </p>
                  <p className='mt-1 text-[11px] text-indigo-600'>
                    Momentum {playerSummary.momentum >= 0 ? '▲' : '▼'}
                    {Math.abs(playerSummary.momentum).toFixed(2)} last trend
                  </p>
                </div>
                <div className='rounded-lg border border-sky-100 bg-sky-50 px-3 py-3'>
                  <p className='text-xs uppercase tracking-wide text-sky-600'>Market Snapshot</p>
                  <p className='text-lg font-semibold text-sky-700'>
                    {playerSummary.currentLine != null
                      ? `Line ${playerSummary.currentLine}`
                      : 'Line N/A'}
                  </p>
                  <p className='text-sm text-sky-600'>
                    Avg odds {playerSummary.averageOdds.toFixed(1)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className='bg-white rounded-lg shadow p-4'>
            {/* Player performance small chart */}
            <h3 className='text-lg font-medium mb-2'>Recent Performance vs Line</h3>
            <PerformanceLineComparison
              data={comparisonSeries}
              timeframeValue={comparisonTimeframeValue}
              timeframeOptions={comparisonTimeframeOptions}
              onTimeframeChange={handleComparisonTimeframeChange}
              showProjection={false}
              showMovingAverage
              movingAverageWindow={5}
              height={240}
              showHeader={false}
              variant='embedded'
              enableSeriesToggles
              persistSeriesToggles
              seriesPersistenceKey='predictions-dashboard'
              enableDeltaView
              enableOpponentFilter
              opponentFilterValue={selectedOpponent}
              onOpponentFilterChange={value => setSelectedOpponent(value)}
            />

            <h3 className='text-lg font-medium mt-4 mb-2'>Odds Aggregation</h3>
            <MultiBookOddsChart
              data={multiBookOddsSeries}
              height={260}
              maxSeries={5}
              title='Bookmaker Odds Movement'
            />
            {FRONTEND_ENABLE_EV && showEV && (
              <div className='mt-6'>
                <h3 className='text-lg font-medium mb-2 flex items-center gap-2'>
                  Opportunities (EV)
                </h3>
                <div className='max-h-64 overflow-auto text-sm divide-y'>
                  {evMerged.length === 0 && (
                    <div className='py-2 text-xs text-gray-500'>No opportunities mapped.</div>
                  )}
                  {evMerged.map(o => (
                    <div key={o.id} className='py-2 flex items-center justify-between gap-3'>
                      <div className='flex-1 min-w-0'>
                        <div className='font-medium truncate'>{o.player || o.id}</div>
                        <div className='text-[11px] text-gray-500'>
                          Line {typeof o.line === 'number' ? o.line : '-'} | Odds{' '}
                          {typeof o.odds === 'number' ? o.odds : '-'}
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        {o.__ev != null ? (
                          <EVBadge edgePct={o.__ev} className='' />
                        ) : (
                          <span className='text-[11px] text-gray-400'>-</span>
                        )}
                        {o.__kelly_fraction && bankroll > 0 && (
                          <span
                            className='text-[10px] text-gray-500'
                            title={
                              `Kelly ${(o.__kelly_fraction * 100).toFixed(2)}%` +
                              (o.__recommended_stake
                                ? ` | Stake $${o.__recommended_stake.toFixed(2)}`
                                : '')
                            }
                          >
                            {(o.__kelly_fraction * 100).toFixed(1)}%
                            {o.__recommended_stake ? ` ($${o.__recommended_stake.toFixed(0)})` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {FRONTEND_ENABLE_EV && showEV && (
              <div className='mt-6'>
                <ValuePanel sport='MLB' market='player_props' />
              </div>
            )}
          </div>
        </div>

        {selectedOpponent !== 'all' && headToHeadSummary && (
          <div className='mt-6 bg-white rounded-lg shadow p-4'>
            <div className='flex items-center justify-between flex-wrap gap-3'>
              <div>
                <h3 className='text-lg font-semibold'>Head-to-Head Snapshot</h3>
                <p className='text-sm text-slate-500'>
                  {selectedPlayer} vs {headToHeadSummary.opponent} across {headToHeadSummary.games}{' '}
                  tracked games
                </p>
              </div>
              {headToHeadSummary.lastUpdated && (
                <span className='text-xs text-slate-500'>
                  Updated {headToHeadSummary.lastUpdated}
                </span>
              )}
            </div>
            <div className='mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4'>
              <div>
                <p className='text-xs uppercase tracking-wide text-slate-500'>Hit Rate</p>
                <p className='text-xl font-semibold text-slate-800'>
                  {headToHeadSummary.hitRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className='text-xs uppercase tracking-wide text-slate-500'>Average Edge</p>
                <p className='text-xl font-semibold text-slate-800'>
                  {headToHeadSummary.avgEdge >= 0 ? '+' : ''}
                  {headToHeadSummary.avgEdge.toFixed(2)}
                </p>
              </div>
              <div>
                <p className='text-xs uppercase tracking-wide text-slate-500'>Average Actual</p>
                <p className='text-xl font-semibold text-slate-800'>
                  {headToHeadSummary.avgActual.toFixed(1)}
                </p>
              </div>
              <div>
                <p className='text-xs uppercase tracking-wide text-slate-500'>Average Odds</p>
                <p className='text-xl font-semibold text-slate-800'>
                  {headToHeadSummary.avgOdds.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedOpponent === 'all' && opponentSummaries.length > 0 && (
          <div className='mt-6 bg-white rounded-lg shadow p-4'>
            <div className='flex items-center justify-between flex-wrap gap-3'>
              <div>
                <h3 className='text-lg font-semibold'>Opponent Breakdown</h3>
                <p className='text-sm text-slate-500'>Performance splits for {selectedPlayer}</p>
              </div>
              <span className='text-xs text-slate-500'>Sorted by sample size</span>
            </div>
            <div className='mt-4 overflow-x-auto'>
              <table className='min-w-full divide-y divide-slate-200 text-sm'>
                <thead className='bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'>
                  <tr>
                    <th className='px-3 py-2'>Opponent</th>
                    <th className='px-3 py-2'>Games</th>
                    <th className='px-3 py-2'>Hit Rate</th>
                    <th className='px-3 py-2'>Avg Edge</th>
                    <th className='px-3 py-2'>Avg Actual</th>
                    <th className='px-3 py-2'>Avg Line</th>
                    <th className='px-3 py-2'>Avg Odds</th>
                    <th className='px-3 py-2'>Updated</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100'>
                  {opponentSummaries.map(summary => (
                    <tr key={summary.opponent} className='hover:bg-slate-50'>
                      <td className='px-3 py-2 font-medium text-slate-800'>{summary.opponent}</td>
                      <td className='px-3 py-2 text-slate-600'>{summary.games}</td>
                      <td className='px-3 py-2 text-slate-600'>{summary.hitRate.toFixed(1)}%</td>
                      <td className='px-3 py-2 text-slate-600'>
                        {summary.avgEdge >= 0 ? '+' : ''}
                        {summary.avgEdge.toFixed(2)}
                      </td>
                      <td className='px-3 py-2 text-slate-600'>{summary.avgActual.toFixed(1)}</td>
                      <td className='px-3 py-2 text-slate-600'>{summary.avgLine.toFixed(1)}</td>
                      <td className='px-3 py-2 text-slate-600'>{summary.avgOdds.toFixed(1)}</td>
                      <td className='px-3 py-2 text-slate-500 text-xs'>
                        {summary.lastUpdated ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionsDashboard;
