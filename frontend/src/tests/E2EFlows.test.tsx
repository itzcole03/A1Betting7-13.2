import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

const mockProps = [
  {
    id: 'prop-1',
    player: 'Shohei Ohtani',
    statType: 'Home Runs',
    value: 1.5,
    sport: 'MLB',
    confidence: 0.92,
  },
  {
    id: 'prop-2',
    player: 'Aaron Judge',
    statType: 'RBIs',
    value: 2.5,
    sport: 'MLB',
    confidence: 0.88,
  },
];
const mockArbitrage = {
  opportunities: [{ id: 'arb-1', description: 'MLB Arbitrage Opportunity', profit: 120.5 }],
};

const server = setupServer(
  rest.get('/api/mlb/comprehensive-props/:gameId', (req: any, res: any, ctx: any) => {
    return res(ctx.json({ success: true, data: { props: mockProps }, error: null }));
  }),
  rest.get('/api/arbitrage', (req: any, res: any, ctx: any) => {
    return res(ctx.json({ success: true, data: mockArbitrage, error: null }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App E2E Flows', () => {
  it('selects sport, filters props, adds to bet slip, and views arbitrage', async () => {
    render(<App />);
    // Select MLB tab
    const mlbTab = screen.getByRole('tab', { name: /MLB/i });
    fireEvent.click(mlbTab);
    // Filter props
    const statTypeSelect = screen.getByLabelText(/Stat Type:/i);
    fireEvent.change(statTypeSelect, { target: { value: 'Home Runs' } });
    // Wait for prop cards
    const propCards = await screen.findAllByTestId('prop-card');
    expect(propCards.length).toBeGreaterThan(0);
    // Add to bet slip
    const addButton = screen.getByRole('button', { name: /Add to Bet Slip/i });
    fireEvent.click(addButton);
    expect(screen.getByTestId('bet-slip-container')).toBeInTheDocument();
    // View arbitrage
    const arbTab = screen.getByRole('tab', { name: /Arbitrage/i });
    fireEvent.click(arbTab);
    await waitFor(() => {
      expect(screen.getByText(/MLB Arbitrage Opportunity/)).toBeInTheDocument();
      expect(screen.getByText(/Profit: 120.5/)).toBeInTheDocument();
    });
  });

  it('shows error and empty states when API returns error', async () => {
    server.use(
      rest.get('/api/mlb/comprehensive-props/:gameId', (req: any, res: any, ctx: any) => {
        return res(
          ctx.json({
            success: false,
            data: null,
            error: { code: 'API_ERROR', message: 'Failed to fetch props' },
          })
        );
      })
    );
    render(<App />);
    expect(await screen.findByTestId('error-banner')).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch props/)).toBeInTheDocument();
  });
});
