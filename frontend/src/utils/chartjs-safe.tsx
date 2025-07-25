// Safe replacement for react-chartjs-2 imports;
// This module provides the same API as react-chartjs-2 but with built-in error handling;

import React from 'react';
// @ts-expect-error TS(2307): Cannot find module '@/components/ui/ChartOverride'... Remove this comment to see the full error message
import { Line, Bar, Doughnut, Radar, Scatter, Chart } from '@/components/ui/ChartOverride';

// Export all chart components;
export { Line, Bar, Doughnut, Radar, Scatter, Chart };

// Also export with different names that might be used;
export const _LineChart = Line;
export const _BarChart = Bar;
export const _DoughnutChart = Doughnut;
export const _RadarChart = Radar;
export const _ScatterChart = Scatter;

// Export Pie as alias for Doughnut;
export const _Pie = Doughnut;
export const _PieChart = Doughnut;

// Export Bubble as alias for Scatter;
export const _Bubble = Scatter;
export const _BubbleChart = Scatter;

// Export PolarArea as alias for Radar;
export const _PolarArea = Radar;

// Re-export Chart.js types if needed;
export type { ChartData, ChartOptions } from 'chart.js';

// Default export for Chart component;
export default Chart;
