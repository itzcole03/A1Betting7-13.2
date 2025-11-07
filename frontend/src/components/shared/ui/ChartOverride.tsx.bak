import React from 'react';

type PlaceholderProps = React.HTMLAttributes<HTMLDivElement> & {
  'data-testid': string;
};

const ChartPlaceholder: React.FC<PlaceholderProps> = ({ 'data-testid': testId, ...props }) => (
  <div data-testid={testId} {...props} />
);

export const Line: React.FC<PlaceholderProps> = props => (
  <ChartPlaceholder data-testid='chart-line' {...props} />
);

export const Bar: React.FC<PlaceholderProps> = props => (
  <ChartPlaceholder data-testid='chart-bar' {...props} />
);

export const Doughnut: React.FC<PlaceholderProps> = props => (
  <ChartPlaceholder data-testid='chart-doughnut' {...props} />
);

export const Radar: React.FC<PlaceholderProps> = props => (
  <ChartPlaceholder data-testid='chart-radar' {...props} />
);

export const Scatter: React.FC<PlaceholderProps> = props => (
  <ChartPlaceholder data-testid='chart-scatter' {...props} />
);

export const Chart: React.FC<PlaceholderProps> = props => (
  <ChartPlaceholder data-testid='chart-generic' {...props} />
);

export default Chart;
