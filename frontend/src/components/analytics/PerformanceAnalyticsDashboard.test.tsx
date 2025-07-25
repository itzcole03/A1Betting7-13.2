import { render, screen } from '@testing-library/react';
import PerformanceAnalyticsDashboard from './PerformanceAnalyticsDashboard';

describe('PerformanceAnalyticsDashboard', () => {
  it('renders without crashing', () => {
    render(<PerformanceAnalyticsDashboard />);
    expect(screen.getByText(/Analytics Widget/i)).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<PerformanceAnalyticsDashboard />);
    expect(asFragment()).toMatchSnapshot();
  });
});
