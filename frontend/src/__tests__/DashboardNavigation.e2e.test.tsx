import { act, render, screen } from '@testing-library/react';
import UserFriendlyApp from '../components/user-friendly/UserFriendlyApp';

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
    render(<UserFriendlyApp />);
    // Wait for dashboard main heading (robust matcher for split/nested nodes)
    expect(
      await screen.findByText((content, node) => {
        // Check if node or its children contain the text
        const text = node?.textContent || '';
        return /sports analytics/i.test(text);
      })
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
