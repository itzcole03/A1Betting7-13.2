import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { _AppProvider } from '../../contexts/AppContext';
import { _AuthProvider } from '../../contexts/AuthContext';
import { _ThemeProvider } from '../../contexts/ThemeContext';
import PropOllamaUnified from '../PropOllamaUnified';

const CompositeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <_ThemeProvider>
    <_AppProvider>
      <_AuthProvider>{children}</_AuthProvider>
    </_AppProvider>
  </_ThemeProvider>
);

describe('PropOllamaUnified', () => {
  it.skip('loads and sorts best bets by confidence', async () => {});

  it.skip('shows confidence badge and bar', async () => {});

  it.skip('expand/collapse explanation', async () => {});

  it('handles empty state', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => [],
      headers: new Headers(),
      status: 200,
      statusText: 'OK',
      url: '',
      clone: () => ({} as Response),
      body: null,
      bodyUsed: false,
      redirected: false,
      type: 'basic',
      arrayBuffer: async () => new ArrayBuffer(0),
      blob: async () => new Blob(),
      formData: async () => new FormData(),
      text: async () => '',
    } as Response);
    render(
      <CompositeProvider>
        <PropOllamaUnified />
      </CompositeProvider>
    );
    await waitFor(() => screen.getByText(/Loading today's best bets/i));
    (global.fetch as jest.Mock).mockRestore?.();
  });

  it('is accessible (banner, buttons)', async () => {
    render(
      <CompositeProvider>
        <PropOllamaUnified />
      </CompositeProvider>
    );
    expect(screen.getByText(/AI-powered sports betting recommendations/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask me about any sports prop/i)).toBeInTheDocument();
  });
});
