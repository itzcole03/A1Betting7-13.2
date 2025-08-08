import { act, render, screen } from '@testing-library/react';
import App from '../App';

describe('Dashboard Navigation E2E', () => {
  beforeEach(() => {
    localStorage.setItem('onboardingComplete', 'true');
    localStorage.setItem('token', 'test-token');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'test-user',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['admin'],
      })
    );
  });
  it('renders dashboard and navigates between main routes', async () => {
    render(<App />);
    // Wait for dashboard main heading
    expect(
      await screen.findByText(content => /sports analytics/i.test(content))
    ).toBeInTheDocument();
    // Navigate to AI/ML Models
    const mlTab = await screen.findByRole('link', { name: /AI\/ML Models/i });
    act(() => {
      mlTab.click();
    });
    expect(
      await screen.findByText(content => /ml model center/i.test(content))
    ).toBeInTheDocument();
    // Navigate to Betting Interface
    const bettingTab = await screen.findByRole('link', { name: /Betting Interface/i });
    act(() => {
      bettingTab.click();
    });
    expect(
      await screen.findByText(content => /unified betting interface/i.test(content))
    ).toBeInTheDocument();
    // Navigate to Arbitrage
    const arbitrageTab = await screen.findByRole('link', { name: /Arbitrage/i });
    act(() => {
      arbitrageTab.click();
    });
    expect(
      await screen.findByText(content => /arbitrage opportunities/i.test(content))
    ).toBeInTheDocument();
  });
});
