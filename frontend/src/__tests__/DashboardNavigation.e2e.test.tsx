import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UserFriendlyApp from '../components/user-friendly/UserFriendlyApp';
import React from 'react';

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
    render(
      <MemoryRouter>
        <UserFriendlyApp />
      </MemoryRouter>
    );
    // Wait for dashboard main heading (robust matcher for split/nested nodes)
    // Use robust matcher for split/nested heading text
    expect(await screen.findByTestId('propfinder-killer-heading')).toBeInTheDocument();
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
