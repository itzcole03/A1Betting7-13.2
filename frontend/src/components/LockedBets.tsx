import React, { useEffect, useState } from 'react';
// Elite modules for analytics, optimization, and dashboards
import ConsolidatedUniversalMoneyMaker from './moneymaker/ConsolidatedUniversalMoneyMaker';
// import ConsolidatedUniversalAnalytics from './analytics/ConsolidatedUniversalAnalytics'; // Not found
// import ConsolidatedUniversalDashboard from './dashboard/ConsolidatedUniversalDashboard'; // Not found
import ArbitrageScanner from './features/arbitrage/ArbitrageScanner';
import Settings from './features/settings/Settings';
import UserProfile from './features/user/UserProfile';

// TypeScript model for a bet from any sportsbook
export interface LockedBet {
  id: string;
  sportsbook: string; // e.g., 'PrizePicks', 'FanDuel', etc.
  label: string; // Display label for the source
  event: string;
  market: string;
  odds: string;
  prediction: string;
  timestamp: string;
}

// Example API endpoints for each sportsbook
const API_ENDPOINTS: Record<string, string> = {
  PrizePicks: '/api/prizepicks/props', // Main PrizePicks locked bets endpoint
  FanDuel: '/api/fanduel/lockedbets', // Placeholder, implement when available
  // Add more sportsbooks as needed
};

const PRIORITY_SPORTSBOOK = 'PrizePicks';

// Simple toast notification component
const Toast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
  <div
    style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      background: '#333',
      color: '#fff',
      padding: '12px 24px',
      borderRadius: 8,
      zIndex: 9999,
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    }}
  >
    {message}
    <button
      onClick={onClose}
      style={{
        marginLeft: 16,
        background: 'transparent',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 'bold',
      }}
    >
      ×
    </button>
  </div>
);

const LockedBets: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [bets, setBets] = useState<LockedBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSources, setFilterSources] = useState<string[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  // Track errors per sportsbook
  const [sourceErrors, setSourceErrors] = useState<Record<string, string>>({});
  // Toast notification state
  const [toast, setToast] = useState<string | null>(null);

  // Robust error boundary as a class component
  interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    info?: { componentStack: string };
  }

  class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }
    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }
    componentDidCatch(error: Error, info: { componentStack: string }) {
      // Log error to console or external service
      console.error('ErrorBoundary caught:', error, info);
      this.setState({ error, info });
    }
    handleReset = () => {
      this.setState({ hasError: false, error: undefined, info: undefined });
    };
    render() {
      if (this.state.hasError) {
        return (
          <div style={{ color: 'red', marginBottom: 16 }}>
            <div>A rendering error occurred in a child component.</div>
            {this.state.error && <pre>{this.state.error.toString()}</pre>}
            {this.state.info && (
              <details style={{ whiteSpace: 'pre-wrap' }}>{this.state.info.componentStack}</details>
            )}
            <button onClick={this.handleReset} style={{ marginTop: 8 }}>
              Reset
            </button>
          </div>
        );
      }
      return this.props.children;
    }
  }

  // Fetch bets logic as a function for refresh
  const fetchBets = () => {
    let ignore = false;
    setLoading(true);
    setError(null);
    setSourceErrors({});

    Promise.all(
      Object.entries(API_ENDPOINTS).map(async ([sportsbook, url]) => {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`${sportsbook} API error`);
          const data: unknown = await res.json();
          // Manual validation for LockedBet shape
          if (!Array.isArray(data)) throw new Error(`${sportsbook} API returned invalid data`);
          const validBets: LockedBet[] = data
            .filter(
              bet =>
                bet &&
                typeof bet.id === 'string' &&
                typeof bet.event === 'string' &&
                typeof bet.market === 'string' &&
                typeof bet.odds === 'string' &&
                typeof bet.prediction === 'string' &&
                typeof bet.timestamp === 'string'
            )
            .map(bet => ({ ...bet, sportsbook, label: sportsbook }));
          return validBets;
        } catch (err) {
          setSourceErrors(prev => ({ ...prev, [sportsbook]: `${sportsbook} failed to load.` }));
          setToast(`${sportsbook} failed to load.`);
          return [];
        }
      })
    )
      .then(results => {
        if (!ignore) {
          const allBets = results.flat();
          const sorted = [
            ...allBets.filter(b => b.sportsbook === PRIORITY_SPORTSBOOK),
            ...allBets.filter(b => b.sportsbook !== PRIORITY_SPORTSBOOK),
          ];
          setBets(sorted);
          setLoading(false);
          setToast('Locked bets refreshed.');
        }
      })
      .catch(err => {
        if (!ignore) {
          setError('Failed to fetch locked bets.');
          setLoading(false);
          setToast('Failed to fetch locked bets.');
        }
      });
    return () => {
      ignore = true;
    };
  };

  useEffect(() => {
    fetchBets();
    const interval = setInterval(() => {
      fetchBets();
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
     
  }, []);

  if (loading)
    return (
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <div
          role='status'
          aria-live='polite'
          aria-label='Loading locked bets'
          style={{ display: 'inline-block', position: 'relative', width: 48, height: 48 }}
        >
          <svg
            width='48'
            height='48'
            viewBox='0 0 48 48'
            style={{ animation: 'spin 1s linear infinite' }}
          >
            <circle cx='24' cy='24' r='20' stroke='#ccc' strokeWidth='4' fill='none' />
            <path
              d='M44 24a20 20 0 0 1-20 20'
              stroke='#333'
              strokeWidth='4'
              fill='none'
              strokeLinecap='round'
            />
          </svg>
          <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          svg { display: block; margin: auto; }
        `}</style>
        </div>
        <div style={{ marginTop: 12 }}>Loading locked bets...</div>
      </div>
    );
  if (error) return <div>{error}</div>;

  // Advanced filtering logic
  const filteredBets = bets.filter(bet => {
    // Source filter
    if (filterSources.length > 0 && !filterSources.includes(bet.sportsbook)) return false;
    // Search filter
    if (searchText) {
      const text = searchText.toLowerCase();
      if (
        !bet.event.toLowerCase().includes(text) &&
        !bet.market.toLowerCase().includes(text) &&
        !bet.odds.toLowerCase().includes(text)
      ) {
        return false;
      }
    }
    return true;
  });

  // Summary: bet counts per sportsbook
  const betCounts: Record<string, number> = {};
  bets.forEach(bet => {
    betCounts[bet.sportsbook] = (betCounts[bet.sportsbook] || 0) + 1;
  });

  return (
    <div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <h2>Locked Bets (PropOllama)</h2>
      {/* Refresh button */}
      <button onClick={fetchBets} style={{ marginBottom: 16 }}>
        Refresh
      </button>
      {/* Summary section */}
      <div style={{ marginBottom: 16 }}>
        <strong>Bet Summary:</strong>
        <ul>
          {Object.keys(API_ENDPOINTS).map(source => (
            <li key={source}>
              {source}: {betCounts[source] || 0} bets
            </li>
          ))}
        </ul>
      </div>
      {/* Admin mode toggle */}
      <div style={{ marginBottom: 16 }}>
        <label htmlFor='admin-toggle'>Admin Mode:</label>
        <input
          id='admin-toggle'
          type='checkbox'
          checked={isAdmin}
          onChange={e => setIsAdmin(e.target.checked)}
        />
      </div>
      {/* Advanced filtering controls */}
      <div style={{ marginBottom: 16 }}>
        <label htmlFor='source-filter'>Sources:</label>
        <select
          id='source-filter'
          multiple
          value={filterSources}
          onChange={e => {
            const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
            setFilterSources(options);
          }}
          style={{ minWidth: 120, height: 60 }}
        >
          {Object.keys(API_ENDPOINTS).map(source => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
        <button onClick={() => setFilterSources([])} style={{ marginLeft: 8 }}>
          Clear
        </button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label htmlFor='search-bets'>Search:</label>
        <input
          id='search-bets'
          type='text'
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          placeholder='Search event, market, odds...'
          style={{ marginLeft: 8, minWidth: 200 }}
        />
        <button onClick={() => setSearchText('')} style={{ marginLeft: 8 }}>
          Clear
        </button>
      </div>
      {/* Error messages for each source */}
      {Object.values(sourceErrors).length > 0 && (
        <div style={{ color: 'red', marginBottom: 16 }}>
          {Object.values(sourceErrors).map((msg, idx) => (
            <div key={idx}>{msg}</div>
          ))}
        </div>
      )}
      {/* Bets list or empty message */}
      {filteredBets.length === 0 ? (
        <div>No locked bets available.</div>
      ) : (
        <ul>
          {filteredBets.map(bet => (
            <li key={bet.id}>
              <strong>{bet.event}</strong> ({bet.market})<br />
              Odds: {bet.odds} | Prediction: {bet.prediction}
              <br />
              <span style={{ color: bet.sportsbook === PRIORITY_SPORTSBOOK ? 'green' : 'gray' }}>
                Source: {bet.label}
              </span>
              <br />
              <small>{new Date(bet.timestamp).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
      {/* Modular analytics and optimization, wrapped in error boundary */}
      <div style={{ marginTop: 32 }}>
        <ErrorBoundary>
          <ConsolidatedUniversalMoneyMaker />
          {/* <ConsolidatedUniversalAnalytics /> */}
          {/* <ConsolidatedUniversalDashboard /> */}
          <ArbitrageScanner />
          {isAdmin && <Settings />}
          {isAdmin && <UserProfile />}
        </ErrorBoundary>
      </div>
    </div>
  );
};
