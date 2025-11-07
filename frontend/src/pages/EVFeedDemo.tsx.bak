import React, { useState } from 'react';

type EvResult = {
  id: string;
  probability: number;
  odds_decimal: number;
  stake: number;
  ev: number;
  ev_pct: number;
  is_plus_ev: boolean;
};

export default function EVFeedDemo() {
  const [results, setResults] = useState<EvResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const samplePayload = [
    { id: 'demo1', probability: 0.6, odds: 2.5, odds_format: 'decimal', stake: 1.0 },
    { id: 'demo2', probability: 0.2, odds: -150, odds_format: 'american', stake: 1.0 },
  ];

  const runFeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/ev/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(samplePayload),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const body = await resp.json();
      setResults(body.results as EvResult[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>EV Feed Demo</h2>
      <p>Click the button to POST a sample feed to <code>/api/ev/feed</code>.</p>
      <button onClick={runFeed} disabled={loading}>
        {loading ? 'Running...' : 'Run EV Feed'}
      </button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {results && (
        <table style={{ marginTop: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: 6 }}>ID</th>
              <th style={{ padding: 6 }}>Prob</th>
              <th style={{ padding: 6 }}>Odds</th>
              <th style={{ padding: 6 }}>EV</th>
              <th style={{ padding: 6 }}>EV %</th>
              <th style={{ padding: 6 }}>+EV</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.id}>
                <td style={{ padding: 6 }}>{r.id}</td>
                <td style={{ padding: 6 }}>{r.probability}</td>
                <td style={{ padding: 6 }}>{r.odds_decimal}</td>
                <td style={{ padding: 6 }}>{r.ev.toFixed(4)}</td>
                <td style={{ padding: 6 }}>{r.ev_pct.toFixed(2)}%</td>
                <td style={{ padding: 6 }}>{r.is_plus_ev ? '✅' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
