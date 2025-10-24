import { RefreshCw, ShieldCheck, TrendingUp, Zap } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import usePropfinderData, { PropOpportunity } from '../../../hooks/usePropFinderData';
import { enhancedLogger } from '../../../utils/enhancedLogger';

interface LineShoppingRow {
  id: string;
  label: string;
  sport: string;
  market?: string;
  bestBookmaker: string;
  bestOdds?: number | null;
  bestLine?: number | null;
  competitorBookmaker?: string;
  competitorOdds?: number | null;
  competitorLine?: number | null;
  oddsImprovementPct: number;
  lineEdge?: number | null;
  numBookmakers: number;
  lastUpdated?: string;
  hasArbitrage?: boolean;
  isLowJuice?: boolean;
}

interface SportsbookAggregate {
  bookmaker: string;
  winCount: number;
  averageImprovement: number;
  topImprovement: number;
}

const toDecimalOdds = (rawOdds?: number | null): number | null => {
  if (typeof rawOdds !== 'number' || !Number.isFinite(rawOdds)) {
    return null;
  }

  const value = Number(rawOdds);
  if (value === 0) return null;

  // Treat large absolute odds as American pricing
  if (Math.abs(value) >= 100) {
    if (value > 0) {
      return Number((1 + value / 100).toFixed(4));
    }
    return Number((1 + 100 / Math.abs(value)).toFixed(4));
  }

  // Otherwise assume decimal odds already provided
  return Number(value.toFixed(4));
};

const formatOdds = (rawOdds?: number | null): string => {
  if (typeof rawOdds !== 'number' || !Number.isFinite(rawOdds)) {
    return '—';
  }

  if (Math.abs(rawOdds) >= 100) {
    return rawOdds > 0 ? `+${Math.round(rawOdds)}` : `${Math.round(rawOdds)}`;
  }

  return rawOdds.toFixed(2);
};

const formatDecimalOdds = (decimalOdds?: number | null): string => {
  if (typeof decimalOdds !== 'number' || !Number.isFinite(decimalOdds)) {
    return '—';
  }
  return decimalOdds.toFixed(decimalOdds >= 2 ? 2 : 3);
};

const formatPercent = (value: number): string => `${value.toFixed(2)}%`;

const formatLine = (value?: number | null): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '—';
  }
  return value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
};

const safeLabel = (opportunity: PropOpportunity): string => {
  if (opportunity.player && opportunity.market) {
    return `${opportunity.player} • ${opportunity.market}`;
  }
  if (opportunity.player) {
    return opportunity.player;
  }
  if (opportunity.market) {
    return opportunity.market;
  }
  if (opportunity.team) {
    return opportunity.team;
  }
  return opportunity.id;
};

const computeLineShoppingRows = (opportunities: PropOpportunity[]): LineShoppingRow[] => {
  const rows: LineShoppingRow[] = [];

  opportunities.forEach(opportunity => {
    const bookmakers = Array.isArray(opportunity.bookmakers)
      ? opportunity.bookmakers.filter(entry => entry && entry.name)
      : [];

    const oddsCandidates = bookmakers
      .filter(entry => typeof entry.odds === 'number' && Number.isFinite(entry.odds))
      .sort((a, b) => {
        const aDecimal = toDecimalOdds(a.odds) ?? 0;
        const bDecimal = toDecimalOdds(b.odds) ?? 0;
        return bDecimal - aDecimal;
      });

    if (oddsCandidates.length < 2) {
      return;
    }

    const [bestOddsEntry, competitorEntry] = oddsCandidates;
    const bestDecimal = toDecimalOdds(bestOddsEntry.odds) ?? 0;
    const competitorDecimal = toDecimalOdds(competitorEntry.odds) ?? 0;

    const rawImprovement = competitorDecimal
      ? ((bestDecimal - competitorDecimal) / competitorDecimal) * 100
      : 0;

    const lineCandidates = bookmakers
      .filter(entry => typeof entry.line === 'number' && Number.isFinite(entry.line))
      .sort((a, b) => (a.line ?? Number.POSITIVE_INFINITY) - (b.line ?? Number.POSITIVE_INFINITY));

    const bestLineEntry = lineCandidates[0];
    const competitorLineEntry = lineCandidates[1];
    const lineEdgeValue =
      bestLineEntry && competitorLineEntry
        ? (competitorLineEntry.line ?? 0) - (bestLineEntry.line ?? 0)
        : undefined;

    const normalizedLineEdge =
      lineEdgeValue !== undefined && Number.isFinite(lineEdgeValue)
        ? Number(lineEdgeValue.toFixed(1))
        : undefined;

    rows.push({
      id: opportunity.id,
      label: safeLabel(opportunity),
      sport: opportunity.sport || 'Unknown',
      market: opportunity.market || undefined,
      bestBookmaker: bestOddsEntry.name || opportunity.bestBookmaker || 'Unknown',
      bestOdds: typeof bestOddsEntry.odds === 'number' ? bestOddsEntry.odds : undefined,
      bestLine: typeof bestLineEntry?.line === 'number' ? bestLineEntry.line : undefined,
      competitorBookmaker: competitorEntry?.name || undefined,
      competitorOdds: typeof competitorEntry?.odds === 'number' ? competitorEntry.odds : undefined,
      competitorLine:
        typeof competitorLineEntry?.line === 'number' ? competitorLineEntry.line : undefined,
      oddsImprovementPct: Number.isFinite(rawImprovement) ? Number(rawImprovement.toFixed(2)) : 0,
      lineEdge: normalizedLineEdge,
      numBookmakers: opportunity.numBookmakers || bookmakers.length,
      lastUpdated: opportunity.lastUpdated,
      hasArbitrage: opportunity.hasArbitrage,
      isLowJuice: opportunity.isLowJuice,
    });
  });

  return rows;
};

const summarizeSportsbooks = (rows: LineShoppingRow[]): SportsbookAggregate[] => {
  const map = new Map<string, { wins: number; improvements: number[] }>();

  rows.forEach(row => {
    if (!row.bestBookmaker) return;
    if (!map.has(row.bestBookmaker)) {
      map.set(row.bestBookmaker, { wins: 0, improvements: [] });
    }
    const entry = map.get(row.bestBookmaker)!;
    entry.wins += 1;
    if (Number.isFinite(row.oddsImprovementPct)) {
      entry.improvements.push(row.oddsImprovementPct);
    }
  });

  return Array.from(map.entries())
    .map(([bookmaker, value]) => {
      const total = value.improvements.reduce((acc, v) => acc + v, 0);
      const average = value.improvements.length ? total / value.improvements.length : 0;
      const top = value.improvements.length ? Math.max(...value.improvements) : 0;

      return {
        bookmaker,
        winCount: value.wins,
        averageImprovement: Number(average.toFixed(2)),
        topImprovement: Number(top.toFixed(2)),
      } satisfies SportsbookAggregate;
    })
    .sort((a, b) => {
      if (b.winCount === a.winCount) {
        return b.averageImprovement - a.averageImprovement;
      }
      return b.winCount - a.winCount;
    })
    .slice(0, 6);
};

const formatTimestamp = (timestamp?: string): string => {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

const LineShopping: React.FC = () => {
  const {
    opportunities = [],
    loading,
    error,
    refreshData,
  } = usePropfinderData({
    autoRefresh: true,
    includeCLV: false,
  });

  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [selectedMarket, setSelectedMarket] = useState<string>('All');
  const [selectedBookmaker, setSelectedBookmaker] = useState<string>('All');
  const [minImprovement, setMinImprovement] = useState<number>(1.5);
  const [onlyLowJuice, setOnlyLowJuice] = useState<boolean>(false);

  const baseRows = useMemo(() => computeLineShoppingRows(opportunities), [opportunities]);

  const sportOptions = useMemo(() => {
    const unique = Array.from(new Set(baseRows.map(row => row.sport))).filter(
      sport => sport && sport !== 'Unknown'
    );
    return ['All', ...unique.sort((a, b) => a.localeCompare(b))];
  }, [baseRows]);

  const marketOptions = useMemo(() => {
    const unique = Array.from(new Set(baseRows.map(row => row.market).filter(Boolean))) as string[];
    return ['All', ...unique.sort((a, b) => a.localeCompare(b))];
  }, [baseRows]);

  const bookmakerOptions = useMemo(() => {
    const unique = Array.from(
      new Set(
        baseRows
          .flatMap(row => [row.bestBookmaker, row.competitorBookmaker])
          .filter(Boolean) as string[]
      )
    );
    return ['All', ...unique.sort((a, b) => a.localeCompare(b))];
  }, [baseRows]);

  const filteredRows = useMemo(() => {
    return baseRows.filter(row => {
      if (selectedSport !== 'All' && row.sport !== selectedSport) {
        return false;
      }

      if (selectedMarket !== 'All' && row.market !== selectedMarket) {
        return false;
      }

      if (
        selectedBookmaker !== 'All' &&
        row.bestBookmaker !== selectedBookmaker &&
        row.competitorBookmaker !== selectedBookmaker
      ) {
        return false;
      }

      if (row.oddsImprovementPct < minImprovement) {
        return false;
      }

      if (onlyLowJuice && !row.isLowJuice) {
        return false;
      }

      return true;
    });
  }, [baseRows, minImprovement, onlyLowJuice, selectedBookmaker, selectedMarket, selectedSport]);

  const sportsbookSummaries = useMemo(() => summarizeSportsbooks(filteredRows), [filteredRows]);

  const summaryMetrics = useMemo(() => {
    if (filteredRows.length === 0) {
      return {
        count: 0,
        averageImprovement: 0,
        topImprovement: 0,
        sportsbookCount: 0,
        arbitrageCount: 0,
      };
    }

    const totalImprovement = filteredRows.reduce((sum, row) => sum + row.oddsImprovementPct, 0);
    const uniqueBooks = new Set<string>();
    const arbitrageCount = filteredRows.filter(row => row.hasArbitrage).length;

    filteredRows.forEach(row => {
      if (row.bestBookmaker) uniqueBooks.add(row.bestBookmaker);
      if (row.competitorBookmaker) uniqueBooks.add(row.competitorBookmaker);
    });

    const topImprovement = Math.max(...filteredRows.map(row => row.oddsImprovementPct));

    return {
      count: filteredRows.length,
      averageImprovement: Number((totalImprovement / filteredRows.length).toFixed(2)),
      topImprovement: Number(topImprovement.toFixed(2)),
      sportsbookCount: uniqueBooks.size,
      arbitrageCount,
    };
  }, [filteredRows]);

  const chartData = useMemo(
    () =>
      filteredRows.slice(0, 8).map(row => ({
        name: row.label.slice(0, 22),
        value: row.oddsImprovementPct,
      })),
    [filteredRows]
  );

  const handleRefresh = useCallback(() => {
    enhancedLogger.info('LineShopping', 'refresh', 'Manual refresh requested');
    void refreshData?.();
  }, [refreshData]);

  return (
    <div className='px-6 py-8 space-y-8'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-white'>Line Shopping Optimizer</h1>
          <p className='mt-1 text-sm text-slate-300'>
            Aggregate sportsbook pricing to instantly spot the best odds, line edges, and low-juice
            opportunities across the market.
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          <button
            onClick={handleRefresh}
            className='inline-flex items-center gap-2 rounded-lg border border-cyan-600 bg-slate-900 px-4 py-2 text-sm font-semibold text-cyan-300 shadow transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500'
          >
            <RefreshCw className='h-4 w-4 animate-spin-slow md:animate-none' />
            Refresh
          </button>
          <label className='flex items-center gap-2 text-xs text-slate-300'>
            <input
              type='checkbox'
              className='h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500'
              checked={onlyLowJuice}
              onChange={event => setOnlyLowJuice(event.target.checked)}
            />
            Highlight low-juice markets
          </label>
        </div>
      </div>

      {error ? (
        <div className='rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200'>
          Failed to load line shopping data: {error}
        </div>
      ) : null}

      <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <div className='rounded-2xl border border-slate-700 bg-slate-900/60 p-5 shadow-lg'>
          <div className='flex items-center justify-between'>
            <div className='text-sm font-medium text-slate-400'>Eligible Markets</div>
            <Zap className='h-5 w-5 text-cyan-400' />
          </div>
          <div className='mt-3 text-3xl font-semibold text-white'>{summaryMetrics.count}</div>
          <p className='mt-1 text-xs text-slate-400'>Opportunities passing your filters</p>
        </div>
        <div className='rounded-2xl border border-slate-700 bg-slate-900/60 p-5 shadow-lg'>
          <div className='flex items-center justify-between'>
            <div className='text-sm font-medium text-slate-400'>Average Improvement</div>
            <TrendingUp className='h-5 w-5 text-emerald-400' />
          </div>
          <div className='mt-3 text-3xl font-semibold text-emerald-300'>
            {formatPercent(summaryMetrics.averageImprovement)}
          </div>
          <p className='mt-1 text-xs text-slate-400'>Edge gained vs next-best sportsbook</p>
        </div>
        <div className='rounded-2xl border border-slate-700 bg-slate-900/60 p-5 shadow-lg'>
          <div className='flex items-center justify-between'>
            <div className='text-sm font-medium text-slate-400'>Top Edge</div>
            <ShieldCheck className='h-5 w-5 text-purple-400' />
          </div>
          <div className='mt-3 text-3xl font-semibold text-purple-200'>
            {formatPercent(summaryMetrics.topImprovement)}
          </div>
          <p className='mt-1 text-xs text-slate-400'>Best improvement on the board</p>
        </div>
        <div className='rounded-2xl border border-slate-700 bg-slate-900/60 p-5 shadow-lg'>
          <div className='flex items-center justify-between'>
            <div className='text-sm font-medium text-slate-400'>Sportsbook Coverage</div>
            <ShieldCheck className='h-5 w-5 text-cyan-300' />
          </div>
          <div className='mt-3 text-3xl font-semibold text-cyan-200'>
            {summaryMetrics.sportsbookCount}
          </div>
          <p className='mt-1 text-xs text-slate-400'>Unique books contributing best prices</p>
        </div>
      </section>

      <section className='rounded-2xl border border-slate-800 bg-slate-950/60 p-6 shadow-xl'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
          <div>
            <h2 className='text-xl font-semibold text-white'>Filter opportunities</h2>
            <p className='mt-1 text-xs text-slate-400'>
              Tune by sport, market, sportsbook, and minimum value edge.
            </p>
          </div>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <label className='flex flex-col text-xs'>
              <span className='mb-1 text-slate-400'>Sport</span>
              <select
                value={selectedSport}
                onChange={event => setSelectedSport(event.target.value)}
                className='rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none'
              >
                {sportOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className='flex flex-col text-xs'>
              <span className='mb-1 text-slate-400'>Market</span>
              <select
                value={selectedMarket}
                onChange={event => setSelectedMarket(event.target.value)}
                className='rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none'
              >
                {marketOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className='flex flex-col text-xs'>
              <span className='mb-1 text-slate-400'>Sportsbook</span>
              <select
                value={selectedBookmaker}
                onChange={event => setSelectedBookmaker(event.target.value)}
                className='rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none'
              >
                {bookmakerOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className='flex flex-col text-xs'>
              <span className='mb-1 text-slate-400'>Min Improvement (%)</span>
              <div className='flex items-center gap-2'>
                <input
                  type='range'
                  min={0}
                  max={10}
                  step={0.5}
                  value={minImprovement}
                  onChange={event => setMinImprovement(Number(event.target.value))}
                  className='flex-1 accent-cyan-500'
                />
                <span className='w-12 text-right text-sm text-cyan-300'>
                  {minImprovement.toFixed(1)}
                </span>
              </div>
            </label>
          </div>
        </div>
      </section>

      <section className='grid gap-6 lg:grid-cols-5'>
        <div className='lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-white'>Top Line Shopping Edges</h2>
            <span className='text-xs text-slate-400'>Top {chartData.length} by improvement %</span>
          </div>
          {chartData.length === 0 ? (
            <div className='flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/40 text-sm text-slate-400'>
              No opportunities match your filters yet.
            </div>
          ) : (
            <div className='h-64'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#1e293b' />
                  <XAxis
                    dataKey='name'
                    stroke='#94a3b8'
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke='#94a3b8'
                    fontSize={12}
                    tickFormatter={value => `${value}%`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: '12px',
                      color: '#e2e8f0',
                    }}
                  />
                  <defs>
                    <linearGradient id='lineShoppingGradient' x1='0' y1='0' x2='1' y2='1'>
                      <stop offset='0%' stopColor='#22d3ee' stopOpacity={0.9} />
                      <stop offset='100%' stopColor='#6366f1' stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <Bar dataKey='value' fill='url(#lineShoppingGradient)' radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className='lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-white'>Best Sportsbooks</h2>
            <span className='text-xs text-slate-400'>Ranked by frequency & edge delivered</span>
          </div>
          <div className='space-y-3'>
            {sportsbookSummaries.length === 0 ? (
              <div className='flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/40 text-sm text-slate-400'>
                No sportsbook outliers detected yet.
              </div>
            ) : (
              sportsbookSummaries.map(summary => (
                <div
                  key={summary.bookmaker}
                  className='rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-cyan-600/60 hover:bg-slate-900/80'
                >
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='text-sm font-semibold text-white'>{summary.bookmaker}</div>
                      <p className='text-xs text-slate-400'>Best price {summary.winCount}x today</p>
                    </div>
                    <div className='text-right'>
                      <div className='text-sm font-semibold text-emerald-300'>
                        {formatPercent(summary.averageImprovement)} avg
                      </div>
                      <div className='text-xs text-slate-400'>
                        Peak {formatPercent(summary.topImprovement)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className='rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl'>
        <div className='mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
          <div>
            <h2 className='text-lg font-semibold text-white'>Full opportunity list</h2>
            <p className='text-xs text-slate-400'>
              Compare odds & lines across every participating sportsbook.
            </p>
          </div>
          <div className='text-xs text-slate-400'>Sorted by improvement percentage (desc)</div>
        </div>

        <div className='overflow-x-auto rounded-xl border border-slate-800'>
          <table className='min-w-full divide-y divide-slate-800 text-sm'>
            <thead className='bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400'>
              <tr>
                <th className='px-4 py-3 text-left font-semibold'>Market</th>
                <th className='px-4 py-3 text-left font-semibold'>Sport</th>
                <th className='px-4 py-3 text-left font-semibold'>Best Book</th>
                <th className='px-4 py-3 text-left font-semibold'>Best Odds</th>
                <th className='px-4 py-3 text-left font-semibold'>Runner Up</th>
                <th className='px-4 py-3 text-left font-semibold'>Improvement</th>
                <th className='px-4 py-3 text-left font-semibold'>Line Edge</th>
                <th className='px-4 py-3 text-left font-semibold'>Books</th>
                <th className='px-4 py-3 text-left font-semibold'>Updated</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-800 bg-slate-950/40 text-slate-200'>
              {loading && filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className='px-4 py-10 text-center text-sm text-slate-400'>
                    Loading latest line shopping edges...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className='px-4 py-10 text-center text-sm text-slate-400'>
                    No matching opportunities. Adjust your filters to see more action.
                  </td>
                </tr>
              ) : (
                filteredRows.map(row => (
                  <tr key={row.id} className='hover:bg-slate-900/60'>
                    <td className='px-4 py-3'>
                      <div className='font-semibold text-white'>{row.label}</div>
                      <div className='text-xs text-slate-400'>{row.market || '—'}</div>
                    </td>
                    <td className='px-4 py-3 text-xs uppercase tracking-wide text-slate-300'>
                      {row.sport}
                    </td>
                    <td className='px-4 py-3'>
                      <div className='font-semibold text-emerald-300'>{row.bestBookmaker}</div>
                      <div className='text-xs text-slate-400'>
                        Odds {formatOdds(row.bestOdds)} (
                        {formatDecimalOdds(toDecimalOdds(row.bestOdds))})
                      </div>
                    </td>
                    <td className='px-4 py-3 text-xs text-slate-300'>
                      Line {formatLine(row.bestLine)}
                    </td>
                    <td className='px-4 py-3'>
                      <div className='font-semibold text-slate-200'>
                        {row.competitorBookmaker || '—'}
                      </div>
                      <div className='text-xs text-slate-500'>
                        Odds {formatOdds(row.competitorOdds)}
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='font-semibold text-emerald-300'>
                        {formatPercent(row.oddsImprovementPct)}
                      </div>
                      {row.hasArbitrage ? (
                        <div className='mt-1 inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200'>
                          Arbitrage Ready
                        </div>
                      ) : null}
                    </td>
                    <td className='px-4 py-3 text-xs text-slate-300'>
                      {row.lineEdge !== undefined ? `${row.lineEdge?.toFixed(1)} pts` : '—'}
                    </td>
                    <td className='px-4 py-3 text-center text-xs text-slate-300'>
                      {row.numBookmakers}
                    </td>
                    <td className='px-4 py-3 text-xs text-slate-400'>
                      {formatTimestamp(row.lastUpdated)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default LineShopping;
