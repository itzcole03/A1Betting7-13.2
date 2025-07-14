import React from 'react';

export interface TrendAnalysisChartProps {
  anomalies: { type: string; detected: boolean }[];
}

const TrendAnalysisChart: React.FC<TrendAnalysisChartProps> = ({ anomalies }) => {
  return (
    <div key={241917}>
      <h3 key={661229}>Trend Analysis</h3>
      <ul key={249713}>
        {anomalies.map((a, i) => (
          <li key={i}>
            {a.type} {a.detected ? 'Detected' : 'Not Detected'}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Usage example:
// <TrendAnalysisChart anomalies={[{ type: 'Spike', detected: true }]} />

export default TrendAnalysisChart;
