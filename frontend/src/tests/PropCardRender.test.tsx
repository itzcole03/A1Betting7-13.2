import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import PropOllamaContainer from '../components/containers/PropOllamaContainer';

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
  // ...add more for virtualization test
];

const server = setupServer(
  rest.get('/api/mlb/comprehensive-props/:gameId', (req: any, res: any, ctx: any) => {
    return res(ctx.json({ success: true, data: { props: mockProps }, error: null }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('PropOllamaContainer - Prop Card Rendering', () => {
  it('renders prop cards with mock data', async () => {
    render(<PropOllamaContainer />);
    const propCards = await screen.findAllByTestId('prop-card');
    expect(propCards.length).toBeGreaterThan(0);
    expect(screen.getByText(/Shohei Ohtani/)).toBeInTheDocument();
    expect(screen.getByText(/Aaron Judge/)).toBeInTheDocument();
  });

  it('expands and collapses prop card details', async () => {
    render(<PropOllamaContainer />);
    const propCards = await screen.findAllByTestId('prop-card');
    fireEvent.click(propCards[0]);
    await waitFor(() => {
      expect(screen.getByText(/Stat Type: Home Runs/)).toBeInTheDocument();
    });
    fireEvent.click(propCards[0]);
    await waitFor(() => {
      expect(screen.queryByText(/Stat Type: Home Runs/)).not.toBeInTheDocument();
    });
  });

  it('virtualizes prop list for large datasets', async () => {
    // Add 150 mock props for virtualization
    const largeMockProps = Array.from({ length: 150 }, (_, i) => ({
      id: `prop-${i + 1}`,
      player: `Player ${i + 1}`,
      statType: 'Hits',
      value: Math.random() * 5,
      sport: 'MLB',
      confidence: 0.8 + Math.random() * 0.2,
    }));
    server.use(
      rest.get('/api/mlb/comprehensive-props/:gameId', (req: any, res: any, ctx: any) => {
        return res(ctx.json({ success: true, data: { props: largeMockProps }, error: null }));
      })
    );
    render(<PropOllamaContainer />);
    // Only a subset should be rendered due to virtualization
    const propCards = await screen.findAllByTestId('prop-card');
    expect(propCards.length).toBeLessThan(50); // Virtualized
  });

  it('shows error banner when API returns error', async () => {
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
    render(<PropOllamaContainer />);
    expect(await screen.findByTestId('error-banner')).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch props/)).toBeInTheDocument();
  });
});
