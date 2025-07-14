import React from 'react';

/**
 * Stub Line chart component for Chart.js override.
 */
export const Line: React.FC<any> = props => <div data-testid='chart-line' {...props} />;

/**
 * Stub Bar chart component for Chart.js override.
 */
export const Bar: React.FC<any> = props => <div data-testid='chart-bar' {...props} />;

/**
 * Stub Doughnut chart component for Chart.js override.
 */
export const Doughnut: React.FC<any> = props => <div data-testid='chart-doughnut' {...props} />;

/**
 * Stub Radar chart component for Chart.js override.
 */
export const Radar: React.FC<any> = props => <div data-testid='chart-radar' {...props} />;

/**
 * Stub Scatter chart component for Chart.js override.
 */
export const Scatter: React.FC<any> = props => <div data-testid='chart-scatter' {...props} />;

/**
 * Stub Chart component for Chart.js override (generic entry point).
 */
export const Chart: React.FC<any> = props => <div data-testid='chart-generic' {...props} />;
