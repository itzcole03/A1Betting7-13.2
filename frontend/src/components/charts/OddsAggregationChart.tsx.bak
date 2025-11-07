import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import type { ChartDataset, ChartConfiguration } from 'chart.js';

Chart.register(...registerables);

export type OddsPoint = {
  label: string;
  odds: number; // American odds or implied probability as decimal
};

type Props = {
  title?: string;
  data: OddsPoint[];
};

export const OddsAggregationChart: React.FC<Props> = ({ title = 'Odds Aggregation', data }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart<'bar', number[], string> | null>(null);

  useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

    const labels = data.map((d) => d.label);
    const values = data.map((d) => d.odds);

    const barDataset: ChartDataset<'bar', number[]> = {
      label: 'Odds',
      data: values,
      backgroundColor: values.map((v) => (v >= 0 ? 'rgba(54,162,235,0.6)' : 'rgba(255,159,64,0.6)')),
      borderColor: 'rgba(0,0,0,0.08)',
      borderWidth: 1,
    };

    if (chartRef.current) {
      chartRef.current.data.labels = labels;
      chartRef.current.data.datasets = [barDataset];
      chartRef.current.update();
      return;
    }
    const config: ChartConfiguration<'bar', number[], string> = {
      type: 'bar',
      data: {
        labels,
        datasets: [barDataset],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: !!title, text: title },
          legend: { display: false },
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Odds / Implied' } },
        },
      },
    };

    chartRef.current = new Chart(ctx, config);

    return () => chartRef.current?.destroy();
  }, [data, title]);

  return (
    <div style={{ height: 320 }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default OddsAggregationChart;
