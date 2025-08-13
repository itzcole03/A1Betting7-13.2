import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import UnifiedBettingInterface from '../components/betting/UnifiedBettingInterface';

const mockBets = [
  { id: 'bet-1', player: 'Shohei Ohtani', statType: 'Home Runs', value: 1.5, odds: 2.1 },
  { id: 'bet-2', player: 'Aaron Judge', statType: 'RBIs', value: 2.5, odds: 1.8 },
];
const mockArbitrage = {
  opportunities: [{ id: 'arb-1', description: 'MLB Arbitrage Opportunity', profit: 120.5 }],
};
const mockKelly = { kellyFraction: 0.18, expectedValue: 42.5 };

const server = setupServer(
  rest.get('/api/bets', (req: any, res: any, ctx: any) => {
    return res(ctx.json({ success: true, data: mockBets, error: null }));
  }),
  rest.get('/api/arbitrage', (req: any, res: any, ctx: any) => {
    return res(ctx.json({ success: true, data: mockArbitrage, error: null }));
  }),
  rest.post('/api/kelly/calculate', (req: any, res: any, ctx: any) => {
    return res(ctx.json({ success: true, data: mockKelly, error: null }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('UnifiedBettingInterface - Bet Slip and Arbitrage', () => {
  it('renders bet slip with mock bets and allows adding/removing', async () => {
    render(<UnifiedBettingInterface />);
    const addButtons = await screen.findAllByRole('button', { name: /Add to Bet Slip/i });
    expect(addButtons.length).toBeGreaterThan(0);
    fireEvent.click(addButtons[0]);
    expect(screen.getByTestId('bet-slip-container')).toBeInTheDocument();
    expect(screen.getByText(/Shohei Ohtani/)).toBeInTheDocument();
    // Remove bet
    const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
    fireEvent.click(removeButtons[0]);
    expect(screen.queryByText(/Shohei Ohtani/)).not.toBeInTheDocument();
  });

  it('calculates Kelly Criterion and displays expected value', async () => {
    render(<UnifiedBettingInterface />);
    // Simulate adding a bet
    const addButtons = await screen.findAllByRole('button', { name: /Add to Bet Slip/i });
    fireEvent.click(addButtons[0]);
    // Calculate Kelly
    const kellyButton = screen.getByRole('button', { name: /Calculate Kelly/i });
    fireEvent.click(kellyButton);
    await waitFor(() => {
      expect(screen.getByText(/Kelly Fraction: 0.18/)).toBeInTheDocument();
      expect(screen.getByText(/Expected Value: 42.5/)).toBeInTheDocument();
    });
  });

  it('renders arbitrage opportunities with mock data', async () => {
    render(<UnifiedBettingInterface />);
    const arbTab = screen.getByRole('tab', { name: /Arbitrage/i });
    fireEvent.click(arbTab);
    await waitFor(() => {
      expect(screen.getByText(/MLB Arbitrage Opportunity/)).toBeInTheDocument();
      expect(screen.getByText(/Profit: 120.5/)).toBeInTheDocument();
    });
  });

  it('shows error banner when API returns error', async () => {
    server.use(
      rest.get('/api/bets', (req: any, res: any, ctx: any) => {
        return res(
          ctx.json({
            success: false,
            data: null,
            error: { code: 'API_ERROR', message: 'Failed to fetch bets' },
          })
        );
      })
    );
    render(<UnifiedBettingInterface />);
    expect(await screen.findByTestId('error-banner')).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch bets/)).toBeInTheDocument();
  });
});
