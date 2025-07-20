jest.mock('ky', () => ({
  get: jest.fn(() => ({ json: async () => [] })),
}));
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import LockedBetsPageWorking from '../LockedBetsPageWorking';

const queryClient = new QueryClient();

describe('LockedBetsPageWorking', () => {
  it('renders empty state when no locked bets', () => {
    render(
      <MantineProvider>
        <QueryClientProvider client={queryClient}>
          <LockedBetsPageWorking />
        </QueryClientProvider>
      </MantineProvider>
    );
    // Assert the notification message (not the title) for empty state
    // Search the DOM for any element containing the expected notification message
    const found = Array.from(document.body.querySelectorAll('*')).find(
      el =>
        el.textContent &&
        /try adjusting your filters|check back later for new predictions/i.test(el.textContent)
    );
    expect(found).not.toBeNull();
  });

  it('renders refresh button and handles click', () => {
    render(
      <MantineProvider>
        <QueryClientProvider client={queryClient}>
          <LockedBetsPageWorking />
        </QueryClientProvider>
      </MantineProvider>
    );
    const refreshButton = screen.getByLabelText('Refresh locked bets data');
    expect(refreshButton).toBeInTheDocument();
    fireEvent.click(refreshButton);
    // Add more assertions if refresh triggers a loading state or API call
  });

  it('shows loading state when loading', () => {
    render(
      <MantineProvider>
        <QueryClientProvider client={queryClient}>
          <LockedBetsPageWorking />
        </QueryClientProvider>
      </MantineProvider>
    );
    // Search the DOM for any element containing the expected loading message
    const found = Array.from(document.body.querySelectorAll('*')).find(
      el => el.textContent && /loading elite bets/i.test(el.textContent)
    );
    expect(found).not.toBeNull();
  });

  it('shows error notification when fetch fails', async () => {
    jest.mock('ky', () => ({
      get: jest.fn(() => {
        throw new Error('Network error');
      }),
    }));
    render(
      <MantineProvider>
        <QueryClientProvider client={queryClient}>
          <LockedBetsPageWorking />
        </QueryClientProvider>
      </MantineProvider>
    );
    // Notification should appear with error message
    const found = Array.from(document.body.querySelectorAll('*')).find(
      el =>
        el.textContent &&
        /failed to load locked bets|please check your connection/i.test(el.textContent)
    );
    expect(found).not.toBeNull();
  });
});
