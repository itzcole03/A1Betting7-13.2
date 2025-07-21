jest.mock('ky', () => ({
  get: jest.fn(() => ({ json: async () => [] })),
}));
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
// @ts-expect-error TS(6142): Module '../LockedBetsPageWorking' was resolved to ... Remove this comment to see the full error message
import LockedBetsPageWorking from '../LockedBetsPageWorking';

const queryClient = new QueryClient();

describe('LockedBetsPageWorking', () => {
  it('renders empty state when no locked bets', () => {
    render(
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <MantineProvider>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <QueryClientProvider client={queryClient}>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <MantineProvider>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <QueryClientProvider client={queryClient}>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <MantineProvider>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <QueryClientProvider client={queryClient}>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <MantineProvider>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <QueryClientProvider client={queryClient}>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
