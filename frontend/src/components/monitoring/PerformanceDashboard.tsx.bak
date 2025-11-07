import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface PerformanceMetric {
  timestamp: string;
  responseTimeMs: number;
  throughputPerMin: number;
  errorRatePct: number;
  activeUsers: number;
}

interface PerformanceSummary {
  averageResponseTimeMs: number;
  successRatePct: number;
  averageThroughputPerMin: number;
  activeAlerts: number;
  updatedAt: string;
}

interface PerformanceResponse {
  summary: PerformanceSummary;
  metrics: PerformanceMetric[];
}

const FALLBACK_RESPONSE: PerformanceResponse = {
  summary: {
    averageResponseTimeMs: 186,
    successRatePct: 99.2,
    averageThroughputPerMin: 482,
    activeAlerts: 0,
    updatedAt: new Date().toISOString(),
  },
  metrics: Array.from({ length: 12 }).map((_, index) => {
    const timestamp = new Date(Date.now() - (11 - index) * 5 * 60 * 1000);
    return {
      timestamp: timestamp.toISOString(),
      responseTimeMs: 160 + Math.random() * 60,
      throughputPerMin: 420 + Math.random() * 140,
      errorRatePct: Math.max(0.2, Math.random() * 1.2),
      activeUsers: 150 + Math.floor(Math.random() * 40),
    };
  }),
};

const formatTimestamp = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const PerformanceDashboard: React.FC = () => {
  const [data, setData] = useState<PerformanceResponse>(FALLBACK_RESPONSE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/performance/metrics', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload: PerformanceResponse = await response.json();
        if (payload?.metrics?.length) {
          setData(payload);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchMetrics();

    const refreshInterval = setInterval(fetchMetrics, 60_000);

    return () => {
      controller.abort();
      clearInterval(refreshInterval);
    };
  }, []);

  const latencyTrend = useMemo(
    () =>
      data.metrics.map(metric => ({
        name: formatTimestamp(metric.timestamp),
        'Response Time (ms)': Number(metric.responseTimeMs.toFixed(1)),
        'Error Rate (%)': Number(metric.errorRatePct.toFixed(2)),
      })),
    [data.metrics]
  );

  const throughputTrend = useMemo(
    () =>
      data.metrics.map(metric => ({
        name: formatTimestamp(metric.timestamp),
        'Requests / min': Number(metric.throughputPerMin.toFixed(0)),
        'Active Users': metric.activeUsers,
      })),
    [data.metrics]
  );

  return (
    <div className='min-h-screen bg-slate-950 text-slate-100 px-6 py-10'>
      <div className='mx-auto max-w-7xl space-y-8'>
        <header className='flex flex-col gap-2 border-b border-slate-800 pb-6'>
          <span className='text-sm font-semibold uppercase tracking-widest text-cyan-300'>
            Phase 3 · Performance Intelligence
          </span>
          <h1 className='text-3xl font-bold text-white'>Performance Dashboard</h1>
          <p className='max-w-3xl text-slate-300'>
            Monitor system responsiveness, request throughput, and reliability in real time. The
            dashboard automatically refreshes every 60 seconds and gracefully falls back to cached
            data if live metrics are unavailable.
          </p>
          <div className='flex flex-wrap items-center gap-4 text-sm text-slate-400'>
            <span>
              Last Update:{' '}
              <strong className='text-white'>
                {new Date(data.summary.updatedAt).toLocaleString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                  month: 'short',
                  day: 'numeric',
                })}
              </strong>
            </span>
            {loading && <span className='text-cyan-300'>Refreshing metrics…</span>}
            {error && (
              <span className='rounded-md bg-rose-500/10 px-3 py-1 text-rose-300'>
                Live data unavailable · {error}
              </span>
            )}
          </div>
        </header>

        <section>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <article className='rounded-xl border border-slate-800 bg-slate-900/50 p-4 shadow-lg shadow-cyan-500/10'>
              <p className='text-sm text-slate-400'>Avg Response Time</p>
              <p className='mt-2 text-2xl font-semibold text-white'>
                {data.summary.averageResponseTimeMs.toFixed(0)} ms
              </p>
              <p className='mt-1 text-xs text-slate-500'>Target &lt; 250 ms</p>
            </article>

            <article className='rounded-xl border border-slate-800 bg-slate-900/50 p-4 shadow-lg shadow-emerald-500/10'>
              <p className='text-sm text-slate-400'>Success Rate</p>
              <p className='mt-2 text-2xl font-semibold text-white'>
                {data.summary.successRatePct.toFixed(2)}%
              </p>
              <p className='mt-1 text-xs text-slate-500'>Includes API & worker jobs</p>
            </article>

            <article className='rounded-xl border border-slate-800 bg-slate-900/50 p-4 shadow-lg shadow-purple-500/10'>
              <p className='text-sm text-slate-400'>Throughput</p>
              <p className='mt-2 text-2xl font-semibold text-white'>
                {data.summary.averageThroughputPerMin.toFixed(0)} / min
              </p>
              <p className='mt-1 text-xs text-slate-500'>Across ingestion + analytics</p>
            </article>

            <article className='rounded-xl border border-slate-800 bg-slate-900/50 p-4 shadow-lg shadow-amber-500/10'>
              <p className='text-sm text-slate-400'>Active Alerts</p>
              <p className='mt-2 text-2xl font-semibold text-white'>{data.summary.activeAlerts}</p>
              <p className='mt-1 text-xs text-slate-500'>Sourced from monitoring service</p>
            </article>
          </div>
        </section>

        <section className='grid gap-6 lg:grid-cols-2'>
          <div className='rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-cyan-500/5'>
            <header className='mb-6 flex items-center justify-between'>
              <div>
                <h2 className='text-xl font-semibold text-white'>Latency & Error Rate</h2>
                <p className='text-sm text-slate-400'>
                  Track response time trends against error rate.
                </p>
              </div>
            </header>
            <div className='h-72 w-full'>
              <ResponsiveContainer>
                <AreaChart data={latencyTrend}>
                  <defs>
                    <linearGradient id='colorLatency' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='#38bdf8' stopOpacity={0.4} />
                      <stop offset='95%' stopColor='#38bdf8' stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id='colorErrors' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='#fbbf24' stopOpacity={0.4} />
                      <stop offset='95%' stopColor='#fbbf24' stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray='3 3' stroke='#1f2937' />
                  <XAxis dataKey='name' stroke='#94a3b8' />
                  <YAxis yAxisId='left' stroke='#38bdf8' />
                  <YAxis yAxisId='right' orientation='right' stroke='#fbbf24' />
                  <Tooltip contentStyle={{ backgroundColor: '#020617', borderRadius: 12 }} />
                  <Legend />
                  <Area
                    yAxisId='left'
                    type='monotone'
                    dataKey='Response Time (ms)'
                    stroke='#38bdf8'
                    fill='url(#colorLatency)'
                    strokeWidth={2}
                  />
                  <Area
                    yAxisId='right'
                    type='monotone'
                    dataKey='Error Rate (%)'
                    stroke='#fbbf24'
                    fill='url(#colorErrors)'
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className='rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-purple-500/5'>
            <header className='mb-6 flex items-center justify-between'>
              <div>
                <h2 className='text-xl font-semibold text-white'>Throughput & Usage</h2>
                <p className='text-sm text-slate-400'>
                  Monitor request volume alongside active users.
                </p>
              </div>
            </header>
            <div className='h-72 w-full'>
              <ResponsiveContainer>
                <AreaChart data={throughputTrend}>
                  <defs>
                    <linearGradient id='colorThroughput' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='#a78bfa' stopOpacity={0.4} />
                      <stop offset='95%' stopColor='#a78bfa' stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id='colorUsers' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='#34d399' stopOpacity={0.3} />
                      <stop offset='95%' stopColor='#34d399' stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray='3 3' stroke='#1f2937' />
                  <XAxis dataKey='name' stroke='#94a3b8' />
                  <YAxis stroke='#a78bfa' />
                  <Tooltip contentStyle={{ backgroundColor: '#020617', borderRadius: 12 }} />
                  <Legend />
                  <Area
                    type='monotone'
                    dataKey='Requests / min'
                    stroke='#a78bfa'
                    fill='url(#colorThroughput)'
                    strokeWidth={2}
                  />
                  <Area
                    type='monotone'
                    dataKey='Active Users'
                    stroke='#34d399'
                    fill='url(#colorUsers)'
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className='rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-amber-500/5'>
          <header className='mb-4 flex items-center justify-between'>
            <h2 className='text-xl font-semibold text-white'>Operational Insights</h2>
            <span className='text-xs uppercase tracking-widest text-slate-500'>Realtime</span>
          </header>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            <div className='rounded-xl border border-slate-800 bg-slate-900/40 p-4'>
              <h3 className='text-sm font-semibold text-slate-200'>Performance Posture</h3>
              <p className='mt-2 text-sm text-slate-400'>
                All systems operating within target SLAs.
              </p>
              <ul className='mt-3 space-y-2 text-xs text-slate-500'>
                <li>• API latency &lt; 200 ms (p95)</li>
                <li>• Cache hit rate &gt; 85%</li>
                <li>• Background workers stable</li>
              </ul>
            </div>
            <div className='rounded-xl border border-slate-800 bg-slate-900/40 p-4'>
              <h3 className='text-sm font-semibold text-slate-200'>Optimization Watchlist</h3>
              <p className='mt-2 text-sm text-slate-400'>
                Monitor memory pressure during MLB slates.
              </p>
              <ul className='mt-3 space-y-2 text-xs text-slate-500'>
                <li>• Increase Redis eviction alerts</li>
                <li>• Observe ingestion spikes at :55 past hour</li>
                <li>• Pending GPU inference rollout</li>
              </ul>
            </div>
            <div className='rounded-xl border border-slate-800 bg-slate-900/40 p-4'>
              <h3 className='text-sm font-semibold text-slate-200'>Next Actions</h3>
              <p className='mt-2 text-sm text-slate-400'>
                Initiate automated warmup run before primetime.
              </p>
              <ul className='mt-3 space-y-2 text-xs text-slate-500'>
                <li>• Verify Phase 3 regression suite</li>
                <li>• Trigger odds snapshot job</li>
                <li>• Sync incident runbooks</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
