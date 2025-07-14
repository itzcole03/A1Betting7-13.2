import React from 'react';
import Analytics from './Analytics';

const AnalyticsPage: React.FC = () => (
  <main style={{ minHeight: '100vh', background: 'linear-gradient(120deg, #232526, #414345)' }}>
    <header style={{ padding: '2rem 0', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>Analytics</h1>
      <p style={{ color: '#b0b0b0', fontSize: '1.2rem' }}>
        Explore real-time analytics, ML model health, and actionable insights.
      </p>
    </header>
    <Analytics />
  </main>
);

export default AnalyticsPage;
