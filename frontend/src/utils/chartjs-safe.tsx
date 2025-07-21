// Safe replacement for react-chartjs-2 imports;
// This module provides the same API as react-chartjs-2 but with built-in error handling;

import React from 'react';
// @ts-expect-error TS(2307): Cannot find module '@/components/ui/ChartOverride'... Remove this comment to see the full error message
import { Line, Bar, Doughnut, Radar, Scatter, Chart } from '@/components/ui/ChartOverride';

// Export all chart components;
export { Line, Bar, Doughnut, Radar, Scatter, Chart };

// Also export with different names that might be used;
export const LineChart = Line;
export const BarChart = Bar;
export const DoughnutChart = Doughnut;
export const RadarChart = Radar;
export const ScatterChart = Scatter;

// Export Pie as alias for Doughnut;
export const Pie = Doughnut;
export const PieChart = Doughnut;

// Export Bubble as alias for Scatter;
export const Bubble = Scatter;
export const BubbleChart = Scatter;

// Export PolarArea as alias for Radar;
export const PolarArea = Radar;

// Re-export Chart.js types if needed;
export type { ChartData, ChartOptions } from 'chart.js';

// Default export for Chart component;
export default Chart;
