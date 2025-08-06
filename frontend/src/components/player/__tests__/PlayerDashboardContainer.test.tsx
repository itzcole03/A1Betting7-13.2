import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { rest, RestRequest } from 'msw';
import { setupServer } from 'msw/node';
import { PlayerDashboardContainer } from '../PlayerDashboardContainer';

const mockPlayer = {
  id: 'aaron-judge',
  name: 'Aaron Judge',
  team: 'NYY',
  position: 'RF',
  sport: 'MLB',
  active: true,
  injury_status: null,
  season_stats: {
    hits: 120,
    home_runs: 35,
    rbis: 90,
    batting_average: 0.285,
    on_base_percentage: 0.39,
    slugging_percentage: 0.54,
    ops: 0.93,
    strikeouts: 110,
    walks: 60,
    games_played: 102,
    plate_appearances: 420,
    at_bats: 380,
    runs: 80,
    doubles: 22,
    triples: 1,
    stolen_bases: 5,
    war: 4.2,
    babip: 0.31,
    wrc_plus: 145,
    barrel_rate: 15.2,
    hard_hit_rate: 48.1,
    exit_velocity: 92.5,
    launch_angle: 14.3,
  },
  recent_games: [
    {
      date: '2025-08-01',
      opponent: 'BOS',
      home: true,
      result: 'W',
      stats: { hits: 2, home_runs: 1, rbis: 3, batting_average: 0.333, ops: 1.2 },
      game_score: 8.5,
      weather: { temperature: 78, wind_speed: 10, wind_direction: 'NW' },
    },
  ],
  prop_history: [
    {
      date: '2025-08-01',
      prop_type: 'home_runs',
      line: 1.5,
      actual: 1.0,
      outcome: 'under',
      odds: -110,
      sportsbook: 'DraftKings',
    },
  ],
  performance_trends: {
    last_7_days: { avg: 0.32, hr: 3, rbis: 8 },
    last_30_days: { avg: 0.295, hr: 10, rbis: 25 },
    home_vs_away: { home: { avg: 0.31 }, away: { avg: 0.28 } },
    vs_lefties: { avg: 0.34 },
    vs_righties: { avg: 0.27 },
  },
};

const server = setupServer(
  rest.get('/api/v2/players/:playerId/dashboard', (req: RestRequest, res: any, ctx: any) => {
    // Correlation ID propagation test
    if (req.headers.get('X-Correlation-ID')) {
      return res(ctx.status(200), ctx.json(mockPlayer));
    }
    return res(ctx.status(200), ctx.json(mockPlayer));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('PlayerDashboardContainer', () => {
  it('shows PlayerOverview skeleton loader and accessibility attributes when loading', async () => {
    // Simulate slow API response
    server.use(
      rest.get(
        '/api/v2/players/:playerId/dashboard',
        async (req: RestRequest, res: any, ctx: any) => {
          await new Promise(r => setTimeout(r, 500));
          return res(ctx.status(200), ctx.json(mockPlayer));
        }
      )
    );
    render(<PlayerDashboardContainer playerId='aaron-judge' />);
    // The main content region should have aria-busy
    const region = screen.getByRole('region', { hidden: true });
    expect(region).toHaveAttribute('aria-busy', 'true');
    // PlayerOverview skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    // StatTrends skeleton
    expect(screen.getByLabelText('Performance Trends')).toHaveAttribute('aria-busy', 'true');
    // PropHistory skeleton
    expect(screen.getByLabelText('Prop History')).toHaveAttribute('aria-busy', 'true');
    // Wait for player data to load
    await waitFor(() => screen.getByText(/Aaron Judge/));
  });

  it('renders player data and dashboard sections after loading', async () => {
    render(<PlayerDashboardContainer playerId='aaron-judge' />);
    expect(await screen.findByText('Aaron Judge')).toBeInTheDocument();
    expect(screen.getByText('NYY • RF')).toBeInTheDocument();
    expect(screen.getByText('Games')).toBeInTheDocument();
    expect(screen.getByText('102')).toBeInTheDocument();
    expect(screen.getByText('Hits')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    // StatTrends and PropHistory sections
    expect(screen.getByText(/Performance Trends/i)).toBeInTheDocument();
    expect(screen.getByText(/Prop History/i)).toBeInTheDocument();
  });

  it('handles error state', async () => {
    server.use(
      rest.get('/api/v2/players/:playerId/dashboard', (req: RestRequest, res: any, ctx: any) => {
        return res(ctx.status(500), ctx.json({ detail: 'Internal server error' }));
      })
    );
    render(<PlayerDashboardContainer playerId='error-player' />);
    expect(await screen.findByText(/dashboard error/i)).toBeInTheDocument();
    expect(screen.getByText(/retry/i)).toBeInTheDocument();
  });

  it('handles empty state', async () => {
    server.use(
      rest.get('/api/v2/players/:playerId/dashboard', (req: RestRequest, res: any, ctx: any) => {
        return res(ctx.status(200), ctx.json({}));
      })
    );
    render(<PlayerDashboardContainer playerId='empty-player' />);
    expect(await screen.findByText(/welcome to player dashboard/i)).toBeInTheDocument();
  });

  it('propagates correlation ID header', async () => {
    let correlationIdSeen = false;
    server.use(
      rest.get('/api/v2/players/:playerId/dashboard', (req: RestRequest, res: any, ctx: any) => {
        if (req.headers.get('X-Correlation-ID')) correlationIdSeen = true;
        return res(ctx.status(200), ctx.json(mockPlayer));
      })
    );
    render(<PlayerDashboardContainer playerId='aaron-judge' />);
    await waitFor(() => screen.getByText('Aaron Judge'));
    expect(correlationIdSeen).toBe(true);
  });

  it('validates API response schema at boundary', async () => {
    render(<PlayerDashboardContainer playerId='aaron-judge' />);
    const playerName = await screen.findByText('Aaron Judge');
    expect(playerName).toBeInTheDocument();
    // Add more schema assertions as needed
  });
});

// Test coverage/limitations:
// - Uses MSW to mock backend API; does not hit real backend
// - Correlation ID propagation is checked at request boundary, not in backend logs
// - Schema compliance is checked by rendering, not by full type validation
// - E2E user flows (search, navigation) should be covered in Playwright/Cypress
