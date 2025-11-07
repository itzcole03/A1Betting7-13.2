import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../config/apiConfig';

interface TestResult {
  endpoint: string;
  success: boolean;
  data: any;
  error?: string;
  timestamp: string;
}

const DataFetchTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const testEndpoints = [
    `${API_BASE_URL}/health`,
    `${API_BASE_URL}/api/v2/health`,
    `${API_BASE_URL}/mlb/odds-comparison/?market_type=playerprops&limit=5`,
    `${API_BASE_URL}/api/health`,
  ];

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    console.log('[DataFetchTest] Starting API endpoint tests...');

    for (const endpoint of testEndpoints) {
      try {
        console.log(`[DataFetchTest] Testing endpoint: ${endpoint}`);

        const response = await fetch(endpoint);
        const data = await response.json();

        setResults(prev => [
          ...prev,
          {
            endpoint,
            success: response.ok,
            data: Array.isArray(data) ? `Array with ${data.length} items` : data,
            timestamp: new Date().toISOString(),
          },
        ]);

        console.log(`[DataFetchTest] ✅ Success: ${endpoint}`, data);
      } catch (error) {
        setResults(prev => [
          ...prev,
          {
            endpoint,
            success: false,
            data: null,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
          },
        ]);

        console.error(`[DataFetchTest] ❌ Error: ${endpoint}`, error);
      }
    }

    setIsRunning(false);
  };

  useEffect(() => {
    // Auto-run tests on component mount
    runTests();
  }, []);

  return (
    <div className='data-fetch-test bg-slate-800 p-6 rounded-lg border border-slate-600'>
      <h2 className='text-xl font-bold text-white mb-4'>Data Fetch Debugging</h2>

      <button
        onClick={runTests}
        disabled={isRunning}
        className='bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded mb-4'
      >
        {isRunning ? 'Running Tests...' : 'Run API Tests'}
      </button>

      <div className='space-y-4'>
        {results.map((result, index) => (
          <div
            key={index}
            className={`p-4 rounded border ${
              result.success ? 'bg-green-900/20 border-green-600' : 'bg-red-900/20 border-red-600'
            }`}
          >
            <div className='flex items-center justify-between mb-2'>
              <span className={`font-medium ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                {result.success ? '✅ Success' : '❌ Failed'}
              </span>
              <span className='text-xs text-gray-400'>{result.timestamp}</span>
            </div>

            <div className='text-sm text-gray-300 mb-2 break-all'>
              <strong>Endpoint:</strong> {result.endpoint}
            </div>

            {result.error && (
              <div className='text-sm text-red-300 mb-2'>
                <strong>Error:</strong> {result.error}
              </div>
            )}

            {result.data && (
              <div className='text-xs text-gray-400 bg-slate-900/50 p-2 rounded overflow-hidden'>
                <strong>Response:</strong> {JSON.stringify(result.data, null, 2).substring(0, 500)}
                {JSON.stringify(result.data).length > 500 && '...'}
              </div>
            )}
          </div>
        ))}
      </div>

      {results.length === 0 && !isRunning && (
        <div className='text-gray-400 text-center'>No tests run yet</div>
      )}
    </div>
  );
};

export default DataFetchTest;
