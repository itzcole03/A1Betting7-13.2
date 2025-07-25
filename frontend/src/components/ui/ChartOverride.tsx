import React from 'react';

/**
 * Stub Line chart component for Chart.js override.
 */
// @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
export const _Line: React.FC<unknown> = props => <div data-testid='chart-line' {...props} />;

/**
 * Stub Bar chart component for Chart.js override.
 */
// @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
export const _Bar: React.FC<unknown> = props => <div data-testid='chart-bar' {...props} />;

/**
 * Stub Doughnut chart component for Chart.js override.
 */
// @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
export const _Doughnut: React.FC<unknown> = props => <div data-testid='chart-doughnut' {...props} />;

/**
 * Stub Radar chart component for Chart.js override.
 */
// @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
export const _Radar: React.FC<unknown> = props => <div data-testid='chart-radar' {...props} />;

/**
 * Stub Scatter chart component for Chart.js override.
 */
// @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
export const _Scatter: React.FC<unknown> = props => <div data-testid='chart-scatter' {...props} />;

/**
 * Stub Chart component for Chart.js override (generic entry point).
 */
// @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
export const _Chart: React.FC<unknown> = props => <div data-testid='chart-generic' {...props} />;
