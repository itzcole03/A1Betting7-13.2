import { useEffect, useState } from 'react';

interface EndpointResult {
  endpoint: string;
  status: number | null;
  success: boolean;
  sampleData: string;
  error?: string;
}

const DISCOVERED_ENDPOINTS = [
  '/api/health/all',
  '/api/health/status',
  '/api/prizepicks/props',
  '/api/prizepicks/comprehensive-projections',
  '/api/prizepicks/recommendations',
  '/api/betting-opportunities',
  '/api/active-bets',
  '/api/risk-profiles',
  '/api/ultra-accuracy/model-performance',
  '/api/v1/performance-stats',
  '/api/v1/predictions',
  '/api/analytics/events',
  '/api/logs',
  '/api/users',
  '/api/data-scraping',
  '/api/config',
  '/api/news',
  '/api/sentiment',
  '/api/live',
  '/api/opportunities',
  '/api/predictions/prizepicks',
  '/api/portfolio',
  '/api/performance',
  '/api/models',
  '/api/bets',
];

const BASE_URL = 'http://localhost:8000';

export default function AppMinimal() {
  const [results, setResults] = useState<EndpointResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, success: 0, failed: 0 });

  useEffect(() => {
    testAllEndpoints();
  }, []);

  const testAllEndpoints = async () => {
    console.log('🚀 FULL-STACK RESCUE BOT: Testing all API endpoints...');

    const endpointTests = DISCOVERED_ENDPOINTS.map(async (endpoint): Promise<EndpointResult> => {
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        let sampleData = 'No data';
        try {
          const data = await response.json();
          if (Array.isArray(data)) {
            sampleData = `Array[${data.length}] - ${data[0] ? Object.keys(data[0])[0] : 'empty'}`;
          } else if (typeof data === 'object' && data !== null) {
            const keys = Object.keys(data);
            sampleData = `Object{${keys.length}} - ${keys.slice(0, 3).join(', ')}`;
          } else {
            sampleData = String(data).substring(0, 50);
          }
        } catch {
          sampleData = `Status: ${response.status} - ${response.statusText}`;
        }

        return {
          endpoint,
          status: response.status,
          success: response.ok,
          sampleData,
        };
      } catch (error) {
        return {
          endpoint,
          status: null,
          success: false,
          sampleData: 'Connection failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    const allResults = await Promise.all(endpointTests);
    setResults(allResults);

    const successCount = allResults.filter(r => r.success).length;
    setSummary({
      total: allResults.length,
      success: successCount,
      failed: allResults.length - successCount,
    });

    setLoading(false);

    console.log(`✅ API Testing Complete: ${successCount}/${allResults.length} endpoints working`);
  };

  const getStatusColor = (result: EndpointResult) => {
    if (result.success) return '#22c55e'; // green
    if (result.status === 404) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  if (loading) {
    return (
      <div
        style={{
          padding: '40px',
          fontFamily: 'monospace',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: 'white',
          minHeight: '100vh',
        }}
      >
        <h1 style={{ color: '#06b6d4', fontSize: '2rem', marginBottom: '20px' }}>
          🚀 FULL-STACK RESCUE BOT
        </h1>
        <div style={{ fontSize: '1.2rem', color: '#94a3b8' }}>
          Testing {DISCOVERED_ENDPOINTS.length} API endpoints...
        </div>
        <div style={{ marginTop: '20px', color: '#fbbf24' }}>
          ⚡ Discovering live data sources...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '40px',
        fontFamily: 'monospace',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: 'white',
        minHeight: '100vh',
      }}
    >
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#06b6d4', fontSize: '2rem', marginBottom: '10px' }}>
          🚀 FULL-STACK RESCUE BOT
        </h1>
        <div
          style={{
            background: 'rgba(6, 182, 212, 0.1)',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid rgba(6, 182, 212, 0.3)',
          }}
        >
          <div style={{ fontSize: '1.1rem', marginBottom: '5px' }}>
            📊 API Endpoint Status: {summary.success}/{summary.total} Working
          </div>
          <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
            ✅ Success: {summary.success} | ❌ Failed: {summary.failed}
          </div>
        </div>
      </header>

      <div
        style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(30, 41, 59, 0.8)' }}>
              <th style={{ padding: '12px', textAlign: 'left', color: '#06b6d4' }}>Endpoint</th>
              <th style={{ padding: '12px', textAlign: 'center', color: '#06b6d4' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#06b6d4' }}>Sample Data</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr
                key={index}
                style={{
                  borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                  background: index % 2 === 0 ? 'rgba(15, 23, 42, 0.4)' : 'transparent',
                }}
              >
                <td
                  style={{
                    padding: '12px',
                    fontWeight: 'bold',
                    color: result.success ? '#22c55e' : '#ef4444',
                  }}
                >
                  {result.endpoint}
                </td>
                <td
                  style={{
                    padding: '12px',
                    textAlign: 'center',
                    color: getStatusColor(result),
                    fontWeight: 'bold',
                  }}
                >
                  {result.status || 'CONN_ERR'}
                </td>
                <td
                  style={{
                    padding: '12px',
                    color: '#94a3b8',
                    fontSize: '0.9rem',
                  }}
                >
                  {result.sampleData}
                  {result.error && (
                    <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>
                      Error: {result.error}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer
        style={{
          marginTop: '30px',
          padding: '20px',
          background: 'rgba(6, 182, 212, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(6, 182, 212, 0.3)',
        }}
      >
        <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
          🎯 <strong>Mission Status:</strong>{' '}
          {summary.success > 0 ? 'BACKEND SERVICES DETECTED' : 'NO SERVICES RESPONDING'}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '5px' }}>
          Base URL: {BASE_URL} | Tested: {new Date().toLocaleString()}
        </div>
      </footer>
    </div>
  );
}
