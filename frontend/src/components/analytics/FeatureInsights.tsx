import React from 'react';

const FeatureInsights: React.FC = () => (
  <div
    style={{
      background: 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)',
      borderRadius: 16,
      color: '#fff',
      padding: 28,
      minWidth: 320,
    }}
  >
    <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Feature Insights</h2>
    <p style={{ color: '#e0e0e0', marginBottom: 0 }}>
      Feature importance and analysis visualizations will be shown here.
    </p>
  </div>
);

export default FeatureInsights;
