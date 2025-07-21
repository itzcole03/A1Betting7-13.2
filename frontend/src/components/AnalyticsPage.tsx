import React from 'react';
// @ts-expect-error TS(6142): Module './Analytics' was resolved to 'C:/Users/bcm... Remove this comment to see the full error message
import Analytics from './Analytics';

const AnalyticsPage: React.FC = () => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <main style={{ minHeight: '100vh', background: 'linear-gradient(120deg, #232526, #414345)' }}>
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <header style={{ padding: '2rem 0', textAlign: 'center' }}>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>Analytics</h1>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <p style={{ color: '#b0b0b0', fontSize: '1.2rem' }}>
        Explore real-time analytics, ML model health, and actionable insights.
      </p>
    </header>
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Analytics />
  </main>
);

export default AnalyticsPage;
