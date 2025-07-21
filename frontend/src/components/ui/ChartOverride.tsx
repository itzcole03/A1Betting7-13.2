import React from 'react';

/**
 * Stub Line chart component for Chart.js override.
 */
// @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
export const Line: React.FC<any> = props => <div data-testid='chart-line' {...props} />;

/**
 * Stub Bar chart component for Chart.js override.
 */
// @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
export const Bar: React.FC<any> = props => <div data-testid='chart-bar' {...props} />;

/**
 * Stub Doughnut chart component for Chart.js override.
 */
// @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
export const Doughnut: React.FC<any> = props => <div data-testid='chart-doughnut' {...props} />;

/**
 * Stub Radar chart component for Chart.js override.
 */
// @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
export const Radar: React.FC<any> = props => <div data-testid='chart-radar' {...props} />;

/**
 * Stub Scatter chart component for Chart.js override.
 */
// @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
export const Scatter: React.FC<any> = props => <div data-testid='chart-scatter' {...props} />;

/**
 * Stub Chart component for Chart.js override (generic entry point).
 */
// @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
export const Chart: React.FC<any> = props => <div data-testid='chart-generic' {...props} />;
