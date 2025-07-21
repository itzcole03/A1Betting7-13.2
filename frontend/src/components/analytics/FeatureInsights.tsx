import React from 'react';

const FeatureInsights: React.FC = () => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <div
    style={{
      background: 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)',
      borderRadius: 16,
      color: '#fff',
      padding: 28,
      minWidth: 320,
    }}
  >
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Feature Insights</h2>
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <p style={{ color: '#e0e0e0', marginBottom: 0 }}>
      Feature importance and analysis visualizations will be shown here.
    </p>
  </div>
);

export default FeatureInsights;
