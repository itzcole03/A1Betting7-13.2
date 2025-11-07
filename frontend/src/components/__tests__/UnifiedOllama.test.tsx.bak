import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import UnifiedOllama from '../UnifiedOllama';
// Ensure manual mock is used for unifiedApiService
jest.mock('src/services/unifiedApiService');
// Mock trending suggestions hook to avoid async state updates during tests
// Mock trending suggestions hook to avoid async state updates during tests
jest.mock('../../hooks/useTrendingSuggestions', () => ({
  useTrendingSuggestions: () => ({ suggestions: [], loading: false }),
}));

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { _AppProvider } from '../../contexts/AppContext';
import { _AuthProvider } from '../../contexts/AuthContext';
import { _ThemeProvider } from '../../contexts/ThemeContext';
const MockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={new QueryClient()}>
    <_AuthProvider>
      <MemoryRouter>
        <_ThemeProvider>
          <_AppProvider>{children}</_AppProvider>
        </_ThemeProvider>
      </MemoryRouter>
    </_AuthProvider>
  </QueryClientProvider>
);

describe('UnifiedOllama', () => {
  it('renders onboarding banner and chat input', () => {
    render(
      <MockProvider>
        <UnifiedOllama />
      </MockProvider>
    );
    expect(screen.getByText(/Welcome!/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask me about any sports prop/i)).toBeInTheDocument();
  });

  it('shows best bets sidebar', () => {
    render(
      <MockProvider>
        <UnifiedOllama />
      </MockProvider>
    );
    expect(screen.getByText(/Today\'s Best Bets/i)).toBeInTheDocument();
    // No Refresh button in the UI, so we do not assert for it
  });

  it('allows user to type and send a message', async () => {
    render(
      <MockProvider>
        <UnifiedOllama />
      </MockProvider>
    );
    const input = screen.getByPlaceholderText(/Ask me about any sports prop/i);
    fireEvent.change(input, { target: { value: 'Show me best bets' } });
    expect(input).toHaveValue('Show me best bets');
    const sendButton = screen.getByRole('button', { name: /Send/i });
    fireEvent.click(sendButton);
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/Ask me about any sports prop/i)).toHaveValue('')
    );
  });

  // Add more tests for hooks, models, and edge cases as needed
});
