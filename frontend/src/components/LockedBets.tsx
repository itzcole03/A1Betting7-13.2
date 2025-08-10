import React, { useState } from 'react';
import ErrorBoundary from './core/ErrorBoundary';
import { _showToast } from './Toast';
// Elite modules for analytics, optimization, and dashboards
// import ConsolidatedUniversalAnalytics from './analytics/ConsolidatedUniversalAnalytics'; // Not found
// import ConsolidatedUniversalDashboard from './dashboard/ConsolidatedUniversalDashboard'; // Not found

import { LockedBet } from './types/LockedBet';

// Example API endpoints for each sportsbook
const _API_ENDPOINTS: Record<string, string> = {
  PrizePicks: '/api/prizepicks/props', // Main PrizePicks locked bets endpoint
  FanDuel: '/api/fanduel/lockedbets', // Placeholder, implement when available
  // Add more sportsbooks as needed
};

const _PRIORITY_SPORTSBOOK = 'PrizePicks';

// ...existing code...

// ...existing code...

const LockedBets: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [bets, setBets] = useState<LockedBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSources, setFilterSources] = useState<string[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  // Track errors per sportsbook
  const [sourceErrors, setSourceErrors] = useState<Record<string, string>>({});
  // ...existing code...

  // Fetch locked bets from all enabled sources on mount or when filterSources changes
  React.useEffect(() => {
    const fetchBets = async () => {
      setLoading(true);
      setError(null);
      setSourceErrors({});
      let allBets: LockedBet[] = [];
      const errors: Record<string, string> = {};
      const sources = filterSources.length > 0 ? filterSources : Object.keys(_API_ENDPOINTS);
      await Promise.all(
        sources.map(async source => {
          try {
            const endpoint = _API_ENDPOINTS[source];
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`Failed to fetch from ${source}`);
            const data = await response.json();
            if (Array.isArray(data)) {
              allBets = allBets.concat(data.map((bet: any) => ({ ...bet, sportsbook: source })));
            }
          } catch (err: any) {
            errors[source] = err.message || 'Unknown error';
          }
        })
      );
      setBets(allBets);
      setSourceErrors(errors);
      if (Object.keys(errors).length > 0) {
        _showToast.error(
          'Some sources failed: ' +
            Object.entries(errors)
              .map(([src, msg]) => `${src}: ${msg}`)
              .join(', ')
        );
      }
      setLoading(false);
    };
    fetchBets();
  }, [filterSources]);

  // Filter bets by source and search text
  const filteredBets = bets.filter(bet => {
    const sportsbook = bet.sportsbook ?? '';
    const event = bet.event ?? '';
    const market = bet.market ?? '';
    const sourceMatch = filterSources.length === 0 || filterSources.includes(sportsbook);
    const searchMatch =
      searchText.trim() === '' ||
      event.toLowerCase().includes(searchText.toLowerCase()) ||
      market.toLowerCase().includes(searchText.toLowerCase());
    return sourceMatch && searchMatch;
  });

  return (
    <div className='locked-bets-root'>
      {/* Toast notifications handled globally by _Toaster */}
      <ErrorBoundary>
        <div style={{ padding: 24 }}>
          <h2>Locked Bets {isAdmin && <span style={{ color: '#a0e' }}>(Admin Mode)</span>}</h2>
          {/* Filters */}
          <div style={{ marginBottom: 16 }}>
            <input
              type='text'
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder='Search events or markets...'
              style={{ marginRight: 12, padding: 6 }}
            />
            <select
              value={filterSources[0] || ''}
              onChange={e => setFilterSources(e.target.value ? [e.target.value] : [])}
              style={{ padding: 6 }}
            >
              <option value=''>All Sportsbooks</option>
              {Object.keys(_API_ENDPOINTS).map(source => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
            {/* Admin toggle for demo */}
            <button
              style={{
                marginLeft: 16,
                padding: '6px 12px',
                background: isAdmin ? '#a0e' : '#eee',
                color: isAdmin ? '#fff' : '#333',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
              }}
              onClick={() => setIsAdmin(a => !a)}
            >
              {isAdmin ? 'Disable Admin' : 'Enable Admin'}
            </button>
          </div>
          {/* Per-source errors */}
          {Object.keys(sourceErrors).length > 0 && (
            <div style={{ color: 'orange', marginBottom: 12 }}>
              <strong>Source Errors:</strong>
              <ul>
                {Object.entries(sourceErrors).map(([src, msg]) => (
                  <li key={src}>
                    {src}: {msg}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Loading/Error UI */}
          {loading && <div>Loading locked bets...</div>}
          {error && <div style={{ color: 'red' }}>Error: {error}</div>}
          {/* Bets List */}
          {!loading && !error && (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {filteredBets.length === 0 ? (
                <li>No locked bets found.</li>
              ) : (
                filteredBets.map(bet => (
                  <li
                    key={bet.id}
                    style={{ marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 8 }}
                  >
                    <strong>{bet.event}</strong> ({bet.sportsbook})<br />
                    Market: {bet.market} | Odds: {bet.odds} | Prediction: {bet.prediction}
                    <br />
                    <span style={{ fontSize: 12, color: '#888' }}>Timestamp: {bet.timestamp}</span>
                    {isAdmin && (
                      <div style={{ marginTop: 6, fontSize: 12, color: '#a0e' }}>
                        <em>Admin Controls: [Edit] [Delete] [Audit]</em>
                      </div>
                    )}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default LockedBets;
