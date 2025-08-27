import React, { useEffect, useMemo, useState } from 'react';
import type { ChartData, ChartOptions } from 'chart.js';

// Lightweight wrapper that lazily loads Chart.js + react-chartjs-2.
// Falls back to a placeholder UI if the deps are not available.

interface PlayerPerformanceChartProps {
  data: Array<Record<string, unknown> & { date: string }>;
  metrics: string[];
  metricConfigs: Array<{ id: string; name: string; color?: string; format?: string }>;
  height?: number;
}

const PlayerPerformanceChart: React.FC<PlayerPerformanceChartProps> = ({ data, metrics, metricConfigs, height = 360 }) => {
  const [ChartComponents, setChartComponents] = useState<unknown | null | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // dynamic import so app doesn't crash if deps are missing
        const ChartJS = await import('chart.js/auto');
        const { Line } = await import('react-chartjs-2');

        if (mounted) setChartComponents({ ChartJS, Line });
      } catch (_err) {
        // If Chart.js isn't installed, set to null to render helpful fallback
        if (mounted) setChartComponents(null);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const labels = useMemo(() => data.map(d => d.date), [data]);

  const datasets = useMemo(() => {
    return metrics.map(metricId => {
      const cfg = metricConfigs.find(m => m.id === metricId) || { id: metricId, name: metricId, color: '#3B82F6' };
      return {
        label: cfg.name || metricId,
        data: data.map(d => (d[metricId] === undefined ? null : d[metricId])),
        borderColor: cfg.color || '#3B82F6',
        backgroundColor: (cfg.color || '#3B82F6') + '33',
        tension: 0.3,
        spanGaps: true,
        pointRadius: 2,
      };
    });
  }, [metrics, data, metricConfigs]);

  const chartData: ChartData<'line'> = {
    labels,
    datasets: datasets as unknown as ChartData<'line'>['datasets'],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { display: true },
      y: { display: true }
    }
  };

  if (ChartComponents === null) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 flex items-center justify-center" style={{ height }}>
        <div className="text-center text-gray-600">
          <p className="font-medium">Interactive Chart Unavailable</p>
          <p className="text-sm mt-2">Install `chart.js` and `react-chartjs-2` for full visuals.</p>
        </div>
      </div>
    );
  }

  const Line = (ChartComponents as any)?.Line;

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden">
      {Line ? (
  // @ts-expect-error dynamic import types
  <Line data={chartData} options={options} />
      ) : (
        <div className="bg-gray-100 rounded-lg p-6 flex items-center justify-center" style={{ height }}>
          <div className="text-center text-gray-600">
            <p className="font-medium">Chart loading…</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerPerformanceChart;
