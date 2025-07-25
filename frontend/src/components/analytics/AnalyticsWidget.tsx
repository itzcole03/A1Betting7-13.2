import React from 'react';

interface AnalyticsWidgetProps {
  data: any;
}

const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({ data }) => {
  return (
    <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
      <h4>Analytics Widget</h4>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default AnalyticsWidget;
