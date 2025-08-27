import React, { useEffect, useMemo, useState } from 'react';
import AdvancedPerformanceCharts, { ChartDataPoint, PerformanceMetric } from '../components/charts/AdvancedPerformanceCharts';

const mockPlayers = ['Shohei Ohtani', 'Mookie Betts', 'Mike Trout', 'Cody Bellinger'];

const PredictionsDashboard: React.FC = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<string>(mockPlayers[0]);
  const [timeframe, setTimeframe] = useState<'5' | '10' | '20' | 'all'>('10');
  const [headToHeadOnly, setHeadToHeadOnly] = useState(false);
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const metrics: PerformanceMetric[] = [
    { id: 'line', name: 'Betting Line', value: 0, change: 0, changePercent: 0, color: '#3B82F6', unit: '', format: 'decimal' },
    { id: 'actual', name: 'Actual Performance', value: 0, change: 0, changePercent: 0, color: '#10B981', unit: '', format: 'decimal' },
    { id: 'odds', name: 'Odds', value: 0, change: 0, changePercent: 0, color: '#F59E0B', unit: '', format: 'decimal' }
  ];

  // Generate mock per-player time series
  useEffect(() => {
    setIsLoading(true);

    const generate = () => {
      const now = Date.now();
      const games = timeframe === '5' ? 5 : timeframe === '10' ? 10 : timeframe === '20' ? 20 : 40;
      const out: ChartDataPoint[] = [];

      for (let i = games - 1; i >= 0; i--) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const line = +(Math.random() * 8 + 2).toFixed(1);
        const actual = +(line + (Math.random() - 0.5) * 3).toFixed(1);
        const odds = +(1.5 + Math.random() * 1.5).toFixed(2);

        out.push({
          date,
          timestamp: Date.parse(date),
          metrics: {
            line,
            actual,
            odds
          },
          metadata: { opponent: Math.random() > 0.5 ? 'Team A' : 'Team B' }
        });
      }

      setData(out);
      setIsLoading(false);
    };

    generate();

    const interval = setInterval(generate, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [selectedPlayer, timeframe, headToHeadOnly]);

  const handlePlayerChange = (p: string) => setSelectedPlayer(p);

  if (isLoading) return <div className="p-6">Loading predictions...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Predictions Dashboard</h1>
          <div className="flex items-center space-x-3">
            <select value={selectedPlayer} onChange={(e) => handlePlayerChange(e.target.value)} className="px-3 py-2 border rounded">
              {mockPlayers.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <select value={timeframe} onChange={(e) => setTimeframe(e.target.value as any)} className="px-3 py-2 border rounded">
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

        <AdvancedPerformanceCharts data={data} metrics={metrics} enableExport enableFullscreen />
      </div>
    </div>
  );
};

export default PredictionsDashboard;
export {};
