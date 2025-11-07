import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import type { ChartDataset, ChartConfiguration } from 'chart.js';

// Chart.register may not exist on a lightweight test mock; guard the call.
if (typeof (Chart as any).register === 'function') {
  (Chart as any).register(...(registerables as any));
}

export type PerformancePoint = {
  date: string; // ISO
  actual: number; // actual player stat (e.g., points)
  line: number; // betting line
  opponent?: string;
};

type Props = {
  title?: string;
  data: PerformancePoint[];
  lastN?: number; // show last N games
};

export const PlayerPerformanceChart: React.FC<Props> = ({ title = 'Player Performance vs Line', data, lastN }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart<'line', number[], string> | null>(null);

  useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

    const points = lastN ? data.slice(-lastN) : data;

    const labels = points.map((p) => new Date(p.date).toLocaleDateString());
    const actualDataset: ChartDataset<'line', number[]> = {
      label: 'Actual',
      data: points.map((p) => p.actual),
      borderColor: 'rgba(75,192,192,1)',
      backgroundColor: 'rgba(75,192,192,0.2)',
      tension: 0.2,
      yAxisID: 'y',
      pointRadius: 4,
    };

    const lineDataset: ChartDataset<'line', number[]> = {
      label: 'Line',
      data: points.map((p) => p.line),
      borderColor: 'rgba(255,99,132,1)',
      backgroundColor: 'rgba(255,99,132,0.2)',
      borderDash: [6, 4],
      tension: 0.1,
      yAxisID: 'y',
      pointRadius: 2,
    };

    const datasets: ChartDataset<'line', number[]>[] = [actualDataset, lineDataset];

    if (chartRef.current) {
      chartRef.current.data.labels = labels;
      chartRef.current.data.datasets = datasets;
      chartRef.current.update();
      return;
    }

    const config: ChartConfiguration<'line', number[], string> = {
      type: 'line',
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: !!title, text: title },
          tooltip: { mode: 'index', intersect: false },
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        scales: {
          y: { type: 'linear', position: 'left', title: { display: true, text: 'Value' } },
        },
      },
    };

    chartRef.current = new Chart(ctx, config);

    return () => chartRef.current?.destroy();
  }, [data, lastN, title]);

  return (
    <div style={{ height: 360 }}>
      <canvas ref={canvasRef} />
    </div>
  );
};


// Pure helper to map performance points into chart-friendly arrays.
// Exported for unit testing and reuse.
export function mapPerformancePoints(points: PerformancePoint[], lastN?: number) {
  const pts = typeof lastN === 'number' && lastN > 0 ? points.slice(-lastN) : points.slice();
  const labels = pts.map((p) => new Date(p.date).toLocaleDateString());
  const actual = pts.map((p) => p.actual);
  const line = pts.map((p) => p.line);
  return { points: pts, labels, actual, line };
}

export default PlayerPerformanceChart;

