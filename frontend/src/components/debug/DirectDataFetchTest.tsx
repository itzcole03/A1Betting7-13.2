/**
 * Direct PropOllama Data Fetching Test
 * This component bypasses all the complex hooks and data managers
 * to directly test the API endpoints that PropOllama should be using
 */

import React, { useEffect, useState } from 'react';

interface DirectTestResult {
  endpoint: string;
  method: string;
  success: boolean;
  dataCount: number;
  data?: any;
  error?: string;
  duration: number;
  timestamp: string;
}

const DirectDataFetchTest: React.FC = () => {
  const [results, setResults] = useState<DirectTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const tests = [
    {
      name: 'Backend Health Check',
      endpoint: 'http://localhost:8000/health',
      method: 'GET',
    },
    {
      name: 'V2 API Health Check',
      endpoint: 'http://localhost:8000/api/v2/health',
      method: 'GET',
    },
    {
      name: "Today's MLB Games",
      endpoint: 'http://localhost:8000/mlb/todays-games',
      method: 'GET',
    },
    {
      name: 'MLB Player Props (Direct)',
      endpoint: 'http://localhost:8000/mlb/odds-comparison/?market_type=playerprops&limit=10',
      method: 'GET',
    },
    {
      name: 'Sport Activation - MLB',
      endpoint: 'http://localhost:8000/api/sports/activate/MLB',
      method: 'POST',
    },
    {
      name: 'Frontend Health (via proxy)',
      endpoint: '/api/health',
      method: 'GET',
    },
  ];

  const runDirectTests = async () => {
    setIsRunning(true);
    setResults([]);

    console.log('[DirectDataFetchTest] Starting direct API tests...');

    for (const test of tests) {
      const startTime = Date.now();
      try {
        console.log(`[DirectDataFetchTest] Testing: ${test.name} - ${test.endpoint}`);

        const fetchOptions: RequestInit = {
          method: test.method,
          headers: {
            'Content-Type': 'application/json',
          },
        };

        const response = await fetch(test.endpoint, fetchOptions);
        const duration = Date.now() - startTime;

        let data;
        let dataCount = 0;

        try {
          data = await response.json();
          if (Array.isArray(data)) {
            dataCount = data.length;
          } else if (data && typeof data === 'object') {
            dataCount = Object.keys(data).length;
          }
        } catch (jsonError) {
          data = 'Response not JSON';
        }

        setResults(prev => [
          ...prev,
          {
            endpoint: test.endpoint,
            method: test.method,
            success: response.ok,
            dataCount,
            data: Array.isArray(data) ? `Array(${data.length})` : data,
            duration,
            timestamp: new Date().toISOString(),
          },
        ]);

        console.log(
          `[DirectDataFetchTest] ✅ ${test.name}: ${response.status} (${duration}ms)`,
          data
        );
      } catch (error) {
        const duration = Date.now() - startTime;
        setResults(prev => [
          ...prev,
          {
            endpoint: test.endpoint,
            method: test.method,
            success: false,
            dataCount: 0,
            error: error instanceof Error ? error.message : String(error),
            duration,
            timestamp: new Date().toISOString(),
          },
        ]);

        console.error(`[DirectDataFetchTest] ❌ ${test.name}:`, error);
      }
    }

    setIsRunning(false);
  };

  useEffect(() => {
    // Auto-run tests on component mount
    setTimeout(runDirectTests, 1000); // Small delay to let the component render
  }, []);

  return (
    <div className='direct-data-fetch-test bg-slate-900/50 p-6 rounded-lg border border-yellow-500'>
      <h2 className='text-xl font-bold text-yellow-400 mb-4'>🔍 Direct PropOllama API Tests</h2>

      <button
        onClick={runDirectTests}
        disabled={isRunning}
        className='bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white px-6 py-2 rounded font-medium mb-6'
      >
        {isRunning ? '🔄 Running Tests...' : '▶️ Run Direct API Tests'}
      </button>

      <div className='grid gap-4'>
        {results.map((result, index) => (
          <div
            key={index}
            className={`p-4 rounded border-l-4 ${
              result.success
                ? 'bg-green-900/20 border-green-500 text-green-100'
                : 'bg-red-900/20 border-red-500 text-red-100'
            }`}
          >
            <div className='flex items-center justify-between mb-2'>
              <span className='font-medium flex items-center gap-2'>
                {result.success ? '✅' : '❌'}
                <span className='text-sm opacity-75'>{result.method}</span>
              </span>
              <div className='text-xs opacity-75 flex gap-4'>
                <span>{result.duration}ms</span>
                <span>{result.timestamp.split('T')[1].split('.')[0]}</span>
              </div>
            </div>

            <div className='text-sm mb-2 font-mono break-all opacity-90'>{result.endpoint}</div>

            {result.success && result.dataCount > 0 && (
              <div className='text-xs bg-green-900/30 p-2 rounded mb-2'>
                📊 Data received: {result.dataCount} items
              </div>
            )}

            {result.error && (
              <div className='text-xs bg-red-900/30 p-2 rounded mb-2'>⚠️ Error: {result.error}</div>
            )}

            {result.data && typeof result.data === 'object' && (
              <details className='text-xs'>
                <summary className='cursor-pointer opacity-75 hover:opacity-100'>
                  View Response Data
                </summary>
                <pre className='bg-slate-800/50 p-2 rounded mt-2 overflow-x-auto'>
                  {JSON.stringify(result.data, null, 2).substring(0, 1000)}
                  {JSON.stringify(result.data).length > 1000 && '\n...truncated'}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {results.length === 0 && !isRunning && (
        <div className='text-gray-400 text-center py-8'>
          No tests run yet - click the button above to start
        </div>
      )}

      {isRunning && (
        <div className='text-yellow-400 text-center py-4 flex items-center justify-center gap-2'>
          <div className='animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full'></div>
          Running API tests...
        </div>
      )}
    </div>
  );
};

export default DirectDataFetchTest;
