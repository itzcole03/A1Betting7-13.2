import { render, screen } from '@testing-library/react';
import AnalyticsWidget from './AnalyticsWidget';

describe('AnalyticsWidget', () => {
  it('renders data correctly', () => {
    const data = { id: 1, name: 'Metric 1', value: 100, score: 0.5 };
    render(<AnalyticsWidget data={data} />);
    expect(screen.getByText(/Analytics Widget/i)).toBeInTheDocument();
    expect(screen.getByText(/Metric 1/i)).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const data = { id: 1, name: 'Metric 1', value: 100, score: 0.5 };
    const { asFragment } = render(<AnalyticsWidget data={data} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
