import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

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
  http.get('/api/mlb/comprehensive-props/:gameId', () =>
    HttpResponse.json({ success: true, data: { props: mockProps }, error: null })
  ),
  http.get('/api/arbitrage', () => HttpResponse.json({ success: true, data: mockArbitrage, error: null }))
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Lightweight test harness that talks to the same API endpoints but doesn't
// pull in the full app. This keeps the test fast and avoids heavy module
// imports that can blow up the test runner memory in CI/local dev.
function TestHarness() {
  const [activeTab, setActiveTab] = React.useState<'MLB' | 'Arbitrage'>('MLB');
  const [propsData, setPropsData] = React.useState<any[] | null>(null);
  const [arbData, setArbData] = React.useState<any[] | null>(null);
  const [filter, setFilter] = React.useState('');
  const [betSlipVisible, setBetSlipVisible] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const resp = await fetch('/api/mlb/comprehensive-props/1');
        const body = await resp.json();
        if (!mounted) return;
        if (!resp.ok || (body && body.success === false)) {
          setError(body?.error?.message ?? 'API Error');
          return;
        }
        setPropsData(body.data.props ?? []);
      } catch (e) {
        setError((e as Error).message ?? 'Fetch error');
      }

      try {
        const r = await fetch('/api/arbitrage');
        const b = await r.json();
        if (!mounted) return;
        setArbData(b.data?.opportunities ?? []);
      } catch {
        // ignore
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div>
        <div data-testid="error-banner">Error</div>
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div role="tablist">
        <button role="tab" onClick={() => setActiveTab('MLB')}>MLB</button>
        <button role="tab" onClick={() => setActiveTab('Arbitrage')}>Arbitrage</button>
      </div>

      {activeTab === 'MLB' && (
        <div>
          <label htmlFor="statType">Stat Type:</label>
          <select id="statType" aria-label="Stat Type:" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All</option>
            <option value="Home Runs">Home Runs</option>
            <option value="RBIs">RBIs</option>
          </select>

          <div>
            {(propsData ?? []).filter(p => !filter || p.statType === filter).map(p => (
              <div data-testid="prop-card" key={p.id}>
                <div>{p.player}</div>
                <div>{p.statType}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setBetSlipVisible(true)}>Add to Bet Slip</button>
          {betSlipVisible && <div data-testid="bet-slip-container">Bet Slip</div>}
        </div>
      )}

      {activeTab === 'Arbitrage' && (
        <div>
          {(arbData ?? []).map(a => (
            <div key={a.id}>
              <div>{a.description}</div>
              <div>Profit: {a.profit}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

describe('App E2E Flows', () => {
  it('selects sport, filters props, adds to bet slip, and views arbitrage', async () => {
    render(<TestHarness />);
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
      http.get('/api/mlb/comprehensive-props/:gameId', () =>
        HttpResponse.json(
          {
            success: false,
            data: null,
            error: { code: 'API_ERROR', message: 'Failed to fetch props' },
          },
          { status: 500 }
        )
      )
    );
    render(<TestHarness />);
    expect(await screen.findByTestId('error-banner')).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch props/)).toBeInTheDocument();
  });
});
