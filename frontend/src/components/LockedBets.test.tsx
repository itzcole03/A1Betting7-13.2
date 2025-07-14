import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LockedBets from './LockedBets';

// Mock fetch
const mockBets = [
  {
    id: '1',
    sportsbook: 'PrizePicks',
    label: 'PrizePicks',
    event: 'Event A',
    market: 'Market A',
    odds: '+100',
    prediction: 'OVER',
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    sportsbook: 'FanDuel',
    label: 'FanDuel',
    event: 'Event B',
    market: 'Market B',
    odds: '-110',
    prediction: 'UNDER',
    timestamp: new Date().toISOString(),
  },
];

global.fetch = jest.fn(url => {
  if (url.includes('prizepicks')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve([mockBets[0]]) });
  }
  if (url.includes('fanduel')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve([mockBets[1]]) });
  }
  return Promise.resolve({ ok: false, json: () => Promise.resolve([]) });
}) as any;

describe('LockedBets', () => {
  it('shows loading spinner initially', () => {
    render(<LockedBets />);
    expect(screen.getByText(/loading locked bets/i)).toBeInTheDocument();
  });

  it('shows bets after loading', async () => {
    render(<LockedBets />);
    await waitFor(() => expect(screen.getByText(/Event A/)).toBeInTheDocument());
    expect(screen.getByText(/Event B/)).toBeInTheDocument();
  });

  it('filters by source', async () => {
    render(<LockedBets />);
    await waitFor(() => expect(screen.getByText(/Event A/)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Sources:'), {
      target: { selectedOptions: [{ value: 'PrizePicks' }] },
    });
    expect(screen.getByText(/Event A/)).toBeInTheDocument();
    expect(screen.queryByText(/Event B/)).not.toBeInTheDocument();
  });

  it('filters by search', async () => {
    render(<LockedBets />);
    await waitFor(() => expect(screen.getByText(/Event A/)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Search:'), { target: { value: 'Market B' } });
    expect(screen.getByText(/Event B/)).toBeInTheDocument();
    expect(screen.queryByText(/Event A/)).not.toBeInTheDocument();
  });

  it('shows empty message if no bets', async () => {
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    );
    render(<LockedBets />);
    await waitFor(() => expect(screen.getByText(/no locked bets available/i)).toBeInTheDocument());
  });

  it('shows error toast on fetch error', async () => {
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({ ok: false, json: () => Promise.resolve([]) })
    );
    render(<LockedBets />);
    await waitFor(() =>
      expect(screen.getByText(/failed to fetch locked bets/i)).toBeInTheDocument()
    );
  });
});
