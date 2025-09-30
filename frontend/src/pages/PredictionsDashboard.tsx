import React, { useEffect, useMemo, useState } from 'react';
import AdvancedPerformanceCharts, { ChartDataPoint, PerformanceMetric } from '../components/charts/AdvancedPerformanceCharts';
import { PlayerPerformanceChart } from '../components/charts/PlayerPerformanceChart';
import OddsAggregationChart, { OddsPoint } from '../components/charts/OddsAggregationChart';
// EV integrations
import EVBadge from '../components/ev/EVBadge';
import EVSummaryWidget from '../components/ev/EVSummaryWidget';
import { useEVOpportunities } from '../hooks/useEVOpportunities';
import ValuePanel from '../components/odds/ValuePanel';

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

const PredictionsDashboard: React.FC = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'5' | '10' | '20' | 'all'>('10');
  const [headToHeadOnly, setHeadToHeadOnly] = useState(false);
  const [opportunities, setOpportunities] = useState<RawOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // EV feature flag & state (Phase 2)
  const FRONTEND_ENABLE_EV = true; // Guard all EV-related UI/logic
  const [showEV, setShowEV] = useState(false);
  const [bankroll, setBankroll] = useState<number>(0);
  const [evSortDesc, setEvSortDesc] = useState(true);

  const metrics: PerformanceMetric[] = [
    { id: 'line', name: 'Betting Line', value: 0, change: 0, changePercent: 0, color: '#3B82F6', unit: '', format: 'decimal' },
    { id: 'actual', name: 'Actual Performance', value: 0, change: 0, changePercent: 0, color: '#10B981', unit: '', format: 'decimal' },
    { id: 'odds', name: 'Odds', value: 0, change: 0, changePercent: 0, color: '#F59E0B', unit: '', format: 'decimal' }
  ];

  // Fetch opportunities from backend, every 30s by default
  useEffect(() => {
    let mounted = true;
    const fetchOpportunities = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/propfinder/opportunities');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
  const raw: unknown[] = Array.isArray(json?.data?.opportunities) ? json.data.opportunities : (Array.isArray(json?.opportunities) ? json.opportunities : []);

        const asNumberArray = (v: unknown): number[] | undefined => {
          if (!Array.isArray(v)) return undefined;
          const out: number[] = [];
          for (const item of v) {
            if (typeof item === 'number') out.push(item);
            else if (typeof item === 'string') {
              const n = Number(item);
              out.push(Number.isFinite(n) ? n : 0);
            } else out.push(0);
          }
          return out;
        };

        const safeStr = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);
        const safeNum = (v: unknown): number | undefined => (typeof v === 'number' ? v : (typeof v === 'string' ? (Number.isFinite(Number(v)) ? Number(v) : undefined) : undefined));

        const mapped: RawOpportunity[] = raw.map((r: unknown) => {
          const rec = r as Record<string, unknown>;
          return {
            id: String(rec.id ?? rec.player ?? Math.random()),
            player: String(rec.player ?? rec.playerName ?? rec.name ?? 'unknown'),
            recentForm: asNumberArray(rec.recentForm),
            lastUpdated: safeStr(rec.lastUpdated ?? rec.updated_at),
            line: safeNum(rec.line),
            odds: safeNum(rec.odds),
            opponent: safeStr(rec.opponent ?? rec.team),
          };
        });

        if (!mounted) return;
        setOpportunities(mapped);
        // Ensure selected player exists
        if (!selectedPlayer && mapped.length > 0) setSelectedPlayer(mapped[0].player ?? null);
      } catch (err) {
        // Keep previous data on failure
        // eslint-disable-next-line no-console
        console.warn('Failed to fetch opportunities', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchOpportunities();
    const timer = window.setInterval(fetchOpportunities, 30_000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [selectedPlayer]);

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

  // Map selected player's opportunity to ChartDataPoint[] used by charts
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!selectedPlayer) return [];

    // Prefer the first matching opportunity for the selected player
    const op = opportunities.find(o => o.player === selectedPlayer) ?? opportunities[0];
    if (!op) return [];

    const recent = Array.isArray(op.recentForm) ? op.recentForm.slice() : [];
    // If there is no recentForm, create a synthetic series using lastUpdated and line as fallback
    const games = timeframe === '5' ? 5 : timeframe === '10' ? 10 : timeframe === '20' ? 20 : recent.length || 10;

    const points: ChartDataPoint[] = [];
    const now = Date.now();
    // align most recent form to the end
    const recentSlice = recent.length ? recent.slice(-games) : Array.from({ length: games }, () => NaN);

    for (let i = 0; i < recentSlice.length; i++) {
      const idx = recentSlice.length - 1 - i; // make last element most recent
      const date = new Date(now - (recentSlice.length - 1 - idx) * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const actual = Number.isFinite(recentSlice[idx] as number) ? (recentSlice[idx] as number) : NaN;
      points.push({
        date: dateStr,
        timestamp: Date.parse(dateStr),
        metrics: {
          actual: Number.isFinite(actual) ? actual : 0,
          line: typeof op.line === 'number' ? op.line : 0,
          odds: typeof op.odds === 'number' ? op.odds : 0,
        },
        metadata: { opponent: op.opponent }
      });
    }

    // If we have fewer than requested, pad older entries
    if (points.length < games) {
      const missing = games - points.length;
      for (let i = 0; i < missing; i++) {
        const date = new Date(now - (points.length + i) * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        points.unshift({ date: dateStr, timestamp: Date.parse(dateStr), metrics: { actual: 0, line: typeof op.line === 'number' ? op.line : 0, odds: typeof op.odds === 'number' ? op.odds : 0 }, metadata: { opponent: op.opponent } });
      }
    }

    return points;
  }, [opportunities, selectedPlayer, timeframe]);

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
    if (!showEV) return [] as Array<RawOpportunity & { __ev?: number; __kelly_fraction?: number; __recommended_stake?: number }>;
    const map = new Map(evData.map(o => [o.id, o]));
    const merged = opportunities.map(o => {
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
  }, [showEV, evData, opportunities, evSortDesc]);

  if (isLoading) return <div className="p-6">Loading predictions...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Predictions Dashboard</h1>
          <div className="flex items-center space-x-3">
            <select value={selectedPlayer ?? ''} onChange={(e) => setSelectedPlayer(e.target.value || null)} className="px-3 py-2 border rounded">
              {playerList.length === 0 ? <option value="">No players</option> : playerList.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <select value={timeframe} onChange={(e) => setTimeframe(e.target.value as '5' | '10' | '20' | 'all')} className="px-3 py-2 border rounded">
              <option value="5">Last 5</option>
              <option value="10">Last 10</option>
              <option value="20">Last 20</option>
              <option value="all">All</option>
            </select>

            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={headToHeadOnly} onChange={(e) => setHeadToHeadOnly(e.target.checked)} />
              <span className="text-sm">Head-to-head</span>
            </label>
          </div>
        </div>

        {FRONTEND_ENABLE_EV && (
          <div className="mb-4 bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={showEV}
                onChange={() => setShowEV(v => !v)}
              />
              Show EV
            </label>
            {showEV && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <span>Bankroll:</span>
                  <input
                    type="number"
                    min={0}
                    value={bankroll}
                    onChange={e => setBankroll(Number(e.target.value) || 0)}
                    className="border rounded px-2 py-1 w-28 text-sm"
                    placeholder="0"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setEvSortDesc(d => !d)}
                  className="text-xs px-2 py-1 border rounded bg-gray-100 hover:bg-gray-200"
                >
                  Sort EV {evSortDesc ? '↓' : '↑'}
                </button>
              </>
            )}
          </div>
        )}
        {FRONTEND_ENABLE_EV && showEV && (
          <div className="mb-4">
            <EVSummaryWidget />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
            <AdvancedPerformanceCharts data={chartData} metrics={metrics} enableExport enableFullscreen />
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            {/* Player performance small chart */}
            <h3 className="text-lg font-medium mb-2">Recent Performance vs Line</h3>
            <PlayerPerformanceChart
              data={chartData.map(d => ({ date: d.date, actual: Number(d.metrics.actual ?? 0), line: Number(d.metrics.line ?? 0), opponent: ((d.metadata as unknown) as { opponent?: string })?.opponent }))}
              lastN={timeframe === '5' ? 5 : timeframe === '10' ? 10 : timeframe === '20' ? 20 : undefined}
            />

            <h3 className="text-lg font-medium mt-4 mb-2">Odds Aggregation</h3>
            <OddsAggregationChart
              data={chartData.map((d) => ({ label: d.date, odds: Number(d.metrics.odds ?? 0) })) as OddsPoint[]}
            />
            {FRONTEND_ENABLE_EV && showEV && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2 flex items-center gap-2">Opportunities (EV)</h3>
                <div className="max-h-64 overflow-auto text-sm divide-y">
                  {evMerged.length === 0 && (
                    <div className="py-2 text-xs text-gray-500">No opportunities mapped.</div>
                  )}
                  {evMerged.map(o => (
                    <div key={o.id} className="py-2 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{o.player || o.id}</div>
                        <div className="text-[11px] text-gray-500">Line {typeof o.line === 'number' ? o.line : '-'} | Odds {typeof o.odds === 'number' ? o.odds : '-'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {o.__ev != null ? (
                          <EVBadge
                            edgePct={o.__ev}
                            className=""
                          />
                        ) : (
                          <span className="text-[11px] text-gray-400">-</span>
                        )}
                        {o.__kelly_fraction && bankroll > 0 && (
                          <span className="text-[10px] text-gray-500" title={`Kelly ${(o.__kelly_fraction * 100).toFixed(2)}%` + (o.__recommended_stake ? ` | Stake $${o.__recommended_stake.toFixed(2)}` : '')}>
                            {(o.__kelly_fraction * 100).toFixed(1)}%{o.__recommended_stake ? ` ($${o.__recommended_stake.toFixed(0)})` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {FRONTEND_ENABLE_EV && showEV && (
              <div className="mt-6">
                <ValuePanel sport="MLB" market="player_props" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionsDashboard;
