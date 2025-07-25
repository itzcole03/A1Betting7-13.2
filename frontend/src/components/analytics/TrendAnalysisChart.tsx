import React from 'react';

export interface TrendAnalysisChartProps {
  anomalies: { type: string; detected: boolean }[];
}

const _TrendAnalysisChart: React.FC<TrendAnalysisChartProps> = ({ anomalies }) => {
  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div key={241917}>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <h3 key={661229}>Trend Analysis</h3>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <ul key={249713}>
        {anomalies.map((a, i) => (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
